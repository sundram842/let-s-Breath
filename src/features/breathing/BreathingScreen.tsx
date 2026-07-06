import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useBreathingSettings } from '@/features/settings';
import { useBreathingColors } from '@/hooks/use-theme';
import { BreathingCircle } from './components/BreathingCircle';
import type { BreathingConfig } from './types';

type Status = 'running' | 'paused' | 'complete';

/** ms → "M:SS". */
function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * First screen: full-bleed gradient with the breathing circle centered, plus a
 * Pause/Resume control. Settings apply live (no restart); opening Settings or
 * (optionally) backgrounding the app pauses the session while preserving the
 * exact phase and remaining time.
 */
export function BreathingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useBreathingColors();
  const { durations, hapticsEnabled, hapticIntensity, soundEnabled, session, backgroundEnabled } =
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

  const totalCycles =
    session.mode === 'cycles' && !session.cyclesInfinite ? session.cycleCount : Infinity;
  const durationMs =
    session.mode === 'duration' && !session.durationInfinite
      ? session.sessionMinutes * 60_000
      : null;

  const [status, setStatus] = useState<Status>('running');
  const [restartKey, setRestartKey] = useState(0);
  const [remainingMs, setRemainingMs] = useState<number | null>(durationMs);

  const running = status === 'running';
  const advanceRef = useRef<((ms: number) => void) | null>(null);
  const remainingRef = useRef<number | null>(durationMs);
  const lastTickRef = useRef<number | null>(null);
  const backgroundedAtRef = useRef<number | null>(null);

  // Reset the duration display when the target changes or on restart — state in
  // render (React's pattern), ref in an effect (never mutate a ref in render).
  const durationSig = `${durationMs}|${restartKey}`;
  const [prevDurationSig, setPrevDurationSig] = useState(durationSig);
  if (prevDurationSig !== durationSig) {
    setPrevDurationSig(durationSig);
    setRemainingMs(durationMs);
  }
  useEffect(() => {
    remainingRef.current = durationMs;
  }, [durationMs, restartKey]);

  // Pausable duration countdown: only ticks while running; `dt` naturally
  // absorbs any suspended (backgrounded) time so it self-corrects on resume.
  useEffect(() => {
    if (status !== 'running' || durationMs == null) {
      lastTickRef.current = null;
      return;
    }
    lastTickRef.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = now - (lastTickRef.current ?? now);
      lastTickRef.current = now;
      const left = Math.max(0, (remainingRef.current ?? durationMs) - dt);
      remainingRef.current = left;
      setRemainingMs(left);
      if (left <= 0) {
        setStatus('complete');
        clearInterval(id);
      }
    }, 250);
    return () => clearInterval(id);
  }, [status, durationMs]);

  // Auto-pause when leaving the screen (e.g. opening Settings).
  useFocusEffect(
    useCallback(() => {
      return () => setStatus((s) => (s === 'running' ? 'paused' : s));
    }, []),
  );

  // Background handling.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        if (backgroundEnabled) {
          backgroundedAtRef.current = Date.now();
        } else {
          setStatus((s) => (s === 'running' ? 'paused' : s));
        }
      } else if (next === 'active' && backgroundedAtRef.current != null) {
        const elapsed = Date.now() - backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        // Fast-forward the cycle position + count; the duration interval
        // self-corrects its own remaining time on its next tick.
        advanceRef.current?.(elapsed);
      }
    });
    return () => sub.remove();
  }, [backgroundEnabled]);

  const handleCyclesDone = useCallback(() => setStatus('complete'), []);
  const togglePause = useCallback(
    () => setStatus((s) => (s === 'running' ? 'paused' : s === 'paused' ? 'running' : s)),
    [],
  );
  const restart = useCallback(() => {
    setRestartKey((k) => k + 1);
    setStatus('running');
  }, []);

  // Center label.
  let titleOverride: string | undefined;
  let subtitleOverride: string | undefined;
  if (status === 'complete') {
    titleOverride = 'Session complete';
    subtitleOverride = 'Tap to start again';
  } else if (status === 'paused') {
    subtitleOverride = 'Paused';
  } else if (durationMs != null) {
    subtitleOverride = `${formatClock(remainingMs ?? durationMs)} left`;
  } else if (totalCycles === Infinity) {
    subtitleOverride = 'Breathe until you’re ready';
  }

  const complete = status === 'complete';

  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
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
          restartKey={restartKey}
          advanceRef={advanceRef}
          onComplete={handleCyclesDone}
          muted={!soundEnabled}
          hapticsEnabled={hapticsEnabled}
          hapticIntensity={hapticIntensity}
          backgroundEnabled={backgroundEnabled}
          sessionRemainingMs={durationMs != null ? (remainingMs ?? durationMs) : null}
          titleOverride={titleOverride}
          subtitleOverride={subtitleOverride}
        />
      </Pressable>

      {!complete && (
        <Pressable
          onPress={togglePause}
          accessibilityRole="button"
          accessibilityLabel={running ? 'Pause session' : 'Resume session'}
          style={({ pressed }) => [
            styles.pauseButton,
            {
              backgroundColor: colors.control,
              bottom: insets.bottom + Spacing.six,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons name={running ? 'pause' : 'play'} size={22} color={colors.title} />
          <Text style={[styles.pauseLabel, { color: colors.title }]}>
            {running ? 'Pause' : 'Resume'}
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={() => router.push('/settings')}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        style={({ pressed }) => [
          styles.settingsButton,
          {
            backgroundColor: colors.control,
            top: insets.top + Spacing.two,
            opacity: pressed ? 0.5 : 1,
          },
        ]}
      >
        <Ionicons name="settings-outline" size={24} color={colors.title} />
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
  pauseButton: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
  },
  pauseLabel: {
    fontSize: 16,
    fontWeight: '600',
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
  },
});
