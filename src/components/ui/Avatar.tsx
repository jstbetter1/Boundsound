import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { initials } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { paletteFor } from '@/theme/artwork';
import { fonts } from '@/theme/tokens';
import { Text } from './Text';

type Props = {
  name: string;
  size?: number;
  seed?: string;
  color?: string;
  ring?: boolean;
};

export function Avatar({ name, size = 40, seed, color, ring = false }: Props) {
  const { colors } = useTheme();
  const palette = useMemo(() => paletteFor(seed ?? name, undefined), [name, seed]);
  const fontSize = Math.round(size * 0.36);
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors.borderStrong,
          borderWidth: ring ? 1.5 : StyleSheet.hairlineWidth,
        },
      ]}>
      <LinearGradient
        colors={[color ?? palette.to, palette.via, palette.deep]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <Text
          style={{
            fontFamily: fonts.heading,
            fontSize,
            lineHeight: fontSize * 1.1,
            color: '#FFFFFF',
            letterSpacing: -0.5,
          }}>
          {initials(name)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    position: 'relative',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
