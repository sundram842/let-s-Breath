import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { PRACTICE_OPTIONS } from '../constants';
import { useBreathingSettings } from '../context/SettingsProvider';
import type { CustomPractice, PracticeId } from '../types';
import { patternSummary } from '../utils/practices';
import { CustomPracticeForm } from './CustomPracticeForm';

export interface PracticeSelectModalProps {
  visible: boolean;
  onClose: () => void;
  /** Currently active selection (for the checkmark). */
  value: PracticeId;
  /** Called with the chosen practice id. The caller applies it (e.g. directly,
   * or behind a "restart session?" confirmation). The modal then closes. */
  onSelect: (id: PracticeId) => void;
  /** Show the create/edit/delete/duplicate affordances (default true). */
  manageable?: boolean;
}

/**
 * Grouped practice chooser used across Home, Settings and the session screen.
 * Lists the built-in presets and, below them, the user's custom practices with
 * inline manage actions plus an "Add Custom Practice" button. Selection is
 * delegated to `onSelect` so each screen can decide what happens (Home/Settings
 * apply immediately; the session screen confirms a restart first).
 */
export function PracticeSelectModal({
  visible,
  onClose,
  value,
  onSelect,
  manageable = true,
}: PracticeSelectModalProps) {
  const theme = useTheme();
  const { customPractices, addCustomPractice, updateCustomPractice, deleteCustomPractice, duplicateCustomPractice } =
    useBreathingSettings();

  // The add/edit form: null when closed, otherwise create or edit-a-practice.
  const [form, setForm] = useState<{ mode: 'create' | 'edit'; editing?: CustomPractice } | null>(
    null,
  );
  // The custom practice whose action menu (edit/duplicate/delete) is open.
  const [menuFor, setMenuFor] = useState<CustomPractice | null>(null);

  const choose = (id: PracticeId) => {
    onSelect(id);
    onClose();
  };

  const confirmDelete = (practice: CustomPractice) => {
    setMenuFor(null);
    Alert.alert(
      'Delete practice?',
      `"${practice.name}" will be removed. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCustomPractice(practice.id),
        },
      ],
    );
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheetWrap} onPress={() => {}}>
            <ThemedView type="backgroundElement" style={styles.sheet}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sheetTitle}>
                BUILT-IN PRACTICES
              </ThemedText>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
              >
                {PRACTICE_OPTIONS.map((option) => (
                  <Row
                    key={option.value}
                    title={option.label}
                    subtitle={option.technique}
                    selected={option.value === value}
                    theme={theme}
                    onPress={() => choose(option.value)}
                  />
                ))}

                {(manageable || customPractices.length > 0) && (
                  <ThemedText
                    type="smallBold"
                    themeColor="textSecondary"
                    style={[styles.sheetTitle, styles.groupGap]}
                  >
                    MY PRACTICES
                  </ThemedText>
                )}

                {customPractices.length === 0 && (manageable || customPractices.length > 0) && (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                    No custom practices yet.
                  </ThemedText>
                )}

                {customPractices.map((practice) => (
                  <Row
                    key={practice.id}
                    title={practice.name}
                    subtitle={`${patternSummary(practice.durations)} (sec)`}
                    selected={practice.id === value}
                    theme={theme}
                    onPress={() => choose(practice.id)}
                    onManage={manageable ? () => setMenuFor(practice) : undefined}
                  />
                ))}

                {manageable && (
                  <Pressable
                    onPress={() => setForm({ mode: 'create' })}
                    accessibilityRole="button"
                    accessibilityLabel="Add custom practice"
                    style={({ pressed }) => [
                      styles.addButton,
                      { borderColor: theme.backgroundSelected, opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Ionicons name="add" size={20} color={theme.text} />
                    <ThemedText type="default">Add Custom Practice</ThemedText>
                  </Pressable>
                )}
              </ScrollView>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Per-practice action menu (edit / duplicate / delete). */}
      <Modal
        visible={menuFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuFor(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuFor(null)}>
          <Pressable style={styles.menuWrap} onPress={() => {}}>
            <ThemedView type="backgroundElement" style={styles.menu}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.menuTitle}>
                {menuFor?.name.toUpperCase()}
              </ThemedText>
              <MenuItem
                icon="create-outline"
                label="Edit"
                theme={theme}
                onPress={() => {
                  const editing = menuFor ?? undefined;
                  setMenuFor(null);
                  if (editing) setForm({ mode: 'edit', editing });
                }}
              />
              <MenuItem
                icon="copy-outline"
                label="Duplicate"
                theme={theme}
                onPress={() => {
                  if (menuFor) duplicateCustomPractice(menuFor.id);
                  setMenuFor(null);
                }}
              />
              <MenuItem
                icon="trash-outline"
                label="Delete"
                destructive
                theme={theme}
                onPress={() => menuFor && confirmDelete(menuFor)}
              />
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create / edit form — remounted per-open so its draft starts fresh. */}
      {form && (
        <CustomPracticeForm
          key={`${form.mode}:${form.editing?.id ?? 'new'}`}
          visible
          mode={form.mode}
          initialName={form.editing?.name}
          initialDurations={form.editing?.durations}
          onSubmit={(name, durations) =>
            form.mode === 'edit' && form.editing
              ? updateCustomPractice(form.editing.id, name, durations)
              : addCustomPractice(name, durations)
          }
          onClose={() => setForm(null)}
        />
      )}
    </>
  );
}

function Row({
  title,
  subtitle,
  selected,
  theme,
  onPress,
  onManage,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  theme: ReturnType<typeof useTheme>;
  onPress: () => void;
  onManage?: () => void;
}) {
  return (
    <View style={styles.rowWrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={({ pressed }) => [
          styles.row,
          (pressed || selected) && { backgroundColor: theme.backgroundSelected },
        ]}
      >
        <View style={styles.rowText}>
          <ThemedText type="default">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        </View>
        {selected && <Ionicons name="checkmark" size={20} color={theme.text} />}
      </Pressable>
      {onManage && (
        <Pressable
          onPress={onManage}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Manage ${title}`}
          style={({ pressed }) => [styles.manage, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

function MenuItem({
  icon,
  label,
  theme,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  theme: ReturnType<typeof useTheme>;
  onPress: () => void;
  destructive?: boolean;
}) {
  const color = destructive ? '#E5634D' : theme.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && { backgroundColor: theme.backgroundSelected },
      ]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <ThemedText type="default" style={{ color }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    borderRadius: Spacing.four,
    padding: Spacing.two,
    gap: Spacing.half,
    maxHeight: '80%',
  },
  sheetTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  groupGap: {
    marginTop: Spacing.one,
  },
  list: {
    gap: Spacing.half,
  },
  empty: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  manage: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  menuWrap: {
    width: '100%',
  },
  menu: {
    borderRadius: Spacing.four,
    padding: Spacing.two,
    gap: Spacing.half,
  },
  menuTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
});
