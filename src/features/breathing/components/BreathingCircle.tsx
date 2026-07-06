import { useCallback, useEffect, useMemo, type RefObject } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import type { HapticIntensity } from '@/features/settings';
import { BREATHING_CONFIG, RING } from '../constants';
import { useBreathingAnimation } from '../hooks/useBreathingAnimation';
import { useBreathingHaptics } from '../hooks/useBreathingHaptics';
import { useBreathingSound } from '../hooks/useBreathingSound';
import type { BreathingConfig } from '../types';
import { CenterLabel } from './CenterLabel';
import { ProgressRing } from './ProgressRing';

export interface BreathingCircleProps {
  /** Override the default breathing rhythm. */
  config?: BreathingConfig;
  /** Number of cycles to count down from (default 10). */
  totalCycles?: number;
  /** Called once the final cycle finishes. */
  onComplete?: () => void;
  /** Silence the inhale/hold/exhale voice cues. */
  muted?: boolean;
  /** Play phase-synced vibration guidance (off by default). */
  hapticsEnabled?: boolean;
  /** Vibration strength. */
  hapticIntensity?: HapticIntensity;
  /** Keep haptic guidance going while the app is backgrounded (Android). */
  backgroundEnabled?: boolean;
  /** Remaining session time (ms), or null if unbounded — bounds background haptics. */
  sessionRemainingMs?: number | null;
  /** When false, freeze the animation in place (pause / session finished). */
  running?: boolean;
  /** Bump to reset the session to the very start. */
  restartKey?: number;
  /** Populated with the animation's `advanceBy` so the screen can fast-forward. */
  advanceRef?: RefObject<((ms: number) => void) | null>;
  /** Replace the phase label (e.g. "Session complete" / "Paused"). */
  titleOverride?: string;
  /** Replace the "N cycles left" line (e.g. a time countdown or "∞"). */
  subtitleOverride?: string;
}

/**
 * Self-contained breathing widget: responsive sizing + animation + ring + label,
 * plus optional voice and haptic guidance. Drop it anywhere; it fills to a
 * share of the screen's shorter side.
 */
export function BreathingCircle({
  config,
  totalCycles,
  onComplete,
  muted = false,
  hapticsEnabled = false,
  hapticIntensity = 'medium',
  backgroundEnabled = false,
  sessionRemainingMs = null,
  running = true,
  restartKey = 0,
  advanceRef,
  titleOverride,
  subtitleOverride,
}: BreathingCircleProps) {
  const { width, height } = useWindowDimensions();
  const resolvedConfig = config ?? BREATHING_CONFIG;

  const size = useMemo(
    () => Math.min(Math.min(width, height) * RING.sizeRatio, RING.maxSize),
    [width, height],
  );
  const strokeWidth = size * RING.strokeRatio;

  const { progress, phaseIndex, phaseLabel, cyclesLeft, advanceBy, getCycleElapsedMs } =
    useBreathingAnimation({
      config: resolvedConfig,
      totalCycles,
      running,
      restartKey,
      onComplete,
    });

  // Time left in the session (ms), whichever bound is nearer: the remaining
  // cycles or an explicit duration. Bounds how far ahead background haptics are
  // scheduled so buzzing stops when the session would end while backgrounded.
  const getSessionRemainingMs = useCallback((): number | null => {
    const cycleMs =
      resolvedConfig.inhaleMs +
      resolvedConfig.holdInMs +
      resolvedConfig.exhaleMs +
      resolvedConfig.holdOutMs;
    const byCycles = Number.isFinite(cyclesLeft)
      ? Math.max(0, cyclesLeft * cycleMs - getCycleElapsedMs())
      : null;
    const bounds = [byCycles, sessionRemainingMs].filter(
      (v): v is number => v != null,
    );
    return bounds.length ? Math.min(...bounds) : null;
  }, [resolvedConfig, cyclesLeft, getCycleElapsedMs, sessionRemainingMs]);

  // Expose advanceBy to the parent screen (for background catch-up).
  useEffect(() => {
    if (!advanceRef) return;
    advanceRef.current = advanceBy;
    return () => {
      advanceRef.current = null;
    };
  }, [advanceRef, advanceBy]);

  // Guided voice cues, synced to the phase transitions.
  useBreathingSound(phaseIndex, !muted && running);

  // Phase-synced vibration guidance (opt-in via Settings).
  useBreathingHaptics({
    phaseIndex,
    config: resolvedConfig,
    enabled: hapticsEnabled && running,
    intensity: hapticIntensity,
    backgroundEnabled,
    getCycleElapsedMs,
    getSessionRemainingMs,
  });

  const title = titleOverride ?? phaseLabel;
  const subtitle =
    subtitleOverride ?? `${cyclesLeft} ${cyclesLeft === 1 ? 'cycle' : 'cycles'} left`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <ProgressRing size={size} strokeWidth={strokeWidth} progress={progress} />
      <CenterLabel title={title} subtitle={subtitle} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
