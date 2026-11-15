import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, type as typeStyles } from '@/theme/tokens';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  style,
  accessibilityHint,
}: Props) {
  const { colors } = useTheme();
  const height = size === 'sm' ? 40 : size === 'lg' ? 58 : 50;
  const background =
    variant === 'primary'
      ? colors.accent
      : variant === 'danger'
        ? colors.danger
        : variant === 'glass'
          ? colors.surfaceStrong
          : variant === 'secondary'
            ? colors.surface
            : 'transparent';
  const borderColor =
    variant === 'secondary' || variant === 'glass' ? colors.borderStrong : 'transparent';
  const labelColor =
    variant === 'primary'
      ? colors.accentInk
      : variant === 'danger'
        ? '#FFFFFF'
        : variant === 'ghost'
          ? colors.textSecondary
          : colors.text;

  const isDisabled = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.base,
        {
          height,
          backgroundColor: background,
          borderColor,
          borderWidth: variant === 'ghost' ? 0 : StyleSheet.hairlineWidth,
          opacity: isDisabled ? 0.45 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <View style={styles.row}>
          {Icon ? <Icon size={size === 'sm' ? 16 : 18} color={labelColor} strokeWidth={2.3} /> : null}
          <Text
            style={[typeStyles.button, styles.label, size === 'sm' && { fontSize: 13 }, { color: labelColor }]}
            allowFontScaling={false}>
            {label}
          </Text>
          {IconRight ? <IconRight size={size === 'sm' ? 16 : 18} color={labelColor} strokeWidth={2.3} /> : null}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fonts.bodyBold,
    includeFontPadding: false,
  },
});
