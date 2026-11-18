import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  primary?: string;
  secondary?: string;
  intensity?: number;
};

export function AmbientBackground({ primary, secondary, intensity = 1 }: Props) {
  const { colors, isDark } = useTheme();
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const first = primary ?? colors.accent;
  const second = secondary ?? colors.violet;
  const alpha = (isDark ? 0.16 : 0.13) * intensity;
  const alpha2 = (isDark ? 0.2 : 0.1) * intensity;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={`${id}a`} cx="0.86" cy="0.02" r="0.75">
            <Stop offset="0" stopColor={first} stopOpacity={alpha} />
            <Stop offset="0.55" stopColor={first} stopOpacity={alpha * 0.35} />
            <Stop offset="1" stopColor={first} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`${id}b`} cx="0.02" cy="0.62" r="0.85">
            <Stop offset="0" stopColor={second} stopOpacity={alpha2} />
            <Stop offset="0.6" stopColor={second} stopOpacity={alpha2 * 0.25} />
            <Stop offset="1" stopColor={second} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}a)`} />
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}b)`} />
      </Svg>
    </View>
  );
}
