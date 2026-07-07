import { useEffect, useRef } from 'react';
import Sound from 'react-native-sound';

// Play cues through the Playback category so they're audible even on silent (iOS)
// and keep playing while the app is backgrounded.
Sound.setCategory('Playback', true);

type CueKey = 'inhale' | 'hold' | 'exhale';

/**
 * Filenames of the cue clips bundled as *native* resources — reliable on device
 * and in release builds (unlike require()'d assets served over Metro in debug).
 * Android: android/app/src/main/res/raw/. iOS: added to the app target's bundle.
 */
const SOURCES: Record<CueKey, string> = {
  inhale: 'inhale.mp3',
  hold: 'hold.mp3',
  exhale: 'exhale.mp3',
};

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
      // MAIN_BUNDLE → load from the native app bundle (res/raw on Android).
      players[key] = new Sound(SOURCES[key], Sound.MAIN_BUNDLE, () => {});
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
