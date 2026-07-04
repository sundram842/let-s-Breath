import { useEffect, useState } from 'react';

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

export interface UseBreathingHapticsParams {
  /** Current phase index (0-3), same value that drives the ring animation. */
  phaseIndex: number;
  /** The active durations, so each phase's pattern is sized correctly. */
  config: BreathingConfig;
  /** Master switch (setting ON + screen focused). */
  enabled: boolean;
}

/**
 * Plays the matching haptic pattern at the start of every breathing phase,
 * automatically adapting to the configured durations. Because `phaseIndex`
 * comes from the same timeline as the ring, the vibration stays in sync with
 * the animation. Cancels cleanly when disabled, on phase change, or on unmount.
 */
export function useBreathingHaptics({
  phaseIndex,
  config,
  enabled,
}: UseBreathingHapticsParams): void {
  // One engine instance per mount (stable, created once).
  const [engine] = useState(() => new HapticEngine());

  useEffect(() => {
    if (!enabled) {
      engine.stop();
      return;
    }
    const phase = PHASE_TO_HAPTIC[phaseIndex];
    if (!phase) return;
    engine.play(phase, phaseDurationMs(phaseIndex, config));
  }, [engine, enabled, phaseIndex, config]);

  // Always silence vibration when the component goes away.
  useEffect(() => () => engine.stop(), [engine]);
}
