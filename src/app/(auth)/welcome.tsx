import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { DEMO_AUDIO_CREDIT } from '@/data/catalog';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [loadingGuest, setLoadingGuest] = useState(false);
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);
  const error = useAuthStore((state) => state.error);

  const handleGuest = async () => {
    setLoadingGuest(true);
    const ok = await continueAsGuest();
    setLoadingGuest(false);
    if (ok) router.replace('/(auth)/onboarding');
  };

  return (
    <Screen scroll={false} edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.brandRow}>
        <Text variant="eyebrow" tone="tertiary" style={styles.brand}>
          BOUND
        </Text>
        <View style={[styles.brandDot, { backgroundColor: colors.accent }]} />
      </View>

      <View style={styles.hero}>
        <Text variant="display" style={styles.headline}>
          Music,{'\n'}without the{'\n'}noise
          <Text variant="display" tone="accent" style={styles.headline}>
            .
          </Text>
        </Text>
        <Text variant="body" tone="secondary" style={styles.sub}>
          One place for every source. Discover, collect, play, convert and keep
          the music you love — offline.
        </Text>
      </View>

      <View style={styles.actions}>
        {error ? (
          <Text variant="small" tone="danger" center>
            {error}
          </Text>
        ) : null}
        <Button
          label="Continue with email"
          onPress={() => router.push('/(auth)/sign-in')}
          fullWidth
          size="lg"
        />
        <Button
          label="Create an account"
          variant="secondary"
          onPress={() => router.push('/(auth)/create-account')}
          fullWidth
          size="lg"
        />
        <Button
          label="Explore as guest"
          variant="ghost"
          onPress={handleGuest}
          loading={loadingGuest}
          fullWidth
        />
      </View>

      <View style={styles.legal}>
        <Text variant="caption" tone="tertiary" center>
          By continuing you agree to keep the demo honest. BOUND is a demo
          library built for real listening.
        </Text>
        <Text variant="caption" tone="tertiary" center>
          {DEMO_AUDIO_CREDIT}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brand: {
    letterSpacing: 4,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  headline: {
    fontSize: 48,
    lineHeight: 51,
    letterSpacing: -2,
  },
  sub: {
    maxWidth: 350,
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  legal: {
    gap: 6,
  },
});
