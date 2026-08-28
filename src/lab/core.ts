/* ─────────────────────────────────────────────────────────────
   CONVERSION LAB — core (pure, unit-tested)
   ─────────────────────────────────────────────────────────────
   No DOM, no React, no randomness that can't be injected. Every
   behavioral mechanic is a small pure function so the test suite
   can verify the *schedule math* (reward distributions, easing,
   streaks) independently of the UI.

   The one piece of real randomness — visitor bucketing — is
   deterministic: FNV-1a(experimentId + visitorId) → bucket → variant.
   The same visitor keeps the same variant across sessions and
   devices-less browsers, so a purchase can always be attributed to
   the variant that produced it.
───────────────────────────────────────────────────────────── */

export const LAB_VISITOR_KEY = "lab.visitor.v1";

/* — visitor identity (stable, low-cardinality, privacy-friendly) — */

export function getVisitorId(): string {
  try {
    const cached = window.localStorage.getItem(LAB_VISITOR_KEY);
    if (cached) return cached;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(LAB_VISITOR_KEY, id);
    return id;
  } catch {
    // Private browsing / locked storage: session-scoped id only.
    try {
      const sid = window.sessionStorage.getItem(LAB_VISITOR_KEY);
      if (sid) return sid;
      const id = `v-${Math.random().toString(36).slice(2, 12)}`;
      window.sessionStorage.setItem(LAB_VISITOR_KEY, id);
      return id;
    } catch {
      return `v-${Math.random().toString(36).slice(2, 12)}`;
    }
  }
}

/* — deterministic bucketing — */

/** FNV-1a 32-bit. Stable across platforms; good enough dispersion
 *  for experiment assignment (not cryptography). */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // imul keeps us in 32-bit integer space like real FNV
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic weighted assignment into one of `variants`.
 *  Weights are relative; default is equal. Throws on empty variants. */
export function assignVariant(
  experimentId: string,
  visitorId: string,
  variants: readonly string[],
  weights?: readonly number[]
): string {
  if (variants.length === 0) throw new Error("assignVariant: no variants");
  if (variants.length === 1) return variants[0];
  const w =
    weights && weights.length === variants.length
      ? weights
      : variants.map(() => 1);
  const total = w.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new Error("assignVariant: non-positive weights");
  const bucket = fnv1a(`${experimentId}:${visitorId}`) % 100000;
  let acc = 0;
  for (let i = 0; i < variants.length; i++) {
    acc += (w[i] / total) * 100000;
    if (bucket < acc) return variants[i];
  }
  return variants[variants.length - 1];
}

/* — goal-gradient easing (visual fill accelerates near the goal) —
   The numeric label always stays honest; only the bar's rendered
   width is eased, so visitors *feel* the last stretch move faster
   (Kivetz, Urminsky & Zheng, 2006: goal-gradient acceleration). */

export function goalGradientEase(progress: number, strength = 0.22): number {
  const p = Math.min(1, Math.max(0, progress));
  // pulls p upward most strongly when p is already high
  return p + strength * Math.pow(p, 3) * (1 - p);
}

/* — variable reward schedules (Skinner-box math, injectable RNG) —
   Tiers per schedule: "none" | "base" | "mega". Payouts mirror the
   production wheel ($21 bundle = base; bundle + free AU = mega). */

export type RewardScheduleKind = "fr-1" | "vr-2" | "vr-3" | "vr-8" | "vi";

export type RewardTier = "none" | "base" | "mega";

export type SpinResult = {
  tier: RewardTier;
  /** minutes until a spin is *eligible* again (used by vi) */
  cooldownMs: number;
};

const MEGA_CHANCE = 0.08;

export const SCHEDULE_LABELS: Record<RewardScheduleKind, string> = {
  "fr-1": "FR-1 — every spin wins (current wheel)",
  "vr-2": "VR-2 — 1 in 2 spins wins, mega on 8% of wins",
  "vr-3": "VR-3 — 1 in 3 spins wins, mega on 8% of wins",
  "vr-8": "VR-8 — 1 in 8 spins wins, mega on 8% of wins",
  vi: "VI — variable interval, next eligible spin wins",
};

export const SCHEDULE_WIN_RATE: Record<RewardScheduleKind, number> = {
  "fr-1": 1,
  "vr-2": 0.5,
  "vr-3": 1 / 3,
  "vr-8": 0.125,
  vi: 1, // wins once eligible — frequency is the dial
};

/** A win has a fixed 8% chance of upgrading to the mega tier —
 *  mega is a property of *wins*, not of spins, so the upgrade rate
 *  stays legible on every schedule (on VR-8 the base win is rare
 *  enough already; 64% megas would cheapen the jackpot). */
function tierForWin(rng: () => number): RewardTier {
  return rng() < MEGA_CHANCE ? "mega" : "base";
}

export function spinReward(
  schedule: RewardScheduleKind,
  rng: () => number = Math.random,
  elapsedSinceEligibleMs = Number.POSITIVE_INFINITY
): SpinResult {
  const roll = rng();
  switch (schedule) {
    case "fr-1":
      return { tier: tierForWin(rng), cooldownMs: 0 };
    case "vr-2":
      if (roll < 0.5) return { tier: tierForWin(rng), cooldownMs: 0 };
      return { tier: "none", cooldownMs: 0 };
    case "vr-3":
      if (roll < 1 / 3) return { tier: tierForWin(rng), cooldownMs: 0 };
      return { tier: "none", cooldownMs: 0 };
    case "vr-8":
      if (roll < 0.125) return { tier: tierForWin(rng), cooldownMs: 0 };
      return { tier: "none", cooldownMs: 0 };
    case "vi": {
      // Wins only after a variable eligibility window has passed.
      const windowMs = 20_000 + Math.floor(rng() * 40_000); // 20–60s demo scale
      if (elapsedSinceEligibleMs >= windowMs) {
        return { tier: tierForWin(rng), cooldownMs: windowMs };
      }
      return { tier: "none", cooldownMs: Math.max(0, windowMs - elapsedSinceEligibleMs) };
    }
  }
}

/* — XP progression ladder — */

export type LadderRank = {
  name: string;
  minXp: number;
  unlock: string;
};

export const XP_RANKS: readonly LadderRank[] = [
  { name: "Listener", minXp: 0, unlock: "Base access" },
  { name: "Curator", minXp: 40, unlock: "Free: 5-pitch swipe file" },
  { name: "Program Director", minXp: 100, unlock: "Free: release checklist" },
  { name: "Station Owner", minXp: 180, unlock: "Founder price lock — $25" },
];

export function rankForXp(xp: number): LadderRank {
  let current = XP_RANKS[0];
  for (const rank of XP_RANKS) if (xp >= rank.minXp) current = rank;
  return current;
}

export function nextRank(xp: number): LadderRank | null {
  return XP_RANKS.find((r) => r.minXp > xp) ?? null;
}

/* — streak rules (don't-break-the-chain + one freeze token) — */

export type StreakState = {
  current: number;
  best: number;
  freezesUsed: number;
  lastDoneDay: string | null; // YYYY-MM-DD
};

export const STREAK_FREEZE_LIMIT = 1;
export const STREAK_GOAL = 7;

export function updateStreak(
  state: StreakState,
  today: string,
  yesterday: string,
  completedToday: boolean
): StreakState {
  if (completedToday) {
    const grew = state.lastDoneDay === yesterday;
    return {
      ...state,
      current: grew ? state.current + 1 : 1,
      best: Math.max(state.best, grew ? state.current + 1 : 1),
      lastDoneDay: today,
    };
  }
  // Not done today. A streak survives one missed day via freeze;
  // beyond that the chain breaks (loss aversion drives the resume).
  if (state.lastDoneDay === yesterday) {
    if (state.freezesUsed < STREAK_FREEZE_LIMIT) {
      return { ...state, freezesUsed: state.freezesUsed + 1 };
    }
    return { ...state, current: 0, lastDoneDay: null };
  }
  return state.lastDoneDay === today ? state : { ...state, current: 0, lastDoneDay: null };
}

/* — collection completion (pre-stamped progress) — */

export type CollectionItem = { id: string; label: string; collected: boolean };

export function collectionStats(items: readonly CollectionItem[]) {
  const total = items.length;
  const collected = items.filter((i) => i.collected).length;
  const remaining = total - collected;
  return {
    total,
    collected,
    remaining,
    pct: total === 0 ? 0 : collected / total,
    /** the "left to finish" line — shorter framing near the end */
    label:
      remaining === 0
        ? "Kit complete"
        : remaining === 1
          ? "One piece left to complete your kit"
          : `${remaining} pieces left to complete your kit`,
    /** set-completion kick: the marginal piece matters most when
     *  the set is nearly whole (Koo & Fishbach, 2008). */
    nearComplete: remaining === 1,
  };
}

/* — anchoring helpers (presentation math only — price never moves) — */

export function anchorStack(price: number, anchors: number[]): string[] {
  return [...anchors, price].map((v) => `$${v.toLocaleString("en-US")}`);
}

export function perDayFrame(price: number, days = 365): string {
  const perDay = price / days;
  return perDay < 0.01 ? "less than 1¢/day" : `$${perDay.toFixed(2)}/day`;
}
