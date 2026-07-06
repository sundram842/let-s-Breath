import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { BreathingConfig } from '@/features/breathing';

/**
 * Lifecycle of a breathing session, tracked *above* the session screen so it
 * survives navigating back to Home. `paused` is the only state that offers a
 * resume; everything else means Home shows a fresh "Start Practice".
 */
export type SessionStatus = 'idle' | 'active' | 'paused' | 'complete';

/**
 * Everything needed to resume a paused session from the exact point it left off.
 * The config + targets are captured at start so a resume is faithful even if the
 * user edits Settings in between.
 */
export interface SessionSnapshot {
  /** Position within the current cycle, in ms. */
  cycleElapsedMs: number;
  /** Whole cycles remaining (may be Infinity for an endless cycle session). */
  cyclesLeft: number;
  /** Remaining session time (ms) in duration mode, or null when not timed. */
  remainingMs: number | null;
  /** The rhythm in effect when the session started. */
  config: BreathingConfig;
  /** Cycle target captured at start (Infinity = unbounded). */
  totalCycles: number;
  /** Duration target (ms) captured at start, or null. */
  durationMs: number | null;
}

interface SessionContextValue {
  status: SessionStatus;
  snapshot: SessionSnapshot | null;
  /** True when a paused session is waiting to be resumed. */
  canResume: boolean;
  /** Begin a brand-new session, discarding any paused snapshot. */
  beginNew: () => void;
  /** Persist current progress as resumable and mark the session paused. */
  savePaused: (snapshot: SessionSnapshot) => void;
  /** Mark the session finished and drop the snapshot. */
  complete: () => void;
  /** Reset back to idle (no resumable session). */
  clear: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Holds the current session's status and, while paused, a snapshot precise
 * enough to continue exactly where the user left off. Kept separate from the
 * settings store because it is ephemeral, not persisted across app restarts.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      snapshot,
      canResume: status === 'paused' && snapshot !== null,
      beginNew: () => {
        setSnapshot(null);
        setStatus('active');
      },
      savePaused: (next) => {
        setSnapshot(next);
        setStatus('paused');
      },
      complete: () => {
        setSnapshot(null);
        setStatus('complete');
      },
      clear: () => {
        setSnapshot(null);
        setStatus('idle');
      },
    }),
    [status, snapshot],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
