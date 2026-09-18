/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#20392F",
    background: "#F6F7F2",
    backgroundElement: "#FFFFFF",
    backgroundSelected: "#E6EDE3",
    textSecondary: "#5F6F65",
  },
  dark: {
    text: "#F5F1E8",
    background: "#080B12",
    backgroundElement: "#141A25",
    backgroundSelected: "#20293A",
    textSecondary: "#A9B0BE",
  },
} as const;

export const SideQuestColors = {
  void: "#F6F7F2",
  ink: "#20392F",
  navy: "#EDF1E9",
  navyBright: "#E6EDE3",
  cobaltDark: "#345E75",
  cobalt: "#426B83",
  emerald: "#287650",
  amber: "#956025",
  gold: "#D8B477",
  goldSoft: "#76531D",
  red: "#B83E4B",
  white: "#FFFFFF",
  text: "#20392F",
  textMuted: "#5F6F65",
  textDim: "#6C786E",
  road: "#A3B1A3",
  surface: "#FFFFFF",
  surfaceRaised: "#F0F3EC",
  surfaceSoft: "#E6EDE3",
  border: "#DFE5DC",
  borderStrong: "#BDC9BB",
  overlay: "rgba(26,45,35,0.45)",
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
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
