// Public API for the settings feature.
export {
  SettingsProvider,
  useBreathingSettings,
  type PracticeMutationResult,
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
export {
  PracticeSelectModal,
  type PracticeSelectModalProps,
} from './components/PracticeSelectModal';
export {
  CustomPracticeForm,
  type CustomPracticeFormProps,
} from './components/CustomPracticeForm';
export { Segmented, type SegmentedProps } from './components/Segmented';
export { formatDuration } from './utils/formatDuration';
export {
  isCustomPracticeId,
  practiceMeta,
  practiceDurations,
  patternSummary,
  type PracticeMeta,
} from './utils/practices';
export {
  DEFAULT_DURATIONS,
  DEFAULT_HAPTICS_ENABLED,
  DEFAULT_HAPTIC_INTENSITY,
  DEFAULT_SOUND_ENABLED,
  DEFAULT_SESSION,
  DEFAULT_BACKGROUND_ENABLED,
  DEFAULT_PRACTICE,
  DEFAULT_CUSTOM_PRACTICES,
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
  CustomPractice,
  PracticeId,
  DurationKey,
  HapticIntensity,
  SessionConfig,
  SessionMode,
  ThemePreference,
  PersistedSettings,
} from './types';
