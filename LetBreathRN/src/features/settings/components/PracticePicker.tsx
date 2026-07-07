import { useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useBreathingSettings } from '../context/SettingsProvider';
import type { PracticeId } from '../types';
import { practiceMeta } from '../utils/practices';
import { PracticeSelectModal } from './PracticeSelectModal';

export interface PracticePickerProps {
  value: PracticeId;
  onChange: (value: PracticeId) => void;
}

/** Settings field for choosing a breathing practice — opens the grouped picker
 * (built-in + custom practices, with create/edit/delete). */
export function PracticePicker({ value, onChange }: PracticePickerProps) {
  const theme = useTheme();
  const { customPractices } = useBreathingSettings();
  const [open, setOpen] = useState(false);
  const meta = practiceMeta(value, customPractices);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Breathing practice: ${meta.label}`}
        style={[styles.field, { backgroundColor: theme.background }]}
      >
        <View style={styles.fieldText}>
          <ThemedText type="default">{meta.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {meta.technique}
          </ThemedText>
        </View>
        <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
      </Pressable>

      <PracticeSelectModal
        visible={open}
        onClose={() => setOpen(false)}
        value={value}
        onSelect={onChange}
      />
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
});
