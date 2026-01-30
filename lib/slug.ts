import { prisma } from "./prisma";
import { slugify } from "./utils";

/**
 * Generates a unique slug for a song.
 * If the original slug exists, appends a counter (e.g., -1, -2).
 *
 * @param baseText The text to slugify (e.g., "Artist - Title") or a pre-defined slug.
 * @returns A unique slug string.
 */
export async function getUniqueSongSlug(baseText: string): Promise<string> {
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
