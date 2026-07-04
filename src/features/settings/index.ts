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
export { PracticePicker, type PracticePickerProps } from './components/PracticePicker';
export { Segmented, type SegmentedProps } from './components/Segmented';
export { formatDuration } from './utils/formatDuration';
export {
  DEFAULT_DURATIONS,
  DEFAULT_HAPTICS_ENABLED,
  DEFAULT_HAPTIC_INTENSITY,
  DEFAULT_SOUND_ENABLED,
  DEFAULT_SESSION,
  DEFAULT_BACKGROUND_ENABLED,
  DEFAULT_PRACTICE,
  HAPTIC_INTENSITY_OPTIONS,
  THEME_OPTIONS,
  PRACTICE_OPTIONS,
  PRESET_DURATIONS,
  SESSION_LIMITS,
  DURATION_LIMITS,
  HOLD_DURATION_MIN,
} from './constants';
export type {
  BreathingDurations,
  BreathingPractice,
  DurationKey,
  HapticIntensity,
  SessionConfig,
  SessionMode,
  ThemePreference,
  PersistedSettings,
} from './types';
