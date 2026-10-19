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

  const inputPath = path.join(process.cwd(), "scripts", "songs.json");

  const errors = [];

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
      "coverArt",
      "duration",
      "uri",
      "filename",
      "lyricsSourceUrl",
      "links",
      "ogg",
    ];

    for (const jsonSong of jsonSongs) {
      try {
        // Try to find the song in the DB by ID first, then by slug
        const dbSong = await prisma.song.findFirst({
          where: { id: jsonSong.id },
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

        const updates: any = {};
        let hasChanges = false;

        for (const field of fieldsToSync) {
          // Priority: JSON content, but ONLY if the field exists in the JSON object
          if (Object.prototype.hasOwnProperty.call(jsonSong, field)) {
            const jsonValue = jsonSong[field];
            const dbValue = (dbSong as any)[field];

            // Comparison logic
            // Use JSON.stringify for deep comparison of JSON fields (like 'links')
            const isDifferent =
              typeof jsonValue === "object" && jsonValue !== null
                ? JSON.stringify(jsonValue) !== JSON.stringify(dbValue)
                : jsonValue !== dbValue;

            if (isDifferent) {
              updates[field] = jsonValue;
              hasChanges = true;
            }
          }
        }

        if (hasChanges) {
          await prisma.song.update({
            where: { id: dbSong.id },
            data: updates,
          });
          console.log(
            `✅ Updated song: "${jsonSong.titleEn}" (Changes: ${Object.keys(
              updates
            ).join(", ")})`
          );
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(
          `❌ Error processing song "${jsonSong.titleEn || "Unknown"}":`,
          err
        );
        errorCount++;
        errors.push({
          reason: "ERROR",
          jsonSong,
          error: err instanceof Error ? err.message : String(err),
        });
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
    await fs.writeFile(
      path.join(process.cwd(), "scripts", "generatedErrors.json"),
      JSON.stringify(errors, null, 2),
      "utf8"
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
