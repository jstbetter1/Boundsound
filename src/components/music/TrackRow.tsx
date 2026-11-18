import { Heart, MoreHorizontal } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CoverArt } from '@/components/ui/CoverArt';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { Text } from '@/components/ui/Text';
import { formatDuration } from '@/lib/format';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { trackMenu } from '@/stores/trackMenuStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import type { Track } from '@/types';

type Props = {
  track: Track;
  onPress?: () => void;
  playlistId?: string;
  index?: number;
  showArtwork?: boolean;
  showAlbum?: boolean;
  showSource?: boolean;
  subtitle?: string;
  compact?: boolean;
  showMenu?: boolean;
  showLike?: boolean;
};

export function TrackRow({
  track,
  onPress,
  playlistId,
  index,
  showArtwork = true,
  showAlbum = false,
  showSource = false,
  subtitle,
  compact = false,
  showMenu = true,
  showLike = true,
}: Props) {
  const { colors } = useTheme();
  const liked = useLibraryStore((state) => Boolean(state.liked[track.id]));
  const toggleLike = useLibraryStore((state) => state.toggleLike);
  const isCurrent = usePlayerStore((state) => state.currentTrackId === track.id);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const toggle = usePlayerStore((state) => state.toggle);
  const playTracks = usePlayerStore((state) => state.playTracks);

  const handlePress = () => {
    if (onPress) onPress();
    else if (isCurrent) toggle();
    else playTracks([track.id], { context: track.title });
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={() => trackMenu.open(track.id, playlistId)}
      accessibilityRole="button"
      accessibilityLabel={`${track.title} by ${track.artistName}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}>
      {typeof index === 'number' ? (
        <View style={styles.index}>
          {isCurrent ? (
            <Text variant="caption" tone="accent">
              {isPlaying ? '▶' : '❚❚'}
            </Text>
          ) : (
            <Text variant="caption" tone="tertiary">
              {String(index + 1).padStart(2, '0')}
            </Text>
          )}
        </View>
      ) : null}
      {showArtwork ? (
        <CoverArt
          artwork={track.artwork}
          artworkUrl={track.artworkUrl}
          size={compact ? 40 : 46}
          radius={radius.xs}
        />
      ) : null}
      <View style={styles.text}>
        <Text
          variant="bodySemibold"
          numberOfLines={1}
          tone={isCurrent ? 'accent' : 'primary'}>
          {track.title}
        </Text>
        <View style={styles.meta}>
          <Text variant="small" tone="tertiary" numberOfLines={1} style={styles.metaText}>
            {subtitle ?? track.artistName}
            {showAlbum && track.albumTitle ? ` · ${track.albumTitle}` : ''}
          </Text>
          {track.explicit ? (
            <View style={[styles.explicit, { backgroundColor: colors.surfaceSunken }]}>
              <Text variant="caption" tone="tertiary">
                E
              </Text>
            </View>
          ) : null}
          {showSource && track.sources[0] ? (
            <SourceBadge source={track.sources[0].provider} compact />
          ) : null}
        </View>
      </View>
      <Text variant="caption" tone="tertiary">
        {formatDuration(track.durationSec)}
      </Text>
      {showLike ? (
        <Pressable
          onPress={() => toggleLike(track.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Remove from liked songs' : 'Like song'}
          style={styles.iconButton}>
          <Heart
            size={17}
            color={liked ? colors.accent : colors.textTertiary}
            fill={liked ? colors.accent : 'transparent'}
            strokeWidth={2}
          />
        </Pressable>
      ) : null}
      {showMenu ? (
        <Pressable
          onPress={() => trackMenu.open(track.id, playlistId)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="More options"
          style={styles.iconButton}>
          <MoreHorizontal size={18} color={colors.textTertiary} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
  },
  index: {
    width: 24,
    alignItems: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flexShrink: 1,
  },
  explicit: {
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  iconButton: {
    padding: 4,
  },
});
