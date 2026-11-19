import { useLocalSearchParams, useRouter } from 'expo-router';
import { Compass, Play, Shuffle } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MediaCard } from '@/components/music/MediaCard';
import { TrackRow } from '@/components/music/TrackRow';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import {
  artists,
  getGenreById,
  tracksByGenre,
} from '@/data/catalog';
import { usePlayerStore } from '@/stores/playerStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import type { GenreId } from '@/types';

export default function GenreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const genre = id ? getGenreById(id as GenreId) : undefined;
  const genreTracks = useMemo(
    () =>
      genre
        ? [...(tracksByGenre.get(genre.id) ?? [])].sort((a, b) => b.popularity - a.popularity)
        : [],
    [genre],
  );
  const genreArtists = useMemo(
    () => (genre ? artists.filter((artist) => artist.genres.includes(genre.id)) : []),
    [genre],
  );
  const related = useMemo(
    () =>
      genre
        ? genre.related
            .map((relatedId) => getGenreById(relatedId))
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
        : [],
    [genre],
  );
  const playTracks = usePlayerStore((state) => state.playTracks);

  if (!genre) {
    return (
      <Screen>
        <PageHeader />
        <EmptyState
          icon={Compass}
          title="Genre not found"
          description="This genre is not part of the catalogue."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const ids = genreTracks.map((track) => track.id);

  return (
    <Screen contentStyle={styles.content}>
      <PageHeader />
      <View
        style={[
          styles.banner,
          { backgroundColor: genre.accent, borderColor: colors.borderStrong },
        ]}>
        <Text variant="eyebrow" tone="inverse">
          GENRE
        </Text>
        <Text variant="display" tone="inverse" style={styles.title}>
          {genre.name}
        </Text>
        <Text variant="body" tone="inverse" style={styles.blurb}>
          {genre.blurb}
        </Text>
        <View style={styles.actions}>
          <Button
            label="Play"
            icon={Play}
            variant="glass"
            onPress={() => playTracks(ids, { context: genre.name, shuffle: true })}
            style={styles.action}
            disabled={ids.length === 0}
          />
          <Button
            label="Shuffle"
            icon={Shuffle}
            variant="secondary"
            onPress={() => playTracks(ids, { context: genre.name, shuffle: true })}
            style={styles.action}
            disabled={ids.length === 0}
          />
        </View>
      </View>

      {genreArtists.length > 0 ? (
        <View style={styles.section}>
          <Text variant="heading">Artists in {genre.name}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}>
            {genreArtists.map((artist) => (
              <MediaCard
                key={artist.id}
                title={artist.name}
                subtitle={artist.hometown}
                artwork={artist.artwork}
                shape="circle"
                width={112}
                onPress={() => router.push(`/artist/${artist.id}`)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="heading">Essential tracks</Text>
        {genreTracks.slice(0, 20).map((track, index) => (
          <TrackRow
            key={track.id}
            track={track}
            index={index}
            onPress={() =>
              playTracks(ids, { context: genre.name, startIndex: index })
            }
            showAlbum
          />
        ))}
      </View>

      {related.length > 0 ? (
        <View style={styles.section}>
          <Text variant="heading">Explore nearby</Text>
          <View style={styles.chips}>
            {related.map((item) => (
              <Chip
                key={item.id}
                label={item.name}
                onPress={() => router.push(`/genre/${item.id}`)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  banner: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xxl,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  blurb: {
    opacity: 0.8,
    maxWidth: 340,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  action: {
    flex: 1,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  rail: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
