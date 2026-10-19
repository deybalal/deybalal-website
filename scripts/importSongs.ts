import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs/promises";
import path from "path";
import "dotenv/config";

async function main() {
  console.log("🚀 Starting Song Import...");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  let inputPath = process.argv[2] ? path.resolve(process.argv[2]) : "";

  if (!inputPath) {
    const examplePath = path.join(
      process.cwd(),
      "data",
      "fancysongsexample.json"
    );
    const defaultPath = path.join(process.cwd(), "scripts", "songs.json");
    try {
      await fs.access(examplePath);
      inputPath = examplePath;
    } catch {
      inputPath = defaultPath;
    }
  }

  try {
    const rawData = await fs.readFile(inputPath, "utf-8");
    const jsonSongs = JSON.parse(rawData);

    console.log(`📂 Loaded ${jsonSongs.length} songs from JSON.`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const fieldsToSync = [
      "slug",
      "title",
      "titleEn",
      "artist",
      "artistEn",
      "albumName",
      "coverArt",
      "year",
      "duration",
      "uri",
      "filename",
      "index",
      "lyrics",
      "syncedLyrics",
      "playCount",
      "isDisabled",
      "disabledDescription",
      "isActive",
      "isFeatured",
      "albumId",
      "userId",
      "lyricsSource",
      "lyricsSourceUrl",
      "links",
      "ogg",
    ];

    for (const jsonSong of jsonSongs) {
      try {
        // Try to find the song in the DB by ID first, then by slug
        const dbSong = await prisma.song.findFirst({
          where: {
            OR: [{ id: jsonSong.id }, { slug: jsonSong.slug }],
          },
          include: { telegram: true },
        });

        if (!dbSong) {
          console.warn(
            `⚠️ Song not found in DB: ${jsonSong.title} (${
              jsonSong.id || jsonSong.slug || "No ID/Slug"
            }). Skipping.`
          );
          skippedCount++;
          continue;
        }

        const updates: Record<string, unknown> = {};
        let hasChanges = false;
        const changedFields: string[] = [];

        for (const field of fieldsToSync) {
          if (Object.prototype.hasOwnProperty.call(jsonSong, field)) {
            const jsonValue = jsonSong[field];
            const dbValue = (dbSong as Record<string, unknown>)[field];

            const isDifferent =
              typeof jsonValue === "object" && jsonValue !== null
                ? JSON.stringify(jsonValue) !== JSON.stringify(dbValue)
                : jsonValue !== dbValue;

            if (isDifferent) {
              updates[field] = jsonValue;
              hasChanges = true;
              changedFields.push(field);
            }
          }
        }

        // Handle artists
        if (
          jsonSong.artists &&
          Array.isArray(jsonSong.artists) &&
          jsonSong.artists.length > 0
        ) {
          updates.artists = {
            connect: jsonSong.artists.map((a: { id: string }) => ({ id: a.id })),
          };
          hasChanges = true;
          if (!changedFields.includes("artists")) changedFields.push("artists");

          for (const art of jsonSong.artists) {
            try {
              await prisma.artist.update({
                where: { id: art.id },
                data: {
                  ...(art.fileId ? { fileId: art.fileId } : {}),
                  ...(art.fileUniqueId
                    ? { fileUniqueId: art.fileUniqueId }
                    : {}),
                },
              });
            } catch {
              // Ignore if artist not found
            }
          }
        }

        if (hasChanges) {
          await prisma.song.update({
            where: { id: dbSong.id },
            data: updates,
          });
        }

        // Handle telegram and post data
        let telegramChanges = false;
        if (jsonSong.telegram || jsonSong.post) {
          const tg = jsonSong.telegram;
          const pt = jsonSong.post;

          const tgUpdateData = {
            file_id_64:
              tg?.["64"]?.file_id ?? dbSong.telegram?.file_id_64 ?? null,
            file_unique_id_64:
              tg?.["64"]?.file_unique_id ??
              dbSong.telegram?.file_unique_id_64 ??
              null,
            file_id_128:
              tg?.["128"]?.file_id ?? dbSong.telegram?.file_id_128 ?? null,
            file_unique_id_128:
              tg?.["128"]?.file_unique_id ??
              dbSong.telegram?.file_unique_id_128 ??
              null,
            file_id_320:
              tg?.["320"]?.file_id ?? dbSong.telegram?.file_id_320 ?? null,
            file_unique_id_320:
              tg?.["320"]?.file_unique_id ??
              dbSong.telegram?.file_unique_id_320 ??
              null,
            cover_art_file_id:
              tg?.coverArt?.file_id ??
              dbSong.telegram?.cover_art_file_id ??
              null,
            cover_art_file_unique_id:
              tg?.coverArt?.file_unique_id ??
              dbSong.telegram?.cover_art_file_unique_id ??
              null,
            ogg_file_id:
              tg?.ogg?.file_id ?? dbSong.telegram?.ogg_file_id ?? null,
            ogg_file_unique_id:
              tg?.ogg?.file_unique_id ??
              dbSong.telegram?.ogg_file_unique_id ??
              null,
            has_posted: pt?.has_posted ?? dbSong.telegram?.has_posted ?? false,
            message_id: pt?.message_id ?? dbSong.telegram?.message_id ?? null,
            ogg_message_id:
              pt?.ogg_message_id ?? dbSong.telegram?.ogg_message_id ?? null,
          };

          await prisma.telegram.upsert({
            where: { songId: dbSong.id },
            update: tgUpdateData,
            create: {
              songId: dbSong.id,
              ...tgUpdateData,
            },
          });

          // To track if telegram was updated for console logging
          telegramChanges = true;
        }

        if (hasChanges || telegramChanges) {
          console.log(
            `✅ Updated song: "${dbSong.title}" (Changes: ${
              changedFields.length > 0
                ? changedFields.join(", ")
                : "telegram/post"
            })`
          );
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(
          `❌ Error processing song "${jsonSong.title || "Unknown"}":`,
          err
        );
        errorCount++;
      }
    }

    console.log("\n--- Import Summary ---");
    console.log(`🎉 Successfully updated: ${updatedCount}`);
    console.log(`⏭️ Skipped (no changes or not found): ${skippedCount}`);
    if (errorCount > 0) {
      console.log(`❌ Errors encountered: ${errorCount}`);
    }
  } catch (error) {
    console.error("❌ Error reading import file:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
