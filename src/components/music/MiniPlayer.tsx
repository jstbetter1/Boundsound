import { Pause, Play, SkipForward } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CoverArt } from '@/components/ui/CoverArt';
import { Text } from '@/components/ui/Text';
import { getTrackById } from '@/data/catalog';
import { usePlayerStore } from '@/stores/playerStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

export function MiniPlayer() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const currentTrackId = usePlayerStore((state) => state.currentTrackId);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const positionSec = usePlayerStore((state) => state.positionSec);
  const durationSec = usePlayerStore((state) => state.durationSec);
  const toggle = usePlayerStore((state) => state.toggle);
  const next = usePlayerStore((state) => state.next);

  const track = currentTrackId ? getTrackById(currentTrackId) : undefined;
  if (!track) return null;

  const progress = durationSec > 0 ? Math.min(1, Math.max(0, positionSec / durationSec)) : 0;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? 'rgba(22, 25, 31, 0.96)' : 'rgba(255, 255, 255, 0.97)',
          borderColor: colors.borderStrong,
          shadowColor: colors.shadow,
        },
      ]}>
      <Pressable
        onPress={() => router.push('/player')}
        style={styles.main}
        accessibilityRole="button"
        accessibilityLabel={`Now playing ${track.title} by ${track.artistName}`}>
        <CoverArt artwork={track.artwork} size={42} radius={radius.sm} />
        <View style={styles.text}>
          <Text variant="small" numberOfLines={1} style={styles.title}>
            {track.title}
          </Text>
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {track.artistName}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={toggle}
        hitSlop={6}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
        {isBuffering && !isPlaying ? (
          <View style={[styles.buffer, { borderTopColor: colors.accent }]} />
        ) : isPlaying ? (
          <Pause size={20} color={colors.text} fill={colors.text} />
        ) : (
          <Play size={20} color={colors.text} fill={colors.text} />
        )}
      </Pressable>
      <Pressable
        onPress={next}
        hitSlop={6}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Next track">
        <SkipForward size={18} color={colors.textSecondary} fill={colors.textSecondary} />
      </Pressable>
      <View style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%`, backgroundColor: colors.accent },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginBottom: 8,
    height: 60,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 13,
  },
  button: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buffer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  track: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 0,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: 2,
  },
});
