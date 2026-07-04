import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SettingsProvider, useBreathingSettings } from '@/features/settings';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SettingsProvider>
      <ThemedApp />
    </SettingsProvider>
  );
}

/** Applies the saved Light/Dark preference to navigation chrome + all screens. */
function ThemedApp() {
  const { themePreference } = useBreathingSettings();
  return (
    <ThemeProvider value={themePreference === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        {/* The bottom tabs (Home + Explore) — no stack header. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Pushed over the tabs, with a native back button top-left. */}
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </ThemeProvider>
  );
}
