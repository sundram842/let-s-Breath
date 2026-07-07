import { Appearance } from 'react-native';

import type {
  BreathingDurations,
  BreathingPractice,
  CustomPractice,
  HapticIntensity,
  SessionConfig,
  ThemePreference,
} from './types';

/** Slider range shared by all duration controls. */
export const DURATION_LIMITS = {
  /** 1 second (inhale / exhale). */
  min: 1,
  /** 20 minutes. */
  max: 20 * 60,
  step: 1,
} as const;

/** Holds may be 0 (skipped) — e.g. Physiological Sigh, Resonance, 4-7-8. */
export const HOLD_DURATION_MIN = 0;

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

/** Default practice: fully manual. */
export const DEFAULT_PRACTICE: BreathingPractice = 'custom';

/** No user-created practices until the user adds one. */
export const DEFAULT_CUSTOM_PRACTICES: CustomPractice[] = [];

/**
 * Durations (seconds) for each preset. Physiological Sigh's 3s+1s double inhale
 * is approximated as a single 4s inhale; Alternate Nostril is approximated by
 * timing only (single channel).
 */
export const PRESET_DURATIONS: Record<
  Exclude<BreathingPractice, 'custom'>,
  BreathingDurations
> = {
  quickCalm: { inhaleSec: 4, holdSec: 0, exhaleSec: 6, holdOutSec: 0 },
  dailyBalance: { inhaleSec: 5, holdSec: 0, exhaleSec: 5, holdOutSec: 0 },
  focusMode: { inhaleSec: 4, holdSec: 4, exhaleSec: 4, holdOutSec: 4 },
  sleepPrep: { inhaleSec: 4, holdSec: 7, exhaleSec: 8, holdOutSec: 0 },
  mindful: { inhaleSec: 4, holdSec: 2, exhaleSec: 4, holdOutSec: 2 },
};

/** Built-in dropdown entries, in display order (manual "Custom" comes last). */
export const PRACTICE_OPTIONS: {
  value: BreathingPractice;
  label: string;
  technique: string;
}[] = [
  { value: 'quickCalm', label: 'Quick Calm', technique: 'Physiological Sigh' },
  { value: 'dailyBalance', label: 'Daily Balance', technique: 'Resonance Breathing' },
  { value: 'focusMode', label: 'Focus Mode', technique: 'Box Breathing' },
  { value: 'sleepPrep', label: 'Sleep Preparation', technique: '4-7-8 Breathing' },
  { value: 'mindful', label: 'Mindful Meditation', technique: 'Alternate Nostril' },
  { value: 'custom', label: 'Custom', technique: 'Your own timings' },
];

/** AsyncStorage key. Versioned so the shape can evolve safely later. */
export const SETTINGS_STORAGE_KEY = 'letbreath.durations.v1';
