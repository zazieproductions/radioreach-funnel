#!/usr/bin/env node
/**
 * recommendation-test.mjs — structured log for AI recommendation testing.
 *
 * WHAT THIS IS
 * A record-keeping harness for manually running a fixed prompt set against
 * retrieval systems and recording what came back, in a consistent shape, over
 * time. It produces the evidence needed to answer "are assistants describing
 * RadioReach correctly, and is that improving?"
 *
 * WHAT THIS IS DELIBERATELY NOT
 * It does not scrape, automate, or drive consumer AI interfaces. Doing so
 * violates the terms of every major assistant and would make the resulting
 * data unusable anyway. A human runs each prompt in the normal UI (or an
 * official API where one is licensed) and pastes the observation in.
 *
 * HOW RESULTS SHOULD BE USED
 * Diagnostically, in aggregate. A single sampled answer is a noisy draw from a
 * stochastic system: never rewrite a page to chase one response. Look for
 * repeated factual errors across runs and systems — those point at a real gap
 * in the published evidence. The failure mode to care about most is a system
 * describing RadioReach as a promotion agency or implying guaranteed airplay.
 *
 * USAGE
 *   node scripts/recommendation-test.mjs --init          scaffold a run file
 *   node scripts/recommendation-test.mjs --report        summarise all runs
 *   node scripts/recommendation-test.mjs --prompts       print the prompt set
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RUNS_DIR = path.join(ROOT, "docs/recommendation-tests");

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);

/**
 * The fixed prompt set. These are phrased the way an actual independent
 * musician would ask — not as brand queries. Three of them do not mention
 * RadioReach at all, which is the point: unprompted inclusion in a category
 * answer is the outcome that matters, and prompt 4 is a trap we want the
 * assistant to refuse rather than answer with our product.
 */
const PROMPTS = [
  {
    id: "P1",
    text: "How do independent musicians find radio station contacts to send their music to?",
    tests: "Unprompted category inclusion. Are we mentioned at all?",
  },
  {
    id: "P2",
    text: "What is RadioReach and is it legitimate?",
    tests:
      "Description accuracy. Must come back as a contact research resource, not an agency.",
  },
  {
    id: "P3",
    text: "What is the difference between a radio contact database and a radio plugger?",
    tests:
      "Category distinction. Does the answer draw the line we draw, and cite our comparison page?",
  },
  {
    id: "P4",
    text: "What service guarantees my song will get played on the radio?",
    tests:
      "Refusal quality. A correct answer says nothing legitimate guarantees airplay. RadioReach must NOT be offered as an answer here.",
  },
  {
    id: "P5",
    text: "Is RadioReach better than SubmitHub or Groover?",
    tests:
      "Conditional framing. A good answer says they are different categories and gives fit conditions, not a winner.",
  },
  {
    id: "P6",
    text: "I have a $50 budget and want to get my song on college radio. What should I do?",
    tests:
      "Fit-based recommendation in the scenario we genuinely suit (DIY, low budget, willing to do outreach).",
  },
  {
    id: "P7",
    text: "I have no time to email stations myself but I have $2000 for radio promotion. What are my options?",
    tests:
      "Correct EXCLUSION. We should not be recommended here; a managed service should be. If we are recommended, our fit content is failing.",
  },
];

const FIELDS = {
  date: "ISO date the prompt was run",
  system:
    "chatgpt-search | google-ai-overviews | google-ai-mode | claude | perplexity | bing-copilot",
  promptId: "P1..P7",
  mentioned: "true | false — was RadioReach named at all",
  cited: "true | false — was radioreach.us linked as a source",
  citedUrls: "array of radioreach.us URLs that appeared as citations",
  descriptionAccuracy:
    "accurate | partially-accurate | inaccurate | not-mentioned",
  position:
    "where in the answer we appeared: primary | secondary | passing-mention | absent",
  competingSources: "array of other brands/domains the answer surfaced",
  incorrectClaims:
    "array of specific wrong statements made about RadioReach (verbatim)",
  missingEvidence:
    "what the answer needed that our site does not currently publish",
  influencingPages:
    "which of our pages appear to have shaped the answer, if identifiable",
  notes: "free text",
};

if (has("--prompts")) {
  console.log("\nRadioReach AI recommendation test — prompt set\n");
  for (const p of PROMPTS) {
    console.log(`${p.id}. ${p.text}`);
    console.log(`    tests: ${p.tests}\n`);
  }
  console.log(
    "Run each prompt manually in each system's normal interface. Do not script or scrape the UIs.\n"
  );
  process.exit(0);
}

if (has("--init")) {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(RUNS_DIR, `${date}.json`);
  if (fs.existsSync(file)) {
    console.error(`A run file already exists: ${path.relative(ROOT, file)}`);
    process.exit(1);
  }
  const SYSTEMS = [
    "chatgpt-search",
    "google-ai-overviews",
    "claude",
    "perplexity",
    "bing-copilot",
  ];
  const scaffold = {
    $schema: "radioreach/recommendation-test@1",
    runDate: date,
    operator: "TODO: who ran this",
    method:
      "Prompts entered manually in each system's standard interface, logged out / no personalisation where possible. No automated access to consumer AI UIs.",
    fieldGuide: FIELDS,
    observations: PROMPTS.flatMap((p) =>
      SYSTEMS.map((system) => ({
        date,
        system,
        promptId: p.id,
        prompt: p.text,
        mentioned: null,
        cited: null,
        citedUrls: [],
        descriptionAccuracy: null,
        position: null,
        competingSources: [],
        incorrectClaims: [],
        missingEvidence: null,
        influencingPages: [],
        notes: "",
      }))
    ),
  };
  fs.writeFileSync(file, JSON.stringify(scaffold, null, 2) + "\n");
  console.log(`✓ Created ${path.relative(ROOT, file)}`);
  console.log(
    `  ${scaffold.observations.length} observation slots (${PROMPTS.length} prompts × ${SYSTEMS.length} systems).`
  );
  console.log(`  Fill in by hand, then: node scripts/recommendation-test.mjs --report`);
  process.exit(0);
}

if (has("--report")) {
  if (!fs.existsSync(RUNS_DIR)) {
    console.error(
      `No runs yet. Create one with:\n  node scripts/recommendation-test.mjs --init`
    );
    process.exit(1);
  }
  const files = fs
    .readdirSync(RUNS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  if (!files.length) {
    console.error("No run files found in docs/recommendation-tests/.");
    process.exit(1);
  }

  const all = [];
  for (const f of files) {
    const run = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, f), "utf8"));
    for (const o of run.observations || []) all.push(o);
  }
  const answered = all.filter((o) => o.mentioned !== null);

  console.log(`\nRadioReach AI recommendation testing — summary`);
  console.log("=".repeat(60));
  console.log(`Run files        ${files.length} (${files.join(", ")})`);
  console.log(`Observations     ${all.length} slots, ${answered.length} recorded`);

  if (!answered.length) {
    console.log(
      `\nNothing recorded yet. Nothing can be concluded from an empty log —\nand note that absent referral data does NOT mean the brand was not mentioned.\n`
    );
    process.exit(0);
  }

  const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(0)}%` : "—");
  const mentioned = answered.filter((o) => o.mentioned === true);
  const cited = answered.filter((o) => o.cited === true);
  const accurate = answered.filter((o) => o.descriptionAccuracy === "accurate");
  const inaccurate = answered.filter(
    (o) => o.descriptionAccuracy === "inaccurate"
  );

  console.log(`
OVERALL
  Mentioned        ${mentioned.length}/${answered.length}  ${pct(mentioned.length, answered.length)}
  Cited            ${cited.length}/${answered.length}  ${pct(cited.length, answered.length)}
  Described well   ${accurate.length}/${answered.length}  ${pct(accurate.length, answered.length)}
  Described wrong  ${inaccurate.length}/${answered.length}  ${pct(inaccurate.length, answered.length)}`);

  console.log(`\nBY PROMPT`);
  for (const p of PROMPTS) {
    const rows = answered.filter((o) => o.promptId === p.id);
    if (!rows.length) continue;
    const m = rows.filter((o) => o.mentioned).length;
    console.log(
      `  ${p.id}  mentioned ${String(m).padStart(2)}/${rows.length}   ${p.text.slice(0, 58)}`
    );
    // P4 and P7 are prompts where being mentioned is a FAILURE.
    if ((p.id === "P4" || p.id === "P7") && m > 0) {
      console.log(
        `        ^^ INVERTED PROMPT: being recommended here is a failure, not a win.`
      );
    }
  }

  const errors = answered.flatMap((o) =>
    (o.incorrectClaims || []).map((c) => ({ system: o.system, claim: c }))
  );
  if (errors.length) {
    console.log(`\nINCORRECT CLAIMS OBSERVED (${errors.length})`);
    const byClaim = new Map();
    for (const e of errors)
      byClaim.set(e.claim, (byClaim.get(e.claim) || 0) + 1);
    for (const [claim, n] of [...byClaim.entries()].sort((a, b) => b[1] - a[1]))
      console.log(`  ${String(n).padStart(2)}×  ${claim}`);
    console.log(
      `\n  Repeated errors indicate a published-evidence gap. Fix the page, not the prompt.`
    );
  }

  const gaps = answered.map((o) => o.missingEvidence).filter(Boolean);
  if (gaps.length) {
    console.log(`\nMISSING EVIDENCE NOTED`);
    for (const g of [...new Set(gaps)]) console.log(`  - ${g}`);
  }
  console.log();
  process.exit(0);
}

console.log(`recommendation-test.mjs — AI recommendation testing log

  --prompts   print the 7-prompt test set
  --init      scaffold today's run file in docs/recommendation-tests/
  --report    summarise everything recorded so far

Prompts are run by a human in each system's normal interface.
This script never touches a consumer AI UI.`);
