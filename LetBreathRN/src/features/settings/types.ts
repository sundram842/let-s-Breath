/** Breathing phase durations, in whole seconds, as edited in Settings. */
export interface BreathingDurations {
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
  /** Hold after exhale (lungs empty). */
  holdOutSec: number;
}

export type DurationKey = keyof BreathingDurations;

/** How strong the haptic guidance feels. */
export type HapticIntensity = 'gentle' | 'medium' | 'strong';

/** App appearance. */
export type ThemePreference = 'light' | 'dark';

/** A guided breathing practice preset ("custom" = user-configured). */
export type BreathingPractice =
  | 'custom'
  | 'quickCalm'
  | 'dailyBalance'
  | 'focusMode'
  | 'sleepPrep'
  | 'mindful';

/** How a session ends: after a number of cycles, or after a length of time. */
export type SessionMode = 'cycles' | 'duration';

/** Everything controlling when a session stops. */
export interface SessionConfig {
  mode: SessionMode;
  /** Cycles to complete (when mode = cycles and not infinite). */
  cycleCount: number;
  /** Run forever in cycle mode until manually stopped. */
  cyclesInfinite: boolean;
  /** Minutes to practice (when mode = duration and not infinite). */
  sessionMinutes: number;
  /** Run forever in duration mode until manually stopped. */
  durationInfinite: boolean;
}

/** Everything persisted for the breathing experience. */
export interface PersistedSettings {
  durations: BreathingDurations;
  /** Haptic (vibration) guidance toggle. */
  hapticsEnabled: boolean;
  /** Strength of the haptic guidance. */
  hapticIntensity: HapticIntensity;
  /** Voice / sound guidance toggle. */
  soundEnabled: boolean;
  /** How the session ends. */
  session: SessionConfig;
  /** Light or dark appearance. */
  themePreference: ThemePreference;
  /** Keep the session running while the app is backgrounded. */
  backgroundEnabled: boolean;
  /** Selected breathing practice preset. */
  practice: BreathingPractice;
}
