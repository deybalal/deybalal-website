import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import fs from "fs/promises";
import path from "path";
import "dotenv/config";

async function main() {
  console.log("🚀 Starting Song Export...");

  const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  try {
    const songs = await prisma.song.findMany({
      orderBy: { index: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        artist: true,
        artistEn: true,
        albumName: true,
        coverArt: true,
        year: true,
        duration: true,
        uri: true,
        filename: true,
        index: true,
        lyrics: true,
        syncedLyrics: true,
        playCount: true,
        isDisabled: true,
        disabledDescription: true,
        isActive: true,
        isFeatured: true,
        albumId: true,
        userId: true,
        lyricsSource: true,
        lyricsSourceUrl: true,
        links: true,
        ogg: true,
      },
    });

    const outputPath = path.join(process.cwd(), "scripts", "songs.json");
    await fs.writeFile(outputPath, JSON.stringify(songs, null, 2), "utf-8");

    console.log(`✅ Exported ${songs.length} songs to ${outputPath}`);
  } catch (error) {
    console.error("❌ Error exporting songs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
