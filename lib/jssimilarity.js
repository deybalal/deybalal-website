import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

export const getStringSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;
  // Create a matrix for dynamic programming
  const matrix = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
};

export async function findSimilarSongs({ title, artistIds, genreIds }) {
  // Use a set to collect unique song IDs
  const similarSongIds = new Set();

  // 1. Recent songs from the same artists (Top 5)
  if (artistIds.length > 0) {
    const recentSongsByArtist = await prisma.song.findMany({
      where: {
        artists: { some: { id: { in: artistIds } } },
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true },
    });
    recentSongsByArtist.forEach((s) => similarSongIds.add(s.id));
  }

  // 2. Most popular songs from the same genres (Top 5)
  if (genreIds.length > 0) {
    const popularSongsByGenre = await prisma.song.findMany({
      where: {
        genres: { some: { id: { in: genreIds } } },
        isActive: true,
      },
      orderBy: { playCount: "desc" },
      take: 5,
      select: { id: true },
    });
    popularSongsByGenre.forEach((s) => similarSongIds.add(s.id));
  }

  // 3. Similar name (Fuzzy search)
  // We'll fetch a batch of active songs and filter by similarity
  // To be efficient, we might want to narrow this down or use a database feature,
  // but for a small/medium DB, fetching titles and checking in memory is fine.
  // We can fetch songs that share at least one word in the title if possible, or just latest 100.
  const candidateSongs = await prisma.song.findMany({
    where: { isActive: true },
    select: { id: true, title: true, titleEn: true },
    take: 500, // Reasonable limit for in-memory fuzzy matching
  });

  const SIMILARITY_THRESHOLD = 0.5;
  const fuzzyMatches = candidateSongs
    .map((song) => ({
      id: song.id,
      similarity: Math.max(
        getStringSimilarity(title, song.title),
        song.titleEn ? getStringSimilarity(title, song.titleEn) : 0
      ),
    }))
    .filter((match) => match.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);

  fuzzyMatches.forEach((m) => similarSongIds.add(m.id));

  // Remove the current song if we are in an update context (though here it's on create, so shouldn't have ID yet)
  // or if we found it by accident.

  // Return the top 10 unique IDs
  const finalIds = Array.from(similarSongIds).slice(0, 10);

  if (finalIds.length === 0) return [];

  return finalIds.map((id) => ({ id }));
}
