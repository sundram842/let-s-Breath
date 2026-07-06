import { Image, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ExploreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Explore</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            A calm, guided breathing companion{'\n'}built with React Native.
          </ThemedText>

          <ExternalLink href="https://reactnative.dev" asChild>
            <Pressable style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
              <ThemedView type="backgroundElement" style={styles.linkButton}>
                <ThemedText type="link">React Native documentation</ThemedText>
                <Ionicons name="open-outline" size={14} color={theme.text} />
              </ThemedView>
            </Pressable>
          </ExternalLink>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <Collapsible title="Breathing practices">
            <ThemedText type="small">
              Choose from preset practices — Box Breathing, 4-7-8, Resonance and more — or set your
              own inhale, hold and exhale timings in Settings.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Haptic & voice guidance">
            <ThemedText type="small">
              Follow each phase by touch or sound. Guidance can run with your eyes closed or the
              phone in your pocket, and continues into the background where the platform allows.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Light & dark theme">
            <ThemedText type="small">
              The whole app adapts to your selected theme. Switch between Light and Dark in Settings
              — it applies instantly across every screen.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Animations">
            <ThemedText type="small">
              The breathing ring and screen transitions use{' '}
              <ThemedText type="code">react-native-reanimated</ThemedText> for smooth, 60fps motion
              on the UI thread.
            </ThemedText>
          </Collapsible>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
});
