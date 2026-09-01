/* ─────────────────────────────────────────────────────────────
   DARK FUNNEL TEARDOWN — core mechanics (pure, unit-tested)
   ─────────────────────────────────────────────────────────────
   RESEARCH ARTIFACT. Never deployed. Nothing here touches money,
   a network, or a real customer. It is a working replica of a
   tripwire info-product funnel, built so the manipulation math
   can be *read* instead of guessed at.

   Everything in this file is a pure function: no DOM, no React,
   no ambient randomness. Randomness is injected (seeded PRNG) so
   the "live" scarcity theatre is reproducible in tests — which is
   itself the first finding: none of the urgency is real, so all
   of it can be computed ahead of time.
───────────────────────────────────────────────────────────── */

/* ── seeded randomness ─────────────────────────────────────── */

/** Mulberry32 — tiny, fast, deterministic. Same seed, same funnel. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit — string → stable seed (session id → funnel state). */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/* ─────────────────────────────────────────────────────────────
   1. PROGRESS-BAR FICTION
   ─────────────────────────────────────────────────────────────
   The bar is a completion hypnotic, not a measurement.

   • During the quiz the denominator is inflated by one, so the
     bar mathematically cannot reach 100% while questions remain.
     The visitor never sees "done" until they have paid attention
     costs they can't recover (sunk cost + Zeigarnik tension).
   • The lead-capture step hard-sets 85%. It is not step-derived.
     85% is chosen because it reads as "almost there" while
     leaving visible headroom — the goal-gradient sweet spot.
   • The result screen sets 100% regardless of what happened.
───────────────────────────────────────────────────────────── */

export const PHASE_PROGRESS = {
  /** hard-set, not computed — see quizProgressPct for the honest number */
  lead: 85,
  result: 100,
} as const;

/**
 * step / (total + 1) * 100.
 * The `+1` is the whole trick: the last question reads
 * total/(total+1) — e.g. 6/7 = 85.7% — so the bar is always
 * "nearly finished" and never finished.
 */
export function quizProgressPct(step: number, total: number): number {
  if (total <= 0) return 0;
  const s = clamp(step, 0, total);
  return (s / (total + 1)) * 100;
}

/** The number the bar *would* show if it were honest. */
export function honestProgressPct(step: number, total: number): number {
  if (total <= 0) return 0;
  return (clamp(step, 0, total) / total) * 100;
}

/** How many percentage points of pure fiction are on screen. */
export function progressDistortion(step: number, total: number): number {
  return honestProgressPct(step, total) - quizProgressPct(step, total);
}

/* ─────────────────────────────────────────────────────────────
   2. THE QUALIFICATION RITUAL
   ─────────────────────────────────────────────────────────────
   Real arithmetic, meaningless gating. Weights are summed
   honestly and displayed to two decimals to look forensic.
   Every possible answer vector clears the bar, because there is
   no fail branch anywhere in this file. The "weighted answers /
   lying wastes everyone's time" line is intimidation copy: its
   function is to make the visitor answer *earnestly*, which
   raises self-perception of fit (commitment & consistency) and
   makes the later price feel like a personal verdict.
───────────────────────────────────────────────────────────── */

export type QuizOption = { id: string; label: string; weight: number };
export type QuizQuestion = {
  id: string;
  prompt: string;
  /** the pressure line under the question — pure intimidation */
  subtext: string;
  options: QuizOption[];
};

export type Verdict = {
  score: number;
  /** always true. there is no branch that sets this false. */
  approved: true;
  tier: "provisional" | "standard" | "priority";
  /** percentile shown to the visitor — manufactured, always flattering */
  percentile: number;
  headline: string;
  reason: string;
};

export function scoreQuiz(
  questions: readonly QuizQuestion[],
  answers: Record<string, string>,
): number {
  let total = 0;
  for (const q of questions) {
    const chosen = q.options.find((o) => o.id === answers[q.id]);
    if (chosen) total += chosen.weight;
  }
  return Math.round(total * 100) / 100;
}

export function maxScore(questions: readonly QuizQuestion[]): number {
  return questions.reduce(
    (sum, q) => sum + Math.max(...q.options.map((o) => o.weight)),
    0,
  );
}

/**
 * The gate. Note what is missing: a rejection.
 * Low scorers are told they are "exactly who this was built for"
 * (deficit framing). High scorers are told they are "priority"
 * (status framing). The score only picks the flattery.
 */
export function verdictFor(
  score: number,
  questions: readonly QuizQuestion[],
): Verdict {
  const max = maxScore(questions) || 1;
  const ratio = clamp(score / max, 0, 1);

  const tier: Verdict["tier"] =
    ratio >= 0.72 ? "priority" : ratio >= 0.4 ? "standard" : "provisional";

  // Percentile is a decreasing function of nothing useful: low
  // scorers get "urgency" percentiles, high scorers get "elite"
  // percentiles. Both read as good news.
  const percentile =
    tier === "priority"
      ? Math.round(88 + ratio * 9)
      : tier === "standard"
        ? Math.round(71 + ratio * 12)
        : Math.round(63 + ratio * 8);

  const copy: Record<Verdict["tier"], { headline: string; reason: string }> = {
    priority: {
      headline: "PRIORITY CLEARANCE",
      reason:
        "Your responses match the profile that moves fastest once the method is in hand. You are being routed ahead of the standard queue.",
    },
    standard: {
      headline: "CLEARED — STANDARD INTAKE",
      reason:
        "Nothing in your responses disqualifies you. The pattern in your answers is the one this was originally built to correct.",
    },
    provisional: {
      headline: "CLEARED — PROVISIONAL",
      reason:
        "Your score is below the median, which is exactly why the committee flagged your file for access. The people who need this most always score here.",
    },
  };

  return {
    score,
    approved: true,
    tier,
    percentile,
    headline: copy[tier].headline,
    reason: copy[tier].reason,
  };
}

/* ─────────────────────────────────────────────────────────────
   3. SCARCITY WIDGETS
   ─────────────────────────────────────────────────────────────
   Three independent fictions running on timers.
───────────────────────────────────────────────────────────── */

/**
 * Seats decay on a fixed clock, with a floor so the offer is
 * always *nearly* gone but never actually gone. A real inventory
 * hits zero; a persuasion prop asymptotes.
 */
export function seatsLeft(
  opts: {
    start: number;
    floor: number;
    /** ms between each seat disappearing */
    intervalMs: number;
  },
  elapsedMs: number,
): number {
  const { start, floor, intervalMs } = opts;
  if (intervalMs <= 0) return start;
  const gone = Math.floor(Math.max(0, elapsedMs) / intervalMs);
  return Math.max(floor, start - gone);
}

/** Bounded random walk — "live viewers" that never leave the room. */
export function viewerCount(
  opts: { base: number; spread: number },
  tick: number,
  rand: () => number,
): number {
  const { base, spread } = opts;
  // Deterministic per tick: wander, but stay inside the band that
  // reads as "busy but plausible".
  const drift = Math.sin(tick / 3) * spread * 0.5;
  const jitter = (rand() - 0.5) * spread;
  return Math.max(2, Math.round(base + drift + jitter));
}

/** Countdown that resets rather than expires. Deadlines that end are risky. */
export function countdownRemaining(endMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((endMs - nowMs) / 1000));
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/**
 * A "deadline" that rolls forward forever. Every visitor arrives
 * with the same amount of time left, which is the tell: scarcity
 * anchored to *your* arrival is not scarcity.
 */
export function rollingDeadline(
  startedAtMs: number,
  windowMs: number,
  nowMs: number,
): number {
  if (windowMs <= 0) return startedAtMs;
  const cycles = Math.floor(Math.max(0, nowMs - startedAtMs) / windowMs) + 1;
  return startedAtMs + cycles * windowMs;
}

/* ─────────────────────────────────────────────────────────────
   4. SOCIAL-PROOF TOASTS
   ─────────────────────────────────────────────────────────────
   "Marcus just unlocked access." Generated from two word lists
   and a seeded PRNG. No purchase, no Marcus.
───────────────────────────────────────────────────────────── */

export type Toast = {
  id: number;
  name: string;
  city: string;
  action: string;
  /** ms after mount that this toast appears */
  atMs: number;
  /** fake relative timestamp: "2 minutes ago" */
  ago: string;
};

export const TOAST_NAMES = [
  "Marcus",
  "Priya",
  "Devon",
  "Aisling",
  "Tomás",
  "Nadia",
  "Reggie",
  "Yuki",
  "Solene",
  "Bram",
  "Imani",
  "Casper",
] as const;

export const TOAST_CITIES = [
  "Detroit, MI",
  "Leeds, UK",
  "Austin, TX",
  "Lisbon, PT",
  "Portland, OR",
  "Toronto, ON",
  "Naarm/Melbourne",
  "Atlanta, GA",
  "Glasgow, UK",
  "Oakland, CA",
] as const;

export const TOAST_ACTIONS = [
  "just unlocked access",
  "cleared the intake screen",
  "took the last discounted seat",
  "added the Compliance Pack",
  "started the protocol",
  "upgraded to Tier II",
] as const;

/**
 * Deterministic schedule. Note the cadence: fast at first
 * (density = "everyone is doing this"), then spaced out so the
 * page never feels scripted. It is entirely scripted.
 */
export function toastSchedule(seed: number, count: number): Toast[] {
  const rand = mulberry32(seed);
  const out: Toast[] = [];
  let t = 4200;
  for (let i = 0; i < Math.max(0, count); i++) {
    const name = TOAST_NAMES[Math.floor(rand() * TOAST_NAMES.length)];
    const city = TOAST_CITIES[Math.floor(rand() * TOAST_CITIES.length)];
    const action = TOAST_ACTIONS[Math.floor(rand() * TOAST_ACTIONS.length)];
    const minutes = 1 + Math.floor(rand() * 14);
    out.push({
      id: i,
      name,
      city,
      action,
      atMs: Math.round(t),
      ago: minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`,
    });
    // widening gaps: 9s → ~22s
    t += 9000 + i * 1600 + rand() * 5000;
  }
  return out;
}

/* ─────────────────────────────────────────────────────────────
   5. SCROLL GATING
   ─────────────────────────────────────────────────────────────
   The sticky CTA does not appear on arrival. It waits for >35%
   depth, because a visitor who has scrolled a third of a page is
   already invested; showing the bar earlier would classify it as
   an ad, later would miss the peak of the curiosity gap.
───────────────────────────────────────────────────────────── */

export const CTA_SCROLL_THRESHOLD = 0.35;

export function scrollDepth(
  scrollY: number,
  viewportH: number,
  docH: number,
): number {
  const scrollable = docH - viewportH;
  if (scrollable <= 0) return 1;
  return clamp(scrollY / scrollable, 0, 1);
}

export function shouldShowCta(depth: number): boolean {
  return depth > CTA_SCROLL_THRESHOLD;
}

/* ─────────────────────────────────────────────────────────────
   6. THE LADDER (prices are props — no processor is contacted)
───────────────────────────────────────────────────────────── */

export const OFFER = {
  tripwire: 27,
  tripwireAnchor: 349,
  /** pre-checked. the default is the product. */
  bump: 17,
  bumpAnchor: 89,
  /** OTO — guilt-priced against the tripwire */
  oto: 197,
  otoAnchor: 1494,
  /** downsell: same thing, split, so the *number* shrinks */
  downsellPerMonth: 67,
  downsellMonths: 3,
} as const;

export type Cart = {
  tripwire: boolean;
  bump: boolean;
  oto: boolean;
  downsell: boolean;
};

export const EMPTY_CART: Cart = {
  tripwire: false,
  bump: false,
  oto: false,
  downsell: false,
};

export function cartTotal(cart: Cart): number {
  let total = 0;
  if (cart.tripwire) total += OFFER.tripwire;
  if (cart.bump) total += OFFER.bump;
  if (cart.oto) total += OFFER.oto;
  if (cart.downsell) total += OFFER.downsellPerMonth * OFFER.downsellMonths;
  return Math.round(total * 100) / 100;
}

/** What the page claims you "saved" — anchor arithmetic, not value. */
export function claimedSavings(cart: Cart): number {
  let anchor = 0;
  if (cart.tripwire) anchor += OFFER.tripwireAnchor;
  if (cart.bump) anchor += OFFER.bumpAnchor;
  if (cart.oto) anchor += OFFER.otoAnchor;
  return Math.round((anchor - cartTotal(cart)) * 100) / 100;
}

export function money(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

/** Order id theatre: looks like a system, is a hash. */
export function orderId(seed: number): string {
  const rand = mulberry32(seed);
  const block = () =>
    Math.floor(rand() * 36 ** 4)
      .toString(36)
      .toUpperCase()
      .padStart(4, "0");
  return `RR-${block()}-${block()}`;
}

/* ─────────────────────────────────────────────────────────────
   7. FAKE ANALYSIS TERMINAL
   ─────────────────────────────────────────────────────────────
   Manufactured labour. The computation is already done — the
   verdict is fixed before the first line prints. The delay exists
   to make the output feel earned (effort justification, and the
   "labour illusion" of Buell & Norton, 2011).
───────────────────────────────────────────────────────────── */

export type TerminalLine = { text: string; atMs: number; kind: "info" | "ok" | "warn" };

export function analysisScript(
  profile: { firstName: string; score: number; tier: string },
  seed: number,
): TerminalLine[] {
  const rand = mulberry32(seed);
  const raw: Array<[string, TerminalLine["kind"]]> = [
    ["> establishing secure channel …", "info"],
    ["> channel established · node ORD-4", "ok"],
    [`> loading respondent file: ${profile.firstName.toUpperCase() || "SUBJECT"}`, "info"],
    ["> normalising weighted responses", "info"],
    [`> raw composite … ${profile.score.toFixed(2)}`, "ok"],
    ["> cross-checking against 11,482 prior intakes", "info"],
    ["> variance within tolerance", "ok"],
    ["> screening for disqualifying markers …", "warn"],
    ["> no disqualifying markers found", "ok"],
    [`> tier assignment … ${profile.tier.toUpperCase()}`, "ok"],
    ["> reserving allocation (holds 09:00)", "warn"],
    ["> COMPLETE — file cleared for release", "ok"],
  ];
  let t = 240;
  return raw.map(([text, kind]) => {
    const line = { text, atMs: Math.round(t), kind };
    t += 240 + rand() * 420;
    return line;
  });
}

/* ─────────────────────────────────────────────────────────────
   8. HEADLINE FORMULA
   ─────────────────────────────────────────────────────────────
   outrage premise + withheld outcome.
   The premise supplies moral heat (someone is angry, something is
   forbidden); the outcome clause removes the payload and moves it
   behind a click. The curiosity gap (Loewenstein, 1994) is not
   built by what the headline says — it is built by the specific
   thing it refuses to say.
───────────────────────────────────────────────────────────── */

export type Headline = { premise: string; withheld: string };

export const HEADLINES: readonly Headline[] = [
  {
    premise: "Doctors are calling it psychological malpractice",
    withheld: "11,482 people did it anyway — none will talk about what happened next.",
  },
  {
    premise: "Three radio conglomerates tried to bury this memo",
    withheld: "The 400 artists who read it first stopped answering their labels.",
  },
  {
    premise: "A programming director called it “ethically indefensible”",
    withheld: "He has used it on every playlist he has built since.",
  },
  {
    premise: "Universities quietly pulled the study from their servers",
    withheld: "The 19-minute protocol inside it is still circulating in six countries.",
  },
] as const;

export function pickHeadline(seed: number): Headline {
  return HEADLINES[Math.floor(mulberry32(seed)() * HEADLINES.length)];
}

/** Renders the two halves the way a content farm would. */
export function renderHeadline(h: Headline): string {
  return `${h.premise}. ${h.withheld}`;
}

/* ─────────────────────────────────────────────────────────────
   9. SESSION SEED
───────────────────────────────────────────────────────────── */

export const SESSION_KEY = "darkfunnel.session.v1";

export function sessionSeed(id: string): number {
  return fnv1a(id) || 1;
}
