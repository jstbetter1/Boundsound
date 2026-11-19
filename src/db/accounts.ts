import type { Account, AccountKind } from '@/types';

import { getDatabase } from './database';

type AccountRow = {
  id: string;
  kind: AccountKind;
  email: string | null;
  display_name: string;
  password_hash: string | null;
  password_salt: string | null;
  recovery_hash: string | null;
  accent: string;
  avatar_seed: string;
  onboarded: number;
  created_at: number;
  updated_at: number;
};

export type AccountRecord = {
  account: Account;
  passwordHash: string | null;
  passwordSalt: string | null;
  recoveryHash: string | null;
  onboarded: boolean;
};

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    kind: row.kind,
    email: row.email,
    displayName: row.display_name,
    accent: row.accent,
    avatarSeed: row.avatar_seed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRecord(row: AccountRow): AccountRecord {
  return {
    account: mapAccount(row),
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    recoveryHash: row.recovery_hash,
    onboarded: Boolean(row.onboarded),
  };
}

export function getAccountByEmail(email: string): AccountRecord | null {
  const row = getDatabase().getFirstSync<AccountRow>(
    'SELECT * FROM accounts WHERE email = ? COLLATE NOCASE LIMIT 1',
    [email.trim()],
  );
  return row ? mapRecord(row) : null;
}

export function getAccountRecord(id: string): AccountRecord | null {
  const row = getDatabase().getFirstSync<AccountRow>('SELECT * FROM accounts WHERE id = ?', [id]);
  return row ? mapRecord(row) : null;
}

export function listAccounts(): Account[] {
  const rows = getDatabase().getAllSync<AccountRow>(
    'SELECT * FROM accounts ORDER BY updated_at DESC',
  );
  return rows.map(mapAccount);
}

export function insertAccount(input: {
  id: string;
  kind: AccountKind;
  email: string | null;
  displayName: string;
  accent: string;
  avatarSeed: string;
  passwordHash?: string | null;
  passwordSalt?: string | null;
  recoveryHash?: string | null;
  now: number;
}): Account {
  getDatabase().runSync(
    `INSERT INTO accounts
      (id, kind, email, display_name, password_hash, password_salt, recovery_hash, accent, avatar_seed, onboarded, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      input.id,
      input.kind,
      input.email,
      input.displayName,
      input.passwordHash ?? null,
      input.passwordSalt ?? null,
      input.recoveryHash ?? null,
      input.accent,
      input.avatarSeed,
      input.now,
      input.now,
    ],
  );
  return {
    id: input.id,
    kind: input.kind,
    email: input.email,
    displayName: input.displayName,
    accent: input.accent,
    avatarSeed: input.avatarSeed,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function updateAccountProfile(
  id: string,
  patch: { displayName?: string; accent?: string; avatarSeed?: string },
  now: number,
): Account | null {
  const current = getAccountRecord(id);
  if (!current) return null;
  getDatabase().runSync(
    `UPDATE accounts SET display_name = ?, accent = ?, avatar_seed = ?, updated_at = ? WHERE id = ?`,
    [
      patch.displayName ?? current.account.displayName,
      patch.accent ?? current.account.accent,
      patch.avatarSeed ?? current.account.avatarSeed,
      now,
      id,
    ],
  );
  return { ...current.account, ...patch, updatedAt: now };
}

export function markAccountOnboarded(id: string, now: number): void {
  getDatabase().runSync('UPDATE accounts SET onboarded = 1, updated_at = ? WHERE id = ?', [
    now,
    id,
  ]);
}

export function upgradeAccountToMember(
  id: string,
  input: { email: string; passwordHash: string; passwordSalt: string; recoveryHash: string },
  now: number,
): void {
  getDatabase().runSync(
    `UPDATE accounts
     SET kind = 'member', email = ?, password_hash = ?, password_salt = ?, recovery_hash = ?, updated_at = ?
     WHERE id = ?`,
    [input.email, input.passwordHash, input.passwordSalt, input.recoveryHash, now, id],
  );
}

export function updateAccountPassword(
  id: string,
  input: { passwordHash: string; passwordSalt: string },
  now: number,
): void {
  getDatabase().runSync(
    'UPDATE accounts SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?',
    [input.passwordHash, input.passwordSalt, now, id],
  );
}

export function updateAccountRecoveryHash(id: string, recoveryHash: string, now: number): void {
  getDatabase().runSync('UPDATE accounts SET recovery_hash = ?, updated_at = ? WHERE id = ?', [
    recoveryHash,
    now,
    id,
  ]);
}

export function deleteAccountRecord(id: string): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    const tables: [string, string][] = [
      ['playlists', 'account_id'],
      ['liked_tracks', 'account_id'],
      ['saved_albums', 'account_id'],
      ['followed_artists', 'account_id'],
      ['seed_genres', 'account_id'],
      ['seed_artists', 'account_id'],
      ['play_history', 'account_id'],
      ['recent_searches', 'account_id'],
      ['downloads', 'account_id'],
      ['conversions', 'account_id'],
      ['connected_accounts', 'account_id'],
      ['imported_tracks', 'account_id'],
    ];
    for (const [table, column] of tables) {
      db.runSync(`DELETE FROM ${table} WHERE ${column} = ?`, [id]);
    }
    db.runSync('DELETE FROM playlist_tracks WHERE playlist_id NOT IN (SELECT id FROM playlists)', []);
    db.runSync('DELETE FROM settings WHERE scope = ?', [id]);
    db.runSync('DELETE FROM accounts WHERE id = ?', [id]);
  });
}
