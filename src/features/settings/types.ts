/** Breathing phase durations, in whole seconds, as edited in Settings. */
export interface BreathingDurations {
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
}

export type DurationKey = keyof BreathingDurations;

/** How strong the haptic guidance feels. */
export type HapticIntensity = 'gentle' | 'medium' | 'strong';

/** Everything persisted for the breathing experience. */
export interface PersistedSettings {
  durations: BreathingDurations;
  /** Haptic (vibration) guidance toggle. */
  hapticsEnabled: boolean;
  /** Strength of the haptic guidance. */
  hapticIntensity: HapticIntensity;
}
