import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import type { PracticeMutationResult } from '../context/SettingsProvider';
import { DEFAULT_DURATIONS, HOLD_DURATION_MIN } from '../constants';
import type { BreathingDurations } from '../types';
import { DurationSlider } from './DurationSlider';

export interface CustomPracticeFormProps {
  visible: boolean;
  /** "create" shows an empty draft; "edit" pre-fills from the values below. */
  mode: 'create' | 'edit';
  initialName?: string;
  initialDurations?: BreathingDurations;
  /** Validate + persist. Returns { ok:false, error } to keep the form open. */
  onSubmit: (name: string, durations: BreathingDurations) => PracticeMutationResult;
  onClose: () => void;
}

/**
 * Modal form to create or edit a custom breathing practice: a name field plus
 * the four phase durations. Validation is delegated to the caller's `onSubmit`
 * (name required + unique, valid ranges); any error is shown inline and the
 * form stays open so the user can fix it.
 */
export function CustomPracticeForm({
  visible,
  mode,
  initialName,
  initialDurations,
  onSubmit,
  onClose,
}: CustomPracticeFormProps) {
  const theme = useTheme();
  const [name, setName] = useState(initialName ?? '');
  const [durations, setDurations] = useState<BreathingDurations>(
    initialDurations ?? DEFAULT_DURATIONS,
  );
  const [error, setError] = useState<string | null>(null);

  // The parent remounts this form (via `key`) each time it opens, so the initial
  // state above is always the right draft — no reset effect needed.

  const setDuration = (key: keyof BreathingDurations, value: number) => {
    setDurations((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    const result = onSubmit(name, durations);
    if (result.ok) {
      onClose();
    } else {
      setError(result.error ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheetWrap} onPress={() => {}}>
            <ThemedView type="backgroundElement" style={styles.sheet}>
              <View style={styles.handle} />
              <ThemedText type="subtitle" style={styles.title}>
                {mode === 'edit' ? 'Edit Practice' : 'New Practice'}
              </ThemedText>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
              >
                <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                  PRACTICE NAME
                </ThemedText>
                <TextInput
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Morning Calm"
                  placeholderTextColor={theme.textSecondary}
                  maxLength={40}
                  returnKeyType="done"
                  accessibilityLabel="Practice name"
                  style={[
                    styles.nameInput,
                    { color: theme.text, borderColor: theme.backgroundSelected },
                  ]}
                />

                <View style={styles.durations}>
                  <DurationSlider
                    label="Inhale"
                    value={durations.inhaleSec}
                    onChange={(v) => setDuration('inhaleSec', v)}
                  />
                  <DurationSlider
                    label="Hold"
                    min={HOLD_DURATION_MIN}
                    value={durations.holdSec}
                    onChange={(v) => setDuration('holdSec', v)}
                  />
                  <DurationSlider
                    label="Exhale"
                    value={durations.exhaleSec}
                    onChange={(v) => setDuration('exhaleSec', v)}
                  />
                  <DurationSlider
                    label="Hold (after exhale)"
                    min={HOLD_DURATION_MIN}
                    value={durations.holdOutSec}
                    onChange={(v) => setDuration('holdOutSec', v)}
                  />
                </View>

                {error && (
                  <ThemedText type="small" style={[styles.error, { color: '#E5634D' }]}>
                    {error}
                  </ThemedText>
                )}
              </ScrollView>

              <View style={styles.actions}>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  style={({ pressed }) => [
                    styles.button,
                    styles.cancel,
                    { borderColor: theme.backgroundSelected, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <ThemedText type="default">Cancel</ThemedText>
                </Pressable>
                <Pressable
                  onPress={submit}
                  accessibilityRole="button"
                  accessibilityLabel="Save practice"
                  style={({ pressed }) => [
                    styles.button,
                    styles.save,
                    { backgroundColor: theme.text, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <ThemedText type="default" style={{ color: theme.background }}>
                    Save
                  </ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: Spacing.five,
    borderTopRightRadius: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.4)',
    marginBottom: Spacing.two,
  },
  title: {
    marginBottom: Spacing.two,
  },
  scroll: {
    paddingBottom: Spacing.two,
  },
  fieldLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.one,
  },
  nameInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    fontWeight: '600',
  },
  durations: {
    marginTop: Spacing.two,
  },
  error: {
    marginTop: Spacing.one,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  cancel: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  save: {},
});
