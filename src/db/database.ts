import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let database: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!database) {
    database = SQLite.openDatabaseSync('bound.db');
  }
  return database;
}

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'member',
  email TEXT UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT,
  password_salt TEXT,
  recovery_hash TEXT,
  accent TEXT NOT NULL DEFAULT '#C8F751',
  avatar_seed TEXT NOT NULL DEFAULT 'bound',
  onboarded INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (scope, key)
);

CREATE TABLE IF NOT EXISTS liked_tracks (
  account_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  liked_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, track_id)
);

CREATE TABLE IF NOT EXISTS saved_albums (
  account_id TEXT NOT NULL,
  album_id TEXT NOT NULL,
  saved_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, album_id)
);

CREATE TABLE IF NOT EXISTS followed_artists (
  account_id TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  followed_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, artist_id)
);

CREATE TABLE IF NOT EXISTS seed_genres (
  account_id TEXT NOT NULL,
  genre_id TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1,
  PRIMARY KEY (account_id, genre_id)
);

CREATE TABLE IF NOT EXISTS seed_artists (
  account_id TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  PRIMARY KEY (account_id, artist_id)
);

CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_seed TEXT NOT NULL,
  cover_variant TEXT NOT NULL DEFAULT 'rings',
  accent TEXT NOT NULL DEFAULT '#C8F751',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_playlists_account ON playlists(account_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  added_at INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks ON playlist_tracks(playlist_id, position);

CREATE TABLE IF NOT EXISTS play_history (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  played_at INTEGER NOT NULL,
  seconds_played INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  context TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_history_account ON play_history(account_id, played_at DESC);

CREATE TABLE IF NOT EXISTS recent_searches (
  account_id TEXT NOT NULL,
  query TEXT NOT NULL,
  searched_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, query)
);

CREATE TABLE IF NOT EXISTS downloads (
  account_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  status TEXT NOT NULL,
  progress REAL NOT NULL DEFAULT 0,
  file_uri TEXT,
  bytes INTEGER NOT NULL DEFAULT 0,
  quality TEXT NOT NULL DEFAULT 'high',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  error TEXT,
  PRIMARY KEY (account_id, track_id)
);

CREATE TABLE IF NOT EXISTS conversions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  input_name TEXT NOT NULL,
  output_name TEXT NOT NULL,
  output_uri TEXT NOT NULL,
  format TEXT NOT NULL,
  bitrate INTEGER NOT NULL,
  sample_rate INTEGER NOT NULL,
  status TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  error TEXT
);

CREATE TABLE IF NOT EXISTS connected_accounts (
  account_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  scopes TEXT,
  connected_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, provider)
);

CREATE TABLE IF NOT EXISTS external_tracks (
  id TEXT PRIMARY KEY,
  canonical_key TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_track_id TEXT NOT NULL,
  track_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_external_tracks_key ON external_tracks(canonical_key);

CREATE TABLE IF NOT EXISTS track_links (
  track_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_track_id TEXT NOT NULL,
  source_json TEXT NOT NULL,
  PRIMARY KEY (track_id, provider, provider_track_id)
);

CREATE TABLE IF NOT EXISTS imported_tracks (
  account_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  imported_at INTEGER NOT NULL,
  PRIMARY KEY (account_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_imported_account ON imported_tracks(account_id, imported_at DESC);
`;

export function initDatabase(): void {
  const db = getDatabase();
  db.execSync(SCHEMA);
  const version = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  if (!version || version.user_version < 1) {
    db.execSync('PRAGMA user_version = 1;');
  }
}

export async function initDatabaseAsync(): Promise<void> {
  if (!database && Platform.OS === 'web') {
    database = await SQLite.openDatabaseAsync('bound.db');
  }
  if (Platform.OS === 'web' && database) {
    await database.execAsync(SCHEMA);
    const version = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    if (!version || version.user_version < 1) {
      await database.execAsync('PRAGMA user_version = 1;');
    }
    return;
  }
  initDatabase();
}

export function resetDatabase(): void {
  const db = getDatabase();
  const tables = [
    'accounts',
    'settings',
    'liked_tracks',
    'saved_albums',
    'followed_artists',
    'seed_genres',
    'seed_artists',
    'playlists',
    'playlist_tracks',
    'play_history',
    'recent_searches',
    'downloads',
    'conversions',
    'connected_accounts',
    'external_tracks',
    'track_links',
    'imported_tracks',
  ];
  for (const table of tables) {
    db.runSync(`DELETE FROM ${table}`);
  }
}
