import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import fs from "fs";
import path from "path";
import "dotenv/config";
import { stat } from "fs/promises";
import { writeFileSync } from "fs";
import { findSimilarSongs } from "../lib/jssimilarity.js";

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

// --- Main Script ---
async function main() {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter });

  console.log("🚀 Starting Bulk Song Import...");

  // 1. Get JSON file path (assuming it's in the root)
  const jsonPath = path.join(process.cwd(), "uniqueSongsFinal.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: JSON file not found at ${jsonPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const songsData = JSON.parse(rawData);
  console.log(`📂 Loaded ${songsData.length} items from JSON.`);

  let importedCount = 0;
  let skippedCount = 0;

  let artistsCreatedCount = 0;

  const errored = [];
  // let indx = 0;
  for (const item of songsData) {
    // indx++;
    // if (indx > 10) {
    //   break;
    // }
    try {
      // 3. Artist Handling
      const artistName = item.artist || "خواننده ناشناس";
      const artistEn = item.artistEn || "";

      let artistRecord = await prisma.artist.findFirst({
        where: { name: artistName.trim() },
      });

      const coverArt = item.coverArt
        ? `/assets/cover/${item.coverArt}`
        : "/images/cover.png";

      if (!artistRecord) {
        artistRecord = await prisma.artist.create({
          data: {
            name: artistName.trim(),
            nameEn: artistEn,
            image: coverArt,
          },
        });
        console.log(`🎨 Created new artist: ${artistName}`);
        artistsCreatedCount++;
      }

      // 4. Slug Generation
      const id = () =>
        Math.random().toString(36).slice(2) + Date.now().toString(36);

      const slug = id();

      // 5. Construct Asset URLs
      // Paths provided by user: @/public/assets/mp3/ and @/public/public/assets/cover/
      const uri = item.filename ? `/assets/mp3/${item.filename}` : "";

      const uriForStat = path.join(
        process.cwd(),
        "public",
        "assets",
        "mp3",
        item.filename
      );

      const currentSongCount = await prisma.song.count();

      const stats = await stat(uriForStat);

      const fileSize = formatFileSize(stats.size);

      const links = {
        64: {
          url: `${process.env.NEXT_PUBLIC_DEPLOYED_URL}/assets/mp3/${item.filename}`,
          size: fileSize,
          bytes: stats.size,
        },
        128: {
          url: `${process.env.NEXT_PUBLIC_DEPLOYED_URL}/assets/mp3/${item.filename}`,
          size: fileSize,
          bytes: stats.size,
        },
        320: {
          url: `${process.env.NEXT_PUBLIC_DEPLOYED_URL}/assets/mp3/${item.filename}`,
          size: fileSize,
          bytes: stats.size,
        },
      };

      // 6. Create Song
      await prisma.song.create({
        data: {
          index: currentSongCount,
          title: item.title || "بدون عنوان",
          titleEn: item.titleEN || "",
          artist: artistName.trim(),
          artistEn: artistEn,
          artists: {
            connect: [{ id: artistRecord.id }],
          },
          uri: uri,
          coverArt: coverArt,
          filename: item.filename,
          duration: item.duration || 0,
          lyrics: item.lyrics,
          slug: slug,
          userId: "fBTuRnw3G0TqDGp6AD5lhVeUSav97bxR",
          isActive: true,
          links: links || {},
          contributors: {
            create: [
              {
                userId: "fBTuRnw3G0TqDGp6AD5lhVeUSav97bxR",
                type: "add",
                percentage: 100,
              },
              ...(item.lyrics
                ? [
                    {
                      userId: "fBTuRnw3G0TqDGp6AD5lhVeUSav97bxR",
                      type: "lyrics",
                      percentage: 100,
                    },
                  ]
                : []),
            ],
          },
          similarSongs: {
            connect: await findSimilarSongs({
              title: item.title || "بدون عنوان",
              artistIds: [artistRecord.id],
              genreIds: [],
            }),
          },
        },
      });

      importedCount++;
      if (importedCount % 100 === 0) {
        console.log(
          `✅ Progress: Imported ${importedCount}/${songsData.length} songs...`
        );
      }
    } catch (error) {
      console.error(`❌ Error importing song "${item.title}":`, error);
      errored.push(item);
      skippedCount++;
    }
  }

  console.log("\n--- Import Summary ---");
  console.log(`🎉 Successfully imported: ${importedCount}`);
  console.log(`✔ Artists Created Count: ${artistsCreatedCount}`);
  console.log(`⏭️ Skipped: ${skippedCount}`);
  console.log(`🏁 Total processed: ${songsData.length}`);

  writeFileSync("./errored.json", JSON.stringify(errored, null, 2));

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
