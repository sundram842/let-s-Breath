import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_BACKGROUND_ENABLED,
  DEFAULT_CUSTOM_PRACTICES,
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
import { isCustomPracticeId } from './utils/practices';
import type {
  BreathingPractice,
  CustomPractice,
  HapticIntensity,
  PersistedSettings,
  PracticeId,
} from './types';

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
    customPractices: DEFAULT_CUSTOM_PRACTICES,
  };
}

const INTENSITIES: HapticIntensity[] = ['gentle', 'medium', 'strong'];
const BUILT_IN_PRACTICES = PRACTICE_OPTIONS.map((o) => o.value);

/** Parse a stored custom-practice array, dropping any malformed entries. */
function normalizeCustomPractices(raw: unknown): CustomPractice[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomPractice[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.name !== 'string') continue;
    const d = (typeof r.durations === 'object' && r.durations !== null
      ? r.durations
      : {}) as Record<string, unknown>;
    out.push({
      id: r.id,
      name: r.name,
      durations: {
        inhaleSec: clampDuration(num(d.inhaleSec, DEFAULT_DURATIONS.inhaleSec), DURATION_LIMITS.min),
        holdSec: clampDuration(num(d.holdSec, DEFAULT_DURATIONS.holdSec), HOLD_DURATION_MIN),
        exhaleSec: clampDuration(num(d.exhaleSec, DEFAULT_DURATIONS.exhaleSec), DURATION_LIMITS.min),
        holdOutSec: clampDuration(num(d.holdOutSec, DEFAULT_DURATIONS.holdOutSec), HOLD_DURATION_MIN),
      },
    });
  }
  return out;
}

/** Resolve a stored selection to a valid one: a built-in key, or a custom id
 * that still exists. Falls back to the default practice otherwise. */
function normalizePractice(raw: unknown, customPractices: CustomPractice[]): PracticeId {
  if (BUILT_IN_PRACTICES.includes(raw as BreathingPractice)) return raw as BreathingPractice;
  if (isCustomPracticeId(raw) && customPractices.some((p) => p.id === raw)) {
    return raw as string;
  }
  return DEFAULT_PRACTICE;
}

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

  const customPractices = normalizeCustomPractices(r.customPractices);

  return {
    themePreference: r.themePreference === 'dark' ? 'dark' : r.themePreference === 'light' ? 'light' : defaultThemePreference(),
    backgroundEnabled: bool(r.backgroundEnabled, DEFAULT_BACKGROUND_ENABLED),
    practice: normalizePractice(r.practice, customPractices),
    customPractices,
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
    customPractices: s.customPractices,
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
