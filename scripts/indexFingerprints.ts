import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import Database from "better-sqlite3";

const execFileAsync = promisify(execFile);

// Configuration & DB initialization
const DB_PATH =
  process.env.FINGERPRINTS_DB_PATH ||
  path.join(process.cwd(), "data", "fingerprints.db");

function initDatabase() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);
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

interface SongItem {
  id: string;
  slug?: string;
  title: string;
  titleEn?: string;
  artist: string;
  artistEn?: string;
  coverArt?: string;
  duration?: number;
  uri?: string;
  links?: {
    [key: string]: {
      url: string;
      bytes?: number;
    };
  };
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

function resolveAudioPath(song: SongItem): string | null {
  let rawUrl: string | undefined;

  if (song.links) {
    rawUrl =
      song.links["320"]?.url || song.links["128"]?.url || song.links["64"]?.url;
  }
  if (!rawUrl && song.uri) {
    rawUrl = song.uri;
  }

  if (!rawUrl) return null;

  const cleanRel = rawUrl.replace(/^\/+/, "");

  const candidatePaths = [
    path.join(process.cwd(), "public", cleanRel),
    path.join(process.cwd(), cleanRel),
    path.resolve(cleanRel),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return path.join(process.cwd(), "public", cleanRel);
}

async function main() {
  console.log("=========================================");
  console.log("   Dejavu Music Fingerprint Indexer");
  console.log("=========================================\n");

  let jsonPath = process.argv[2];
  if (!jsonPath) {
    const defaultCandidates = [
      path.join(process.cwd(), "songs.json"),
      path.join(process.cwd(), "scripts", "songs.json"),
      path.join(process.cwd(), "example.json"),
    ];

    for (const cand of defaultCandidates) {
      if (fs.existsSync(cand)) {
        jsonPath = cand;
        break;
      }
    }
  }

  if (!jsonPath || !fs.existsSync(jsonPath)) {
    console.error(`❌ Input songs JSON file not found!`);
    console.error(
      `Usage: npx tsx scripts/indexFingerprints.ts <path-to-songs.json>`
    );
    process.exit(1);
  }

  console.log(`📂 Reading songs file: ${jsonPath}`);
  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const songs: SongItem[] = JSON.parse(rawData);
  console.log(`🎵 Found ${songs.length} songs in file.`);

  const db = initDatabase();
  console.log(`💾 Connected to SQLite DB at: ${DB_PATH}\n`);

  const upsertSongStmt = db.prepare(`
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

  const deleteExistingFpsStmt = db.prepare(`
    DELETE FROM fingerprints WHERE song_id = ?
  `);

  const insertFpStmt = db.prepare(`
    INSERT INTO fingerprints (hash, song_id, offset) VALUES (?, ?, ?)
  `);

  let indexedCount = 0;
  let skippedCount = 0;
  let totalFingerprints = 0;
  const startTime = Date.now();

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const prefix = `[${i + 1}/${songs.length}]`;
    const songLabel = `"${song.title}" by "${song.artist}" (${song.id})`;

    const audioFilePath = resolveAudioPath(song);

    if (!audioFilePath || !fs.existsSync(audioFilePath)) {
      console.warn(
        `⚠️  ${prefix} Skipped ${songLabel}: File does not exist at: ${audioFilePath}`
      );
      skippedCount++;
      continue;
    }

    try {
      console.log(`⚡ ${prefix} Fingerprinting ${songLabel}...`);
      const songStart = Date.now();
      const fingerprints = await runFingerprintPython(audioFilePath);
      const fpDuration = ((Date.now() - songStart) / 1000).toFixed(2);

      const saveTransaction = db.transaction((fps: [number, number][]) => {
        const row = upsertSongStmt.get(
          song.id,
          song.slug || null,
          song.title,
          song.titleEn || null,
          song.artist,
          song.artistEn || null,
          song.coverArt || null,
          song.uri || null,
          audioFilePath,
          song.duration || 0,
          fps.length
        ) as { id: number };

        const internalSongId = row.id;
        deleteExistingFpsStmt.run(internalSongId);

        for (const [hash, offset] of fps) {
          insertFpStmt.run(hash, internalSongId, offset);
        }
      });

      saveTransaction(fingerprints);

      indexedCount++;
      totalFingerprints += fingerprints.length;
      console.log(
        `✅ ${prefix} Indexed in ${fpDuration}s (${fingerprints.length.toLocaleString()} fingerprints stored)\n`
      );
    } catch (err) {
      console.error(
        `❌ ${prefix} Error fingerprinting ${songLabel}:`,
        (err as Error).message || err
      );
      skippedCount++;
    }
  }

  // Checkpoint WAL and optimize database to minimize file size on disk
  console.log("🧹 Compacting and checkpointing database...");
  db.pragma("wal_checkpoint(TRUNCATE)");
  db.pragma("optimize");

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const dbFileSize = fs.existsSync(DB_PATH)
    ? (fs.statSync(DB_PATH).size / (1024 * 1024)).toFixed(2)
    : "0";

  console.log("=========================================");
  console.log("            Indexing Complete            ");
  console.log("=========================================");
  console.log(`Songs Processed:     ${songs.length}`);
  console.log(`Songs Indexed:       ${indexedCount}`);
  console.log(`Songs Skipped:       ${skippedCount}`);
  console.log(`Total Fingerprints:  ${totalFingerprints.toLocaleString()}`);
  console.log(`Total Time Elapsed:  ${totalTime}s`);
  console.log(`Database File Size:  ${dbFileSize} MB`);
  console.log(`Database Location:   ${DB_PATH}`);
  console.log("=========================================");

  db.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
