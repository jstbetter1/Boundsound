import { Play } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CoverArt } from '@/components/ui/CoverArt';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import type { ArtworkSpec } from '@/types';

type Props = {
  title: string;
  subtitle?: string;
  artwork: ArtworkSpec;
  artworkUrl?: string;
  onPress: () => void;
  onPlay?: () => void;
  width?: number;
  shape?: 'square' | 'circle';
  accent?: string;
  badge?: string;
  isPlaying?: boolean;
};

export function MediaCard({
  title,
  subtitle,
  artwork,
  artworkUrl,
  onPress,
  onPlay,
  width = 148,
  shape = 'square',
  accent,
  badge,
  isPlaying,
}: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.86 : 1 }]}>
      <View style={styles.art}>
        <CoverArt
          artwork={artwork}
          artworkUrl={artworkUrl}
          size={width}
          radius={shape === 'circle' ? width / 2 : radius.md}
        />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.scrim }]}>
            <Text variant="eyebrow" tone="inverse">
              {badge}
            </Text>
          </View>
        ) : null}
        {onPlay ? (
          <Pressable
            onPress={onPlay}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : `Play ${title}`}
            style={({ pressed }) => [
              styles.play,
              { backgroundColor: accent ?? colors.accent, opacity: pressed ? 0.8 : 1 },
            ]}>
            <Play
              size={16}
              color={colors.accentInk}
              fill={colors.accentInk}
              strokeWidth={0}
              style={styles.playIcon}
            />
          </Pressable>
        ) : null}
      </View>
      <Text variant="bodySemibold" numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="small" tone="tertiary" numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function MediaCardSkeleton({ width = 148 }: { width?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ width }}>
      <View
        style={{
          width,
          height: width,
          borderRadius: radius.md,
          backgroundColor: colors.skeleton,
          marginBottom: 8,
        }}
      />
      <View
        style={{
          height: 12,
          width: width * 0.8,
          borderRadius: 4,
          backgroundColor: colors.skeleton,
          marginBottom: 6,
        }}
      />
      <View
        style={{ height: 10, width: width * 0.5, borderRadius: 4, backgroundColor: colors.skeleton }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 5,
  },
  art: {
    marginBottom: 5,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  play: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 2,
  },
});
