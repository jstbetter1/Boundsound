import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './PressableScale';

type Props = {
  icon: LucideIcon;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  iconSize?: number;
  variant?: 'ghost' | 'glass' | 'solid' | 'accent';
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  badge?: React.ReactNode;
};

export function IconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  size = 40,
  iconSize,
  variant = 'ghost',
  color,
  disabled,
  style,
  badge,
}: Props) {
  const { colors } = useTheme();
  const background =
    variant === 'accent'
      ? colors.accent
      : variant === 'glass'
        ? colors.surfaceStrong
        : variant === 'solid'
          ? colors.surfaceSolid
          : 'transparent';
  const iconColor =
    color ??
    (variant === 'accent' ? colors.accentInk : colors.text);

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled) }}
      hitSlop={6}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          borderWidth: variant === 'glass' || variant === 'solid' ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.borderStrong,
          opacity: disabled ? 0.35 : 1,
        },
        style,
      ]}>
      <Icon size={iconSize ?? Math.round(size * 0.46)} color={iconColor} strokeWidth={2.1} />
      {badge ? <View style={styles.badge}>{badge}</View> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 6,
    top: 6,
  },
});
