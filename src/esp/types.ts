/* ─────────────────────────────────────────────────────────────
   EMOTIONAL STATE PROXY — shared types
   ─────────────────────────────────────────────────────────────
   Everything the ESP system shares: modes, zones, signals, and
   the event shapes we persist for later analysis.
───────────────────────────────────────────────────────────── */

/** The three emotional lenses the page can speak through.
 *  `default` is the untouched original copy — also the graceful
 *  fallback whenever signals are noisy, contradictory, or off. */
export type EmotionalMode = "default" | "calm" | "aspire" | "urgency";

/** Page regions the signal layer watches for dwell + revisits. */
export type ZoneId = "pricing" | "scarcity" | "cta" | "proof" | "safety";

/** Primary buy-clusters that can take Decision-Point Focus. */
export type FocusClusterId = "hero" | "stack" | "final" | "momentum";

/** Why the page entered (or left) decision-point focus. */
export type FocusReason =
  | "hover"
  | "keyboard"
  | "near"
  | "linger"
  | "revisit"
  | "urgency"
  | "intent"
  | "forced"
  | null;

/** Normalized, low-level behavioral signals. The brain never sees
 *  raw events — only these. Add new kinds here to extend. */
export type SignalKind =
  | "fast_scroll" // sustained high scroll velocity
  | "scroll_reversal" // rapid direction changes (hunting, overwhelmed)
  | "rage_click" // frantic repeated clicking in one spot
  | "deliberate_read" // slow scrolling with pauses — thoughtful reader
  | "idle" // long pause after activity — internal debate
  | "zone_revisit" // returned to a zone after leaving it
  | "zone_dwell" // spent a long time inside a zone
  | "cta_hover"; // lingering on a CTA without clicking

export interface EspSignal {
  kind: SignalKind;
  at: number; // performance.now()-style timestamp (ms epoch)
  zone?: ZoneId; // for zone_revisit / zone_dwell / idle
  meta?: Record<string, unknown>; // debug detail (velocity, click count…)
}

/** Persisted / consumable event log entry. */
export interface EspEvent {
  at: number;
  type: "session" | "mode_change" | "conversion" | "signal" | "focus";
  mode: EmotionalMode;
  data?: Record<string, unknown>;
}

/** Snapshot attached to conversions so we can correlate
 *  mode + signal state with downstream purchase behavior. */
export interface EspSnapshot {
  sessionId: string;
  mode: EmotionalMode;
  forced: boolean;
  scores: Partial<Record<EmotionalMode, number>>;
  signalCounts: Partial<Record<SignalKind, number>>;
  /** Active decision-point cluster, if the page is in focus mode. */
  focus: FocusClusterId | null;
}

/** Parsed feature-flag state. */
export interface EspFlag {
  enabled: boolean;
  debug: boolean;
  /** A mode forced via URL param (e.g. ?esp=calm) — QA only. */
  forced: EmotionalMode | null;
}

export const MODES: EmotionalMode[] = ["default", "calm", "aspire", "urgency"];
