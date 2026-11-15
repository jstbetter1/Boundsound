import { useRouter } from 'expo-router';
import {
  ChevronDown,
  Download,
  Heart,
  ListMusic,
  MoreHorizontal,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CoverArt } from '@/components/ui/CoverArt';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Slider } from '@/components/ui/Slider';
import { Text } from '@/components/ui/Text';
import { getArtistById, getTrackById } from '@/data/catalog';
import { formatDuration } from '@/lib/format';
import { impact, tap } from '@/lib/haptics';
import { useDownloadsStore } from '@/stores/downloadsStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { trackMenu } from '@/stores/trackMenuStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function PlayerScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { colors } = useTheme();

  const trackId = usePlayerStore((state) => state.currentTrackId);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const positionSec = usePlayerStore((state) => state.positionSec);
  const durationSec = usePlayerStore((state) => state.durationSec);
  const repeat = usePlayerStore((state) => state.repeat);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const context = usePlayerStore((state) => state.context);
  const toggle = usePlayerStore((state) => state.toggle);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const seek = usePlayerStore((state) => state.seek);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  const liked = useLibraryStore((state) => (trackId ? Boolean(state.liked[trackId]) : false));
  const toggleLike = useLibraryStore((state) => state.toggleLike);
  const downloadRecord = useDownloadsStore((state) =>
    trackId ? state.records[trackId] : undefined,
  );

  const track = trackId ? getTrackById(trackId) : undefined;
  const artist = track ? getArtistById(track.artistId) : undefined;

  if (!track) {
    return (
      <Screen scroll={false} contentStyle={styles.empty}>
        <Text variant="body" tone="secondary">
          Nothing is playing.
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text variant="bodySemibold" tone="accent">
            Close
          </Text>
        </Pressable>
      </Screen>
    );
  }

  const artSize = Math.min(width - 72, height * 0.4, 340);
  const total = durationSec || track.durationSec;
  const progress = total > 0 ? Math.min(1, positionSec / total) : 0;

  return (
    <Screen
      edges={['top', 'bottom']}
      contentStyle={styles.content}
      glow={{ primary: artist?.accent, secondary: colors.violet }}>
      <View style={styles.header}>
        <IconButton
          icon={ChevronDown}
          accessibilityLabel="Close player"
          onPress={() => router.back()}
        />
        <View style={styles.headerText}>
          <Text variant="eyebrow" tone="tertiary">
            {context.toUpperCase()}
          </Text>
          <Text variant="caption" tone="tertiary">
            {downloadRecord?.status === 'completed' ? 'Playing offline' : 'Playing from BOUND'}
          </Text>
        </View>
        <IconButton
          icon={MoreHorizontal}
          accessibilityLabel="Track options"
          onPress={() => trackMenu.open(track.id)}
        />
      </View>

      <View style={styles.artWrap}>
        <CoverArt
          artwork={track.artwork}
          size={artSize}
          radius={radius.xl}
          style={styles.art}
        />
      </View>

      <View style={styles.info}>
        <Text variant="title" numberOfLines={2}>
          {track.title}
        </Text>
        <Pressable
          onPress={() => artist && router.push(`/artist/${artist.id}`)}
          accessibilityRole="button">
          <Text variant="body" tone="secondary" numberOfLines={1}>
            {track.artistName}
          </Text>
        </Pressable>
      </View>

      <View style={styles.timeline}>
        <Slider
          value={progress}
          onSlidingComplete={(value) => seek(value * total)}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.surfaceStrong}
          accessibilityLabel="Seek"
        />
        <View style={styles.times}>
          <Text variant="caption" tone="tertiary">
            {formatDuration(positionSec)}
          </Text>
          <Text variant="caption" tone="tertiary">
            {formatDuration(total)}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={() => {
            tap();
            toggleShuffle();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={shuffle ? 'Turn shuffle off' : 'Turn shuffle on'}>
          <Shuffle
            size={20}
            color={shuffle ? colors.accent : colors.textTertiary}
            strokeWidth={2}
          />
        </Pressable>
        <Pressable
          onPress={() => {
            tap();
            previous();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Previous track">
          <SkipBack size={28} color={colors.text} fill={colors.text} />
        </Pressable>
        <Pressable
          onPress={() => {
            impact();
            toggle();
          }}
          style={[styles.playButton, { backgroundColor: colors.accent }]}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
          {isBuffering && !isPlaying ? (
            <View style={[styles.spinner, { borderTopColor: colors.accentInk }]} />
          ) : isPlaying ? (
            <Pause size={30} color={colors.accentInk} fill={colors.accentInk} />
          ) : (
            <Play
              size={30}
              color={colors.accentInk}
              fill={colors.accentInk}
              style={styles.playIcon}
            />
          )}
        </Pressable>
        <Pressable
          onPress={() => {
            tap();
            next();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Next track">
          <SkipForward size={28} color={colors.text} fill={colors.text} />
        </Pressable>
        <Pressable
          onPress={() => {
            tap();
            cycleRepeat();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Repeat ${repeat}`}>
          {repeat === 'one' ? (
            <Repeat1 size={20} color={colors.accent} strokeWidth={2} />
          ) : (
            <Repeat
              size={20}
              color={repeat === 'all' ? colors.accent : colors.textTertiary}
              strokeWidth={2}
            />
          )}
        </Pressable>
      </View>

      <View style={styles.actions}>
        <IconButton
          icon={Heart}
          color={liked ? colors.accent : undefined}
          accessibilityLabel={liked ? 'Unlike' : 'Like'}
          onPress={() => {
            tap();
            toggleLike(track.id);
          }}
        />
        <IconButton
          icon={Download}
          color={downloadRecord?.status === 'completed' ? colors.accent : undefined}
          accessibilityLabel="Download options"
          onPress={() => trackMenu.open(track.id)}
        />
        <IconButton
          icon={ListMusic}
          accessibilityLabel="Open queue"
          onPress={() => router.push('/queue')}
        />
        <IconButton
          icon={MoreHorizontal}
          accessibilityLabel="More options"
          onPress={() => trackMenu.open(track.id)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  artWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  art: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  info: {
    gap: 3,
  },
  timeline: {
    gap: -2,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 3,
  },
  spinner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});
