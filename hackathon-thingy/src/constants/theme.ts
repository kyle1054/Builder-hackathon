/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#F5F1E8',
    background: '#080B12',
    backgroundElement: '#141A25',
    backgroundSelected: '#20293A',
    textSecondary: '#A9B0BE',
  },
  dark: {
    text: '#F5F1E8',
    background: '#080B12',
    backgroundElement: '#141A25',
    backgroundSelected: '#20293A',
    textSecondary: '#A9B0BE',
  },
} as const;

export const SideQuestColors = {
  void: '#080B12',
  ink: '#0C1018',
  navy: '#111827',
  navyBright: '#182234',
  cobaltDark: '#27405A',
  cobalt: '#7FA8C9',
  emerald: '#75C69D',
  amber: '#DFA45B',
  gold: '#D8B477',
  goldSoft: '#F0D7AA',
  red: '#D86E78',
  white: '#F5F1E8',
  textMuted: '#A9B0BE',
  textDim: '#737C8D',
  road: '#566174',
  surface: '#121823',
  surfaceRaised: '#18202D',
  surfaceSoft: '#1D2635',
  border: 'rgba(232, 220, 193, 0.14)',
  borderStrong: 'rgba(232, 220, 193, 0.26)',
  overlay: 'rgba(7, 10, 16, 0.78)',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
