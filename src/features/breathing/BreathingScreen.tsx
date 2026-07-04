import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useBreathingSettings } from '@/features/settings';
import { colors } from '@/theme';
import { BreathingCircle } from './components/BreathingCircle';
import type { BreathingConfig } from './types';

/**
 * First screen: full-bleed blue gradient with the breathing circle centered.
 * The session always runs on the latest saved durations (from Settings), and a
 * gear button top-right opens the Settings screen.
 */
export function BreathingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { durations, hapticsEnabled, hapticIntensity } = useBreathingSettings();

  // Box breathing: Inhale → Hold (full) → Exhale → Hold (empty) → repeat.
  // The empty hold reuses the "Hold" duration so all four phases are real.
  const config = useMemo<BreathingConfig>(
    () => ({
      inhaleMs: durations.inhaleSec * 1000,
      holdInMs: durations.holdSec * 1000,
      exhaleMs: durations.exhaleSec * 1000,
      holdOutMs: durations.holdSec * 1000,
    }),
    [durations],
  );

  // Only buzz while this screen is actually focused (not while on Settings).
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  return (
    <LinearGradient
      colors={[colors.breathing.gradientFrom, colors.breathing.gradientTo]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.fill}
    >
      <StatusBar style="light" />

      <View style={styles.center}>
        <BreathingCircle
          config={config}
          hapticsEnabled={hapticsEnabled && focused}
          hapticIntensity={hapticIntensity}
        />
      </View>

      <Pressable
        onPress={() => router.push('/settings')}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        style={({ pressed }) => [
          styles.settingsButton,
          { top: insets.top + Spacing.two, opacity: pressed ? 0.5 : 1 },
        ]}
      >
        <Ionicons name="settings-outline" size={24} color={colors.breathing.title} />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    position: 'absolute',
    right: Spacing.four,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});
