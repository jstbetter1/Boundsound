import type { Track, TrackSource } from '@/types';

import { getDatabase } from './database';

type ExternalRow = {
  id: string;
  track_json: string;
  updated_at: number;
};

type LinkRow = {
  track_id: string;
  source_json: string;
};

export function listExternalTracks(): Track[] {
  const rows = getDatabase().getAllSync<ExternalRow>(
    'SELECT id, track_json, updated_at FROM external_tracks ORDER BY updated_at DESC',
  );
  const tracks: Track[] = [];
  for (const row of rows) {
    try {
      tracks.push(JSON.parse(row.track_json) as Track);
    } catch {
      // Ignore corrupt rows rather than breaking startup.
    }
  }
  return tracks;
}

export function saveExternalTrack(track: Track, now: number): void {
  getDatabase().runSync(
    `INSERT INTO external_tracks (id, canonical_key, provider, provider_track_id, track_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       canonical_key = excluded.canonical_key,
       provider = excluded.provider,
       provider_track_id = excluded.provider_track_id,
       track_json = excluded.track_json,
       updated_at = excluded.updated_at`,
    [
      track.id,
      track.canonicalKey,
      track.sources[0]?.provider ?? 'local',
      track.sources[0]?.itemId ?? track.id,
      JSON.stringify(track),
      now,
    ],
  );
}

export function saveTrackLink(trackId: string, source: TrackSource): void {
  getDatabase().runSync(
    `INSERT OR REPLACE INTO track_links (track_id, provider, provider_track_id, source_json)
     VALUES (?, ?, ?, ?)`,
    [trackId, source.provider, source.itemId, JSON.stringify(source)],
  );
}

export function listTrackLinks(): { trackId: string; source: TrackSource }[] {
  const rows = getDatabase().getAllSync<LinkRow>(
    'SELECT track_id, source_json FROM track_links',
  );
  const links: { trackId: string; source: TrackSource }[] = [];
  for (const row of rows) {
    try {
      links.push({ trackId: row.track_id, source: JSON.parse(row.source_json) as TrackSource });
    } catch {
      // Ignore malformed link.
    }
  }
  return links;
}

export function deleteExternalTrack(trackId: string): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM external_tracks WHERE id = ?', [trackId]);
    db.runSync('DELETE FROM track_links WHERE track_id = ?', [trackId]);
    db.runSync('DELETE FROM imported_tracks WHERE track_id = ?', [trackId]);
  });
}

export function clearExternalTracks(): void {
  const db = getDatabase();
  db.execSync('DELETE FROM external_tracks; DELETE FROM track_links; DELETE FROM imported_tracks;');
}
