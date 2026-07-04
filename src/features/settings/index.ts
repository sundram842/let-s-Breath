// Public API for the settings feature.
export {
  SettingsProvider,
  useBreathingSettings,
} from './context/SettingsProvider';
export { SettingsScreen } from './SettingsScreen';
export { DurationSlider, type DurationSliderProps } from './components/DurationSlider';
export { formatDuration } from './utils/formatDuration';
export { DEFAULT_DURATIONS, DEFAULT_HAPTICS_ENABLED, DURATION_LIMITS } from './constants';
export type { BreathingDurations, DurationKey, PersistedSettings } from './types';
