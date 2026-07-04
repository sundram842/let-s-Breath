import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_DURATIONS,
  DEFAULT_HAPTICS_ENABLED,
  DURATION_LIMITS,
  SETTINGS_STORAGE_KEY,
} from './constants';
import type { PersistedSettings } from './types';

const DEFAULTS: PersistedSettings = {
  durations: DEFAULT_DURATIONS,
  hapticsEnabled: DEFAULT_HAPTICS_ENABLED,
};

function clamp(value: number): number {
  if (!Number.isFinite(value)) return DURATION_LIMITS.min;
  return Math.min(DURATION_LIMITS.max, Math.max(DURATION_LIMITS.min, Math.round(value)));
}

/**
 * Parse + validate a stored blob into safe settings. Tolerates the older
 * durations-only shape (missing hapticsEnabled → default) for forward migration.
 */
function normalize(raw: unknown): PersistedSettings | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const keys: (keyof typeof DEFAULT_DURATIONS)[] = ['inhaleSec', 'holdSec', 'exhaleSec'];
  if (!keys.every((k) => typeof r[k] === 'number')) return null;
  return {
    durations: {
      inhaleSec: clamp(r.inhaleSec as number),
      holdSec: clamp(r.holdSec as number),
      exhaleSec: clamp(r.exhaleSec as number),
    },
    hapticsEnabled:
      typeof r.hapticsEnabled === 'boolean' ? r.hapticsEnabled : DEFAULT_HAPTICS_ENABLED,
  };
}

/** Serialized flat so old durations-only data stays readable. */
function serialize(settings: PersistedSettings): string {
  return JSON.stringify({ ...settings.durations, hapticsEnabled: settings.hapticsEnabled });
}

/** Load persisted settings, falling back to defaults if missing/corrupt. */
export async function loadSettings(): Promise<PersistedSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return normalize(JSON.parse(raw)) ?? DEFAULTS;
  } catch {
    return DEFAULTS;
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
