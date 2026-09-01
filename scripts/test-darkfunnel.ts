/* ─────────────────────────────────────────────────────────────
   DARK FUNNEL TEARDOWN — mechanic tests
   ─────────────────────────────────────────────────────────────
   These tests are the teardown's evidence. They don't assert
   that the funnel "works" — they assert that its claims are
   false in specific, reproducible ways:

     · the progress bar cannot reach 100% mid-quiz,
     · the lead step's 85% is derived from nothing,
     · no answer vector is ever rejected,
     · the countdown never expires,
     · the seat counter never empties,
     · the downsell costs more than the offer it "discounts".

   Run:  npm run test:darkfunnel
───────────────────────────────────────────────────────────── */

import assert from "node:assert/strict";
import test from "node:test";

import {
  CTA_SCROLL_THRESHOLD,
  EMPTY_CART,
  HEADLINES,
  OFFER,
  PHASE_PROGRESS,
  analysisScript,
  cartTotal,
  claimedSavings,
  countdownRemaining,
  formatClock,
  fnv1a,
  honestProgressPct,
  maxScore,
  money,
  mulberry32,
  orderId,
  pickHeadline,
  progressDistortion,
  quizProgressPct,
  rollingDeadline,
  scoreQuiz,
  scrollDepth,
  seatsLeft,
  shouldShowCta,
  toastSchedule,
  verdictFor,
  viewerCount,
} from "../src/darkfunnel/core.ts";
import { QUIZ } from "../src/darkfunnel/copy.ts";
import { PATTERNS, PATTERNS_BY_ID } from "../src/darkfunnel/annotations.ts";

/* ── 1. progress-bar fiction ─────────────────────────────── */

test("quiz bar never reads 100% while questions remain", () => {
  const total = QUIZ.length;
  for (let step = 0; step <= total; step++) {
    const pct = quizProgressPct(step, total);
    assert.ok(pct < 100, `step ${step} showed ${pct}%`);
  }
  // even at the final question it stops short
  assert.equal(
    Math.round(quizProgressPct(total, total) * 10) / 10,
    Math.round((total / (total + 1)) * 1000) / 10,
  );
});

test("the denominator inflation is the whole trick", () => {
  assert.equal(quizProgressPct(3, 6), (3 / 7) * 100);
  assert.equal(honestProgressPct(3, 6), 50);
  assert.ok(progressDistortion(3, 6) > 7);
});

test("distortion peaks mid-quiz and never favours the visitor", () => {
  const total = QUIZ.length;
  for (let step = 0; step <= total; step++) {
    assert.ok(
      progressDistortion(step, total) >= 0,
      "bar must never overstate remaining work",
    );
  }
});

test("lead phase is hard-set, not derived", () => {
  assert.equal(PHASE_PROGRESS.lead, 85);
  assert.equal(PHASE_PROGRESS.result, 100);
  const total = QUIZ.length;
  // 85 is not producible by the quiz formula at any step
  const producible = Array.from({ length: total + 1 }, (_, s) =>
    Math.round(quizProgressPct(s, total)),
  );
  assert.ok(!producible.includes(PHASE_PROGRESS.lead));
});

test("progress functions are total (no NaN on degenerate input)", () => {
  assert.equal(quizProgressPct(0, 0), 0);
  assert.equal(honestProgressPct(4, 0), 0);
  assert.equal(quizProgressPct(-3, 6), 0);
  assert.equal(quizProgressPct(99, 6), (6 / 7) * 100);
});

/* ── 2. the gate that isn't ──────────────────────────────── */

test("scoring is real arithmetic", () => {
  const answers = Object.fromEntries(QUIZ.map((q) => [q.id, q.options[0].id]));
  const expected =
    Math.round(QUIZ.reduce((s, q) => s + q.options[0].weight, 0) * 100) / 100;
  assert.equal(scoreQuiz(QUIZ, answers), expected);
});

test("unanswered questions simply score zero — never a rejection", () => {
  assert.equal(scoreQuiz(QUIZ, {}), 0);
  assert.equal(verdictFor(0, QUIZ).approved, true);
});

test("every one of the 4^6 answer vectors is approved", () => {
  const counts = new Set<string>();
  const walk = (i: number, answers: Record<string, string>) => {
    if (i === QUIZ.length) {
      const v = verdictFor(scoreQuiz(QUIZ, answers), QUIZ);
      assert.equal(v.approved, true);
      counts.add(v.tier);
      return;
    }
    for (const o of QUIZ[i].options) walk(i + 1, { ...answers, [QUIZ[i].id]: o.id });
  };
  walk(0, {});
  assert.equal(4 ** QUIZ.length, 4096);
  // the score only selects which flattery is printed
  assert.ok(counts.size > 1, "tiers should vary even though outcome cannot");
});

test("even an impossible score clears", () => {
  for (const s of [-999, 0, 0.01, maxScore(QUIZ), 10_000]) {
    assert.equal(verdictFor(s, QUIZ).approved, true);
  }
});

test("percentile is always flattering", () => {
  for (const s of [0, maxScore(QUIZ) / 2, maxScore(QUIZ)]) {
    const v = verdictFor(s, QUIZ);
    assert.ok(v.percentile >= 60 && v.percentile <= 99);
  }
});

/* ── 3. scarcity never resolves ──────────────────────────── */

test("seats decay but never reach zero", () => {
  const opts = { start: 42, floor: 3, intervalMs: 26_000 };
  assert.equal(seatsLeft(opts, 0), 42);
  assert.equal(seatsLeft(opts, 26_000), 41);
  assert.equal(seatsLeft(opts, 25_999), 42);
  assert.equal(seatsLeft(opts, 1000 * 60 * 60 * 24), opts.floor);
  assert.ok(seatsLeft(opts, Number.MAX_SAFE_INTEGER) >= opts.floor);
});

test("the deadline rolls forward instead of expiring", () => {
  const start = 1_700_000_000_000;
  const win = 9 * 60 * 1000;
  const justAfterFirstWindow = start + win + 1;
  const end = rollingDeadline(start, win, justAfterFirstWindow);
  assert.ok(end > justAfterFirstWindow, "a new deadline is always ahead of you");
  assert.ok(countdownRemaining(end, justAfterFirstWindow) > 0);
  // a visitor arriving at any moment gets a full-ish window
  for (let i = 0; i < 50; i++) {
    const now = start + i * 71_337;
    assert.ok(countdownRemaining(rollingDeadline(start, win, now), now) > 0);
  }
});

test("countdown formatting is stable width", () => {
  assert.equal(formatClock(0), "00:00");
  assert.equal(formatClock(65), "01:05");
  assert.equal(formatClock(3661), "01:01:01");
  assert.equal(formatClock(-10), "00:00");
});

test("viewer count is a bounded walk that never empties the room", () => {
  const rand = mulberry32(99);
  for (let tick = 0; tick < 500; tick++) {
    const v = viewerCount({ base: 63, spread: 14 }, tick, rand);
    assert.ok(v >= 40 && v <= 90, `viewers out of band: ${v}`);
  }
});

/* ── 4. social proof is precomputed ──────────────────────── */

test("toast schedule is deterministic and widening", () => {
  const a = toastSchedule(1234, 10);
  const b = toastSchedule(1234, 10);
  assert.deepEqual(a, b, "same seed → same 'live' activity");
  const gaps = a.slice(1).map((t, i) => t.atMs - a[i].atMs);
  assert.ok(gaps[gaps.length - 1] > gaps[0], "cadence must widen, not loop");
  assert.ok(a.every((t) => t.name && t.city && t.action && /minute/.test(t.ago)));
});

test("different sessions get different fictional crowds", () => {
  assert.notDeepEqual(toastSchedule(1, 6), toastSchedule(2, 6));
});

/* ── 5. scroll gating ────────────────────────────────────── */

test("sticky CTA appears only past 35% depth", () => {
  assert.equal(CTA_SCROLL_THRESHOLD, 0.35);
  assert.equal(shouldShowCta(0.34), false);
  assert.equal(shouldShowCta(0.35), false);
  assert.equal(shouldShowCta(0.351), true);
});

test("scroll depth is clamped and safe on short pages", () => {
  assert.equal(scrollDepth(0, 800, 3200), 0);
  assert.equal(scrollDepth(1200, 800, 3200), 0.5);
  assert.equal(scrollDepth(99_999, 800, 3200), 1);
  assert.equal(scrollDepth(0, 800, 800), 1, "unscrollable page counts as read");
});

/* ── 6. the ladder ───────────────────────────────────────── */

test("pre-checked bump is the difference between two carts", () => {
  const withBump = { ...EMPTY_CART, tripwire: true, bump: true };
  const without = { ...EMPTY_CART, tripwire: true, bump: false };
  assert.equal(cartTotal(without), OFFER.tripwire);
  assert.equal(cartTotal(withBump), OFFER.tripwire + OFFER.bump);
  assert.equal(cartTotal(EMPTY_CART), 0);
});

test("the downsell 'discount' costs more than the offer it replaces", () => {
  const ladder = OFFER.downsellPerMonth * OFFER.downsellMonths;
  assert.ok(ladder > OFFER.oto, `${ladder} should exceed ${OFFER.oto}`);
  // and the salient number shrinks by ~66%
  assert.ok(OFFER.downsellPerMonth / OFFER.oto < 0.4);
});

test("claimed savings are anchor arithmetic, not value", () => {
  const cart = { ...EMPTY_CART, tripwire: true, bump: true };
  assert.equal(
    claimedSavings(cart),
    OFFER.tripwireAnchor + OFFER.bumpAnchor - cartTotal(cart),
  );
});

test("money formatting", () => {
  assert.equal(money(27), "$27");
  assert.equal(money(3.95), "$3.95");
  assert.equal(money(0), "$0");
});

/* ── 7. manufactured labour ──────────────────────────────── */

test("the analysis terminal does zero work", () => {
  const script = analysisScript({ firstName: "sam", score: 12.3, tier: "standard" }, 7);
  assert.ok(script.length >= 10);
  assert.ok(script.every((l, i) => i === 0 || l.atMs > script[i - 1].atMs));
  assert.ok(script.at(-1)!.atMs < 8_000, "theatre must stay under attention span");
  // the verdict it 'discovers' was already decided
  assert.ok(script.some((l) => /no disqualifying markers/.test(l.text)));
});

test("order ids look institutional and are pure hash", () => {
  assert.match(orderId(42), /^RR-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  assert.equal(orderId(42), orderId(42));
  assert.notEqual(orderId(42), orderId(43));
});

/* ── 8. headline formula ─────────────────────────────────── */

test("every headline is premise + withheld outcome", () => {
  for (const h of HEADLINES) {
    assert.ok(h.premise.length > 20);
    assert.ok(h.withheld.length > 20);
    // the withheld half names a consequence without stating it
    assert.match(h.withheld, /\b(what|none|still|stopped|since|next)\b/i);
  }
});

test("headline choice is stable per session", () => {
  assert.deepEqual(pickHeadline(5150), pickHeadline(5150));
});

/* ── 9. determinism + annotation coverage ────────────────── */

test("PRNG is deterministic and in range", () => {
  const a = Array.from({ length: 64 }, mulberry32(2024));
  const b = Array.from({ length: 64 }, mulberry32(2024));
  assert.deepEqual(a, b);
  assert.ok(a.every((n) => n >= 0 && n < 1));
  assert.ok(new Set(a).size > 60, "no short cycles");
});

test("fnv1a is stable across runs", () => {
  assert.equal(fnv1a("radioreach"), fnv1a("radioreach"));
  assert.notEqual(fnv1a("a"), fnv1a("b"));
});

test("every annotated pattern is fully documented", () => {
  assert.ok(PATTERNS.length >= 24);
  const ids = new Set<string>();
  for (const p of PATTERNS) {
    assert.ok(!ids.has(p.id), `duplicate pattern id: ${p.id}`);
    ids.add(p.id);
    assert.ok(p.label && p.principle && p.mechanism && p.cost && p.citation);
    assert.ok(p.mechanism.length > 80, `${p.id} mechanism is too thin`);
    assert.equal(PATTERNS_BY_ID[p.id], p);
  }
});

test("risk classification is exhaustive", () => {
  for (const p of PATTERNS) {
    assert.ok(["gray", "deceptive", "unlawful-in-some-markets"].includes(p.risk));
  }
});
