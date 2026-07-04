import { Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { DurationSlider } from './components/DurationSlider';
import { IntensitySelector } from './components/IntensitySelector';
import { useBreathingSettings } from './context/SettingsProvider';

/**
 * Settings screen. Renders the three breathing-duration sliders. Values are
 * read from and written to the shared SettingsProvider, which persists them to
 * AsyncStorage — so changes are saved as they happen and survive a restart.
 */
export function SettingsScreen() {
  const theme = useTheme();
  const {
    durations,
    setDuration,
    hapticsEnabled,
    setHapticsEnabled,
    hapticIntensity,
    setHapticIntensity,
  } = useBreathingSettings();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
          BREATHING TIMER
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <DurationSlider
            label="Inhale"
            value={durations.inhaleSec}
            onChange={(v) => setDuration('inhaleSec', v)}
          />
          <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
          <DurationSlider
            label="Hold"
            value={durations.holdSec}
            onChange={(v) => setDuration('holdSec', v)}
          />
          <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
          <DurationSlider
            label="Exhale"
            value={durations.exhaleSec}
            onChange={(v) => setDuration('exhaleSec', v)}
          />
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          Each phase can range from 1 sec to 20 min. Changes are saved
          automatically and used in your next breath.
        </ThemedText>

        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
          GUIDANCE
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <ThemedText type="default">Haptic Breathing Guidance</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Vibrates in sync with each phase, so you can follow along with
                your eyes closed or the phone in your pocket.
              </ThemedText>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ true: theme.text, false: theme.backgroundSelected }}
              thumbColor={Platform.OS === 'android' ? theme.background : undefined}
              accessibilityLabel="Haptic breathing guidance"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

          <View style={styles.intensityRow}>
            <ThemedText type="small" themeColor={hapticsEnabled ? 'text' : 'textSecondary'}>
              Vibration strength
            </ThemedText>
            <IntensitySelector
              value={hapticIntensity}
              onChange={setHapticIntensity}
              disabled={!hapticsEnabled}
            />
          </View>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: Spacing.two,
  },
  card: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.one,
  },
  hint: {
    marginHorizontal: Spacing.two,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  toggleText: {
    flex: 1,
    gap: Spacing.half,
  },
  intensityRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
});
