import type { ConversionFormat, ConversionRecord } from '@/types';

import { getDatabase } from './database';

type ConversionRow = {
  id: string;
  input_name: string;
  output_name: string;
  output_uri: string;
  format: ConversionFormat;
  bitrate: number;
  sample_rate: number;
  status: 'processing' | 'completed' | 'failed';
  size_bytes: number;
  created_at: number;
  error: string | null;
};

function mapConversion(row: ConversionRow): ConversionRecord {
  return {
    id: row.id,
    inputName: row.input_name,
    outputName: row.output_name,
    outputUri: row.output_uri,
    format: row.format,
    bitrateKbps: row.bitrate,
    sampleRate: row.sample_rate,
    status: row.status,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    error: row.error ?? undefined,
  };
}

export function listConversions(accountId: string): ConversionRecord[] {
  const rows = getDatabase().getAllSync<ConversionRow>(
    'SELECT * FROM conversions WHERE account_id = ? ORDER BY created_at DESC',
    [accountId],
  );
  return rows.map(mapConversion);
}

export function insertConversion(accountId: string, record: ConversionRecord): void {
  getDatabase().runSync(
    `INSERT INTO conversions
      (id, account_id, input_name, output_name, output_uri, format, bitrate, sample_rate, status, size_bytes, created_at, error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      accountId,
      record.inputName,
      record.outputName,
      record.outputUri,
      record.format,
      record.bitrateKbps,
      record.sampleRate,
      record.status,
      record.sizeBytes,
      record.createdAt,
      record.error ?? null,
    ],
  );
}

export function updateConversion(
  id: string,
  patch: Partial<Pick<ConversionRecord, 'status' | 'sizeBytes' | 'outputUri' | 'outputName' | 'error'>>,
): void {
  const db = getDatabase();
  const current = db.getFirstSync<ConversionRow>('SELECT * FROM conversions WHERE id = ?', [id]);
  if (!current) return;
  db.runSync(
    `UPDATE conversions SET output_name = ?, output_uri = ?, status = ?, size_bytes = ?, error = ? WHERE id = ?`,
    [
      patch.outputName ?? current.output_name,
      patch.outputUri ?? current.output_uri,
      patch.status ?? current.status,
      patch.sizeBytes ?? current.size_bytes,
      patch.error === undefined ? current.error : patch.error,
      id,
    ],
  );
}

export function deleteConversion(id: string): void {
  getDatabase().runSync('DELETE FROM conversions WHERE id = ?', [id]);
}

export function clearConversions(accountId: string): void {
  getDatabase().runSync('DELETE FROM conversions WHERE account_id = ?', [accountId]);
}
