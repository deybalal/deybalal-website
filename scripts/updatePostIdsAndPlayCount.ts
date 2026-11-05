import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs/promises";
import path from "path";
import "dotenv/config";

interface SongPostJson {
  has_posted?: boolean;
  message_id?: number | null;
  ogg_message_id?: number | null;
}

interface SongJson {
  id: string;
  slug?: string;
  title?: string;
  artist?: string;
  playCount?: number | null;
  downloads?: number | null;
  post?: SongPostJson | null;
}

interface TelegramJson {
  id?: string;
  songId: string;
  has_posted?: boolean;
  message_id?: number | null;
  ogg_message_id?: number | null;
}

interface BackupData {
  songs?: SongJson[];
  Song?: SongJson[];
  telegrams?: TelegramJson[];
  Telegram?: TelegramJson[];
}

interface BackupPayload {
  version?: string;
  exportedAt?: string;
  counts?: Record<string, number>;
  totalRecords?: number;
  data?: BackupData;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  task: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map((item) => task(item)));
  }
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`
Usage: npx tsx scripts/updatePostIdsAndPlayCount.ts [path/to/exportedEverything.json] [--force]

Options:
  [path]        Path to exported JSON file from exportEverything.ts.
                If omitted, the newest exportedEverything-*.json or
                exportedEverything.json in scripts/ or data/ is automatically selected.
  --force, -f   Force update all records even if current values match.
  --help, -h    Show this help message.
`);
    process.exit(0);
  }

  const forceUpdate =
    process.argv.includes("--force") || process.argv.includes("-f");

  console.log("🚀 Starting PlayCount, Downloads & Telegram Post IDs Sync...\n");

  if (forceUpdate) {
    console.log("⚡ Force mode enabled: will rewrite matching values.\n");
  }

  // 1. Resolve Input File
  const inputPath = path.join(
    process.cwd(),
    "data",
    "exportedEverything-2026-10-31T18-30.json"
  );
  console.log(`📂 Source backup file: ${inputPath}`);

  const rawData = await fs.readFile(inputPath, "utf-8");
  const payload: BackupPayload & BackupData = JSON.parse(rawData);
  const data: BackupData = payload.data || payload;

  const exportedSongs: SongJson[] = data.songs || data.Song || [];
  const exportedTelegrams: TelegramJson[] =
    data.telegrams || data.Telegram || [];

  if (exportedSongs.length === 0) {
    console.error("❌ No songs found in the backup file.");
    process.exit(1);
  }

  console.log(`📊 Records in file: ${exportedSongs.length.toString()} songs`);
  if (payload.exportedAt) {
    console.log(`⏱️ Exported At: ${payload.exportedAt}`);
  }
  console.log("");

  // 2. Connect to Database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 3. Fetch current DB state for comparison and safe updating
    console.log(
      "🔍 Fetching existing songs and telegram records from database..."
    );
    const dbSongs = await prisma.song.findMany({
      select: { id: true, playCount: true, downloads: true },
    });
    const dbSongMap = new Map(dbSongs.map((s) => [s.id, s]));

    const dbTelegrams = await prisma.telegram.findMany({
      select: {
        id: true,
        songId: true,
        has_posted: true,
        message_id: true,
        ogg_message_id: true,
      },
    });
    const dbTelegramMap = new Map(dbTelegrams.map((t) => [t.songId, t]));

    console.log(
      `   Found ${dbSongs.length.toString()} songs and ${dbTelegrams.length.toString()} telegram records in DB.\n`
    );

    // --- PHASE 1: Update Song playCount & downloads ---
    console.log("--- 1. Updating Songs (playCount & downloads) ---");
    const songsToUpdate: {
      id: string;
      playCount: number;
      downloads: number;
    }[] = [];

    let songsUpToDate = 0;
    let songsNotFound = 0;

    for (const song of exportedSongs) {
      if (!song.id) continue;
      const dbSong = dbSongMap.get(song.id);
      if (!dbSong) {
        songsNotFound++;
        continue;
      }

      const targetPlayCount =
        typeof song.playCount === "number" && !isNaN(song.playCount)
          ? song.playCount
          : 0;
      const targetDownloads =
        typeof song.downloads === "number" && !isNaN(song.downloads)
          ? song.downloads
          : 0;

      if (
        forceUpdate ||
        dbSong.playCount !== targetPlayCount ||
        dbSong.downloads !== targetDownloads
      ) {
        songsToUpdate.push({
          id: song.id,
          playCount: targetPlayCount,
          downloads: targetDownloads,
        });
      } else {
        songsUpToDate++;
      }
    }

    let songSuccess = 0;
    let songFailed = 0;

    if (songsToUpdate.length === 0) {
      console.log(
        `  ✨ All ${songsUpToDate.toString()} matching songs are already up-to-date with playCount and downloads!`
      );
    } else {
      console.log(
        `  ⏳ Updating ${songsToUpdate.length.toString()} songs (${songsUpToDate.toString()} already up-to-date)...`
      );

      await runInBatches(songsToUpdate, 30, async (item) => {
        try {
          await prisma.song.update({
            where: { id: item.id },
            data: {
              playCount: item.playCount,
              downloads: item.downloads,
            },
          });
          songSuccess++;
        } catch (err) {
          songFailed++;
          if (songFailed <= 3) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(`  ⚠️ Failed to update song ${item.id}: ${msg}`);
          }
        }
      });

      console.log(
        `  ✅ Successfully updated ${songSuccess.toString()} songs` +
          (songFailed > 0 ? ` (${songFailed} failed)` : "")
      );
    }

    // --- PHASE 2: Update Telegram Post IDs (has_posted: true) ---
    console.log("\n--- 2. Updating Telegram Posts (has_posted = true) ---");

    // Index exported telegrams array if present
    const exportedTgMap = new Map<string, TelegramJson>();
    for (const tg of exportedTelegrams) {
      if (tg.songId) {
        exportedTgMap.set(tg.songId, tg);
      }
    }

    const postsToUpdate: {
      songId: string;
      messageId: number | null;
      oggMessageId: number | null;
    }[] = [];

    let postedSongsCount = 0;
    let postsAlreadyUpToDate = 0;

    for (const song of exportedSongs) {
      if (!song.id) continue;
      // Skip songs that do not exist in the target DB
      if (!dbSongMap.has(song.id)) continue;

      const tgExport = exportedTgMap.get(song.id);
      const postExport = song.post;

      const hasPosted =
        postExport?.has_posted === true ||
        (postExport?.has_posted as unknown) === "true" ||
        tgExport?.has_posted === true ||
        (tgExport?.has_posted as unknown) === "true";

      if (!hasPosted) {
        continue;
      }

      postedSongsCount++;

      const rawMsgId = postExport?.message_id ?? tgExport?.message_id ?? null;
      const rawOggMsgId =
        postExport?.ogg_message_id ?? tgExport?.ogg_message_id ?? null;

      const messageId =
        rawMsgId !== null && rawMsgId !== undefined ? Number(rawMsgId) : null;
      const oggMessageId =
        rawOggMsgId !== null && rawOggMsgId !== undefined
          ? Number(rawOggMsgId)
          : null;

      const currentTg = dbTelegramMap.get(song.id);

      if (
        forceUpdate ||
        !currentTg ||
        currentTg.has_posted !== true ||
        currentTg.message_id !== messageId ||
        currentTg.ogg_message_id !== oggMessageId
      ) {
        postsToUpdate.push({
          songId: song.id,
          messageId,
          oggMessageId,
        });
      } else {
        postsAlreadyUpToDate++;
      }
    }

    let postSuccess = 0;
    let postFailed = 0;

    if (postsToUpdate.length === 0) {
      console.log(
        `  ✨ All ${postedSongsCount.toString()} posted songs already have matching post IDs in the database!`
      );
    } else {
      console.log(
        `  ⏳ Updating ${postsToUpdate.length.toString()} Telegram post records (${postsAlreadyUpToDate.toString()} already up-to-date out of ${postedSongsCount.toString()} posted songs)...`
      );

      await runInBatches(postsToUpdate, 30, async (item) => {
        try {
          await prisma.telegram.upsert({
            where: { songId: item.songId },
            update: {
              has_posted: true,
              message_id: item.messageId,
              ogg_message_id: item.oggMessageId,
            },
            create: {
              songId: item.songId,
              has_posted: true,
              message_id: item.messageId,
              ogg_message_id: item.oggMessageId,
            },
          });
          postSuccess++;
        } catch (err) {
          postFailed++;
          if (postFailed <= 3) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(
              `  ⚠️ Failed to update Telegram post for song ${item.songId}: ${msg}`
            );
          }
        }
      });

      console.log(
        `  ✅ Successfully updated ${postSuccess.toString()} Telegram post records` +
          (postFailed > 0 ? ` (${postFailed} failed)` : "")
      );
    }

    console.log("\n=================================");
    console.log(`🎉 Sync Completed Successfully!`);
    console.log(`📊 Total songs in file: ${exportedSongs.length.toString()}`);
    console.log(
      `🎵 Songs updated: ${songSuccess.toString()} (already up-to-date: ${songsUpToDate.toString()})`
    );
    console.log(
      `📢 Songs with has_posted=true: ${postedSongsCount.toString()}`
    );
    console.log(
      `📬 Telegram posts updated: ${postSuccess.toString()} (already up-to-date: ${postsAlreadyUpToDate.toString()})`
    );
    if (songsNotFound > 0) {
      console.log(
        `⚠️ Songs in file not found in DB: ${songsNotFound.toString()}`
      );
    }
    console.log("=================================\n");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Critical error during sync:", message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end().catch(() => {});
  }
}

main().catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  console.error("Unhandled error:", message);
  process.exit(1);
});
