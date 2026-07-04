/** The visible state of a breath. Both "hold" phases share this label. */
export type BreathingPhase = 'inhale' | 'hold' | 'exhale';

/** Fully configurable timing for one breath cycle (in milliseconds). */
export interface BreathingConfig {
  /** Ring grows empty → full. */
  inhaleMs: number;
  /** Ring stays full. */
  holdInMs: number;
  /** Ring shrinks full → empty. */
  exhaleMs: number;
  /** Ring stays empty. */
  holdOutMs: number;
}
