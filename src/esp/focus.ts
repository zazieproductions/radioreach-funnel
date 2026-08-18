/* ─────────────────────────────────────────────────────────────
   DECISION-POINT FOCUS — when to dim the page and hold the CTA
   ─────────────────────────────────────────────────────────────
   Pure judgment. The React layer (DecisionFocus.tsx) watches
   proximity / linger / revisits and feeds this module snapshots;
   we only decide whether a cluster deserves the stage.

   Rules (anti-gimmick, anti-flicker):

     • The hero offer never auto-focuses on first view. Landing
       on the page is not a decision — coming *back* to the
       button, hovering it, or sitting in high-intent is.
     • Hover / keyboard / cursor-near enter immediately (already
       armed for a few hundred ms by the engine).
     • Mid-page CTAs may linger-focus after a real pause, never
       while the visitor is still scrolling past.
     • Mode switches are confirmed (except hover/keyboard) and
       exits are delayed, so a jittery cursor can't strobe the
       veil.
     • Forced targets (`?focus=hero`, debug panel) skip scoring.

   `qualifyCluster`, `pickFocus`, and `stepFocus` are pure so
   the hysteresis can be unit-tested without a DOM.
───────────────────────────────────────────────────────────── */

import type { EmotionalMode, FocusClusterId, FocusReason } from "./types";
import { isDecisionFocusEnabled } from "../config/features";

export type { FocusClusterId, FocusReason };

export const FOCUS_CLUSTERS: FocusClusterId[] = ["hero", "stack", "final", "momentum"];

export const FOCUS = {
  visibleRatio: 0.42,
  lingerMs: 3200,
  lingerMsCoarse: 2200,
  eagerLingerMs: 850,
  hoverArmMs: 260,
  nearArmMs: 340,
  nearPx: 72,
  enterConfirmMs: 200,
  exitConfirmMs: 560,
  revisitAwayMs: 2500,
  padPx: 12,
  holeRadius: 16,
};

export interface ClusterSnapshot {
  id: FocusClusterId;
  visibleRatio: number;
  hovered: boolean;
  hoveredFor: number;
  focused: boolean;
  near: boolean;
  nearFor: number;
  revisits: number;
  visibleMs: number;
  eager: boolean;
  scrolling: boolean;
  lingerThreshold: number;
}

export interface FocusIntent {
  espMode: EmotionalMode;
  urgencyScore: number;
  recentCtaHover: boolean;
  pageEngaged: boolean;
}

export interface FocusHysteresis {
  current: FocusClusterId | null;
  reason: FocusReason;
  pending: FocusClusterId | null;
  pendingReason: FocusReason;
  pendingSince: number;
}

export interface FocusPick {
  id: FocusClusterId | null;
  reason: FocusReason;
}

const KILL_KEY = "focus.disabled";

function readParam(): string {
  if (typeof window === "undefined") return "";
  try {
    return new URLSearchParams(window.location.search).get("focus")?.trim().toLowerCase() ?? "";
  } catch {
    return "";
  }
}

function isKilledLocally(): boolean {
  try {
    return localStorage.getItem(KILL_KEY) === "1";
  } catch {
    return false;
  }
}

export function readFocusFlag(): {
  enabled: boolean;
  forced: FocusClusterId | null;
  debug: boolean;
} {
  const param = readParam();
  const forced = FOCUS_CLUSTERS.includes(param as FocusClusterId)
    ? (param as FocusClusterId)
    : null;
  const killedByUrl = param === "off";

  return {
    enabled: isDecisionFocusEnabled() && !killedByUrl && !isKilledLocally(),
    forced,
    debug: param === "debug",
  };
}

/** Persistently disable focus mode in this browser. */
export function killFocus(): void {
  try {
    localStorage.setItem(KILL_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function lingerThresholdFor(
  id: FocusClusterId,
  eager: boolean,
  coarsePointer: boolean
): number {
  if (eager) return FOCUS.eagerLingerMs;
  // First-view hero is the landing offer, not a decision point.
  if (id === "hero") return 0;
  return coarsePointer ? FOCUS.lingerMsCoarse : FOCUS.lingerMs;
}

/** Why (if at all) this cluster deserves the stage right now. */
export function qualifyCluster(c: ClusterSnapshot, intent: FocusIntent): FocusReason {
  if (c.focused) return "keyboard";
  if (c.hovered && c.hoveredFor >= FOCUS.hoverArmMs) return "hover";
  if (c.near && c.nearFor >= FOCUS.nearArmMs) return "near";

  // A moving page is not a decision. Don't dim mid-scroll.
  if (c.scrolling) return null;
  if (c.visibleRatio < FOCUS.visibleRatio) return null;

  if (c.revisits >= 1) return "revisit";

  const heroLocked = c.id === "hero" && !intent.pageEngaged;

  if (!heroLocked && intent.espMode === "urgency") return "urgency";
  if (!heroLocked && intent.urgencyScore >= 4 && c.visibleRatio >= 0.55) return "urgency";
  if (!heroLocked && intent.recentCtaHover && c.id !== "hero") return "intent";

  if (c.lingerThreshold > 0 && c.visibleMs >= c.lingerThreshold) return "linger";

  return null;
}

/**
 * Choose at most one cluster. Pointer/keyboard wins, then the
 * current target (stability), then the most visible qualifier.
 */
export function pickFocus(
  clusters: ClusterSnapshot[],
  intent: FocusIntent,
  current: FocusClusterId | null
): FocusPick {
  const ranked = clusters
    .map((c) => ({ c, reason: qualifyCluster(c, intent) }))
    .filter((x): x is { c: ClusterSnapshot; reason: Exclude<FocusReason, null> } => x.reason !== null);

  if (ranked.length === 0) return { id: null, reason: null };

  const pointer = ranked.find((x) => x.c.hovered || x.c.focused || x.c.near);
  if (pointer) return { id: pointer.c.id, reason: pointer.reason };

  if (current) {
    const keep = ranked.find((x) => x.c.id === current);
    if (keep) return { id: keep.c.id, reason: keep.reason };
  }

  ranked.sort((a, b) => b.c.visibleRatio - a.c.visibleRatio);
  return { id: ranked[0].c.id, reason: ranked[0].reason };
}

function isInstantEnter(reason: FocusReason): boolean {
  return reason === "hover" || reason === "keyboard" || reason === "forced" || reason === "near";
}

/**
 * Hysteresis around pickFocus. Hover/keyboard/forced enter on
 * the same tick; everything else must hold, and exits wait so
 * the veil doesn't strobe.
 */
export function stepFocus(
  candidate: FocusClusterId | null,
  reason: FocusReason,
  h: FocusHysteresis,
  now: number
): FocusHysteresis {
  // Keep pending aligned with current while the target holds, so a
  // later request to leave (candidate === null) is distinguishable
  // from "no pending work".
  if (candidate === h.current) {
    return {
      current: h.current,
      reason: candidate ? reason ?? h.reason : null,
      pending: h.current,
      pendingReason: null,
      pendingSince: 0,
    };
  }

  if (candidate && isInstantEnter(reason)) {
    return {
      current: candidate,
      reason,
      pending: candidate,
      pendingReason: null,
      pendingSince: 0,
    };
  }

  if (candidate !== h.pending) {
    return {
      ...h,
      pending: candidate,
      pendingReason: reason,
      pendingSince: now,
    };
  }

  const needed = candidate === null ? FOCUS.exitConfirmMs : FOCUS.enterConfirmMs;
  if (now - h.pendingSince >= needed) {
    return {
      current: candidate,
      reason,
      pending: candidate,
      pendingReason: null,
      pendingSince: 0,
    };
  }
  return h;
}

export function emptyHysteresis(): FocusHysteresis {
  return {
    current: null,
    reason: null,
    pending: null,
    pendingReason: null,
    pendingSince: 0,
  };
}

/* ── tiny store the React tree / debug panel subscribe to ── */

type Listener = () => void;
const listeners = new Set<Listener>();

let target: FocusClusterId | null = null;
let reason: FocusReason = null;
let forced: FocusClusterId | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function syncBody() {
  if (typeof document === "undefined") return;
  if (target) document.body.dataset.decisionFocus = target;
  else delete document.body.dataset.decisionFocus;
}

export const focusStore = {
  getTarget: (): FocusClusterId | null => target,
  getReason: (): FocusReason => reason,
  getForced: (): FocusClusterId | null => forced,

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  set(next: FocusClusterId | null, why: FocusReason) {
    if (next === target && why === reason) return;
    target = next;
    reason = why;
    syncBody();
    emit();
  },

  setForced(id: FocusClusterId | null) {
    forced = id;
    if (id) {
      target = id;
      reason = "forced";
      syncBody();
    }
    emit();
  },

  reset() {
    target = null;
    reason = null;
    forced = null;
    syncBody();
    emit();
  },
};
