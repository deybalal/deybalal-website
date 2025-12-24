import { prisma } from "./prisma";
import { diffWords } from "diff";

export async function updateContributorPercentages({
  songId,
  userId,
  type,
  newContent,
  tx,
}: {
  songId: string;
  userId: string;
  type: "lyrics" | "sync";
  newContent: string;
  tx?: Omit<
    import("@prisma/client").PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
  >;
}) {
  const prismaClient = tx || prisma;

  // 1. Get the song to find old content
  const song = await prismaClient.song.findUnique({
    where: { id: songId },
    select: { lyrics: true, syncedLyrics: true },
  });

  if (!song) return;

  const oldContent = type === "lyrics" ? song.lyrics : song.syncedLyrics;

  // 2. Get existing contributors for this type
  const existingContributors = await prismaClient.contributor.findMany({
    where: { songId, type },
  });

  // Normalize content for better diffing
  const normalize = (text: string | null | undefined) =>
    (text || "").replace(/\r\n/g, "\n").trim();

  const normalizedOld = normalize(oldContent);
  const normalizedNew = normalize(newContent);

  // 3. If no old content or no contributors, current user gets 100%
  if (!normalizedOld || existingContributors.length === 0) {
    await prismaClient.contributor.upsert({
      where: {
        songId_userId_type: {
          songId,
          userId,
          type,
        },
      },
      update: { percentage: 100 },
      create: {
        songId,
        userId,
        type,
        percentage: 100,
      },
    });

    // Ensure others of the same type are set to 0
    await prismaClient.contributor.updateMany({
      where: {
        songId,
        type,
        userId: { not: userId },
      },
      data: { percentage: 0 },
    });
    return;
  }

  // 4. Calculate word-level diff
  const diff = diffWords(normalizedOld, normalizedNew);

  let totalWords = 0;
  const wordCounts: Record<string, number> = {};

  // Initialize word counts for all existing contributors
  for (const c of existingContributors) {
    wordCounts[c.userId] = 0;
  }
  // Ensure current user is in wordCounts
  if (!wordCounts[userId]) {
    wordCounts[userId] = 0;
  }

  for (const part of diff) {
    if (part.removed) continue; // Ignore removed parts for the new version

    const count = part.value.trim().split(/\s+/).filter(Boolean).length;
    if (count === 0) continue;

    totalWords += count;

    if (part.added) {
      // New words belong to the current editor
      wordCounts[userId] += count;
    } else {
      // Unchanged words are shared among previous contributors based on their percentage
      for (const c of existingContributors) {
        wordCounts[c.userId] += count * (c.percentage / 100);
      }
    }
  }

  if (totalWords === 0) return;

  // 5. Update percentages in database
  const userIds = Object.keys(wordCounts);
  let remainingPercentage = 100;

  for (let i = 0; i < userIds.length; i++) {
    const uId = userIds[i];
    let percentage = Math.round((wordCounts[uId] / totalWords) * 100);

    // Ensure total is exactly 100 by adjusting the last one
    if (i === userIds.length - 1) {
      percentage = remainingPercentage;
    } else {
      remainingPercentage -= percentage;
    }

    if (percentage > 0) {
      await prismaClient.contributor.upsert({
        where: {
          songId_userId_type: {
            songId,
            userId: uId,
            type,
          },
        },
        update: { percentage },
        create: {
          songId,
          userId: uId,
          type,
          percentage,
        },
      });
    } else {
      // Keep at 0 to show they once contributed
      await prismaClient.contributor.updateMany({
        where: {
          songId,
          userId: uId,
          type,
        },
        data: { percentage: 0 },
      });
    }
  }
}
