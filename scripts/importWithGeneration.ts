import fs from "fs";
import path from "path";
import "dotenv/config";
import { stat, mkdir } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { applyWatermark } from "../lib/image-utils";

const execAsync = promisify(exec);

// --- Helpers ---

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

function slugify(text: string): string {
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

// --- Main Script ---
async function main() {
  console.log("🚀 Starting Advanced Bulk Song Generation & Update...");

  // 1. Get JSON file paths
  const jsonPath = path.join(process.cwd(), "songsMinified.json");
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
  console.log(`📂 Loaded ${songsData.length} items from songsMinified.json.`);

  const artistsData = JSON.parse(fs.readFileSync(artistsJsonPath, "utf-8"));
  console.log(`📂 Loaded ${artistsData.length} items from artists.json.`);

  // Ensure target directories exist (in public/assets)
  const targetMp3Dir = path.join(process.cwd(), "public/assets/mp3");
  const targetOggDir = path.join(process.cwd(), "public/assets/ogg");
  const targetCoverDir = path.join(process.cwd(), "public/assets/cover");

  await mkdir(targetMp3Dir, { recursive: true });
  await mkdir(targetOggDir, { recursive: true });
  await mkdir(targetCoverDir, { recursive: true });

  let processedCount = 0;
  const errored: any[] = [];
  const processedSlugs = new Set<string>();

  for (const song of songsData) {
    console.log(`\n🎵 Processing: ${song.title} (${song.titleEn})`);
    try {
      // 1. Artist Matching
      const artist = artistsData.find(
        (a: any) =>
          (song.artist &&
            (a.name === song.artist || a.nameEn === song.artist)) ||
          (song.artistEn &&
            (a.name === song.artistEn || a.nameEn === song.artistEn))
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
      const filename128 = `${uniqueSlug}-128.mp3`;
      const filenameOgg = `${song.id}.ogg`;
      const filenameCover = `${uniqueSlug}.jpg`;

      const sourceMusicPath = path.join(process.cwd(), song.tempFilename);
      const path128 = path.join(targetMp3Dir, filename128);
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
            `   - Generating cover art from ${artist.name}'s photo...`
          );
          const success = await applyWatermark(
            sourceArtistImg,
            pathCover,
            song.artist,
            song.title
          );
          if (success) {
            song.coverArt = `/assets/cover/${filenameCover}`;
          }
        } else {
          console.warn(
            `   ⚠️ Artist image not found on disk: ${sourceArtistImg}`
          );
        }
      }

      // 5. FFmpeg Processing (128kbps MP3 and OGG)
      console.log(`   - Generating 128kbps MP3 and OGG preview...`);

      // 128kbps MP3 (No metadata assignment needed per user request, but usually good to have. Keeping it simple as requested)
      // The user didn't specify metadata, but the old script had it. I'll omit complex metadata for now to focus on the core task.
      await execAsync(
        `ffmpeg -i "${sourceMusicPath}" -b:a 128k -y "${path128}"`
      );

      // OGG Preview (30s)
      await execAsync(
        `ffmpeg -i "${sourceMusicPath}" -t 30 -c:a libvorbis -b:a 64k -y "${pathOgg}"`
      );

      // 6. Update song metadata and links
      const stats128 = await stat(path128);

      song.uri = `/assets/mp3/${filename128}`;
      song.filename = filename128;
      song.ogg = `/assets/ogg/${filenameOgg}`;

      if (song.links) {
        for (const key in song.links) {
          if (song.links[key] && song.links[key].url) {
            const originalUrl = song.links[key].url;
            const urlParts = originalUrl.split("/");
            urlParts[urlParts.length - 1] = filename128;
            song.links[key].url = urlParts.join("/");
            song.links[key].bytes = stats128.size;
            song.links[key].size = formatFileSize(stats128.size);
          }
        }
      }

      processedCount++;
      if (processedCount % 5 === 0) {
        console.log(`✅ Processed ${processedCount} songs...`);
      }
    } catch (error: any) {
      console.error(`❌ Error processing song "${song.title}":`, error.message);
      errored.push({ id: song.id, title: song.title, error: error.message });
    }
  }

  // 7. Save Results
  fs.writeFileSync(jsonPath, JSON.stringify(songsData, null, 2));
  console.log(`\n💾 Updated songs data saved to ${jsonPath}`);

  if (errored.length > 0) {
    const errorFilePath = path.join(process.cwd(), "scripts/errored.json");
    fs.writeFileSync(errorFilePath, JSON.stringify(errored, null, 2));
    console.log(`📝 ${errored.length} errors logged to ${errorFilePath}`);
  }

  console.log("\n--- Process Summary ---");
  console.log(`🎉 Successfully processed: ${processedCount}`);
  console.log(`🏁 Total songs attempted: ${songsData.length}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
