import { useRouter } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { HorizontalRail } from '@/components/music/HorizontalRail';
import { MediaCard } from '@/components/music/MediaCard';
import { TrackRow } from '@/components/music/TrackRow';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { CoverArt } from '@/components/ui/CoverArt';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTasteProfile } from '@/hooks/useTasteProfile';
import {
  getDailyMixes,
  getDeepCuts,
  getMoodStations,
  getTopArtists,
  getTopGenres,
} from '@/services/recommendations';
import { usePlayerStore } from '@/stores/playerStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function ForYouScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const profile = useTasteProfile();
  const showExplicit = usePreferencesStore((state) => state.preferences.showExplicit);
  const playTracks = usePlayerStore((state) => state.playTracks);

  const mixes = useMemo(() => getDailyMixes(profile, 6, showExplicit), [profile, showExplicit]);
  const stations = useMemo(() => getMoodStations(showExplicit), [showExplicit]);
  const topGenres = useMemo(() => getTopGenres(profile, 6), [profile]);
  const deepCuts = useMemo(
    () => getDeepCuts(profile, showExplicit, 8),
    [profile, showExplicit],
  );
  const artists = useMemo(() => getTopArtists(profile, 8), [profile]);

  const cardWidth = (width - spacing.xl * 2 - spacing.md) / 2;

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="eyebrow" tone="tertiary">
            MADE FOR YOU
          </Text>
          <Text variant="display">For You</Text>
          <Text variant="body" tone="secondary">
            {topGenres.length > 0
              ? `Built around ${topGenres.slice(0, 3).map((genre) => genre.name).join(', ')}.`
              : 'The more you listen, the sharper this gets.'}
          </Text>
        </View>
        <Button
          label="Tune"
          icon={SlidersHorizontal}
          variant="secondary"
          size="sm"
          onPress={() => router.push('/settings/taste')}
        />
      </View>

      <View style={styles.section}>
        <Text variant="heading">Daily mixes</Text>
        <Text variant="small" tone="tertiary">
          Six mixes, reseeded every day from your play history.
        </Text>
        <View style={styles.grid}>
          {mixes.map((mix) => (
            <View key={mix.id} style={{ width: cardWidth }}>
              <View style={styles.mixArtWrap}>
                <CoverArt artwork={mix.artwork} size={cardWidth} radius={radius.md} />
                <View style={[styles.mixTag, { backgroundColor: mix.accent }]}>
                  <Text variant="eyebrow" tone="inverse" style={styles.mixTagText}>
                    MIX
                  </Text>
                </View>
              </View>
              <Text variant="bodySemibold" numberOfLines={1} style={styles.mixTitle}>
                {mix.title}
              </Text>
              <Text variant="small" tone="tertiary" numberOfLines={1}>
                {mix.subtitle}
              </Text>
              <Button
                label="Play mix"
                size="sm"
                variant="secondary"
                onPress={() =>
                  playTracks(mix.trackIds, { context: mix.title, shuffle: true })
                }
                style={styles.mixButton}
              />
            </View>
          ))}
        </View>
      </View>

      <HorizontalRail title="Stations for your mood" subtitle="Lean back. We'll keep it moving." contentPadding={false}>
        {stations.map((station) => (
          <MediaCard
            key={station.id}
            title={station.title}
            subtitle={station.description}
            artwork={station.artwork}
            accent={station.accent}
            width={158}
            badge="RADIO"
            onPress={() =>
              playTracks(station.trackIds, { context: station.title, shuffle: false })
            }
            onPlay={() =>
              playTracks(station.trackIds, { context: station.title, shuffle: false })
            }
          />
        ))}
      </HorizontalRail>

      <View style={styles.section}>
        <Text variant="heading">Your genres</Text>
        <Text variant="small" tone="tertiary">
          Heavy rotation shapes these. Tap one to go deeper.
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {topGenres.map((genre) => (
            <Chip
              key={genre.id}
              label={genre.name}
              onPress={() => router.push(`/genre/${genre.id}`)}
            />
          ))}
        </ScrollView>
      </View>

      {deepCuts.length > 0 ? (
        <View style={styles.section}>
          <Text variant="heading">Deep cuts</Text>
          <Text variant="small" tone="tertiary">
            The quieter corners of your taste.
          </Text>
          <View style={styles.list}>
            {deepCuts.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                onPress={() =>
                  playTracks(
                    deepCuts.map((item) => item.id),
                    { context: 'Deep cuts', startIndex: index },
                  )
                }
                showSource
              />
            ))}
          </View>
        </View>
      ) : null}

      {artists.length > 0 ? (
        <HorizontalRail title="On your radar" subtitle="Artists gathering momentum in your library." contentPadding={false}>
          {artists.map((artist) => (
            <MediaCard
              key={artist.id}
              title={artist.name}
              subtitle={artist.hometown}
              artwork={artist.artwork}
              shape="circle"
              width={116}
              onPress={() => router.push(`/artist/${artist.id}`)}
            />
          ))}
        </HorizontalRail>
      ) : null}

      <View style={[styles.note, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text variant="bodySemibold">Recommendations are local</Text>
        <Text variant="small" tone="secondary">
          BOUND builds your mixes on this device from plays, skips, likes and follows.
          Nothing about your taste leaves the app.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  mixArtWrap: {
    marginBottom: spacing.sm,
  },
  mixTag: {
    position: 'absolute',
    top: 9,
    left: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  mixTagText: {
    fontSize: 9,
  },
  mixTitle: {
    marginBottom: 1,
  },
  mixButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  chips: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
    marginTop: spacing.xs,
  },
  list: {
    marginTop: spacing.sm,
  },
  note: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
});



