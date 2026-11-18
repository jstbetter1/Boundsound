import { Tabs } from 'expo-router/js-tabs';
import React from 'react';

import { BoundTabBar } from '@/components/layout/BoundTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BoundTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="for-you" options={{ title: 'For You' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="downloads" options={{ title: 'Downloads' }} />
    </Tabs>
  );
}
