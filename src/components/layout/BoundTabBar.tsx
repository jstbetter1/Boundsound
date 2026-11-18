import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Download, House, LibraryBig, Search, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/music/MiniPlayer';
import { Text } from '@/components/ui/Text';
import { tap } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';

const ICONS = {
  index: House,
  search: Search,
  'for-you': Sparkles,
  library: LibraryBig,
  downloads: Download,
} as const;

const LABELS = {
  index: 'Home',
  search: 'Search',
  'for-you': 'For You',
  library: 'Library',
  downloads: 'Downloads',
} as const;

export function BoundTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.canvas }]}>
      <MiniPlayer />
      <View style={[styles.bar, { borderTopColor: colors.border }]}>
        {state.routes.map((route, index) => {
          const name = route.name as keyof typeof ICONS;
          const Icon = ICONS[name] ?? House;
          const focused = state.index === index;
          const options = descriptors[route.key]?.options;
          const label = LABELS[name] ?? options?.title ?? route.name;

          const onPress = () => {
            emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused) {
              tap();
              navigateToTab(route.key);
            }
          };

          const onLongPress = () => {
            emitter.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={`${label} tab`}
              style={styles.tab}>
              <View style={styles.iconWrap}>
                <Icon
                  size={21}
                  color={focused ? colors.accent : colors.textTertiary}
                  strokeWidth={focused ? 2.2 : 1.9}
                />
              </View>
              <Text
                variant="nav"
                numberOfLines={1}
                style={{ color: focused ? colors.accent : colors.textTertiary }}>
                {label}
              </Text>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: focused ? colors.accent : 'transparent' },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    borderTopWidth: 0,
  },
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  iconWrap: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
