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
export { formatDuration } from './utils/formatDuration';
export {
  DEFAULT_DURATIONS,
  DEFAULT_HAPTICS_ENABLED,
  DEFAULT_HAPTIC_INTENSITY,
  HAPTIC_INTENSITY_OPTIONS,
  DURATION_LIMITS,
} from './constants';
export type {
  BreathingDurations,
  DurationKey,
  HapticIntensity,
  PersistedSettings,
} from './types';
