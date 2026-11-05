import fs from "fs";
import path from "path";
import { stat, mkdir } from "fs/promises";
import { exec, execFile } from "child_process";
import { promisify } from "util";
import axios from "axios";
import Database from "better-sqlite3";
import { parseFile } from "music-metadata";
// import { applyWatermark } from "@/lib/image-utils";
import { findSimilarSongs } from "../lib/similarity.ts";
import { prisma } from "../lib/prisma.ts";
import { applyWatermark } from "../lib/image-utils.ts";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// ==========================================
// Configuration & Target Paths
// ==========================================
const LORI2_BASE_DIR = "H:\\Temp\\Lori2";
const TARGET_MP3_DIR = path.join(LORI2_BASE_DIR, "public", "assets", "mp3");
const TARGET_OGG_DIR = path.join(LORI2_BASE_DIR, "public", "assets", "ogg");
const TARGET_COVER_DIR = path.join(LORI2_BASE_DIR, "public", "assets", "cover");

const MERGE_JSON_PATH = path.join(process.cwd(), "data", "merge.json");
const ATTENTION_JSON_PATH = path.join(process.cwd(), "attension.json");
const ERRORED_JSON_PATH = path.join(process.cwd(), "erroredMerge.json");
// const FINGERPRINTS_JSON_PATH = path.join(process.cwd(), "fffingerprints.json");

const nonValidArtists = ["رضا موسیوند", "عباس مفتاح"];

function getFingerprintDbPath(): string {
  if (process.env.FINGERPRINTS_DB_PATH) return process.env.FINGERPRINTS_DB_PATH;
  const candidates = [
    path.join(process.cwd(), "data", "fingerprints.db"),
    path.join(process.cwd(), "data", "fingerprint.db"),
    path.join(process.cwd(), "fingerprints.db"),
    path.join(process.cwd(), "fingerprint.db"),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return path.join(process.cwd(), "data", "fingerprints.db");
}

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

// ==========================================
// Remove Artist Name & ArtistEn from Song Title (Case-Insensitive)
// ==========================================
function removeArtistFromTitle(
  title: string,
  artistNames: (string | null | undefined)[]
): string {
  if (!title) return "";
  let cleaned = title;

  // Gather unique valid artist names to remove
  const namesToRemove = new Set<string>();
  for (const rawName of artistNames) {
    if (!rawName) continue;
    const trimmed = rawName.trim();
    if (trimmed.length < 2) continue;
    namesToRemove.add(trimmed);

    // Also include split collaborator names (e.g. "A و B" -> "A", "B")
    const parts = splitArtistNames(trimmed);
    for (const part of parts) {
      const p = part.trim();
      if (p.length >= 2) {
        namesToRemove.add(p);
      }
    }
  }

  // Sort descending by length so longer names/phrases are matched and removed first
  const sortedNames = Array.from(namesToRemove).sort(
    (a, b) => b.length - a.length
  );

  for (const name of sortedNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match name allowing flexible whitespace, hyphens, underscores, dots, or ZWNJ
    // Use Unicode word boundaries so we never delete parts of unrelated words
    const pattern =
      "(?<![\\p{L}\\p{N}])" +
      escaped.replace(
        /[\s\-_.]+/g,
        "[\\s\\-_.\\u200B-\\u200D\\uFEFF\\u00A0]+"
      ) +
      "(?![\\p{L}\\p{N}])";
    const regex = new RegExp(pattern, "giu");
    cleaned = cleaned.replace(regex, " ");
  }

  // Clean empty parentheses or brackets left behind
  cleaned = cleaned
    .replace(/\(\s*\)/g, " ")
    .replace(/\[\s*\]/g, " ")
    .replace(/\{\s*\}/g, " ");

  // Remove dangling "از" or "by" at the end or beginning
  cleaned = cleaned
    .replace(/\s+(?:از|by)\s*$/giu, "")
    .replace(/^\s*(?:از|by)\s+/giu, "");

  // Collapse whitespace
  cleaned = cleaned.replace(/[\s\u200B-\u200D\uFEFF\u00A0]+/g, " ").trim();

  // Strip leading and trailing separator symbols (-, _, –, —, :, |, /, \, ., ;)
  cleaned = cleaned
    .replace(/^[\s\-_–—:|\/\\.,;]+|[\s\-_–—:|\/\\.,;]+$/g, "")
    .trim();

  // If stripping left nothing, return original title
  return cleaned.length > 0 ? cleaned : title;
}

function slugify(text: string): string {
  if (!text) return "";
  const clean = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return clean
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("-");
}

/**
 * Artist folder name in mp3:
 * whitespaces replaced with "-" and each word starts with Uppercase
 */
function formatArtistEnFolder(text: string): string {
  if (!text) return "Unknown-Artist";
  const cleaned = text
    .trim()
    .replace(/[^\w\s-]/g, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
  return cleaned || "Unknown-Artist";
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

// ==========================================
// SQLite Fingerprint DB Initialization
// ==========================================
function initSQLite(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("cache_size = -64000");
  db.pragma("temp_store = MEMORY");
  db.pragma("wal_autocheckpoint = 1000");

  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_key TEXT UNIQUE NOT NULL,
      slug TEXT,
      title TEXT NOT NULL,
      title_en TEXT,
      artist TEXT NOT NULL,
      artist_en TEXT,
      cover_art TEXT,
      uri TEXT,
      file_path TEXT,
      duration INTEGER DEFAULT 0,
      fingerprint_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fingerprints (
      hash INTEGER NOT NULL,
      song_id INTEGER NOT NULL,
      offset INTEGER NOT NULL,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_fingerprints_hash ON fingerprints(hash);
    CREATE INDEX IF NOT EXISTS idx_fingerprints_song ON fingerprints(song_id);
  `);

  return db;
}

async function runFingerprintPython(
  filePath: string
): Promise<[number, number][]> {
  const pythonScriptPath = path.join(
    process.cwd(),
    "scripts",
    "dejavu_fingerprint.py"
  );
  const pythonCmd = process.env.PYTHON_PATH || "python";

  const { stdout } = await execFileAsync(
    pythonCmd,
    [pythonScriptPath, filePath],
    {
      maxBuffer: 50 * 1024 * 1024,
    }
  );

  return JSON.parse(stdout);
}

// ==========================================
// Image & Artist Resolution
// ==========================================
function resolveArtistDiskImage(
  artistImage: string | null | undefined
): string | null {
  if (!artistImage) return null;
  const clean = artistImage.replace(/^\/+/, "");
  const candidates = [
    path.join(LORI2_BASE_DIR, "public", clean),
    path.join(LORI2_BASE_DIR, clean),
    path.join(process.cwd(), "public", clean),
    path.join(process.cwd(), clean),
    path.join(
      LORI2_BASE_DIR,
      "public",
      "assets",
      "profile",
      path.basename(clean)
    ),
    path.join(
      LORI2_BASE_DIR,
      "public",
      "assets",
      "cover",
      path.basename(clean)
    ),
    path.join(
      process.cwd(),
      "public",
      "assets",
      "profile",
      path.basename(clean)
    ),
  ];

  for (const cand of candidates) {
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

// ==========================================
// Downloading Helper
// ==========================================
async function downloadSongFile(
  url: string,
  targetPath: string
): Promise<void> {
  if (fs.existsSync(targetPath)) {
    const s = fs.statSync(targetPath);
    if (s.size > 50000) {
      console.log(
        `   ⚡ Existing local file found (${formatFileSize(
          s.size
        )}). Skipping download.`
      );
      return;
    }
  }

  console.log(`   ⬇️ Downloading from: ${url}`);
  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
    timeout: 360000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  await mkdir(path.dirname(targetPath), { recursive: true });
  const writer = fs.createWriteStream(targetPath);
  response.data.pipe(writer);

  await new Promise<void>((resolve, reject) => {
    writer.on("finish", () => resolve());
    writer.on("error", (err) => reject(err));
  });

  const downloadedStat = fs.statSync(targetPath);
  console.log(
    `   ✅ Download completed (${formatFileSize(downloadedStat.size)})`
  );
}

// ==========================================
// Types
// ==========================================
interface MergeSongItem {
  artistName?: string;
  title: string;
  titleEn?: string;
  link: string;
  size?: number;
  sizeMB?: number;
  duration?: number;
  time?: string;
  pageUrl?: string;
  id?: string;
}

interface MergeGroup {
  artist: string;
  artistEn: string;
  ts?: number;
  data: MergeSongItem[];
}

interface AttentionArtistItem {
  groupArtist: string;
  groupArtistEn?: string;
  count: number;
  reason?: string;
  songs: MergeSongItem[];
}

interface DbArtist {
  id: string;
  name: string;
  nameEn: string | null;
  image: string | null;
}

interface DbSong {
  id: string;
  slug: string;
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

// ==========================================
// Song Duplicate Checker
// ==========================================
function findExistingSongInDb(
  song: MergeSongItem,
  matchedArtistsOrArtist: DbArtist[] | DbArtist,
  dbSongs: DbSong[]
): DbSong | null {
  // If song.id is already assigned in merge.json
  if (song.id) {
    const foundById = dbSongs.find((d) => d.id === song.id);
    if (foundById) return foundById;
  }

  const sTitleClean = cleanTitle(song.title);
  const sTitleEnClean = normalizeEn(song.titleEn || "");
  const sDuration = song.duration || 0;

  const matchedArtists = Array.isArray(matchedArtistsOrArtist)
    ? matchedArtistsOrArtist
    : [matchedArtistsOrArtist];
  const matchedArtistIds = new Set(matchedArtists.map((a) => a.id));
  const matchedArtistNames = matchedArtists.map((a) =>
    normalizePersian(a.name)
  );

  // Narrow candidates: songs connected to any of the matched artists or matching artist name
  const candidates = dbSongs.filter(
    (d) =>
      d.artists.some((a) => matchedArtistIds.has(a.id)) ||
      matchedArtistNames.some((name) =>
        normalizePersian(d.artist).includes(name)
      )
  );

  // Helper matching function
  function testMatch(d: DbSong): boolean {
    const dTitleClean = cleanTitle(d.title);
    const dTitleEnClean = normalizeEn(d.titleEn || "");
    const dDuration = d.duration || 0;
    const durationDiff = Math.abs(dDuration - sDuration);

    // 1. Exact Persian title match
    if (sTitleClean && dTitleClean === sTitleClean) {
      return true;
    }

    // 2. Exact English title match
    if (
      sTitleEnClean &&
      dTitleEnClean &&
      sTitleEnClean.length >= 3 &&
      dTitleEnClean === sTitleEnClean
    ) {
      return true;
    }

    // 3. Cross title match
    if (
      (sTitleClean && dTitleEnClean && sTitleClean === dTitleEnClean) ||
      (sTitleEnClean && dTitleClean && sTitleEnClean === dTitleClean)
    ) {
      return true;
    }

    // 4. Fuzzy title similarity with duration proximity (<= 7s)
    if (sDuration > 0 && durationDiff <= 7 && sTitleClean && dTitleClean) {
      const sim = getStringSimilarity(sTitleClean, dTitleClean);
      if (sim >= 0.75) return true;

      if (sTitleEnClean && dTitleEnClean) {
        const simEn = getStringSimilarity(sTitleEnClean, dTitleEnClean);
        if (simEn >= 0.8) return true;
      }
    }

    // 5. Title substring inclusion with duration proximity (<= 5s)
    if (
      sDuration > 0 &&
      durationDiff <= 5 &&
      sTitleClean.length >= 4 &&
      dTitleClean.length >= 4 &&
      (sTitleClean.includes(dTitleClean) || dTitleClean.includes(sTitleClean))
    ) {
      return true;
    }

    return false;
  }

  // Check artist's songs first
  for (const cand of candidates) {
    if (testMatch(cand)) return cand;
  }

  // Check globally if exact title matches
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

// ==========================================
// Main Execution Function
// ==========================================
async function main() {
  console.log("==========================================================");
  console.log("   Dey Balal - Song Merger & Asset Generator (merge.ts)   ");
  console.log("==========================================================\n");

  // CLI Arguments
  const args = process.argv.slice(2);
  let limitArg: number | null = null;
  let dryRun = false;
  let targetArtistFilter: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limitArg = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (args[i] === "--artist" && args[i + 1]) {
      targetArtistFilter = args[i + 1];
      i++;
    }
  }

  if (dryRun)
    console.log("🔍 Running in DRY RUN mode (no downloads or DB writes).\n");
  if (limitArg) console.log(`⚙️ Processing limit set to: ${limitArg} songs\n`);
  if (targetArtistFilter)
    console.log(`🎯 Filtering to artist: "${targetArtistFilter}"\n`);

  // Verify paths
  if (!fs.existsSync(MERGE_JSON_PATH)) {
    console.error(`❌ Error: Input merge.json not found at ${MERGE_JSON_PATH}`);
    process.exit(1);
  }

  await mkdir(LORI2_BASE_DIR, { recursive: true });
  await mkdir(TARGET_MP3_DIR, { recursive: true });
  await mkdir(TARGET_OGG_DIR, { recursive: true });
  await mkdir(TARGET_COVER_DIR, { recursive: true });

  // 1. Load DB Data
  console.log("⏳ Fetching database artists and songs...");
  const dbArtists: DbArtist[] = await prisma.artist.findMany({
    select: { id: true, name: true, nameEn: true, image: true },
  });
  const dbSongs: DbSong[] = await prisma.song.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      titleEn: true,
      artist: true,
      artistEn: true,
      duration: true,
      artists: { select: { id: true, name: true, nameEn: true } },
    },
  });

  const lastSongIndex = await prisma.song.findFirst({
    orderBy: { index: "desc" },
    select: { index: true },
  });
  let currentSongIndex = lastSongIndex?.index || 0;

  const adminUser = await prisma.user.findFirst({
    where: { role: "administrator" },
    select: { id: true },
  });
  const defaultUserId = adminUser?.id || "fBTuRnw3G0TqDGp6AD5lhVeUSav97bxR";

  console.log(
    `✅ Loaded ${dbArtists.length} artists and ${dbSongs.length} songs from DB.`
  );
  console.log(
    `Current song index: ${currentSongIndex}, Admin user: ${defaultUserId}\n`
  );

  // Existing slugs set for uniqueness
  const existingSlugsSet = new Set<string>(dbSongs.map((s) => s.slug));

  // 2. Initialize SQLite Fingerprints DB
  const sqliteDbPath = getFingerprintDbPath();
  console.log(`💾 Connecting to Fingerprints DB at: ${sqliteDbPath}`);
  const sqliteDb = initSQLite(sqliteDbPath);

  const upsertSongStmt = sqliteDb.prepare(`
    INSERT INTO songs (
      song_key, slug, title, title_en, artist, artist_en, cover_art, uri, file_path, duration, fingerprint_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(song_key) DO UPDATE SET
      slug = excluded.slug,
      title = excluded.title,
      title_en = excluded.title_en,
      artist = excluded.artist,
      artist_en = excluded.artist_en,
      cover_art = excluded.cover_art,
      uri = excluded.uri,
      file_path = excluded.file_path,
      duration = excluded.duration,
      fingerprint_count = excluded.fingerprint_count
    RETURNING id
  `);

  const deleteExistingFpsStmt = sqliteDb.prepare(`
    DELETE FROM fingerprints WHERE song_id = ?
  `);

  const insertFpStmt = sqliteDb.prepare(`
    INSERT INTO fingerprints (hash, song_id, offset) VALUES (?, ?, ?)
  `);

  // 3. Load Auxiliary JSON files
  let attentionList: AttentionArtistItem[] = [];
  if (fs.existsSync(ATTENTION_JSON_PATH)) {
    try {
      const rawAttention = JSON.parse(
        fs.readFileSync(ATTENTION_JSON_PATH, "utf-8")
      );
      if (Array.isArray(rawAttention)) {
        const hasLegacyFormat = rawAttention.some(
          (item: any) => item && item.song && !item.songs
        );

        if (hasLegacyFormat) {
          const grouped: { [key: string]: AttentionArtistItem } = {};
          for (const item of rawAttention) {
            const key = item.groupArtist || item.groupArtistEn || "Unknown";
            if (!grouped[key]) {
              grouped[key] = {
                groupArtist: item.groupArtist,
                groupArtistEn: item.groupArtistEn,
                count: 0,
                reason: item.reason || "Artist not found in database",
                songs: [],
              };
            }
            if (item.song) {
              const songExists = grouped[key].songs.some((s) =>
                s.link && item.song.link
                  ? s.link === item.song.link
                  : s.title === item.song.title
              );
              if (!songExists) {
                grouped[key].songs.push(item.song);
              }
            } else if (Array.isArray(item.songs)) {
              for (const s of item.songs) {
                const songExists = grouped[key].songs.some((existing) =>
                  existing.link && s.link
                    ? existing.link === s.link
                    : existing.title === s.title
                );
                if (!songExists) {
                  grouped[key].songs.push(s);
                }
              }
            }
          }
          attentionList = Object.values(grouped).map((g) => {
            g.count = g.songs.length;
            return g;
          });
          fs.writeFileSync(
            ATTENTION_JSON_PATH,
            JSON.stringify(attentionList, null, 2)
          );
        } else {
          attentionList = rawAttention;
        }
      }
    } catch {
      attentionList = [];
    }
  }

  let erroredList: any[] = [];
  if (fs.existsSync(ERRORED_JSON_PATH)) {
    try {
      erroredList = JSON.parse(fs.readFileSync(ERRORED_JSON_PATH, "utf-8"));
    } catch {
      erroredList = [];
    }
  }

  // let fffingerprintsList: any[] = [];
  // if (fs.existsSync(FINGERPRINTS_JSON_PATH)) {
  //   try {
  //     fffingerprintsList = JSON.parse(
  //       fs.readFileSync(FINGERPRINTS_JSON_PATH, "utf-8")
  //     );
  //   } catch {
  //     fffingerprintsList = [];
  //   }
  // }

  // 4. Load Merge JSON
  const mergeData: MergeGroup[] = JSON.parse(
    fs.readFileSync(MERGE_JSON_PATH, "utf-8")
  );

  let totalSongsCount = 0;
  for (const g of mergeData) totalSongsCount += g.data.length;
  console.log(
    `📂 Loaded ${mergeData.length} artist groups with ${totalSongsCount} songs total.\n`
  );

  let processedCount = 0;
  let alreadyExistingCount = 0;
  let attentionCount = 0;
  let addedCount = 0;
  let erroredCount = 0;

  // Process Loop
  for (let gIdx = 0; gIdx < mergeData.length; gIdx++) {
    const group = mergeData[gIdx];

    const normTarget = targetArtistFilter
      ? normalizePersian(targetArtistFilter)
      : "";
    const normTargetEn = targetArtistFilter
      ? normalizeEn(targetArtistFilter)
      : "";

    if (nonValidArtists.includes(normTarget)) {
      continue;
    }
    const matchGroup = targetArtistFilter
      ? (normTarget && normalizePersian(group.artist).includes(normTarget)) ||
        (normTargetEn && normalizeEn(group.artistEn).includes(normTargetEn))
      : true;
    const matchAnySong = targetArtistFilter
      ? group.data.some(
          (s) =>
            s.artistName &&
            normTarget &&
            normalizePersian(s.artistName).includes(normTarget)
        )
      : true;

    if (targetArtistFilter && !matchGroup && !matchAnySong) {
      continue;
    }

    console.log(`\n==========================================================`);
    console.log(
      `📁 [${gIdx + 1}/${mergeData.length}] Artist Group: ${group.artist} (${
        group.artistEn
      }) - ${group.data.length} tracks`
    );
    console.log(`==========================================================`);

    for (let sIdx = 0; sIdx < group.data.length; sIdx++) {
      if (limitArg && addedCount >= limitArg) {
        console.log(`\n🛑 Limit of ${limitArg} added songs reached! Stopping.`);
        break;
      }

      const song = group.data[sIdx];
      if (targetArtistFilter && !matchGroup) {
        const matchThisSong =
          song.artistName &&
          normTarget &&
          normalizePersian(song.artistName).includes(normTarget);
        if (!matchThisSong) {
          continue;
        }
      }
      processedCount++;
      const songLabel = `"${song.title}" (${song.titleEn || "no en"}) by "${
        song.artistName || group.artist
      }"`;
      console.log(
        `\n🎵 [Song ${processedCount}/${totalSongsCount}] Checking: ${songLabel}`
      );

      // Check duplicate in DB first
      // 1. Resolve Artist(s)
      const matchedArtists = findArtistsInDb(group, song, dbArtists);

      // If artist doesn't exist in DB:
      if (matchedArtists.length === 0) {
        console.warn(`   ⚠️ Artist NOT found in DB for: ${songLabel}`);
        attentionCount++;

        let artistEntry = attentionList.find(
          (item) =>
            item.groupArtist === group.artist ||
            (group.artistEn && item.groupArtistEn === group.artistEn)
        );

        if (!artistEntry) {
          artistEntry = {
            groupArtist: group.artist,
            groupArtistEn: group.artistEn,
            count: 0,
            reason: "Artist not found in database",
            songs: [],
          };
          attentionList.push(artistEntry);
        }

        if (!artistEntry.songs) {
          artistEntry.songs = [];
        }

        const songExists = artistEntry.songs.some((s) =>
          s.link && song.link ? s.link === song.link : s.title === song.title
        );

        if (!songExists) {
          artistEntry.songs.push({ ...song });
          artistEntry.count = artistEntry.songs.length;
          fs.writeFileSync(
            ATTENTION_JSON_PATH,
            JSON.stringify(attentionList, null, 2)
          );
        }
        continue;
      }

      const primaryArtist = matchedArtists[0];

      // Clean title and titleEn by removing artistName and artistEn (case-insensitive)
      const allKnownArtistNames = [
        song.artistName,
        group.artist,
        group.artistEn,
        ...matchedArtists.map((a) => a.name),
        ...matchedArtists.map((a) => a.nameEn),
      ];

      song.title = removeArtistFromTitle(song.title, allKnownArtistNames);
      if (song.titleEn) {
        song.titleEn = removeArtistFromTitle(song.titleEn, allKnownArtistNames);
      }

      if (song.title.startsWith("لری ")) {
        song.title = song.title.replace("لری ", "");
      }

      // 2. Check if song already exists in DB
      const existingMatch = findExistingSongInDb(song, matchedArtists, dbSongs);

      if (existingMatch) {
        console.log(
          `   ⏭️ Song ALREADY in database: "${existingMatch.titleEn}" (${existingMatch.id})`
        );
        alreadyExistingCount++;

        // Add song.id to merge.json item if not present
        if (!song.id || song.id !== existingMatch.id) {
          song.id = existingMatch.id;
          fs.writeFileSync(MERGE_JSON_PATH, JSON.stringify(mergeData, null, 2));
        }
        continue;
      }

      if (dryRun) {
        const artistsStr = matchedArtists.map((a) => a.name).join(" و ");
        console.log(
          `   [DRY RUN] Would download and add song to DB under artist(s): ${artistsStr}`
        );
        addedCount++;
        continue;
      }

      // ==========================================
      // Download & Process New Song
      // ==========================================
      try {
        if (!song.link) {
          throw new Error(`Missing audio download link for "${song.title}"`);
        }

        // 1. Download Path in H:\Temp\Lori2
        let rawFilename = "";
        try {
          const urlObj = new URL(song.link);
          rawFilename = decodeURIComponent(path.basename(urlObj.pathname));
        } catch {
          rawFilename = `${slugify(song.titleEn || song.title)}.mp3`;
        }
        if (
          !rawFilename.endsWith(".mp3") &&
          !rawFilename.endsWith(".m4a") &&
          !rawFilename.endsWith(".ogg")
        ) {
          rawFilename += ".mp3";
        }
        const downloadFilePath = path.join(LORI2_BASE_DIR, rawFilename);

        // Download
        await downloadSongFile(song.link, downloadFilePath);

        // 2. Folder & Slug
        const artistEnName =
          primaryArtist.nameEn ||
          group.artistEn ||
          song.artistName ||
          "Unknown-Artist";
        const artistFolder = formatArtistEnFolder(artistEnName);
        const targetArtistMp3Dir = path.join(TARGET_MP3_DIR, artistFolder);
        await mkdir(targetArtistMp3Dir, { recursive: true });

        const artistPart = slugify(
          matchedArtists.length > 1
            ? matchedArtists.map((a) => a.nameEn || a.name).join(" ")
            : artistEnName
        );
        const titlePart = slugify(song.titleEn || song.title || "untitled");
        const baseSlug = `${artistPart}-${titlePart}`;
        let uniqueSlug = baseSlug;
        let counter = 1;

        while (existingSlugsSet.has(uniqueSlug)) {
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        existingSlugsSet.add(uniqueSlug);

        // 3. Filenames
        const filename64 = `${uniqueSlug}-64.mp3`;
        const filename128 = `${uniqueSlug}-128.mp3`;
        const filename320 = `${uniqueSlug}-320.mp3`;
        const filenameCover = `${uniqueSlug}.jpg`;

        const path64 = path.join(targetArtistMp3Dir, filename64);
        const path128 = path.join(targetArtistMp3Dir, filename128);
        const path320 = path.join(targetArtistMp3Dir, filename320);
        const pathCover = path.join(TARGET_COVER_DIR, filenameCover);

        // 4. Generate Cover Art from artist.image
        let finalCoverArtRel = primaryArtist.image || "/images/cover.png";
        let diskArtistImg = resolveArtistDiskImage(primaryArtist.image);

        if (!diskArtistImg && matchedArtists.length > 1) {
          for (let i = 1; i < matchedArtists.length; i++) {
            const candImg = resolveArtistDiskImage(matchedArtists[i].image);
            if (candImg) {
              diskArtistImg = candImg;
              if (matchedArtists[i].image) {
                finalCoverArtRel = matchedArtists[i].image!;
              }
              break;
            }
          }
        }

        const displayArtistName =
          song.artistName?.trim() ||
          (matchedArtists.length > 1
            ? matchedArtists.map((a) => a.name).join(" و ")
            : primaryArtist.name);

        if (diskArtistImg) {
          console.log(
            `   🎨 Generating watermarked cover from artist photo: ${diskArtistImg}`
          );
          try {
            const wmSuccess = await applyWatermark(
              diskArtistImg,
              pathCover,
              displayArtistName,
              song.title
            );
            if (wmSuccess) {
              finalCoverArtRel = `/assets/cover/${filenameCover}`;
            }
          } catch (wmErr: any) {
            console.warn(`   ⚠️ Watermark generation failed: ${wmErr.message}`);
          }
        } else {
          console.warn(
            `   ⚠️ Artist image not found on disk for ${displayArtistName}. Using default.`
          );
        }

        // 5. FFmpeg Encoding (64, 128, 320 kbps MP3)
        const metadataArgs = [
          `-metadata title="${(song.title || "بدون عنوان").replace(
            /"/g,
            '\\"'
          )}"`,
          `-metadata comment="${"https://deybalal.ir"}"`,
          `-metadata artist="${displayArtistName.replace(/"/g, '\\"')}"`,
          `-metadata album_artist="${displayArtistName.replace(/"/g, '\\"')}"`,
          `-metadata date="${new Date().getFullYear()}"`,
        ]
          .filter(Boolean)
          .join(" ");

        const hasCover = fs.existsSync(pathCover);
        const coverArgs = hasCover
          ? `-i "${pathCover}" -map 0:a -map 1:v -c:v copy -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)"`
          : "-map 0:a";

        console.log(`   🎧 Encoding MP3 variants (64k, 128k, 320k)...`);
        await execAsync(
          `ffmpeg -i "${downloadFilePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 64k -y "${path64}"`,
          { maxBuffer: 50 * 1024 * 1024 }
        );
        await execAsync(
          `ffmpeg -i "${downloadFilePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 128k -y "${path128}"`,
          { maxBuffer: 50 * 1024 * 1024 }
        );
        await execAsync(
          `ffmpeg -i "${downloadFilePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 320k -y "${path320}"`,
          { maxBuffer: 50 * 1024 * 1024 }
        );

        // 6. Audio Duration & Links
        let duration = song.duration || 0;
        try {
          const parsedMeta = await parseFile(path128);
          duration = Math.round(
            parsedMeta.format.duration || song.duration || 0
          );
        } catch {
          // keep fallback
        }

        const stats64 = await stat(path64);
        const stats128 = await stat(path128);
        const stats320 = await stat(path320);

        const uri128 = `/assets/mp3/${artistFolder}/${filename128}`;
        const linksJson = {
          64: {
            url: `/assets/mp3/${artistFolder}/${filename64}`,
            size: formatFileSize(stats64.size),
            bytes: stats64.size,
          },
          128: {
            url: `/assets/mp3/${artistFolder}/${filename128}`,
            size: formatFileSize(stats128.size),
            bytes: stats128.size,
          },
          320: {
            url: `/assets/mp3/${artistFolder}/${filename320}`,
            size: formatFileSize(stats320.size),
            bytes: stats320.size,
          },
        };

        // Similar songs relation
        let similarConnect: { id: string }[] = [];
        try {
          similarConnect = await findSimilarSongs({
            title: song.title,
            artistIds: matchedArtists.map((a) => a.id),
            genreIds: [],
          });
        } catch {
          similarConnect = [];
        }

        // 7. Insert Song into Prisma Database
        const displayArtistEn =
          matchedArtists.map((a) => a.nameEn).filter(Boolean).length ===
          matchedArtists.length
            ? matchedArtists.map((a) => a.nameEn).join(" و ")
            : primaryArtist.nameEn || group.artistEn || "";

        currentSongIndex++;
        console.log(`   💾 Inserting song record into database...`);
        const dbSong = await prisma.song.create({
          data: {
            title: song.title || "بدون عنوان",
            titleEn: song.titleEn || "",
            artist: displayArtistName,
            artistEn: displayArtistEn,
            index: currentSongIndex,
            artists: {
              connect: matchedArtists.map((a) => ({ id: a.id })),
            },
            uri: uri128,
            filename: filename128,
            coverArt: finalCoverArtRel,
            duration: duration,
            slug: uniqueSlug,
            userId: defaultUserId,
            isActive: true,
            links: linksJson,
            contributors: {
              create: [
                {
                  userId: defaultUserId,
                  type: "add",
                  percentage: 100,
                },
              ],
            },
            similarSongs: {
              connect: similarConnect,
            },
          },
        });

        // 8. Generate 30-second preview OGG
        const pathOgg = path.join(TARGET_OGG_DIR, `${dbSong.id}.ogg`);
        const startingPoint =
          duration / 2 + 30 > duration ? 0 : Math.floor(duration / 2);

        console.log(
          `   🎙️ Generating OGG preview at offset ${startingPoint}s...`
        );
        await execAsync(
          `ffmpeg -ss ${startingPoint} -i "${path128}" -t 30 -map 0:a:0 -vn -sn -dn -c:a libvorbis -b:a 64k -y "${pathOgg}"`,
          { maxBuffer: 50 * 1024 * 1024 }
        );

        await prisma.song.update({
          where: { id: dbSong.id },
          data: { ogg: `/assets/ogg/${dbSong.id}.ogg` },
        });

        // 9. Audio Fingerprinting (Shazam / Dejavu)
        console.log(`   ⚡ Fingerprinting song audio...`);
        const fingerprints = await runFingerprintPython(path128);

        const saveTransaction = sqliteDb.transaction(
          (fps: [number, number][]) => {
            const row = upsertSongStmt.get(
              dbSong.id,
              uniqueSlug,
              dbSong.title,
              dbSong.titleEn || null,
              dbSong.artist,
              dbSong.artistEn || null,
              finalCoverArtRel,
              uri128,
              path128,
              duration,
              fps.length
            ) as { id: number };

            const internalSongId = row.id;
            deleteExistingFpsStmt.run(internalSongId);

            for (const [hash, offset] of fps) {
              insertFpStmt.run(hash, internalSongId, offset);
            }
          }
        );
        saveTransaction(fingerprints);
        console.log(
          `   ✅ Stored ${fingerprints.length} fingerprints in fingerprint.db`
        );

        // Append to fffingerprints.json
        // fffingerprintsList.push({
        //   songId: dbSong.id,
        //   slug: uniqueSlug,
        //   title: dbSong.title,
        //   titleEn: dbSong.titleEn || undefined,
        //   artist: dbSong.artist,
        //   artistEn: dbSong.artistEn || undefined,
        //   fingerprintCount: fingerprints.length,
        //   fingerprints: fingerprints,
        // });
        // fs.writeFileSync(
        //   FINGERPRINTS_JSON_PATH,
        //   JSON.stringify(fffingerprintsList, null, 2)
        // );

        // 10. Update Song ID in merge.json item
        song.id = dbSong.id;
        fs.writeFileSync(MERGE_JSON_PATH, JSON.stringify(mergeData, null, 2));

        // Push to local dbSongs cache for subsequent duplicate detection
        dbSongs.push({
          id: dbSong.id,
          slug: uniqueSlug,
          title: dbSong.title,
          titleEn: dbSong.titleEn,
          artist: dbSong.artist,
          artistEn: dbSong.artistEn,
          duration: dbSong.duration,
          artists: matchedArtists.map((a) => ({
            id: a.id,
            name: a.name,
            nameEn: a.nameEn,
          })),
        });

        addedCount++;
        console.log(
          `   ✨ Successfully processed and added: ${dbSong.title} (ID: ${dbSong.id})`
        );
      } catch (err: any) {
        console.error(`   ❌ Error processing "${song.title}":`, err.message);
        erroredCount++;

        erroredList.push({
          groupArtist: group.artist,
          artistName: song.artistName || group.artist,
          title: song.title,
          titleEn: song.titleEn,
          link: song.link,
          error: err.message,
          timestamp: new Date().toISOString(),
        });
        fs.writeFileSync(
          ERRORED_JSON_PATH,
          JSON.stringify(erroredList, null, 2)
        );
      }
    }

    if (limitArg && addedCount >= limitArg) {
      break;
    }
  }

  // Final Summary
  console.log("\n==========================================================");
  console.log("                   Processing Summary                     ");
  console.log("==========================================================");
  console.log(`Total songs evaluated:     ${processedCount}`);
  console.log(`Already in DB (skipped):   ${alreadyExistingCount}`);
  console.log(`Artist missing (attention):${attentionCount}`);
  console.log(`Successfully added:        ${addedCount}`);
  console.log(`Errors encountered:        ${erroredCount}`);
  // console.log(`Fingerprints JSON:         ${FINGERPRINTS_JSON_PATH}`);
  console.log(`Attention JSON:            ${ATTENTION_JSON_PATH}`);
  console.log(`Errored JSON:              ${ERRORED_JSON_PATH}`);
  console.log(`Merge JSON:                ${MERGE_JSON_PATH}`);
  console.log("==========================================================\n");

  sqliteDb.close();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Fatal error in merge.ts:", e);
  await prisma.$disconnect();
  process.exit(1);
});
