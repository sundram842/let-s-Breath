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
} from '../constants';
import { loadSettings, saveSettings } from '../storage';
import type { BreathingDurations, DurationKey, HapticIntensity } from '../types';

interface SettingsContextValue {
  /** Current durations (defaults until the stored values load). */
  durations: BreathingDurations;
  /** Haptic guidance toggle. */
  hapticsEnabled: boolean;
  /** Haptic strength. */
  hapticIntensity: HapticIntensity;
  /** True once AsyncStorage has been read at least once. */
  loaded: boolean;
  /** Update one duration; persisted automatically (debounced). */
  setDuration: (key: DurationKey, value: number) => void;
  /** Toggle haptic guidance; persisted automatically. */
  setHapticsEnabled: (value: boolean) => void;
  /** Set haptic strength; persisted automatically. */
  setHapticIntensity: (value: HapticIntensity) => void;
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
  const [hapticIntensity, setHapticIntensity] = useState<HapticIntensity>(
    DEFAULT_HAPTIC_INTENSITY,
  );
  const [loaded, setLoaded] = useState(false);

  // Load persisted values once on startup.
  useEffect(() => {
    let active = true;
    loadSettings().then((stored) => {
      if (!active) return;
      setDurations(stored.durations);
      setHapticsEnabled(stored.hapticsEnabled);
      setHapticIntensity(stored.hapticIntensity);
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
      void saveSettings({ durations, hapticsEnabled, hapticIntensity });
    }, 300);
    return () => clearTimeout(timeout);
  }, [durations, hapticsEnabled, hapticIntensity, loaded]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      durations,
      hapticsEnabled,
      hapticIntensity,
      loaded,
      setDuration: (key, val) => setDurations((prev) => ({ ...prev, [key]: val })),
      setHapticsEnabled,
      setHapticIntensity,
      resetDurations: () => setDurations(DEFAULT_DURATIONS),
    }),
    [durations, hapticsEnabled, hapticIntensity, loaded],
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
