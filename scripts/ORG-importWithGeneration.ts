import fs from "fs";
import path from "path";
import { stat, mkdir } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { parseFile } from "music-metadata";

const execAsync = promisify(exec);

// --- Helpers ---
const timer = (ms: number | undefined) =>
  new Promise((res) => setTimeout(res, ms));

export async function applyWatermark(
  inputSource: string | Buffer,
  outputPath: string,
  artistName: string,
  songTitle: string
) {
  const appName = "دی بلال";

  try {
    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const image = sharp(inputSource);
    const metadata = await image.metadata();

    // Scale font sizes based on image dimensions
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    const appNameFontSize = Math.round(width * 0.05);
    const detailsFontSize = Math.round(width * 0.035);

    // Create SVG watermark overlay
    const svgOverlay = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="topGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="black" stop-opacity="0.6" />
            <stop offset="100%" stop-color="black" stop-opacity="0" />
           </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="${Math.max(
              2,
              width / 200
            )}" />
            <feOffset dx="0" dy="0" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.8" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <!-- Backdrop gradient for better readability on bright backgrounds -->
        <rect width="${width}" height="${Math.round(
      height * 0.25
    )}" fill="url(#topGradient)" />
        <style>
          .text { 
            fill: white; 
            font-family: "Vazir", "Tahoma", "Arial", sans-serif; 
            font-weight: bold;
            filter: url(#shadow);
            paint-order: stroke fill;
            stroke: rgba(0,0,0,0.5);
            stroke-width: ${Math.max(1, width / 500)}px;
          }
          .app-name { font-size: ${appNameFontSize}px; }
          .details { font-size: ${detailsFontSize}px; }
        </style>
        <text x="50%" y="${Math.round(
          height * 0.07
        )}" text-anchor="middle" class="text app-name">${appName}</text>
        <text x="50%" y="${Math.round(
          height * 0.125
        )}" text-anchor="middle" class="text details">${artistName} - ${songTitle}</text>
      </svg>
    `;

    await image
      .composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0,
        },
      ])
      .jpeg({ quality: 94 })
      .toFile(outputPath);

    return true;
  } catch (error) {
    console.error("Error applying watermark:", error);
    return false;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

function slugify(text: string): string {
  if (!text) return "";
  const clean = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // spaces → -
    .replace(/[^\w\-]+/g, "") // drop non‑word chars
    .replace(/\-\-+/g, "-") // collapse multiple -
    .replace(/^-+/, "") // leading -
    .replace(/-+$/, ""); // trailing -

  /* ------------------------------------------------------------------
   * 2️⃣  Capitalise the first character of each hyphen‑separated word.
   *     Splitting on “-”, capitalising, then joining back gives us the
   *     final title‑cased slug.
   * ------------------------------------------------------------------ */
  const titleCased = clean
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");

  return titleCased;
}

// --- Main Script ---
async function main() {
  console.log("🚀 Starting Advanced Bulk Song Generation & Update...");

  // 1. Get JSON file paths
  const jsonPath = path.join(process.cwd(), "songs.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: JSON file not found at ${jsonPath}`);
    process.exit(1);
  }

  const artistsJsonPath = path.join(process.cwd(), "artists.json");
  if (!fs.existsSync(artistsJsonPath)) {
    console.error(`❌ Error: JSON file not found at ${artistsJsonPath}`);
    process.exit(1);
  }

  const songsData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`📂 Loaded ${songsData.length} items from songs.json.`);

  const existingFiles = songsData
    .filter((item: { ogg: string; id: string }) => item.ogg)
    .map((item: { ogg: string; id: string }) => item.id);

  console.log(`📂 Existings Length: ${existingFiles.length}`);

  const artistsData = JSON.parse(fs.readFileSync(artistsJsonPath, "utf-8"));
  console.log(`📂 Loaded ${artistsData.length} items from artists.json.`);

  // Ensure target directories exist (in public/assets)
  const targetMp3Dir = path.join(process.cwd(), "public/assets/mp3");
  const targetOggDir = path.join(process.cwd(), "public/assets/ogg");
  const targetCoverDir = path.join(process.cwd(), "public/assets/cover-arts");

  await mkdir(targetMp3Dir, { recursive: true });
  await mkdir(targetOggDir, { recursive: true });
  await mkdir(targetCoverDir, { recursive: true });

  let processedCount = 0;
  const errored: any[] = [];
  const processedSlugs = new Set<string>();

  let existings = 0;

  for (const song of songsData) {
    if (existingFiles.includes(song.id)) {
      existings++;
      continue;
    }
    console.log(`\n🎵 Processing: ${song.title} (${song.titleEn})`);
    try {
      // 1. Artist Matching
      const artist = artistsData.find(
        (a: any) =>
          (song.artist &&
            (a.name === song.artist || a.nameEn === song.artist)) ||
          (song.artistEn &&
            (a.name === song.artistEn || a.nameEn === song.artistEn)) ||
          (song.artistEn.includes(" و ") &&
            song.artistEn.split(" و ")[0] === a.nameEn)
      );

      // 2. Slug Generation (artistEn-titleEn)
      const artistPart = slugify(song.artistEn || song.artist || "unknown");
      const titlePart = slugify(song.titleEn || song.title || "untitled");
      let baseSlug = `${artistPart}-${titlePart}`;
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (processedSlugs.has(uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      processedSlugs.add(uniqueSlug);
      song.slug = uniqueSlug;

      // 3. Asset Filenames
      const filename64 = `${uniqueSlug}-64.mp3`;
      const filename128 = `${uniqueSlug}-128.mp3`;
      const filename320 = `${uniqueSlug}-320.mp3`;
      const filenameOgg = `${song.id}.ogg`;
      const filenameCover = `${uniqueSlug}.jpg`;

      const sourceMusicPath = path.join(process.cwd(), song.tempFilename);
      const path64 = path.join(targetMp3Dir, filename64);
      const path128 = path.join(targetMp3Dir, filename128);
      const path320 = path.join(targetMp3Dir, filename320);
      const pathOgg = path.join(targetOggDir, filenameOgg);
      const pathCover = path.join(targetCoverDir, filenameCover);

      if (!fs.existsSync(sourceMusicPath)) {
        throw new Error(`Source music file not found: ${sourceMusicPath}`);
      }

      // 4. Generate Cover Art
      if (artist && artist.image) {
        const sourceArtistImg = path.join(
          process.cwd(),
          "public",
          artist.image
        );
        if (fs.existsSync(sourceArtistImg)) {
          console.log(
            `   - Generating cover art from ${artist.nameEn}'s photo...`
          );
          const success = await applyWatermark(
            sourceArtistImg,
            pathCover,
            song.artist,
            song.title
          );
          if (success) {
            song.coverArt = `/assets/cover-arts/${filenameCover}`;
          }
        } else {
          console.warn(
            `   ⚠️ Artist image not found on disk: ${sourceArtistImg}`
          );
        }
      }

      // 4. Metadata Preparation
      const year = song.date ? new Date(song.date).getFullYear() : 0;
      const metadataArgs = [
        `-metadata title="${song.title.replace(/"/g, '\\"')}"`,
        `-metadata comment="${process.env.NEXT_PUBLIC_DEPLOYED_URL || ""}"`,
        `-metadata artist="${song.artist.replace(/"/g, '\\"')}"`,
        `-metadata album_artist="${song.artist.replace(/"/g, '\\"')}"`,
        song.album
          ? `-metadata album="${song.album.replace(/"/g, '\\"')}"`
          : "",
        year ? `-metadata date="${year}"` : "",
      ]
        .filter(Boolean)
        .join(" ");

      const hasCover =
        song.coverArt && fs.existsSync(path.join("public", song.coverArt));
      const coverArgs = hasCover
        ? `-i "${path.join(
            "public",
            song.coverArt
          )}" -map 0:a -map 1:v -c:v copy -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)"`
        : "-map 0:a";

      // 5. FFmpeg Processing (128kbps MP3 and OGG)
      console.log(`   - Generating 128kbps MP3 and OGG preview...`);

      await execAsync(
        `ffmpeg -i "${sourceMusicPath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 64k -y "${path64}"`
      );
      await execAsync(
        `ffmpeg -i "${sourceMusicPath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 128k -y "${path128}"`
      );
      await execAsync(
        `ffmpeg -i "${sourceMusicPath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 320k -y "${path320}"`
      );

      // Get duration first
      const metadata = await parseFile(sourceMusicPath);
      const duration = Math.round(
        metadata.format.duration || song.duration || 0
      );
      const startingPoint =
        (duration / 2 + 30 > duration ? 0 : duration / 2) || 0;

      // await execAsync(
      //   `ffmpeg -i "${sourceMusicPath}" -ss ${startingPoint} -t 30 -c:a libvorbis -b:a 64k -y "${pathOgg}"`
      // );

      // const { stdout, stderr } = await execAsync(
      //   `ffmpeg -i "${sourceMusicPath}" -t 30 -c:a libvorbis -b:a 64k -y "${pathOgg}"`
      // );

      // const { stdout, stderr } = await execAsync(
      //   `ffmpeg -i "${sourceMusicPath}" -ss ${startingPoint} -t 30 -c:a libvorbis -b:a 64k -y "${pathOgg}"`
      // );
      await execAsync(
        `ffmpeg -ss ${startingPoint} -i "${path128}" -t 30 -map 0:a:0 -vn -sn -dn -c:a libvorbis -b:a 64k -y "${pathOgg}"`
      );
      // console.log("ffmpeg stdout:", stdout);
      // console.error("ffmpeg stderr:", stderr);

      // 6. Update song metadata and links
      const stats64 = await stat(path64);
      const stats128 = await stat(path128);
      const stats320 = await stat(path320);

      song.uri = `/assets/mp3/${filename128}`;
      song.filename = filename128;
      song.ogg = `/assets/ogg/${filenameOgg}`;

      // if (song.links) {
      //   for (const key in song.links) {
      //     if (song.links[key] && song.links[key].url) {
      //       const originalUrl = song.links[key].url;
      //       const urlParts = originalUrl.split("/");
      //       urlParts[urlParts.length - 1] = filename128;
      //       song.links[key].url = urlParts.join("/");
      //       song.links[key].bytes = stats128.size;
      //       song.links[key].size = formatFileSize(stats128.size);
      //     }
      //   }
      // }

      song.links = {
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
      };

      processedCount++;
      if (processedCount % 5 === 0) {
        console.log(`✅ Processed ${processedCount} songs...`);
      }
      fs.writeFileSync(jsonPath, JSON.stringify(songsData, null, 2));
      await timer(500);
    } catch (error: any) {
      console.error(`❌ Error processing song "${song.title}":`, error.message);
      errored.push({ id: song.id, title: song.title, error: error.message });
    }
  }

  // 7. Save Results
  fs.writeFileSync(jsonPath, JSON.stringify(songsData, null, 2));
  console.log(`\n💾 Updated songs data saved to ${jsonPath}`);

  if (errored.length > 0) {
    const errorFilePath = path.join(process.cwd(), "errored.json");
    fs.writeFileSync(errorFilePath, JSON.stringify(errored, null, 2));
    console.log(`📝 ${errored.length} errors logged to ${errorFilePath}`);
  }

  console.log("\n--- Process Summary ---");
  console.log(`🎉 Successfully processed: ${processedCount}`);
  console.log("Existing Songs: ", existings);

  console.log(`🏁 Total songs attempted: ${songsData.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
