import { useRouter } from 'expo-router';
import {
  ArrowDownToLine,
  Clock3,
  Heart,
  ListMusic,
  Plus,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { MediaCard } from '@/components/music/MediaCard';
import { TrackRow } from '@/components/music/TrackRow';
import { Button } from '@/components/ui/Button';
import { CoverArt } from '@/components/ui/CoverArt';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import {
  artistsById,
  getAlbumById,
  getTracksByIds,
} from '@/data/catalog';
import { useDownloadsStore } from '@/stores/downloadsStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/toastStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type Filter = 'all' | 'playlists' | 'albums' | 'artists' | 'liked';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'playlists', label: 'Playlists' },
  { value: 'albums', label: 'Albums' },
  { value: 'artists', label: 'Artists' },
  { value: 'liked', label: 'Liked' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const playlists = useLibraryStore((state) => state.playlists);
  const liked = useLibraryStore((state) => state.liked);
  const savedAlbums = useLibraryStore((state) => state.savedAlbums);
  const followedArtists = useLibraryStore((state) => state.followedArtists);
  const history = useLibraryStore((state) => state.history);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);
  const downloads = useDownloadsStore((state) => state.records);
  const playTracks = usePlayerStore((state) => state.playTracks);

  const likedTracks = useMemo(
    () =>
      getTracksByIds(
        Object.entries(liked)
          .sort((a, b) => b[1] - a[1])
          .map(([trackId]) => trackId),
      ),
    [liked],
  );

  const albums = useMemo(
    () =>
      Object.entries(savedAlbums)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => getAlbumById(id))
        .filter((album): album is NonNullable<typeof album> => Boolean(album)),
    [savedAlbums],
  );

  const artists = useMemo(
    () =>
      Object.entries(followedArtists)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => artistsById.get(id))
        .filter((artist): artist is NonNullable<typeof artist> => Boolean(artist)),
    [followedArtists],
  );

  const recentTrack = history[0];
  const downloaded = Object.values(downloads).filter((record) => record.status === 'completed');
  const cardWidth = (width - spacing.xl * 2 - spacing.md) / 2;

  const save = () => {
    if (!name.trim()) return;
    setSaving(true);
    const playlist = createPlaylist({ name });
    setSaving(false);
    setName('');
    setCreating(false);
    if (playlist) {
      toast.success(`Created ${playlist.title}`);
      router.push(`/playlist/${playlist.id}`);
    } else {
      toast.error('Could not create playlist.');
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="eyebrow" tone="tertiary">
            YOUR COLLECTION
          </Text>
          <Text variant="display">Library</Text>
        </View>
        <IconButton
          icon={Plus}
          accessibilityLabel="Create playlist"
          onPress={() => setCreating(true)}
          variant="glass"
        />
      </View>

      <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />

      {filter === 'all' ? (
        <>
          <View style={styles.shortcuts}>
            <Pressable
              onPress={() => setFilter('liked')}
              style={[styles.shortcut, { backgroundColor: colors.surfaceSolid, borderColor: colors.border }]}
              accessibilityRole="button">
              <View style={[styles.shortcutIcon, { backgroundColor: colors.accentSoft }]}>
                <Heart size={18} color={colors.accent} fill={colors.accent} />
              </View>
              <View style={styles.shortcutText}>
                <Text variant="bodySemibold">Liked songs</Text>
                <Text variant="caption" tone="tertiary">
                  {likedTracks.length} tracks
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/downloads')}
              style={[styles.shortcut, { backgroundColor: colors.surfaceSolid, borderColor: colors.border }]}
              accessibilityRole="button">
              <View style={[styles.shortcutIcon, { backgroundColor: colors.surfaceSunken }]}>
                <ArrowDownToLine size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.shortcutText}>
                <Text variant="bodySemibold">Downloads</Text>
                <Text variant="caption" tone="tertiary">
                  {downloaded.length} offline
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => router.push('/settings/history')}
              style={[styles.shortcut, { backgroundColor: colors.surfaceSolid, borderColor: colors.border }]}
              accessibilityRole="button">
              <View style={[styles.shortcutIcon, { backgroundColor: colors.surfaceSunken }]}>
                <Clock3 size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.shortcutText}>
                <Text variant="bodySemibold">History</Text>
                <Text variant="caption" tone="tertiary" numberOfLines={1}>
                  {recentTrack
                    ? getTracksByIds([recentTrack.trackId])[0]?.title ?? 'Recently played'
                    : 'Nothing played yet'}
                </Text>
              </View>
            </Pressable>
          </View>

          {playlists.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text variant="heading">Your playlists</Text>
                <Pressable onPress={() => setCreating(true)} hitSlop={8}>
                  <Text variant="small" tone="tertiary">
                    New
                  </Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}>
                {playlists.map((playlist) => (
                  <MediaCard
                    key={playlist.id}
                    title={playlist.title}
                    subtitle={`${playlist.trackIds.length} tracks`}
                    artwork={playlist.artwork}
                    onPress={() => router.push(`/playlist/${playlist.id}`)}
                    onPlay={() =>
                      playTracks(playlist.trackIds, { context: playlist.title })
                    }
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {albums.length > 0 ? (
            <View style={styles.section}>
              <Text variant="heading">Saved albums</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}>
                {albums.map((album) => {
                  const artist = artistsById.get(album.artistId);
                  return (
                    <MediaCard
                      key={album.id}
                      title={album.title}
                      subtitle={artist?.name}
                      artwork={album.artwork}
                      onPress={() => router.push(`/album/${album.id}`)}
                      onPlay={() => playTracks(album.trackIds, { context: album.title })}
                    />
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {artists.length > 0 ? (
            <View style={styles.section}>
              <Text variant="heading">Following</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}>
                {artists.map((artist) => (
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

          {playlists.length === 0 && albums.length === 0 && artists.length === 0 ? (
            <EmptyState
              icon={ListMusic}
              title="Your library starts here"
              description="Like songs, save albums and build playlists. Everything you collect lives in this tab."
              actionLabel="Make a playlist"
              onAction={() => setCreating(true)}
            />
          ) : null}
        </>
      ) : null}

      {filter === 'playlists' ? (
        playlists.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title="No playlists yet"
            description="Build a set for the commute, the gym, or the drive home."
            actionLabel="Create playlist"
            onAction={() => setCreating(true)}
          />
        ) : (
          <View style={styles.grid}>
            {playlists.map((playlist) => (
              <View key={playlist.id} style={{ width: cardWidth }}>
                <MediaCard
                  title={playlist.title}
                  subtitle={`${playlist.trackIds.length} tracks`}
                  artwork={playlist.artwork}
                  width={cardWidth}
                  onPress={() => router.push(`/playlist/${playlist.id}`)}
                  onPlay={() => playTracks(playlist.trackIds, { context: playlist.title })}
                />
              </View>
            ))}
          </View>
        )
      ) : null}

      {filter === 'albums' ? (
        albums.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title="No saved albums"
            description="Tap the save button on any album to keep it here."
            actionLabel="Browse music"
            onAction={() => router.push('/(tabs)/search')}
          />
        ) : (
          <View style={styles.grid}>
            {albums.map((album) => {
              const artist = artistsById.get(album.artistId);
              return (
                <View key={album.id} style={{ width: cardWidth }}>
                  <MediaCard
                    title={album.title}
                    subtitle={artist?.name}
                    artwork={album.artwork}
                    width={cardWidth}
                    onPress={() => router.push(`/album/${album.id}`)}
                    onPlay={() => playTracks(album.trackIds, { context: album.title })}
                  />
                </View>
              );
            })}
          </View>
        )
      ) : null}

      {filter === 'artists' ? (
        artists.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title="Not following anyone"
            description="Follow an artist from their page and they will show up here."
            actionLabel="Find artists"
            onAction={() => router.push('/(tabs)/search')}
          />
        ) : (
          <View style={styles.grid}>
            {artists.map((artist) => (
              <View key={artist.id} style={{ width: cardWidth, alignItems: 'center' }}>
                <MediaCard
                  title={artist.name}
                  subtitle={artist.hometown}
                  artwork={artist.artwork}
                  shape="circle"
                  width={cardWidth * 0.7}
                  onPress={() => router.push(`/artist/${artist.id}`)}
                />
              </View>
            ))}
          </View>
        )
      ) : null}

      {filter === 'liked' ? (
        likedTracks.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No liked songs yet"
            description="Tap the heart on any track and it lands here, newest first."
            actionLabel="Find something"
            onAction={() => router.push('/(tabs)/search')}
          />
        ) : (
          <View style={styles.section}>
            <View style={[styles.likedHeader, { backgroundColor: colors.surfaceSolid, borderColor: colors.border }]}>
              <CoverArt
                artwork={{ seed: 'liked-songs', variant: 'bloom' }}
                size={58}
                radius={radius.sm}
              />
              <View style={styles.likedText}>
                <Text variant="bodySemibold">Liked Songs</Text>
                <Text variant="caption" tone="tertiary">
                  {likedTracks.length} tracks
                </Text>
              </View>
              <Button
                label="Play"
                size="sm"
                onPress={() =>
                  playTracks(likedTracks.map((track) => track.id), {
                    context: 'Liked Songs',
                  })
                }
              />
            </View>
            {likedTracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                onPress={() =>
                  playTracks(
                    likedTracks.map((item) => item.id),
                    { context: 'Liked Songs', startIndex: index },
                  )
                }
                showAlbum
              />
            ))}
          </View>
        )
      ) : null}

      <Sheet
        visible={creating}
        onClose={() => setCreating(false)}
        title="New playlist"
        subtitle="Name it now, add songs later.">
        <View style={styles.create}>
          <TextField
            label="PLAYLIST NAME"
            placeholder="Late night drives"
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={save}
          />
          <Button
            label="Create playlist"
            onPress={save}
            disabled={!name.trim()}
            loading={saving}
            fullWidth
          />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  headerText: {
    gap: 2,
  },
  shortcuts: {
    gap: spacing.sm,
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shortcutIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutText: {
    flex: 1,
    gap: 1,
  },
  section: {
    gap: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rail: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  likedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  likedText: {
    flex: 1,
    gap: 1,
  },
  create: {
    gap: spacing.md,
  },
});
