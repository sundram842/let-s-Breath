import { useEffect, useRef, useState } from 'react';
import Sound from 'react-native-sound';

/**
 * Filename of the looping clock-tick clip, bundled as a *native* resource
 * (android/app/src/main/res/raw/clock_tick.wav). Played under the clock-style
 * phase ring so the session has an audible ticking metronome.
 */
const TICK_SOURCE = 'clock_tick.wav';

/**
 * Loops a soft clock-tick while `enabled` is true (session running + sound on),
 * and stops it otherwise. Loaded once per mount from the native bundle and
 * released on unmount. Silent no-op if the asset can't be loaded (e.g. before a
 * native rebuild picks up the raw resource) — it never throws into the session.
 */
export function useClockTick(enabled: boolean) {
  const soundRef = useRef<Sound | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load the clip once per mount; release it on unmount.
  useEffect(() => {
    let released = false;
    const sound = new Sound(TICK_SOURCE, Sound.MAIN_BUNDLE, (error) => {
      if (error || released) return;
      sound.setNumberOfLoops(-1); // loop until stopped
      setLoaded(true);
    });
    soundRef.current = sound;
    return () => {
      released = true;
      sound.release();
      soundRef.current = null;
    };
  }, []);

  // Start/stop the loop as the enabled flag flips (and once the clip is loaded).
  useEffect(() => {
    const sound = soundRef.current;
    if (!sound || !loaded) return;
    if (enabled) sound.play();
    else sound.stop();
  }, [enabled, loaded]);
}
