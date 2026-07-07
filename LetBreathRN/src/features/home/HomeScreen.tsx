import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  PracticeSelectModal,
  practiceMeta,
  useBreathingSettings,
  type SessionConfig,
} from '@/features/settings';
import { useSession } from '@/features/session';
import { useBreathingColors } from '@/hooks/use-theme';

/** Translucent white line/glow that reads well on both the light and dark gradient. */
const HAIRLINE = 'rgba(255, 255, 255, 0.16)';
/** Accent for an "on" status. Legible on both the blue and the navy gradient. */
const ON_ACCENT = '#8FE3C8';

/** Seconds → compact label, e.g. 4 → "4s", 90 → "1m 30s". */
function compactSeconds(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

/** Human-readable session length, e.g. "20 Cycles", "10 Minutes", "Infinite Session". */
function sessionSummary(session: SessionConfig): string {
  if (session.mode === 'cycles') {
    if (session.cyclesInfinite) return 'Infinite';
    return `${session.cycleCount} ${session.cycleCount === 1 ? 'Cycle' : 'Cycles'}`;
  }
  if (session.durationInfinite) return 'Infinite';
  return `${session.sessionMinutes} ${session.sessionMinutes === 1 ? 'Minute' : 'Minutes'}`;
}

/**
 * The Home hub. It never starts a session on its own — it lays out exactly what
 * will happen (practice, rhythm, length, guidance) and hands control to the user
 * via a single, prominent Start / Resume action.
 */
export function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const c = useBreathingColors();
  const { practice, customPractices, setPractice, durations, session, hapticsEnabled, soundEnabled } =
    useBreathingSettings();
  const { canResume, beginNew } = useSession();

  const [pickerOpen, setPickerOpen] = useState(false);
  const meta = practiceMeta(practice, customPractices);

  const phases = [
    { key: 'inhale', label: 'Inhale', sec: durations.inhaleSec },
    { key: 'holdIn', label: 'Hold', sec: durations.holdSec },
    { key: 'exhale', label: 'Exhale', sec: durations.exhaleSec },
    { key: 'holdOut', label: 'Hold', sec: durations.holdOutSec },
  ];

  // A slow, breathing glow behind the primary action — calm, never busy.
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);
  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.06 }],
    opacity: 0.16 + pulse.value * 0.14,
  }));

  const onStart = () => {
    // A fresh start clears any paused snapshot; Resume keeps it.
    if (!canResume) beginNew();
    navigation.navigate('Session');
  };

  const patternNodes: React.ReactNode[] = [];
  phases.forEach((p, i) => {
    patternNodes.push(
      <View key={p.key} style={styles.patternCol}>
        <Text style={[styles.patternValue, { color: c.title }]}>{compactSeconds(p.sec)}</Text>
        <Text style={[styles.patternLabel, { color: c.subtitle }]}>{p.label}</Text>
      </View>,
    );
    if (i < phases.length - 1) {
      patternNodes.push(
        <Text key={`${p.key}-dot`} style={[styles.patternDot, { color: c.subtitle }]}>
          •
        </Text>,
      );
    }
  });

  return (
    <LinearGradient
      colors={[c.gradientFrom, c.gradientTo]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.fill}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.six },
        ]}
      >
        <View style={styles.inner}>
          {/* Header */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
            <Text style={[styles.greeting, { color: c.subtitle }]}>Take a mindful moment</Text>
            <Text style={[styles.brand, { color: c.title }]}>Let Breath</Text>
          </Animated.View>

          {/* Selected practice + rhythm — tap to change before starting. */}
          <Animated.View entering={FadeInDown.duration(600).delay(80)}>
            <Pressable
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Selected practice: ${meta.label}. Tap to change.`}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: c.control, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <View style={styles.practiceHeader}>
                <Text style={[styles.eyebrow, { color: c.subtitle }]}>SELECTED PRACTICE</Text>
                <View style={styles.changeHint}>
                  <Text style={[styles.changeText, { color: c.subtitle }]}>Change</Text>
                  <Ionicons name="chevron-down" size={14} color={c.subtitle} />
                </View>
              </View>
              <Text style={[styles.practiceName, { color: c.title }]}>{meta.label}</Text>
              <Text style={[styles.technique, { color: c.subtitle }]}>{meta.technique}</Text>

              <View style={styles.divider} />

              <Text style={[styles.eyebrow, { color: c.subtitle }]}>BREATHING PATTERN</Text>
              <View style={styles.patternRow}>{patternNodes}</View>
            </Pressable>
          </Animated.View>

          {/* Session length + guidance status */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(160)}
            style={styles.statsRow}
          >
            <StatCard
              icon="hourglass-outline"
              label="Session"
              value={sessionSummary(session)}
              titleColor={c.title}
              labelColor={c.subtitle}
              cardColor={c.control}
            />
            <StatCard
              icon="pulse-outline"
              label="Haptics"
              value={hapticsEnabled ? 'On' : 'Off'}
              on={hapticsEnabled}
              titleColor={c.title}
              labelColor={c.subtitle}
              cardColor={c.control}
            />
            <StatCard
              icon="volume-medium-outline"
              label="Voice"
              value={soundEnabled ? 'On' : 'Off'}
              on={soundEnabled}
              titleColor={c.title}
              labelColor={c.subtitle}
              cardColor={c.control}
            />
          </Animated.View>

          {/* Primary action */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(240)}
            style={styles.ctaBlock}
          >
            {canResume && (
              <Text style={[styles.resumeHint, { color: c.subtitle }]}>
                You have a paused session
              </Text>
            )}
            <View style={styles.ctaWrap}>
              <Animated.View
                pointerEvents="none"
                style={[styles.ctaHalo, { backgroundColor: c.title }, haloStyle]}
              />
              <Pressable
                onPress={onStart}
                accessibilityRole="button"
                accessibilityLabel={canResume ? 'Resume practice' : 'Start practice'}
                style={({ pressed }) => [
                  styles.cta,
                  { backgroundColor: c.title, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <Ionicons name="play" size={22} color={c.gradientFrom} />
                <Text style={[styles.ctaText, { color: c.gradientFrom }]}>
                  {canResume ? 'Resume Practice' : 'Start Practice'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Quick actions */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(320)}
            style={styles.quickRow}
          >
            <QuickAction
              icon="settings-outline"
              label="Settings"
              color={c.title}
              cardColor={c.control}
              onPress={() => navigation.navigate('Settings')}
            />
            <QuickAction
              icon="time-outline"
              label="History"
              color={c.title}
              cardColor={c.control}
              onPress={() =>
                Alert.alert('History', 'Your session history is coming soon.')
              }
            />
            <QuickAction
              icon="information-circle-outline"
              label="About"
              color={c.title}
              cardColor={c.control}
              onPress={() =>
                Alert.alert(
                  'Let Breath',
                  'A calm, guided breathing companion.\n\nYou choose when and how to begin — breathe intentionally.',
                )
              }
            />
          </Animated.View>
        </View>
      </ScrollView>

      <PracticeSelectModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        value={practice}
        onSelect={setPractice}
      />
    </LinearGradient>
  );
}

function StatCard({
  icon,
  label,
  value,
  on,
  titleColor,
  labelColor,
  cardColor,
}: {
  icon: string;
  label: string;
  value: string;
  on?: boolean;
  titleColor: string;
  labelColor: string;
  cardColor: string;
}) {
  const showDot = on !== undefined;
  return (
    <View style={[styles.statCard, { backgroundColor: cardColor }]}>
      <Ionicons name={icon} size={20} color={on ? ON_ACCENT : titleColor} />
      <Text style={[styles.statLabel, { color: labelColor }]}>{label}</Text>
      <View style={styles.statValueRow}>
        {showDot && (
          <View style={[styles.statusDot, { backgroundColor: on ? ON_ACCENT : labelColor }]} />
        )}
        <Text
          style={[styles.statValue, { color: on === false ? labelColor : titleColor }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  cardColor,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  cardColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={[styles.quickIcon, { backgroundColor: cardColor }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flex: 1,
    gap: Spacing.four,
    justifyContent: 'center',
  },
  header: {
    gap: Spacing.half,
    marginBottom: Spacing.two,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  brand: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  practiceName: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  technique: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HAIRLINE,
    marginVertical: Spacing.two,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  patternCol: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  patternValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  patternLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  patternDot: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    gap: Spacing.one,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  ctaBlock: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  resumeHint: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  ctaWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaHalo: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 42,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    alignSelf: 'stretch',
    paddingVertical: Spacing.three,
    borderRadius: 34,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.one,
  },
  quickAction: {
    alignItems: 'center',
    gap: Spacing.one,
    flex: 1,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
