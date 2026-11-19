import type { ProviderConnection, ProviderId } from '@/types';

import { getDatabase } from './database';

type ConnectionRow = {
  provider: ProviderId;
  provider_user_id: string;
  display_name: string;
  scopes: string | null;
  connected_at: number;
};

function mapConnection(row: ConnectionRow): ProviderConnection {
  return {
    provider: row.provider,
    providerUserId: row.provider_user_id,
    displayName: row.display_name,
    scopes: row.scopes ?? undefined,
    connectedAt: row.connected_at,
  };
}

export function listConnections(accountId: string): ProviderConnection[] {
  const rows = getDatabase().getAllSync<ConnectionRow>(
    'SELECT * FROM connected_accounts WHERE account_id = ? ORDER BY connected_at DESC',
    [accountId],
  );
  return rows.map(mapConnection);
}

export function getConnection(
  accountId: string,
  provider: ProviderId,
): ProviderConnection | null {
  const row = getDatabase().getFirstSync<ConnectionRow>(
    'SELECT * FROM connected_accounts WHERE account_id = ? AND provider = ?',
    [accountId, provider],
  );
  return row ? mapConnection(row) : null;
}

export function saveConnection(accountId: string, connection: ProviderConnection): void {
  getDatabase().runSync(
    `INSERT INTO connected_accounts (account_id, provider, provider_user_id, display_name, scopes, connected_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(account_id, provider) DO UPDATE SET
       provider_user_id = excluded.provider_user_id,
       display_name = excluded.display_name,
       scopes = excluded.scopes,
       connected_at = excluded.connected_at`,
    [
      accountId,
      connection.provider,
      connection.providerUserId,
      connection.displayName,
      connection.scopes ?? null,
      connection.connectedAt,
    ],
  );
}

export function removeConnection(accountId: string, provider: ProviderId): void {
  getDatabase().runSync('DELETE FROM connected_accounts WHERE account_id = ? AND provider = ?', [
    accountId,
    provider,
  ]);
}
