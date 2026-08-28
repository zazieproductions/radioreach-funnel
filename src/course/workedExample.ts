/**
 * FREQUENCY DOMINION — THE WORKED EXAMPLE
 *
 * One fictional artist, Marisol Vega, run through all 24 lessons end-to-end:
 * identity, proof, 20-station war room, pitch pack, 21-day log, ledger, audit.
 *
 * EVERY station, human, show, venue, and outlet below is invented for training.
 * Real contacts come from the Radio Reach Vault — never from this file.
 * The example never claims guaranteed outcomes; it shows the mechanics.
 */

export const EXAMPLE_DISCLAIMER =
  "EXAMPLE ONLY — Marisol Vega, every station, every person, every show, and every number below are fictional, built for training. Never copy example stations or “proof” into your own campaign. Real contacts come from your Radio Reach Vault, and your proof lines must be your own true facts.";

export const ARTIST = {
  name: "Marisol Vega",
  tag: "midnight-synth",
  city: "Cincinnati, OH",
  scene: "Northside / Over-the-Rhine rooms",
  song: "Static Bloom",
  runtime: "3:24 (radio edit) · 4:41 album cut",
  hook: "hook lands 0:38 · chorus by 0:52 · cold ending (no fade) for clean sweeps",
  venue: "The Foundry on Elm (Northside, Cincinnati) — fictional venue, 240-cap, ticketed",
  showDate: "Friday, April 17",
  campaignWindow: "Mon Mar 16 (Day 1) → Sun Apr 5 (Day 21); Week 0 = Mar 9–15",
  identity:
    "I’m the midnight-synth artist Cincinnati specialty shows call when they need a local 3:24 that sounds like rain-slick 1987 Berlin and lands its hook before the second chorus.",
  audience: "2,400 monthly listeners · 61% Ohio · 380-person mailing list",
  oneLiner: "Midnight-synth from Cincinnati — one local, one hook, one ask.",
} as const;

/** M1L1 — five drafts, one pinned. Show the thinking, not just the winner. */
export const IDENTITY_DRAFTS = [
  { draft: 1, text: "I’m a synth-pop artist from Cincinnati chasing my dream.", verdict: "Dead on arrival. Could fit any artist in any city. No station, no job, no clock." },
  { draft: 2, text: "I’m an electronic artist making retro music.", verdict: "Genre vague, city gone, listener feeling absent. Still a fan’s sentence." },
  { draft: 3, text: "I’m a Cincinnati synth artist for late-night radio.", verdict: "Closer. ‘Late-night radio’ is a real daypart. Still no runtime, no proof of fit." },
  { draft: 4, text: "I’m the Cincinnati synth artist specialty shows use for Friday 10pm blocks — 3:24, hook at 0:38.", verdict: "Almost. Daypart, clock, and structure. Missing the emotional cue a host can say on air." },
  { draft: 5, text: "I’m the midnight-synth artist Cincinnati specialty shows call when they need a local 3:24 that sounds like rain-slick 1987 Berlin and lands its hook before the second chorus.", verdict: "PINNED. Insult test passed: no other artist on earth fits this sentence." },
] as const;

export const PINNED_IDENTITY = IDENTITY_DRAFTS[4].text;

/** M1L2 — the clock page. The 4:41 → 3:24 edit is the lesson. */
export const CLOCK_NOTES = {
  target: "Specialty + college blocks (WVMR-style ‘Night Signal’, 10pm Friday)",
  problem: "Album cut of ‘Static Bloom’ is 4:41 with a 56-second intro. Dead on arrival for a 3:30 clock.",
  edits: [
    "Intro 0:56 → 0:12 (ambient pad swapped for the arp that was at 1:40)",
    "Verse 2 halved; second pre-chorus dropped",
    "Outro fade (0:22) replaced with a hard stop — cold ending sweeps clean",
    "Final runtime 3:24 — fits a 3:30 clock with 6 seconds of air",
  ],
  constraintList: [
    "Clock max: 3:30 (specialty blocks) — the edit is 3:24",
    "Clean lyrics (FCC safe-hours thinking): ‘hell of a night’ kept, one ‘goddamn’ flipped to ‘damn the night’ — decided before anyone asked",
    "Cold ending for imaging sweeps — no fade",
    "Localism hook: Cincinnati named in verse 1 (‘the Elm Street loop’) — say-on-air ammo",
    "Competing current: sits between dark-synth adds and 80s-resurgence blocks, not against top-40",
    "Why this week: hometown ticketed date Apr 17 — a reason to spin now, not someday",
  ],
} as const;

/** M1L3 — four true lines. Modest numbers on purpose. */
export const PROOF_STACK = [
  "Headlining The Foundry on Elm (Northside), Fri Apr 17 — 240-cap, ticketed, third Cincinnati headline attempt.",
  "Previous single ‘Glass Coast’ logged a three-week specialty run on ‘Lowlight’ at KCYQ 91.7 Columbus last fall (fictional station).",
  "“Static-charged pop that earns its neon.” — Queen City Beat, premiere review (fictional outlet).",
  "2,400 monthly listeners, 61% in Ohio, 380-person mailing list — hometown gravity, honestly small.",
] as const;

export type RouteStop = {
  city: string;
  date: string;
  dateNote?: string;
  venue: string;
  sendDay: string;
  offer: string;
};

/** M2L2 — the invented 4-city weekend run + the D-21 pre-roll. */
export const ROUTE: RouteStop[] = [
  { city: "Cincinnati, OH", date: "Fri Apr 17", venue: "The Foundry on Elm (240-cap, ticketed)", sendDay: "D-21 → Fri Mar 27 window (already inside the hometown campaign)", offer: "10-min phoner before load-in; live cut if the board allows" },
  { city: "Columbus, OH", date: "Sat Apr 18", venue: "The Rail Yard (fictional, 150-cap)", sendDay: "D-21 → Sat Mar 28", offer: "Interview window Sat afternoon 2–4pm" },
  { city: "Louisville, KY", date: "Sun Apr 19", venue: "Falls City Listening Room (fictional, 120-cap)", sendDay: "D-21 → Sun Mar 29", offer: "Sunday-night local block pitch + 3:24 edit" },
  { city: "Dayton, OH", date: "Mon Apr 20", dateNote: "off-night", venue: "Third Street Basements (fictional, 90-cap)", sendDay: "D-21 → Mon Mar 30", offer: "Off-night in-studio acoustic + full-band Friday pitch for summer" },
] as const;

export type WarRoomRow = {
  n: number;
  station: string;
  dial: string;
  city: string;
  format: string;
  show: string;
  contact: string;
  role: string;
  score: number;
  batch: 1 | 2;
  endStatus: string;
  next: string;
};

/** M2L3 / M2L4 — the 20-station war room, scored and worked to Day 21.
 *  Score = genre (0–2) + locality (0–1) + named human (0–1) + recent indie adds (0–1). */
export const WAR_ROOM: WarRoomRow[] = [
  { n: 1, station: "WVMR", dial: "89.1", city: "Cincinnati OH", format: "College · AAA/specialty", show: "The Night Signal (Fri 10pm)", contact: "Dara Whitfield", role: "Specialty host", score: 5, batch: 1, endStatus: "ADDED — spin Mar 27 10:42pm; specialty chart #7 (3 wks)", next: "Thank-you sent; next single early, no spam" },
  { n: 2, station: "WCBX", dial: "91.7", city: "Cincinnati OH", format: "Community", show: "Homegrown Signal (Sun 9am)", contact: "Marcus Boone", role: "Host / MD", score: 5, batch: 1, endStatus: "REPLIED → INTERVIEW — 10-min phoner Mar 31, aired Apr 5", next: "Clip the pull-quote for ledger + EPK" },
  { n: 3, station: "KCYQ", dial: "91.7", city: "Columbus OH", format: "College · specialty", show: "Lowlight (Wed 11pm)", contact: "Elena Vasquez", role: "Specialty host", score: 5, batch: 1, endStatus: "Sent → T2 → silent (prior ‘Glass Coast’ add = warm door)", next: "Chart week pending; re-pitch with Rail Yard date" },
  { n: 4, station: "WNTL", dial: "93.7", city: "Indianapolis IN", format: "Community · specialty", show: "Midwest After Dark (Sat 11pm)", contact: "Yuki Tanaka", role: "Host", score: 4, batch: 1, endStatus: "REPLIED — asked for the 30s hook for imaging (Apr 1)", next: "Sent same day; nurture with next single" },
  { n: 5, station: "WDLX", dial: "90.5", city: "Dayton OH", format: "Community", show: "Miami Valley Music (Thu 6pm)", contact: "Sam Okafor", role: "MD", score: 4, batch: 1, endStatus: "REPLIED → CLEAN NO — “try me in the fall with the next one”", next: "Door open; calendar the fall re-pitch + Third St date" },
  { n: 6, station: "WBRZ", dial: "89.9", city: "Louisville KY", format: "Community", show: "River City Unsigned (Sun 10am)", contact: "Colleen Marsh", role: "Host", score: 4, batch: 1, endStatus: "Sent → T2 → T3 → silent", next: "Nurture list; Falls City date is the next hook" },
  { n: 7, station: "WOKP", dial: "104.9", city: "Oxford OH", format: "College", show: "Modern block (daily)", contact: "Renee Kowalski", role: "MD", score: 4, batch: 1, endStatus: "Sent → T2 → opened (link click logged), no reply", next: "Warmed but shy; offer a live cut next cycle" },
  { n: 8, station: "WQRT", dial: "88.3", city: "Cincinnati OH", format: "College · modern rock", show: "Rotation + local block", contact: "Priya Raman", role: "MD", score: 4, batch: 1, endStatus: "Sent → T2 → T3 → silent", next: "Nurture; add ‘now spinning on WVMR’ line next pitch" },
  { n: 9, station: "WCTR", dial: "95.1", city: "Columbus OH", format: "Community · specialty", show: "Scioto Sound (Fri 9pm)", contact: "Naomi Bell", role: "Host", score: 4, batch: 1, endStatus: "Sent → T2 → T3 → silent", next: "Re-pitch with Rail Yard Sat date" },
  { n: 10, station: "WXSI", dial: "88.5", city: "Newport KY", format: "College", show: "Evening rotation", contact: "Talia Osei", role: "MD", score: 3, batch: 1, endStatus: "Sent → T2 → silent", next: "Nurture" },
  { n: 11, station: "WSKV", dial: "91.3", city: "Covington KY", format: "Community", show: "Drive local hour", contact: "Aaron Delgado", role: "PD", score: 3, batch: 2, endStatus: "Sent → silent", next: "Nurture; low priority" },
  { n: 12, station: "WGCE", dial: "90.1", city: "Hamilton OH", format: "College", show: "Rotation", contact: "Devon Pryce", role: "MD", score: 3, batch: 2, endStatus: "Sent → silent", next: "Nurture" },
  { n: 13, station: "WLQV", dial: "100.3", city: "Middletown OH", format: "Community", show: "Weekend blocks", contact: "Grace Lindqvist", role: "MD", score: 3, batch: 2, endStatus: "Sent → T2 → silent", next: "Nurture" },
  { n: 14, station: "WMRF", dial: "89.5", city: "Bloomington IN", format: "College", show: "Rotation", contact: "Omar Haddad", role: "MD", score: 3, batch: 2, endStatus: "Sent → silent", next: "Nurture" },
  { n: 15, station: "WVLB", dial: "89.3", city: "Louisville KY", format: "Community · specialty", show: "Louisville Low End (Sat 9pm)", contact: "Hector Ruiz", role: "Host", score: 3, batch: 2, endStatus: "Sent → T3 → “maybe summer”", next: "Calendar a June touch" },
  { n: 16, station: "WLXF", dial: "92.5", city: "Lexington KY", format: "College", show: "Rotation", contact: "Theo Brandt", role: "MD", score: 3, batch: 2, endStatus: "Sent → silent", next: "Nurture" },
  { n: 17, station: "WJHR", dial: "88.9", city: "Cincinnati OH", format: "Jazz/specialty edge", show: "Late sets", contact: "Louise Achtenberg", role: "MD", score: 2, batch: 2, endStatus: "Sent → silent (format edge — correct call to wait)", next: "Only re-pitch with the acoustic edit" },
  { n: 18, station: "WUVM", dial: "94.7", city: "Dayton OH", format: "Commercial AAA", show: "Local hour (Sun)", contact: "Fran Xiong", role: "PD", score: 2, batch: 2, endStatus: "Sent → auto-reply: “playlist committee meets Tuesdays”", next: "Nurture; committee = slow, not no" },
  { n: 19, station: "WOTR", dial: "91.1", city: "Terre Haute IN", format: "College", show: "Rotation", contact: "Ivy Castellanos", role: "MD", score: 2, batch: 2, endStatus: "Sent → silent", next: "Nurture" },
  { n: 20, station: "WIRB", dial: "96.1", city: "Anderson IN", format: "Community", show: "Evening blocks", contact: "Peter Novak", role: "MD", score: 2, batch: 2, endStatus: "Sent → silent", next: "Nurture" },
];

/** Cut at scoring — the discipline most artists skip. */
export const CUT_AT_SCORING = [
  "WKQN 106.5 Louisville — active rock — score 1. Right city, wrong planet. Do not touch.",
  "WQXJ 107.8 Cincinnati — syndicated top-40 — score 0. No named human, no indie adds, no clock fit.",
  "WDDR 101.9 Dayton — full-service standards — score 1. Lovely people. Wrong genre. Leave them alone.",
] as const;

/** M3L1 — eleven filled subject lines. */
export const SUBJECT_LINES = [
  "Cincinnati midnight-synth for The Night Signal — 3:24",
  "Interview window Apr 14–16 + ‘Static Bloom’",
  "Local date Apr 17 (Foundry on Elm) — radio edit 3:24",
  "Follow-up: still a fit for The Night Signal?",
  "30-second hook for Friday night — Marisol Vega",
  "89.1 specialty: ‘Static Bloom’ (3 wks on KCYQ’s Lowlight)",
  "Load-in Cincinnati Apr 17 — live cut + radio edit",
  "Replacement link — ‘Static Bloom’ 3:24 (first one broke)",
  "Dara — one track, one ask",
  "Hometown midnight-synth for this week’s Night Signal",
  "New info: Queen City Beat quote + bigger room Apr 17",
] as const;

/** M3L2 — the filled 90-word pitch (word-counted: 88 body words). */
export const PITCH_90 = {
  to: "Dara Whitfield — WVMR 89.1, ‘The Night Signal’",
  subject: "Cincinnati midnight-synth for The Night Signal — 3:24",
  body: [
    "Dara —",
    "Your March 7 local block — that Wells-to-Corbin segue — was perfect Friday radio. I’m Marisol Vega, Cincinnati midnight-synth. ‘Static Bloom’ is 3:24, built for a 10pm block: hook at 0:38, cold ending. I headline Foundry on Elm April 17. Proof: ‘Glass Coast’ ran three weeks on KCYQ’s Lowlight; “static-charged pop that earns its neon” — Queen City Beat. Radio edit: vega.link/staticbloom.",
    "One ask: a spin on The Night Signal before the 17th? A one-line no is enough.",
    "— Marisol Vega · Cincinnati · (513) 555-0184",
  ],
  wordCount: 88,
} as const;

export const TOUCH_2 = {
  to: "Non-responders, Days 8–10 (12 stations in the example)",
  subject: "30-second hook for Friday night — Marisol Vega",
  body: [
    "Dara — a 30-second version if that’s easier: vega.link/hook30. The chorus lands by 0:52. Still a fit for The Night Signal before April 17?",
    "Either way — thanks for running a local block in a town that pretends it doesn’t have one.",
    "— Marisol",
  ],
} as const;

export const TOUCH_3 = {
  to: "Still-silent contacts, Day 14 (9 stations in the example)",
  subject: "New info: Queen City Beat quote + bigger room Apr 17",
  body: [
    "Dara — new since my last note, and then I’ll go quiet: Queen City Beat ran the premiere (“static-charged pop that earns its neon”), and Foundry on Elm moved us to the big room — same night, Apr 17.",
    "If ‘Static Bloom’ still isn’t a fit, happy to drop it. If it is, the 3:24 cold ending sweeps clean.",
    "— Marisol",
  ],
} as const;

export const THANK_YOU = {
  to: "Dara Whitfield, sent Day 11 (Mar 26) — same day as the add confirmation",
  subject: "Thank you — Night Signal, Mar 27",
  body: [
    "Dara — thank you. ‘Static Bloom’ spinning on The Night Signal is the first Cincinnati add of my life that felt like a door instead of a fluke.",
    "I posted the chart screenshot and tagged the station first (post attached — say the word and it comes down).",
    "If you ever need a live cut, a 15-second ID, or a local for a Friday fill-in, I’m 15 minutes from the studio.",
    "Next single lands in June. It reaches you early, once, with no follow-up spam.",
    "— Marisol",
  ],
} as const;

export const SOCIAL_POST = [
  "‘Static Bloom’ spun on The Night Signal — 89.1 WVMR, Friday 10:42pm. Cincinnati radio played a Cincinnati song and the drive home felt like a movie. Thank you, Dara. 📻",
  "Rules: station credited first, host tagged once, screenshot theirs, zero asks in the post.",
] as const;

/** M5L4 — the apology, written for a blast Marisol supposedly sent in a past life. */
export const APOLOGY = {
  to: "Louise Achtenberg (WJHR) — stand-in for any burned contact",
  subject: "I blasted you last year — owning it, one track, then silence",
  body: [
    "Louise — in October I BCC’d you and forty other stations the same ‘please consider my single’ email. Twice. That was disrespectful to you and to the late-set audience you program for.",
    "I won’t do it again. If one relevant track is ever useful: vega.link/staticbloom — a 3:24 midnight-synth record, honestly an edge-fit for your format.",
    "Ignore it with my blessing. You will not hear from me for 90 days.",
    "— Marisol Vega",
  ],
} as const;

/** M5L1 — the 20-second call, placed correctly (after a reply, before the ask). */
export const CALL_SCRIPT = {
  when: "Day 5, after Marcus Boone’s ‘send the EPK’ reply — never cold",
  script: [
    "“Marcus — Marisol Vega, the Cincinnati synth artist, EPK landed yesterday for Homegrown Signal.”",
    "“One ask: ten minutes on the phone before April 17? I’ll take any slot, and I’ll keep it to ten.”",
    "“If email’s better, say so and I’ll stop calling.”",
  ],
  then: "Shut up. He said yes on Day 12. Total call time: 41 seconds.",
} as const;

/** M5L2 — five interview answers, each under 40 seconds spoken. */
export const INTERVIEW_ANSWERS = [
  { q: "Where did ‘Static Bloom’ come from?", a: "Driving the Elm Street loop at 1am after a gig nobody came to. The streetlight strobe through a wet windshield — that’s the whole song. It took nine minutes to write and nine months to finish." },
  { q: "What does Cincinnati mean to this record?", a: "Everything local is load-bearing. Verse one names the loop. The record was mixed on Elm. If a host needs one line on air: ‘it’s a Cincinnati song that sounds like Cincinnati at 1am.’" },
  { q: "What does it sound like?", a: "Midnight-synth — dark 80s pop with a modern low end. If you played Depeche Mode next to Charli XCX next to me, nobody reaches for the dial." },
  { q: "What should listeners do?", a: "Foundry on Elm, Friday April 17. Bring someone you’d drive the loop with. If they can’t come, the song is everywhere April 18." },
  { q: "Pull-quote for imaging", a: "“Static Bloom — Friday nights on The Night Signal, 89.1.” Fifteen seconds, cold ending, sweeps clean." },
] as const;

/** M3L3 — EPK fact block (the one-sheet HTML version lives in assets.ts). */
export const EPK_FACTS = [
  "Who: Marisol Vega — midnight-synth — Cincinnati, OH",
  "What: ‘Static Bloom’ — 3:24 radio edit / 4:41 album cut — hook 0:38, cold ending",
  "Sounds like: dark 80s synth-pop, modern low end (Depeche Mode × Charli XCX room, dial-safe)",
  "Why now: hometown ticketed headline, Foundry on Elm, Fri Apr 17 (240-cap)",
  "Proof: 3-wk specialty run ‘Glass Coast’ (KCYQ Lowlight) · Queen City Beat premiere quote · 2,400 ML / 61% Ohio",
  "Files: WAV + MP3 radio edit · 30s hook · one-sheet PDF — all one link, never an attachment",
  "Ask: one spin on a Friday-night block before Apr 17. A one-line no is enough.",
] as const;

/** M3L4 — the audio manifest. File discipline is the lesson. */
export const AUDIO_MANIFEST = [
  "VegaMarisol_StaticBloom_RadioEdit_3-24.wav — 44.1/24 · -1.0 dBTP · clean metadata (artist, title, ISRC, contact email)",
  "VegaMarisol_StaticBloom_RadioEdit_3-24.mp3 — 320kbps · same metadata · the link most hosts will actually click",
  "VegaMarisol_StaticBloom_Hook_0-30.mp3 — starts at 0:32, chorus by 0:52 · for Touch 2 and imaging",
  "Naming rule: Artist_Song_Version_Runtime. No finalFINAL3.wav. No ‘untitled bounce 7’.",
  "One link (vega.link/staticbloom) resolves to a folder with all three + the one-sheet PDF. Never email attachments unasked.",
] as const;

/** M4L1 — Week 0, done before Day 1. */
export const WEEK_0 = [
  "Vault filtered: Cincinnati metro + 90-min ring (Covington, Newport, Dayton, Oxford, Hamilton, Middletown) + Columbus / Louisville / Indianapolis ring",
  "Scored: 25 hometown candidates → 20 in, 3 cut at scoring, 2 duplicates removed",
  "Assets frozen: radio edit 3:24 · 30s hook · EPK one-sheet · pitch locked at 88 words",
  "Calendar blocked: Mon/Wed 6–6:45pm sends, Fri 6–6:45pm logging + audit, Sun 15-min review",
  "Accountability human: bandmate Dev — gets the war-room photo every Sunday",
] as const;

export type LogDay = {
  day: number;
  date: string;
  action: string;
  outcome: string;
  kind: "load" | "send" | "silence" | "reply" | "no" | "add" | "interview" | "audit" | "compound";
};

/** The 21-day log. Silence is data. Numbers stay honest. */
export const LOG: LogDay[] = [
  { day: 1, date: "Mon Mar 16", action: "First blood: 10 A-list sends (rows 1–10), each with a personal first line. Subject #1 to WVMR.", outcome: "10 sent · 0 replies · logged 10", kind: "send" },
  { day: 2, date: "Tue Mar 17", action: "No sends. 20 minutes: proof-read two queued subject lines, verify link tracking.", outcome: "Silence. Silence is data.", kind: "silence" },
  { day: 3, date: "Wed Mar 18", action: "Batch 2: rows 11–20 sent (10 more). Two get the format-edge framing (jazz, AAA committee).", outcome: "20/20 sent · 0 replies · that is normal on day 3", kind: "send" },
  { day: 4, date: "Thu Mar 19", action: "REPLY — Marcus Boone (WCBX): “Send the EPK and the WAV. No promises.”", outcome: "EPK + link sent same day, 11:04am. Logged.", kind: "reply" },
  { day: 5, date: "Fri Mar 20", action: "20-second call to Marcus (post-reply — legal). EPK confirmed received.", outcome: "41-second call · door open, no ask forced", kind: "reply" },
  { day: 6, date: "Sat Mar 21", action: "Nothing due. Rest is part of the calendar.", outcome: "Silence across the board.", kind: "silence" },
  { day: 7, date: "Sun Mar 22", action: "Weekly audit: 20 sent, 2 human replies, 18 pending. War-room photo → Dev.", outcome: "10% reply rate at day 7. On pace.", kind: "audit" },
  { day: 8, date: "Mon Mar 23", action: "Touch 2 to 12 non-responders — 30s hook link, two sentences, no guilt.", outcome: "12 sent · 2 opened (link clicks logged)", kind: "send" },
  { day: 9, date: "Tue Mar 24", action: "REPLY — Dara Whitfield (WVMR): “Cold ending sweeps clean. Night Signal Friday. Adding to the chart.”", outcome: "ADD #1 CONFIRMED. Thank-you drafted within the hour.", kind: "add" },
  { day: 10, date: "Wed Mar 25", action: "REPLY — Sam Okafor (WDLX): “Not for current rotation. Try me in the fall with the next one.”", outcome: "CLEAN NO. Thanked same day. Door open, not burned.", kind: "no" },
  { day: 11, date: "Thu Mar 26", action: "Thank-yous out: Dara (email + social post crediting station first), Marcus (reply-confirm).", outcome: "Champions made to feel seen. Zero asks attached.", kind: "compound" },
  { day: 12, date: "Fri Mar 27", action: "THE SPIN AIRS — ‘Static Bloom,’ The Night Signal, 10:42pm.", outcome: "Screenshot → proof ledger → EPK proof line updated.", kind: "add" },
  { day: 13, date: "Sat Mar 28", action: "No actions due. Buffer day protects the schedule from real life.", outcome: "Silence on remaining Touch 2s.", kind: "silence" },
  { day: 14, date: "Sun Mar 29", action: "Touch 3 to 9 still-silent contacts — new info only (QCB quote + room upgrade). Then quiet.", outcome: "9 sent · no guilt language anywhere", kind: "send" },
  { day: 15, date: "Mon Mar 30", action: "WVMR specialty chart posts: ‘Static Bloom’ at #7.", outcome: "Ledger entry #4. Pitch v2 now says “now spinning on 89.1.”", kind: "compound" },
  { day: 16, date: "Tue Mar 31", action: "INTERVIEW — 10 minutes with Marcus Boone for Homegrown Signal, airs Sun Apr 5.", outcome: "5 answers under 40s · 15-sec pull-quote captured for imaging", kind: "interview" },
  { day: 17, date: "Wed Apr 1", action: "REPLY — Yuki Tanaka (WNTL): “Send the 30. Might use it for imaging.”", outcome: "Hook file sent 12 minutes later. Nurture, not a conversion — logged honestly.", kind: "reply" },
  { day: 18, date: "Thu Apr 2", action: "Audit: 20 sends · 12 T2 · 9 T3 · 4 human replies (20%) · 1 add · 1 interview · 1 clean no · 0 burned wells.", outcome: "Silence count: 14. The campaign worked anyway.", kind: "audit" },
  { day: 19, date: "Fri Apr 3", action: "Clone war room → Market 2: Columbus / Louisville, 15 stations, KCYQ first (warm door).", outcome: "Market 2 loaded, Day 1 set for Apr 10.", kind: "load" },
  { day: 20, date: "Sat Apr 4", action: "Proof ledger finalized: 5 entries. EPK proof line now leads with WVMR.", outcome: "Proof compounds. Next campaign starts from higher ground.", kind: "compound" },
  { day: 21, date: "Sun Apr 5", action: "Homegrown Signal airs the interview, 9:15am. Campaign closes.", outcome: "21 days: 1 add, 1 interview, 1 imaging ask, 1 clean no, 14 silences, 0 burned wells. Market 2 tomorrow.", kind: "interview" },
];

/** M6L1 — the proof ledger, compounding. */
export const LEDGER = [
  { date: "Last fall", station: "KCYQ 91.7 Columbus", what: "‘Glass Coast’ — 3-wk specialty run (Lowlight)", use: "Proof line #2 in the campaign pitch" },
  { date: "Mar 27", station: "WVMR 89.1 Cincinnati", what: "‘Static Bloom’ spin, The Night Signal 10:42pm", use: "Ledger entry + social + EPK line #1" },
  { date: "Mar 30", station: "WVMR 89.1 Cincinnati", what: "Specialty chart #7 (3 weeks)", use: "“Charting Cincinnati specialty” in pitch v2" },
  { date: "Apr 5", station: "WCBX 91.7 Cincinnati", what: "10-min interview, Homegrown Signal", use: "Pull-quote for imaging + venue pitches" },
  { date: "Apr 1", station: "WNTL 93.7 Indianapolis", what: "30s hook requested for imaging", use: "Nurture proof — ‘other hosts use the hook’" },
] as const;

/** M6L2 — airplay routed into income. */
export const VENUE_EMAIL = {
  to: "Booker, The Rail Yard (Columbus) — fictional venue",
  subject: "Cincinnati synth headliner for Sat Apr 18 — ‘spinning on 89.1 WVMR’",
  body: [
    "Hi Devon — Marisol Vega here (midnight-synth, Cincinnati).",
    "Short version: I headline Foundry on Elm in Cincinnati on Apr 17 (240-cap, ticketed) and I’d like the Columbus stop the next night, Sat Apr 18.",
    "Why it fills a room: ‘Static Bloom’ is spinning on 89.1 WVMR’s The Night Signal (chart #7), I ran a 3-week specialty add in Columbus last fall on KCYQ’s Lowlight, and 61% of my 2,400 monthly listeners are in Ohio.",
    "I can send the radio edit, the press one-sheet, and the WCBX interview clip. Guarantee numbers honestly: 40–60 drawn on a Saturday with three weeks of radio behind it, growing.",
    "One ask: a Sat Apr 18 slot, 40-minute set. If the calendar’s full, what date works?",
    "— Marisol Vega · vega.link/staticbloom · (513) 555-0184",
  ],
} as const;

export const CLIENT_EMAIL = {
  to: "Sync/licensing supervisor + freelance client (the ‘badge’ pitch)",
  subject: "Regional radio data for your Ohio campaign — Marisol Vega",
  body: [
    "Hi Priya — you asked for artists with real Midwest traction for the dealership spot.",
    "Numbers, not vibes: ‘Static Bloom’ is spinning on Cincinnati specialty radio (WVMR, chart #7), ran 3 weeks in Columbus (KCYQ), with an on-air interview airing this Sunday. 61% of streaming listeners are in Ohio — the exact map the buy covers.",
    "The track is radio-clean, 3:24, with a 30-second hook cut already built for imaging.",
    "One ask: 15 minutes this week to play you the hook against the brief?",
    "— Marisol",
  ],
} as const;

/** M6L3 — next single mapped onto the T-28 skeleton. */
export const RELEASE_MAP = [
  { t: "T-42", date: "Apr 26", action: "Pick single #2 (‘Neon Rust’); lock the 3:2x radio edit + cold ending" },
  { t: "T-28", date: "May 10", action: "War room clone: Market 2 (Columbus/Louisville) + refreshed hometown 20" },
  { t: "T-21", date: "May 17", action: "First sends — 20 stations, pitch v2 leads with “spinning on 89.1 WVMR”" },
  { t: "T-14", date: "May 24", action: "Touch 2 + 30s hook for imaging; EPK proof line updated" },
  { t: "T-7", date: "May 31", action: "Touch 3 — new info only: chart position + venue on-sale numbers" },
  { t: "T-0", date: "Jun 7", action: "Release day: thank-yous staged, war-room statuses frozen for the audit" },
  { t: "T+2", date: "Jun 9", action: "Thank-you wave; ledger updated; screenshot everything that aired" },
] as const;

/** M6L4 — the audit + the 90-day review. */
export const AUDIT = {
  sends: 20,
  touch2: 12,
  touch3: 9,
  humanReplies: 4,
  replyRate: "20%",
  adds: 1,
  interviews: 1,
  imagingAsks: 1,
  cleanNos: 1,
  burnedWells: 0,
  verdict:
    "1 add per 20 sends is a real, honest first campaign in a mid-size market. The win is bigger than the spin: a ledger of 5 proof entries, one warm door in Columbus, zero burned wells, and a war room that is now a repeatable machine. Market 2 starts from higher ground.",
  reviewScheduled: "Jun 14 (Day 90) — kill or double each format; decide whether Lexington/Terre Haute stay on the ladder.",
} as const;

/* ─────────────────────────────────────────────────────────────
   Per-lesson worked-example sections (classroom drawer + zip).
────────────────────────────────────────────────────────────── */

export type ExampleSection = { title: string; note?: string; body: string[] };

const warRoomLines = () => [
  "Score = genre (0–2) + locality (0–1) + named human (0–1) + recent indie adds (0–1). Batch 1 = Day 1 (A-list), Batch 2 = Day 3.",
  "",
  "| # | Station | City | Contact · Role | Show / Format | Score | Status at Day 21 |",
  "|---|---------|------|----------------|---------------|:-----:|------------------|",
  ...WAR_ROOM.map(
    (r) =>
      `| ${r.n} | ${r.station} ${r.dial} | ${r.city} | ${r.contact} · ${r.role} | ${r.show} — ${r.format} | ${r.score} | ${r.endStatus} |`
  ),
  "",
  "Cut at scoring (the discipline most artists skip):",
  ...CUT_AT_SCORING.map((c) => `- ${c}`),
];

export const EXAMPLE_SECTIONS: Record<string, ExampleSection> = {
  m1l1: {
    title: "Marisol’s identity sentence — five drafts, one survivor",
    body: [
      ...IDENTITY_DRAFTS.map((d) => `**Draft ${d.draft}:** “${d.text}”\n→ ${d.verdict}`),
      "",
      `**Pinned above the send list:** “${PINNED_IDENTITY}”`,
    ],
  },
  m1l2: {
    title: "The clock page — 4:41 album cut → 3:24 radio edit",
    body: [
      `**Problem:** ${CLOCK_NOTES.problem}`,
      "",
      "**Edits made:**",
      ...CLOCK_NOTES.edits.map((e) => `- ${e}`),
      "",
      "**Constraint list for the target format:**",
      ...CLOCK_NOTES.constraintList.map((c) => `- ${c}`),
    ],
  },
  m1l3: {
    title: "Marisol’s 4-line proof stack (all true, all modest)",
    body: PROOF_STACK.map((p) => `- ${p}`),
  },
  m1l4: {
    title: "The oath, signed",
    body: [
      "“I will send to 20 named humans this campaign. Zero BCC blasts. Zero ‘Hi there.’ Zero identical paragraphs across formats. I will verify every address in the Vault before it goes out, and I will take the no.”",
      "",
      "Signed: Marisol Vega, Mar 15 (Day 0). Photo sent to her accountability human, Dev.",
    ],
  },
  m2l1: {
    title: "Hometown extract — 25 candidates, honest cuts",
    body: [
      "Vault filter: Cincinnati metro first, then the 90-minute ring (Covington, Newport, Dayton, Oxford, Hamilton, Middletown), then the Columbus / Louisville / Indianapolis ladder.",
      "",
      "- 25 candidates extracted, deduped against the fall ‘Glass Coast’ list",
      "- 3 cut at scoring (see war room notes), 2 merged as duplicates",
      "- Final 20 loaded — every row has a named human or it does not ship",
    ],
  },
  m2l2: {
    title: "The invented 4-city run + D-21 pre-roll",
    body: [
      "| City | Date | Venue (fictional) | Send day (D-21) | Interview offer |",
      "|------|------|-------------------|-----------------|-----------------|",
      ...ROUTE.map((r) => `| ${r.city} | ${r.date}${r.dateNote ? ` (${r.dateNote})` : ""} | ${r.venue} | ${r.sendDay} | ${r.offer} |`),
    ],
  },
  m2l3: {
    title: "Format-fit scoring, applied",
    body: [
      "WVMR: genre 2 + locality 1 + named human (Dara) 1 + indie adds 1 = **5 → send Day 1.**",
      "WUVM (commercial AAA): genre 1 + locality 1 + named human 1 + committee (no adds signal) 0 = **2 → nurture expectations, send anyway, slow yes.**",
      "WKQN (active rock): genre 0 + locality 1 + named human 0 + 0 = **1 → do not touch.** Right city, wrong planet.",
      "",
      "Rule in action: no A-game personal audio goes to a 2. The 30-second hook and the phoner offer are reserved for 4–5s.",
    ],
  },
  m2l4: { title: "The 20-station war room, worked to Day 21", body: warRoomLines() },
  m3l1: {
    title: "Marisol’s 11 subject lines (filled)",
    body: SUBJECT_LINES.map((s, i) => `${i + 1}. ${s}`),
    note: "She kept #1, #5, and #11. The losers were never reused on the same contact.",
  },
  m3l2: {
    title: "The filled 90-word pitch — 88 words",
    body: [
      `**To:** ${PITCH_90.to}`,
      `**Subject:** ${PITCH_90.subject}`,
      "",
      ...PITCH_90.body,
      "",
      `Word count: ${PITCH_90.wordCount}/90. Read aloud in 38 seconds.`,
    ],
  },
  m3l3: { title: "EPK fact block (the one-sheet HTML version ships in the zip)", body: EPK_FACTS.map((f) => `- ${f}`) },
  m3l4: { title: "Audio manifest — the folder a director never gets lost in", body: AUDIO_MANIFEST.map((a) => `- ${a}`) },
  m4l1: { title: "Week 0 — loaded and frozen", body: WEEK_0.map((w) => `- ${w}`) },
  m4l2: {
    title: "Days 1–7 — the log",
    body: LOG.filter((l) => l.day <= 7).map((l) => `**Day ${l.day} · ${l.date} —** ${l.action}\n→ ${l.outcome}`),
  },
  m4l3: {
    title: "Touch 2 + Touch 3, filled",
    body: [
      `**Touch 2 (Day 8)** — to ${TOUCH_2.to}`,
      `Subject: ${TOUCH_2.subject}`,
      "",
      ...TOUCH_2.body,
      "",
      `**Touch 3 (Day 14)** — to ${TOUCH_3.to}`,
      `Subject: ${TOUCH_3.subject}`,
      "",
      ...TOUCH_3.body,
    ],
  },
  m4l4: {
    title: "Days 15–21 — converting replies into facts",
    body: LOG.filter((l) => l.day >= 15).map((l) => `**Day ${l.day} · ${l.date} —** ${l.action}\n→ ${l.outcome}`),
  },
  m5l1: {
    title: "The 20-second call, placed correctly",
    body: [`**When:** ${CALL_SCRIPT.when}`, "", ...CALL_SCRIPT.script, "", `**Then:** ${CALL_SCRIPT.then}`],
  },
  m5l2: { title: "Five interview answers, each under 40 seconds", body: INTERVIEW_ANSWERS.map((a) => `**${a.q}**\n“${a.a}”`) },
  m5l3: {
    title: "Thank-you email + social post",
    body: [`**Email — ${THANK_YOU.to}**\nSubject: ${THANK_YOU.subject}`, "", ...THANK_YOU.body, "", ...SOCIAL_POST.map((s, i) => (i === 0 ? `**Social post:**\n“${s}”` : s))],
  },
  m5l4: {
    title: "The burned-well apology, filled",
    body: [`**To:** ${APOLOGY.to}\nSubject: ${APOLOGY.subject}`, "", ...APOLOGY.body],
  },
  m6l1: {
    title: "The proof ledger, compounding",
    body: [
      "| Date | Station | What happened | Where it gets reused |",
      "|------|---------|---------------|---------------------|",
      ...LEDGER.map((l) => `| ${l.date} | ${l.station} | ${l.what} | ${l.use} |`),
    ],
  },
  m6l2: {
    title: "Venue email + client email, citing a specific station",
    body: [
      `**Venue — ${VENUE_EMAIL.to}**\nSubject: ${VENUE_EMAIL.subject}`,
      "",
      ...VENUE_EMAIL.body,
      "",
      `**Client — ${CLIENT_EMAIL.to}**\nSubject: ${CLIENT_EMAIL.subject}`,
      "",
      ...CLIENT_EMAIL.body,
    ],
  },
  m6l3: {
    title: "Single #2 (June) mapped onto the T-28 skeleton",
    body: [
      "| T-minus | Date | Action |",
      "|---------|------|--------|",
      ...RELEASE_MAP.map((r) => `| ${r.t} | ${r.date} | ${r.action} |`),
    ],
  },
  m6l4: {
    title: "The 21-day audit + the 90-day review",
    body: [
      `- Sends: ${AUDIT.sends} · Touch 2: ${AUDIT.touch2} · Touch 3: ${AUDIT.touch3}`,
      `- Human replies: ${AUDIT.humanReplies} (${AUDIT.replyRate}) · Adds: ${AUDIT.adds} · Interviews: ${AUDIT.interviews} · Imaging asks: ${AUDIT.imagingAsks} · Clean nos: ${AUDIT.cleanNos} · Burned wells: ${AUDIT.burnedWells}`,
      "",
      AUDIT.verdict,
      "",
      `**Review scheduled:** ${AUDIT.reviewScheduled}`,
    ],
  },
};

export function exampleFor(lessonId: string): ExampleSection | null {
  return EXAMPLE_SECTIONS[lessonId] ?? null;
}
