import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  inset?: boolean;
  contentPadding?: boolean;
};

export function HorizontalRail({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
  inset = false,
  contentPadding = true,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.header, inset && styles.inset]}>
        <View style={styles.titleWrap}>
          <Text variant="heading">{title}</Text>
          {subtitle ? (
            <Text variant="small" tone="tertiary" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}>
            <Text variant="small" style={{ color: colors.textSecondary, fontWeight: '600' }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.content, contentPadding && styles.contentPadding]}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  inset: {
    paddingHorizontal: 20,
  },
  titleWrap: {
    flex: 1,
    gap: 3,
  },
  content: {
    gap: 14,
  },
  contentPadding: {
    paddingHorizontal: 20,
  },
});

