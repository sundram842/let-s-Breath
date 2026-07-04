import { useEffect } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

// Static requires so Metro bundles the assets.
const SOURCES = {
  inhale: require('@/assets/sounds/inhale.mp3'),
  hold: require('@/assets/sounds/hold.mp3'),
  exhale: require('@/assets/sounds/exhale.mp3'),
} as const;

/**
 * Plays the matching voice cue once at the start of each phase. Driven by
 * `phaseIndex` (0 inhale, 1 hold-full, 2 exhale, 3 hold-empty) — the same value
 * that drives the ring — so cues stay in sync. The empty hold (index 3) is left
 * silent on purpose: it's a "get ready" beat, signalled by haptics instead.
 */
export function useBreathingSound(phaseIndex: number, enabled = true) {
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
    const player = phaseIndex === 0 ? inhale : phaseIndex === 1 ? hold : phaseIndex === 2 ? exhale : null;
    if (!player) return; // index 3 (empty hold) → silent
    // Restart from the top so re-entering a phase always plays cleanly.
    player.seekTo(0);
    player.play();
  }, [phaseIndex, enabled, inhale, hold, exhale]);
}
