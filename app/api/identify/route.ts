import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { getFingerprintsDb } from "@/lib/fingerprints-db";
import { prisma } from "@/lib/prisma";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MatchCandidate {
  songId: number;
  songKey: string;
  peakCount: number;
  totalMatches: number;
  alignmentRatio: number;
  confidence: number;
  timeOffset: number;
  song?: {
    id: string;
    slug?: string;
    title: string;
    titleEn?: string;
    artist: string;
    artistEn?: string;
    coverArt?: string;
    links?: Record<
      string | number,
      { url: string; size: string; bytes: number }
    > | null;
    uri?: string;
    duration?: number;
  };
}

async function extractSampleFingerprints(
  audioBuffer: Buffer,
  extension = "wav"
): Promise<[number, number][]> {
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(
    tempDir,
    `sample_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.${extension}`
  );

  await fs.promises.writeFile(tempFilePath, audioBuffer);

  try {
    const pythonScriptPath = path.join(
      process.cwd(),
      "scripts",
      "dejavu_fingerprint.py"
    );
    const pythonCmd = process.env.PYTHON_PATH || "python";

    // 15-second sample window provides great match coverage in <300ms
    const { stdout } = await execFileAsync(
      pythonCmd,
      [pythonScriptPath, tempFilePath, "--duration", "15"],
      {
        maxBuffer: 20 * 1024 * 1024,
      }
    );

    const fingerprints = JSON.parse(stdout);
    return fingerprints;
  } finally {
    try {
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath);
      }
    } catch {
      // Ignore cleanup error
    }
  }
}
export async function POST(request: Request) {
  try {
    let audioBuffer: Buffer | null = null;
    let extension = "wav";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      let file = formData.get("file") || formData.get("audio");
      if (!file) {
        for (const value of formData.values()) {
          if (value instanceof Blob) {
            file = value;
            break;
          }
        }
      }

      if (file && file instanceof Blob) {
        const arrayBuffer = await file.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);

        const filename = (file as unknown as { name?: string }).name || "";
        const detectedExt = path
          .extname(filename)
          .toLowerCase()
          .replace(/^\./, "");

        if (detectedExt) {
          extension = detectedExt;
        } else if (file.type.includes("mp3") || file.type.includes("mpeg")) {
          extension = "mp3";
        } else if (file.type.includes("ogg")) {
          extension = "ogg";
        } else if (file.type.includes("wav")) {
          extension = "wav";
        } else if (file.type.includes("m4a") || file.type.includes("mp4")) {
          extension = "m4a";
        } else if (file.type.includes("webm")) {
          extension = "webm";
        } else if (file.type.includes("flac")) {
          extension = "flac";
        }
      }
    } else {
      const arrayBuffer = await request.arrayBuffer();
      if (arrayBuffer.byteLength > 0) {
        audioBuffer = Buffer.from(arrayBuffer);
      }
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return NextResponse.json(
        { success: false, message: "No audio data provided" },
        { status: 400 }
      );
    }

    // 1. Extract fingerprints from sample audio (capped at 15s)
    const sampleFingerprints = await extractSampleFingerprints(
      audioBuffer,
      extension
    );

    if (!sampleFingerprints || sampleFingerprints.length < 5) {
      return NextResponse.json({
        success: true,
        match: false,
        message:
          "Audio is too short, silent, or no distinct acoustic features were detected.",
        confidence: 0,
        candidates: [],
      });
    }

    // 2. Map sample integer hashes to offsets
    const sampleHashMap = new Map<number, number[]>();
    for (const [hash, offset] of sampleFingerprints) {
      const list = sampleHashMap.get(hash);
      if (!list) {
        sampleHashMap.set(hash, [offset]);
      } else {
        list.push(offset);
      }
    }

    const uniqueHashes = Array.from(sampleHashMap.keys());

    // 3. Query SQLite for matching hashes in batches
    const db = getFingerprintsDb();

    // Map: internalSongId -> Map(offsetDifference -> count)
    const songDiffHistograms = new Map<number, Map<number, number>>();
    const songTotalMatches = new Map<number, number>();

    const BATCH_SIZE = 500;
    for (let i = 0; i < uniqueHashes.length; i += BATCH_SIZE) {
      const batch = uniqueHashes.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map(() => "?").join(",");
      const stmt = db.prepare(
        `SELECT hash, song_id, offset FROM fingerprints WHERE hash IN (${placeholders})`
      );
      const rows = stmt.all(...batch) as {
        hash: number;
        song_id: number;
        offset: number;
      }[];

      for (const row of rows) {
        const sampleOffsets = sampleHashMap.get(row.hash);
        if (!sampleOffsets) continue;

        let diffHistogram = songDiffHistograms.get(row.song_id);
        if (!diffHistogram) {
          diffHistogram = new Map<number, number>();
          songDiffHistograms.set(row.song_id, diffHistogram);
        }

        const prevTotal = songTotalMatches.get(row.song_id) || 0;
        songTotalMatches.set(row.song_id, prevTotal + 1);

        for (const sOffset of sampleOffsets) {
          const diff = row.offset - sOffset;
          const count = diffHistogram.get(diff) || 0;
          diffHistogram.set(diff, count + 1);
        }
      }
    }

    if (songDiffHistograms.size === 0) {
      return NextResponse.json({
        success: true,
        match: false,
        message: "No matching song found in the database.",
        confidence: 0,
        candidates: [],
      });
    }

    // 4. Score each matching song based on time-offset histogram peaks
    const candidateList: MatchCandidate[] = [];

    for (const [songId, histogram] of songDiffHistograms.entries()) {
      let maxPeakCount = 0;
      let dominantDiff = 0;

      for (const [diff, count] of histogram.entries()) {
        if (count > maxPeakCount) {
          maxPeakCount = count;
          dominantDiff = diff;
        }
      }

      const totalMatches = songTotalMatches.get(songId) || maxPeakCount;
      const alignmentRatio = totalMatches > 0 ? maxPeakCount / totalMatches : 0;

      // Confidence formula:
      // In Shazam, a true match has many peaks aligning at the EXACT same relative offset difference.
      // - 10+ aligned peaks gives up to 50%
      // - An alignment ratio above 25% gives up to 50%
      const peakScore = Math.min(maxPeakCount / 10, 1.0) * 50;
      const ratioScore = Math.min(alignmentRatio / 0.25, 1.0) * 50;
      const confidence = Math.min(100, Math.round(peakScore + ratioScore));

      candidateList.push({
        songId,
        songKey: "",
        peakCount: maxPeakCount,
        totalMatches,
        alignmentRatio: Math.round(alignmentRatio * 100) / 100,
        confidence,
        timeOffset: dominantDiff,
      });
    }

    // Sort candidates descending by confidence and peak count
    candidateList.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.peakCount - a.peakCount;
    });

    // Populate song details from DB using internal integer id
    const songStmt = db.prepare("SELECT * FROM songs WHERE id = ?");

    // only first 20 candidates
    const topCandidates = candidateList.slice(0, 20);

    for (const cand of topCandidates) {
      const songRow = songStmt.get(cand.songId) as unknown as {
        song_key: string;
        slug: string;
        title: string;
        title_en: string;
        artist: string;
        artist_en: string;
        cover_art?: string;
        uri?: string;
        duration?: number;
      };
      if (songRow) {
        const findSong = await prisma.song.findUnique({
          where: {
            id: songRow.song_key,
          },
          select: {
            links: true,
          },
        });

        cand.songKey = songRow.song_key;
        cand.song = {
          id: songRow.song_key,
          slug: songRow.slug,
          title: songRow.title,
          titleEn: songRow.title_en,
          artist: songRow.artist,
          artistEn: songRow.artist_en,
          links:
            (findSong?.links as Record<
              string | number,
              { url: string; size: string; bytes: number }
            > | null) ?? null,
          coverArt: songRow.cover_art,
          uri: songRow.uri,
          duration: songRow.duration,
        };
      }
    }

    const bestCandidate = candidateList[0];

    // If at least 3 aligned peaks or >= 20% confidence, it is considered a valid match!
    const isMatch = !!(
      bestCandidate &&
      (bestCandidate.peakCount >= 3 || bestCandidate.confidence >= 20)
    );

    return NextResponse.json({
      success: true,
      match: isMatch,
      confidence: bestCandidate ? bestCandidate.confidence : 0,
      song: bestCandidate ? bestCandidate.song : null,
      stats: bestCandidate
        ? {
            matchedPeaks: bestCandidate.peakCount,
            totalMatches: bestCandidate.totalMatches,
            alignmentRatio: bestCandidate.alignmentRatio,
          }
        : null,
      candidates: candidateList
        .filter((c) => c.peakCount >= 2)
        .slice(0, 5)
        .map((c) => ({
          song: c.song,
          confidence: c.confidence,
          matchedPeaks: c.peakCount,
        })),
    });
  } catch (error) {
    console.error("Error in /api/identify:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to identify audio",
        error: (error as Error).message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = getFingerprintsDb();
    const countSongs =
      (
        db.prepare("SELECT COUNT(*) as count FROM songs").get() as unknown as {
          count: number;
        }
      )?.count || 0;
    const countFps =
      (
        db
          .prepare("SELECT COUNT(*) as count FROM fingerprints")
          .get() as unknown as { count: number }
      )?.count || 0;

    return NextResponse.json({
      success: true,
      message: "Dejavu Fingerprint Recognition Service is active",
      stats: {
        totalSongsIndexed: countSongs,
        totalFingerprints: countFps,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
