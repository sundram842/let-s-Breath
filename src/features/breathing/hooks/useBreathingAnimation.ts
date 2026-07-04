import { useCallback, useEffect, useState } from 'react';
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import {
  BREATHING_CONFIG,
  DEFAULT_TOTAL_CYCLES,
  PHASE_LABELS,
  PHASE_SEQUENCE,
} from '../constants';
import type { BreathingConfig, BreathingPhase } from '../types';

export interface UseBreathingAnimationParams {
  /** Override the default 4-1-4-1 rhythm. */
  config?: BreathingConfig;
  /** How many cycles to count down from. */
  totalCycles?: number;
  /** Fired once when the last cycle completes. */
  onComplete?: () => void;
}

export interface UseBreathingAnimationResult {
  /** Ring fill 0..1, updated every frame on the UI thread. Feed to Skia. */
  progress: SharedValue<number>;
  /** Current phase, for logic. */
  phase: BreathingPhase;
  /** Human label for the current phase ("Inhale" / "Hold" / "Exhale"). */
  phaseLabel: string;
  /** Remaining cycles, counts down to 0. */
  cyclesLeft: number;
}

/** Ease-in-out for a soft, relaxing acceleration. Runs on the UI thread. */
function smoothstep(x: number): number {
  'worklet';
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * (3 - 2 * t);
}

/**
 * Drives the whole breathing animation from a single linear timeline that
 * repeats forever. `progress` and `phase` are *derived* from that timeline,
 * so there are no timers, no callbacks mid-cycle, and looping is seamless
 * (no jumps / no flicker). Progress is what the Skia ring consumes.
 */
export function useBreathingAnimation({
  config = BREATHING_CONFIG,
  totalCycles = DEFAULT_TOTAL_CYCLES,
  onComplete,
}: UseBreathingAnimationParams = {}): UseBreathingAnimationResult {
  const { inhaleMs, holdInMs, exhaleMs, holdOutMs } = config;
  const total = inhaleMs + holdInMs + exhaleMs + holdOutMs;

  // 0 → 1 over one full cycle, looping forever. The single source of truth.
  const clock = useSharedValue(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cyclesLeft, setCyclesLeft] = useState(totalCycles);

  // Reset the countdown when `totalCycles` changes — done during render
  // (React's recommended pattern) rather than in an effect.
  const [prevTotalCycles, setPrevTotalCycles] = useState(totalCycles);
  if (prevTotalCycles !== totalCycles) {
    setPrevTotalCycles(totalCycles);
    setCyclesLeft(totalCycles);
  }

  useEffect(() => {
    clock.value = 0;
    clock.value = withRepeat(
      withTiming(1, { duration: total, easing: Easing.linear }),
      -1, // infinite
      false, // don't reverse — the timeline models the full cycle itself
    );
    return () => {
      clock.value = 0;
    };
  }, [clock, total]);

  // Ring fill: eased on inhale/exhale, flat during holds.
  const progress = useDerivedValue(() => {
    const t = clock.value * total; // ms into the current cycle
    if (t < inhaleMs) return smoothstep(t / inhaleMs);
    if (t < inhaleMs + holdInMs) return 1;
    if (t < inhaleMs + holdInMs + exhaleMs) {
      return 1 - smoothstep((t - inhaleMs - holdInMs) / exhaleMs);
    }
    return 0;
  }, [inhaleMs, holdInMs, exhaleMs, total]);

  // Phase index (0 inhale, 1 hold, 2 exhale, 3 hold). When there is no
  // post-exhale hold (holdOutMs === 0) we stay on "exhale" at the boundary so
  // it doesn't briefly flip to a hold and fire a stray cue before the wrap.
  const phaseIndexSV = useDerivedValue(() => {
    const t = clock.value * total;
    if (t < inhaleMs) return 0;
    if (t < inhaleMs + holdInMs) return 1;
    if (t < inhaleMs + holdInMs + exhaleMs) return 2;
    return holdOutMs > 0 ? 3 : 2;
  }, [inhaleMs, holdInMs, exhaleMs, holdOutMs, total]);

  // Only cross the bridge to React when the phase actually changes.
  useAnimatedReaction(
    () => phaseIndexSV.value,
    (curr, prev) => {
      if (prev === null || curr !== prev) {
        runOnJS(setPhaseIndex)(curr);
      }
    },
    [],
  );

  const handleCycleComplete = useCallback(() => {
    setCyclesLeft((n) => {
      if (n <= 0) return 0;
      const next = n - 1;
      if (next === 0) onComplete?.();
      return next;
    });
  }, [onComplete]);

  // The timeline wraps (1 → 0) exactly once per full breath cycle.
  useAnimatedReaction(
    () => clock.value,
    (curr, prev) => {
      if (prev !== null && curr < prev) {
        runOnJS(handleCycleComplete)();
      }
    },
    [handleCycleComplete],
  );

  const phase = PHASE_SEQUENCE[phaseIndex];
  return {
    progress,
    phase,
    phaseLabel: PHASE_LABELS[phase],
    cyclesLeft,
  };
}
