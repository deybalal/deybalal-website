import fs from "fs";
import path from "path";
import os from "os";
import { stat, mkdir } from "fs/promises";
import { exec, execFile } from "child_process";
import { promisify } from "util";
import { parseFile } from "music-metadata";
import { prisma } from "@/lib/prisma";
import { applyWatermark } from "@/lib/image-utils";
import { getFingerprintsDb } from "@/lib/fingerprints-db";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// ==========================================
// Configuration & Target Paths
// ==========================================
export const LORI2_BASE_DIR = process.env.LORI2_BASE_DIR || "H:\\Temp\\Lori2";
export const TARGET_MP3_DIR = path.join(
  LORI2_BASE_DIR,
  "public",
  "assets",
  "mp3",
);
export const TARGET_OGG_DIR = path.join(
  LORI2_BASE_DIR,
  "public",
  "assets",
  "ogg",
);
export const TARGET_COVER_DIR = path.join(
  LORI2_BASE_DIR,
  "public",
  "assets",
  "cover",
);

// ==========================================
// Helper Functions from scripts/merge.ts
// ==========================================
function getFingerprintDbPath(): string {
  if (process.env.FINGERPRINTS_DB_PATH) return process.env.FINGERPRINTS_DB_PATH;
  const candidates = [
    path.join(process.cwd(), "data", "fingerprints.db"),
    path.join(process.cwd(), "data", "fingerprint.db"),
    path.join(process.cwd(), "fingerprints.db"),
    path.join(process.cwd(), "fingerprint.db"),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return path.join(process.cwd(), "data", "fingerprints.db");
}

function splitArtistNames(raw: string): string[] {
  if (!raw) return [];
  const cleaned = raw
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return [];

  const parts = cleaned
    .split(/\s+و\s+|\s+(?:and|&|feat\.?|ft\.?)\s+|[\s]*[,،/]+[\s]*/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return parts.length > 0 ? parts : [cleaned];
}

function removeArtistFromTitle(
  title: string,
  artistNames: (string | null | undefined)[],
): string {
  if (!title) return "";
  let cleaned = title;

  const namesToRemove = new Set<string>();
  for (const rawName of artistNames) {
    if (!rawName) continue;
    const trimmed = rawName.trim();
    if (trimmed.length < 2) continue;
    namesToRemove.add(trimmed);

    const parts = splitArtistNames(trimmed);
    for (const part of parts) {
      const p = part.trim();
      if (p.length >= 2) {
        namesToRemove.add(p);
      }
    }
  }

  const sortedNames = Array.from(namesToRemove).sort(
    (a, b) => b.length - a.length,
  );

  for (const name of sortedNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern =
      "(?<![\\p{L}\\p{N}])" +
      escaped.replace(
        /[\s\-_.]+/g,
        "[\\s\\-_.\\u200B-\\u200D\\uFEFF\\u00A0]+",
      ) +
      "(?![\\p{L}\\p{N}])";
    const regex = new RegExp(pattern, "giu");
    cleaned = cleaned.replace(regex, " ");
  }

  cleaned = cleaned
    .replace(/\(\s*\)/g, " ")
    .replace(/\[\s*\]/g, " ")
    .replace(/\{\s*\}/g, " ")
    .replace(/\s+(?:از|by)\s*$/giu, "")
    .replace(/^\s*(?:از|by)\s+/giu, "")
    .replace(/[\s\u200B-\u200D\uFEFF\u00A0]+/g, " ")
    .trim()
    .replace(/^[\s\-_–—:|\/\\.,;]+|[\s\-_–—:|\/\\.,;]+$/g, "");

  return cleaned;
}

function slugify(text: string): string {
  if (!text) return "Untitled";
  const clean = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  const capitalized = clean
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");

  return capitalized || "Untitled";
}

function formatArtistEnFolder(text: string): string {
  if (!text) return "Unknown-Artist";
  const cleaned = text
    .toString()
    .trim()
    .replace(/[^\w\s\u0600-\u06FF-]/g, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("-");
  return cleaned || "Unknown-Artist";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

function resolveArtistDiskImage(
  artistImage: string | null | undefined,
): string | null {
  if (!artistImage) return null;
  const clean = artistImage.replace(/^\/+/, "");
  const candidates = [
    path.join(LORI2_BASE_DIR, "public", clean),
    path.join(LORI2_BASE_DIR, clean),
    path.join(process.cwd(), "public", clean),
    path.join(process.cwd(), clean),
    path.join(
      LORI2_BASE_DIR,
      "public",
      "assets",
      "profile",
      path.basename(clean),
    ),
    path.join(
      LORI2_BASE_DIR,
      "public",
      "assets",
      "cover",
      path.basename(clean),
    ),
    path.join(
      process.cwd(),
      "public",
      "assets",
      "profile",
      path.basename(clean),
    ),
    path.join(process.cwd(), "public", "assets", "cover", path.basename(clean)),
  ];

  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

async function runFingerprintPython(
  filePath: string,
): Promise<[number, number][]> {
  const pythonScriptPath = path.join(
    process.cwd(),
    "scripts",
    "dejavu_fingerprint.py",
  );
  const pythonCmd = "python";

  const { stdout } = await execFileAsync(
    pythonCmd,
    [pythonScriptPath, filePath],
    {
      maxBuffer: 50 * 1024 * 1024,
    },
  );

  return JSON.parse(stdout);
}

/**
 * Searches for the existing song audio file on disk.
 */
function findSourceAudioFile(song: {
  id: string;
  slug: string;
  uri?: string | null;
  filename?: string | null;
  links?: any;
}): string | null {
  const candidatePaths: string[] = [];
  // 1. From links (prefer 320 -> 128 -> 64)
  if (song.links && typeof song.links === "object") {
    const linksObj = song.links as Record<string, { url?: string }>;
    if (linksObj["320"]?.url) candidatePaths.push(linksObj["320"].url);
    if (linksObj["128"]?.url) candidatePaths.push(linksObj["128"].url);
    if (linksObj["64"]?.url) candidatePaths.push(linksObj["64"].url);
  }

  // 2. From uri
  if (song.uri) {
    candidatePaths.push(song.uri);
  }

  // 3. From filename
  if (song.filename) {
    candidatePaths.push(song.filename);
  }

  // 4. From SQLite DB file_path if already indexed
  try {
    const dbPath = getFingerprintDbPath();
    const db = getFingerprintsDb(dbPath);
    const row = db
      .prepare(
        "SELECT file_path FROM songs WHERE song_key = ? OR slug = ? LIMIT 1",
      )
      .get(song.id, song.slug) as { file_path?: string } | undefined;
    if (row?.file_path) {
      candidatePaths.push(row.file_path);
    }
  } catch {
    // Ignore SQLite errors
  }

  // 5. By slug patterns
  candidatePaths.push(`${song.slug}-320.mp3`);
  candidatePaths.push(`${song.slug}-128.mp3`);
  candidatePaths.push(`${song.slug}.mp3`);

  for (const raw of candidatePaths) {
    if (!raw) continue;
    // If already absolute path and exists
    if (path.isAbsolute(raw) && fs.existsSync(raw)) {
      return raw;
    }

    const cleanWithAssets = raw.replace(/^\/+/, "");
    const cleanWithoutAssets = cleanWithAssets.replace(/^assets\/mp3\//, "");

    const candidates = [
      // Check in Lori2
      path.join(LORI2_BASE_DIR, "public", cleanWithAssets),
      path.join(LORI2_BASE_DIR, cleanWithAssets),
      path.join(TARGET_MP3_DIR, cleanWithoutAssets),
      path.join(TARGET_MP3_DIR, path.basename(raw)),
      path.join(LORI2_BASE_DIR, path.basename(raw)),

      // Check in cwd
      path.join(process.cwd(), "public", cleanWithAssets),
      path.join(process.cwd(), cleanWithAssets),
      path.join(process.cwd(), "public", "assets", "mp3", cleanWithoutAssets),
      path.join(process.cwd(), "public", "assets", "mp3", path.basename(raw)),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        return cand;
      }
    }
  }

  // Deep search in TARGET_MP3_DIR subfolders for ${song.slug}-*.mp3
  try {
    if (fs.existsSync(TARGET_MP3_DIR)) {
      const dirs = fs.readdirSync(TARGET_MP3_DIR, { withFileTypes: true });
      for (const d of dirs) {
        if (d.isDirectory()) {
          const dirPath = path.join(TARGET_MP3_DIR, d.name);
          const cands = [
            path.join(dirPath, `${song.slug}-320.mp3`),
            path.join(dirPath, `${song.slug}-128.mp3`),
            path.join(dirPath, `${song.slug}-64.mp3`),
            path.join(dirPath, `${song.slug}.mp3`),
          ];
          for (const c of cands) {
            if (fs.existsSync(c)) return c;
          }
        }
      }
    }
  } catch {
    // Ignore deep search error
  }

  return null;
}

// ==========================================
// Main Regeneration Service
// ==========================================
export async function regenerateSong(songId: string) {
  // 1. Fetch song and related artists
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: {
      artists: {
        select: { id: true, name: true, nameEn: true, image: true },
      },
    },
  });

  if (!song) {
    throw new Error("آهنگ پیدا نشد!");
  }

  // 2. Ensure target directories exist in LORI2_BASE_DIR
  await mkdir(LORI2_BASE_DIR, { recursive: true });
  await mkdir(TARGET_MP3_DIR, { recursive: true });
  await mkdir(TARGET_OGG_DIR, { recursive: true });
  await mkdir(TARGET_COVER_DIR, { recursive: true });

  // 3. Find source audio file
  const sourceAudioPath = findSourceAudioFile(song);
  if (!sourceAudioPath || !fs.existsSync(sourceAudioPath)) {
    throw new Error(
      `فایل صوتی منبع برای آهنگ "${song.title}" در مسیر "${LORI2_BASE_DIR}" یافت نشد!`,
    );
  }

  // 4. Resolve artist relations & names
  let matchedArtists = song.artists;
  if (matchedArtists.length === 0 && song.artist) {
    const splitNames = splitArtistNames(song.artist);
    const foundArtists = await prisma.artist.findMany({
      where: {
        name: { in: splitNames },
      },
      select: { id: true, name: true, nameEn: true, image: true },
    });
    if (foundArtists.length > 0) {
      matchedArtists = foundArtists;
    }
  }

  const primaryArtist = matchedArtists[0];

  const displayArtistName =
    song.artist?.trim() ||
    (matchedArtists.length > 0
      ? matchedArtists.map((a) => a.name).join(" و ")
      : "ناشناس");

  const displayArtistEn =
    song.artistEn?.trim() ||
    (matchedArtists.length > 0 && matchedArtists.every((a) => Boolean(a.nameEn))
      ? matchedArtists.map((a) => a.nameEn).join(" و ")
      : primaryArtist?.nameEn || "Unknown-Artist");

  // 5. Folder & Slug
  const artistEnName =
    primaryArtist?.nameEn || song.artistEn || song.artist || "Unknown-Artist";

  let artistFolder = formatArtistEnFolder(artistEnName);
  if (!artistFolder || artistFolder === "-" || artistFolder.length === 0) {
    artistFolder =
      slugify(displayArtistEn || displayArtistName) || "Unknown-Artist";
  }

  const targetArtistMp3Dir = path.join(TARGET_MP3_DIR, artistFolder);
  await mkdir(targetArtistMp3Dir, { recursive: true });

  const allKnownArtistNames = [
    song.artist,
    song.artistEn,
    ...matchedArtists.map((a) => a.name),
    ...matchedArtists.map((a) => a.nameEn),
  ];

  const cleanedTitleEn = song.titleEn
    ? removeArtistFromTitle(song.titleEn, allKnownArtistNames)
    : "";
  const cleanedTitle = removeArtistFromTitle(song.title, allKnownArtistNames);

  const artistPart = slugify(
    matchedArtists.length > 1
      ? matchedArtists.map((a) => a.nameEn || a.name).join(" ")
      : artistEnName,
  );
  const titlePart = slugify(
    cleanedTitleEn || cleanedTitle || song.titleEn || song.title || "Untitled",
  );
  const baseSlug = `${artistPart}-${titlePart}`;

  // Find unique slug (excluding self)
  let uniqueSlug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.song.findFirst({
      where: {
        slug: uniqueSlug,
        id: { not: song.id },
      },
      select: { id: true },
    });
    if (!existing) break;
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  // 6. Target Filenames & Paths
  const filename64 = `${uniqueSlug}-64.mp3`;
  const filename128 = `${uniqueSlug}-128.mp3`;
  const filename320 = `${uniqueSlug}-320.mp3`;
  const filenameCover = `${uniqueSlug}.jpg`;

  const path64 = path.join(targetArtistMp3Dir, filename64);
  const path128 = path.join(targetArtistMp3Dir, filename128);
  const path320 = path.join(targetArtistMp3Dir, filename320);
  const pathCover = path.join(TARGET_COVER_DIR, filenameCover);

  // 7. Generate Watermarked Cover Art
  let finalCoverArtRel = song.coverArt || "/images/cover.png";
  let diskArtistImg: string | null = null;

  for (const art of matchedArtists) {
    if (art.image) {
      const cand = resolveArtistDiskImage(art.image);
      if (cand) {
        diskArtistImg = cand;
        break;
      }
    }
  }

  if (!diskArtistImg && song.artist) {
    const dbArtist = await prisma.artist.findFirst({
      where: {
        OR: [{ name: song.artist }, { nameEn: song.artistEn || "" }],
      },
      select: { image: true },
    });
    if (dbArtist?.image) {
      diskArtistImg = resolveArtistDiskImage(dbArtist.image);
    }
  }

  if (!diskArtistImg && song.coverArt) {
    const cand = resolveArtistDiskImage(song.coverArt);
    if (cand) diskArtistImg = cand;
  }

  if (!diskArtistImg) {
    const defaultCand = [
      path.join(process.cwd(), "public", "images", "cover.png"),
      path.join(LORI2_BASE_DIR, "public", "images", "cover.png"),
    ];
    for (const d of defaultCand) {
      if (fs.existsSync(d)) {
        diskArtistImg = d;
        break;
      }
    }
  }

  if (diskArtistImg) {
    console.log(
      `[Regenerate] Generating watermarked cover: ${diskArtistImg} -> ${pathCover}`,
    );
    try {
      const wmSuccess = await applyWatermark(
        diskArtistImg,
        pathCover,
        displayArtistName,
        song.title,
      );
      if (wmSuccess) {
        finalCoverArtRel = `/assets/cover/${filenameCover}`;

        // Also sync to process.cwd() public/assets/cover if separate
        const localCover = path.join(
          process.cwd(),
          "public",
          "assets",
          "cover",
          filenameCover,
        );
        if (path.resolve(pathCover) !== path.resolve(localCover)) {
          try {
            await mkdir(path.dirname(localCover), { recursive: true });
            await fs.promises.copyFile(pathCover, localCover);
          } catch {
            // Non-critical local sync
          }
        }
      }
    } catch (wmErr: any) {
      console.warn(
        `[Regenerate] Watermark generation failed: ${wmErr.message}`,
      );
    }
  }

  // 8. Copy source audio to temp file to protect against in-place overwriting
  const tempSourcePath = path.join(
    os.tmpdir(),
    `regen_${Date.now()}_${path.basename(sourceAudioPath)}`,
  );
  await fs.promises.copyFile(sourceAudioPath, tempSourcePath);

  try {
    // 9. FFmpeg MP3 Encoding (64, 128, 320 kbps) with ID3 tags & embedded cover
    const metadataArgs = [
      `-metadata title="${(song.title || "بدون عنوان").replace(/"/g, '\\"')}"`,
      `-metadata comment="${"https://deybalal.ir"}"`,
      `-metadata artist="${displayArtistName.replace(/"/g, '\\"')}"`,
      `-metadata album_artist="${displayArtistName.replace(/"/g, '\\"')}"`,
      `-metadata date="${new Date().getFullYear()}"`,
    ]
      .filter(Boolean)
      .join(" ");

    const hasCover = fs.existsSync(pathCover);
    const coverArgs = hasCover
      ? `-i "${pathCover}" -map 0:a -map 1:v -c:v copy -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)"`
      : "-map 0:a";

    console.log(
      `[Regenerate] Encoding MP3 variants for song ${song.id} (${uniqueSlug})...`,
    );

    await execAsync(
      `ffmpeg -i "${tempSourcePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 64k -y "${path64}"`,
      { maxBuffer: 50 * 1024 * 1024 },
    );
    await execAsync(
      `ffmpeg -i "${tempSourcePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 128k -y "${path128}"`,
      { maxBuffer: 50 * 1024 * 1024 },
    );
    await execAsync(
      `ffmpeg -i "${tempSourcePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 320k -y "${path320}"`,
      { maxBuffer: 50 * 1024 * 1024 },
    );
  } finally {
    await fs.promises.unlink(tempSourcePath).catch(() => {});
  }

  // 10. Parse Duration & calculate file sizes
  let duration = song.duration || 0;
  try {
    const parsedMeta = await parseFile(path128);
    duration = Math.round(parsedMeta.format.duration || song.duration || 0);
  } catch {
    // Keep fallback
  }

  const stats64 = await stat(path64);
  const stats128 = await stat(path128);
  const stats320 = await stat(path320);

  const uri128 = `/assets/mp3/${artistFolder}/${filename128}`;
  const linksJson = {
    64: {
      url: `/assets/mp3/${artistFolder}/${filename64}`,
      size: formatFileSize(stats64.size),
      bytes: stats64.size,
    },
    128: {
      url: `/assets/mp3/${artistFolder}/${filename128}`,
      size: formatFileSize(stats128.size),
      bytes: stats128.size,
    },
    320: {
      url: `/assets/mp3/${artistFolder}/${filename320}`,
      size: formatFileSize(stats320.size),
      bytes: stats320.size,
    },
  };

  // 11. Generate 30-Second OGG Preview
  const pathOgg = path.join(TARGET_OGG_DIR, `${song.id}.ogg`);
  const startingPoint =
    duration / 2 + 30 > duration ? 0 : Math.floor(duration / 2);

  console.log(`[Regenerate] Generating OGG preview for ${song.id}...`);
  await execAsync(
    `ffmpeg -ss ${startingPoint} -i "${path128}" -t 30 -map 0:a:0 -vn -sn -dn -c:a libvorbis -b:a 64k -y "${pathOgg}"`,
    { maxBuffer: 50 * 1024 * 1024 },
  );

  const localOgg = path.join(
    process.cwd(),
    "public",
    "assets",
    "ogg",
    `${song.id}.ogg`,
  );
  if (path.resolve(pathOgg) !== path.resolve(localOgg)) {
    try {
      await mkdir(path.dirname(localOgg), { recursive: true });
      await fs.promises.copyFile(pathOgg, localOgg);
    } catch {
      // Non-critical local sync
    }
  }

  // 12. Delete Old Fingerprints and Generate New Fingerprints (Shazam / Dejavu)
  let fingerprintCount = 0;
  try {
    console.log(`[Regenerate] Computing audio fingerprints for ${path128}...`);
    const fingerprints = await runFingerprintPython(path128);
    fingerprintCount = fingerprints.length;

    const sqliteDbPath = getFingerprintDbPath();
    const sqliteDb = getFingerprintsDb(sqliteDbPath);

    const upsertSongStmt = sqliteDb.prepare(`
      INSERT INTO songs (
        song_key, slug, title, title_en, artist, artist_en, cover_art, uri, file_path, duration, fingerprint_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(song_key) DO UPDATE SET
        slug = excluded.slug,
        title = excluded.title,
        title_en = excluded.title_en,
        artist = excluded.artist,
        artist_en = excluded.artist_en,
        cover_art = excluded.cover_art,
        uri = excluded.uri,
        file_path = excluded.file_path,
        duration = excluded.duration,
        fingerprint_count = excluded.fingerprint_count
      RETURNING id
    `);

    const deleteFpsBySongId = sqliteDb.prepare(`
      DELETE FROM fingerprints WHERE song_id = ?
    `);

    const insertFpStmt = sqliteDb.prepare(`
      INSERT INTO fingerprints (hash, song_id, offset) VALUES (?, ?, ?)
    `);

    // Find any existing songs matching song.id OR old slug
    const existingRows = sqliteDb
      .prepare(`SELECT id FROM songs WHERE song_key = ? OR slug = ?`)
      .all(song.id, song.slug) as { id: number }[];

    const saveTransaction = sqliteDb.transaction((fps: [number, number][]) => {
      // Delete all old fingerprints
      for (const r of existingRows) {
        deleteFpsBySongId.run(r.id);
      }

      // Upsert current song
      const row = upsertSongStmt.get(
        song.id,
        uniqueSlug,
        song.title,
        song.titleEn || null,
        displayArtistName,
        displayArtistEn || null,
        finalCoverArtRel,
        uri128,
        path128,
        duration,
        fps.length,
      ) as { id: number };

      const internalSongId = row.id;
      deleteFpsBySongId.run(internalSongId);

      for (const [hash, offset] of fps) {
        insertFpStmt.run(hash, internalSongId, offset);
      }
    });

    saveTransaction(fingerprints);
    console.log(
      `[Regenerate] Stored ${fingerprints.length} fingerprints in ${sqliteDbPath}`,
    );
  } catch (fpErr: any) {
    console.error(
      `[Regenerate] Audio fingerprinting encountered an error:`,
      fpErr.message,
    );
  }

  // 13. Update Song Record in PostgreSQL (Prisma)
  console.log(`[Regenerate] Updating Prisma Song database record...`);
  const updatedSong = await prisma.song.update({
    where: { id: song.id },
    data: {
      slug: uniqueSlug,
      uri: uri128,
      filename: filename128,
      coverArt: finalCoverArtRel,
      duration: duration,
      links: linksJson,
      ogg: `/assets/ogg/${song.id}.ogg`,
    },
    include: {
      artists: true,
    },
  });

  // 14. Clean up old files if paths have changed
  const oldFilesToRemove: string[] = [];
  if (song.uri && song.uri !== uri128) {
    oldFilesToRemove.push(
      path.join(LORI2_BASE_DIR, "public", song.uri.replace(/^\/+/, "")),
    );
    oldFilesToRemove.push(
      path.join(process.cwd(), "public", song.uri.replace(/^\/+/, "")),
    );
  }
  if (song.links && typeof song.links === "object") {
    const oldLinks = song.links as Record<string, { url?: string }>;
    for (const q of ["64", "128", "320"]) {
      const oldUrl = oldLinks[q]?.url;
      if (oldUrl && oldUrl !== linksJson[q as "64" | "128" | "320"].url) {
        oldFilesToRemove.push(
          path.join(LORI2_BASE_DIR, "public", oldUrl.replace(/^\/+/, "")),
        );
        oldFilesToRemove.push(
          path.join(process.cwd(), "public", oldUrl.replace(/^\/+/, "")),
        );
      }
    }
  }
  if (
    song.coverArt &&
    song.coverArt !== finalCoverArtRel &&
    !song.coverArt.includes("cover.png")
  ) {
    oldFilesToRemove.push(
      path.join(LORI2_BASE_DIR, "public", song.coverArt.replace(/^\/+/, "")),
    );
    oldFilesToRemove.push(
      path.join(process.cwd(), "public", song.coverArt.replace(/^\/+/, "")),
    );
  }

  const newPathsSet = new Set([
    path.resolve(path64),
    path.resolve(path128),
    path.resolve(path320),
    path.resolve(pathCover),
  ]);

  for (const oldFile of oldFilesToRemove) {
    try {
      if (fs.existsSync(oldFile) && !newPathsSet.has(path.resolve(oldFile))) {
        await fs.promises.unlink(oldFile);
      }
    } catch {
      // Ignore cleanup error
    }
  }

  return {
    song: updatedSong,
    fingerprintCount,
    paths: {
      path64,
      path128,
      path320,
      pathCover,
      pathOgg,
    },
  };
}
