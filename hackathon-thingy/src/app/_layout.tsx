import { DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { SideQuestColors } from '@/constants/theme';
import { AuthProvider } from '@/context/auth';
import { DemoJourneyProvider } from '@/context/demo-journey';

const sideQuestTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: SideQuestColors.gold,
    background: SideQuestColors.void,
    card: SideQuestColors.surface,
    text: SideQuestColors.text,
    border: SideQuestColors.border,
    notification: SideQuestColors.red,
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider value={sideQuestTheme}>
        <AuthProvider>
          <DemoJourneyProvider>
            <StatusBar style="dark" />
            <AppTabs />
          </DemoJourneyProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
