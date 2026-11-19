import { create } from 'zustand';

import { DEVICE_SCOPE, getScopedSettings, setSetting } from '@/db/settings';
import type { ThemePreference } from '@/theme/ThemeProvider';

export type Preferences = {
  theme: ThemePreference;
  audioQuality: 'standard' | 'high';
  downloadOverCellular: boolean;
  backgroundPlayback: boolean;
  lockScreenControls: boolean;
  autoplaySimilar: boolean;
  showExplicit: boolean;
  libraryView: 'list' | 'grid';
  reduceMotion: boolean;
};

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'dark',
  audioQuality: 'high',
  downloadOverCellular: false,
  backgroundPlayback: true,
  lockScreenControls: true,
  autoplaySimilar: true,
  showExplicit: true,
  libraryView: 'list',
  reduceMotion: false,
};

type PreferencesState = {
  preferences: Preferences;
  hydrated: boolean;
  hydrate: () => void;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  reset: () => void;
};

function parsePreferences(raw: string | undefined): Preferences {
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export const usePreferencesStore = create<PreferencesState>()((set, get) => ({
  preferences: DEFAULT_PREFERENCES,
  hydrated: false,
  hydrate: () => {
    const stored = getScopedSettings(DEVICE_SCOPE);
    const preferences = parsePreferences(stored.preferences);
    set({ preferences, hydrated: true });
    setSetting(DEVICE_SCOPE, 'preferences', JSON.stringify(preferences));
  },
  setPreference: (key, value) => {
    const preferences = { ...get().preferences, [key]: value };
    set({ preferences });
    setSetting(DEVICE_SCOPE, 'preferences', JSON.stringify(preferences));
  },
  reset: () => {
    set({ preferences: DEFAULT_PREFERENCES });
    setSetting(DEVICE_SCOPE, 'preferences', JSON.stringify(DEFAULT_PREFERENCES));
  },
}));

export function usePreference<K extends keyof Preferences>(key: K): Preferences[K] {
  return usePreferencesStore((state) => state.preferences[key]);
}
