import { Check, RotateCcw, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { genres, popularArtists } from '@/data/catalog';
import { tap } from '@/lib/haptics';
import { useLibraryStore } from '@/stores/libraryStore';
import { toast } from '@/stores/toastStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import type { GenreId } from '@/types';

export default function TasteScreen() {
  const { colors } = useTheme();
  const seedGenres = useLibraryStore((state) => state.seedGenres);
  const seedArtists = useLibraryStore((state) => state.seedArtists);
  const saveSeeds = useLibraryStore((state) => state.saveSeeds);
  const [selectedGenres, setSelectedGenres] = useState<GenreId[]>(
    () => Object.keys(seedGenres) as GenreId[],
  );
  const [selectedArtists, setSelectedArtists] = useState<string[]>(() => seedArtists);

  const toggleGenre = (id: GenreId) => {
    tap();
    setSelectedGenres((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleArtist = (id: string) => {
    tap();
    setSelectedArtists((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const save = () => {
    saveSeeds(selectedGenres, selectedArtists);
    toast.success('Taste profile updated');
  };

  const reset = () => {
    setSelectedGenres([]);
    setSelectedArtists([]);
    saveSeeds([], []);
    toast.success('Using listening behaviour only');
  };

  return (
    <Screen contentStyle={styles.content}>
      <PageHeader title="Taste profile" />

      <View style={[styles.intro, { borderColor: colors.border }]}>
        <Sparkles size={18} color={colors.accent} />
        <Text variant="small" tone="secondary" style={styles.introText}>
          BOUND blends these picks with your likes, saves, follows, and listening history. Pick at
          least two genres for sharper daily mixes.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="heading">Genres</Text>
          <Text variant="caption" tone="tertiary">
            {selectedGenres.length} selected
          </Text>
        </View>
        <View style={styles.chips}>
          {genres.map((genre) => (
            <Chip
              key={genre.id}
              label={genre.name}
              selected={selectedGenres.includes(genre.id)}
              onPress={() => toggleGenre(genre.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="heading">Artists</Text>
          <Text variant="caption" tone="tertiary">
            {selectedArtists.length} selected
          </Text>
        </View>
        <View style={[styles.artistGroup, { borderColor: colors.border }]}>
          {popularArtists.map((artist) => {
            const selected = selectedArtists.includes(artist.id);
            return (
              <Pressable
                key={artist.id}
                onPress={() => toggleArtist(artist.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={artist.name}
                style={({ pressed }) => [
                  styles.artistRow,
                  pressed && { opacity: 0.75 },
                ]}>
                <Avatar
                  name={artist.name}
                  seed={artist.artwork.seed}
                  color={artist.accent}
                  size={40}
                />
                <View style={styles.artistText}>
                  <Text variant="bodySemibold" numberOfLines={1}>
                    {artist.name}
                  </Text>
                  <Text variant="caption" tone="tertiary" numberOfLines={1}>
                    {artist.genres
                      .map((genreId) => genres.find((item) => item.id === genreId)?.name)
                      .filter(Boolean)
                      .slice(0, 2)
                      .join(' · ')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.check,
                    {
                      borderColor: selected ? colors.accent : colors.borderStrong,
                      backgroundColor: selected ? colors.accent : 'transparent',
                    },
                  ]}>
                  {selected ? <Check size={13} color={colors.accentInk} strokeWidth={3} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <Button label="Save taste profile" onPress={save} fullWidth />
        <Button
          label="Clear picks"
          variant="ghost"
          icon={RotateCcw}
          onPress={reset}
          fullWidth
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  intro: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  introText: {
    flex: 1,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  artistGroup: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  artistText: {
    flex: 1,
    gap: 1,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
});
