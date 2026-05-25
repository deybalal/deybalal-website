import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import fs from "fs";
import path from "path";
import "dotenv/config";
import { stat, unlink, rename, mkdir } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { parseFile } from "music-metadata";
import { findSimilarSongs } from "../lib/jssimilarity.js";

const execAsync = promisify(exec);

// --- Helpers ---

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

function slugify(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

async function getUniqueSongSlug(prisma, baseText) {
  const slug = slugify(baseText);
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const existingSong = await prisma.song.findUnique({
      where: { slug: uniqueSlug },
      select: { id: true },
    });

    if (!existingSong) {
      break;
    }

    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

// --- Main Script ---
async function main() {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter });

  console.log("🚀 Starting Advanced Bulk Song Import (2import.js)...");

  // 1. Get JSON file path
  const jsonPath = path.join(process.cwd(), "kourosh-asadpour.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: JSON file not found at ${jsonPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const songsData = JSON.parse(rawData);
  console.log(`📂 Loaded ${songsData.length} items from JSON.`);

  // Ensure target directories exist
  const targetMp3Dir = path.join(process.cwd(), "public/assets/mp3");
  const targetOggDir = path.join(process.cwd(), "public/assets/ogg");
  const targetCoverDir = path.join(process.cwd(), "public/assets/cover");

  await mkdir(targetMp3Dir, { recursive: true });
  await mkdir(targetOggDir, { recursive: true });
  await mkdir(targetCoverDir, { recursive: true });

  let importedCount = 0;
  let skippedCount = 0;
  const errored = [];

  const userId = "fBTuRnw3G0TqDGp6AD5lhVeUSav97bxR"; // Admin user from import.js

  for (const item of songsData) {
    console.log(`\n🎵 Processing: ${item.title} (${item.titleEN})`);
    try {
      // 1. Artist Handling
      const artistName = item.artist || "کوروش اسدپور";
      const artistEn = item.artistEn || "Kourosh Asadpour";

      let artistRecord = await prisma.artist.findFirst({
        where: { name: artistName.trim() },
      });

      if (!artistRecord) {
        artistRecord = await prisma.artist.create({
          data: {
            name: artistName.trim(),
            nameEn: artistEn,
            image: "/images/cover.png", // Default image
          },
        });
        console.log(`🎨 Created new artist: ${artistName}`);
      }

      // 2. Paths
      const sourceMusicPath = path.join(
        process.cwd(),
        "public/music",
        item.fileLink
      );
      const sourceCoverPath = item.coverArt
        ? path.join(process.cwd(), "public/cover", item.coverArt)
        : null;

      if (!fs.existsSync(sourceMusicPath)) {
        throw new Error(`Source music file not found: ${sourceMusicPath}`);
      }

      // 3. Slug and Filenames
      const artistSlug = slugify(artistEn || artistName);
      const titleSlug = slugify(item.titleEN || item.title);
      const baseFilename = `${artistSlug}-${titleSlug}`;

      let finalBaseName = baseFilename;
      let counter = 1;
      while (
        fs.existsSync(path.join(targetMp3Dir, `${finalBaseName}-128.mp3`)) ||
        fs.existsSync(path.join(targetMp3Dir, `${finalBaseName}-320.mp3`))
      ) {
        finalBaseName = `${baseFilename}-${counter}`;
        counter++;
      }

      const filenameCoverArt = `${finalBaseName}.jpg`;
      const filename64 = `${finalBaseName}-64.mp3`;
      const filename128 = `${finalBaseName}-128.mp3`;
      const filename320 = `${finalBaseName}-320.mp3`;

      const path64 = path.join(targetMp3Dir, filename64);
      const path128 = path.join(targetMp3Dir, filename128);
      const path320 = path.join(targetMp3Dir, filename320);

      const songSlug = await getUniqueSongSlug(
        prisma,
        `${artistEn}-${item.titleEN || item.title}`
      );

      // 4. Metadata Preparation
      const year = item.date ? new Date(item.date).getFullYear() : 0;
      const metadataArgs = [
        `-metadata title="${item.title.replace(/"/g, '\\"')}"`,
        `-metadata comment="${process.env.NEXT_PUBLIC_DEPLOYED_URL || ""}"`,
        `-metadata artist="${artistName.replace(/"/g, '\\"')}"`,
        `-metadata album_artist="${artistName.replace(/"/g, '\\"')}"`,
        item.album
          ? `-metadata album="${item.album.replace(/"/g, '\\"')}"`
          : "",
        year ? `-metadata date="${year}"` : "",
      ]
        .filter(Boolean)
        .join(" ");

      const hasCover = sourceCoverPath && fs.existsSync(sourceCoverPath);
      const coverArgs = hasCover
        ? `-i "${sourceCoverPath}" -map 0:a -map 1:v -c:v copy -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)"`
        : "-map 0:a";

      // 5. FFmpeg Processing
      console.log(`   - Generating variants for ${finalBaseName}...`);

      // Get duration first
      const metadata = await parseFile(sourceMusicPath);
      const duration = Math.round(
        metadata.format.duration || item.duration || 0
      );

      // Generate variants
      await execAsync(
        `ffmpeg -i "${sourceMusicPath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 64k -y "${path64}"`
      );
      await execAsync(
        `ffmpeg -i "${sourceMusicPath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 128k -y "${path128}"`
      );
      await execAsync(
        `ffmpeg -i "${sourceMusicPath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 320k -y "${path320}"`
      );

      // 6. Album Handling
      let albumId = null;
      if (item.album) {
        let albumRecord = await prisma.album.findFirst({
          where: {
            name: item.album.trim(),
            artistId: artistRecord.id,
          },
        });

        if (!albumRecord) {
          albumRecord = await prisma.album.create({
            data: {
              name: item.album.trim(),
              artistName: artistName.trim(),
              artistNameEn: artistEn,
              artistId: artistRecord.id,
              userId: userId,
              coverArt: hasCover
                ? `/assets/cover/${filenameCoverArt}`
                : "/images/cover.png",
              releaseDate: year,
              isActive: true,
            },
          });
          console.log(`   💿 Created new album: ${item.album}`);
        }
        albumId = albumRecord.id;
      }

      // 7. Create Song Record
      const currentSongCount = await prisma.song.count();

      const song = await prisma.song.create({
        data: {
          index: currentSongCount,
          title: item.title,
          titleEn: item.titleEN || "",
          artist: artistName.trim(),
          artistEn: artistEn,
          artists: {
            connect: [{ id: artistRecord.id }],
          },
          albumName: item.album || "",
          albumId: albumId,
          year: year,
          duration: duration,
          slug: songSlug,
          userId: userId,
          isActive: true,
          filename: filename128,
          uri: `/assets/mp3/${filename128}`,
          coverArt: hasCover
            ? `/assets/cover/${filenameCoverArt}`
            : "/images/cover.png",
          lyrics: item.lyrics || "",
          contributors: {
            create: [
              { userId: userId, type: "add", percentage: 100 },
              ...(item.lyrics
                ? [{ userId: userId, type: "lyrics", percentage: 100 }]
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

      // Generate OGG Preview (30s)
      const startingPoint =
        (duration / 2 + 30 > duration ? 0 : duration / 2) || 0;

      const filenameOgg = `${song.id}.ogg`;
      const pathOgg = path.join(targetOggDir, filenameOgg);
      await execAsync(
        `ffmpeg -i "${sourceMusicPath}" -ss ${startingPoint} -t 30 -c:a libvorbis -b:a 64k -y "${pathOgg}"`
      );

      // 6. Update Song with Final Links
      const stats64 = await stat(path64);
      const stats128 = await stat(path128);
      const stats320 = await stat(path320);

      await prisma.song.update({
        where: { id: song.id },
        data: {
          ogg: `/assets/ogg/${filenameOgg}`,
          links: {
            64: {
              url: `/assets/mp3/${filename64}`,
              size: formatFileSize(stats64.size),
              bytes: stats64.size,
            },
            128: {
              url: `/assets/mp3/${filename128}`,
              size: formatFileSize(stats128.size),
              bytes: stats128.size,
            },
            320: {
              url: `/assets/mp3/${filename320}`,
              size: formatFileSize(stats320.size),
              bytes: stats320.size,
            },
          },
        },
      });

      // 7. Finalize Cover Art
      if (hasCover) {
        const destCoverPath = path.join(targetCoverDir, filenameCoverArt);
        // Copy cover art to assets/cover
        fs.copyFileSync(sourceCoverPath, destCoverPath);
      }

      console.log(`   ✅ Successfully imported ${item.title}`);
      importedCount++;
    } catch (error) {
      console.error(
        `   ❌ Error importing song "${item.title}":`,
        error.message
      );
      errored.push({ song: item, error: error.message });
      skippedCount++;
    }
  }

  console.log("\n--- Import Summary ---");
  console.log(`🎉 Successfully imported: ${importedCount}`);
  console.log(`⏭️ Skipped: ${skippedCount}`);
  console.log(`🏁 Total processed: ${songsData.length}`);

  if (errored.length > 0) {
    fs.writeFileSync("./errored-2.json", JSON.stringify(errored, null, 2));
    console.log(`📝 Error details saved to errored-2.json`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
