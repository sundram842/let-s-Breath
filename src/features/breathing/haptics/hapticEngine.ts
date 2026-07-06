import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { HapticIntensity } from '@/features/settings';
import type { BreathingConfig } from '../types';

/**
 * The four haptic signatures, one per breathing phase. Kept distinct so a user
 * can recognize the current phase by touch alone, eyes closed.
 */
export type HapticPhase = 'inhale' | 'holdFull' | 'exhale' | 'holdEmpty';

type Style = Haptics.ImpactFeedbackStyle;
const S = Haptics.ImpactFeedbackStyle;

/**
 * Per-intensity profile.
 * - iOS: which Taptic impact styles to use (real strength control).
 * - Android: a multiplier on pulse *length* — the only "strength" lever RN
 *   Vibration exposes (true amplitude needs a native module + dev build).
 */
interface IntensityProfile {
  androidPulseScale: number;
  single: Style; // full-hold confirmation
  tap: Style; // empty-hold "get ready" taps
  inhaleRamp: Style[]; // increasing
  exhaleRamp: Style[]; // decreasing
}

const INTENSITY_PROFILE: Record<HapticIntensity, IntensityProfile> = {
  gentle: {
    androidPulseScale: 0.6,
    single: S.Light,
    tap: S.Soft,
    inhaleRamp: [S.Soft, S.Light],
    exhaleRamp: [S.Light, S.Soft],
  },
  medium: {
    androidPulseScale: 1,
    single: S.Medium,
    tap: S.Light,
    inhaleRamp: [S.Soft, S.Light, S.Medium],
    exhaleRamp: [S.Medium, S.Light, S.Soft],
  },
  strong: {
    androidPulseScale: 1.6,
    single: S.Heavy,
    tap: S.Medium,
    inhaleRamp: [S.Medium, S.Heavy, S.Rigid],
    exhaleRamp: [S.Rigid, S.Heavy, S.Medium],
  },
};

/**
 * All tunable pattern values live here — adjust these to reshape the feel
 * without touching the engine logic. Durations are milliseconds.
 */
export const HAPTIC_PATTERN = {
  /** Inhale: gentle metronome pulses (~500ms rhythm) for the whole phase. */
  inhale: { pulseMs: 70, gapMs: 430 },
  /** Full hold: one short confirmation pulse, then silence. */
  holdFull: { pulseMs: 120 },
  /**
   * Exhale: soft, well-spaced pulses that gently fade out — calm and
   * meditative, never a continuous buzz. The pulse count adapts to the
   * exhale duration (~1 pulse per 860ms → ~5 for 4s, ~7 for 6s, ~12 for 10s).
   */
  exhale: { pulseMs: 60, gapMs: 800 },
  /** Empty hold: two light "get ready" taps, landing near the phase end. */
  holdEmpty: { pulseMs: 60, gapMs: 120, leadMs: 260 },
} as const;

/** Full cadence (one pulse + its trailing pause) of a pulse pattern. */
function period(p: { pulseMs: number; gapMs: number }): number {
  return p.pulseMs + p.gapMs;
}

/**
 * Default cap for a pre-scheduled background pattern. A backgrounded session
 * keeps buzzing for at most this long even if the OS never wakes us to reschedule
 * — a battery/runaway backstop. The real window is usually the session's own
 * remaining time (passed by the caller), whichever is shorter.
 */
export const BACKGROUND_WINDOW_MS = 5 * 60_000;

/** Phase durations (ms) as a 4-tuple, indexed 0-3 (inhale, holdFull, exhale, holdEmpty). */
function phaseDurations(config: BreathingConfig): [number, number, number, number] {
  return [config.inhaleMs, config.holdInMs, config.exhaleMs, config.holdOutMs];
}

/**
 * Pulse onsets (ms, relative to the phase start) + durations for one phase,
 * mirroring the Android per-phase patterns so a stitched-together background
 * timeline feels identical to the live one. Pulse length is scaled by intensity.
 */
function phasePulses(
  phaseIndex: number,
  durationMs: number,
  scale: number,
): { at: number; durMs: number }[] {
  if (durationMs <= 0) return [];
  switch (phaseIndex) {
    case 0: {
      const { pulseMs, gapMs } = HAPTIC_PATTERN.inhale;
      const step = pulseMs + gapMs;
      const count = Math.max(1, Math.round(durationMs / step));
      const durMs = Math.round(pulseMs * scale);
      return Array.from({ length: count }, (_, i) => ({ at: i * step, durMs }));
    }
    case 1:
      return [{ at: 0, durMs: Math.round(HAPTIC_PATTERN.holdFull.pulseMs * scale) }];
    case 2: {
      const { pulseMs, gapMs } = HAPTIC_PATTERN.exhale;
      const step = pulseMs + gapMs;
      const count = Math.max(1, Math.round(durationMs / step));
      const durMs = Math.round(pulseMs * scale);
      return Array.from({ length: count }, (_, i) => ({ at: i * step, durMs }));
    }
    case 3: {
      const { pulseMs, gapMs, leadMs } = HAPTIC_PATTERN.holdEmpty;
      const durMs = Math.round(pulseMs * scale);
      const wait = Math.max(0, durationMs - leadMs);
      return [
        { at: wait, durMs },
        { at: wait + pulseMs + gapMs, durMs },
      ];
    }
    default:
      return [];
  }
}

/**
 * Fires phase-specific vibration patterns and cancels cleanly on phase change,
 * disable, or unmount.
 *
 * - Android: real waveforms via RN `Vibration` (backed by
 *   `VibrationEffect.createWaveform` / `createOneShot` on API 26+). Strength is
 *   approximated by scaling pulse length (RN exposes no amplitude API).
 * - iOS: the Taptic Engine via `expo-haptics`; the intensity setting picks the
 *   impact styles, and sustained phases ramp them (inhale↑ / exhale↓).
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

  /** Start the pattern for `phase`, sized to `durationMs`, at `intensity`. */
  play(phase: HapticPhase, durationMs: number, intensity: HapticIntensity): void {
    this.stop();
    const profile = INTENSITY_PROFILE[intensity];
    if (Platform.OS === 'android') this.playAndroid(phase, durationMs, profile);
    else this.playIOS(phase, durationMs, profile);
  }

  /**
   * Pre-schedule a phase-synced vibration timeline that keeps playing after the
   * app is backgrounded and the JS/animation loop is suspended.
   *
   * How it works: RN `Vibration.vibrate(pattern)` hands the *entire* waveform to
   * the Android system Vibrator, which plays it to completion independently of
   * the JS thread — so a single call spanning several upcoming cycles survives
   * the app being backgrounded. We stitch each future phase's pulses into one
   * pattern, starting from the current position (`phaseIndex` + `offsetIntoPhaseMs`).
   *
   * iOS is intentionally a no-op: the Taptic Engine cannot fire while the app is
   * suspended, and there is no background entitlement for it — so there is
   * nothing to schedule. Foreground haptics resume automatically on return.
   *
   * @param windowMs How far ahead to schedule (clamped to BACKGROUND_WINDOW_MS).
   *                 Pass the session's remaining time so buzzing stops when the
   *                 session would have ended while backgrounded.
   */
  playBackground(params: {
    config: BreathingConfig;
    intensity: HapticIntensity;
    phaseIndex: number;
    offsetIntoPhaseMs: number;
    windowMs?: number;
  }): void {
    this.stop();
    // Only Android can vibrate while suspended (see the doc comment above).
    if (Platform.OS !== 'android') return;

    const { config, intensity, phaseIndex, offsetIntoPhaseMs } = params;
    const durs = phaseDurations(config);
    const cycleMs = durs[0] + durs[1] + durs[2] + durs[3];
    if (cycleMs <= 0) return;

    const window = Math.max(0, Math.min(params.windowMs ?? BACKGROUND_WINDOW_MS, BACKGROUND_WINDOW_MS));
    if (window <= 0) return;

    const scale = INTENSITY_PROFILE[intensity].androidPulseScale;

    // Walk phases forward from the current one, laying each phase's pulses onto
    // an absolute timeline. `phaseStart` is negative for the current phase to
    // account for the part of it that has already elapsed.
    const events: { at: number; durMs: number }[] = [];
    let idx = phaseIndex % 4;
    let phaseStart = -Math.max(0, offsetIntoPhaseMs);
    // One full cycle always advances the clock by cycleMs (> 0), so this ends.
    while (phaseStart < window) {
      const dur = durs[idx];
      for (const p of phasePulses(idx, dur, scale)) {
        const at = phaseStart + p.at;
        if (at >= 0 && at < window) events.push({ at, durMs: p.durMs });
      }
      phaseStart += dur;
      idx = (idx + 1) % 4;
    }
    if (events.length === 0) return;

    // Convert absolute onsets → an RN pattern [wait, on, wait, on, ...]. Element
    // 0 is a wait, so parity is preserved by always pushing (gap, pulse) pairs.
    const pattern: number[] = [];
    let cursor = 0;
    for (const ev of events) {
      pattern.push(Math.max(0, Math.round(ev.at - cursor)), ev.durMs);
      cursor = ev.at + ev.durMs;
    }
    Vibration.vibrate(pattern, false);
  }

  // --- Android: waveform patterns -------------------------------------------

  private playAndroid(phase: HapticPhase, durationMs: number, profile: IntensityProfile): void {
    const scale = profile.androidPulseScale;
    switch (phase) {
      case 'inhale': {
        const { pulseMs, gapMs } = HAPTIC_PATTERN.inhale;
        const pulse = Math.round(pulseMs * scale);
        const pulses = Math.max(1, Math.round(durationMs / (pulseMs + gapMs)));
        // RN pattern = [initialWait, vibrate, wait, vibrate, ...]
        const pattern = [0];
        for (let i = 0; i < pulses; i++) pattern.push(pulse, gapMs);
        Vibration.vibrate(pattern, false);
        break;
      }
      case 'holdFull':
        Vibration.vibrate(Math.round(HAPTIC_PATTERN.holdFull.pulseMs * scale));
        break;
      case 'exhale': {
        // Soft rhythmic pulses (not a continuous buzz). Uniform strength —
        // RN Vibration exposes no amplitude control, so no per-pulse fade here.
        const { pulseMs, gapMs } = HAPTIC_PATTERN.exhale;
        const pulse = Math.round(pulseMs * scale);
        const pulses = Math.max(1, Math.round(durationMs / (pulseMs + gapMs)));
        const pattern = [0];
        for (let i = 0; i < pulses; i++) pattern.push(pulse, gapMs);
        Vibration.vibrate(pattern, false);
        break;
      }
      case 'holdEmpty': {
        const { pulseMs, gapMs, leadMs } = HAPTIC_PATTERN.holdEmpty;
        const pulse = Math.round(pulseMs * scale);
        // Delay the taps so they land just before the next inhale.
        const wait = Math.max(0, durationMs - leadMs);
        Vibration.vibrate([wait, pulse, gapMs, pulse], false);
        break;
      }
    }
  }

  // --- iOS: Taptic Engine ----------------------------------------------------

  private playIOS(phase: HapticPhase, durationMs: number, profile: IntensityProfile): void {
    switch (phase) {
      case 'inhale':
        this.rampImpacts(durationMs, profile.inhaleRamp, period(HAPTIC_PATTERN.inhale));
        break;
      case 'holdFull':
        this.impact(profile.single);
        break;
      case 'exhale':
        // Soft, well-spaced taps that fade out (descending impact styles).
        this.rampImpacts(durationMs, profile.exhaleRamp, period(HAPTIC_PATTERN.exhale));
        break;
      case 'holdEmpty': {
        const { pulseMs, gapMs, leadMs } = HAPTIC_PATTERN.holdEmpty;
        const wait = Math.max(0, durationMs - leadMs);
        this.schedule(wait, () => this.impact(profile.tap));
        this.schedule(wait + pulseMs + gapMs, () => this.impact(profile.tap));
        break;
      }
    }
  }

  /** Emit impacts every `intervalMs` across `durationMs`, stepping the ramp. */
  private rampImpacts(durationMs: number, ramp: Style[], intervalMs: number): void {
    const count = Math.max(1, Math.round(durationMs / intervalMs));
    for (let i = 0; i < count; i++) {
      const frac = count === 1 ? 0 : i / (count - 1);
      const style = ramp[Math.min(ramp.length - 1, Math.floor(frac * ramp.length))];
      this.schedule(i * intervalMs, () => this.impact(style));
    }
  }

  private schedule(delayMs: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, delayMs));
  }

  private impact(style: Style): void {
    Haptics.impactAsync(style).catch(() => {});
  }
}
