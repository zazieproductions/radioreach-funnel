/* ─────────────────────────────────────────────────────────────
   Conversion Lab — pure-mechanics test suite
   ─────────────────────────────────────────────────────────────
   Verifies the schedule math, bucketing determinism, streak
   rules, goal-gradient easing, and collection framing without a
   DOM. Run via:  npm run test:lab  (see scripts/run-lab-tests.mjs)

   Note: core.ts touches `window` only inside getVisitorId() —
   every function under test here is window-free.
───────────────────────────────────────────────────────────── */

import assert from "node:assert/strict";
import {
  anchorStack,
  assignVariant,
  collectionStats,
  fnv1a,
  goalGradientEase,
  nextRank,
  perDayFrame,
  rankForXp,
  SCHEDULE_WIN_RATE,
  spinReward,
  STREAK_FREEZE_LIMIT,
  updateStreak,
  XP_RANKS,
} from "../src/lab/core";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

console.log("\n── Conversion Lab: pure mechanics ──");

/* — FNV-1a — */

test("fnv1a: known vectors", () => {
  // Reference values computed with the standard FNV-1a 32-bit algorithm.
  assert.equal(fnv1a(""), 0x811c9dc5);
  assert.equal(fnv1a("a"), 0xe40c292c);
  assert.equal(fnv1a("abc"), 0x1a47e90b);
});

test("fnv1a: differs for different inputs, stable across calls", () => {
  const a = fnv1a("lab_anchoring:visitor-1");
  const b = fnv1a("lab_anchoring:visitor-2");
  assert.notEqual(a, b);
  assert.equal(a, fnv1a("lab_anchoring:visitor-1"));
});

/* — deterministic assignment — */

test("assignVariant: same visitor, same variant (stability)", () => {
  const exp = "lab_demo";
  const variants = ["control", "treatment"];
  for (let i = 0; i < 1000; i++) {
    const v = `visitor-${i}`;
    assert.equal(
      assignVariant(exp, v, variants),
      assignVariant(exp, v, variants)
    );
  }
});

test("assignVariant: 50/50 split holds across 10k visitors (±1.5%)", () => {
  const variants = ["control", "treatment"];
  let control = 0;
  const N = 10_000;
  for (let i = 0; i < N; i++) {
    if (assignVariant("lab_split", `visitor-${i}`, variants) === "control") control++;
  }
  const rate = control / N;
  assert.ok(Math.abs(rate - 0.5) < 0.015, `control rate ${rate} drifted from 0.5`);
});

test("assignVariant: weighted buckets (90/10) hold ±2%", () => {
  const variants = ["control", "treatment"];
  let treatment = 0;
  const N = 10_000;
  for (let i = 0; i < N; i++) {
    if (assignVariant("lab_weighted", `visitor-${i}`, variants, [90, 10]) === "treatment") treatment++;
  }
  const rate = treatment / N;
  assert.ok(Math.abs(rate - 0.1) < 0.02, `treatment rate ${rate} drifted from 0.1`);
});

test("assignVariant: experiments are independent (no cross-talk)", () => {
  const variants = ["control", "treatment"];
  let correlated = 0;
  const N = 5_000;
  for (let i = 0; i < N; i++) {
    const a = assignVariant("lab_a", `visitor-${i}`, variants);
    const b = assignVariant("lab_b", `visitor-${i}`, variants);
    if (a === b) correlated++;
  }
  const rate = correlated / N;
  // Independent hashes: co-assignment should sit near 50%.
  assert.ok(Math.abs(rate - 0.5) < 0.02, `co-assignment rate ${rate}`);
});

test("assignVariant: single variant always wins; empty throws", () => {
  assert.equal(assignVariant("lab_x", "v1", ["only"]), "only");
  assert.throws(() => assignVariant("lab_x", "v1", []));
});

/* — goal-gradient easing — */

test("goalGradientEase: endpoints, range, monotonic, accelerating tail", () => {
  assert.equal(goalGradientEase(0), 0);
  assert.equal(goalGradientEase(1), 1);
  let prev = -1;
  for (let p = 0; p <= 1.0001; p += 0.01) {
    const e = goalGradientEase(p);
    assert.ok(e >= 0 && e <= 1, `e(${p}) out of range: ${e}`);
    assert.ok(e >= prev - 1e-9, `not monotonic at ${p}`);
    prev = e;
  }
  // Near the end the bar renders ahead of the honest label (acceleration).
  assert.ok(goalGradientEase(0.9) > 0.9);
});

/* — reward schedules (seeded RNG so the math is deterministic) — */

/** LCG for reproducible "random" streams. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

test("spinReward: FR-1 always pays", () => {
  const rng = lcg(42);
  for (let i = 0; i < 500; i++) {
    assert.notEqual(spinReward("fr-1", rng).tier, "none");
  }
});

test("spinReward: VR-3 win rate ≈ 1/3 (±3σ)", () => {
  const rng = lcg(7);
  const N = 30_000;
  let wins = 0;
  for (let i = 0; i < N; i++) {
    if (spinReward("vr-3", rng).tier !== "none") wins++;
  }
  const p = wins / N;
  const sigma = Math.sqrt((1 / 3) * (2 / 3) / N);
  assert.ok(Math.abs(p - 1 / 3) < 3 * sigma, `VR-3 rate ${p}`);
});

test("spinReward: mega tier ≈ 8% of wins on VR-2", () => {
  const rng = lcg(99);
  const N = 20_000;
  let wins = 0;
  let megas = 0;
  for (let i = 0; i < N; i++) {
    const r = spinReward("vr-2", rng);
    if (r.tier !== "none") wins++;
    if (r.tier === "mega") megas++;
  }
  const p = wins / N;
  assert.ok(Math.abs(p - 0.5) < 0.02, `VR-2 rate ${p}`);
  const megaRate = megas / wins;
  assert.ok(Math.abs(megaRate - 0.08) < 0.01, `mega rate ${megaRate}`);
});

test("spinReward: VI pays only once eligible; window is 20–60s", () => {
  const rng = lcg(3);
  const early = spinReward("vi", rng, 0);
  assert.equal(early.tier, "none");
  assert.ok(early.cooldownMs >= 20_000 && early.cooldownMs <= 60_000);
  // 10 minutes elapsed — beyond any window the schedule can draw.
  const eligible = spinReward("vi", rng, 10 * 60 * 1000);
  assert.notEqual(eligible.tier, "none");
});

test("SCHEDULE_WIN_RATE table matches the implemented probabilities", () => {
  assert.equal(SCHEDULE_WIN_RATE["fr-1"], 1);
  assert.equal(SCHEDULE_WIN_RATE["vr-2"], 0.5);
  assert.ok(Math.abs(SCHEDULE_WIN_RATE["vr-3"] - 1 / 3) < 1e-9);
  assert.equal(SCHEDULE_WIN_RATE["vr-8"], 0.125);
});

/* — XP ladder — */

test("rankForXp / nextRank: boundaries", () => {
  assert.equal(rankForXp(0).name, "Listener");
  assert.equal(rankForXp(39).name, "Listener");
  assert.equal(rankForXp(40).name, "Curator");
  assert.equal(rankForXp(99).name, "Curator");
  assert.equal(rankForXp(100).name, "Program Director");
  assert.equal(rankForXp(180).name, "Station Owner");
  assert.equal(rankForXp(9999).name, "Station Owner");
  assert.equal(nextRank(0)?.name, "Curator");
  assert.equal(nextRank(40)?.name, "Program Director");
  assert.equal(nextRank(180), null);
  assert.equal(XP_RANKS.length, 4);
});

/* — streak rules — */

test("updateStreak: completes grow the chain, best is sticky", () => {
  let s = { current: 0, best: 0, freezesUsed: 0, lastDoneDay: null };
  s = updateStreak(s, "2026-08-10", "2026-08-09", true); // day 1
  assert.equal(s.current, 1);
  s = updateStreak(s, "2026-08-11", "2026-08-10", true); // day 2
  assert.equal(s.current, 2);
  assert.equal(s.best, 2);
  // skip a day then break: best stays
  s = updateStreak(s, "2026-08-12", "2026-08-11", false); // miss (freeze)
  s = updateStreak(s, "2026-08-13", "2026-08-12", false); // second miss breaks
  assert.equal(s.current, 0);
  assert.equal(s.best, 2);
});

test("updateStreak: freeze token saves exactly one missed day", () => {
  const base = { current: 3, best: 3, freezesUsed: 0, lastDoneDay: "2026-08-11" };
  const frozen = updateStreak(base, "2026-08-12", "2026-08-11", false);
  assert.equal(frozen.current, 3, "chain survives one miss");
  assert.equal(frozen.freezesUsed, 1);
  const broken = updateStreak(frozen, "2026-08-13", "2026-08-12", false);
  assert.equal(broken.current, 0, "second miss breaks the chain");
  assert.equal(broken.freezesUsed, STREAK_FREEZE_LIMIT);
});

test("updateStreak: non-consecutive completion restarts at 1", () => {
  let s = { current: 5, best: 5, freezesUsed: 0, lastDoneDay: "2026-08-01" };
  s = updateStreak(s, "2026-08-10", "2026-08-09", true);
  assert.equal(s.current, 1);
  assert.equal(s.best, 5, "best is preserved");
});

/* — collection framing — */

test("collectionStats: pct, remaining, near-complete kick", () => {
  const items = [
    { id: "a", label: "A", collected: true },
    { id: "b", label: "B", collected: false },
    { id: "c", label: "C", collected: false },
  ];
  const s = collectionStats(items);
  assert.equal(s.pct, 1 / 3);
  assert.equal(s.remaining, 2);
  assert.equal(s.nearComplete, false);
  const almost = collectionStats([
    { id: "a", label: "A", collected: true },
    { id: "b", label: "B", collected: true },
    { id: "c", label: "C", collected: true },
    { id: "d", label: "D", collected: false },
  ]);
  assert.equal(almost.nearComplete, true);
  assert.equal(almost.label, "One piece left to complete your kit");
});

/* — anchoring presentation helpers (price math never changes) — */

test("anchorStack keeps the price last; perDayFrame is honest", () => {
  assert.deepEqual(anchorStack(20, [742, 49]), ["$742", "$49", "$20"]);
  assert.equal(perDayFrame(20, 365), "$0.05/day");
  assert.equal(perDayFrame(1, 365), "less than 1¢/day");
});

console.log(`\n✔ ${passed} pure-mechanics tests passed.\n`);
