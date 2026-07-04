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
  DEFAULT_DURATIONS,
  DEFAULT_HAPTIC_INTENSITY,
  DEFAULT_HAPTICS_ENABLED,
  DEFAULT_PRACTICE,
  DEFAULT_SESSION,
  DEFAULT_SOUND_ENABLED,
  defaultThemePreference,
  PRESET_DURATIONS,
} from '../constants';
import { loadSettings, saveSettings } from '../storage';
import type {
  BreathingDurations,
  BreathingPractice,
  DurationKey,
  HapticIntensity,
  SessionConfig,
  ThemePreference,
} from '../types';

interface SettingsContextValue {
  durations: BreathingDurations;
  hapticsEnabled: boolean;
  hapticIntensity: HapticIntensity;
  soundEnabled: boolean;
  session: SessionConfig;
  themePreference: ThemePreference;
  backgroundEnabled: boolean;
  /** Selected breathing practice preset ("custom" = user-configured). */
  practice: BreathingPractice;
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
  /** Select a practice — applies its preset durations (Custom keeps current). */
  setPractice: (value: BreathingPractice) => void;
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
  const [practice, setPracticeState] = useState<BreathingPractice>(DEFAULT_PRACTICE);
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
        // Selecting a preset applies its durations; Custom keeps the current ones.
        if (value !== 'custom') setDurations(PRESET_DURATIONS[value]);
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
