import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * The four haptic signatures, one per breathing phase. Kept distinct so a user
 * can recognize the current phase by touch alone, eyes closed.
 */
export type HapticPhase = 'inhale' | 'holdFull' | 'exhale' | 'holdEmpty';

/**
 * All tunable pattern values live here — adjust these to reshape the feel
 * without touching the engine logic. Durations are milliseconds.
 */
export const HAPTIC_PATTERN = {
  /** Inhale: gentle metronome pulses (~500ms rhythm) for the whole phase. */
  inhale: { pulseMs: 70, gapMs: 430 },
  /** Full hold: one short confirmation pulse, then silence. */
  holdFull: { pulseMs: 120 },
  /** Exhale: one long continuous vibration lasting this fraction of the phase. */
  exhale: { fraction: 0.75 },
  /** Empty hold: two light "get ready" taps, landing near the phase end. */
  holdEmpty: { pulseMs: 60, gapMs: 120, leadMs: 260 },
  /** iOS-only: spacing between Taptic impacts when simulating a sustained phase. */
  ios: { impactIntervalMs: 500 },
} as const;

// iOS intensity ramps map the "amplitude increases on inhale / decreases on
// exhale" idea onto the Taptic Engine via impact styles.
const INHALE_RAMP: Haptics.ImpactFeedbackStyle[] = [
  Haptics.ImpactFeedbackStyle.Soft,
  Haptics.ImpactFeedbackStyle.Light,
  Haptics.ImpactFeedbackStyle.Medium,
  Haptics.ImpactFeedbackStyle.Heavy,
];
const EXHALE_RAMP: Haptics.ImpactFeedbackStyle[] = [...INHALE_RAMP].reverse();

/**
 * Fires phase-specific vibration patterns and cancels cleanly on phase change,
 * disable, or unmount.
 *
 * - Android: real waveforms via RN `Vibration` (backed by
 *   `VibrationEffect.createWaveform` / `createOneShot` on API 26+).
 * - iOS: the Taptic Engine via `expo-haptics`; sustained phases are simulated
 *   with a ramp of impacts (intensity conveys inhale↑ / exhale↓).
 *
 * True per-step amplitude waveforms + `hasAmplitudeControl()` require a custom
 * native module (a dev build); this engine is the standard-pattern fallback the
 * spec calls for, and the Android branch is the seam where such a module drops in.
 */
export class HapticEngine {
  private timers: ReturnType<typeof setTimeout>[] = [];

  /** Cancel any in-flight pattern (timers + native vibration). */
  stop(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    Vibration.cancel();
  }

  /** Start the pattern for `phase`, sized to the phase's `durationMs`. */
  play(phase: HapticPhase, durationMs: number): void {
    this.stop();
    if (Platform.OS === 'android') this.playAndroid(phase, durationMs);
    else this.playIOS(phase, durationMs);
  }

  // --- Android: waveform patterns -------------------------------------------

  private playAndroid(phase: HapticPhase, durationMs: number): void {
    switch (phase) {
      case 'inhale': {
        const { pulseMs, gapMs } = HAPTIC_PATTERN.inhale;
        const pulses = Math.max(1, Math.round(durationMs / (pulseMs + gapMs)));
        // RN pattern = [initialWait, vibrate, wait, vibrate, ...]
        const pattern = [0];
        for (let i = 0; i < pulses; i++) pattern.push(pulseMs, gapMs);
        Vibration.vibrate(pattern, false);
        break;
      }
      case 'holdFull':
        Vibration.vibrate(HAPTIC_PATTERN.holdFull.pulseMs);
        break;
      case 'exhale':
        Vibration.vibrate(Math.round(durationMs * HAPTIC_PATTERN.exhale.fraction));
        break;
      case 'holdEmpty': {
        const { pulseMs, gapMs, leadMs } = HAPTIC_PATTERN.holdEmpty;
        // Delay the taps so they land just before the next inhale.
        const wait = Math.max(0, durationMs - leadMs);
        Vibration.vibrate([wait, pulseMs, gapMs, pulseMs], false);
        break;
      }
    }
  }

  // --- iOS: Taptic Engine ----------------------------------------------------

  private playIOS(phase: HapticPhase, durationMs: number): void {
    switch (phase) {
      case 'inhale':
        this.rampImpacts(durationMs, INHALE_RAMP);
        break;
      case 'holdFull':
        this.impact(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'exhale':
        this.rampImpacts(
          Math.round(durationMs * HAPTIC_PATTERN.exhale.fraction),
          EXHALE_RAMP,
        );
        break;
      case 'holdEmpty': {
        const { pulseMs, gapMs, leadMs } = HAPTIC_PATTERN.holdEmpty;
        const wait = Math.max(0, durationMs - leadMs);
        this.schedule(wait, () => this.impact(Haptics.ImpactFeedbackStyle.Light));
        this.schedule(wait + pulseMs + gapMs, () =>
          this.impact(Haptics.ImpactFeedbackStyle.Light),
        );
        break;
      }
    }
  }

  /** Emit impacts evenly across `durationMs`, stepping through `ramp` styles. */
  private rampImpacts(durationMs: number, ramp: Haptics.ImpactFeedbackStyle[]): void {
    const count = Math.max(1, Math.round(durationMs / HAPTIC_PATTERN.ios.impactIntervalMs));
    for (let i = 0; i < count; i++) {
      const frac = count === 1 ? 0 : i / (count - 1);
      const style = ramp[Math.min(ramp.length - 1, Math.floor(frac * ramp.length))];
      this.schedule(i * HAPTIC_PATTERN.ios.impactIntervalMs, () => this.impact(style));
    }
  }

  private schedule(delayMs: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, delayMs));
  }

  private impact(style: Haptics.ImpactFeedbackStyle): void {
    Haptics.impactAsync(style).catch(() => {});
  }
}
