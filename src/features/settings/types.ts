/** Breathing phase durations, in whole seconds, as edited in Settings. */
export interface BreathingDurations {
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
}

export type DurationKey = keyof BreathingDurations;
