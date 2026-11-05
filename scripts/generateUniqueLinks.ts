import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma.ts";

// ==========================================
// Helper String Functions
// ==========================================
function normalizePersian(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[آإأ]/g, "ا")
    .replace(/[ةۀ]/g, "ه")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[-_–—]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEn(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Splits an artist string containing multiple collaborators separated by:
 * - Persian " و " (with surrounding whitespace/half-spaces)
 * - English " and ", " & ", " feat ", " ft "
 * - Commas (Persian "،" or English ",") or slashes "/"
 */
function splitArtistNames(raw: string): string[] {
  if (!raw) return [];
  const cleaned = raw
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return [];

  const parts = cleaned
    .split(/\s+و\s+|\s+(?:and|&|feat\.?|ft\.?)\s+|[\s]*[,،/]+[\s]*/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return parts.length > 0 ? parts : [cleaned];
}

function cleanTitle(text: string): string {
  if (!text) return "";
  return normalizePersian(text)
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/[-_–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getStringSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

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
  return 1 - distance / Math.max(len1, len2);
}

interface MergeSongItem {
  artistName?: string;
  title: string;
  titleEn?: string;
  link: string;
  duration?: number;
  id?: string;
}

interface MergeGroup {
  artist: string;
  artistEn: string;
  data: MergeSongItem[];
}

interface DbArtist {
  id: string;
  name: string;
  nameEn: string | null;
}

interface DbSong {
  id: string;
  title: string;
  titleEn: string | null;
  artist: string;
  artistEn: string | null;
  duration: number;
  artists: { id: string; name: string; nameEn: string | null }[];
}

// ==========================================
// Artist Matcher
// ==========================================
function resolveArtistsFromString(
  rawText: string | null | undefined,
  dbArtists: DbArtist[]
): DbArtist[] {
  if (!rawText || !rawText.trim()) return [];

  // 1. Exact match on whole string (Persian)
  const normPersian = normalizePersian(rawText);
  if (normPersian) {
    const exactMatch = dbArtists.find(
      (a) => normalizePersian(a.name) === normPersian
    );
    if (exactMatch) return [exactMatch];
  }

  // 2. Exact match on whole string (English)
  const normEn = normalizeEn(rawText);
  if (normEn) {
    const exactEnMatch = dbArtists.find(
      (a) => a.nameEn && normalizeEn(a.nameEn) === normEn
    );
    if (exactEnMatch) return [exactEnMatch];
  }

  // 3. Split by collaboration delimiters (" و ", " & ", " and ", " feat ", " ft ", ",", "/")
  const parts = splitArtistNames(rawText);
  if (parts.length <= 1 && parts[0] === rawText.trim()) {
    return [];
  }

  const matched: DbArtist[] = [];
  for (const part of parts) {
    const pNorm = normalizePersian(part);
    const pNormEn = normalizeEn(part);

    let found: DbArtist | undefined;
    if (pNorm) {
      found = dbArtists.find((a) => normalizePersian(a.name) === pNorm);
    }
    if (!found && pNormEn) {
      found = dbArtists.find(
        (a) => a.nameEn && normalizeEn(a.nameEn) === pNormEn
      );
    }

    if (found && !matched.some((m) => m.id === found!.id)) {
      matched.push(found);
    }
  }

  return matched;
}

function findArtistsInDb(
  group: MergeGroup,
  song: MergeSongItem,
  dbArtists: DbArtist[]
): DbArtist[] {
  // 1. Check song.artistName
  if (song.artistName) {
    const songMatches = resolveArtistsFromString(song.artistName, dbArtists);
    if (songMatches.length > 0) {
      return songMatches;
    }
  }

  // 2. Check group.artist
  if (group.artist) {
    const groupMatches = resolveArtistsFromString(group.artist, dbArtists);
    if (groupMatches.length > 0) {
      return groupMatches;
    }
  }

  // 3. Check group.artistEn
  if (group.artistEn) {
    const groupEnMatches = resolveArtistsFromString(group.artistEn, dbArtists);
    if (groupEnMatches.length > 0) {
      return groupEnMatches;
    }
  }

  return [];
}

function findArtistInDb(
  group: MergeGroup,
  song: MergeSongItem,
  dbArtists: DbArtist[]
): DbArtist | null {
  const artists = findArtistsInDb(group, song, dbArtists);
  return artists[0] || null;
}

function findExistingSongInDb(
  song: MergeSongItem,
  matchedArtistsOrArtist: DbArtist[] | DbArtist | null,
  dbSongs: DbSong[]
): DbSong | null {
  if (song.id) {
    const foundById = dbSongs.find((d) => d.id === song.id);
    if (foundById) return foundById;
  }

  const sTitleClean = cleanTitle(song.title);
  const sTitleEnClean = normalizeEn(song.titleEn || "");
  const sDuration = song.duration || 0;

  const matchedArtists = matchedArtistsOrArtist
    ? Array.isArray(matchedArtistsOrArtist)
      ? matchedArtistsOrArtist
      : [matchedArtistsOrArtist]
    : [];
  const matchedArtistIds = new Set(matchedArtists.map((a) => a.id));
  const matchedArtistNames = matchedArtists.map((a) =>
    normalizePersian(a.name)
  );

  const candidates =
    matchedArtists.length > 0
      ? dbSongs.filter(
          (d) =>
            d.artists.some((a) => matchedArtistIds.has(a.id)) ||
            matchedArtistNames.some((name) =>
              normalizePersian(d.artist).includes(name)
            )
        )
      : dbSongs;

  function testMatch(d: DbSong): boolean {
    const dTitleClean = cleanTitle(d.title);
    const dTitleEnClean = normalizeEn(d.titleEn || "");
    const dDuration = d.duration || 0;
    const durationDiff = Math.abs(dDuration - sDuration);

    if (sTitleClean && dTitleClean === sTitleClean) return true;
    if (
      sTitleEnClean &&
      dTitleEnClean &&
      sTitleEnClean.length >= 3 &&
      dTitleEnClean === sTitleEnClean
    )
      return true;

    if (
      (sTitleClean && dTitleEnClean && sTitleClean === dTitleEnClean) ||
      (sTitleEnClean && dTitleClean && sTitleEnClean === dTitleClean)
    )
      return true;

    if (durationDiff <= 7 && sTitleClean && dTitleClean) {
      const sim = getStringSimilarity(sTitleClean, dTitleClean);
      if (sim >= 0.75) return true;
      if (sTitleEnClean && dTitleEnClean) {
        const simEn = getStringSimilarity(sTitleEnClean, dTitleEnClean);
        if (simEn >= 0.8) return true;
      }
    }

    if (
      durationDiff <= 5 &&
      sTitleClean.length >= 4 &&
      dTitleClean.length >= 4 &&
      (sTitleClean.includes(dTitleClean) || dTitleClean.includes(sTitleClean))
    ) {
      return true;
    }

    return false;
  }

  for (const cand of candidates) {
    if (testMatch(cand)) return cand;
  }

  if (sTitleClean) {
    for (const d of dbSongs) {
      if (
        cleanTitle(d.title) === sTitleClean &&
        Math.abs(d.duration - sDuration) <= 4
      ) {
        return d;
      }
    }
  }

  return null;
}

async function main() {
  console.log("==========================================================");
  console.log("       Extract Unique Links of Songs Not in Database      ");
  console.log("==========================================================\n");

  const mergeJsonPath = path.join(process.cwd(), "data", "merge.json");
  const outputTxtPath = path.join(process.cwd(), "data", "uniqueLinks.txt");

  if (!fs.existsSync(mergeJsonPath)) {
    console.error(`❌ Error: merge.json not found at ${mergeJsonPath}`);
    process.exit(1);
  }

  console.log("⏳ Loading database artists and songs...");
  const dbArtists: DbArtist[] = await prisma.artist.findMany({
    select: { id: true, name: true, nameEn: true },
  });
  const dbSongs: DbSong[] = await prisma.song.findMany({
    select: {
      id: true,
      title: true,
      titleEn: true,
      artist: true,
      artistEn: true,
      duration: true,
      artists: { select: { id: true, name: true, nameEn: true } },
    },
  });
  console.log(
    `✅ Loaded ${dbArtists.length} artists and ${dbSongs.length} songs from DB.\n`
  );

  const mergeData: MergeGroup[] = JSON.parse(
    fs.readFileSync(mergeJsonPath, "utf-8")
  );

  let totalSongs = 0;
  let alreadyInDbCount = 0;
  let notInDbWithArtist = 0;
  let notInDbMissingArtist = 0;

  const uniqueLinksSet = new Set<string>();
  const withArtistLinksSet = new Set<string>();

  const missingArtistJsonPath = path.join(
    process.cwd(),
    "data",
    "missingArtist.json"
  );
  const rootTxtPath = path.join(process.cwd(), "uniqueLinks.txt");

  // Track missing artists
  const missingArtistsMap = new Map<
    string,
    {
      artist: string;
      artistEn: string;
      name: string;
      nameEn: string;
      songsCount: number;
    }
  >();

  for (const group of mergeData) {
    const groupMatchedArtists = findArtistsInDb(
      group,
      {
        title: "",
        link: "",
      },
      dbArtists
    );

    if (groupMatchedArtists.length === 0) {
      const key =
        normalizePersian(group.artist) ||
        normalizeEn(group.artistEn) ||
        group.artist;
      if (!missingArtistsMap.has(key)) {
        missingArtistsMap.set(key, {
          artist: group.artist,
          artistEn: group.artistEn,
          name: group.artist,
          nameEn: group.artistEn,
          songsCount: group.data.length,
        });
      }
    }

    for (const song of group.data) {
      totalSongs++;
      if (!song.link || !song.link.trim()) continue;

      const trimmedLink = song.link.trim();
      const matchedArtists = findArtistsInDb(group, song, dbArtists);
      const existingMatch = findExistingSongInDb(song, matchedArtists, dbSongs);

      if (existingMatch) {
        alreadyInDbCount++;
      } else {
        uniqueLinksSet.add(trimmedLink);
        if (matchedArtists.length > 0) {
          notInDbWithArtist++;
          withArtistLinksSet.add(trimmedLink);
        } else {
          notInDbMissingArtist++;
          // If song has a specific artistName that wasn't matched
          if (song.artistName) {
            const key = normalizePersian(song.artistName) || song.artistName;
            if (!missingArtistsMap.has(key)) {
              missingArtistsMap.set(key, {
                artist: song.artistName,
                artistEn: group.artistEn || "",
                name: song.artistName,
                nameEn: group.artistEn || "",
                songsCount: 1,
              });
            }
          }
        }
      }
    }
  }

  const missingArtistsArray = Array.from(missingArtistsMap.values());
  fs.writeFileSync(
    missingArtistJsonPath,
    JSON.stringify(missingArtistsArray, null, 2),
    "utf-8"
  );

  console.log("----------------- Analysis Results -----------------");
  console.log(`Total songs evaluated:            ${totalSongs}`);
  console.log(`Songs already in database:        ${alreadyInDbCount}`);
  console.log(
    `Songs not in DB (Artist exists):  ${notInDbWithArtist} (${withArtistLinksSet.size} unique links)`
  );
  console.log(`Songs not in DB (Artist missing): ${notInDbMissingArtist}`);
  console.log(`Total unique links to download:   ${uniqueLinksSet.size}`);
  console.log(
    `Missing artists identified:       ${missingArtistsArray.length}`
  );
  console.log("----------------------------------------------------\n");

  // Write all unique links not in DB (one per line)
  const linksArray = Array.from(uniqueLinksSet);
  const linksContent = linksArray.join("\n") + "\n";
  fs.writeFileSync(outputTxtPath, linksContent, "utf-8");
  fs.writeFileSync(rootTxtPath, linksContent, "utf-8");

  console.log(`🎉 Successfully saved ${linksArray.length} unique links to:`);
  console.log(`   👉 ${outputTxtPath}`);
  console.log(`   👉 ${rootTxtPath}\n`);

  console.log(
    `🎨 Successfully saved ${missingArtistsArray.length} missing artists to:`
  );
  console.log(`   👉 ${missingArtistJsonPath}\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Fatal error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
