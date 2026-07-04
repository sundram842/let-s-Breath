import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { SESSION_LIMITS } from '../constants';
import type { SessionConfig, SessionMode } from '../types';

export interface SessionModeControlProps {
  session: SessionConfig;
  onChange: (partial: Partial<SessionConfig>) => void;
}

const MODES: { value: SessionMode; label: string }[] = [
  { value: 'cycles', label: 'Cycles' },
  { value: 'duration', label: 'Time' },
];

/** Choose how a session ends: a number of cycles, or a length of time. */
export function SessionModeControl({ session, onChange }: SessionModeControlProps) {
  const theme = useTheme();
  const isCycles = session.mode === 'cycles';

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: theme.background }]}>
        {MODES.map((mode) => {
          const selected = session.mode === mode.value;
          return (
            <Pressable
              key={mode.value}
              onPress={() => onChange({ mode: mode.value })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.segment, selected && { backgroundColor: theme.backgroundSelected }]}
            >
              <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
                {mode.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {isCycles ? (
        <CounterRow
          label="Cycles to complete"
          value={session.cycleCount}
          min={SESSION_LIMITS.cycles.min}
          max={SESSION_LIMITS.cycles.max}
          infinite={session.cyclesInfinite}
          onValue={(cycleCount) => onChange({ cycleCount })}
          onInfinite={(cyclesInfinite) => onChange({ cyclesInfinite })}
        />
      ) : (
        <CounterRow
          label="Session length"
          unit="min"
          value={session.sessionMinutes}
          min={SESSION_LIMITS.minutes.min}
          max={SESSION_LIMITS.minutes.max}
          infinite={session.durationInfinite}
          onValue={(sessionMinutes) => onChange({ sessionMinutes })}
          onInfinite={(durationInfinite) => onChange({ durationInfinite })}
        />
      )}
    </View>
  );
}

interface CounterRowProps {
  label: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  infinite: boolean;
  onValue: (value: number) => void;
  onInfinite: (value: boolean) => void;
}

function CounterRow({
  label,
  unit,
  value,
  min,
  max,
  infinite,
  onValue,
  onInfinite,
}: CounterRowProps) {
  const theme = useTheme();
  const nudge = (delta: number) => onValue(Math.min(max, Math.max(min, value + delta)));

  return (
    <View style={styles.counter}>
      <View style={styles.counterHeader}>
        <ThemedText type="default">{label}</ThemedText>
        <Pressable
          onPress={() => onInfinite(!infinite)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ selected: infinite }}
          style={[
            styles.infinitePill,
            { borderColor: theme.backgroundSelected },
            infinite && { backgroundColor: theme.backgroundSelected },
          ]}
        >
          <ThemedText type="small" themeColor={infinite ? 'text' : 'textSecondary'}>
            ∞ Infinite
          </ThemedText>
        </Pressable>
      </View>

      <View style={[styles.stepper, infinite && styles.disabled]}>
        <Pressable
          disabled={infinite}
          onPress={() => nudge(-1)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          style={({ pressed }) => [
            styles.stepButton,
            { borderColor: theme.backgroundSelected, opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <ThemedText type="subtitle" style={styles.stepGlyph}>
            −
          </ThemedText>
        </Pressable>

        <ThemedText type="default" style={styles.value}>
          {infinite ? '∞' : unit ? `${value} ${unit}` : value}
        </ThemedText>

        <Pressable
          disabled={infinite}
          onPress={() => nudge(1)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          style={({ pressed }) => [
            styles.stepButton,
            { borderColor: theme.backgroundSelected, opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <ThemedText type="subtitle" style={styles.stepGlyph}>
            +
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
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
  counter: {
    gap: Spacing.two,
  },
  counterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infinitePill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  disabled: {
    opacity: 0.4,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: {
    lineHeight: 32,
  },
  value: {
    minWidth: 72,
    textAlign: 'center',
    fontWeight: '600',
  },
});
