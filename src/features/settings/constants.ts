import type { BreathingDurations, HapticIntensity } from './types';

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

/** Haptic guidance is opt-in. */
export const DEFAULT_HAPTICS_ENABLED = false;

/** Default haptic strength. */
export const DEFAULT_HAPTIC_INTENSITY: HapticIntensity = 'medium';

/** Selectable intensity levels, in display order. */
export const HAPTIC_INTENSITY_OPTIONS: { value: HapticIntensity; label: string }[] = [
  { value: 'gentle', label: 'Gentle' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
];

/** AsyncStorage key. Versioned so the shape can evolve safely later. */
export const SETTINGS_STORAGE_KEY = 'letbreath.durations.v1';
