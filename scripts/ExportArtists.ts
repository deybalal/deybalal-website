import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import fs from "fs/promises";
import path from "path";
import "dotenv/config";

async function main() {
  console.log("🚀 Starting Artist Export...");

  const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  try {
    const artists = await prisma.artist.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        nameEn: true,
        image: true,
        isVerified: true,
        description: true,
      },
    });

    const outputPath = path.join(process.cwd(), "scripts", "artists.json");
    await fs.writeFile(outputPath, JSON.stringify(artists, null, 2), "utf-8");

    console.log(`✅ Exported ${artists.length} artists to ${outputPath}`);
  } catch (error) {
    console.error("❌ Error exporting artists:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
