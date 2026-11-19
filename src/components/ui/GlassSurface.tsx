import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius as radii } from '@/theme/tokens';

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'subtle' | 'regular' | 'strong' | 'solid';
  radius?: number;
  blur?: boolean;
  intensity?: number;
};

export function GlassSurface({
  children,
  style,
  variant = 'regular',
  radius = radii.lg,
  blur = false,
  intensity = 28,
}: Props) {
  const { colors, isDark } = useTheme();
  const background =
    variant === 'subtle'
      ? colors.surface
      : variant === 'strong'
        ? colors.surfaceStrong
        : variant === 'solid'
          ? colors.surfaceSolid
          : colors.surfaceStrong;

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: radius,
          backgroundColor: background,
          borderColor: colors.border,
        },
        style,
      ]}>
      {blur && Platform.OS === 'ios' ? (
        <BlurView
          pointerEvents="none"
          tint={isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
          intensity={intensity}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {blur && Platform.OS !== 'ios' ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(8,9,12,0.55)' : 'rgba(255,255,255,0.6)' }]}
        />
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flexGrow: 0,
  },
});
