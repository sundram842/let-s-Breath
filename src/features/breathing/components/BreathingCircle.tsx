import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { BREATHING_CONFIG, RING } from '../constants';
import { useBreathingAnimation } from '../hooks/useBreathingAnimation';
import { useBreathingHaptics } from '../hooks/useBreathingHaptics';
import { useBreathingSound } from '../hooks/useBreathingSound';
import type { BreathingConfig } from '../types';
import { CenterLabel } from './CenterLabel';
import { ProgressRing } from './ProgressRing';

export interface BreathingCircleProps {
  /** Override the default breathing rhythm. */
  config?: BreathingConfig;
  /** Number of cycles to count down from (default 10). */
  totalCycles?: number;
  /** Called once the final cycle finishes. */
  onComplete?: () => void;
  /** Silence the inhale/hold/exhale voice cues. */
  muted?: boolean;
  /** Play phase-synced vibration guidance (off by default). */
  hapticsEnabled?: boolean;
}

/**
 * Self-contained breathing widget: responsive sizing + animation + ring + label,
 * plus optional voice and haptic guidance. Drop it anywhere; it fills to a
 * share of the screen's shorter side.
 */
export function BreathingCircle({
  config,
  totalCycles,
  onComplete,
  muted = false,
  hapticsEnabled = false,
}: BreathingCircleProps) {
  const { width, height } = useWindowDimensions();
  const resolvedConfig = config ?? BREATHING_CONFIG;

  const size = useMemo(
    () => Math.min(Math.min(width, height) * RING.sizeRatio, RING.maxSize),
    [width, height],
  );
  const strokeWidth = size * RING.strokeRatio;

  const { progress, phaseIndex, phaseLabel, cyclesLeft } = useBreathingAnimation({
    config: resolvedConfig,
    totalCycles,
    onComplete,
  });

  // Guided voice cues, synced to the phase transitions.
  useBreathingSound(phaseIndex, !muted);

  // Phase-synced vibration guidance (opt-in via Settings).
  useBreathingHaptics({ phaseIndex, config: resolvedConfig, enabled: hapticsEnabled });

  const subtitle = `${cyclesLeft} ${cyclesLeft === 1 ? 'cycle' : 'cycles'} left`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <ProgressRing size={size} strokeWidth={strokeWidth} progress={progress} />
      <CenterLabel title={phaseLabel} subtitle={subtitle} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
