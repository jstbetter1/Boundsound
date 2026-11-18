import { useLocalSearchParams, useRouter } from 'expo-router';
import { Play, Shuffle, UserCheck, UserPlus } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MediaCard } from '@/components/music/MediaCard';
import { TrackRow } from '@/components/music/TrackRow';
import { Button } from '@/components/ui/Button';
import { CoverArt } from '@/components/ui/CoverArt';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import {
  artistsById,
  getArtistAlbums,
  getArtistTracks,
} from '@/data/catalog';
import { formatCount } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const artist = artistsById.get(id ?? '');
  const albums = useMemo(() => (artist ? getArtistAlbums(artist.id) : []), [artist]);
  const tracks = useMemo(
    () => (artist ? [...getArtistTracks(artist.id)].sort((a, b) => b.popularity - a.popularity) : []),
    [artist],
  );
  const related = useMemo(() => {
    if (!artist) return [];
    return [...artistsById.values()]
      .filter(
        (item) =>
          item.id !== artist.id && item.genres.some((genre) => artist.genres.includes(genre)),
      )
      .slice(0, 8);
  }, [artist]);

  const following = useLibraryStore((state) =>
    artist ? Boolean(state.followedArtists[artist.id]) : false,
  );
  const toggleFollowArtist = useLibraryStore((state) => state.toggleFollowArtist);
  const playTracks = usePlayerStore((state) => state.playTracks);

  if (!artist) {
    return (
      <Screen>
        <PageHeader />
        <EmptyState
          icon={UserPlus}
          title="Artist not found"
          description="This artist may no longer be available."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const ids = tracks.map((track) => track.id);

  return (
    <Screen glow={{ primary: artist.accent }} contentStyle={styles.content}>
      <PageHeader
        right={
          <Button
            label={following ? 'Following' : 'Follow'}
            icon={following ? UserCheck : UserPlus}
            size="sm"
            variant={following ? 'secondary' : 'primary'}
            onPress={() => {
              tap();
              toggleFollowArtist(artist.id);
            }}
          />
        }
      />

      <View style={styles.hero}>
        <CoverArt artwork={artist.artwork} size={170} radius={85} />
        <Text variant="display" center style={styles.name}>
          {artist.name}
        </Text>
        <Text variant="small" tone="tertiary" center>
          {formatCount(artist.monthlyListeners)} monthly listeners · {artist.hometown}
        </Text>
        <View style={styles.actions}>
          <Button
            label="Play"
            icon={Play}
            onPress={() => playTracks(ids, { context: artist.name })}
            style={styles.action}
          />
          <Button
            label="Shuffle"
            icon={Shuffle}
            variant="secondary"
            onPress={() => playTracks(ids, { context: artist.name, shuffle: true })}
            style={styles.action}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="heading">Popular</Text>
        <View>
          {tracks.slice(0, 8).map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              subtitle={track.albumTitle}
              onPress={() =>
                playTracks(ids, { context: artist.name, startIndex: index })
              }
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="heading">Discography</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}>
          {albums.map((album) => (
            <MediaCard
              key={album.id}
              title={album.title}
              subtitle={`${album.type.toUpperCase()} · ${album.releaseDate.slice(0, 4)}`}
              artwork={album.artwork}
              onPress={() => router.push(`/album/${album.id}`)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text variant="heading">About</Text>
        <Text variant="body" tone="secondary" style={styles.bio}>
          {artist.bio}
        </Text>
        <View style={styles.metaRow}>
          <Text variant="caption" tone="tertiary">
            {artist.genres.map((genre) => genre.replace(/-/g, ' ')).join(' · ')}
          </Text>
          <Text variant="caption" tone="tertiary">
            Active since {artist.since}
          </Text>
        </View>
      </View>

      {related.length > 0 ? (
        <View style={styles.section}>
          <Text variant="heading">Fans also like</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}>
            {related.map((item) => (
              <MediaCard
                key={item.id}
                title={item.name}
                subtitle={item.hometown}
                artwork={item.artwork}
                shape="circle"
                width={112}
                onPress={() => router.push(`/artist/${item.id}`)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={[styles.verified, { borderColor: colors.border }]}>
        <View style={[styles.dot, { backgroundColor: artist.accent }]} />
        <Text variant="caption" tone="tertiary">
          {artist.verified ? 'Verified artist on BOUND' : 'Independent artist on BOUND'}
        </Text>
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
  name: {
    fontSize: 30,
    lineHeight: 36,
    marginTop: spacing.xs,
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
  section: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  rail: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  bio: {
    lineHeight: 23,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
