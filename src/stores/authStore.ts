import { create } from 'zustand';

import { bootstrapStorage } from '@/db';
import { updateAccountProfile } from '@/db/accounts';
import {
  AuthError,
  changePassword,
  createGuestAccount,
  createMemberAccount,
  deleteAccount as deleteAccountService,
  finishOnboarding,
  regenerateRecoveryKey,
  resetPasswordWithRecovery,
  restoreSession,
  signIn as signInService,
  signOut as signOutService,
  upgradeGuest,
} from '@/services/auth';
import type { Account } from '@/types';

type AuthState = {
  initialized: boolean;
  account: Account | null;
  onboarded: boolean;
  busy: boolean;
  error: string | null;
  recoveryKey: string | null;
  initialize: () => Promise<void>;
  continueAsGuest: () => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (input: { email: string; password: string; displayName: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  upgrade: (input: { email: string; password: string; displayName: string }) => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
  updateProfile: (patch: { displayName?: string; accent?: string; avatarSeed?: string }) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  regenerateRecoveryKey: () => Promise<string | null>;
  resetPassword: (input: {
    email: string;
    recoveryKey: string;
    password: string;
  }) => Promise<boolean>;
  deleteAccount: (password?: string) => Promise<boolean>;
  clearRecoveryKey: () => void;
  clearError: () => void;
};

function message(error: unknown): string {
  if (error instanceof AuthError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Try again.';
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  initialized: false,
  account: null,
  onboarded: false,
  busy: false,
  error: null,
  recoveryKey: null,

  initialize: async () => {
    try {
      await bootstrapStorage();
      const session = await restoreSession();
      if (session) {
        set({
          initialized: true,
          account: session.account,
          onboarded: session.onboarded,
          recoveryKey: null,
        });
      } else {
        set({ initialized: true, account: null, onboarded: false });
      }
    } catch (error) {
      set({ initialized: true, account: null, onboarded: false, error: message(error) });
    }
  },

  continueAsGuest: async () => {
    set({ busy: true, error: null });
    try {
      const result = await createGuestAccount();
      set({ account: result.account, onboarded: result.onboarded, busy: false });
      return true;
    } catch (error) {
      set({ busy: false, error: message(error) });
      return false;
    }
  },

  signIn: async (email, password) => {
    set({ busy: true, error: null });
    try {
      const result = await signInService({ email, password });
      set({
        account: result.account,
        onboarded: result.onboarded,
        busy: false,
        recoveryKey: null,
      });
      return true;
    } catch (error) {
      set({ busy: false, error: message(error) });
      return false;
    }
  },

  signUp: async (input) => {
    set({ busy: true, error: null });
    try {
      const result = await createMemberAccount(input);
      set({
        account: result.account,
        onboarded: result.onboarded,
        busy: false,
        recoveryKey: result.recoveryKey ?? null,
      });
      return true;
    } catch (error) {
      set({ busy: false, error: message(error) });
      return false;
    }
  },

  signOut: async () => {
    await signOutService();
    set({ account: null, onboarded: false, recoveryKey: null, error: null });
  },

  upgrade: async (input) => {
    const account = get().account;
    if (!account) return false;
    set({ busy: true, error: null });
    try {
      const result = await upgradeGuest({
        accountId: account.id,
        email: input.email,
        password: input.password,
        displayName: input.displayName,
      });
      set({
        account: result.account,
        onboarded: result.onboarded,
        busy: false,
        recoveryKey: result.recoveryKey ?? null,
      });
      return true;
    } catch (error) {
      set({ busy: false, error: message(error) });
      return false;
    }
  },

  completeOnboarding: async () => {
    const account = get().account;
    if (!account) return;
    await finishOnboarding(account.id);
    set({ onboarded: true });
  },

  updateProfile: (patch) => {
    const account = get().account;
    if (!account) return;
    const updated = updateAccountProfile(account.id, patch, Date.now());
    if (updated) set({ account: updated });
  },

  changePassword: async (currentPassword, newPassword) => {
    const account = get().account;
    if (!account) return false;
    set({ busy: true, error: null });
    try {
      await changePassword({
        accountId: account.id,
        currentPassword,
        newPassword,
      });
      set({ busy: false });
      return true;
    } catch (error) {
      set({ busy: false, error: message(error) });
      return false;
    }
  },

  regenerateRecoveryKey: async () => {
    const account = get().account;
    if (!account) return null;
    set({ busy: true, error: null });
    try {
      const key = await regenerateRecoveryKey(account.id);
      set({ busy: false, recoveryKey: key });
      return key;
    } catch (error) {
      set({ busy: false, error: message(error) });
      return null;
    }
  },

  resetPassword: async (input) => {
    set({ busy: true, error: null });
    try {
      const result = await resetPasswordWithRecovery(input);
      const session = await restoreSession();
      set({
        busy: false,
        recoveryKey: result.recoveryKey,
        account: session?.account ?? null,
        onboarded: session?.onboarded ?? false,
      });
      return true;
    } catch (error) {
      set({ busy: false, error: message(error) });
      return false;
    }
  },

  deleteAccount: async (password) => {
    const account = get().account;
    if (!account) return false;
    set({ busy: true, error: null });
    try {
      await deleteAccountService({ accountId: account.id, password });
      set({
        busy: false,
        account: null,
        onboarded: false,
        recoveryKey: null,
        error: null,
      });
      return true;
    } catch (error) {
      set({ busy: false, error: message(error) });
      return false;
    }
  },

  clearRecoveryKey: () => set({ recoveryKey: null }),
  clearError: () => set({ error: null }),
}));
