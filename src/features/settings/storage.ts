import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_DURATIONS, DURATION_LIMITS, SETTINGS_STORAGE_KEY } from './constants';
import type { BreathingDurations } from './types';

function clamp(value: number): number {
  if (!Number.isFinite(value)) return DURATION_LIMITS.min;
  return Math.min(DURATION_LIMITS.max, Math.max(DURATION_LIMITS.min, Math.round(value)));
}

/** Parse + validate a stored blob into safe, in-range durations. */
function normalize(raw: unknown): BreathingDurations | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const keys: (keyof BreathingDurations)[] = ['inhaleSec', 'holdSec', 'exhaleSec'];
  if (!keys.every((k) => typeof r[k] === 'number')) return null;
  return {
    inhaleSec: clamp(r.inhaleSec as number),
    holdSec: clamp(r.holdSec as number),
    exhaleSec: clamp(r.exhaleSec as number),
  };
}

/** Load persisted durations, falling back to defaults if missing/corrupt. */
export async function loadDurations(): Promise<BreathingDurations> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_DURATIONS;
    return normalize(JSON.parse(raw)) ?? DEFAULT_DURATIONS;
  } catch {
    return DEFAULT_DURATIONS;
  }
}

/** Persist durations. Swallows errors — a failed write shouldn't crash the UI. */
export async function saveDurations(durations: BreathingDurations): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(durations));
  } catch {
    // no-op
  }
}
