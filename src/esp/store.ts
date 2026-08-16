/* ─────────────────────────────────────────────────────────────
   STORE — tiny pub/sub the React layer subscribes to
   ─────────────────────────────────────────────────────────────
   Holds only the *effective* mode (already resolved through any
   forced-mode override) plus a mirror of the brain's state for
   snapshots/debug. `setMode` no-ops when nothing changed, so
   React re-renders only on real transitions.
───────────────────────────────────────────────────────────── */

import type { EmotionalMode, EspSnapshot, SignalKind } from "./types";
import { persistMode } from "./log";

type Listener = () => void;

type BrainState = {
  scores: Partial<Record<EmotionalMode, number>>;
  signalCounts: Partial<Record<SignalKind, number>>;
};

const listeners = new Set<Listener>();

let mode: EmotionalMode = "default";
let forced: EmotionalMode | null = null;
let brain: BrainState = { scores: {}, signalCounts: {} };

export const espStore = {
  getMode: (): EmotionalMode => mode,

  setMode(next: EmotionalMode) {
    if (next === mode) return;
    mode = next;
    persistMode(mode);
    if (typeof document !== "undefined") {
      document.body.dataset.espMode = mode; // future CSS/theming hook
    }
    listeners.forEach((l) => l());
  },

  /** React-friendly subscribe (stable identity, useSyncExternalStore). */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /* — forced-mode override (QA URL param / debug panel) — */
  isForced: (): boolean => forced !== null,
  getForced: (): EmotionalMode | null => forced,
  setForced(value: EmotionalMode | null) {
    forced = value;
  },

  /* — brain mirror (scores/counts), written by the brain — */
  getScores: (): EspSnapshot["scores"] => ({ ...brain.scores }),
  getSignalCounts: (): EspSnapshot["signalCounts"] => ({ ...brain.signalCounts }),
  setBrainState(next: BrainState) {
    brain = next;
  },
};

/** Resolve the effective mode: forced override wins, else brain. */
export function effectiveMode(candidate: EmotionalMode): EmotionalMode {
  return forced ?? candidate;
}
