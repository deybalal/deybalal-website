import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { readFile } from "fs/promises";
import { join, resolve } from "path";

import "dotenv/config";

interface TelegramFileItem {
  file_id?: string | null;
  file_unique_id?: string | null;
}

interface BotArtist {
  id?: string;
  name: string;
  nameEn?: string | null;
  fileId?: string | null;
  fileUniqueId?: string | null;
}

interface BotSongItem {
  id: string;
  slug?: string;
  title?: string;
  titleEn?: string | null;
  artist?: string;
  artists?: BotArtist[] | string;
  telegram?: {
    "64"?: TelegramFileItem | null;
    "128"?: TelegramFileItem | null;
    "320"?: TelegramFileItem | null;
    coverArt?: TelegramFileItem | null;
    ogg?: TelegramFileItem | null;
  } | null;
  post?: {
    has_posted?: boolean | number;
    message_id?: number | null;
    ogg_message_id?: number | null;
    mp3_message_id?: number | null;
  } | null;
}

async function main() {
  console.log("process.env.DATABASE_URL", process.env.DATABASE_URL);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("=================================================");
  console.log("🚀 Starting Telegram & Artist Data Import...");
  console.log("=================================================");

  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: npx tsx scripts/importTelegramData.ts [path-to-json]");
    console.log("Defaults to: botfiles/dbExample.json");
    process.exit(0);
  }

  // Allow custom file path via CLI argument, defaulting to botfiles/dbExample.json
  const defaultFilePath = join(process.cwd(), "botfiles", "dbExamsdaple.json");

  const targetFilePath = process.argv[2]
    ? resolve(process.argv[2])
    : defaultFilePath;

  console.log(`📁 Reading data from: ${targetFilePath}`);

  let rawData: string;
  try {
    rawData = await readFile(targetFilePath, "utf-8");
  } catch (err) {
    console.error(
      `❌ Failed to read JSON file at "${targetFilePath}":`,
      (err as Error).message
    );
    process.exit(1);
  }

  let items: BotSongItem[];
  try {
    items = JSON.parse(rawData);
    if (!Array.isArray(items)) {
      throw new Error("Expected JSON root to be an array of songs.");
    }
  } catch (err) {
    console.error("❌ Failed to parse JSON:", (err as Error).message);
    process.exit(1);
  }

  console.log(`📊 Found ${items.length} song items to process.\n`);

  let artistUpdatedCount = 0;
  let artistCreatedCount = 0;
  let artistSkippedCount = 0;

  let telegramCreatedCount = 0;
  let telegramUpdatedCount = 0;
  let songsNotFoundCount = 0;
  let errorCount = 0;

  // Track processed artist IDs to avoid redundant updates across multiple songs
  const processedArtistKeys = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemIndexStr = `[${i + 1}/${items.length}]`;

    try {
      // ----------------------------------------------------
      // 1. Process Artists: update fileId and fileUniqueId
      // ----------------------------------------------------
      let artistsList: BotArtist[] = [];
      if (Array.isArray(item.artists)) {
        artistsList = item.artists;
      } else if (typeof item.artists === "string") {
        try {
          artistsList = JSON.parse(item.artists);
        } catch {
          artistsList = [];
        }
      }

      for (const artist of artistsList) {
        if (!artist.name && !artist.id) continue;

        const dedupeKey = artist.id || artist.name;
        if (processedArtistKeys.has(dedupeKey)) continue;

        // Only update if Telegram file information exists
        if (artist.fileId || artist.fileUniqueId) {
          const dbArtist = await prisma.artist.findFirst({
            where: {
              OR: [
                ...(artist.id ? [{ id: artist.id }] : []),
                ...(artist.name ? [{ name: artist.name }] : []),
              ],
            },
          });

          if (dbArtist) {
            await prisma.artist.update({
              where: { id: dbArtist.id },
              data: {
                fileId: artist.fileId ?? dbArtist.fileId,
                fileUniqueId: artist.fileUniqueId ?? dbArtist.fileUniqueId,
              },
            });
            artistUpdatedCount++;
            console.log(
              `  👤 Updated artist: ${
                dbArtist.name
              } (fileId: ${artist.fileId?.slice(0, 15)}...)`
            );
          } else if (artist.name) {
            // Create artist if not found in DB
            await prisma.artist.create({
              data: {
                id: artist.id,
                name: artist.name,
                nameEn: artist.nameEn ?? null,
                fileId: artist.fileId ?? null,
                fileUniqueId: artist.fileUniqueId ?? null,
              },
            });
            artistCreatedCount++;
            console.log(`  ✨ Created artist: ${artist.name}`);
          } else {
            artistSkippedCount++;
          }

          processedArtistKeys.add(dedupeKey);
        }
      }

      // ----------------------------------------------------
      // 2. Process Telegram Model for the Song
      // ----------------------------------------------------
      // Match song in DB by ID first, then by slug
      const dbSong = await prisma.song.findFirst({
        where: {
          OR: [
            ...(item.id ? [{ id: item.id }] : []),
            ...(item.slug ? [{ slug: item.slug }] : []),
          ],
        },
        include: { telegram: true },
      });

      if (!dbSong) {
        console.warn(
          `${itemIndexStr} ⚠️ Song not found in database: "${
            item.title || item.slug
          }" (ID: ${item.id})`
        );
        songsNotFoundCount++;
        continue;
      }

      const tgData = item.telegram;
      const postData = item.post;

      const telegramFields = {
        file_id_64: tgData?.["64"]?.file_id ?? null,
        file_unique_id_64: tgData?.["64"]?.file_unique_id ?? null,
        file_id_128: tgData?.["128"]?.file_id ?? null,
        file_unique_id_128: tgData?.["128"]?.file_unique_id ?? null,
        file_id_320: tgData?.["320"]?.file_id ?? null,
        file_unique_id_320: tgData?.["320"]?.file_unique_id ?? null,
        file_id_ogg: tgData?.ogg?.file_id ?? null,
        file_unique_id_ogg: tgData?.ogg?.file_unique_id ?? null,
        ogg_file_id: tgData?.ogg?.file_id ?? null,
        ogg_file_unique_id: tgData?.ogg?.file_unique_id ?? null,
        cover_art_file_id: tgData?.coverArt?.file_id ?? null,
        cover_art_file_unique_id: tgData?.coverArt?.file_unique_id ?? null,

        has_posted:
          typeof postData?.has_posted === "boolean"
            ? postData.has_posted
            : Boolean(postData?.has_posted),
        message_id: postData?.message_id ?? null,
        ogg_message_id: postData?.ogg_message_id ?? null,
      };

      if (dbSong.telegram) {
        await prisma.telegram.update({
          where: { songId: dbSong.id },
          data: telegramFields,
        });
        telegramUpdatedCount++;
        console.log(
          `${itemIndexStr} 🔄 Updated Telegram data for song: "${dbSong.title}" (${dbSong.id})`
        );
      } else {
        await prisma.telegram.create({
          data: {
            songId: dbSong.id,
            ...telegramFields,
          },
        });
        telegramCreatedCount++;
        console.log(
          `${itemIndexStr} ➕ Inserted new Telegram data for song: "${dbSong.title}" (${dbSong.id})`
        );
      }
    } catch (err) {
      errorCount++;
      console.error(
        `${itemIndexStr} ❌ Error processing item ${item.id} ("${item.title}"):`,
        (err as Error).message
      );
    }
  }

  await prisma.$disconnect();

  console.log("\n=================================================");
  console.log("🏁 Import Completed!");
  console.log("=================================================");
  console.log(`👤 Artists Updated:         ${artistUpdatedCount}`);
  console.log(`✨ Artists Created:         ${artistCreatedCount}`);
  console.log(`⏭️  Artists Skipped:         ${artistSkippedCount}`);
  console.log(`➕ Telegram Records Created: ${telegramCreatedCount}`);
  console.log(`🔄 Telegram Records Updated: ${telegramUpdatedCount}`);
  console.log(`⚠️  Songs Not Found:         ${songsNotFoundCount}`);
  console.log(`❌ Errors Encountered:      ${errorCount}`);
  console.log("=================================================");
}

main().catch((e) => {
  console.error("Fatal error during import:", e);
  process.exit(1);
});
