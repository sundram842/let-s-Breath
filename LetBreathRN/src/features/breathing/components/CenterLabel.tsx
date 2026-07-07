import { StyleSheet, Text, View } from 'react-native';

import { typography } from '@/theme';
import { useBreathingColors } from '@/hooks/use-theme';
import { RING } from '../constants';

export interface CenterLabelProps {
  /** Large phase text, e.g. "Inhale". */
  title: string;
  /** Small secondary text, e.g. "10 cycles left". */
  subtitle: string;
  /** Seconds remaining in the current phase — the big number under the title.
   * Pass null to hide it (e.g. when the session is complete). */
  countdown?: number | null;
  /** Circle size — font sizes scale from it for responsiveness. */
  size: number;
}

/**
 * Text overlay centered inside the ring. Rendered with plain RN <Text>
 * (crisper than canvas text and no font asset to load). The phase label + phase
 * countdown sit at the optical center; the subtitle sits lower, matching the
 * design.
 */
export function CenterLabel({ title, subtitle, countdown, size }: CenterLabelProps) {
  const colors = useBreathingColors();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.titleWrap}>
        <Text
          style={[styles.title, { color: colors.title, fontSize: size * RING.titleRatio }]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {title}
        </Text>
        {countdown != null && (
          <Text
            style={[
              styles.countdown,
              { color: colors.title, fontSize: size * RING.countdownRatio },
            ]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {countdown}
          </Text>
        )}
      </View>

      <Text
        style={[
          styles.subtitle,
          {
            color: colors.subtitle,
            fontSize: size * RING.subtitleRatio,
            bottom: size * RING.subtitleBottomRatio,
          },
        ]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: typography.weights.medium,
    letterSpacing: typography.letterSpacing.wide,
    textAlign: 'center',
  },
  countdown: {
    fontWeight: typography.weights.medium,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  subtitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontWeight: typography.weights.regular,
    letterSpacing: typography.letterSpacing.wide,
  },
});
