import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { PRACTICE_OPTIONS } from '../constants';
import type { BreathingPractice } from '../types';

export interface PracticePickerProps {
  value: BreathingPractice;
  onChange: (value: BreathingPractice) => void;
}

/** Dropdown for choosing a breathing practice preset (opens a modal list). */
export function PracticePicker({ value, onChange }: PracticePickerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = PRACTICE_OPTIONS.find((o) => o.value === value) ?? PRACTICE_OPTIONS[0];

  const select = (next: BreathingPractice) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Breathing practice: ${selected.label}`}
        style={[styles.field, { backgroundColor: theme.background }]}
      >
        <View style={styles.fieldText}>
          <ThemedText type="default">{selected.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {selected.technique}
          </ThemedText>
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Absorb taps so pressing the sheet doesn't close it. */}
          <Pressable onPress={() => {}}>
            <ThemedView type="backgroundElement" style={styles.sheet}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sheetTitle}>
                BREATHING PRACTICE
              </ThemedText>
              {PRACTICE_OPTIONS.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => select(option.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.row,
                      (pressed || isSelected) && { backgroundColor: theme.backgroundSelected },
                    ]}
                  >
                    <View style={styles.fieldText}>
                      <ThemedText type="default">{option.label}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {option.technique}
                      </ThemedText>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={theme.text} />
                    )}
                  </Pressable>
                );
              })}
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  fieldText: {
    flex: 1,
    gap: Spacing.half,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    borderRadius: Spacing.four,
    padding: Spacing.two,
    gap: Spacing.half,
  },
  sheetTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
});
