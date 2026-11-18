import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, compact }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Icon size={24} color={colors.textSecondary} strokeWidth={1.7} />
      </View>
      <View style={styles.text}>
        <Text variant="subheading" center>
          {title}
        </Text>
        <Text variant="small" tone="secondary" center style={styles.description}>
          {description}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 52,
    gap: 16,
  },
  compact: {
    paddingVertical: 28,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    alignItems: 'center',
    gap: 5,
    maxWidth: 320,
  },
  description: {
    maxWidth: 280,
  },
});
