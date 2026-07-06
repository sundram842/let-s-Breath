import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { BreathingScreen } from '@/features/breathing';
import { HomeScreen } from '@/features/home';
import { SettingsScreen } from '@/features/settings';
import { useTheme } from '@/hooks/use-theme';
import { ExploreScreen } from '@/screens/ExploreScreen';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

/** Bottom tabs — Home + Explore — themed to the active Light/Dark palette. */
function Tabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundElement,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={route.name === 'Home' ? 'home' : 'compass'}
            size={size}
            color={color}
          />
        ),
      })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: 'Explore' }} />
    </Tab.Navigator>
  );
}

/**
 * Root stack. Mirrors the previous expo-router layout: the tabs at the root,
 * with the breathing Session and Settings pushed over them.
 */
export function RootNavigator() {
  const theme = useTheme();
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Session" component={BreathingScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
        }}
      />
    </Stack.Navigator>
  );
}
