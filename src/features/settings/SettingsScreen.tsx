import { Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { THEME_OPTIONS } from './constants';
import { DurationSlider } from './components/DurationSlider';
import { IntensitySelector } from './components/IntensitySelector';
import { Segmented } from './components/Segmented';
import { SessionModeControl } from './components/SessionModeControl';
import { useBreathingSettings } from './context/SettingsProvider';

/**
 * Settings screen. Reads from and writes to the shared SettingsProvider, which
 * persists everything to AsyncStorage — changes save as they happen and survive
 * a restart.
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
    soundEnabled,
    setSoundEnabled,
    session,
    setSession,
    themePreference,
    setThemePreference,
    backgroundEnabled,
    setBackgroundEnabled,
  } = useBreathingSettings();

  const divider = <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* --- Appearance --- */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
          APPEARANCE
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.intensityRow}>
            <ThemedText type="default">Theme</ThemedText>
            <Segmented
              options={THEME_OPTIONS}
              value={themePreference}
              onChange={setThemePreference}
            />
          </View>
        </ThemedView>

        {/* --- Breathing timer --- */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
          BREATHING TIMER
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <DurationSlider
            label="Inhale"
            value={durations.inhaleSec}
            onChange={(v) => setDuration('inhaleSec', v)}
          />
          {divider}
          <DurationSlider
            label="Hold"
            value={durations.holdSec}
            onChange={(v) => setDuration('holdSec', v)}
          />
          {divider}
          <DurationSlider
            label="Exhale"
            value={durations.exhaleSec}
            onChange={(v) => setDuration('exhaleSec', v)}
          />
          {divider}
          <DurationSlider
            label="Hold (after exhale)"
            value={durations.holdOutSec}
            onChange={(v) => setDuration('holdOutSec', v)}
          />
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          Each phase can range from 1 sec to 20 min. Changes are saved
          automatically and used in your next breath.
        </ThemedText>

        {/* --- Session end mode --- */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
          SESSION
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <SessionModeControl session={session} onChange={setSession} />

          {divider}

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <ThemedText type="default">Continue Practice in Background</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Keep the session going when the app is backgrounded. Off pauses it
                until you return and tap Resume.
              </ThemedText>
            </View>
            <Switch
              value={backgroundEnabled}
              onValueChange={setBackgroundEnabled}
              trackColor={{ true: theme.text, false: theme.backgroundSelected }}
              thumbColor={Platform.OS === 'android' ? theme.background : undefined}
              accessibilityLabel="Continue practice in background"
            />
          </View>
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          {session.mode === 'cycles'
            ? 'End after a set number of breaths, or run until you stop.'
            : 'End after a set amount of time, or run until you stop.'}
        </ThemedText>

        {/* --- Sound + haptics --- */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
          GUIDANCE
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <ThemedText type="default">Sound Effects</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Voice cues for inhale, hold and exhale.
              </ThemedText>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ true: theme.text, false: theme.backgroundSelected }}
              thumbColor={Platform.OS === 'android' ? theme.background : undefined}
              accessibilityLabel="Sound effects"
            />
          </View>

          {divider}

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

          {divider}

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
