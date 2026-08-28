/**
 * Build the Frequency Dominion fulfillment zip from tracked source.
 *
 *   npm run build:fd
 *
 * Everything in the zip is generated from src/course/* (single source of
 * truth: curriculum, worked example, asset registry) plus static files in
 * fulfillment/courses/frequency-dominion/src/. The staging folder is
 * committed so the zip is never a mystery binary — but this script can
 * regenerate every byte of it, then rebuild the zip deterministically.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

import { COURSE, MODULES, allLessons, courseStats } from "../src/course/curriculum";
import { EMAIL_SEQUENCE, SMS_SEQUENCE } from "../src/course/lifecycle";
import { EXAMPLE_DISCLAIMER, exampleFor } from "../src/course/workedExample";
import {
  ARTIST,
  AUDIT,
  IDENTITY_DRAFTS,
  LOG,
  PINNED_IDENTITY,
  PITCH_90,
  PROOF_STACK,
  SUBJECT_LINES,
  TOUCH_2,
  TOUCH_3,
  WAR_ROOM,
  CUT_AT_SCORING,
  CLOCK_NOTES,
  ROUTE,
  WEEK_0,
  CALL_SCRIPT,
  INTERVIEW_ANSWERS,
  THANK_YOU,
  SOCIAL_POST,
  APOLOGY,
  EPK_FACTS,
  AUDIO_MANIFEST,
  LEDGER,
  VENUE_EMAIL,
  CLIENT_EMAIL,
  RELEASE_MAP,
} from "../src/course/workedExample";
import { FD_FILES } from "../src/course/assets";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "fulfillment", "courses", "frequency-dominion", "src");
const ZIP_PATH = path.join(ROOT, "fulfillment", "courses", "frequency-dominion", "frequency-dominion-course.zip");
const TOP = "frequency-dominion";

const stats = courseStats();

function write(rel: string, content: string) {
  const abs = path.join(SRC_DIR, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content.endsWith("\n") ? content : content + "\n");
}

/* ── START_HERE ─────────────────────────────────────────────── */

write(
  "START_HERE.md",
  `# FREQUENCY DOMINION — START HERE
## The 21-Day Radio Campaign Operating System
### RadioReach · radioreach.us

**This is not a vibe. This is a calendar.** Four moves and the machine is running:

1. **Print the war room.** \`workbooks/WB02-20-station-war-room.md\` — 20 stations, scored, on your wall. Then print \`calendar/21-day-calendar.html\` and put it next to it.
2. **Finish Module 01** before you send a single email: identity sentence, clock-fit edit, 4-line proof stack, the no-spam oath. (\`01-command-identity/\`)
3. **Load 20 stations, not 2,000.** Extract from the Vault, score 0–5, cut the 0–1s. (\`02-target-architecture/\`)
4. **Run the 21 days.** Day 1: ten sends. Day 8: the 30-second hook. Day 14: new info only. Day 21: close, audit, clone market two. Log every send in \`logs/send-log-template.csv\`.

**Stuck on a campaign day?** Open the classroom, set the day selector in the header, and it tells you exactly what to do: https://radioreach.us/#/course/classroom

## Read the worked example first (30 minutes, worth it)

\`worked-example/\` is one fictional artist — **${ARTIST.name}, ${ARTIST.tag}, ${ARTIST.city}** — run through every step end to end: the 20-station war room, the 88-word pitch, Touch 2/3, the thank-yous, and the honest 21-day log (${AUDIT.sends} sends · ${AUDIT.humanReplies} replies · ${AUDIT.adds} add · ${AUDIT.interviews} interview · ${AUDIT.cleanNos} clean no · ${AUDIT.burnedWells} burned wells). Copy the *structure*, never the facts.

> ${EXAMPLE_DISCLAIMER}

## Folder map

| Folder | Contents |
| --- | --- |
| \`01\`–\`06\` | ${stats.lessonCount} lesson scripts (${stats.scriptWords.toLocaleString("en-US")} words · ~${stats.spokenMinutes} min spoken) with VO scripts, on-screen beats, drills, failure→fix, worked examples |
| \`worked-example/\` | The complete example campaign: artist file, war room, pitch pack, 21-day log |
| \`workbooks/\` | WB01–WB05 blank templates **+ filled example versions** in \`workbooks/examples/\` |
| \`swipe-file/\` | 9 copy-paste swipes: subject lines, 90-word pitch, 3-touch, 20-sec call, interview answers, thank-you, burned-well apology, venue email, client email |
| \`calendar/\` | 21-day calendar as markdown **and** printable HTML one-pager (print CSS) |
| \`epk/\` | EPK one-sheet HTML — template + filled example (open → print to PDF) |
| \`logs/\` | Send-log CSV headers + a 22-row example from the worked campaign |
| \`sequences/\` | Self-nurture email + SMS copy (Day 0 → Day 21) — you are the operator |
| \`assets/\` | Course cover (${COURSE.name}) |

## Rules that keep this legal and useful

- Targeted, named, human outreach only. No BCC markets. No "Hi there." One ask.
- You are responsible for CAN-SPAM, GDPR, CASL, and each station's submission policy. Read them. Honor opt-outs instantly.
- **Airplay is not guaranteed.** This is a campaign operating system, not a spin machine. The worked example's numbers are honest on purpose — silence is data.
- No purchased play, no fake adds, no invented proof. Truth is the strategy.

© 2026 RadioReach. All rights reserved. Licensed to the original purchaser for personal campaign use.
`
);

/* ── LICENSE ────────────────────────────────────────────────── */

write(
  "LICENSE.txt",
  `FREQUENCY DOMINION — LICENSE (PURCHASER)

Copyright © 2026 RadioReach. All rights reserved.

You may:
- Use these materials for your own artist, label, or client radio campaigns.
- Print workbooks, calendars, and EPK one-sheets for personal use.
- Adapt templates with YOUR facts (never fabricate adds, quotes, or airplay).

You may not:
- Resell, share, or upload this zip or its contents.
- Scrape, blast, or automate spam against the Radio Reach Vault or any list.
- Claim RadioReach guarantees airplay, income, or replies.

The worked example (artist "${ARTIST.name}", all stations, humans, shows, venues,
outlets, and numbers) is fictional training material. Real contacts come from
your Vault; real proof comes from your own true facts.

Results vary. Contacts change — verify before you send. Educational templates
are not legal advice. You are responsible for CAN-SPAM, GDPR, CASL, and each
station's submission policies.
`
);

/* ── Module + lesson files ──────────────────────────────────── */

const moduleIntros: Record<string, string> = {
  m1: "Module 01 is the gate. Nobody sends until the identity sentence is pinned, the clock fits, the proof is true, and the oath is signed.",
  m2: "Module 02 turns geography into a plan: heat map, tour pre-roll, 0–5 scoring, and the 20-station war room you can actually work.",
  m3: "Module 03 builds the weapons: subject lines that survive 1.4 seconds, the 90-word pitch, the one-page EPK, and radio-ready audio.",
  m4: "Module 04 is the campaign: Week 0 loads it, Days 1–7 fire it, Days 8–14 follow up, Days 15–21 convert, close, and clone.",
  m5: "Module 05 is the human layer: the 20-second call, interviews that book the next spin, the thank-you economy, and burned-well repair.",
  m6: "Module 06 is the loop: the proof ledger, airplay→income routing, the T-minus release calendar, and the 90-day review.",
};

/** Module folders keep the original zip's paths (drop a leading "The ") so any
 *  existing reference to the legacy structure still resolves after a rebuild. */
const moduleSlug = (m: { n: string; title: string }) =>
  `${m.n}-${m.title.replace(/^The /i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

for (const m of MODULES) {
  const slug = moduleSlug(m);
  write(
    `${slug}/00-MODULE.md`,
    `# MODULE ${m.n} — ${m.title.toUpperCase()}

> ${m.promise}

${moduleIntros[m.id]}

| # | Lesson | Spoken | Drill |
|---|--------|:------:|-------|
${m.lessons.map((l, i) => `| ${String(i + 1).padStart(2, "0")} | [${l.title}](${String(i + 1).padStart(2, "0")}-${l.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.md) | ~${Math.max(8, Math.round(l.script.split(/\s+/).length / 135))} min | ${l.drill} |`).join("\n")}
`
  );

  m.lessons.forEach((l, i) => {
    const words = l.script.split(/\s+/).filter(Boolean).length;
    const spoken = Math.max(8, Math.round(words / 135));
    const ex = exampleFor(l.id);
    write(
      `${slug}/${String(i + 1).padStart(2, "0")}-${l.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.md`,
      `# ${l.id.toUpperCase()} — ${l.title}

**Module ${m.n} · ${m.title}** · ${l.minutes} min lesson (${words.toLocaleString("en-US")} words of spoken script ≈ ${spoken} min at teleprompter pace)${l.dayOf ? ` · **${l.dayOf}**` : ""}

**Outcome:** ${l.outcome}

---

## Voiceover script (read this one — teleprompter / VO)

${l.script.split("\n").join("\n\n")}

---

## On screen

${l.beats.map((b) => `- ${b}`).join("\n")}

## Drill — done when

${l.drill}

**Done when:** ${l.doneWhen}
${l.template ? `\n### Template\n\n\`\`\`\n${l.template}\n\`\`\`\n` : ""}
## Common failure → fix

**Fails:** ${l.failure.fail}

**Fix:** ${l.failure.fix}
${l.files?.length ? `\n## Files for this lesson\n\n${l.files.map((f) => `- \`${f}\``).join("\n")}\n` : ""}
---

${ex ? `## Worked example — ${ARTIST.name}\n\n### ${ex.title}\n${ex.note ? `\n*${ex.note}*\n` : ""}\n${ex.body.join("\n\n").replace(/\n{3,}/g, "\n\n")}\n\n> ${EXAMPLE_DISCLAIMER}\n` : ""}
---
*Frequency Dominion · RadioReach — no spam, no purchased play, no guaranteed airplay.*
`
    );
  });
}

/* ── Worked example files ───────────────────────────────────── */

write(
  "worked-example/00-artist-file.md",
  `# THE WORKED EXAMPLE — ARTIST FILE

> ${EXAMPLE_DISCLAIMER}

| Field | Value |
|---|---|
| Artist | ${ARTIST.name} |
| Genre | ${ARTIST.tag} (midnight-synth) |
| City | ${ARTIST.city} (${ARTIST.scene}) |
| Single | "${ARTIST.song}" — ${ARTIST.runtime} · ${ARTIST.hook} |
| Local date | ${ARTIST.showDate} · ${ARTIST.venue} |
| Campaign window | ${ARTIST.campaignWindow} |
| Audience | ${ARTIST.audience} |
| One-liner | ${ARTIST.oneLiner} |

## The identity sentence (five drafts, one survivor)

${IDENTITY_DRAFTS.map((d) => `**Draft ${d.draft}:** "${d.text}"\n→ ${d.verdict}`).join("\n\n")}

**Pinned:** "${PINNED_IDENTITY}"

## The proof stack (all true, all modest)

${PROOF_STACK.map((p) => `- ${p}`).join("\n")}

## The clock page (4:41 → 3:24)

**Problem:** ${CLOCK_NOTES.problem}

**Edits:** ${CLOCK_NOTES.edits.join(" · ")}

## The invented 4-city run (D-21 pre-roll)

| City | Date | Venue (fictional) | Send day | Offer |
|---|---|---|---|---|
${ROUTE.map((r) => `| ${r.city} | ${r.date}${r.dateNote ? ` (${r.dateNote})` : ""} | ${r.venue} | ${r.sendDay} | ${r.offer} |`).join("\n")}

## Week 0 (loaded before Day 1)

${WEEK_0.map((w) => `- ${w}`).join("\n")}

## EPK fact block

${EPK_FACTS.map((f) => `- ${f}`).join("\n")}

## Audio manifest

${AUDIO_MANIFEST.map((a) => `- ${a}`).join("\n")}
`
);

write(
  "worked-example/01-war-room.md",
  `# THE WORKED EXAMPLE — 20-STATION WAR ROOM (Day 21)

> ${EXAMPLE_DISCLAIMER}

**Score = genre (0–2) + locality (0–1) + named human (0–1) + recent indie adds (0–1).** Batch 1 = Day 1 (A-list). Batch 2 = Day 3.

| # | Station | City | Contact · Role | Show / Format | Score | Status at Day 21 | Next |
|---|---------|------|----------------|---------------|:-----:|------------------|------|
${WAR_ROOM.map((r) => `| ${r.n} | ${r.station} ${r.dial} | ${r.city} | ${r.contact} · ${r.role} | ${r.show} — ${r.format} | ${r.score} | ${r.endStatus} | ${r.next} |`).join("\n")}

**Cut at scoring:**

${CUT_AT_SCORING.map((c) => `- ${c}`).join("\n")}

**Final count:** ${AUDIT.sends} sent · ${AUDIT.humanReplies} human replies (${AUDIT.replyRate}) · ${AUDIT.adds} add · ${AUDIT.interviews} interview · ${AUDIT.imagingAsks} imaging ask · ${AUDIT.cleanNos} clean no · ${AUDIT.burnedWells} burned wells.
`
);

write(
  "worked-example/02-pitch-pack.md",
  `# THE WORKED EXAMPLE — PITCH PACK

> ${EXAMPLE_DISCLAIMER}

## 11 subject lines (filled)

${SUBJECT_LINES.map((s, i) => `${i + 1}. ${s}`).join("\n")}

*Kept #1, #5, #11 — show, clock, city proven in under 8 words.*

## The 90-word pitch (${PITCH_90.wordCount} words)

**To:** ${PITCH_90.to}
**Subject:** ${PITCH_90.subject}

---

${PITCH_90.body.join("\n\n")}

---

## Touch 2 (Day 8) — to ${TOUCH_2.to}

**Subject:** ${TOUCH_2.subject}

${TOUCH_2.body.join("\n\n")}

## Touch 3 (Day 14) — to ${TOUCH_3.to}

**Subject:** ${TOUCH_3.subject}

${TOUCH_3.body.join("\n\n")}

## The 20-second call (Day 5, after the reply — never cold)

**When:** ${CALL_SCRIPT.when}

${CALL_SCRIPT.script.join("\n\n")}

**Then:** ${CALL_SCRIPT.then}

## Interview answers (five, each <40s)

${INTERVIEW_ANSWERS.map((a) => `**${a.q}**\n"${a.a}"`).join("\n\n")}

## The thank-you (same day)

**To:** ${THANK_YOU.to} · **Subject:** ${THANK_YOU.subject}

${THANK_YOU.body.join("\n\n")}

**Social post:** "${SOCIAL_POST[0]}"

## The burned-well apology (only if it's true)

**To:** ${APOLOGY.to} · **Subject:** ${APOLOGY.subject}

${APOLOGY.body.join("\n\n")}
`
);

write(
  "worked-example/03-21-day-log.md",
  `# THE WORKED EXAMPLE — THE 21-DAY LOG

> ${EXAMPLE_DISCLAIMER}

**${ARTIST.name} · Day 1 = Mon Mar 16 · Day 21 = Sun Apr 5 · hometown date ${ARTIST.showDate}**

| Day | Date | What happened | Result |
|-----|------|---------------|--------|
${LOG.map((l) => `| **${l.day}** · ${l.kind.toUpperCase()} | ${l.date} | ${l.action} | ${l.outcome} |`).join("\n")}

## The honest scoreboard

- Sends: ${AUDIT.sends} · Touch 2: ${AUDIT.touch2} · Touch 3: ${AUDIT.touch3}
- Human replies: ${AUDIT.humanReplies} (${AUDIT.replyRate}) · Adds: ${AUDIT.adds} · Interviews: ${AUDIT.interviews} · Imaging asks: ${AUDIT.imagingAsks} · Clean nos: ${AUDIT.cleanNos} · Burned wells: ${AUDIT.burnedWells}
- 14 days of silence — and the campaign worked anyway. That is the whole lesson.

${AUDIT.verdict}

## The proof ledger it produced

| Date | Station | What happened | Where it gets reused |
|------|---------|---------------|----------------------|
${LEDGER.map((l) => `| ${l.date} | ${l.station} | ${l.what} | ${l.use} |`).join("\n")}

## What it routed into

**Venue email** (${VENUE_EMAIL.to}) — subject: *${VENUE_EMAIL.subject}*

${VENUE_EMAIL.body.join("\n\n")}

**Client email** (${CLIENT_EMAIL.to}) — subject: *${CLIENT_EMAIL.subject}*

${CLIENT_EMAIL.body.join("\n\n")}

## Single #2 on the T-28 skeleton

| T-minus | Date | Action |
|---------|------|--------|
${RELEASE_MAP.map((r) => `| ${r.t} | ${r.date} | ${r.action} |`).join("\n")}
`
);

/* ── Sequences (carried forward from the original zip, now generated
      from src/course/lifecycle.ts so operator copy stays in sync) ── */

write(
  "sequences/email-and-sms.md",
  `# Self-nurture / operator sequences

The buyer lifecycle copy from the RadioReach console — use it to keep yourself
on the cadence, or as the seed of your own mailing-list automation. These are
written to the artist (you), from purchase day forward.

## Email (from purchase)

${EMAIL_SEQUENCE.map(
  (e) =>
    `**Day ${e.day} — ${e.name}**\nSubject: ${e.subject}\n${e.body}`
).join("\n\n")}

## SMS

${SMS_SEQUENCE.map((s) => `- ${s.trigger}: ${s.text}`).join("\n")}

---

*These sequences run against your own campaign calendar. Nothing here is sent
automatically by RadioReach — you are the operator.*
`
);

/* ── Asset registry files (workbooks, swipes, calendar, EPK, CSVs) ── */

for (const f of FD_FILES) write(f.path, f.content);

/* ── Zip ────────────────────────────────────────────────────── */

// Stage an exact copy as <tmp>/frequency-dominion/ so the archive root folder
// is named correctly, then zip deterministically from <tmp>.
const STAGE_PARENT = path.join(path.dirname(SRC_DIR), ".stage");
fs.rmSync(STAGE_PARENT, { recursive: true, force: true });
fs.mkdirSync(STAGE_PARENT, { recursive: true });
fs.cpSync(SRC_DIR, path.join(STAGE_PARENT, TOP), { recursive: true });

fs.rmSync(ZIP_PATH, { force: true });
execFileSync("zip", ["-r", "-X", "-q", ZIP_PATH, TOP, "-x", "*/.DS_Store"], {
  cwd: STAGE_PARENT,
  stdio: "inherit",
});
fs.rmSync(STAGE_PARENT, { recursive: true, force: true });

const listing = execFileSync("unzip", ["-l", ZIP_PATH], { encoding: "utf8" });
const fileCount = (listing.match(/\.md|\.html|\.csv|\.png|\.txt/g) || []).length;
console.log(`\n✓ ${path.relative(ROOT, ZIP_PATH)}`);
console.log(`  ${stats.lessonCount} lessons · ${stats.scriptWords.toLocaleString("en-US")} script words (~${stats.spokenMinutes} min spoken)`);
console.log(`  ${FD_FILES.length} registered assets + ${fileCount} files total in zip`);
console.log("  Staging source: fulfillment/courses/frequency-dominion/src/ (tracked)");
