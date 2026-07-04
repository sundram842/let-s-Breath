import type { BreathingDurations } from './types';

/** Slider range shared by all three duration controls. */
export const DURATION_LIMITS = {
  /** 1 second. */
  min: 1,
  /** 20 minutes. */
  max: 20 * 60,
  step: 1,
} as const;

/** Sensible starting point when nothing is stored yet (4-4-4 box breathing). */
export const DEFAULT_DURATIONS: BreathingDurations = {
  inhaleSec: 4,
  holdSec: 4,
  exhaleSec: 4,
};

/** AsyncStorage key. Versioned so the shape can evolve safely later. */
export const SETTINGS_STORAGE_KEY = 'letbreath.durations.v1';
