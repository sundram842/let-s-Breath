import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useBreathingSettings } from '@/features/settings';
import { colors } from '@/theme';
import { BreathingCircle } from './components/BreathingCircle';
import type { BreathingConfig } from './types';

/** ms → "M:SS". */
function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * First screen: full-bleed blue gradient with the breathing circle centered.
 * Runs a session using the latest saved settings — ending after a set number of
 * cycles, after a set time, or never (infinite). Tap the circle to start again
 * once a session completes. A gear button top-right opens Settings.
 */
export function BreathingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { durations, hapticsEnabled, hapticIntensity, soundEnabled, session } =
    useBreathingSettings();

  // Box breathing: Inhale → Hold (full) → Exhale → Hold (empty) → repeat.
  const config = useMemo<BreathingConfig>(
    () => ({
      inhaleMs: durations.inhaleSec * 1000,
      holdInMs: durations.holdSec * 1000,
      exhaleMs: durations.exhaleSec * 1000,
      holdOutMs: durations.holdOutSec * 1000,
    }),
    [durations],
  );

  // Cycle target: a finite count only in cycle mode; otherwise the session
  // never ends by cycles (duration mode uses a timer; infinite never ends).
  const totalCycles =
    session.mode === 'cycles' && !session.cyclesInfinite ? session.cycleCount : Infinity;
  const durationMs =
    session.mode === 'duration' && !session.durationInfinite
      ? session.sessionMinutes * 60_000
      : null;

  // Only buzz while this screen is focused (not while on Settings).
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  // --- Session lifecycle ---------------------------------------------------
  const [status, setStatus] = useState<'running' | 'complete'>('running');
  const [remainingMs, setRemainingMs] = useState<number | null>(durationMs);

  // Restart the session whenever the settings that define it change (done in
  // render — React's pattern — so it takes effect immediately).
  const signature = `${config.inhaleMs}|${config.holdInMs}|${config.exhaleMs}|${config.holdOutMs}|${totalCycles}|${durationMs}`;
  const [prevSignature, setPrevSignature] = useState(signature);
  if (prevSignature !== signature) {
    setPrevSignature(signature);
    setStatus('running');
    setRemainingMs(durationMs);
  }

  const running = status === 'running';

  // Count down the clock in duration mode; end the session at zero.
  useEffect(() => {
    if (!running || durationMs == null) return;
    const start = Date.now();
    const id = setInterval(() => {
      const left = durationMs - (Date.now() - start);
      if (left <= 0) {
        setRemainingMs(0);
        setStatus('complete');
      } else {
        setRemainingMs(left);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, durationMs]);

  const handleCyclesDone = useCallback(() => setStatus('complete'), []);
  const restart = useCallback(() => {
    setRemainingMs(durationMs);
    setStatus('running');
  }, [durationMs]);

  // What the center label shows.
  let titleOverride: string | undefined;
  let subtitleOverride: string | undefined;
  if (status === 'complete') {
    titleOverride = 'Session complete';
    subtitleOverride = 'Tap to start again';
  } else if (durationMs != null) {
    subtitleOverride = `${formatClock(remainingMs ?? durationMs)} left`;
  } else if (totalCycles === Infinity) {
    subtitleOverride = 'Breathe until you’re ready';
  }
  // else: finite cycle mode → BreathingCircle shows "N cycles left".

  const complete = status === 'complete';

  return (
    <LinearGradient
      colors={[colors.breathing.gradientFrom, colors.breathing.gradientTo]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.fill}
    >
      <StatusBar style="light" />

      <Pressable
        style={styles.center}
        onPress={complete ? restart : undefined}
        disabled={!complete}
        accessibilityRole={complete ? 'button' : undefined}
        accessibilityLabel={complete ? 'Start a new session' : undefined}
      >
        <BreathingCircle
          config={config}
          totalCycles={totalCycles}
          running={running}
          onComplete={handleCyclesDone}
          muted={!soundEnabled}
          hapticsEnabled={hapticsEnabled && focused}
          hapticIntensity={hapticIntensity}
          titleOverride={titleOverride}
          subtitleOverride={subtitleOverride}
        />
      </Pressable>

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
