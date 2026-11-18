import { Search, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MediaCard } from '@/components/music/MediaCard';
import { TrackRow } from '@/components/music/TrackRow';
import { Chip } from '@/components/ui/Chip';

import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import {
  albums,
  artists,
  curatedPlaylists,
  genres,
  normalizeText,
  tracks,
} from '@/data/catalog';
import { isAudiusEnabled, searchAudiusTracks } from '@/services/audius';
import { useLibraryStore } from '@/stores/libraryStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import type { Track } from '@/types';

type Filter = 'all' | 'tracks' | 'artists' | 'albums' | 'playlists';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'tracks', label: 'Songs' },
  { value: 'artists', label: 'Artists' },
  { value: 'albums', label: 'Albums' },
  { value: 'playlists', label: 'Playlists' },
];

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const recentSearches = useLibraryStore((state) => state.recentSearches);
  const addSearch = useLibraryStore((state) => state.addSearch);
  const removeSearch = useLibraryStore((state) => state.removeSearch);
  const clearSearches = useLibraryStore((state) => state.clearSearches);
  const userPlaylists = useLibraryStore((state) => state.playlists);

  const trimmed = query.trim();
  const results = useMemo(() => {
    if (!trimmed) {
      return { tracks: [], artists: [], albums: [], playlists: [] };
    }
    const q = normalizeText(trimmed);
    const matches = (value: string) => normalizeText(value).includes(q);
    return {
      tracks: tracks
        .filter(
          (track) =>
            matches(track.title) || matches(track.artistName) || matches(track.albumTitle ?? ''),
        )
        .slice(0, 30),
      artists: artists.filter((artist) => matches(artist.name)).slice(0, 12),
      albums: albums.filter((album) => matches(album.title)).slice(0, 12),
      playlists: [...curatedPlaylists, ...userPlaylists]
        .filter((playlist) => matches(playlist.title) || matches(playlist.description))
        .slice(0, 12),
    };
  }, [trimmed, userPlaylists]);

  const [remote, setRemote] = useState<{ query: string; tracks: Track[]; loading: boolean }>({
    query: '',
    tracks: [],
    loading: false,
  });

  useEffect(() => {
    const q = trimmed;
    if (q.length < 2 || !isAudiusEnabled()) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setRemote({ query: q, tracks: [], loading: true });
      searchAudiusTracks(q, controller.signal)
        .then((found) => {
          if (!controller.signal.aborted) setRemote({ query: q, tracks: found, loading: false });
        })
        .catch(() => {
          if (!controller.signal.aborted) setRemote({ query: q, tracks: [], loading: false });
        });
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [trimmed]);

  const remoteLoading = remote.query === trimmed && remote.loading;

  const audiusTracks = useMemo(() => {
    const found = remote.query === trimmed ? remote.tracks : [];
    if (!found.length) return [];
    const localKeys = new Set(results.tracks.map((track) => track.canonicalKey));
    const seen = new Set<string>();
    const fresh: Track[] = [];
    for (const track of found) {
      if (localKeys.has(track.canonicalKey) || seen.has(track.id)) continue;
      seen.add(track.id);
      fresh.push(track);
    }
    return fresh;
  }, [remote, trimmed, results.tracks]);

  const total =
    results.tracks.length +
    results.artists.length +
    results.albums.length +
    results.playlists.length +
    audiusTracks.length;

  const submit = () => {
    if (trimmed) addSearch(trimmed);
  };

  const showTracks = filter === 'all' || filter === 'tracks';
  const showArtists = filter === 'all' || filter === 'artists';
  const showAlbums = filter === 'all' || filter === 'albums';
  const showPlaylists = filter === 'all' || filter === 'playlists';

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="display">Search</Text>
        <Text variant="body" tone="secondary">
          Songs, artists, albums and playlists from every connected source.
        </Text>
      </View>

      <TextField
        placeholder="What do you want to hear?"
        value={query}
        onChangeText={setQuery}
        icon={Search}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={submit}
        containerStyle={styles.search}
      />

      {trimmed ? (
        <>
          <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
          {total === 0 && remoteLoading ? (
            <View style={styles.searching}>
              <ActivityIndicator color={colors.accent} />
              <Text variant="small" tone="secondary">
                Searching Audius…
              </Text>
            </View>
          ) : total === 0 ? (
            <EmptyState
              icon={Search}
              title="Nothing matched"
              description={`We couldn't find anything for “${trimmed}”. Try a different spelling or a broader phrase.`}
            />
          ) : (
            <View style={styles.sections}>
              {showTracks && results.tracks.length > 0 ? (
                <View style={styles.section}>
                  <Text variant="heading">Songs</Text>
                  {results.tracks.map((track) => (
                    <TrackRow key={track.id} track={track} showAlbum showSource />
                  ))}
                </View>
              ) : null}

              {showTracks && audiusTracks.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.sectionHead}>
                    <Text variant="heading">From Audius</Text>
                    <SourceBadge source="audius" compact />
                  </View>
                  {audiusTracks.map((track) => (
                    <TrackRow key={track.id} track={track} showAlbum showSource />
                  ))}
                </View>
              ) : null}

              {showTracks && remoteLoading ? (
                <View style={styles.searching}>
                  <ActivityIndicator color={colors.accent} size="small" />
                  <Text variant="caption" tone="tertiary">
                    Searching Audius…
                  </Text>
                </View>
              ) : null}


              {showArtists && results.artists.length > 0 ? (
                <View style={styles.section}>
                  <Text variant="heading">Artists</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rail}>
                    {results.artists.map((artist) => (
                      <MediaCard
                        key={artist.id}
                        title={artist.name}
                        subtitle={artist.hometown}
                        artwork={artist.artwork}
                        shape="circle"
                        width={120}
                        onPress={() => router.push(`/artist/${artist.id}`)}
                      />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {showAlbums && results.albums.length > 0 ? (
                <View style={styles.section}>
                  <Text variant="heading">Albums</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rail}>
                    {results.albums.map((album) => (
                      <MediaCard
                        key={album.id}
                        title={album.title}
                        subtitle={album.type.toUpperCase()}
                        artwork={album.artwork}
                        onPress={() => router.push(`/album/${album.id}`)}
                      />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {showPlaylists && results.playlists.length > 0 ? (
                <View style={styles.section}>
                  <Text variant="heading">Playlists</Text>
                  {results.playlists.map((playlist) => (
                    <Pressable
                      key={playlist.id}
                      onPress={() =>
                        playlist.isSystem
                          ? router.push(`/playlist/${playlist.id}`)
                          : router.push(`/playlist/${playlist.id}`)
                      }
                      style={styles.playlistRow}
                      accessibilityRole="button">
                      <View style={styles.playlistArt}>
                        <MediaCard
                          title=""
                          artwork={playlist.artwork}
                          onPress={() => router.push(`/playlist/${playlist.id}`)}
                          width={54}
                        />
                      </View>
                      <View style={styles.playlistText}>
                        <Text variant="bodySemibold" numberOfLines={1}>
                          {playlist.title}
                        </Text>
                        <Text variant="small" tone="tertiary" numberOfLines={1}>
                          {playlist.curator} · {playlist.trackIds.length} tracks
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </>
      ) : (
        <>
          {recentSearches.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text variant="heading">Recent searches</Text>
                <Pressable onPress={clearSearches} hitSlop={8}>
                  <Text variant="small" tone="tertiary">
                    Clear
                  </Text>
                </Pressable>
              </View>
              <View style={styles.chips}>
                {recentSearches.map((item) => (
                  <Pressable
                    key={item.query}
                    onPress={() => setQuery(item.query)}
                    style={[styles.recentChip, { backgroundColor: colors.surface }]}
                    accessibilityRole="button">
                    <Text variant="small" numberOfLines={1}>
                      {item.query}
                    </Text>
                    <Pressable
                      onPress={() => removeSearch(item.query)}
                      hitSlop={6}
                      accessibilityLabel={`Remove ${item.query}`}>
                      <X size={13} color={colors.textTertiary} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text variant="heading">Browse genres</Text>
            <View style={styles.genreGrid}>
              {genres.map((genre) => (
                <Pressable
                  key={genre.id}
                  onPress={() => router.push(`/genre/${genre.id}`)}
                  style={[
                    styles.genreCard,
                    { backgroundColor: genre.accent, borderColor: colors.border },
                  ]}
                  accessibilityRole="button">
                  <Text variant="bodySemibold" tone="inverse" numberOfLines={2}>
                    {genre.name}
                  </Text>
                  <Text variant="caption" tone="inverse" numberOfLines={2} style={styles.genreBlurb}>
                    {genre.blurb}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text variant="heading">Try searching</Text>
            <View style={styles.chips}>
              {['Night drive', 'Amaka', 'Afterglow', 'Slow Burn', 'Synthwave'].map((suggestion) => (
                <Chip key={suggestion} label={suggestion} onPress={() => setQuery(suggestion)} />
              ))}
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  search: {
    marginTop: -spacing.sm,
  },
  sections: {
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  searching: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    maxWidth: '100%',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  genreCard: {
    width: '48.5%',
    minHeight: 92,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  genreBlurb: {
    opacity: 0.72,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 4,
  },
  playlistArt: {
    width: 54,
  },
  playlistText: {
    flex: 1,
    gap: 2,
  },
});

