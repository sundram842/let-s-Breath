import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SessionProvider } from '@/features/session';
import { SettingsProvider, useBreathingSettings } from '@/features/settings';
import { linking } from '@/navigation/linking';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <SessionProvider>
            <ThemedNavigation />
          </SessionProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Applies the saved Light/Dark preference to the navigation chrome. */
function ThemedNavigation() {
  const { themePreference } = useBreathingSettings();
  return (
    <NavigationContainer
      theme={themePreference === 'dark' ? DarkTheme : DefaultTheme}
      linking={linking}>
      <AnimatedSplashOverlay />
      <RootNavigator />
    </NavigationContainer>
  );
}
