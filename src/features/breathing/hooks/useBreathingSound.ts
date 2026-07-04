import { useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

import type { BreathingPhase } from '../types';

// Static requires so Metro bundles the assets.
const SOURCES = {
  inhale: require('@/assets/sounds/inhale.mp3'),
  hold: require('@/assets/sounds/hold.mp3'),
  exhale: require('@/assets/sounds/exhale.mp3'),
} as const;

/**
 * Plays the matching voice cue exactly once each time the breathing phase
 * begins. Because `phase` is derived from the same timeline that drives the
 * ring animation, the cue is always in sync with the progress bar.
 *
 * The three phases never repeat back-to-back (inhale → hold → exhale → hold),
 * so a change in `phase` reliably marks the start of a new phase — the effect
 * fires once per transition, never per frame.
 */
export function useBreathingSound(phase: BreathingPhase, enabled = true) {
  // useAudioPlayer returns a stable player per source across renders.
  const inhale = useAudioPlayer(SOURCES.inhale);
  const hold = useAudioPlayer(SOURCES.hold);
  const exhale = useAudioPlayer(SOURCES.exhale);

  // Let cues play even when the phone's ringer is on silent.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const player = phase === 'inhale' ? inhale : phase === 'hold' ? hold : exhale;
    // Restart from the top so re-entering a phase always plays cleanly.
    player.seekTo(0);
    player.play();
  }, [phase, enabled, inhale, hold, exhale]);
}
