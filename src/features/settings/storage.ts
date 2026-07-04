import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_BACKGROUND_ENABLED,
  DEFAULT_DURATIONS,
  DEFAULT_HAPTIC_INTENSITY,
  DEFAULT_HAPTICS_ENABLED,
  DEFAULT_PRACTICE,
  DEFAULT_SESSION,
  DEFAULT_SOUND_ENABLED,
  defaultThemePreference,
  DURATION_LIMITS,
  HOLD_DURATION_MIN,
  PRACTICE_OPTIONS,
  SESSION_LIMITS,
  SETTINGS_STORAGE_KEY,
} from './constants';
import type { BreathingPractice, HapticIntensity, PersistedSettings } from './types';

function makeDefaults(): PersistedSettings {
  return {
    durations: DEFAULT_DURATIONS,
    hapticsEnabled: DEFAULT_HAPTICS_ENABLED,
    hapticIntensity: DEFAULT_HAPTIC_INTENSITY,
    soundEnabled: DEFAULT_SOUND_ENABLED,
    session: DEFAULT_SESSION,
    themePreference: defaultThemePreference(),
    backgroundEnabled: DEFAULT_BACKGROUND_ENABLED,
    practice: DEFAULT_PRACTICE,
  };
}

const INTENSITIES: HapticIntensity[] = ['gentle', 'medium', 'strong'];
const PRACTICES = PRACTICE_OPTIONS.map((o) => o.value);

/** Clamp a duration (seconds) into [min, max]. Holds allow 0, inhale/exhale ≥ 1. */
function clampDuration(value: number, min: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(DURATION_LIMITS.max, Math.max(min, Math.round(value)));
}

/** Clamp an integer into [min, max], falling back to `dflt` if not a number. */
function clampInt(value: unknown, min: number, max: number, dflt: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return dflt;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function bool(value: unknown, dflt: boolean): boolean {
  return typeof value === 'boolean' ? value : dflt;
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Parse + validate a stored (flat) blob into safe settings. Every field falls
 * back to its default, so older/partial data (e.g. before holdOutSec, sound, or
 * session settings existed) migrates forward cleanly.
 */
function normalize(raw: unknown): PersistedSettings | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const base = ['inhaleSec', 'holdSec', 'exhaleSec'] as const;
  if (!base.every((k) => typeof r[k] === 'number')) return null;

  return {
    themePreference: r.themePreference === 'dark' ? 'dark' : r.themePreference === 'light' ? 'light' : defaultThemePreference(),
    backgroundEnabled: bool(r.backgroundEnabled, DEFAULT_BACKGROUND_ENABLED),
    practice: PRACTICES.includes(r.practice as BreathingPractice)
      ? (r.practice as BreathingPractice)
      : DEFAULT_PRACTICE,
    durations: {
      inhaleSec: clampDuration(r.inhaleSec as number, DURATION_LIMITS.min),
      holdSec: clampDuration(r.holdSec as number, HOLD_DURATION_MIN),
      exhaleSec: clampDuration(r.exhaleSec as number, DURATION_LIMITS.min),
      holdOutSec: clampDuration(num(r.holdOutSec, DEFAULT_DURATIONS.holdOutSec), HOLD_DURATION_MIN),
    },
    hapticsEnabled: bool(r.hapticsEnabled, DEFAULT_HAPTICS_ENABLED),
    hapticIntensity: INTENSITIES.includes(r.hapticIntensity as HapticIntensity)
      ? (r.hapticIntensity as HapticIntensity)
      : DEFAULT_HAPTIC_INTENSITY,
    soundEnabled: bool(r.soundEnabled, DEFAULT_SOUND_ENABLED),
    session: {
      mode: r.sessionMode === 'duration' ? 'duration' : 'cycles',
      cycleCount: clampInt(
        r.cycleCount,
        SESSION_LIMITS.cycles.min,
        SESSION_LIMITS.cycles.max,
        DEFAULT_SESSION.cycleCount,
      ),
      cyclesInfinite: bool(r.cyclesInfinite, DEFAULT_SESSION.cyclesInfinite),
      sessionMinutes: clampInt(
        r.sessionMinutes,
        SESSION_LIMITS.minutes.min,
        SESSION_LIMITS.minutes.max,
        DEFAULT_SESSION.sessionMinutes,
      ),
      durationInfinite: bool(r.durationInfinite, DEFAULT_SESSION.durationInfinite),
    },
  };
}

/** Serialize flat so all fields sit at the top level (easy to migrate). */
function serialize(s: PersistedSettings): string {
  return JSON.stringify({
    ...s.durations,
    hapticsEnabled: s.hapticsEnabled,
    hapticIntensity: s.hapticIntensity,
    soundEnabled: s.soundEnabled,
    sessionMode: s.session.mode,
    cycleCount: s.session.cycleCount,
    cyclesInfinite: s.session.cyclesInfinite,
    sessionMinutes: s.session.sessionMinutes,
    durationInfinite: s.session.durationInfinite,
    themePreference: s.themePreference,
    backgroundEnabled: s.backgroundEnabled,
    practice: s.practice,
  });
}

/** Load persisted settings, falling back to defaults if missing/corrupt. */
export async function loadSettings(): Promise<PersistedSettings> {
  const defaults = makeDefaults();
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    return normalize(JSON.parse(raw)) ?? defaults;
  } catch {
    return defaults;
  }
}

/** Persist settings. Swallows errors — a failed write shouldn't crash the UI. */
export async function saveSettings(settings: PersistedSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, serialize(settings));
  } catch {
    // no-op
  }
}
