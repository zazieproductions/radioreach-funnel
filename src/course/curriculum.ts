import type { Lesson, Module } from "./types";
import { M1 } from "./lessons/m1";
import { M2 } from "./lessons/m2";
import { M3 } from "./lessons/m3";
import { M4 } from "./lessons/m4";
import { M5 } from "./lessons/m5";
import { M6 } from "./lessons/m6";

export type { Lesson, Module };

export const COURSE = {
  key: "frequency_dominion" as const,
  name: "Frequency Dominion",
  shortName: "Frequency Dominion Course",
  price: 97,
  compareAt: 997,
  tagline: "The 21-day radio campaign operating system for independent artists who refuse to stay unheard.",
};

export const MODULES: Module[] = [
  {
    id: "m1",
    n: "01",
    title: "Command Identity",
    promise: "Stop sounding like a fan. Start sounding like a station's problem-solver.",
    lessons: M1,
  },
  {
    id: "m2",
    n: "02",
    title: "Target Architecture",
    promise: "Build a city-by-city ladder so every send has a reason.",
    lessons: M2,
  },
  {
    id: "m3",
    n: "03",
    title: "The Pitch Weapon",
    promise: "Emails that survive 1.4 seconds of a music director's thumb.",
    lessons: M3,
  },
  {
    id: "m4",
    n: "04",
    title: "The 21-Day Campaign",
    promise: "A calendar that tells you who to email on which day.",
    lessons: M4,
  },
  {
    id: "m5",
    n: "05",
    title: "Human Frequency",
    promise: "Calls, interviews, and relationships that survive one song.",
    lessons: M5,
  },
  {
    id: "m6",
    n: "06",
    title: "Empire Loop",
    promise: "Turn one add into a machine: proof, income, next release.",
    lessons: M6,
  },
];

export const WORKBOOKS = [
  { id: "wb1", title: "WB01 · Identity Sentence", blurb: "One line that makes a director understand why you exist.", file: "workbooks/WB01-identity-sentence.md" },
  { id: "wb2", title: "WB02 · 20-Station War Room", blurb: "A/B/C scores, send dates, status, next touch. Print it.", file: "workbooks/WB02-20-station-war-room.md" },
  { id: "wb3", title: "WB03 · 90-Word Pitch Builder", blurb: "Six blocks, ninety words, one ask.", file: "workbooks/WB03-90-word-pitch.md" },
  { id: "wb4", title: "WB04 · 21-Day Campaign Calendar", blurb: "Who to email on which day, Week 0 to Day 21.", file: "workbooks/WB04-21-day-campaign-calendar.md" },
  { id: "wb5", title: "WB05 · Proof Ledger", blurb: "Adds, quotes, interviews — compounding receipts.", file: "workbooks/WB05-proof-ledger.md" },
];

export const COMMUNITY_PROMPTS = [
  "Drop your identity sentence. If it could fit any artist, rewrite it.",
  "Post a redacted 90-word pitch. We roast length, not your soul.",
  "Share one hometown A-list station and why it scored 4+.",
  "Week 2: paste Touch 2. Did you add new information or just bump?",
  "Win thread: one add, one quote, one thank-you. Proof or it did not happen.",
];

/* ─────────────────────────────────────────────────────────────
   DAY-OF-CAMPAIGN MODE — “if today is day N, open this.”
────────────────────────────────────────────────────────────── */

export type CampaignDayPlan = {
  day: number;
  label: string;
  headline: string;
  actions: string[];
  lessonIds: string[];
};

export const CAMPAIGN_DAY_PLAN: CampaignDayPlan[] = [
  {
    day: 0,
    label: "Week 0 · Load",
    headline: "Load the war room. Send nothing.",
    actions: [
      "20 stations scored + statused queued (WB02)",
      "Radio edit, 30s hook, one-sheet live at ONE link",
      "Pitch frozen under 90 words · 3 subject keepers assigned",
      "Four 45-minute blocks named on the calendar for 3 weeks",
    ],
    lessonIds: ["m4l1", "m3l4", "m2l4"],
  },
  {
    day: 1,
    label: "Day 1 · First blood",
    headline: "Send 10 A-list emails. Log every one.",
    actions: ["Open your 10 highest-scoring rows", "Fresh personal first line per human (frozen body)", "Log 10 rows: station, contact, subject, touch, time"],
    lessonIds: ["m4l2", "m3l2", "m3l1"],
  },
  {
    day: 2,
    label: "Day 2 · Hold",
    headline: "No sends. Verify links, draft batch 2's personal lines.",
    actions: ["Test the one link in a private browser", "Move 10 war-room statuses to sent", "Do NOT follow up — the cadence owns the calendar"],
    lessonIds: ["m4l2"],
  },
  {
    day: 3,
    label: "Day 3 · Batch 2",
    headline: "Send the next 10. 20/20 out the door.",
    actions: ["Ten template-tight sends to rows 11–20", "Fresh personal lines per format, not per fantasy", "Log 10 more rows"],
    lessonIds: ["m4l2", "m3l2"],
  },
  {
    day: 4,
    label: "Days 4–5 · Reply window",
    headline: "Answer every human within hours. One step per reply.",
    actions: ["Deliver anything asked (EPK, WAV, hook) same day", "20-second calls ONLY where a reply exists", "Status every answered row"],
    lessonIds: ["m5l1", "m4l2"],
  },
  {
    day: 6,
    label: "Days 6–7 · Quiet + audit",
    headline: "Protected silence. Sunday audit: photo the war room.",
    actions: ["Write the 2-sentence audit in the log (numbers, no adjectives)", "Send the war-room photo to your accountability human", "Silence is data"],
    lessonIds: ["m4l2"],
  },
  {
    day: 8,
    label: "Days 8–10 · Touch 2",
    headline: "30-second hook to non-responders. Two sentences. No guilt.",
    actions: ["Touch 2 to everyone silent (log says who)", "Subject: the hook keeper. Body: hook link + still-a-fit + either-way", "Handle replies same day — one step, no rider asks"],
    lessonIds: ["m4l3", "m5l1"],
  },
  {
    day: 11,
    label: "Days 11–12 · Thank-you economy",
    headline: "Champions get same-day thanks. Station first. Zero asks.",
    actions: ["5-sentence thank-you on every add/win", "Station-first social post (their screenshot, one tag)", "Screenshot every spin into the ledger the day it airs"],
    lessonIds: ["m5l3", "m6l1"],
  },
  {
    day: 13,
    label: "Days 13–14 · Touch 3",
    headline: "New information only. Then the sending phase is DONE.",
    actions: ["Touch 3 to the still-silent: a quote, a chart, a room change — or no send", "Include 'then I'll go quiet' — and honor it", "Buffer day absorbs real life"],
    lessonIds: ["m4l3"],
  },
  {
    day: 15,
    label: "Days 15–17 · Convert + interviews",
    headline: "A reply is not a win. A calendar fact is.",
    actions: ["Confirm every add in writing: show, date, time", "Prep 5 interview answers under 40s + the closer question", "Proof patrol: charts → ledger"],
    lessonIds: ["m4l4", "m5l2", "m6l1"],
  },
  {
    day: 18,
    label: "Days 18–20 · Audit + clone",
    headline: "Run the numbers. Load market two. Refresh the pitch.",
    actions: ["Six numbers: sends, personalization %, replies, adds/interviews, burned wells, reply-by-format", "Clone the war room → 15 stations, warm doors first", "Pitch v2: new ledger line becomes proof line one"],
    lessonIds: ["m4l4", "m6l1", "m6l2"],
  },
  {
    day: 21,
    label: "Day 21 · Close",
    headline: "Close the campaign. File the wall. Schedule market two's Day 1.",
    actions: ["Final thank-yous — no hooks attached", "War room off the wall, dated, filed with the log", "Nurture rows get next-touch dates for the next release"],
    lessonIds: ["m4l4", "m6l3"],
  },
];

export function allLessons() {
  return MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title })));
}

/** Honest totals for the sales page and classroom — computed, never inflated. */
export function courseStats() {
  const lessons = allLessons();
  const words = lessons.reduce((n, l) => n + l.script.split(/\s+/).filter(Boolean).length, 0);
  return {
    lessonCount: lessons.length,
    moduleCount: MODULES.length,
    scriptWords: words,
    spokenMinutes: Math.round(words / 135),
    drills: lessons.length,
    campaignDays: 21,
  };
}
