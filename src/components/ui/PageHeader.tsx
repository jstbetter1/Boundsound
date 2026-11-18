import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from './IconButton';
import { Text } from './Text';

type Props = {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  onMore?: () => void;
  transparent?: boolean;
};

export function PageHeader({ title, subtitle, onBack, right, onMore, transparent = true }: Props) {
  const router = useRouter();
  return (
    <View style={[styles.wrap, !transparent && styles.solid]}>
      <IconButton
        icon={ChevronLeft}
        accessibilityLabel="Go back"
        onPress={onBack ?? (() => router.back())}
        size={40}
        iconSize={22}
      />
      <View style={styles.center}>
        {title ? (
          <Text variant="subheading" numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        {right ?? (onMore ? <IconButton icon={MoreHorizontal} accessibilityLabel="More options" onPress={onMore} size={40} /> : null)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  solid: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
