// Public API for the breathing feature. Import from here, not internals.
export { BreathingScreen } from './BreathingScreen';
export { BreathingCircle, type BreathingCircleProps } from './components/BreathingCircle';
export { ProgressRing, type ProgressRingProps } from './components/ProgressRing';
export { CenterLabel, type CenterLabelProps } from './components/CenterLabel';
export {
  useBreathingAnimation,
  type UseBreathingAnimationParams,
  type UseBreathingAnimationResult,
} from './hooks/useBreathingAnimation';
export { useBreathingSound } from './hooks/useBreathingSound';
export {
  useBreathingHaptics,
  type UseBreathingHapticsParams,
} from './hooks/useBreathingHaptics';
export { HapticEngine, HAPTIC_PATTERN, type HapticPhase } from './haptics/hapticEngine';
export { BREATHING_CONFIG } from './constants';
export type { BreathingConfig, BreathingPhase } from './types';
