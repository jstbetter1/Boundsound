import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import type { SourceId } from '@/types';
import { Text } from './Text';

export const sourceMeta: Record<SourceId, { label: string; short: string; color: string }> = {
  bound: { label: 'BOUND', short: 'BOUND', color: '#C8F751' },
  local: { label: 'Local file', short: 'LOCAL', color: '#9CA3AF' },
  audius: { label: 'Audius', short: 'AUDIUS', color: '#CC0FE0' },
  spotify: { label: 'Spotify', short: 'SPOTIFY', color: '#1DB954' },
  soundcloud: { label: 'SoundCloud', short: 'SOUNDCLOUD', color: '#FF7700' },
  appleMusic: { label: 'Apple Music', short: 'APPLE', color: '#FA2D48' },
  youtubeMusic: { label: 'YouTube Music', short: 'YOUTUBE', color: '#FF0033' },
  deezer: { label: 'Deezer', short: 'DEEZER', color: '#A238FF' },
};

type Props = {
  source?: SourceId;
  compact?: boolean;
  preview?: boolean;
  muted?: boolean;
};

export function SourceBadge({ source = 'bound', compact = false, preview = false, muted = false }: Props) {
  const { colors } = useTheme();
  const meta = sourceMeta[source];
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text
        style={{
          fontFamily: fonts.bodyBold,
          fontSize: 9,
          letterSpacing: 1,
          color: muted ? colors.textTertiary : colors.textSecondary,
        }}>
        {compact ? meta.short : meta.label.toUpperCase()}
      </Text>
      {preview ? (
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 9,
            letterSpacing: 1,
            color: colors.warning,
          }}>
          · PREVIEW
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
