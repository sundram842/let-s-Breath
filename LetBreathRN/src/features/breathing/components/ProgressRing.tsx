import { StyleSheet } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useBreathingColors } from '@/hooks/use-theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface ProgressRingProps {
  /** Canvas size (width = height). */
  size: number;
  /** Ring stroke thickness. */
  strokeWidth: number;
  /** Fill amount 0..1 (a Reanimated shared value driven on the UI thread). */
  progress: SharedValue<number>;
}

/**
 * Breathing ring made of two semicircle arcs that both START at the bottom
 * center and grow up opposite sides, meeting at the top when full. Each arc is
 * "drawn" by animating its strokeDashoffset from the shared `progress` value,
 * which runs on the UI thread (react-native-svg + Reanimated) for smooth 60fps.
 */
export function ProgressRing({ size, strokeWidth, progress }: ProgressRingProps) {
  const colors = useBreathingColors();
  const center = size / 2;
  const radius = (size - strokeWidth) / 2; // keep stroke fully inside the canvas
  const innerRadius = radius - strokeWidth / 2; // frosted disc fills up to the ring
  const arcLength = Math.PI * radius; // length of a semicircle

  // Both arcs start at the bottom point (center, center + radius) and end at
  // the top (center, center - radius); sweep flag picks the right/left side.
  const rightArc = `M ${center},${center + radius} A ${radius},${radius} 0 0 0 ${center},${center - radius}`;
  const leftArc = `M ${center},${center + radius} A ${radius},${radius} 0 0 1 ${center},${center - radius}`;

  const animatedProps = useAnimatedProps(() => ({
    // offset = full length when empty, 0 when full → grows from the bottom.
    strokeDashoffset: arcLength * (1 - progress.value),
  }));

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      {/* Semi-transparent inner disc — the soft frosted-glass effect. */}
      <Circle cx={center} cy={center} r={innerRadius} fill={colors.innerFill} />

      <AnimatedPath
        d={rightArc}
        stroke={colors.ring}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={arcLength}
        animatedProps={animatedProps}
      />
      <AnimatedPath
        d={leftArc}
        stroke={colors.ring}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={arcLength}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}
