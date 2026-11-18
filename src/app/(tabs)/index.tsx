import { useRouter } from 'expo-router';
import { Play, Settings2 } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HorizontalRail } from '@/components/music/HorizontalRail';
import { MediaCard } from '@/components/music/MediaCard';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { CoverArt } from '@/components/ui/CoverArt';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import {
  DEMO_AUDIO_CREDIT,
  artistsById,
  genres,
  getArtistAlbums,
  getTracksByIds,
  newReleases,
} from '@/data/catalog';
import { useTasteProfile } from '@/hooks/useTasteProfile';
import {
  getBecauseYouLike,
  getDailyMixes,
  getFreshPicks,
  getTopArtists,
} from '@/services/recommendations';
import { useAuthStore } from '@/stores/authStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const account = useAuthStore((state) => state.account);
  const profile = useTasteProfile();
  const showExplicit = usePreferencesStore((state) => state.preferences.showExplicit);
  const history = useLibraryStore((state) => state.history);
  const playTracks = usePlayerStore((state) => state.playTracks);
  const playTrack = usePlayerStore((state) => state.playTrack);

  const mixes = useMemo(() => getDailyMixes(profile, 6, showExplicit), [profile, showExplicit]);
  const freshAlbums = useMemo(
    () => getFreshPicks(profile, showExplicit, 10),
    [profile, showExplicit],
  );
  const topArtists = useMemo(() => getTopArtists(profile, 10), [profile]);
  const because = useMemo(
    () => getBecauseYouLike(profile, showExplicit, 1)[0],
    [profile, showExplicit],
  );

  const hero = freshAlbums[0] ?? newReleases[0];
  const heroArtist = hero ? artistsById.get(hero.artistId) : undefined;

  const recent = useMemo(() => {
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const event of history) {
      if (!seen.has(event.trackId)) {
        seen.add(event.trackId);
        ids.push(event.trackId);
        if (ids.length === 8) break;
      }
    }
    return getTracksByIds(ids);
  }, [history]);

  const relatedAlbums = useMemo(
    () => (because ? getArtistAlbums(because.artist.id).slice(0, 8) : []),
    [because],
  );

  return (
    <Screen contentStyle={styles.content} glow={{}}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="eyebrow" tone="tertiary">
            {greeting().toUpperCase()}
          </Text>
          <Text variant="display" numberOfLines={1} style={styles.name}>
            {account?.displayName ?? 'Listener'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon={Settings2}
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
          />
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile">
            <Avatar
              name={account?.displayName ?? 'Listener'}
              seed={account?.avatarSeed}
              color={account?.accent}
              size={40}
            />
          </Pressable>
        </View>
      </View>

      {recent.length > 0 ? (
        <HorizontalRail
          title="Jump back in"
          inset
          actionLabel="History"
          onAction={() => router.push('/settings/history')}>
          {recent.map((track) => (
            <Pressable
              key={track.id}
              onPress={() => playTrack(track.id, 'Recently played')}
              style={styles.recent}>
              <CoverArt artwork={track.artwork} size={54} radius={radius.sm} />
              <View style={styles.recentText}>
                <Text variant="small" numberOfLines={1}>
                  {track.title}
                </Text>
                <Text variant="caption" tone="tertiary" numberOfLines={1}>
                  {track.artistName}
                </Text>
              </View>
            </Pressable>
          ))}
        </HorizontalRail>
      ) : null}

      {hero ? (
        <Pressable
          onPress={() => router.push(`/album/${hero.id}`)}
          style={[styles.hero, { backgroundColor: colors.surfaceSolid, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={`${hero.title} by ${heroArtist?.name ?? ''}`}>
          <CoverArt artwork={hero.artwork} size={112} radius={radius.md} />
          <View style={styles.heroText}>
            <Text variant="eyebrow" style={{ color: heroArtist?.accent ?? colors.accent }}>
              FRESH PICK
            </Text>
            <Text variant="title" numberOfLines={2} style={styles.heroTitle}>
              {hero.title}
            </Text>
            <Text variant="small" tone="secondary" numberOfLines={1}>
              {heroArtist?.name} · {hero.type.toUpperCase()} · {hero.trackIds.length} tracks
            </Text>
            <View style={styles.heroActions}>
              <Pressable
                onPress={() => playTracks(hero.trackIds, { context: hero.title })}
                style={[styles.play, { backgroundColor: colors.accent }]}
                accessibilityRole="button"
                accessibilityLabel={`Play ${hero.title}`}>
                <Play size={16} color={colors.accentInk} fill={colors.accentInk} strokeWidth={0} />
              </Pressable>
              <Text variant="small" tone="tertiary">
                New this week
              </Text>
            </View>
          </View>
        </Pressable>
      ) : null}

      <HorizontalRail
        title="Your daily mixes"
        inset
        subtitle="Rebuilt every morning from what you actually play."
        actionLabel="See all"
        onAction={() => router.push('/(tabs)/for-you')}>
        {mixes.map((mix) => (
          <View key={mix.id} style={styles.mix}>
            <Pressable
              onPress={() =>
                playTracks(mix.trackIds, { context: mix.title, shuffle: true })
              }
              accessibilityRole="button"
              accessibilityLabel={`Play ${mix.title}`}>
              <View style={styles.mixArt}>
                <CoverArt artwork={mix.artwork} size={156} radius={radius.md} />
                <View style={[styles.mixBadge, { backgroundColor: mix.accent }]}>
                  <Text variant="eyebrow" tone="inverse" style={styles.mixBadgeText}>
                    MIX
                  </Text>
                </View>
                <View style={[styles.mixPlay, { backgroundColor: colors.scrim }]}>
                  <Play size={16} color={colors.text} fill={colors.text} strokeWidth={0} />
                </View>
              </View>
            </Pressable>
            <Text variant="bodySemibold" numberOfLines={1}>
              {mix.title}
            </Text>
            <Text variant="small" tone="tertiary" numberOfLines={1}>
              {mix.subtitle}
            </Text>
          </View>
        ))}
      </HorizontalRail>

      <HorizontalRail
        title="New releases"
        inset
        subtitle="Fresh albums from artists on your wavelength."
        actionLabel="Browse"
        onAction={() => router.push('/(tabs)/search')}>
        {freshAlbums.map((album) => {
          const artist = artistsById.get(album.artistId);
          return (
            <MediaCard
              key={album.id}
              title={album.title}
              subtitle={artist?.name}
              artwork={album.artwork}
              accent={artist?.accent}
              onPress={() => router.push(`/album/${album.id}`)}
              onPlay={() => playTracks(album.trackIds, { context: album.title })}
            />
          );
        })}
      </HorizontalRail>

      {because && relatedAlbums.length > 0 ? (
        <HorizontalRail
          title={`Because you like ${because.artist.name}`}
          inset
          subtitle={because.artist.bio}
          actionLabel="Artist"
          onAction={() => router.push(`/artist/${because.artist.id}`)}>
          {relatedAlbums.map((album) => (
            <MediaCard
              key={album.id}
              title={album.title}
              subtitle={album.type.toUpperCase()}
              artwork={album.artwork}
              onPress={() => router.push(`/album/${album.id}`)}
              onPlay={() => playTracks(album.trackIds, { context: album.title })}
            />
          ))}
        </HorizontalRail>
      ) : null}

      <HorizontalRail
        title="Artists for you"
        inset
        subtitle="Voices that match your listening."
        actionLabel="More"
        onAction={() => router.push('/(tabs)/search')}>
        {topArtists.map((artist) => (
          <MediaCard
            key={artist.id}
            title={artist.name}
            subtitle={`${(artist.monthlyListeners / 1000).toFixed(1)}K listeners`}
            artwork={artist.artwork}
            shape="circle"
            width={112}
            onPress={() => router.push(`/artist/${artist.id}`)}
          />
        ))}
      </HorizontalRail>

      <View style={styles.section}>
        <Text variant="heading">Browse by genre</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genres}>
          {genres.map((genre) => (
            <Chip
              key={genre.id}
              label={genre.name}
              onPress={() => router.push(`/genre/${genre.id}`)}
            />
          ))}
        </ScrollView>
      </View>

      <Text variant="caption" tone="tertiary" center style={styles.credit}>
        {DEMO_AUDIO_CREDIT}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    gap: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 30,
    lineHeight: 36,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recent: {
    width: 188,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  recentText: {
    flex: 1,
    gap: 2,
  },
  hero: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.lg,
  },
  heroText: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 27,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  play: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mix: {
    width: 156,
    gap: 4,
  },
  mixArt: {
    marginBottom: 4,
  },
  mixBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mixBadgeText: {
    fontSize: 9,
  },
  mixPlay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  genres: {
    gap: spacing.sm,
  },
  credit: {
    paddingHorizontal: spacing.xl,
  },
});


