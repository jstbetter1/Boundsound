import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  size?: 'sm' | 'md';
};

export function Chip({ label, selected = false, onPress, icon: Icon, size = 'md' }: Props) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      scaleTo={0.95}
      style={[
        styles.base,
        {
          height: size === 'sm' ? 30 : 36,
          paddingHorizontal: size === 'sm' ? 12 : 15,
          backgroundColor: selected ? colors.accent : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}>
      {Icon ? (
        <Icon
          size={size === 'sm' ? 12 : 14}
          color={selected ? colors.accentInk : colors.textSecondary}
          strokeWidth={2.2}
        />
      ) : null}
      <Text
        variant={size === 'sm' ? 'caption' : 'small'}
        style={{
          color: selected ? colors.accentInk : colors.textSecondary,
          fontWeight: '600',
        }}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
