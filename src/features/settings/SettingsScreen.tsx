import { ScrollView, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { DurationSlider } from './components/DurationSlider';
import { useBreathingSettings } from './context/SettingsProvider';

/**
 * Settings screen. Renders the three breathing-duration sliders. Values are
 * read from and written to the shared SettingsProvider, which persists them to
 * AsyncStorage — so changes are saved as they happen and survive a restart.
 */
export function SettingsScreen() {
  const theme = useTheme();
  const { durations, setDuration } = useBreathingSettings();

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
});
