import type { BreathingConfig, BreathingPhase } from './types';

/**
 * Default breathing rhythm. Tweak or pass a custom config into
 * `useBreathingAnimation` / `<BreathingCircle config={...} />`.
 * 4s inhale · 1s hold · 4s exhale · 1s hold — a calm 10s cycle.
 */
export const BREATHING_CONFIG: BreathingConfig = {
  inhaleMs: 4000,
  holdInMs: 1000,
  exhaleMs: 4000,
  holdOutMs: 1000,
};

/** Geometry + type scale expressed as ratios of the circle size (responsive). */
export const RING = {
  /** Circle diameter as a fraction of the screen's shorter side. */
  sizeRatio: 0.78,
  /** Upper bound so it doesn't get huge on tablets. */
  maxSize: 360,
  /** Stroke width relative to the circle size (thick, per the design). */
  strokeRatio: 0.035,
  /** "Inhale" font size relative to circle size. */
  titleRatio: 0.13,
  /** "N cycles left" font size relative to circle size. */
  subtitleRatio: 0.045,
  /** Subtitle distance from the circle's bottom, relative to size. */
  subtitleBottomRatio: 0.16,
} as const;

/** Phase → display label shown in the center of the circle. */
export const PHASE_LABELS: Record<BreathingPhase, string> = {
  inhale: 'Inhale',
  hold: 'Hold',
  exhale: 'Exhale',
};

/** Order of phases within one cycle (index 1 & 3 are both "hold"). */
export const PHASE_SEQUENCE: readonly BreathingPhase[] = [
  'inhale',
  'hold',
  'exhale',
  'hold',
] as const;

export const DEFAULT_TOTAL_CYCLES = 10;
