import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

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
} from '../constants';
import { loadSettings, saveSettings } from '../storage';
import {
  makeCustomPracticeId,
  practiceDurations,
  uniqueCopyName,
  validateCustomPractice,
} from '../utils/practices';
import type {
  BreathingDurations,
  CustomPractice,
  DurationKey,
  HapticIntensity,
  PracticeId,
  SessionConfig,
  ThemePreference,
} from '../types';

/** Outcome of an add/edit — `ok` false carries a message for the form. */
export interface PracticeMutationResult {
  ok: boolean;
  error?: string;
  id?: string;
}

interface SettingsContextValue {
  durations: BreathingDurations;
  hapticsEnabled: boolean;
  hapticIntensity: HapticIntensity;
  soundEnabled: boolean;
  session: SessionConfig;
  themePreference: ThemePreference;
  backgroundEnabled: boolean;
  /** Selected practice — a built-in key or a custom practice id. */
  practice: PracticeId;
  /** User-created practices, in display order. */
  customPractices: CustomPractice[];
  /** True once AsyncStorage has been read at least once. */
  loaded: boolean;
  /** Edit a duration manually — this also switches the practice to Custom. */
  setDuration: (key: DurationKey, value: number) => void;
  setHapticsEnabled: (value: boolean) => void;
  setHapticIntensity: (value: HapticIntensity) => void;
  setSoundEnabled: (value: boolean) => void;
  /** Merge a partial change into the session config. */
  setSession: (partial: Partial<SessionConfig>) => void;
  setThemePreference: (value: ThemePreference) => void;
  setBackgroundEnabled: (value: boolean) => void;
  /** Select a practice — applies its durations (manual "custom" keeps current). */
  setPractice: (value: PracticeId) => void;
  /** Create a custom practice; validated (name required + unique, valid ranges). */
  addCustomPractice: (name: string, durations: BreathingDurations) => PracticeMutationResult;
  /** Edit a custom practice; re-validated. Applies live if it's the active one. */
  updateCustomPractice: (
    id: string,
    name: string,
    durations: BreathingDurations,
  ) => PracticeMutationResult;
  /** Remove a custom practice; falls back to manual Custom if it was selected. */
  deleteCustomPractice: (id: string) => void;
  /** Copy a custom practice under a unique "… Copy" name. */
  duplicateCustomPractice: (id: string) => void;
  resetDurations: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Single source of truth for every breathing setting, shared across Home and
 * Settings and backed by AsyncStorage. Edits are reflected on Home immediately
 * and survive an app restart.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [durations, setDurations] = useState<BreathingDurations>(DEFAULT_DURATIONS);
  const [hapticsEnabled, setHapticsEnabled] = useState(DEFAULT_HAPTICS_ENABLED);
  const [hapticIntensity, setHapticIntensity] = useState<HapticIntensity>(
    DEFAULT_HAPTIC_INTENSITY,
  );
  const [soundEnabled, setSoundEnabled] = useState(DEFAULT_SOUND_ENABLED);
  const [session, setSessionState] = useState<SessionConfig>(DEFAULT_SESSION);
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    defaultThemePreference,
  );
  const [backgroundEnabled, setBackgroundEnabled] = useState(DEFAULT_BACKGROUND_ENABLED);
  const [practice, setPracticeState] = useState<PracticeId>(DEFAULT_PRACTICE);
  const [customPractices, setCustomPractices] =
    useState<CustomPractice[]>(DEFAULT_CUSTOM_PRACTICES);
  const [loaded, setLoaded] = useState(false);

  // Load persisted values once on startup.
  useEffect(() => {
    let active = true;
    loadSettings().then((stored) => {
      if (!active) return;
      setDurations(stored.durations);
      setHapticsEnabled(stored.hapticsEnabled);
      setHapticIntensity(stored.hapticIntensity);
      setSoundEnabled(stored.soundEnabled);
      setSessionState(stored.session);
      setThemePreference(stored.themePreference);
      setBackgroundEnabled(stored.backgroundEnabled);
      setPracticeState(stored.practice);
      setCustomPractices(stored.customPractices);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist whenever anything changes (debounced), but only after the initial
  // load so we never overwrite stored values with the defaults on boot.
  useEffect(() => {
    if (!loaded) return;
    const timeout = setTimeout(() => {
      void saveSettings({
        durations,
        hapticsEnabled,
        hapticIntensity,
        soundEnabled,
        session,
        themePreference,
        backgroundEnabled,
        practice,
        customPractices,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [
    durations,
    hapticsEnabled,
    hapticIntensity,
    soundEnabled,
    session,
    themePreference,
    backgroundEnabled,
    practice,
    customPractices,
    loaded,
  ]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      durations,
      hapticsEnabled,
      hapticIntensity,
      soundEnabled,
      session,
      themePreference,
      backgroundEnabled,
      practice,
      customPractices,
      loaded,
      setDuration: (key, val) => {
        // A manual timer edit means the config is no longer a preset.
        setDurations((prev) => ({ ...prev, [key]: val }));
        setPracticeState('custom');
      },
      setHapticsEnabled,
      setHapticIntensity,
      setSoundEnabled,
      setSession: (partial) => setSessionState((prev) => ({ ...prev, ...partial })),
      setThemePreference,
      setBackgroundEnabled,
      setPractice: (value) => {
        setPracticeState(value);
        // Applying a built-in preset or a custom practice sets its durations;
        // the manual "custom" preset keeps the current ones (returns null).
        const next = practiceDurations(value, customPractices);
        if (next) setDurations(next);
      },
      addCustomPractice: (name, draftDurations) => {
        const error = validateCustomPractice(name, draftDurations, customPractices);
        if (error) return { ok: false, error };
        const id = makeCustomPracticeId();
        setCustomPractices((prev) => [
          ...prev,
          { id, name: name.trim(), durations: draftDurations },
        ]);
        return { ok: true, id };
      },
      updateCustomPractice: (id, name, draftDurations) => {
        const error = validateCustomPractice(name, draftDurations, customPractices, id);
        if (error) return { ok: false, error };
        setCustomPractices((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, name: name.trim(), durations: draftDurations } : p,
          ),
        );
        // Keep the live rhythm in step if the edited practice is the active one.
        if (practice === id) setDurations(draftDurations);
        return { ok: true };
      },
      deleteCustomPractice: (id) => {
        setCustomPractices((prev) => prev.filter((p) => p.id !== id));
        // If the deleted practice was active, fall back to the manual Custom
        // preset — the current durations stay, so nothing jumps underfoot.
        if (practice === id) setPracticeState('custom');
      },
      duplicateCustomPractice: (id) => {
        setCustomPractices((prev) => {
          const src = prev.find((p) => p.id === id);
          if (!src) return prev;
          return [
            ...prev,
            {
              id: makeCustomPracticeId(),
              name: uniqueCopyName(src.name, prev),
              durations: src.durations,
            },
          ];
        });
      },
      resetDurations: () => setDurations(DEFAULT_DURATIONS),
    }),
    [
      durations,
      hapticsEnabled,
      hapticIntensity,
      soundEnabled,
      session,
      themePreference,
      backgroundEnabled,
      practice,
      customPractices,
      loaded,
    ],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useBreathingSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useBreathingSettings must be used within a SettingsProvider');
  }
  return ctx;
}
