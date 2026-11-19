import type {
  ArtworkVariant,
  ImportedTrackRow,
  PlayEvent,
  Playlist,
  ProviderId,
} from '@/types';

import { getDatabase } from './database';

type PlaylistRow = {
  id: string;
  account_id: string;
  name: string;
  description: string;
  cover_seed: string;
  cover_variant: string;
  accent: string;
  created_at: number;
  updated_at: number;
};

type PlaylistTrackRow = {
  playlist_id: string;
  track_id: string;
};

type LikeRow = { track_id: string; liked_at: number };
type SaveRow = { album_id: string; saved_at: number };
type FollowRow = { artist_id: string; followed_at: number };
type SeedRow = { id: string };
type HistoryRow = {
  id: string;
  track_id: string;
  played_at: number;
  seconds_played: number;
  completed: number;
  skipped: number;
  context: string;
};
type SearchRow = { query: string; searched_at: number };
type ImportedRow = { track_id: string; provider: string; imported_at: number };

function mapPlaylist(row: PlaylistRow, trackIds: string[]): Playlist {
  return {
    id: row.id,
    title: row.name,
    description: row.description,
    trackIds,
    artwork: { seed: row.cover_seed, variant: row.cover_variant as ArtworkVariant },
    accent: row.accent,
    curator: 'You',
    isSystem: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listAccountPlaylists(accountId: string): Playlist[] {
  const db = getDatabase();
  const playlists = db.getAllSync<PlaylistRow>(
    'SELECT * FROM playlists WHERE account_id = ? ORDER BY updated_at DESC',
    [accountId],
  );
  if (playlists.length === 0) return [];
  const tracks = db.getAllSync<PlaylistTrackRow>(
    `SELECT pt.playlist_id, pt.track_id
     FROM playlist_tracks pt
     JOIN playlists p ON p.id = pt.playlist_id
     WHERE p.account_id = ?
     ORDER BY pt.playlist_id, pt.position`,
    [accountId],
  );
  const grouped = new Map<string, string[]>();
  for (const row of tracks) {
    const list = grouped.get(row.playlist_id) ?? [];
    list.push(row.track_id);
    grouped.set(row.playlist_id, list);
  }
  return playlists.map((row) => mapPlaylist(row, grouped.get(row.id) ?? []));
}

export function getAccountPlaylist(playlistId: string, accountId: string): Playlist | null {
  const row = getDatabase().getFirstSync<PlaylistRow>(
    'SELECT * FROM playlists WHERE id = ? AND account_id = ?',
    [playlistId, accountId],
  );
  if (!row) return null;
  const tracks = getDatabase().getAllSync<PlaylistTrackRow>(
    'SELECT playlist_id, track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position',
    [playlistId],
  );
  return mapPlaylist(row, tracks.map((track) => track.track_id));
}

export function createPlaylistRecord(input: {
  id: string;
  accountId: string;
  name: string;
  description: string;
  coverSeed: string;
  coverVariant: ArtworkVariant;
  accent: string;
  trackIds: string[];
  now: number;
}): Playlist {
  const db = getDatabase();
  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO playlists (id, account_id, name, description, cover_seed, cover_variant, accent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.accountId,
        input.name,
        input.description,
        input.coverSeed,
        input.coverVariant,
        input.accent,
        input.now,
        input.now,
      ],
    );
    input.trackIds.forEach((trackId, index) => {
      db.runSync(
        'INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position, added_at) VALUES (?, ?, ?, ?)',
        [input.id, trackId, index, input.now],
      );
    });
  });
  return {
    id: input.id,
    title: input.name,
    description: input.description,
    trackIds: input.trackIds,
    artwork: { seed: input.coverSeed, variant: input.coverVariant },
    accent: input.accent,
    curator: 'You',
    isSystem: false,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function updatePlaylistRecord(
  playlistId: string,
  accountId: string,
  patch: { name?: string; description?: string; coverSeed?: string; coverVariant?: ArtworkVariant; accent?: string },
  now: number,
): boolean {
  const db = getDatabase();
  const current = db.getFirstSync<PlaylistRow>(
    'SELECT * FROM playlists WHERE id = ? AND account_id = ?',
    [playlistId, accountId],
  );
  if (!current) return false;
  db.runSync(
    `UPDATE playlists SET name = ?, description = ?, cover_seed = ?, cover_variant = ?, accent = ?, updated_at = ?
     WHERE id = ?`,
    [
      patch.name ?? current.name,
      patch.description ?? current.description,
      patch.coverSeed ?? current.cover_seed,
      patch.coverVariant ?? current.cover_variant,
      patch.accent ?? current.accent,
      now,
      playlistId,
    ],
  );
  return true;
}

export function deletePlaylistRecord(playlistId: string, accountId: string): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    db.runSync(
      'DELETE FROM playlist_tracks WHERE playlist_id IN (SELECT id FROM playlists WHERE id = ? AND account_id = ?)',
      [playlistId, accountId],
    );
    db.runSync('DELETE FROM playlists WHERE id = ? AND account_id = ?', [playlistId, accountId]);
  });
}

export function appendTracksToPlaylist(
  playlistId: string,
  trackIds: string[],
  now: number,
): void {
  if (trackIds.length === 0) return;
  const db = getDatabase();
  db.withTransactionSync(() => {
    const row = db.getFirstSync<{ max_position: number | null }>(
      'SELECT MAX(position) as max_position FROM playlist_tracks WHERE playlist_id = ?',
      [playlistId],
    );
    let next = (row?.max_position ?? -1) + 1;
    for (const trackId of trackIds) {
      const result = db.runSync(
        'INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position, added_at) VALUES (?, ?, ?, ?)',
        [playlistId, trackId, next, now],
      );
      if (result.changes > 0) next += 1;
    }
    db.runSync('UPDATE playlists SET updated_at = ? WHERE id = ?', [now, playlistId]);
  });
}

export function removeTrackFromPlaylist(playlistId: string, trackId: string, now: number): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?', [
      playlistId,
      trackId,
    ]);
    db.runSync('UPDATE playlists SET updated_at = ? WHERE id = ?', [now, playlistId]);
  });
}

export function reorderPlaylistTracks(
  playlistId: string,
  orderedTrackIds: string[],
  now: number,
): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    orderedTrackIds.forEach((trackId, index) => {
      db.runSync('UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?', [
        index,
        playlistId,
        trackId,
      ]);
    });
    db.runSync('UPDATE playlists SET updated_at = ? WHERE id = ?', [now, playlistId]);
  });
}

export function listLikedRows(accountId: string): LikeRow[] {
  return getDatabase().getAllSync<LikeRow>(
    'SELECT track_id, liked_at FROM liked_tracks WHERE account_id = ? ORDER BY liked_at DESC',
    [accountId],
  );
}

export function setTrackLiked(
  accountId: string,
  trackId: string,
  liked: boolean,
  now: number,
): void {
  if (liked) {
    getDatabase().runSync(
      'INSERT OR REPLACE INTO liked_tracks (account_id, track_id, liked_at) VALUES (?, ?, ?)',
      [accountId, trackId, now],
    );
  } else {
    getDatabase().runSync('DELETE FROM liked_tracks WHERE account_id = ? AND track_id = ?', [
      accountId,
      trackId,
    ]);
  }
}

export function listSavedAlbumRows(accountId: string): SaveRow[] {
  return getDatabase().getAllSync<SaveRow>(
    'SELECT album_id, saved_at FROM saved_albums WHERE account_id = ? ORDER BY saved_at DESC',
    [accountId],
  );
}

export function setAlbumSaved(
  accountId: string,
  albumId: string,
  saved: boolean,
  now: number,
): void {
  if (saved) {
    getDatabase().runSync(
      'INSERT OR REPLACE INTO saved_albums (account_id, album_id, saved_at) VALUES (?, ?, ?)',
      [accountId, albumId, now],
    );
  } else {
    getDatabase().runSync('DELETE FROM saved_albums WHERE account_id = ? AND album_id = ?', [
      accountId,
      albumId,
    ]);
  }
}

export function listFollowedRows(accountId: string): FollowRow[] {
  return getDatabase().getAllSync<FollowRow>(
    'SELECT artist_id, followed_at FROM followed_artists WHERE account_id = ? ORDER BY followed_at DESC',
    [accountId],
  );
}

export function setArtistFollowed(
  accountId: string,
  artistId: string,
  followed: boolean,
  now: number,
): void {
  if (followed) {
    getDatabase().runSync(
      'INSERT OR REPLACE INTO followed_artists (account_id, artist_id, followed_at) VALUES (?, ?, ?)',
      [accountId, artistId, now],
    );
  } else {
    getDatabase().runSync('DELETE FROM followed_artists WHERE account_id = ? AND artist_id = ?', [
      accountId,
      artistId,
    ]);
  }
}

export function getSeedGenreWeights(accountId: string): Record<string, number> {
  const rows = getDatabase().getAllSync<{ genre_id: string; weight: number }>(
    'SELECT genre_id, weight FROM seed_genres WHERE account_id = ?',
    [accountId],
  );
  return Object.fromEntries(rows.map((row) => [row.genre_id, row.weight]));
}

export function setSeedGenres(accountId: string, genreIds: string[]): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM seed_genres WHERE account_id = ?', [accountId]);
    for (const genreId of new Set(genreIds)) {
      db.runSync('INSERT INTO seed_genres (account_id, genre_id, weight) VALUES (?, ?, 1)', [
        accountId,
        genreId,
      ]);
    }
  });
}

export function getSeedArtistIds(accountId: string): string[] {
  const rows = getDatabase().getAllSync<SeedRow>(
    'SELECT artist_id as id FROM seed_artists WHERE account_id = ?',
    [accountId],
  );
  return rows.map((row) => row.id);
}

export function setSeedArtists(accountId: string, artistIds: string[]): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM seed_artists WHERE account_id = ?', [accountId]);
    for (const artistId of new Set(artistIds)) {
      db.runSync('INSERT INTO seed_artists (account_id, artist_id) VALUES (?, ?)', [
        accountId,
        artistId,
      ]);
    }
  });
}

export function recordPlayStart(input: {
  id: string;
  accountId: string;
  trackId: string;
  playedAt: number;
  context: string;
}): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO play_history (id, account_id, track_id, played_at, seconds_played, completed, skipped, context)
       VALUES (?, ?, ?, ?, 0, 0, 0, ?)`,
      [input.id, input.accountId, input.trackId, input.playedAt, input.context],
    );
    db.runSync(
      `DELETE FROM play_history
       WHERE account_id = ?
         AND id NOT IN (
           SELECT id FROM play_history WHERE account_id = ? ORDER BY played_at DESC LIMIT 500
         )`,
      [input.accountId, input.accountId],
    );
  });
}

export function updatePlayEvent(
  eventId: string,
  patch: { secondsPlayed: number; completed: boolean; skipped: boolean },
): void {
  getDatabase().runSync(
    'UPDATE play_history SET seconds_played = ?, completed = ?, skipped = ? WHERE id = ?',
    [Math.round(patch.secondsPlayed), patch.completed ? 1 : 0, patch.skipped ? 1 : 0, eventId],
  );
}

export function listPlayEvents(accountId: string, limit = 250): PlayEvent[] {
  const rows = getDatabase().getAllSync<HistoryRow>(
    `SELECT id, track_id, played_at, seconds_played, completed, skipped, context
     FROM play_history WHERE account_id = ? ORDER BY played_at DESC LIMIT ?`,
    [accountId, limit],
  );
  return rows.map((row) => ({
    id: row.id,
    trackId: row.track_id,
    playedAt: row.played_at,
    secondsPlayed: row.seconds_played,
    completed: Boolean(row.completed),
    skipped: Boolean(row.skipped),
    context: row.context,
  }));
}

export function clearPlayHistory(accountId: string): void {
  getDatabase().runSync('DELETE FROM play_history WHERE account_id = ?', [accountId]);
}

export function addRecentSearch(accountId: string, query: string, now: number): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  const db = getDatabase();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM recent_searches WHERE account_id = ? AND query = ? COLLATE NOCASE', [
      accountId,
      trimmed,
    ]);
    db.runSync(
      'INSERT INTO recent_searches (account_id, query, searched_at) VALUES (?, ?, ?)',
      [accountId, trimmed, now],
    );
    db.runSync(
      `DELETE FROM recent_searches
       WHERE account_id = ?
         AND query NOT IN (
           SELECT query FROM recent_searches WHERE account_id = ? ORDER BY searched_at DESC LIMIT 12
         )`,
      [accountId, accountId],
    );
  });
}

export function listRecentSearches(accountId: string): { query: string; searchedAt: number }[] {
  const rows = getDatabase().getAllSync<SearchRow>(
    'SELECT query, searched_at FROM recent_searches WHERE account_id = ? ORDER BY searched_at DESC',
    [accountId],
  );
  return rows.map((row) => ({ query: row.query, searchedAt: row.searched_at }));
}

export function removeRecentSearch(accountId: string, query: string): void {
  getDatabase().runSync('DELETE FROM recent_searches WHERE account_id = ? AND query = ?', [
    accountId,
    query,
  ]);
}

export function clearRecentSearches(accountId: string): void {
  getDatabase().runSync('DELETE FROM recent_searches WHERE account_id = ?', [accountId]);
}

export function markTrackImported(
  accountId: string,
  trackId: string,
  provider: ProviderId,
  now: number,
): void {
  getDatabase().runSync(
    'INSERT OR REPLACE INTO imported_tracks (account_id, track_id, provider, imported_at) VALUES (?, ?, ?, ?)',
    [accountId, trackId, provider, now],
  );
}

export function listImportedRows(accountId: string): ImportedTrackRow[] {
  const rows = getDatabase().getAllSync<ImportedRow>(
    'SELECT track_id, provider, imported_at FROM imported_tracks WHERE account_id = ? ORDER BY imported_at DESC',
    [accountId],
  );
  return rows.map((row) => ({
    trackId: row.track_id,
    provider: row.provider as ProviderId,
    importedAt: row.imported_at,
  }));
}

export function unmarkTrackImported(accountId: string, trackId: string): void {
  getDatabase().runSync('DELETE FROM imported_tracks WHERE account_id = ? AND track_id = ?', [
    accountId,
    trackId,
  ]);
}
