/* ─────────────────────────────────────────────────────────────
   PERSUASION STUDY — structural invariants
   ─────────────────────────────────────────────────────────────
   The study makes load-bearing claims about itself in its own
   copy ("every path is approved", "the bar never hits 100%
   mid-quiz", "nothing is transmitted"). These tests hold the
   code to those claims, so the research write-up can cite them.

     npm run test:study
───────────────────────────────────────────────────────────── */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { PATTERNS, PATTERNS_BY_ID } from "../src/study/annotations.ts";

const qualify = readFileSync("src/study/stages/Qualify.tsx", "utf8");

test("every path through the quiz approves — no fail branch exists", () => {
  // Extract the weights per question from the source of truth.
  const blocks = qualify.split(/\{\s*id: "/).slice(1);
  const perQuestion = blocks
    .filter((b) => b.includes("choices:"))
    .map((b) => [...b.matchAll(/weight:\s*(\d+)/g)].map((m) => Number(m[1])));

  assert.equal(perQuestion.length, 4, "four questions");
  const min = perQuestion.reduce((n, w) => n + Math.min(...w), 0);
  const max = perQuestion.reduce((n, w) => n + Math.max(...w), 0);
  const threshold = Number(/APPROVAL_THRESHOLD = (\d+)/.exec(qualify)![1]);

  console.log(`   score range ${min}–${max}, threshold ${threshold}`);
  assert.ok(min > threshold, "the worst possible score still clears the gate");
  // No control-flow branch anywhere sends the visitor somewhere other than
  // the approved result. Strip comments + string literals so explanatory
  // copy about the absence of a fail state can't be mistaken for one.
  const code = qualify
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
  assert.ok(!/\b(reject|denied|disqualif|setPhase\(\s*""\s*fail)/i.test(code),
    "no rejection branch in executable code");
  assert.equal([...code.matchAll(/setPhase\(/g)].length, 3,
    "exactly three phase transitions: lead, analysis, result — none of them a failure");
});

test("progress bar is a fiction: never 100% mid-quiz, hard-set later", () => {
  assert.ok(qualify.includes("(step / (QUESTIONS.length + 1)) * 100"),
    "quiz phase uses the phantom +1 step");
  for (let step = 0; step < 4; step++) {
    const pct = (step / (4 + 1)) * 100;
    assert.ok(pct < 100, `step ${step} shows ${pct}% (<100)`);
  }
  assert.match(qualify, /phase === "lead"\s*\?\s*85/, "lead phase hard-sets 85%");
  console.log("   quiz 0/20/40/60/80 → lead 85 → result 100");
});

test("pattern ledger is complete and internally consistent", () => {
  assert.ok(PATTERNS.length >= 20, `${PATTERNS.length} patterns catalogued`);
  for (const p of PATTERNS) {
    for (const f of ["mechanic", "psychology", "evidence"] as const) {
      assert.ok(p[f] && p[f].length > 40, `${p.id}.${f} is substantive`);
    }
    for (const f of ["exposure", "honestVersion"] as const) {
      // Two benign patterns legitimately have a one-line answer here.
      assert.ok(p[f] && p[f].length > 15, `${p.id}.${f} is present`);
    }
    assert.ok(p.severity >= 1 && p.severity <= 5);
    assert.ok(p.stages.length > 0, `${p.id} is mapped to a stage`);
  }
  console.log(`   ${PATTERNS.length} patterns, all with mechanic/psychology/evidence/exposure/honest`);
});

test("every pattern referenced by the UI exists in the ledger", () => {
  const files = [
    "src/study/chrome.tsx", "src/study/stages/Hook.tsx", "src/study/stages/Reveal.tsx",
    "src/study/stages/Qualify.tsx", "src/study/stages/CheckoutStage.tsx",
    "src/study/stages/Upsell.tsx", "src/study/stages/ThankYou.tsx",
  ];
  const used = new Set<string>();
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/pattern="([a-z_]+)"/g)) used.add(m[1]);
    for (const m of src.matchAll(/trip\(\s*"([a-z_]+)"/g)) used.add(m[1]);
  }
  for (const id of used) assert.ok(PATTERNS_BY_ID[id], `unknown pattern id: ${id}`);
  console.log(`   ${used.size} distinct pattern ids referenced, all resolve`);
});

test("no payment provider, network call, or storage escape in the study", () => {
  const files = ["flag.ts","state.ts","chrome.tsx","Annotate.tsx","StudyFunnel.tsx","LedgerDrawer.tsx","annotations.ts"]
    .map((f) => `src/study/${f}`)
    .concat(["Hook","Reveal","Qualify","CheckoutStage","Upsell","ThankYou"].map((f) => `src/study/stages/${f}.tsx`));
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    assert.ok(!/\bfetch\(|XMLHttpRequest|sendBeacon|axios/.test(src), `${f} makes no network call`);
    assert.ok(!/stripe|Stripe/.test(src), `${f} imports no payment provider`);
    assert.ok(!/localStorage\.setItem/.test(src) || f.endsWith("flag.ts"), `${f} does not persist beyond the tab`);
  }
  console.log("   no fetch / beacon / stripe / localStorage writes anywhere in the study");
});

test("the funnel is gated off production by default", () => {
  const flag = readFileSync("src/study/flag.ts", "utf8");
  assert.ok(flag.includes('VITE_STUDY_ENABLED === "true"'), "prod requires explicit opt-in");
  const app = readFileSync("src/App.tsx", "utf8");
  assert.ok(app.includes("if (!isStudyEnabled())"), "route checks the flag before mounting");
  console.log("   #/study renders a stub unless dev or VITE_STUDY_ENABLED=true");
});
