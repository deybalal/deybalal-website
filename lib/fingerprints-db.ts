import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "fingerprints.db");

export function getFingerprintsDb(customPath?: string) {
  const dbPath = customPath || process.env.FINGERPRINTS_DB_PATH || DEFAULT_DB_PATH;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);

  // Performance and storage optimizations
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("cache_size = -64000"); // 64MB cache
  db.pragma("temp_store = MEMORY");
  db.pragma("wal_autocheckpoint = 1000");

  // Schema with integer keys and integer hashes for minimal storage footprint
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
