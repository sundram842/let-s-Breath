// Public API for the settings feature.
export {
  SettingsProvider,
  useBreathingSettings,
} from './context/SettingsProvider';
export { SettingsScreen } from './SettingsScreen';
export { DurationSlider, type DurationSliderProps } from './components/DurationSlider';
export {
  IntensitySelector,
  type IntensitySelectorProps,
} from './components/IntensitySelector';
export {
  SessionModeControl,
  type SessionModeControlProps,
} from './components/SessionModeControl';
export { formatDuration } from './utils/formatDuration';
export {
  DEFAULT_DURATIONS,
  DEFAULT_HAPTICS_ENABLED,
  DEFAULT_HAPTIC_INTENSITY,
  DEFAULT_SOUND_ENABLED,
  DEFAULT_SESSION,
  DEFAULT_BACKGROUND_ENABLED,
  HAPTIC_INTENSITY_OPTIONS,
  THEME_OPTIONS,
  SESSION_LIMITS,
  DURATION_LIMITS,
} from './constants';
export type {
  BreathingDurations,
  DurationKey,
  HapticIntensity,
  SessionConfig,
  SessionMode,
  ThemePreference,
  PersistedSettings,
} from './types';
