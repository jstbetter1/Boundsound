import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

type Props = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  inset?: number;
};

export function SectionHeader({
  title,
  eyebrow,
  subtitle,
  actionLabel = 'See all',
  onAction,
  inset = 20,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { paddingHorizontal: inset }]}>
      <View style={styles.textWrap}>
        {eyebrow ? (
          <Text variant="eyebrow" tone="accent" style={styles.eyebrow}>
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="heading">{title}</Text>
        {subtitle ? (
          <Text variant="small" tone="secondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} ${title}`}
          hitSlop={8}
          style={styles.action}>
          <Text variant="caption" tone="secondary" style={{ letterSpacing: 0.4 }}>
            {actionLabel}
          </Text>
          <ChevronRight size={14} color={colors.textTertiary} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    marginBottom: 2,
  },
  subtitle: {
    marginTop: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingBottom: 3,
  },
});
