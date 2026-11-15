import { Platform } from 'react-native';

export type ColorScheme = 'dark' | 'light';

export const brand = {
  lime: '#C8F751',
  limeDeep: '#9FE000',
  violet: '#8B7CFF',
  rose: '#FF7AA8',
  sky: '#66D9E8',
  amber: '#FFC96B',
} as const;

export type ThemeColors = {
  canvas: string;
  canvasElevated: string;
  surface: string;
  surfaceStrong: string;
  surfaceSolid: string;
  surfaceSunken: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  accentBorder: string;
  violet: string;
  rose: string;
  success: string;
  danger: string;
  warning: string;
  scrim: string;
  shadow: string;
  tabBar: string;
  miniPlayer: string;
  skeleton: string;
  overlayHighlight: string;
};

const dark: ThemeColors = {
  canvas: '#07080B',
  canvasElevated: '#0C0E12',
  surface: 'rgba(255,255,255,0.055)',
  surfaceStrong: 'rgba(255,255,255,0.095)',
  surfaceSolid: '#14171D',
  surfaceSunken: 'rgba(0,0,0,0.28)',
  border: 'rgba(255,255,255,0.085)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#F6F7F8',
  textSecondary: '#A2A7B0',
  textTertiary: '#6C7280',
  textInverse: '#0A0B0D',
  accent: brand.lime,
  accentInk: '#111405',
  accentSoft: 'rgba(200,247,81,0.13)',
  accentBorder: 'rgba(200,247,81,0.32)',
  violet: brand.violet,
  rose: brand.rose,
  success: '#5EE0A0',
  danger: '#FF6B72',
  warning: '#FFC96B',
  scrim: 'rgba(3,4,6,0.72)',
  shadow: '#000000',
  tabBar: 'rgba(10,12,16,0.78)',
  miniPlayer: 'rgba(22,25,31,0.86)',
  skeleton: 'rgba(255,255,255,0.06)',
  overlayHighlight: 'rgba(255,255,255,0.08)',
};

const light: ThemeColors = {
  canvas: '#F4F4F1',
  canvasElevated: '#FBFBF8',
  surface: 'rgba(255,255,255,0.72)',
  surfaceStrong: 'rgba(255,255,255,0.92)',
  surfaceSolid: '#FFFFFF',
  surfaceSunken: 'rgba(19,21,24,0.045)',
  border: 'rgba(19,21,24,0.09)',
  borderStrong: 'rgba(19,21,24,0.17)',
  text: '#101216',
  textSecondary: '#5D626B',
  textTertiary: '#8A8F98',
  textInverse: '#FFFFFF',
  accent: '#B4E629',
  accentInk: '#161A05',
  accentSoft: 'rgba(150,199,0,0.14)',
  accentBorder: 'rgba(122,163,0,0.34)',
  violet: '#6E5BE8',
  rose: '#E05284',
  success: '#0F9D63',
  danger: '#D6424A',
  warning: '#B97A0A',
  scrim: 'rgba(16,18,22,0.44)',
  shadow: '#25280F',
  tabBar: 'rgba(250,250,247,0.82)',
  miniPlayer: 'rgba(255,255,255,0.9)',
  skeleton: 'rgba(19,21,24,0.07)',
  overlayHighlight: 'rgba(255,255,255,0.7)',
};

export const palettes: Record<ColorScheme, ThemeColors> = { dark, light };

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  giant: 64,
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 32,
  pill: 999,
} as const;

export const fonts = {
  display: 'Sora_700Bold',
  displayHeavy: 'Sora_800ExtraBold',
  heading: 'Sora_600SemiBold',
  headingMedium: 'Sora_500Medium',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemibold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyHeavy: 'Manrope_800ExtraBold',
} as const;

export const type = {
  display: {
    fontFamily: fonts.displayHeavy,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.7,
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  subheading: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySemibold: {
    fontFamily: fonts.bodySemibold,
    fontSize: 15,
    lineHeight: 21,
  },
  small: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.2,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  nav: {
    fontFamily: fonts.bodySemibold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.1,
  },
} as const;

export type TypeVariant = keyof typeof type;

export const elevation = {
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.3,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
    },
    android: { elevation: 6 },
    default: {},
  })!,
  floating: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.42,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 18 },
    },
    android: { elevation: 14 },
    default: {},
  })!,
};

export const screenPadding = 20;
export const maxContentWidth = 720;
export const tabBarHeight = 58;
