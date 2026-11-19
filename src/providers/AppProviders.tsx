import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FeedbackHost } from '@/components/layout/FeedbackHost';
import {
  setBackgroundPreference,
  setLockScreenPreference,
} from '@/services/audio/engine';
import { useAuthStore } from '@/stores/authStore';
import { useDownloadsStore } from '@/stores/downloadsStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { ThemeProvider } from '@/theme/ThemeProvider';

function AppBootstrap() {
  const initialize = useAuthStore((state) => state.initialize);
  const accountId = useAuthStore((state) => state.account?.id ?? null);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const backgroundPlayback = usePreferencesStore(
    (state) => state.preferences.backgroundPlayback,
  );
  const lockScreenControls = usePreferencesStore(
    (state) => state.preferences.lockScreenControls,
  );

  useEffect(() => {
    void initialize().then(() => hydratePreferences());
  }, [hydratePreferences, initialize]);

  useEffect(() => {
    if (!accountId) {
      useLibraryStore.getState().unload();
      useDownloadsStore.getState().unload();
      return;
    }
    useLibraryStore.getState().hydrate(accountId);
    useDownloadsStore.getState().hydrate(accountId);
    usePlayerStore.getState().hydrate();
  }, [accountId]);

  useEffect(() => {
    setBackgroundPreference(backgroundPlayback);
    setLockScreenPreference(lockScreenControls);
  }, [backgroundPlayback, lockScreenControls]);

  return null;
}

function AppStatusBar() {
  const isDark = usePreferencesStore((state) => state.preferences.theme !== 'light');
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const theme = usePreferencesStore((state) => state.preferences.theme);
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider preference={theme}>
          <AppBootstrap />
          {children}
          <FeedbackHost />
          <AppStatusBar />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
