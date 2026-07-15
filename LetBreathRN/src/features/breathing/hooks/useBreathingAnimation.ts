/*
 * Reanimated shared values are mutable by design (advanced on the UI thread by
 * the frame loop and fast-forwarded by advanceBy). The React Compiler's
 * immutability rule flags those `.value` writes as false positives here.
 */
/* eslint-disable react-hooks/immutability */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
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
  /** How many cycles to count down from (pass Infinity to never end). */
  totalCycles?: number;
  /** Pause (false) freezes in place; resume (true) continues — no restart. */
  running?: boolean;
  /** Bump this to reset the session to the very start. */
  restartKey?: number;
  /** Seed the clock partway into a cycle (ms) — used to resume a paused session. */
  initialElapsedMs?: number;
  /** Seed the remaining-cycles counter (defaults to `totalCycles`) — for resume. */
  initialCyclesLeft?: number;
  /** Fired once when the last cycle completes. */
  onComplete?: () => void;
}

export interface UseBreathingAnimationResult {
  /** Ring fill 0..1, updated every frame on the UI thread. */
  progress: SharedValue<number>;
  /** Progress 0..1 *within the current phase*, resetting to 0 at each phase
   * boundary — drives the clock-style sweep. Updated on the UI thread. */
  phaseProgress: SharedValue<number>;
  /** Current phase, for logic. */
  phase: BreathingPhase;
  /** Raw phase index 0-3 (inhale, hold-full, exhale, hold-empty) for cue engines. */
  phaseIndex: number;
  /** Human label for the current phase. */
  phaseLabel: string;
  /** Remaining cycles, counts down to 0. */
  cyclesLeft: number;
  /** Whole seconds remaining in the *current* phase, counts down to 0. */
  phaseSecondsLeft: number;
  /** Fast-forward the session by `ms` (used to catch up after background). */
  advanceBy: (ms: number) => void;
  /** Current position within the cycle (ms) — read when pre-scheduling haptics. */
  getCycleElapsedMs: () => number;
}

/**
 * Whole seconds left in the phase occupied at `elapsedMs` into the cycle. Plain
 * JS twin of the on-thread derived value below — used to seed the initial value
 * without a frame having run yet (so a resumed/paused session shows the right
 * number immediately).
 */
function phaseSecondsLeftAt(
  elapsedMs: number,
  total: number,
  inhaleMs: number,
  holdInMs: number,
  exhaleMs: number,
): number {
  if (total <= 0) return 0;
  const t = ((elapsedMs % total) + total) % total;
  let boundary: number;
  if (t < inhaleMs) boundary = inhaleMs;
  else if (t < inhaleMs + holdInMs) boundary = inhaleMs + holdInMs;
  else if (t < inhaleMs + holdInMs + exhaleMs) boundary = inhaleMs + holdInMs + exhaleMs;
  else boundary = total;
  return Math.max(0, Math.ceil((boundary - t) / 1000));
}

/** Ease-in-out for a soft, relaxing acceleration. Runs on the UI thread. */
function smoothstep(x: number): number {
  'worklet';
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * (3 - 2 * t);
}

/**
 * Drives the breathing animation from a single normalized clock (0→1 per cycle)
 * advanced by a UI-thread frame loop. `progress` and `phase` are *derived* from
 * that clock, so pausing = stop advancing (position preserved), and resuming =
 * continue from the exact same point. `advanceBy` jumps the clock forward to
 * reconcile time spent in the background.
 */
export function useBreathingAnimation({
  config = BREATHING_CONFIG,
  totalCycles = DEFAULT_TOTAL_CYCLES,
  running = true,
  restartKey = 0,
  initialElapsedMs = 0,
  initialCyclesLeft,
  onComplete,
}: UseBreathingAnimationParams = {}): UseBreathingAnimationResult {
  const { inhaleMs, holdInMs, exhaleMs, holdOutMs } = config;
  const total = inhaleMs + holdInMs + exhaleMs + holdOutMs;

  // Seed the clock at the resume position (0 for a fresh start).
  const clock = useSharedValue(total > 0 ? (initialElapsedMs % total) / total : 0);
  const cyclesElapsed = useSharedValue(0); // monotonic; deltas drive the counter
  const totalSV = useSharedValue(total); // read inside the frame worklet
  useEffect(() => {
    totalSV.value = total;
  }, [total, totalSV]);

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cyclesLeft, setCyclesLeft] = useState(initialCyclesLeft ?? totalCycles);

  // Reset the counter when the target changes or the session is restarted —
  // during render (React's pattern), never touching the clock position here.
  const [prevTotalCycles, setPrevTotalCycles] = useState(totalCycles);
  if (prevTotalCycles !== totalCycles) {
    setPrevTotalCycles(totalCycles);
    setCyclesLeft(totalCycles);
  }
  const [prevRestartKey, setPrevRestartKey] = useState(restartKey);
  if (prevRestartKey !== restartKey) {
    setPrevRestartKey(restartKey);
    setCyclesLeft(totalCycles);
  }

  // On restart, rewind the clock to the very start of the cycle. Skip the first
  // run so the resume seed (initialElapsedMs) isn't wiped on mount.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!seededRef.current) {
      seededRef.current = true;
      return;
    }
    clock.value = 0;
  }, [clock, restartKey]);

  // Advance the clock each frame; tally whole cycles as they pass.
  const frame = useFrameCallback((info) => {
    'worklet';
    const t = totalSV.value;
    const dt = info.timeSincePreviousFrame ?? 0;
    // Ignore abnormal deltas (a frame hitch, or the big spike when returning
    // from background) — catch-up is handled deterministically by advanceBy.
    if (t <= 0 || dt <= 0 || dt > 250) return;
    const next = clock.value + dt / t;
    if (next >= 1) {
      cyclesElapsed.value += Math.floor(next);
      clock.value = next - Math.floor(next);
    } else {
      clock.value = next;
    }
  }, false);

  // Run only while `running` — pausing simply stops the frame loop in place.
  useEffect(() => {
    frame.setActive(running);
  }, [frame, running]);

  // Ring fill: eased on inhale/exhale, flat during holds.
  const progress = useDerivedValue(() => {
    const t = clock.value * total;
    if (t < inhaleMs) return smoothstep(t / inhaleMs);
    if (t < inhaleMs + holdInMs) return 1;
    if (t < inhaleMs + holdInMs + exhaleMs) {
      return 1 - smoothstep((t - inhaleMs - holdInMs) / exhaleMs);
    }
    return 0;
  }, [inhaleMs, holdInMs, exhaleMs, total]);

  // Progress within the current phase (0→1), for the clock-style sweep. Resets
  // to 0 at each phase boundary because it's measured against that phase's own
  // start + duration. A zero-length phase reads as instantly complete.
  const phaseProgress = useDerivedValue(() => {
    const t = clock.value * total;
    if (t < inhaleMs) return inhaleMs > 0 ? t / inhaleMs : 1;
    if (t < inhaleMs + holdInMs) return holdInMs > 0 ? (t - inhaleMs) / holdInMs : 1;
    if (t < inhaleMs + holdInMs + exhaleMs) {
      return exhaleMs > 0 ? (t - inhaleMs - holdInMs) / exhaleMs : 1;
    }
    return holdOutMs > 0 ? (t - inhaleMs - holdInMs - exhaleMs) / holdOutMs : 1;
  }, [inhaleMs, holdInMs, exhaleMs, holdOutMs, total]);

  // Phase index (0 inhale, 1 hold-full, 2 exhale, 3 hold-empty).
  const phaseIndexSV = useDerivedValue(() => {
    const t = clock.value * total;
    if (t < inhaleMs) return 0;
    if (t < inhaleMs + holdInMs) return 1;
    if (t < inhaleMs + holdInMs + exhaleMs) return 2;
    return holdOutMs > 0 ? 3 : 2;
  }, [inhaleMs, holdInMs, exhaleMs, holdOutMs, total]);

  useAnimatedReaction(
    () => phaseIndexSV.value,
    (curr, prev) => {
      if (prev === null || curr !== prev) {
        runOnJS(setPhaseIndex)(curr);
      }
    },
    [],
  );

  // Whole seconds left in the current phase, for the in-circle countdown. Derived
  // on the UI thread from the same clock, then mirrored to React only when the
  // displayed integer changes (so we re-render at most once a second, in sync
  // with the ring rather than on a separate timer).
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(() =>
    phaseSecondsLeftAt(initialElapsedMs, total, inhaleMs, holdInMs, exhaleMs),
  );
  const phaseSecondsLeftSV = useDerivedValue(() => {
    if (total <= 0) return 0;
    const t = clock.value * total;
    let boundary: number;
    if (t < inhaleMs) boundary = inhaleMs;
    else if (t < inhaleMs + holdInMs) boundary = inhaleMs + holdInMs;
    else if (t < inhaleMs + holdInMs + exhaleMs) boundary = inhaleMs + holdInMs + exhaleMs;
    else boundary = total;
    return Math.max(0, Math.ceil((boundary - t) / 1000));
  }, [inhaleMs, holdInMs, exhaleMs, total]);

  useAnimatedReaction(
    () => phaseSecondsLeftSV.value,
    (curr, prev) => {
      if (prev === null || curr !== prev) {
        runOnJS(setPhaseSecondsLeft)(curr);
      }
    },
    [],
  );

  const handleCyclesElapsed = useCallback(
    (delta: number) => {
      setCyclesLeft((n) => {
        if (!Number.isFinite(n) || n <= 0) return n; // Infinity / already done
        const next = Math.max(0, n - delta);
        if (next === 0) onComplete?.();
        return next;
      });
    },
    [onComplete],
  );

  // Decrement the counter whenever whole cycles are tallied (frame or advanceBy).
  useAnimatedReaction(
    () => cyclesElapsed.value,
    (curr, prev) => {
      if (prev !== null && curr > prev) {
        runOnJS(handleCyclesElapsed)(curr - prev);
      }
    },
    [handleCyclesElapsed],
  );

  const advanceBy = useCallback(
    (ms: number) => {
      if (ms <= 0 || total <= 0) return;
      const absolute = clock.value * total + ms;
      const whole = Math.floor(absolute / total);
      if (whole > 0) cyclesElapsed.value = cyclesElapsed.value + whole;
      clock.value = (absolute % total) / total;
    },
    [clock, cyclesElapsed, total],
  );

  // Snapshot the UI-thread clock on the JS thread (a plain shared-value read).
  const getCycleElapsedMs = useCallback(() => clock.value * total, [clock, total]);

  const phase = PHASE_SEQUENCE[phaseIndex];
  return {
    progress,
    phaseProgress,
    phase,
    phaseIndex,
    phaseLabel: PHASE_LABELS[phase],
    cyclesLeft,
    phaseSecondsLeft,
    advanceBy,
    getCycleElapsedMs,
  };
}
