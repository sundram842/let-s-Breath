import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_DURATIONS, DEFAULT_HAPTICS_ENABLED } from '../constants';
import { loadSettings, saveSettings } from '../storage';
import type { BreathingDurations, DurationKey } from '../types';

interface SettingsContextValue {
  /** Current durations (defaults until the stored values load). */
  durations: BreathingDurations;
  /** Haptic guidance toggle. */
  hapticsEnabled: boolean;
  /** True once AsyncStorage has been read at least once. */
  loaded: boolean;
  /** Update one duration; persisted automatically (debounced). */
  setDuration: (key: DurationKey, value: number) => void;
  /** Toggle haptic guidance; persisted automatically. */
  setHapticsEnabled: (value: boolean) => void;
  /** Restore the default durations. */
  resetDurations: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Single source of truth for breathing settings, shared across Home and
 * Settings and backed by AsyncStorage. Editing on the Settings screen updates
 * this state, so the Home breathing session reflects changes immediately —
 * and they survive an app restart.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [durations, setDurations] = useState<BreathingDurations>(DEFAULT_DURATIONS);
  const [hapticsEnabled, setHapticsEnabled] = useState(DEFAULT_HAPTICS_ENABLED);
  const [loaded, setLoaded] = useState(false);

  // Load persisted values once on startup.
  useEffect(() => {
    let active = true;
    loadSettings().then((stored) => {
      if (!active) return;
      setDurations(stored.durations);
      setHapticsEnabled(stored.hapticsEnabled);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist whenever settings change (debounced), but only after the initial
  // load so we never overwrite stored values with the defaults on boot.
  useEffect(() => {
    if (!loaded) return;
    const timeout = setTimeout(() => {
      void saveSettings({ durations, hapticsEnabled });
    }, 300);
    return () => clearTimeout(timeout);
  }, [durations, hapticsEnabled, loaded]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      durations,
      hapticsEnabled,
      loaded,
      setDuration: (key, val) => setDurations((prev) => ({ ...prev, [key]: val })),
      setHapticsEnabled,
      resetDurations: () => setDurations(DEFAULT_DURATIONS),
    }),
    [durations, hapticsEnabled, loaded],
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
