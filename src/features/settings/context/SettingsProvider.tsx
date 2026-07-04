import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  DEFAULT_DURATIONS,
  DEFAULT_HAPTIC_INTENSITY,
  DEFAULT_HAPTICS_ENABLED,
  DEFAULT_SESSION,
  DEFAULT_SOUND_ENABLED,
} from '../constants';
import { loadSettings, saveSettings } from '../storage';
import type {
  BreathingDurations,
  DurationKey,
  HapticIntensity,
  SessionConfig,
} from '../types';

interface SettingsContextValue {
  durations: BreathingDurations;
  hapticsEnabled: boolean;
  hapticIntensity: HapticIntensity;
  soundEnabled: boolean;
  session: SessionConfig;
  /** True once AsyncStorage has been read at least once. */
  loaded: boolean;
  setDuration: (key: DurationKey, value: number) => void;
  setHapticsEnabled: (value: boolean) => void;
  setHapticIntensity: (value: HapticIntensity) => void;
  setSoundEnabled: (value: boolean) => void;
  /** Merge a partial change into the session config. */
  setSession: (partial: Partial<SessionConfig>) => void;
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
      void saveSettings({ durations, hapticsEnabled, hapticIntensity, soundEnabled, session });
    }, 300);
    return () => clearTimeout(timeout);
  }, [durations, hapticsEnabled, hapticIntensity, soundEnabled, session, loaded]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      durations,
      hapticsEnabled,
      hapticIntensity,
      soundEnabled,
      session,
      loaded,
      setDuration: (key, val) => setDurations((prev) => ({ ...prev, [key]: val })),
      setHapticsEnabled,
      setHapticIntensity,
      setSoundEnabled,
      setSession: (partial) => setSessionState((prev) => ({ ...prev, ...partial })),
      resetDurations: () => setDurations(DEFAULT_DURATIONS),
    }),
    [durations, hapticsEnabled, hapticIntensity, soundEnabled, session, loaded],
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
