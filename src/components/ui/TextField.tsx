import { Eye, EyeOff, LucideIcon } from 'lucide-react-native';
import React, { forwardRef, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { IconButton } from './IconButton';
import { Text } from './Text';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  containerStyle?: StyleProp<ViewStyle>;
  secure?: boolean;
};

export const TextField = forwardRef<React.ComponentRef<typeof TextInput>, Props>(function TextField(
  { label, error, hint, icon: Icon, containerStyle, secure, onFocus, onBlur, style, ...rest },
  ref
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secure));

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text variant="caption" tone="secondary" style={styles.label}>
          {label.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : focused ? colors.accentBorder : colors.border,
          },
        ]}>
        {Icon ? (
          <Icon size={18} color={focused ? colors.accent : colors.textTertiary} strokeWidth={1.9} />
        ) : null}
        <TextInput
          ref={ref}
          {...rest}
          secureTextEntry={hidden}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          style={[styles.input, { color: colors.text }, style]}
        />
        {secure ? (
          <IconButton
            icon={hidden ? Eye : EyeOff}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((value) => !value)}
            size={34}
            iconSize={17}
            color={colors.textSecondary}
          />
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" tone="danger" style={styles.helper}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="tertiary" style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: 7,
  },
  label: {
    letterSpacing: 1.3,
  },
  field: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    paddingVertical: 14,
    minHeight: 52,
  },
  helper: {
    paddingHorizontal: 2,
  },
});
