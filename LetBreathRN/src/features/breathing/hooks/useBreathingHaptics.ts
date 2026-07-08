import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { HapticIntensity } from '@/features/settings';
import type { BreathingConfig } from '../types';
import { HapticEngine, type HapticPhase } from '../haptics/hapticEngine';

/** Animation phase index (0-3) → haptic signature. */
const PHASE_TO_HAPTIC: Record<number, HapticPhase> = {
  0: 'inhale',
  1: 'holdFull',
  2: 'exhale',
  3: 'holdEmpty',
};

/** Duration (ms) of the phase at `index`, straight from the animation config. */
function phaseDurationMs(index: number, config: BreathingConfig): number {
  switch (index) {
    case 0:
      return config.inhaleMs;
    case 1:
      return config.holdInMs;
    case 2:
      return config.exhaleMs;
    case 3:
      return config.holdOutMs;
    default:
      return 0;
  }
}

/** Cycle time (ms) elapsed at the *start* of the phase at `index`. */
function phaseStartMs(index: number, config: BreathingConfig): number {
  switch (index) {
    case 1:
      return config.inhaleMs;
    case 2:
      return config.inhaleMs + config.holdInMs;
    case 3:
      return config.inhaleMs + config.holdInMs + config.exhaleMs;
    default:
      return 0;
  }
}

export interface UseBreathingHapticsParams {
  /** Current phase index (0-3), same value that drives the ring animation. */
  phaseIndex: number;
  /** The active durations, so each phase's pattern is sized correctly. */
  config: BreathingConfig;
  /** Master switch (setting ON + screen focused + session running). */
  enabled: boolean;
  /** Vibration strength. */
  intensity: HapticIntensity;
  /** Whether the session is set to continue while the app is backgrounded. */
  backgroundEnabled?: boolean;
  /** Reads the current position within the cycle (ms) — used to stay in sync
   * when pre-scheduling the background timeline. */
  getCycleElapsedMs?: () => number;
  /** Remaining session time (ms), or null if unbounded — caps how far ahead the
   * background timeline is scheduled so buzzing stops at the session's end. */
  getSessionRemainingMs?: () => number | null;
}

/**
 * Plays the matching haptic pattern at the start of every breathing phase,
 * automatically adapting to the configured durations. Because `phaseIndex`
 * comes from the same timeline as the ring, the vibration stays in sync with
 * the animation. Cancels cleanly when disabled, on phase change, or on unmount.
 *
 * Background: when the app is backgrounded during a running session (with
 * "Continue in Background" on), the animation loop is suspended by the OS, so no
 * new phase transitions fire. To keep haptics going we pre-schedule the upcoming
 * timeline as a single native waveform on `background` and cancel it on `active`,
 * letting the live per-phase engine take back over. See `HapticEngine.playBackground`
 * for the platform details (Android continues; iOS cannot vibrate while suspended).
 */
export function useBreathingHaptics({
  phaseIndex,
  config,
  enabled,
  intensity,
  backgroundEnabled = false,
  getCycleElapsedMs,
  getSessionRemainingMs,
}: UseBreathingHapticsParams): void {
  // One engine instance per mount (stable, created once).
  const [engine] = useState(() => new HapticEngine());

  // Latest inputs, read from the (stable) AppState listener without re-subscribing.
  const stateRef = useRef({
    enabled,
    intensity,
    config,
    phaseIndex,
    backgroundEnabled,
    getCycleElapsedMs,
    getSessionRemainingMs,
  });
  useEffect(() => {
    stateRef.current = {
      enabled,
      intensity,
      config,
      phaseIndex,
      backgroundEnabled,
      getCycleElapsedMs,
      getSessionRemainingMs,
    };
  });

  useEffect(() => {
    if (!enabled) {
      engine.stop();
      return;
    }
    const phase = PHASE_TO_HAPTIC[phaseIndex];
    if (!phase) return;
    engine.play(phase, phaseDurationMs(phaseIndex, config), intensity);
  }, [engine, enabled, phaseIndex, config, intensity]);

  // Keep guidance going across background/foreground transitions.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const s = stateRef.current;
      if (next === 'background') {
        // Hand the upcoming timeline to the OS vibrator so it plays while the
        // JS/animation loop is suspended (Android only; iOS is a no-op).
        console.log(
          '[LB-DIAG] haptics background:',
          'enabled=', s.enabled,
          'backgroundEnabled=', s.backgroundEnabled,
        );
        if (!s.enabled || !s.backgroundEnabled) return;
        const cycleElapsed = s.getCycleElapsedMs?.() ?? 0;
        const offsetIntoPhaseMs = Math.max(0, cycleElapsed - phaseStartMs(s.phaseIndex, s.config));
        const remaining = s.getSessionRemainingMs?.() ?? null;
        console.log('[LB-DIAG] playBackground scheduling, remaining=', remaining);
        engine.playBackground({
          config: s.config,
          intensity: s.intensity,
          phaseIndex: s.phaseIndex,
          offsetIntoPhaseMs,
          windowMs: remaining ?? undefined,
        });
      } else if (next === 'active') {
        // Cancel the pre-scheduled background waveform; the live per-phase engine
        // resumes on the next phase change (advanceBy fast-forwards it on return).
        engine.stop();
      }
    });
    return () => sub.remove();
  }, [engine]);

  // Always silence vibration when the component goes away.
  useEffect(() => () => engine.stop(), [engine]);
}
