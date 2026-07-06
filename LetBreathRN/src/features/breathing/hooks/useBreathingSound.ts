import { useEffect, useRef } from 'react';
import Sound from 'react-native-sound';

// Play cues through the Playback category so they're audible even on silent (iOS).
Sound.setCategory('Playback', true);

// Static requires so Metro bundles the assets.
const SOURCES = {
  inhale: require('@/assets/sounds/inhale.mp3'),
  hold: require('@/assets/sounds/hold.mp3'),
  exhale: require('@/assets/sounds/exhale.mp3'),
} as const;

type CueKey = 'inhale' | 'hold' | 'exhale';

/**
 * Plays the matching voice cue once at the start of each phase. Driven by
 * `phaseIndex` (0 inhale, 1 hold-full, 2 exhale, 3 hold-empty) — the same value
 * that drives the ring — so cues stay in sync. The empty hold (index 3) is left
 * silent on purpose: it's a "get ready" beat, signalled by haptics instead.
 */
export function useBreathingSound(phaseIndex: number, enabled = true) {
  const playersRef = useRef<Partial<Record<CueKey, Sound>>>({});

  // Load the three cue players once per mount; release them on unmount.
  useEffect(() => {
    const players: Partial<Record<CueKey, Sound>> = {};
    (Object.keys(SOURCES) as CueKey[]).forEach((key) => {
      players[key] = new Sound(SOURCES[key], () => {});
    });
    playersRef.current = players;
    return () => {
      (Object.values(players) as Sound[]).forEach((p) => p.release());
      playersRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const key: CueKey | null =
      phaseIndex === 0 ? 'inhale' : phaseIndex === 1 ? 'hold' : phaseIndex === 2 ? 'exhale' : null;
    if (!key) return; // index 3 (empty hold) → silent
    const player = playersRef.current[key];
    if (!player) return;
    // stop() rewinds to the start, so re-entering a phase always plays cleanly.
    player.stop(() => player.play());
  }, [phaseIndex, enabled]);
}
