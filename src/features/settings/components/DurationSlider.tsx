import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { DURATION_LIMITS } from '../constants';
import { formatDuration } from '../utils/formatDuration';

export interface DurationSliderProps {
  label: string;
  /** Current value in seconds. */
  value: number;
  /** Fired whenever the value changes (drag, +/-, or manual entry). */
  onChange: (value: number) => void;
}

function clamp(v: number): number {
  return Math.min(DURATION_LIMITS.max, Math.max(DURATION_LIMITS.min, Math.round(v)));
}

/**
 * A labeled duration control: a slider plus a −/+ stepper (1-second increments)
 * and an editable numeric field for typing an exact value. All inputs are
 * clamped to the 1 sec – 20 min range.
 */
export function DurationSlider({ label, value, onChange }: DurationSliderProps) {
  const theme = useTheme();

  // Local text buffer so the user can type freely; committed on blur/submit.
  const [text, setText] = useState(String(value));
  // Re-sync the field when `value` changes from the slider, steppers, or load
  // (done during render — React's pattern — so it never fights active typing).
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setText(String(value));
  }

  const commit = () => {
    const parsed = parseInt(text, 10);
    if (Number.isNaN(parsed)) {
      setText(String(value)); // revert invalid input
      return;
    }
    const next = clamp(parsed);
    setText(String(next));
    if (next !== value) onChange(next);
  };

  const nudge = (delta: number) => {
    const next = clamp(value + delta);
    if (next !== value) onChange(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="default">{label}</ThemedText>

        <View style={styles.stepper}>
          <Pressable
            onPress={() => nudge(-1)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${label} by one second`}
            style={({ pressed }) => [
              styles.stepButton,
              { borderColor: theme.backgroundSelected, opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <ThemedText type="subtitle" style={styles.stepGlyph}>
              −
            </ThemedText>
          </Pressable>

          <TextInput
            value={text}
            onChangeText={setText}
            onBlur={commit}
            onSubmitEditing={commit}
            keyboardType="number-pad"
            returnKeyType="done"
            selectTextOnFocus
            maxLength={4}
            accessibilityLabel={`${label} duration in seconds`}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.backgroundSelected },
            ]}
          />
          <ThemedText type="small" themeColor="textSecondary">
            sec
          </ThemedText>

          <Pressable
            onPress={() => nudge(1)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Increase ${label} by one second`}
            style={({ pressed }) => [
              styles.stepButton,
              { borderColor: theme.backgroundSelected, opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <ThemedText type="subtitle" style={styles.stepGlyph}>
              +
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={DURATION_LIMITS.min}
        maximumValue={DURATION_LIMITS.max}
        step={DURATION_LIMITS.step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={theme.text}
        maximumTrackTintColor={theme.backgroundSelected}
        thumbTintColor={theme.text}
      />

      <ThemedText type="small" themeColor="textSecondary" style={styles.readout}>
        {formatDuration(value)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: {
    lineHeight: 30,
  },
  input: {
    minWidth: 52,
    textAlign: 'center',
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  readout: {
    alignSelf: 'flex-end',
  },
});
