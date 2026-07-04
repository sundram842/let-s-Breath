import { Appearance } from 'react-native';

import type {
  BreathingDurations,
  HapticIntensity,
  SessionConfig,
  ThemePreference,
} from './types';

/** Slider range shared by all three duration controls. */
export const DURATION_LIMITS = {
  /** 1 second. */
  min: 1,
  /** 20 minutes. */
  max: 20 * 60,
  step: 1,
} as const;

/** Sensible starting point when nothing is stored yet (4-4-4-4 box breathing). */
export const DEFAULT_DURATIONS: BreathingDurations = {
  inhaleSec: 4,
  holdSec: 4,
  exhaleSec: 4,
  holdOutSec: 4,
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

/** Sound / voice guidance is on by default. */
export const DEFAULT_SOUND_ENABLED = true;

/** Finite bounds for the session controls ("Infinite" is a separate toggle). */
export const SESSION_LIMITS = {
  cycles: { min: 1, max: 99 },
  minutes: { min: 1, max: 120 },
} as const;

/** Default: stop after 10 cycles. */
export const DEFAULT_SESSION: SessionConfig = {
  mode: 'cycles',
  cycleCount: 10,
  cyclesInfinite: false,
  sessionMinutes: 5,
  durationInfinite: false,
};

/** First-run appearance follows the device; explicit once the user chooses. */
export function defaultThemePreference(): ThemePreference {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

/** Background practice is opt-in. */
export const DEFAULT_BACKGROUND_ENABLED = false;

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** AsyncStorage key. Versioned so the shape can evolve safely later. */
export const SETTINGS_STORAGE_KEY = 'letbreath.durations.v1';
