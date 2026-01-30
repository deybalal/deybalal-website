import { prisma } from "./prisma";
import { getStringSimilarity } from "./utils";

interface SimilarSongParams {
  title: string;
  artistIds: string[];
  genreIds: string[];
}

export async function findSimilarSongs({
  title,
  artistIds,
  genreIds,
}: SimilarSongParams) {
  // Use a set to collect unique song IDs
  const similarSongIds = new Set<string>();

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
