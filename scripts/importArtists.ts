import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs/promises";
import path from "path";
import "dotenv/config";

interface ArtistJson {
  id: string;
  name: string;
  nameEn?: string;
  image?: string;
  isVerified?: boolean;
  description?: string;
  ig?: string;
  followers?: string | number | null;
}

function parseFollowers(
  value: string | number | null | undefined
): number | null {
  if (!value) return null;

  const str = String(value).trim().toUpperCase();

  if (str.endsWith("K")) {
    return Math.round(parseFloat(str.slice(0, -1)) * 1000);
  }

  if (str.endsWith("M")) {
    return Math.round(parseFloat(str.slice(0, -1)) * 1000000);
  }

  const num = Number(str.replace(/[^\d]/g, ""));

  return Number.isFinite(num) ? num : null;
}

function normalizeString(value: string | null | undefined): string | null {
  const v = value?.trim();

  return v ? v : null;
}

async function main() {
  console.log("🚀 Starting Artist Import...");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const inputPath = path.join(process.cwd(), "scripts", "artists.json");

  const failedArtists: unknown[] = [];

  try {
    const raw = await fs.readFile(inputPath, "utf8");
    const artists: ArtistJson[] = JSON.parse(raw);

    console.log(`📂 Loaded ${artists.length} artists`);

    let updated = 0;
    let unchanged = 0;
    let notFound = 0;
    let errors = 0;

    for (const artist of artists) {
      try {
        if (!artist.id) {
          console.warn(`⚠️ Skipping artist without id: ${artist.name}`);
          continue;
        }

        const dbArtist = await prisma.artist.findUnique({
          where: {
            id: artist.id,
          },
        });

        if (!dbArtist) {
          notFound++;

          failedArtists.push({
            reason: "NOT_FOUND",
            artist,
          });

          continue;
        }

        const newData = {
          name: artist.name,
          nameEn: normalizeString(artist.nameEn),
          image: normalizeString(artist.image),
          isVerified: artist.isVerified ?? false,
          description: normalizeString(artist.description),
          ig: normalizeString(artist.ig),
          igFollowers: parseFollowers(artist.followers),
        };

        const updates: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(newData)) {
          const currentValue = (dbArtist as Record<string, unknown>)[key];

          if (currentValue !== value) {
            updates[key] = value;
          }
        }

        if (Object.keys(updates).length === 0) {
          unchanged++;
          continue;
        }

        await prisma.artist.update({
          where: {
            id: artist.id,
          },
          data: updates,
        });

        console.log(`✅ ${artist.name} -> ${Object.keys(updates).join(", ")}`);

        updated++;
      } catch (error) {
        errors++;

        console.error(`❌ Failed artist: ${artist.name}`, error);

        failedArtists.push({
          reason: "ERROR",
          artist,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log("\n📊 Import Summary");
    console.log(`Updated:   ${updated}`);
    console.log(`Unchanged: ${unchanged}`);
    console.log(`Not found: ${notFound}`);
    console.log(`Errors:    ${errors}`);
  } finally {
    await prisma.$disconnect();

    await fs.writeFile(
      path.join(process.cwd(), "scripts", "artistsErrors.json"),
      JSON.stringify(failedArtists, null, 2),
      "utf8"
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
