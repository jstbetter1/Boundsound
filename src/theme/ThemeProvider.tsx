import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import type { ColorScheme, ThemeColors } from './tokens';
import { palettes } from './tokens';

export type ThemePreference = 'dark' | 'light' | 'system';

type ThemeContextValue = {
  scheme: ColorScheme;
  isDark: boolean;
  colors: ThemeColors;
  preference: ThemePreference;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  preference = 'dark',
}: {
  children: React.ReactNode;
  preference?: ThemePreference;
}) {
  const system = useColorScheme();
  const value = useMemo<ThemeContextValue>(() => {
    const scheme: ColorScheme =
      preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference;
    return {
      scheme,
      isDark: scheme === 'dark',
      colors: palettes[scheme],
      preference,
    };
  }, [preference, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
