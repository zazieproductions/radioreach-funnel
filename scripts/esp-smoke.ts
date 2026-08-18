/* ─────────────────────────────────────────────────────────────
   ESP brain smoke test — pure logic, no DOM required.
   Run with:
     npx esbuild scripts/esp-smoke.ts --bundle --platform=node \
       --format=esm --outfile=/tmp/esp-smoke.mjs && node /tmp/esp-smoke.mjs
───────────────────────────────────────────────────────────── */

import { decideMode, ingest, tick, getBrainState } from "../src/esp/brain";
import { espStore } from "../src/esp/store";
import type { EmotionalMode } from "../src/esp/types";
import {
  FOCUS,
  emptyHysteresis,
  lingerThresholdFor,
  pickFocus,
  qualifyCluster,
  stepFocus,
  type ClusterSnapshot,
  type FocusIntent,
} from "../src/esp/focus";

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`}`);
  if (!ok) failures++;
}

type Decision = ReturnType<typeof decideMode>["decision"];

function freshDecision(): Decision {
  return { current: "default", pending: null, pendingSince: 0, lastSwitch: -Infinity };
}

const SCORES = (calm: number, aspire: number, urgency: number) => ({
  calm,
  aspire,
  urgency,
});

/* ── 1. Pure decision function ── */

// Quiet page: nothing clears the threshold → default, no pending.
{
  let d = freshDecision();
  const r1 = decideMode(SCORES(1, 1, 1), d, 1000);
  check("quiet scores → default", r1.mode, "default");
  d = r1.decision;

  // A clear, sustained lead eventually switches.
  let now = 1000;
  for (let i = 0; i < 5; i++) {
    now += 200;
    const r = decideMode(SCORES(0, 0, 6), d, now);
    d = r.decision;
  }
  check("sustained urgency lead → urgency", d.current, "urgency");
}

// Contradictory signals (close top two) → fall back to default.
{
  let d = freshDecision();
  let now = 1000;
  for (let i = 0; i < 6; i++) {
    now += 200;
    d = decideMode(SCORES(5, 0.5, 4.5), d, now).decision;
  }
  check("close margin (0.5 < 0.75) → default", d.current, "default");
}

// A candidate that doesn't hold for confirmMs never switches.
{
  let d = freshDecision();
  d = decideMode(SCORES(6, 0, 0), d, 1000).decision; // pending = calm
  d = decideMode(SCORES(0, 6, 0), d, 1300).decision; // pending flips to aspire (<500ms)
  check("candidate flip before confirm → default", d.current, "default");
}

// Cooldown throttles switching between emotional modes…
{
  let d = freshDecision();
  let now = 1000;
  for (let i = 0; i < 5; i++) {
    now += 200;
    d = decideMode(SCORES(6, 0, 0), d, now).decision;
  }
  check("first switch → calm", d.current, "calm");
  // Immediate rival lead, held past confirm, but within cooldown.
  for (let i = 0; i < 5; i++) {
    now += 200;
    d = decideMode(SCORES(0, 0, 6), d, now).decision;
  }
  check("rival within 8s cooldown → still calm", d.current, "calm");
  // After cooldown expires the pending rival switches.
  for (let i = 0; i < 45; i++) {
    now += 200;
    d = decideMode(SCORES(0, 0, 6), d, now).decision;
  }
  check("after cooldown → urgency", d.current, "urgency");
}

// …but falling back to default skips the cooldown.
{
  let d: Decision = { ...freshDecision(), current: "calm", lastSwitch: 5000 };
  let now = 5000;
  for (let i = 0; i < 5; i++) {
    now += 200;
    d = decideMode(SCORES(0.5, 0.5, 0.5), d, now).decision;
  }
  check("decayed scores fall back to default immediately", d.current, "default");
}

/* ── 2. Integration: signals → scores → mode ── */

// Frustration cluster: rage clicks + fast scroll + reversals.
{
  let t = 100_000;
  const step = (ms: number) => {
    t += ms;
    tick(t, ms);
  };
  ingest({ kind: "rage_click", at: t });
  ingest({ kind: "fast_scroll", at: t });
  ingest({ kind: "scroll_reversal", at: t });
  check("frustration cluster → calm score 7.5", getBrainState().scores.calm, 7.5);
  for (let i = 0; i < 4; i++) step(500);
  check("frustration flips page to calm", espStore.getMode() as EmotionalMode, "calm");

  // No new signals → decay → default again.
  for (let i = 0; i < 240; i++) step(500); // ~2 minutes
  check("quiet page decays back to default", espStore.getMode() as EmotionalMode, "default");
}

// Urgency cluster: repeated pricing/scarcity returns + idle at price.
{
  let t = 300_000;
  const step = (ms: number) => {
    t += ms;
    tick(t, ms);
  };
  ingest({ kind: "zone_revisit", zone: "pricing", at: t });
  ingest({ kind: "zone_revisit", zone: "scarcity", at: t });
  ingest({ kind: "idle", zone: "scarcity", at: t });
  for (let i = 0; i < 4; i++) step(500);
  check("price hesitation flips page to urgency", espStore.getMode() as EmotionalMode, "urgency");
  // 3 minutes of stillness → decay → default.
  for (let i = 0; i < 360; i++) step(500);
  check("urgency decays back to default", espStore.getMode() as EmotionalMode, "default");
}

// Thoughtful reader: deliberate reading + proof dwell.
{
  let t = 700_000;
  const step = (ms: number) => {
    t += ms;
    tick(t, ms);
  };
  ingest({ kind: "deliberate_read", at: t });
  ingest({ kind: "deliberate_read", at: t });
  ingest({ kind: "zone_dwell", zone: "proof", at: t });
  for (let i = 0; i < 4; i++) step(500);
  check("deliberate reader flips page to aspire", espStore.getMode() as EmotionalMode, "aspire");
}

/* ── 3. Decision-point focus ── */

const quietIntent = (): FocusIntent => ({
  espMode: "default",
  urgencyScore: 0,
  recentCtaHover: false,
  pageEngaged: false,
});

const cluster = (partial: Partial<ClusterSnapshot> & Pick<ClusterSnapshot, "id">): ClusterSnapshot => ({
  visibleRatio: 1,
  hovered: false,
  hoveredFor: 0,
  focused: false,
  near: false,
  nearFor: 0,
  revisits: 0,
  visibleMs: 0,
  eager: false,
  scrolling: false,
  lingerThreshold: lingerThresholdFor(partial.id, !!partial.eager, false),
  ...partial,
});

{
  check(
    "hero first view never lingers",
    qualifyCluster(cluster({ id: "hero", visibleMs: 20_000, lingerThreshold: 0 }), quietIntent()),
    null
  );
  check(
    "hero hover (armed) qualifies",
    qualifyCluster(cluster({ id: "hero", hovered: true, hoveredFor: FOCUS.hoverArmMs }), quietIntent()),
    "hover"
  );
  check(
    "hero hover (too brief) ignored",
    qualifyCluster(cluster({ id: "hero", hovered: true, hoveredFor: 80 }), quietIntent()),
    null
  );
  check(
    "hero revisit qualifies",
    qualifyCluster(cluster({ id: "hero", revisits: 1 }), quietIntent()),
    "revisit"
  );
  check(
    "scrolling blocks linger",
    qualifyCluster(
      cluster({ id: "stack", visibleMs: 10_000, lingerThreshold: FOCUS.lingerMs, scrolling: true }),
      quietIntent()
    ),
    null
  );
  check(
    "stack linger after a pause",
    qualifyCluster(
      cluster({ id: "stack", visibleMs: FOCUS.lingerMs, lingerThreshold: FOCUS.lingerMs }),
      quietIntent()
    ),
    "linger"
  );
  check(
    "urgency + visible mid-page CTA",
    qualifyCluster(cluster({ id: "final" }), { ...quietIntent(), espMode: "urgency", pageEngaged: true }),
    "urgency"
  );
  check(
    "urgency does not steal first-view hero",
    qualifyCluster(cluster({ id: "hero" }), { ...quietIntent(), espMode: "urgency", pageEngaged: false }),
    null
  );
}

{
  const hero = cluster({ id: "hero", hovered: true, hoveredFor: 400 });
  const stack = cluster({ id: "stack", visibleMs: 10_000, lingerThreshold: FOCUS.lingerMs });
  const picked = pickFocus([hero, stack], quietIntent(), null);
  check("pointer wins over linger", picked.id, "hero");
  check("pointer reason is hover", picked.reason, "hover");
}

{
  let h = emptyHysteresis();
  h = stepFocus("stack", "linger", h, 1000);
  check("linger starts pending, not current", h.current, null);
  h = stepFocus("stack", "linger", h, 1000 + FOCUS.enterConfirmMs);
  check("linger confirms after hold", h.current, "stack");

  h = stepFocus("hero", "hover", h, 2000);
  check("hover enters instantly", h.current, "hero");

  h = stepFocus(null, null, h, 2500);
  check("exit waits (still hero)", h.current, "hero");
  h = stepFocus(null, null, h, 2500 + FOCUS.exitConfirmMs);
  check("exit confirms after hold", h.current, null);
}

console.log(failures === 0 ? "\nAll ESP smoke tests passed." : `\n${failures} test(s) FAILED.`);
if (failures > 0) process.exitCode = 1;
