/**
 * FREQUENCY DOMINION — DELIVERABLE FILE REGISTRY
 *
 * Single source of truth for every workbook, swipe file, calendar, EPK
 * one-sheet, and CSV in the product. The classroom serves these as
 * print/download actions; scripts/build-frequency-dominion-zip.ts emits
 * the same bytes into the fulfillment zip. Edit here, rebuild the zip.
 */

import {
  AUDIT,
  EXAMPLE_DISCLAIMER,
  IDENTITY_DRAFTS,
  LEDGER,
  LOG,
  PINNED_IDENTITY,
  PITCH_90,
  SUBJECT_LINES,
  THANK_YOU,
  TOUCH_2,
  TOUCH_3,
  WAR_ROOM,
} from "./workedExample";

export type FdFile = {
  /** Path inside the fulfillment zip (under frequency-dominion/). */
  path: string;
  title: string;
  blurb: string;
  kind: "md" | "html" | "csv";
  content: string;
};

/* ─────────────────────────────────────────────────────────────
   Shared HTML scaffolding for the printable one-pagers.
────────────────────────────────────────────────────────────── */

const printCss = `
  :root { --ink:#08080a; --panel:#101014; --acid:#ffe600; --blood:#e01b24; --paper:#fafafa; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; background: #f3f3f0; }
  .sheet { background: var(--paper); max-width: 800px; margin: 24px auto; padding: 36px 40px; border-top: 10px solid var(--ink); position: relative; }
  .acid-bar { position: absolute; top: 10px; left: 0; right: 0; height: 4px; background: var(--acid); }
  .kicker { font-family: Arial, Helvetica, sans-serif; font-size: 10px; letter-spacing: .28em; text-transform: uppercase; color: #666; }
  h1 { font-family: Impact, 'Arial Black', Arial, sans-serif; font-size: 44px; letter-spacing: .01em; text-transform: uppercase; line-height: .95; margin: 6px 0 2px; }
  h2 { font-family: Arial, Helvetica, sans-serif; font-size: 12px; letter-spacing: .2em; text-transform: uppercase; border-bottom: 2px solid #111; padding-bottom: 4px; margin: 22px 0 10px; }
  table { width: 100%; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif; font-size: 11px; }
  th { background: var(--ink); color: var(--acid); text-align: left; padding: 6px 7px; text-transform: uppercase; letter-spacing: .06em; font-size: 9.5px; }
  td { border-bottom: 1px solid #ddd; padding: 6px 7px; vertical-align: top; }
  .blank td { height: 26px; }
  .foot { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #777; margin-top: 22px; border-top: 1px solid #ccc; padding-top: 8px; line-height: 1.5; }
  .fill { color: #b1480f; font-weight: bold; }
  .example-tag { background: var(--blood); color: #fff; font-family: Arial, sans-serif; font-size: 9px; letter-spacing: .18em; padding: 3px 8px; text-transform: uppercase; }
  @media print {
    body { background: #fff; }
    .sheet { margin: 0; max-width: none; padding: 12mm 10mm; border-top-width: 6px; }
    .no-print { display: none; }
    .page-break { page-break-before: always; }
  }
`;

const htmlDoc = (title: string, body: string) =>
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>${title}</title>\n<style>${printCss}</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;

const footNote =
  "FREQUENCY DOMINION — RadioReach · radioreach.us · For the original purchaser’s own campaigns. No spam, no purchased play, no guaranteed airplay. Verify every contact in your Radio Reach Vault before sending.";

/* ─────────────────────────────────────────────────────────────
   WB01 — IDENTITY SENTENCE
────────────────────────────────────────────────────────────── */

const wb01Blank = `# WB01 — Identity Sentence

**Outcome:** one line a music director can use to file you — specific enough to insult a generic artist.

## Formula

> I am the **[genre]** artist **[city / region]** stations use when they need **[specific listener feeling or show job]**.

Every bracket must be load-bearing:
- **Genre** — precise enough that a host could say it on air in four words.
- **City / region** — the market where you are not a stranger.
- **Listener feeling / show job** — what the *station* gets: a Friday-night mood, a local hour that sounds planted, a cold ending that sweeps clean.

## Insult test
If the sentence could fit any artist in any city, rewrite it. A director should feel like you already know their clock.

## Write 5 drafts. Circle one.

1. ________________________________________________
2. ________________________________________________
3. ________________________________________________
4. ________________________________________________
5. ________________________________________________

**Pinned sentence:**

________________________________________________________________

**Do not send a single pitch until this is pinned above your send list.**

## Common failure
“My sound is unique, check out my catalogue.” That is a fan sentence. The fix: name the daypart and the job the song does for the show.

---
*Frequency Dominion · RadioReach — no spam, no purchased play, no guaranteed airplay.*
`;

const wb01Example = `# WB01 — Identity Sentence · FILLED EXAMPLE

> ${EXAMPLE_DISCLAIMER}

**Artist:** Marisol Vega — midnight-synth — Cincinnati, OH

## The five drafts (thinking shown, not just the winner)

${IDENTITY_DRAFTS.map((d) => `**Draft ${d.draft}:** “${d.text}”\n→ ${d.verdict}`).join("\n\n")}

## Pinned sentence

> ${PINNED_IDENTITY}

**Why it survives the insult test:** genre (midnight-synth), city (Cincinnati), clock (3:24), structure (hook before chorus 2), and a simile a host can steal for on-air patter (“rain-slick 1987 Berlin”). No other artist on earth fits this sentence.
`;

/* ─────────────────────────────────────────────────────────────
   WB02 — 20-STATION WAR ROOM
────────────────────────────────────────────────────────────── */

const scoreLegend = `**Score:** genre (0–2) + locality (0–1) + named human (0–1) + recent indie adds (0–1).
**4–5** = send this week (A-list — personal audio, phoner offer). **2–3** = send, template-tight. **0–1** = do not touch.`;

const blankRow = (n: number) => `| ${n} |  |  |  |  |  | queued |  |  |`;

const wb02Blank = `# WB02 — The 20-Station War Room

${scoreLegend}

**Print this. Put it on the wall. Update it daily like a chart.**
Statuses: \`queued → sent → opened → replied → added / no / dead\` (nurture = alive, later).

| # | Station | City | Contact · Role | Show / Format | Score | Status | Next touch | Notes |
|---|---------|------|----------------|---------------|:-----:|--------|------------|-------|
${Array.from({ length: 20 }, (_, i) => blankRow(i + 1)).join("\n")}

**Accountability human:** ______________________ (gets the war-room photo every Sunday)

**Cut at scoring (0–1s you refused to touch):**

1. ______________________
2. ______________________
3. ______________________

## Common failure
Forty stations “because more is better.” More is noise. Twenty named humans you can actually work is a campaign; two hundred is a graveyard with your name on it.
`;

const wb02Example = `# WB02 — The 20-Station War Room · FILLED EXAMPLE (Day 21)

> ${EXAMPLE_DISCLAIMER}

${scoreLegend} **Batch 1 = Day 1 (A-list first). Batch 2 = Day 3.**

| # | Station | City | Contact · Role | Show / Format | Score | Status at Day 21 | Next |
|---|---------|------|----------------|---------------|:-----:|------------------|------|
${WAR_ROOM.map((r) => `| ${r.n} | ${r.station} ${r.dial} | ${r.city} | ${r.contact} · ${r.role} | ${r.show} — ${r.format} | ${r.score} | ${r.endStatus} | ${r.next} |`).join("\n")}

**Cut at scoring:**
- WKQN 106.5 Louisville — active rock — 1. Right city, wrong planet.
- WQXJ 107.8 Cincinnati — syndicated top-40 — 0. No named human, no clock fit.
- WDDR 101.9 Dayton — standards — 1. Lovely people, wrong genre.

**Final count:** 20 sent · 4 human replies (20%) · 1 add · 1 interview · 1 imaging ask · 1 clean no · 0 burned wells.
`;

/* ─────────────────────────────────────────────────────────────
   WB03 — 90-WORD PITCH BUILDER
────────────────────────────────────────────────────────────── */

const wb03Blank = `# WB03 — The 90-Word Pitch Builder

Six blocks. One ask. Under 90 words. Read aloud, it should last about 40 seconds.

1. **Their name** — spelled right, show named. (Not “Hi there.”)
2. **Why this show this week** — one sentence proving you listen.
3. **One-sentence song** — genre + runtime + what it does for their clock.
4. **Runtime + one proof line** — a true local date, add, quote, or number.
5. **One link** — folder with WAV/MP3/one-sheet. Never a pile of attachments.
6. **One ask** — spin / interview / feedback. Never all three. Always offer the one-line no.

## Draft

________________________________________________________________
________________________________________________________________
________________________________________________________________
________________________________________________________________
________________________________________________________________
________________________________________________________________

**Word count:** ______ / 90  · **Read-aloud time:** ______ s

## Kill list (cut these on sight)
- “I’ve been making music since I was…”
- “It would mean the world to me”
- “Please consider”
- Any sentence about your journey instead of their clock

## Common failure
Two asks (“spin + interview + maybe a feature?”). Two asks read as zero asks. Pick one.
`;

const wb03Example = `# WB03 — The 90-Word Pitch Builder · FILLED EXAMPLE

> ${EXAMPLE_DISCLAIMER}

**To:** ${PITCH_90.to}
**Subject:** ${PITCH_90.subject}

---

${PITCH_90.body.join("\n\n")}

---

**Word count: ${PITCH_90.wordCount}/90.** Read aloud: 38 seconds.

**Block map:** their name + show (1) · proof she listens (2) · song in one sentence (3) · runtime + proof (4) · one link (5) · one ask with a one-line no (6). No journey, no begging, no second ask.
`;

/* ─────────────────────────────────────────────────────────────
   WB04 — 21-DAY CAMPAIGN CALENDAR
────────────────────────────────────────────────────────────── */

const calendarRows: readonly { day: string; action: string; done: string }[] = [
  { day: "0 (Week 0)", action: "Load war room: 20 scored stations, assets frozen, calendar blocked", done: "War room printed + on wall" },
  { day: "1", action: "First blood: 10 A-list sends, personal first lines", done: "10 rows logged 'sent'" },
  { day: "2", action: "No sends. Verify links, proofread queued subjects", done: "Link test passed" },
  { day: "3", action: "Batch 2: 10 more sends", done: "20/20 sent" },
  { day: "4", action: "Reply window: answer everything human within hours", done: "0 unanswered replies" },
  { day: "5", action: "Calls only where earned (reply or local-date hook)", done: "Calls logged, 20s max" },
  { day: "6", action: "Rest — protected by the calendar", done: "Nothing. On purpose." },
  { day: "7", action: "Weekly audit + war-room photo to accountability human", done: "Audit notes written" },
  { day: "8", action: "Touch 2 to non-responders: 30s hook, two sentences, no guilt", done: "T2 count logged" },
  { day: "9", action: "Reply window: confirm any add in writing", done: "Adds confirmed + thanked" },
  { day: "10", action: "Handle the clean no: thank, leave door open", done: "Nos thanked same day" },
  { day: "11", action: "Thank-you wave: email + station-first social", done: "Champions seen" },
  { day: "12", action: "Spin watch: screenshot anything that airs", done: "Ledger updated" },
  { day: "13", action: "Buffer day — absorbs real life", done: "Nothing. On purpose." },
  { day: "14", action: "Touch 3 to the silent: NEW information only, then quiet", done: "T3 count logged" },
  { day: "15", action: "Proof patrol: charts, adds, mentions → ledger", done: "Ledger ≥1 new row" },
  { day: "16", action: "Interviews: 5 answers under 40s, pull-quote ask", done: "Interview done/queued" },
  { day: "17", action: "Convert warm asks (imaging, live cuts) same day", done: "Files sent" },
  { day: "18", action: "Campaign audit: sends/replies/adds/burned wells", done: "Numbers written" },
  { day: "19", action: "Clone war room → market 2 (15 stations)", done: "Market 2 loaded" },
  { day: "20", action: "Ledger + EPK proof lines updated with new receipts", done: "Pitch v2 written" },
  { day: "21", action: "Close: thank-yous, audit, schedule market 2 day 1", done: "Next Day 1 on calendar" },
];

const wb04Blank = `# WB04 — The 21-Day Campaign Calendar

**Week 0 loads. Days 1–21 run. Silence is data. The calendar is the campaign.**

| Day | Action | Done when | ✓ |
|-----|--------|-----------|---|
${calendarRows.map((r) => `| ${r.day} | ${r.action} | ${r.done} | ☐ |`).join("\n")}

Send blocks on the clock: ____________ · Accountability human: ____________

## Common failure
“I’ll do the sends when inspiration hits.” Inspiration is not an operator. Four 45-minute blocks per week, non-negotiable — the calendar does the discipline so you can do the art.
`;

const logKindLabel: Record<string, string> = {
  load: "LOAD",
  send: "SEND",
  silence: "SILENCE",
  reply: "REPLY",
  no: "NO",
  add: "ADD",
  interview: "INTERVIEW",
  audit: "AUDIT",
  compound: "COMPOUND",
};

const wb04Example = `# WB04 — The 21-Day Campaign Calendar · FILLED EXAMPLE

> ${EXAMPLE_DISCLAIMER}

**Marisol Vega · Day 1 = Mon Mar 16 · Day 21 = Sun Apr 5 · hometown date Fri Apr 17**

| Day | Date | What happened | Result |
|-----|------|---------------|--------|
${LOG.map((l) => `| ${l.day} · ${logKindLabel[l.kind]} | ${l.date} | ${l.action} | ${l.outcome} |`).join("\n")}

## The honest scoreboard

- ${AUDIT.sends} sends · ${AUDIT.touch2} Touch 2s · ${AUDIT.touch3} Touch 3s
- ${AUDIT.humanReplies} human replies (${AUDIT.replyRate}) · ${AUDIT.adds} add · ${AUDIT.interviews} interview · ${AUDIT.imagingAsks} imaging ask · ${AUDIT.cleanNos} clean no · ${AUDIT.burnedWells} burned wells
- 14 days of silence — and the campaign still worked. That is the whole lesson.

${AUDIT.verdict}
`;

/* ─────────────────────────────────────────────────────────────
   WB05 — PROOF LEDGER
────────────────────────────────────────────────────────────── */

const wb05Blank = `# WB05 — The Proof Ledger

Every add, spin, quote, and interview becomes a line you spend in the next pitch.
No ledger = restarting from zero every single.

| Date | Station + city | What happened (be exact) | Where you’ll reuse it |
|------|----------------|--------------------------|-----------------------|
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

**Rules**
- Truth only. An invented add is a felony against your own career.
- Exact is reusable: “3-week specialty run” beats “got radio play.”
- Screenshot everything the day it airs — chart pages vanish.

## Common failure
Burying proof in an old email thread you’ll never find again. The ledger is a *spendable* asset: one glance, one line, into the pitch.
`;

const wb05Example = `# WB05 — The Proof Ledger · FILLED EXAMPLE

> ${EXAMPLE_DISCLAIMER}

| Date | Station + city | What happened | Where it gets reused |
|------|----------------|---------------|----------------------|
${LEDGER.map((l) => `| ${l.date} | ${l.station} | ${l.what} | ${l.use} |`).join("\n")}

**How it compounds:** the fall KCYQ line became proof line #2 in March’s pitch. The March WVMR add becomes line #1 of June’s pitch (“now spinning on 89.1”). Five true lines, rotating forward forever.
`;

/* ─────────────────────────────────────────────────────────────
   SWIPE FILE (9 pieces, template + rules + filled example)
────────────────────────────────────────────────────────────── */

const swipe01 = `# SWIPE 01 — Subject Lines That Get Opened

## The logic
Specificity is respect: prove you know the show, the clock, and the city — in under 8 words.
**Die on arrival:** “New single for your consideration” · “Demo attached” · “Checking in” · “Unsigned artist seeking airplay.”

## Templates (fill every bracket)

1. [City] [genre] for [show] — [runtime]
2. Interview window [date range] + “[song]”
3. Local date [venue] [date] — radio edit [runtime]
4. Follow-up: still a fit for [show]?
5. 30-second hook for [daypart] — [Artist]
6. [Station] specialty: “[song]” ([other-station] add last [period])
7. Load-in [city] [date] — live cut + radio edit
8. Replacement link — “[song]” [runtime] (only if a link broke)
9. [First name] — one track, one ask
10. Hometown [genre] for this week’s [show]
11. New info only: [quote / chart / room change] + “[song]”

**Write 11. Keep 3. Never reuse a loser on the same contact.**

## Filled example

${SUBJECT_LINES.map((s, i) => `${i + 1}. ${s}`).join("\n")}

*Kept #1, #5, #11. Every line proves show, clock, or city — in under 8 words.*

> ${EXAMPLE_DISCLAIMER}
`;

const swipe02 = `# SWIPE 02 — The 90-Word Pitch

## Template

Hi [Name] —

[One sentence proving you actually listen to their show.] I’m [Artist], [city] [genre]. “[Song]” is [runtime], built for [daypart]: [structure — hook timing, cold ending, sweep]. I [local date/venue] on [date]. Proof: [one true line]. Radio edit: [one link].

One ask: [spin on show before date] / [10-min phoner before load-in] / [honest feedback]? If it’s not a fit, a one-line no is enough.

— [Artist] · [City] · [phone]

**Rules:** one ask, one link, one proof line. 90 words max. Read it aloud — 40 seconds.

## Filled example (${PITCH_90.wordCount} words)

**To:** ${PITCH_90.to}
**Subject:** ${PITCH_90.subject}

${PITCH_90.body.join("\n\n")}

> ${EXAMPLE_DISCLAIMER}
`;

const swipe03 = `# SWIPE 03 — The 3-Touch Follow-Up

**Cadence:** Touch 1 = Day 1/3. Touch 2 = Day 8–10. Touch 3 = Day 14. Then stop until the next release. Never “just bumping this.”

## Templates

**Touch 2 (Day 8–10)** — subject: *30-second hook for [daypart] — [Artist]*
> [Name] — a 30-second version if that’s easier: [hook link]. The chorus lands by [time]. Still a fit for [show] before [date]?
> Either way — [one true sentence appreciating what the show does].

**Touch 3 (Day 14)** — subject: *New info: [new fact] + “[song]”*
> [Name] — new since my last note, and then I’ll go quiet: [new fact 1: quote/chart/room change], and [new fact 2].
> If “[song]” still isn’t a fit, happy to drop it. If it is, [one technical reason it fits the clock].

**If they say no:** thank them same day, one line, door open. Log it. Re-pitch next cycle with new work.

## Filled example

**Touch 2 →** ${TOUCH_2.to}

${TOUCH_2.body.join("\n\n")}

**Touch 3 →** ${TOUCH_3.to}

${TOUCH_3.body.join("\n\n")}

> ${EXAMPLE_DISCLAIMER}
`;

const swipe04 = `# SWIPE 04 — The 20-Second Call

**Call ONLY after:** a reply, a shared local date, or a published request line. A cold call to a music director is how you get labeled a pest.

## Template (say it in 20 seconds, then shut up)

> “Hi [Name] — [Artist], the [city] [genre] artist, [what you sent] for [show].”
> “One ask: [the ask — 10-minute phoner / confirm the edit landed]? I’ll keep it to ten.”
> “If email’s better, say so and I’ll stop calling.”

## Rules
- One ask. One. 
- Their answer is allowed to be “email me.” Take it gracefully.
- Log every call in the send log: date, name, result, next touch.

## Filled example

When: after Marcus Boone’s “send the EPK” reply — never before.

“Marcus — Marisol Vega, the Cincinnati synth artist, EPK landed yesterday for Homegrown Signal.”
“One ask: ten minutes on the phone before April 17? I’ll take any slot, and I’ll keep it to ten.”
“If email’s better, say so and I’ll stop calling.”

*Result: yes on Day 12. Total call time: 41 seconds.*

> ${EXAMPLE_DISCLAIMER}
`;

const swipe05 = `# SWIPE 05 — Interview Answers That Book the Next Spin

Hosts need tape, not a discography. Five answers, each under 40 seconds spoken. End every interview by asking what they need from you next month.

## Template

1. **Origin of the song** — one anecdote, one image, no mythology.
2. **Local tie** — the street, the venue, the loop. Say-on-air ammo.
3. **What it sounds like** — two references max, dial-safe. “If you played X next to me, nobody reaches for the dial.”
4. **Listener call-to-action** — one date, one place, one action.
5. **15-second pull-quote** — write it for their imaging: song + daypart + station.

Close: *“What do you need from me next month?”*

## Filled example

1. **Where did “Static Bloom” come from?** — “Driving the Elm Street loop at 1am after a gig nobody came to. The streetlight strobe through a wet windshield — that’s the whole song. Nine minutes to write, nine months to finish.”
2. **What does Cincinnati mean to this record?** — “Everything local is load-bearing. Verse one names the loop. It’s a Cincinnati song that sounds like Cincinnati at 1am.”
3. **What does it sound like?** — “Midnight-synth — dark 80s pop with a modern low end. Depeche Mode next to Charli XCX next to me, nobody reaches for the dial.”
4. **What should listeners do?** — “Foundry on Elm, Friday April 17. Bring someone you’d drive the loop with.”
5. **Pull-quote** — “‘Static Bloom’ — Friday nights on The Night Signal, 89.1.” Fifteen seconds, cold ending, sweeps clean.

> ${EXAMPLE_DISCLAIMER}
`;

const swipe06 = `# SWIPE 06 — The Thank-You (Same Day)

Champions stay champions when they feel seen. Same-day thank-you, station credited first, zero asks attached.

## Template

> [Name] — thank you. [What they did] is the first [honest meaning — “Cincinnati add of my life that felt like a door, not a fluke”].
> [What you did in return: tagged station first / attached post — offered to take it down.]
> If you ever need [live cut / 15-second ID / local fill-in], I’m [distance] from the studio.
> Next single lands [month]. It reaches you early, once, no follow-up spam.

**Social post rules:** station first, host tagged once, their screenshot, zero asks in the post. Never demand a public screenshot. Never tag them into an argument.

## Filled example

**To:** ${THANK_YOU.to}
**Subject:** ${THANK_YOU.subject}

${THANK_YOU.body.join("\n\n")}

**Social post:** “‘Static Bloom’ spun on The Night Signal — 89.1 WVMR, Friday 10:42pm. Cincinnati radio played a Cincinnati song and the drive home felt like a movie. Thank you, Dara. 📻”

> ${EXAMPLE_DISCLAIMER}
`;

const swipe07 = `# SWIPE 07 — The Burned-Well Apology

If you already blasted a market: own it in one line, no excuses, offer one relevant track with permission to ignore, then go silent for 90 days. Send only if it’s true.

## Template

> [Name] — in [month] I BCC’d you and [N] other stations the same “please consider my single” email. [Twice.] That was disrespectful to you and to the [audience] you program for.
> I won’t do it again. If one relevant track is ever useful: [link] — a [runtime] [genre] record, honestly [format-fit honesty].
> Ignore it with my blessing. You will not hear from me for 90 days.

**Then actually go silent for 90 days.** The apology is the easy part; the silence is the repair.

## Filled example

**To:** Louise Achtenberg (WJHR) — stand-in for any burned contact.

In October I BCC’d you and forty other stations the same “please consider my single” email. Twice. That was disrespectful to you and to the late-set audience you program for.

I won’t do it again. If one relevant track is ever useful: vega.link/staticbloom — a 3:24 midnight-synth record, honestly an edge-fit for your format.

Ignore it with my blessing. You will not hear from me for 90 days.

> ${EXAMPLE_DISCLAIMER}
`;

const swipe08 = `# SWIPE 08 — The Venue Email (Citing a Station)

Radio is not a paycheck; it is a badge that books rooms. The venue email leads with the badge and gives the booker honest draw numbers.

## Template

> Hi [Booker] — [Artist] here ([genre], [city]).
> Short version: I headline [venue] on [date] ([cap], ticketed) and want the [city] stop [adjacent date].
> Why it fills a room: “[song]” is spinning on [station + show] ([chart/add fact]), [prior station fact], and [%] of my [N] monthly listeners are in [region].
> I can send the radio edit, one-sheet, and [interview clip]. Honest draw: [range] with [N] weeks of radio behind it.
> One ask: [slot, set length]. If the calendar’s full, what date works?

## Filled example

**To:** Booker, The Rail Yard (Columbus) — fictional venue.
**Subject:** Cincinnati synth headliner for Sat Apr 18 — “spinning on 89.1 WVMR”

Hi Devon — Marisol Vega here (midnight-synth, Cincinnati).

Short version: I headline Foundry on Elm in Cincinnati on Apr 17 (240-cap, ticketed) and I’d like the Columbus stop the next night, Sat Apr 18.

Why it fills a room: “Static Bloom” is spinning on 89.1 WVMR’s The Night Signal (chart #7), I ran a 3-week specialty add in Columbus last fall on KCYQ’s Lowlight, and 61% of my 2,400 monthly listeners are in Ohio.

I can send the radio edit, the press one-sheet, and the WCBX interview clip. Honest draw: 40–60 on a Saturday with three weeks of radio behind it, growing.

One ask: a Sat Apr 18 slot, 40-minute set. If the calendar’s full, what date works?

> ${EXAMPLE_DISCLAIMER}
`;

const swipe09 = `# SWIPE 09 — The Client Email (Citing a Station)

For sync supervisors, brands, and freelance clients: radio proof translated into *their* language — regions, data, deliverables.

## Template

> Hi [Name] — you asked for [what they asked for].
> Numbers, not vibes: “[song]” is spinning on [station + show + chart fact], ran [prior run], with [N]% of streaming listeners in [the exact market their buy covers].
> The track is [clean/edit status], [runtime], with a [N]-second hook cut already built for imaging.
> One ask: [15 minutes this week / one page of options]?

## Filled example

**Subject:** Regional radio data for your Ohio campaign — Marisol Vega

Hi Priya — you asked for artists with real Midwest traction for the dealership spot.

Numbers, not vibes: “Static Bloom” is spinning on Cincinnati specialty radio (WVMR, chart #7), ran 3 weeks in Columbus (KCYQ), with an on-air interview airing this Sunday. 61% of streaming listeners are in Ohio — the exact map the buy covers.

The track is radio-clean, 3:24, with a 30-second hook cut already built for imaging.

One ask: 15 minutes this week to play you the hook against the brief?

> ${EXAMPLE_DISCLAIMER}
`;

/* ─────────────────────────────────────────────────────────────
   CALENDAR — markdown table + printable HTML one-pager
────────────────────────────────────────────────────────────── */

const calendarMd = `# The 21-Day Campaign Calendar

**Week 0 loads. Days 1–21 run. Silence is data.**

| Day | Action | Done when |
|-----|--------|-----------|
${calendarRows.map((r) => `| ${r.day} | ${r.action} | ${r.done} |`).join("\n")}

**Send blocks (4 × 45 min/week, non-negotiable):** ______________________
**Accountability human:** ______________________

**The three touch windows:** Day 1/3 first sends · Day 8–10 Touch 2 · Day 14 Touch 3. After Touch 3: silence until the next release.

*Frequency Dominion · RadioReach — no spam, no purchased play, no guaranteed airplay.*
`;

const calendarHtml = htmlDoc(
  "Frequency Dominion — 21-Day Campaign Calendar (print)",
  `  <div class="sheet">
    <div class="acid-bar"></div>
    <p class="kicker">Frequency Dominion · RadioReach · radioreach.us</p>
    <h1>21-Day Campaign Calendar</h1>
    <p class="kicker">Week 0 loads · Days 1–21 run · Silence is data</p>
    <h2>The run sheet</h2>
    <table>
      <thead><tr><th style="width:12%">Day</th><th>Action</th><th style="width:26%">Done when</th><th style="width:6%">✓</th></tr></thead>
      <tbody>
${calendarRows.map((r) => `        <tr><td><strong>${r.day}</strong></td><td>${r.action}</td><td>${r.done}</td><td>☐</td></tr>`).join("\n")}
      </tbody>
    </table>
    <h2>The clock</h2>
    <p style="font-family:Arial,sans-serif;font-size:11px;line-height:1.7">Send blocks (4 × 45 min/week, non-negotiable): ____________________ &nbsp;·&nbsp; Accountability human: ____________________<br/>
    Touch windows: <strong>Day 1/3</strong> first sends · <strong>Day 8–10</strong> Touch 2 · <strong>Day 14</strong> Touch 3. After Touch 3: silence until the next release.</p>
    <p class="foot">${footNote}</p>
  </div>`
);

/* ─────────────────────────────────────────────────────────────
   EPK ONE-SHEET — template + filled example (one page each)
────────────────────────────────────────────────────────────── */

const epkTemplate = htmlDoc(
  "EPK One-Sheet — template",
  `  <div class="sheet">
    <div class="acid-bar"></div>
    <p class="kicker">ARTIST EPK · ONE SHEET · RADIO-READY</p>
    <h1>[ARTIST NAME]</h1>
    <p class="kicker">[GENRE — FOUR WORDS A HOST CAN SAY] · [CITY, STATE]</p>
    <h2>The single</h2>
    <table>
      <tr><td style="width:30%"><strong>Song</strong></td><td class="fill">[title] — [runtime radio edit] / [runtime album cut]</td></tr>
      <tr><td><strong>Structure</strong></td><td class="fill">hook at [time] · chorus by [time] · cold ending (no fade)</td></tr>
      <tr><td><strong>Sounds like</strong></td><td class="fill">[two references, dial-safe] — “if you played [X] next to me, nobody reaches for the dial”</td></tr>
      <tr><td><strong>Lyrics</strong></td><td class="fill">[radio-clean status — say it before they ask]</td></tr>
      <tr><td><strong>Files</strong></td><td class="fill">WAV + 320 MP3 + 30s hook + one-sheet PDF — one link, never attachments</td></tr>
    </table>
    <h2>Why now</h2>
    <p style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6"><span class="fill">[Local ticketed date — venue, cap, city, date — the reason to spin this week, not someday.]</span></p>
    <h2>Proof (all true)</h2>
    <table>
      <tr><td class="fill">1. [date/venue/cap fact]</td></tr>
      <tr><td class="fill">2. [prior add/spin — station, show, duration]</td></tr>
      <tr><td class="fill">3. [press quote + outlet, 8 words max]</td></tr>
      <tr><td class="fill">4. [listeners + regional % — honest numbers]</td></tr>
    </table>
    <h2>The ask</h2>
    <p style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6"><span class="fill">[ONE ask: a spin on (show) before (date). A one-line no is enough.]</span></p>
    <table>
      <tr><td style="width:30%"><strong>One link</strong></td><td class="fill">[link to folder]</td></tr>
      <tr><td><strong>Contact</strong></td><td class="fill">[name] · [email] · [phone] · [city + timezone]</td></tr>
    </table>
    <p class="foot">${footNote}</p>
  </div>`
);

const epkExample = htmlDoc(
  "EPK One-Sheet — filled example (Marisol Vega)",
  `  <div class="sheet">
    <div class="acid-bar"></div>
    <p class="kicker">ARTIST EPK · ONE SHEET · <span class="example-tag">Filled example — fictional</span></p>
    <h1>Marisol Vega</h1>
    <p class="kicker">Midnight-synth · Cincinnati, OH</p>
    <h2>The single</h2>
    <table>
      <tr><td style="width:30%"><strong>Song</strong></td><td>“Static Bloom” — 3:24 radio edit / 4:41 album cut</td></tr>
      <tr><td><strong>Structure</strong></td><td>hook at 0:38 · chorus by 0:52 · cold ending (no fade) — sweeps clean</td></tr>
      <tr><td><strong>Sounds like</strong></td><td>dark 80s synth-pop, modern low end — Depeche Mode next to Charli XCX, nobody reaches for the dial</td></tr>
      <tr><td><strong>Lyrics</strong></td><td>radio-clean; one profanity flipped in the edit before anyone asked</td></tr>
      <tr><td><strong>Files</strong></td><td>WAV + 320 MP3 + 30s hook + this one-sheet — vega.link/staticbloom</td></tr>
    </table>
    <h2>Why now</h2>
    <p style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6">Headlining The Foundry on Elm (Northside, Cincinnati) — 240-cap, ticketed — Friday, April 17.</p>
    <h2>Proof (all true)</h2>
    <table>
      <tr><td>1. Third Cincinnati headline attempt — Fri Apr 17, Foundry on Elm (240-cap, ticketed)</td></tr>
      <tr><td>2. “Glass Coast” — 3-week specialty run on “Lowlight,” KCYQ 91.7 Columbus (last fall)</td></tr>
      <tr><td>3. “Static-charged pop that earns its neon.” — Queen City Beat, premiere review</td></tr>
      <tr><td>4. 2,400 monthly listeners · 61% Ohio · 380-person mailing list</td></tr>
    </table>
    <h2>The ask</h2>
    <p style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6">One spin on a Friday-night block before Apr 17. A one-line no is enough.</p>
    <table>
      <tr><td style="width:30%"><strong>One link</strong></td><td>vega.link/staticbloom</td></tr>
      <tr><td><strong>Contact</strong></td><td>Marisol Vega · marisol@vega.link · (513) 555-0184 · Cincinnati OH, ET</td></tr>
    </table>
    <p class="foot">EXAMPLE ONLY — artist, stations, venues, outlets, and numbers are fictional training material. ${footNote}</p>
  </div>`
);

/* ─────────────────────────────────────────────────────────────
   SEND LOG — CSV template + example
────────────────────────────────────────────────────────────── */

const CSV_HEADERS = [
  "send_date",
  "station",
  "dial",
  "city",
  "contact_name",
  "role",
  "show",
  "format",
  "score",
  "batch",
  "subject_line",
  "touch",
  "pitch_version",
  "reply_date",
  "reply_type",
  "outcome",
  "next_action",
  "next_touch_date",
  "notes",
].join(",");

const csvEsc = (v: string) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

const exampleCsvRows: string[][] = [
  ["2026-03-16", "WVMR", "89.1", "Cincinnati OH", "Dara Whitfield", "Specialty host", "The Night Signal", "College/AAA", "5", "1", "Cincinnati midnight-synth for The Night Signal — 3:24", "1", "v1 (88w)", "2026-03-24", "positive", "ADDED — spin 3/27 10:42pm; chart #7", "thank-you sent; next single early", "2026-06-01", "cold ending was the clincher"],
  ["2026-03-16", "WCBX", "91.7", "Cincinnati OH", "Marcus Boone", "Host/MD", "Homegrown Signal", "Community", "5", "1", "Hometown midnight-synth for this week's Homegrown Signal", "1", "v1 (88w)", "2026-03-19", "positive", "EPK requested → interview 3/31, aired 4/5", "send pull-quote clip", "2026-06-01", "20-sec call after reply; door open"],
  ["2026-03-16", "KCYQ", "91.7", "Columbus OH", "Elena Vasquez", "Specialty host", "Lowlight", "College/specialty", "5", "1", "89.1 specialty: 'Static Bloom' (3 wks on KCYQ's Lowlight)", "1", "v1 (88w)", "", "", "silent after T2", "re-pitch with Rail Yard date", "2026-04-18", "prior add = warm door"],
  ["2026-03-16", "WNTL", "93.7", "Indianapolis IN", "Yuki Tanaka", "Host", "Midwest After Dark", "Community/specialty", "4", "1", "30-second hook for Saturday night — Marisol Vega", "1", "v1 (88w)", "2026-04-01", "warm ask", "30s hook requested for imaging; sent same day", "nurture with next single", "2026-06-07", "imaging use ≠ add; logged honestly"],
  ["2026-03-16", "WDLX", "90.5", "Dayton OH", "Sam Okafor", "MD", "Miami Valley Music", "Community", "4", "1", "Local date Apr 17 (Foundry on Elm) — radio edit 3:24", "1", "v1 (88w)", "2026-03-25", "clean no", "'not for current rotation — try fall'", "calendar fall re-pitch", "2026-09-01", "thanked same day; door open"],
  ["2026-03-16", "WBRZ", "89.9", "Louisville KY", "Colleen Marsh", "Host", "River City Unsigned", "Community", "4", "1", "Hometown-adjacent midnight-synth for River City Unsigned", "1", "v1 (88w)", "", "", "silent after T3", "nurture", "2026-06-07", ""],
  ["2026-03-16", "WOKP", "104.9", "Oxford OH", "Renee Kowalski", "MD", "Modern block", "College", "4", "1", "Cincinnati midnight-synth for your modern block — 3:24", "1", "v1 (88w)", "", "", "opened (link click), no reply", "offer live cut next cycle", "2026-06-07", "warmed but shy"],
  ["2026-03-16", "WQRT", "88.3", "Cincinnati OH", "Priya Raman", "MD", "Rotation + local block", "College/modern rock", "4", "1", "Cincinnati midnight-synth — 3:24 for the local block", "1", "v1 (88w)", "", "", "silent after T3", "nurture; pitch v2 with WVMR proof", "2026-06-07", ""],
  ["2026-03-16", "WCTR", "95.1", "Columbus OH", "Naomi Bell", "Host", "Scioto Sound", "Community/specialty", "4", "1", "Columbus stop Apr 18 + 'Static Bloom' 3:24", "1", "v1 (88w)", "", "", "silent after T3", "re-pitch with Rail Yard date", "2026-04-18", ""],
  ["2026-03-16", "WXSI", "88.5", "Newport KY", "Talia Osei", "MD", "Evening rotation", "College", "3", "1", "Newport/Cincinnati midnight-synth for evening rotation", "1", "v1 (88w)", "", "", "silent after T2", "nurture", "2026-06-07", ""],
  ["2026-03-18", "WSKV", "91.3", "Covington KY", "Aaron Delgado", "PD", "Drive local hour", "Community", "3", "2", "Covington-Cincinnati artist for the drive local hour", "1", "v1 (88w)", "", "", "silent", "nurture", "2026-06-07", "low priority"],
  ["2026-03-18", "WGCE", "90.1", "Hamilton OH", "Devon Pryce", "MD", "Rotation", "College", "3", "2", "Hamilton/Cincinnati midnight-synth — 3:24", "1", "v1 (88w)", "", "", "silent", "nurture", "2026-06-07", ""],
  ["2026-03-18", "WLQV", "100.3", "Middletown OH", "Grace Lindqvist", "MD", "Weekend blocks", "Community", "3", "2", "Middletown-area midnight-synth for weekend blocks", "1", "v1 (88w)", "", "", "silent after T2", "nurture", "2026-06-07", ""],
  ["2026-03-18", "WMRF", "89.5", "Bloomington IN", "Omar Haddad", "MD", "Rotation", "College", "3", "2", "Midwest midnight-synth — 'Static Bloom' 3:24", "1", "v1 (88w)", "", "", "silent", "nurture", "2026-06-07", ""],
  ["2026-03-18", "WVLB", "89.3", "Louisville KY", "Hector Ruiz", "Host", "Louisville Low End", "Community/specialty", "3", "2", "Louisville date Apr 19 + 'Static Bloom' 3:24", "1", "v1 (88w)", "2026-03-29", "soft maybe", "'maybe summer'", "calendar June touch", "2026-06-01", ""],
  ["2026-03-18", "WLXF", "92.5", "Lexington KY", "Theo Brandt", "MD", "Rotation", "College", "3", "2", "Lexington run-through: Cincinnati midnight-synth 3:24", "1", "v1 (88w)", "", "", "silent", "nurture", "2026-06-07", ""],
  ["2026-03-18", "WJHR", "88.9", "Cincinnati OH", "Louise Achtenberg", "MD", "Late sets", "Jazz/specialty edge", "2", "2", "Format-edge ask: 'Static Bloom' for late sets", "1", "v1 (88w)", "", "", "silent", "only re-pitch with acoustic edit", "2026-09-01", "format edge — correct call to wait"],
  ["2026-03-18", "WUVM", "94.7", "Dayton OH", "Fran Xiong", "PD", "Local hour (Sun)", "Commercial AAA", "2", "2", "Dayton date Apr 20 + radio edit 3:24", "1", "v1 (88w)", "2026-03-19", "auto-reply", "'playlist committee meets Tuesdays'", "nurture; committee = slow, not no", "2026-06-07", ""],
  ["2026-03-18", "WOTR", "91.1", "Terre Haute IN", "Ivy Castellanos", "MD", "Rotation", "College", "2", "2", "Midwest midnight-synth — 'Static Bloom' 3:24", "1", "v1 (88w)", "", "", "silent", "nurture", "2026-06-07", ""],
  ["2026-03-18", "WIRB", "96.1", "Anderson IN", "Peter Novak", "MD", "Evening blocks", "Community", "2", "2", "Indiana stop + 'Static Bloom' radio edit", "1", "v1 (88w)", "", "", "silent", "nurture", "2026-06-07", ""],
  ["2026-03-23", "WVMR", "89.1", "Cincinnati OH", "Dara Whitfield", "Specialty host", "The Night Signal", "College/AAA", "5", "1", "30-second hook for Friday night — Marisol Vega", "2", "hook30", "2026-03-24", "positive", "ADD confirmed via T2 reply", "", "", "T2 worked in 24h"],
  ["2026-03-29", "WBRZ", "89.9", "Louisville KY", "Colleen Marsh", "Host", "River City Unsigned", "Community", "4", "1", "New info: Queen City Beat quote + bigger room Apr 17", "3", "v1 (88w)", "", "", "silent after T3", "nurture", "2026-06-07", "T3 = new info only"],
];

const sendLogTemplateCsv = `${CSV_HEADERS}\n`;

const sendLogExampleCsv = [CSV_HEADERS, ...exampleCsvRows.map((r) => r.map(csvEsc).join(","))].join("\n") + "\n";

/* ─────────────────────────────────────────────────────────────
   REGISTRY
────────────────────────────────────────────────────────────── */

export const FD_FILES: FdFile[] = [
  // Workbooks — blank templates
  { path: "workbooks/WB01-identity-sentence.md", title: "WB01 · Identity Sentence", blurb: "One line a director can file you by.", kind: "md", content: wb01Blank },
  { path: "workbooks/WB02-20-station-war-room.md", title: "WB02 · 20-Station War Room", blurb: "Scored, printable, wall-ready.", kind: "md", content: wb02Blank },
  { path: "workbooks/WB03-90-word-pitch.md", title: "WB03 · 90-Word Pitch Builder", blurb: "Six blocks, one ask, under 90.", kind: "md", content: wb03Blank },
  { path: "workbooks/WB04-21-day-campaign-calendar.md", title: "WB04 · 21-Day Calendar", blurb: "Who to email on which day.", kind: "md", content: wb04Blank },
  { path: "workbooks/WB05-proof-ledger.md", title: "WB05 · Proof Ledger", blurb: "Receipts that compound.", kind: "md", content: wb05Blank },
  // Workbooks — filled example versions
  { path: "workbooks/examples/WB01-identity-sentence-EXAMPLE.md", title: "WB01 · Filled example", blurb: "Marisol’s five drafts, one pinned.", kind: "md", content: wb01Example },
  { path: "workbooks/examples/WB02-20-station-war-room-EXAMPLE.md", title: "WB02 · Filled example", blurb: "All 20 stations, worked to Day 21.", kind: "md", content: wb02Example },
  { path: "workbooks/examples/WB03-90-word-pitch-EXAMPLE.md", title: "WB03 · Filled example", blurb: "The 88-word pitch, block-mapped.", kind: "md", content: wb03Example },
  { path: "workbooks/examples/WB04-21-day-campaign-calendar-EXAMPLE.md", title: "WB04 · Filled example", blurb: "The full 21-day log, honestly scored.", kind: "md", content: wb04Example },
  { path: "workbooks/examples/WB05-proof-ledger-EXAMPLE.md", title: "WB05 · Filled example", blurb: "Five true lines, rotating forward.", kind: "md", content: wb05Example },
  // Swipe file
  { path: "swipe-file/01-subject-lines.md", title: "Swipe · Subject Lines", blurb: "11 templates + 11 filled + the kill list.", kind: "md", content: swipe01 },
  { path: "swipe-file/02-90-word-pitch.md", title: "Swipe · 90-Word Pitch", blurb: "Template + filled example.", kind: "md", content: swipe02 },
  { path: "swipe-file/03-3-touch-follow-up.md", title: "Swipe · 3-Touch Follow-Up", blurb: "Touch 2, Touch 3, and handling the no.", kind: "md", content: swipe03 },
  { path: "swipe-file/04-20-second-call.md", title: "Swipe · 20-Second Call", blurb: "Only after a reply. Then shut up.", kind: "md", content: swipe04 },
  { path: "swipe-file/05-interview-answers.md", title: "Swipe · Interview Answers", blurb: "Five answers under 40 seconds.", kind: "md", content: swipe05 },
  { path: "swipe-file/06-thank-you.md", title: "Swipe · Thank-You", blurb: "Same-day email + station-first social.", kind: "md", content: swipe06 },
  { path: "swipe-file/07-burned-well-apology.md", title: "Swipe · Burned-Well Apology", blurb: "Own it, offer one track, go silent 90 days.", kind: "md", content: swipe07 },
  { path: "swipe-file/08-venue-email.md", title: "Swipe · Venue Email", blurb: "Airplay cited, honest draw numbers.", kind: "md", content: swipe08 },
  { path: "swipe-file/09-client-email.md", title: "Swipe · Client Email", blurb: "Radio proof in a client’s language.", kind: "md", content: swipe09 },
  // Calendar
  { path: "calendar/21-day-calendar.md", title: "Calendar · 21-Day (markdown)", blurb: "The run sheet, copy-paste ready.", kind: "md", content: calendarMd },
  { path: "calendar/21-day-calendar.html", title: "Calendar · Printable one-pager", blurb: "Print CSS, wall-ready.", kind: "html", content: calendarHtml },
  // EPK
  { path: "epk/epk-one-sheet-template.html", title: "EPK · One-sheet template", blurb: "One page. Print to PDF.", kind: "html", content: epkTemplate },
  { path: "epk/epk-one-sheet-example.html", title: "EPK · Filled example", blurb: "Marisol’s one-sheet, done right.", kind: "html", content: epkExample },
  // Logs
  { path: "logs/send-log-template.csv", title: "Send log · CSV template", blurb: "19 columns that prove it happened.", kind: "csv", content: sendLogTemplateCsv },
  { path: "logs/send-log-example.csv", title: "Send log · Filled example", blurb: "22 rows from the example campaign.", kind: "csv", content: sendLogExampleCsv },
];

export function fdFile(path: string): FdFile | undefined {
  return FD_FILES.find((f) => f.path === path);
}

/** MIME types for blob downloads in the classroom. */
export function fdMime(kind: FdFile["kind"]): string {
  if (kind === "html") return "text/html";
  if (kind === "csv") return "text/csv";
  return "text/markdown";
}
