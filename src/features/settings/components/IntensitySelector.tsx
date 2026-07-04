import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { HAPTIC_INTENSITY_OPTIONS } from '../constants';
import type { HapticIntensity } from '../types';

export interface IntensitySelectorProps {
  value: HapticIntensity;
  onChange: (value: HapticIntensity) => void;
  /** Dim + disable when haptics are off. */
  disabled?: boolean;
}

/** A 3-way segmented control: Gentle · Medium · Strong. */
export function IntensitySelector({ value, onChange, disabled = false }: IntensitySelectorProps) {
  const theme = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: theme.background }, disabled && styles.disabled]}>
      {HAPTIC_INTENSITY_OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            style={[styles.segment, selected && { backgroundColor: theme.backgroundSelected }]}
          >
            <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Spacing.two,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two - 1,
  },
  disabled: {
    opacity: 0.4,
  },
});
