import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function Index() {
  const initialized = useAuthStore((state) => state.initialized);
  const account = useAuthStore((state) => state.account);
  const onboarded = useAuthStore((state) => state.onboarded);
  const { colors } = useTheme();

  if (!initialized) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.canvas }]}>
        <Text variant="display" style={styles.wordmark}>
          BOUND
        </Text>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!account) return <Redirect href="/(auth)/welcome" />;
  if (!onboarded) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  wordmark: {
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: 8,
  },
});
