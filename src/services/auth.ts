import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import {
  deleteAccountRecord,
  insertAccount,
  markAccountOnboarded,
  getAccountByEmail,
  getAccountRecord,
  updateAccountPassword,
  updateAccountProfile,
  updateAccountRecoveryHash,
  upgradeAccountToMember,
} from '@/db/accounts';
import { createId } from '@/lib/ids';
import type { Account } from '@/types';

const SESSION_KEY = 'bound.session.account';
const WEB_SESSION_KEY = 'bound:session';
const SCRYPT_PARAMS = { N: 2 ** 14, r: 8, p: 1, dkLen: 32, maxmem: 64 * 1024 * 1024 };
const RECOVERY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

function randomHex(bytes: number): string {
  return bytesToHex(Crypto.getRandomBytes(bytes));
}

async function derive(secret: string, salt: string): Promise<string> {
  const hash = await scryptAsync(utf8ToBytes(secret.normalize('NFKC')), hexToBytes(salt), SCRYPT_PARAMS);
  return bytesToHex(hash);
}

export function hashPassword(password: string): Promise<{ passwordHash: string; passwordSalt: string }> {
  const salt = randomHex(16);
  return derive(password, salt).then((hash) => ({ passwordHash: hash, passwordSalt: salt }));
}

function generateRecoveryKey(): string {
  const bytes = Crypto.getRandomBytes(16);
  let key = '';
  for (const byte of bytes) {
    key += RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length];
  }
  const groups = key.match(/.{1,4}/g) ?? [key];
  return `BND-${groups.slice(0, 4).join('-')}`;
}

function normalizeRecoveryKey(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^BND/, '');
}

async function hashRecoveryKey(): Promise<{ stored: string; plain: string }> {
  const plain = generateRecoveryKey();
  const salt = randomHex(16);
  const hash = await derive(normalizeRecoveryKey(plain), salt);
  return { stored: `${salt}:${hash}`, plain };
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'That email address looks incomplete.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[a-zA-Z]/.test(password)) return 'Include at least one letter.';
  if (!/[0-9]/.test(password)) return 'Include at least one number.';
  return null;
}

export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

async function saveSession(accountId: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(WEB_SESSION_KEY, accountId);
    } catch {
      // Ignore storage failures on web.
    }
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, accountId);
}

async function readSession(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(WEB_SESSION_KEY);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(SESSION_KEY);
}

async function clearSession(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(WEB_SESSION_KEY);
    } catch {
      // Ignore.
    }
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export type AuthResult = {
  account: Account;
  onboarded: boolean;
  recoveryKey?: string;
};

export async function createGuestAccount(): Promise<AuthResult> {
  const now = Date.now();
  const account = insertAccount({
    id: createId(),
    kind: 'guest',
    email: null,
    displayName: 'Guest listener',
    accent: '#C8F751',
    avatarSeed: randomHex(6),
    now,
  });
  await saveSession(account.id);
  return { account, onboarded: false };
}

export async function createMemberAccount(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResult> {
  const emailError = validateEmail(input.email);
  if (emailError) throw new AuthError(emailError);
  const passwordError = validatePassword(input.password);
  if (passwordError) throw new AuthError(passwordError);
  const displayName = input.displayName.trim();
  if (displayName.length < 2) throw new AuthError('Tell us what to call you (2+ characters).');
  const email = input.email.trim().toLowerCase();
  if (getAccountByEmail(email)) throw new AuthError('An account with that email already exists.');

  const credentials = await hashPassword(input.password);
  const recovery = await hashRecoveryKey();
  const now = Date.now();
  const account = insertAccount({
    id: createId(),
    kind: 'member',
    email,
    displayName,
    accent: '#C8F751',
    avatarSeed: randomHex(6),
    passwordHash: credentials.passwordHash,
    passwordSalt: credentials.passwordSalt,
    recoveryHash: recovery.stored,
    now,
  });
  await saveSession(account.id);
  return { account, onboarded: false, recoveryKey: recovery.plain };
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const emailError = validateEmail(input.email);
  if (emailError) throw new AuthError(emailError);
  const record = getAccountByEmail(input.email.trim());
  if (!record || record.account.kind !== 'member' || !record.passwordHash || !record.passwordSalt) {
    throw new AuthError('No member account matches that email.');
  }
  const hash = await derive(input.password, record.passwordSalt);
  if (hash !== record.passwordHash) throw new AuthError('That password is not correct.');
  await saveSession(record.account.id);
  return { account: record.account, onboarded: record.onboarded };
}

export async function signInToAccount(accountId: string): Promise<AuthResult | null> {
  const record = getAccountRecord(accountId);
  if (!record) return null;
  await saveSession(accountId);
  return { account: record.account, onboarded: record.onboarded };
}

export async function restoreSession(): Promise<AuthResult | null> {
  const accountId = await readSession();
  if (!accountId) return null;
  const record = getAccountRecord(accountId);
  if (!record) return null;
  return { account: record.account, onboarded: record.onboarded };
}

export async function signOut(): Promise<void> {
  await clearSession();
}

export async function finishOnboarding(accountId: string): Promise<void> {
  markAccountOnboarded(accountId, Date.now());
}

export async function upgradeGuest(input: {
  accountId: string;
  email: string;
  password: string;
  displayName?: string;
}): Promise<AuthResult> {
  const record = getAccountRecord(input.accountId);
  if (!record) throw new AuthError('Your session has expired. Sign in again.');
  if (record.account.kind === 'member') throw new AuthError('This account is already a member account.');
  const emailError = validateEmail(input.email);
  if (emailError) throw new AuthError(emailError);
  const passwordError = validatePassword(input.password);
  if (passwordError) throw new AuthError(passwordError);
  const email = input.email.trim().toLowerCase();
  const existing = getAccountByEmail(email);
  if (existing && existing.account.id !== input.accountId) {
    throw new AuthError('An account with that email already exists.');
  }
  const credentials = await hashPassword(input.password);
  const recovery = await hashRecoveryKey();
  upgradeAccountToMember(
    input.accountId,
    {
      email,
      passwordHash: credentials.passwordHash,
      passwordSalt: credentials.passwordSalt,
      recoveryHash: recovery.stored,
    },
    Date.now(),
  );
  if (input.displayName && input.displayName.trim().length >= 2) {
    updateAccountProfile(input.accountId, { displayName: input.displayName.trim() }, Date.now());
  }
  const updated = getAccountRecord(input.accountId);
  if (!updated) throw new AuthError('Could not upgrade this account.');
  return {
    account: updated.account,
    onboarded: updated.onboarded,
    recoveryKey: recovery.plain,
  };
}

export async function verifyRecoveryKey(email: string, recoveryKey: string): Promise<boolean> {
  const record = getAccountByEmail(email.trim());
  if (!record || !record.recoveryHash) return false;
  const [salt, expected] = record.recoveryHash.split(':');
  if (!salt || !expected) return false;
  const normalized = normalizeRecoveryKey(recoveryKey);
  if (normalized.length < 8) return false;
  const hash = await derive(normalized, salt);
  return hash === expected;
}

export async function resetPasswordWithRecovery(input: {
  email: string;
  recoveryKey: string;
  password: string;
}): Promise<{ recoveryKey: string }> {
  const emailError = validateEmail(input.email);
  if (emailError) throw new AuthError(emailError);
  const passwordError = validatePassword(input.password);
  if (passwordError) throw new AuthError(passwordError);
  const valid = await verifyRecoveryKey(input.email, input.recoveryKey);
  if (!valid) throw new AuthError('That recovery key does not match this account.');
  const record = getAccountByEmail(input.email.trim());
  if (!record) throw new AuthError('No member account matches that email.');
  const credentials = await hashPassword(input.password);
  const recovery = await hashRecoveryKey();
  updateAccountPassword(record.account.id, credentials, Date.now());
  updateAccountRecoveryHash(record.account.id, recovery.stored, Date.now());
  await saveSession(record.account.id);
  return { recoveryKey: recovery.plain };
}

export async function changePassword(input: {
  accountId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const record = getAccountRecord(input.accountId);
  if (!record || !record.passwordHash || !record.passwordSalt) {
    throw new AuthError('This account does not use a password.');
  }
  const passwordError = validatePassword(input.newPassword);
  if (passwordError) throw new AuthError(passwordError);
  const currentHash = await derive(input.currentPassword, record.passwordSalt);
  if (currentHash !== record.passwordHash) throw new AuthError('Your current password is not correct.');
  const credentials = await hashPassword(input.newPassword);
  updateAccountPassword(input.accountId, credentials, Date.now());
}

export async function regenerateRecoveryKey(accountId: string): Promise<string> {
  const record = getAccountRecord(accountId);
  if (!record || record.account.kind !== 'member') {
    throw new AuthError('Only member accounts have recovery keys.');
  }
  const recovery = await hashRecoveryKey();
  updateAccountRecoveryHash(accountId, recovery.stored, Date.now());
  return recovery.plain;
}

export async function deleteAccount(input: {
  accountId: string;
  password?: string;
}): Promise<void> {
  const record = getAccountRecord(input.accountId);
  if (!record) return;
  if (record.account.kind === 'member' && record.passwordHash && record.passwordSalt) {
    if (!input.password) throw new AuthError('Enter your password to delete this account.');
    const hash = await derive(input.password, record.passwordSalt);
    if (hash !== record.passwordHash) throw new AuthError('That password is not correct.');
  }
  deleteAccountRecord(input.accountId);
  await clearSession();
}

export function generateGuestRecoveryHint(): string {
  return 'Guest accounts live on this device only. Create a member account to keep your library safe.';
}
