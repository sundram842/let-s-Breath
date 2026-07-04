import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SettingsProvider } from '@/features/settings';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Persisted breathing settings available to every screen. */}
      <SettingsProvider>
        <AnimatedSplashOverlay />
        <Stack>
          {/* The bottom tabs (Home + Explore) — no stack header. */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Pushed over the tabs, with a native back button top-left. */}
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </SettingsProvider>
    </ThemeProvider>
  );
}
