import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { type TypeVariant, type } from '@/theme/tokens';

type Tone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'inverse'
  | 'danger'
  | 'success'
  | 'violet';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  tone?: Tone;
  center?: boolean;
};

export function Text({ variant = 'body', tone = 'primary', center, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const color =
    tone === 'secondary'
      ? colors.textSecondary
      : tone === 'tertiary'
        ? colors.textTertiary
        : tone === 'accent'
          ? colors.accent
          : tone === 'inverse'
            ? colors.textInverse
            : tone === 'danger'
              ? colors.danger
              : tone === 'success'
                ? colors.success
                : tone === 'violet'
                  ? colors.violet
                  : colors.text;
  return (
    <RNText
      {...rest}
      style={[type[variant], { color }, center && styles.center, style]}
      allowFontScaling={false}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
