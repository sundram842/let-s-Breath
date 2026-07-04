import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_DURATIONS } from '../constants';
import { loadDurations, saveDurations } from '../storage';
import type { BreathingDurations, DurationKey } from '../types';

interface SettingsContextValue {
  /** Current durations (defaults until the stored values load). */
  durations: BreathingDurations;
  /** True once AsyncStorage has been read at least once. */
  loaded: boolean;
  /** Update one duration; persisted automatically (debounced). */
  setDuration: (key: DurationKey, value: number) => void;
  /** Restore the default durations. */
  resetDurations: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Single source of truth for breathing durations, shared across Home and
 * Settings and backed by AsyncStorage. Editing on the Settings screen updates
 * this state, so the Home breathing session reflects changes immediately —
 * and they survive an app restart.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [durations, setDurations] = useState<BreathingDurations>(DEFAULT_DURATIONS);
  const [loaded, setLoaded] = useState(false);

  // Load persisted values once on startup.
  useEffect(() => {
    let active = true;
    loadDurations().then((stored) => {
      if (!active) return;
      setDurations(stored);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist whenever durations change (debounced), but only after the initial
  // load so we never overwrite stored values with the defaults on boot.
  useEffect(() => {
    if (!loaded) return;
    const timeout = setTimeout(() => {
      void saveDurations(durations);
    }, 300);
    return () => clearTimeout(timeout);
  }, [durations, loaded]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      durations,
      loaded,
      setDuration: (key, val) => setDurations((prev) => ({ ...prev, [key]: val })),
      resetDurations: () => setDurations(DEFAULT_DURATIONS),
    }),
    [durations, loaded],
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
