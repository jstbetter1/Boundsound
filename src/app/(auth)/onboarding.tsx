import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { CoverArt } from '@/components/ui/CoverArt';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { genres, popularArtists } from '@/data/catalog';
import { tap } from '@/lib/haptics';
import { useAuthStore } from '@/stores/authStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import type { GenreId } from '@/types';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const saveSeeds = useLibraryStore((state) => state.saveSeeds);
  const [step, setStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<GenreId[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggle<T extends string>(id: T, list: T[], setList: (next: T[]) => void) {
    tap();
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  const finish = async (skip = false) => {
    setSaving(true);
    if (!skip) saveSeeds(selectedGenres, selectedArtists);
    await completeOnboarding();
    setSaving(false);
    router.replace('/(tabs)');
  };

  const next = () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    void finish();
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.buttons}>
            {step === 1 ? (
              <Button
                label="Back"
                variant="ghost"
                onPress={() => setStep(0)}
                style={styles.flex}
              />
            ) : null}
            <Button
              label={step === 0 ? 'Continue' : 'Start listening'}
              onPress={next}
              loading={saving}
              disabled={step === 0 && selectedGenres.length < 2}
              style={styles.flex}
              size="lg"
            />
          </View>
          <Button
            label="Skip for now"
            variant="ghost"
            onPress={() => void finish(true)}
            disabled={saving}
          />
        </View>
      }>
      <View style={styles.top}>
        <Text variant="eyebrow" tone="tertiary">
          SET YOUR SIGNAL
        </Text>
        <View style={styles.progress}>
          {[0, 1].map((index) => (
            <View
              key={index}
              style={[
                styles.progressBar,
                {
                  backgroundColor: index <= step ? colors.accent : colors.surfaceSunken,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.header}>
        <Text variant="display">{step === 0 ? 'What moves you?' : 'Who do you trust?'}</Text>
        <Text variant="body" tone="secondary">
          {step === 0
            ? 'Pick at least two genres. We’ll tune your daily mixes and radio around them.'
            : 'Follow a few artists to shape your recommendations. You can change this anytime.'}
        </Text>
      </View>

      {step === 0 ? (
        <View style={styles.wrap}>
          {genres.map((genre) => {
            const selected = selectedGenres.includes(genre.id);
            return (
              <Chip
                key={genre.id}
                label={genre.name}
                selected={selected}
                onPress={() => toggle(genre.id, selectedGenres, setSelectedGenres)}
              />
            );
          })}
        </View>
      ) : (
        <View style={styles.artistGrid}>
          {popularArtists.map((artist) => {
            const selected = selectedArtists.includes(artist.id);
            return (
              <Pressable
                key={artist.id}
                onPress={() => toggle(artist.id, selectedArtists, setSelectedArtists)}
                style={styles.artist}
                accessibilityRole="button"
                accessibilityState={{ selected }}>
                <View>
                  <CoverArt artwork={artist.artwork} size={84} radius={42} />
                  {selected ? (
                    <View
                      style={[
                        styles.check,
                        { backgroundColor: colors.accent, borderColor: colors.canvas },
                      ]}>
                      <Check size={12} color={colors.accentInk} strokeWidth={3} />
                    </View>
                  ) : null}
                </View>
                <Text variant="small" numberOfLines={1} center>
                  {artist.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: radius.pill,
  },
  header: {
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  artistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.xl,
    paddingBottom: spacing.xl,
  },
  artist: {
    width: '30%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  check: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
