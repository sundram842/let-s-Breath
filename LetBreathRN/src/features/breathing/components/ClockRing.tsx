import { StyleSheet } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { useBreathingColors } from '@/hooks/use-theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ClockRingProps {
  /** Canvas size (width = height). */
  size: number;
  /** Stroke width of the outer breath ring — the clock sits just inside it. */
  breathStrokeWidth: number;
  /** Progress 0..1 within the current phase (Reanimated shared value, UI thread). */
  phaseProgress: SharedValue<number>;
}

/**
 * Clock-style phase timer that sits just inside the breath ring. A sweep hand
 * fills clockwise from 12 o'clock as the current phase progresses and snaps back
 * to empty when the next phase begins (driven by `phaseProgress`, which resets
 * at every phase boundary). Twelve tick marks reinforce the clock read. Rendered
 * with react-native-svg + Reanimated so the sweep runs at 60fps on the UI thread.
 */
export function ClockRing({ size, breathStrokeWidth, phaseProgress }: ClockRingProps) {
  const colors = useBreathingColors();
  const center = size / 2;

  // Sit the clock a hair inside the breath ring's inner edge.
  const stroke = Math.max(2, size * 0.02);
  const radius = center - breathStrokeWidth - stroke * 1.6;
  const circumference = 2 * Math.PI * radius;

  // Tick marks just outside the sweep, pointing inward.
  const tickOuter = radius + stroke * 0.9;
  const tickInner = radius + stroke * 0.9 - Math.max(4, size * 0.028);
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * Math.PI) / 6 - Math.PI / 2; // start at 12 o'clock
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x1: center + tickInner * cos,
      y1: center + tickInner * sin,
      x2: center + tickOuter * cos,
      y2: center + tickOuter * sin,
      major: i % 3 === 0, // emphasise 12/3/6/9
    };
  });

  const animatedProps = useAnimatedProps(() => {
    const p = phaseProgress.value < 0 ? 0 : phaseProgress.value > 1 ? 1 : phaseProgress.value;
    // Full offset = empty; 0 = full sweep. Grows clockwise from the top.
    return { strokeDashoffset: circumference * (1 - p) };
  });

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      {ticks.map((t, i) => (
        <Line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={colors.subtitle}
          strokeWidth={t.major ? stroke * 0.55 : stroke * 0.3}
          strokeLinecap="round"
          opacity={t.major ? 0.5 : 0.28}
        />
      ))}

      {/* Faint full-circle track. */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={colors.subtitle}
        strokeWidth={stroke}
        fill="none"
        opacity={0.18}
      />

      {/* Animated sweep hand, starting at 12 o'clock (rotate -90°). */}
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        stroke={colors.title}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </Svg>
  );
}
