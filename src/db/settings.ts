import { getDatabase } from './database';

export type SettingRow = { key: string; value: string };

export function getSetting(scope: string, key: string): string | null {
  const row = getDatabase().getFirstSync<SettingRow>(
    'SELECT key, value FROM settings WHERE scope = ? AND key = ?',
    [scope, key],
  );
  return row?.value ?? null;
}

export function getScopedSettings(scope: string): Record<string, string> {
  const rows = getDatabase().getAllSync<SettingRow>(
    'SELECT key, value FROM settings WHERE scope = ?',
    [scope],
  );
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function setSetting(scope: string, key: string, value: string): void {
  getDatabase().runSync(
    `INSERT INTO settings (scope, key, value) VALUES (?, ?, ?)
     ON CONFLICT(scope, key) DO UPDATE SET value = excluded.value`,
    [scope, key, value],
  );
}

export function deleteSetting(scope: string, key: string): void {
  getDatabase().runSync('DELETE FROM settings WHERE scope = ? AND key = ?', [scope, key]);
}

export function clearScopedSettings(scope: string): void {
  getDatabase().runSync('DELETE FROM settings WHERE scope = ?', [scope]);
}

export const DEVICE_SCOPE = 'device';
