import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useBreathingSettings } from '@/features/settings';
import { useSession, type SessionSnapshot } from '@/features/session';
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
 * The breathing-exercise screen, reached from Home by tapping Start / Resume.
 * Full-bleed gradient with the breathing circle centered, plus a Pause/Resume
 * control. It starts as soon as it mounts (that's the point of navigating here),
 * freezes its rhythm + targets for the whole session, and — when the user leaves
 * mid-session — hands a precise snapshot to the SessionProvider so Home can offer
 * "Resume Practice" and pick up from the exact phase, time, and cycle count.
 */
export function BreathingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useBreathingColors();
  const { durations, hapticsEnabled, hapticIntensity, soundEnabled, session, backgroundEnabled } =
    useBreathingSettings();
  const { snapshot, status: sessionStatus, savePaused, complete: completeSession } = useSession();

  // Capture the resume snapshot (if any) once, at mount. A fresh start clears it
  // via beginNew() before navigating here, so `resume` is null in that case.
  const [resume] = useState(() => (sessionStatus === 'paused' && snapshot ? snapshot : null));

  // Freeze the rhythm + session targets for the lifetime of this screen so a
  // resume is faithful and any Settings edits don't disrupt an active breath.
  const [config] = useState<BreathingConfig>(() =>
    resume
      ? resume.config
      : {
          inhaleMs: durations.inhaleSec * 1000,
          holdInMs: durations.holdSec * 1000,
          exhaleMs: durations.exhaleSec * 1000,
          holdOutMs: durations.holdOutSec * 1000,
        },
  );
  const [totalCycles] = useState<number>(() =>
    resume
      ? resume.totalCycles
      : session.mode === 'cycles' && !session.cyclesInfinite
        ? session.cycleCount
        : Infinity,
  );
  const [durationMs] = useState<number | null>(() =>
    resume
      ? resume.durationMs
      : session.mode === 'duration' && !session.durationInfinite
        ? session.sessionMinutes * 60_000
        : null,
  );

  const [status, setStatus] = useState<Status>('running');
  const [restartKey, setRestartKey] = useState(0);
  const [remainingMs, setRemainingMs] = useState<number | null>(
    resume ? resume.remainingMs : durationMs,
  );

  const running = status === 'running';
  const advanceRef = useRef<((ms: number) => void) | null>(null);
  const snapshotRef = useRef<(() => { cycleElapsedMs: number; cyclesLeft: number }) | null>(null);
  const remainingRef = useRef<number | null>(resume ? resume.remainingMs : durationMs);
  const lastTickRef = useRef<number | null>(null);
  const backgroundedAtRef = useRef<number | null>(null);
  // The snapshot to hand off on unmount, captured while the circle is still
  // mounted (children unmount before parents, so we can't read it in unmount).
  const pendingSnapshotRef = useRef<SessionSnapshot | null>(null);

  // Latest values for the unmount snapshot, read without re-subscribing.
  const statusRef = useRef(status);
  const saveRef = useRef(savePaused);
  useEffect(() => {
    statusRef.current = status;
    saveRef.current = savePaused;
  });

  // Reset the duration display on restart. `durationMs` is frozen, so the only
  // trigger is restartKey; skip the first run so a resume's remaining time stays.
  const durationSig = `${durationMs}|${restartKey}`;
  const [prevDurationSig, setPrevDurationSig] = useState(durationSig);
  if (prevDurationSig !== durationSig) {
    setPrevDurationSig(durationSig);
    setRemainingMs(durationMs);
  }
  const remainingSeededRef = useRef(false);
  useEffect(() => {
    if (!remainingSeededRef.current) {
      remainingSeededRef.current = true;
      return;
    }
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

  // Auto-pause when leaving the screen (navigating back to Home), and capture a
  // resumable snapshot now — while the breathing circle is still mounted.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setStatus((s) => (s === 'running' ? 'paused' : s));
        if (statusRef.current === 'complete') return;
        const snap = snapshotRef.current?.();
        if (!snap) return;
        pendingSnapshotRef.current = {
          cycleElapsedMs: snap.cycleElapsedMs,
          cyclesLeft: snap.cyclesLeft,
          remainingMs: remainingRef.current,
          config,
          totalCycles,
          durationMs,
        };
      };
    }, [config, totalCycles, durationMs]),
  );

  // Tell the provider the moment a session finishes so Home shows a fresh Start.
  useEffect(() => {
    if (status === 'complete') completeSession();
  }, [status, completeSession]);

  // On real unmount, hand the snapshot captured at blur to the provider so Home
  // can offer Resume. Skip if the session finished (Home shows a fresh Start).
  useEffect(() => {
    return () => {
      if (statusRef.current === 'complete') return;
      if (pendingSnapshotRef.current) saveRef.current(pendingSnapshotRef.current);
    };
  }, []);

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
          initialElapsedMs={resume?.cycleElapsedMs ?? 0}
          initialCyclesLeft={resume?.cyclesLeft ?? undefined}
          advanceRef={advanceRef}
          snapshotRef={snapshotRef}
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
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back to home"
        style={({ pressed }) => [
          styles.backButton,
          {
            backgroundColor: colors.control,
            top: insets.top + Spacing.two,
            opacity: pressed ? 0.5 : 1,
          },
        ]}
      >
        <Ionicons name="chevron-back" size={24} color={colors.title} />
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
  backButton: {
    position: 'absolute',
    left: Spacing.four,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
