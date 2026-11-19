import { useLocalSearchParams, useRouter } from 'expo-router';
import { Disc3, Heart, Play, Shuffle } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { TrackRow } from '@/components/music/TrackRow';
import { Button } from '@/components/ui/Button';
import { CoverArt } from '@/components/ui/CoverArt';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { formatDate, formatLongDuration } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { artistsById, getAlbumById, getAlbumTracks } from '@/data/catalog';

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const album = getAlbumById(id);
  const artist = album ? artistsById.get(album.artistId) : undefined;
  const tracks = useMemo(() => (album ? getAlbumTracks(album.id) : []), [album]);
  const saved = useLibraryStore((state) => (album ? Boolean(state.savedAlbums[album.id]) : false));
  const toggleSaveAlbum = useLibraryStore((state) => state.toggleSaveAlbum);
  const playTracks = usePlayerStore((state) => state.playTracks);

  if (!album) {
    return (
      <Screen>
        <PageHeader />
        <EmptyState
          icon={Disc3}
          title="Album not found"
          description="This release may have been removed."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const duration = tracks.reduce((sum, track) => sum + track.durationSec, 0);
  const ids = tracks.map((track) => track.id);

  return (
    <Screen glow={{ primary: artist?.accent }} contentStyle={styles.content}>
      <PageHeader
        right={
          <Button
            label={saved ? 'Saved' : 'Save'}
            size="sm"
            variant={saved ? 'secondary' : 'ghost'}
            icon={Heart}
            onPress={() => {
              tap();
              toggleSaveAlbum(album.id);
            }}
          />
        }
      />

      <View style={styles.hero}>
        <CoverArt artwork={album.artwork} size={196} radius={radius.lg} />
        <Text variant="eyebrow" tone="tertiary">
          {album.type.toUpperCase()}
        </Text>
        <Text variant="display" center style={styles.title}>
          {album.title}
        </Text>
        <Text
          variant="bodySemibold"
          tone="accent"
          style={{ color: artist?.accent ?? colors.accent }}
          onPress={() => artist && router.push(`/artist/${artist.id}`)}>
          {artist?.name ?? 'Unknown artist'}
        </Text>
        <Text variant="small" tone="tertiary" center>
          {formatDate(album.releaseDate, 'long')} · {tracks.length} tracks ·{' '}
          {formatLongDuration(duration)}
        </Text>
        {album.note ? (
          <Text variant="small" tone="secondary" center style={styles.note}>
            {album.note}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Button
            label="Play"
            icon={Play}
            onPress={() => playTracks(ids, { context: album.title, startIndex: 0 })}
            style={styles.action}
          />
          <Button
            label="Shuffle"
            icon={Shuffle}
            variant="secondary"
            onPress={() => playTracks(ids, { context: album.title, shuffle: true })}
            style={styles.action}
          />
        </View>
      </View>

      <View style={styles.tracks}>
        {tracks.map((track, index) => (
          <TrackRow
            key={track.id}
            track={track}
            index={index}
            subtitle={track.artistName}
            onPress={() =>
              playTracks(ids, { context: album.title, startIndex: index })
            }
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
  note: {
    maxWidth: 320,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    width: '100%',
  },
  action: {
    flex: 1,
  },
  tracks: {
    gap: 2,
  },
});
