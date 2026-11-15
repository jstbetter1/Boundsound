import type { DownloadRecord, DownloadStatus } from '@/types';

import { getDatabase } from './database';

type DownloadRow = {
  track_id: string;
  status: DownloadStatus;
  progress: number;
  file_uri: string | null;
  bytes: number;
  quality: 'standard' | 'high';
  created_at: number;
  updated_at: number;
  error: string | null;
};

function mapDownload(row: DownloadRow): DownloadRecord {
  return {
    trackId: row.track_id,
    status: row.status,
    progress: row.progress,
    fileUri: row.file_uri ?? undefined,
    bytes: row.bytes,
    quality: row.quality,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    error: row.error ?? undefined,
  };
}

export function listDownloads(accountId: string): DownloadRecord[] {
  const rows = getDatabase().getAllSync<DownloadRow>(
    'SELECT * FROM downloads WHERE account_id = ? ORDER BY updated_at DESC',
    [accountId],
  );
  return rows.map(mapDownload);
}

export function getDownload(accountId: string, trackId: string): DownloadRecord | null {
  const row = getDatabase().getFirstSync<DownloadRow>(
    'SELECT * FROM downloads WHERE account_id = ? AND track_id = ?',
    [accountId, trackId],
  );
  return row ? mapDownload(row) : null;
}

export function upsertDownload(accountId: string, record: DownloadRecord): void {
  getDatabase().runSync(
    `INSERT INTO downloads
      (account_id, track_id, status, progress, file_uri, bytes, quality, created_at, updated_at, error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(account_id, track_id) DO UPDATE SET
       status = excluded.status,
       progress = excluded.progress,
       file_uri = excluded.file_uri,
       bytes = excluded.bytes,
       quality = excluded.quality,
       updated_at = excluded.updated_at,
       error = excluded.error`,
    [
      accountId,
      record.trackId,
      record.status,
      record.progress,
      record.fileUri ?? null,
      record.bytes,
      record.quality,
      record.createdAt,
      record.updatedAt,
      record.error ?? null,
    ],
  );
}

export function updateDownload(
  accountId: string,
  trackId: string,
  patch: Partial<Omit<DownloadRecord, 'trackId'>>,
  now: number,
): void {
  const current = getDownload(accountId, trackId);
  if (!current) return;
  upsertDownload(accountId, { ...current, ...patch, trackId, updatedAt: now });
}

export function removeDownload(accountId: string, trackId: string): void {
  getDatabase().runSync('DELETE FROM downloads WHERE account_id = ? AND track_id = ?', [
    accountId,
    trackId,
  ]);
}

export function clearDownloads(accountId: string): void {
  getDatabase().runSync('DELETE FROM downloads WHERE account_id = ?', [accountId]);
}
