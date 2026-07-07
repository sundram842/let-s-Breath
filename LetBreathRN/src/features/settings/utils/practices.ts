import {
  DURATION_LIMITS,
  HOLD_DURATION_MIN,
  PRACTICE_OPTIONS,
  PRESET_DURATIONS,
} from '../constants';
import type {
  BreathingDurations,
  BreathingPractice,
  CustomPractice,
  PracticeId,
} from '../types';

/** Prefix that marks a custom-practice id, so it can never collide with a
 * built-in `BreathingPractice` key. */
const CUSTOM_ID_PREFIX = 'up_';

/** True if the value refers to a user-created custom practice (accepts unknown
 * so it can also guard raw persisted data). */
export function isCustomPracticeId(id: unknown): id is string {
  return typeof id === 'string' && id.startsWith(CUSTOM_ID_PREFIX);
}

/** Generate a stable, unique id for a new custom practice. */
export function makeCustomPracticeId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${CUSTOM_ID_PREFIX}${Date.now().toString(36)}${rand}`;
}

/** Compact rhythm summary for a custom practice, e.g. "5 · 2 · 6 · 2". */
export function patternSummary(d: BreathingDurations): string {
  return `${d.inhaleSec} · ${d.holdSec} · ${d.exhaleSec} · ${d.holdOutSec}`;
}

/** Display metadata (name + subtitle) for a resolved practice. */
export interface PracticeMeta {
  label: string;
  technique: string;
  isCustom: boolean;
}

/** Resolve the name + subtitle shown for a selection, custom-aware. */
export function practiceMeta(id: PracticeId, customPractices: CustomPractice[]): PracticeMeta {
  if (isCustomPracticeId(id)) {
    const found = customPractices.find((p) => p.id === id);
    if (found) {
      return {
        label: found.name,
        technique: `${patternSummary(found.durations)} (sec)`,
        isCustom: true,
      };
    }
  }
  const option = PRACTICE_OPTIONS.find((o) => o.value === id) ?? PRACTICE_OPTIONS[0];
  return { label: option.label, technique: option.technique, isCustom: false };
}

/**
 * The durations a selection should apply, or null when the selection keeps the
 * current durations (the manual "custom" preset). Built-in presets return their
 * fixed timings; custom practices return their saved timings.
 */
export function practiceDurations(
  id: PracticeId,
  customPractices: CustomPractice[],
): BreathingDurations | null {
  if (isCustomPracticeId(id)) {
    return customPractices.find((p) => p.id === id)?.durations ?? null;
  }
  if (id === 'custom') return null;
  return PRESET_DURATIONS[id as Exclude<BreathingPractice, 'custom'>] ?? null;
}

/**
 * Validate a custom-practice draft. Returns an error message to display, or null
 * when the draft is valid. `editingId` excludes the practice being edited from
 * the uniqueness check.
 */
export function validateCustomPractice(
  name: string,
  durations: BreathingDurations,
  customPractices: CustomPractice[],
  editingId?: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Please enter a practice name.';
  if (trimmed.length > 40) return 'Please keep the name under 40 characters.';

  const nameTaken = customPractices.some(
    (p) => p.id !== editingId && p.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (nameTaken) return 'A practice with this name already exists.';

  const bounds: { label: string; value: number; min: number }[] = [
    { label: 'Inhale', value: durations.inhaleSec, min: DURATION_LIMITS.min },
    { label: 'Exhale', value: durations.exhaleSec, min: DURATION_LIMITS.min },
    { label: 'Hold', value: durations.holdSec, min: HOLD_DURATION_MIN },
    { label: 'Hold after exhale', value: durations.holdOutSec, min: HOLD_DURATION_MIN },
  ];
  for (const b of bounds) {
    if (!Number.isFinite(b.value) || b.value < b.min || b.value > DURATION_LIMITS.max) {
      return `${b.label} must be between ${b.min} and ${DURATION_LIMITS.max} seconds.`;
    }
  }
  return null;
}

/** A unique "… Copy" name for a duplicated practice. */
export function uniqueCopyName(base: string, customPractices: CustomPractice[]): string {
  const taken = new Set(customPractices.map((p) => p.name.trim().toLowerCase()));
  let candidate = `${base} Copy`;
  let n = 2;
  while (taken.has(candidate.trim().toLowerCase())) {
    candidate = `${base} Copy ${n}`;
    n += 1;
  }
  return candidate;
}
