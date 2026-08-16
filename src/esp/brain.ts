/* ─────────────────────────────────────────────────────────────
   THE BRAIN — turns normalized signals into one emotional mode
   ─────────────────────────────────────────────────────────────
   Signals add weight to one of the three emotional modes. All
   weights decay with a short half-life, so the page only stays
   in a mode while the behavior behind it is still happening.

   Decision rules (anti-jank, anti-creep):

     • A mode must clear MIN_SCORE before the page leaves the
       default copy — a single stray signal never flips anything.
     • It must lead the runner-up by MIN_MARGIN, otherwise the
       signals are contradictory → fall back to default.
     • It must hold the lead for CONFIRM_MS, and mode switches
       are throttled by SWITCH_COOLDOWN → no flip-flopping.
     • All scores decay toward zero → the page quietly returns
       to default once the visitor settles down.

   `decideMode` is a pure function so the hysteresis logic can
   be unit-tested without a DOM.
───────────────────────────────────────────────────────────── */

import type { EmotionalMode, EspSignal, SignalKind, ZoneId } from "./types";
import { effectiveMode, espStore } from "./store";
import { espLog } from "./log";

type ModeWeights = Partial<Record<EmotionalMode, number>>;

const SIGNAL_WEIGHTS: Record<SignalKind, ModeWeights> = {
  fast_scroll: { calm: 2.0 },
  scroll_reversal: { calm: 2.5 },
  rage_click: { calm: 3.0 },
  deliberate_read: { aspire: 2.0 },
  idle: { calm: 1.5 },
  zone_revisit: {}, // resolved per-zone below
  zone_dwell: {}, // resolved per-zone below
  cta_hover: { urgency: 0.8 },
};

const ZONE_REVISIT_WEIGHTS: Record<ZoneId, ModeWeights> = {
  pricing: { urgency: 2.0 },
  scarcity: { urgency: 2.5 },
  cta: { urgency: 1.5 },
  proof: { aspire: 1.0 },
  safety: { calm: 1.0 },
};

const ZONE_DWELL_WEIGHTS: Record<ZoneId, ModeWeights> = {
  pricing: { urgency: 1.0 },
  scarcity: { urgency: 1.5 },
  cta: { urgency: 0.5 },
  proof: { aspire: 1.5 },
  safety: { calm: 0.5 },
};

/** Idle *while looking at price/scarcity* = debate about money. */
const IDLE_AT_PRICE_WEIGHTS: ModeWeights = { urgency: 1.5 };

export const DECIDE = {
  minScore: 4.0,
  minMargin: 0.75,
  confirmMs: 500,
  cooldownMs: 8000,
  scoreCap: 12,
  halfLifeMs: 20_000,
};

interface DecisionState {
  current: EmotionalMode;
  pending: EmotionalMode | null;
  pendingSince: number;
  lastSwitch: number;
}

const ACTIVE_MODES: EmotionalMode[] = ["calm", "aspire", "urgency"];

const initialScores = (): Partial<Record<EmotionalMode, number>> => ({
  calm: 0,
  aspire: 0,
  urgency: 0,
});

export type BrainState = {
  scores: Partial<Record<EmotionalMode, number>>;
  signalCounts: Partial<Record<SignalKind, number>>;
  decision: DecisionState;
};

const state: BrainState = {
  scores: initialScores(),
  signalCounts: {},
  decision: {
    current: "default",
    pending: null,
    pendingSince: 0,
    // -Infinity so the FIRST switch isn't blocked by the cooldown.
    lastSwitch: -Infinity,
  },
};

function weightsFor(signal: EspSignal): ModeWeights {
  switch (signal.kind) {
    case "zone_revisit":
      return signal.zone ? ZONE_REVISIT_WEIGHTS[signal.zone] : {};
    case "zone_dwell":
      return signal.zone ? ZONE_DWELL_WEIGHTS[signal.zone] : {};
    case "idle": {
      const base = SIGNAL_WEIGHTS.idle;
      return signal.zone === "pricing" || signal.zone === "scarcity"
        ? { ...base, ...IDLE_AT_PRICE_WEIGHTS }
        : base;
    }
    default:
      return SIGNAL_WEIGHTS[signal.kind];
  }
}

/** Add a signal's weight to the scoreboard (capped). */
export function ingest(signal: EspSignal) {
  const w = weightsFor(signal);
  const s = state.scores;
  for (const mode of ACTIVE_MODES) {
    const add = w[mode] ?? 0;
    if (add) s[mode] = Math.min(DECIDE.scoreCap, (s[mode] ?? 0) + add);
  }
  state.signalCounts[signal.kind] = (state.signalCounts[signal.kind] ?? 0) + 1;
}

/** Exponential decay toward zero. */
function decay(dtMs: number) {
  const factor = 0.5 ** (dtMs / DECIDE.halfLifeMs);
  for (const mode of ACTIVE_MODES) {
    state.scores[mode] = (state.scores[mode] ?? 0) * factor;
  }
}

/**
 * Pure decision function. Given a scoreboard and the current
 * hysteresis state, returns the mode the page should display.
 */
export function decideMode(
  scores: Partial<Record<EmotionalMode, number>>,
  decision: DecisionState,
  now: number
): { mode: EmotionalMode; decision: DecisionState } {
  const ranked = ACTIVE_MODES.map((m) => ({ mode: m, score: scores[m] ?? 0 })).sort(
    (a, b) => b.score - a.score
  );
  const top = ranked[0];
  const runnerUp = ranked[1];

  const decisive =
    top.score >= DECIDE.minScore &&
    top.score - runnerUp.score >= DECIDE.minMargin;
  const candidate: EmotionalMode = decisive ? top.mode : "default";

  const d = { ...decision };

  if (candidate === d.current) {
    d.pending = null;
    return { mode: d.current, decision: d };
  }

  if (candidate !== d.pending) {
    d.pending = candidate;
    d.pendingSince = now;
    return { mode: d.current, decision: d };
  }

  const heldLongEnough = now - d.pendingSince >= DECIDE.confirmMs;
  const cooledDown = now - d.lastSwitch >= DECIDE.cooldownMs;
  // Returning to default is a quiet fallback, not a pitch change:
  // allow it as soon as the candidate has held, no cooldown needed.
  const canSwitch =
    heldLongEnough && (candidate === "default" || cooledDown);

  if (canSwitch) {
    d.current = candidate;
    d.pending = null;
    d.lastSwitch = now;
  }
  return { mode: d.current, decision: d };
}

/** Advance the scoreboard by one tick; returns the effective mode. */
export function tick(now: number, dtMs: number): EmotionalMode {
  decay(dtMs);

  const previous = espStore.getMode();
  const decided = decideMode(state.scores, state.decision, now);
  const changed = decided.mode !== state.decision.current;
  state.decision = decided.decision;

  const mode = effectiveMode(decided.mode);
  espStore.setMode(mode);
  espStore.setBrainState({
    scores: { ...state.scores },
    signalCounts: { ...state.signalCounts },
  });
  if (changed) {
    espLog("mode_change", {
      from: previous,
      to: mode,
      scores: { ...state.scores },
    });
  }
  return mode;
}

export function getBrainState() {
  return {
    scores: { ...state.scores },
    signalCounts: { ...state.signalCounts },
    decision: { ...state.decision },
  };
}
