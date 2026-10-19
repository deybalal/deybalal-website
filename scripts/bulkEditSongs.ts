import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

async function main() {
  console.log("🚀 Starting Bulk Song Artist Update...");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined in .env");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const songs = await prisma.song.findMany({
      include: {
        artists: {
          select: {
            name: true,
            nameEn: true,
          },
        },
      },
    });

    console.log(`🔍 Found ${songs.length} songs to process.`);

    let updatedCount = 0;

    for (const song of songs) {
      if (song.artists.length === 0) {
        console.log(
          `⚠️ Skipping song "${song.title}" (ID: ${song.id}) - No linked artists.`
        );
        continue;
      }

      const artistNames = song.artists.map((a) => a.name).join(" و ");
      const artistEnNames = song.artists
        .map((a) => a.nameEn)
        .filter(Boolean)
        .join(", ");

      // Only update if there's a change to avoid unnecessary DB writes
      if (song.artist !== artistNames || song.artistEn !== artistEnNames) {
        await prisma.song.update({
          where: { id: song.id },
          data: {
            artist: artistNames,
            artistEn: artistEnNames,
          },
        });
        updatedCount++;
        if (updatedCount % 50 === 0) {
          console.log(`⏳ Progress: Updated ${updatedCount} songs...`);
        }
      }
    }

    console.log(`✅ Success! Updated ${updatedCount} songs.`);
  } catch (error) {
    console.error("❌ Error during bulk update:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
