/* ─────────────────────────────────────────────────────────────
   DARK FUNNEL TEARDOWN — copy deck
   ─────────────────────────────────────────────────────────────
   Every string the replica says out loud. Kept in one file on
   purpose: read top to bottom, this is a corpus of persuasion
   copy you can diff, tag, and quote in research notes without
   opening a single component.

   Nothing here describes a product that exists. The "protocol"
   is vapor by design — the mechanics are the subject.
───────────────────────────────────────────────────────────── */

import type { QuizQuestion } from "./core";

export const BRAND = {
  /** the fake publisher of the fake article */
  outlet: "THE SIGNAL DISPATCH",
  outletTagline: "Independent music-industry reporting",
  /** the fake product */
  product: "THE RADIOREACH PROTOCOL",
  productShort: "the Protocol",
  author: "R. Vance Okonjo",
  authorBio:
    "Former promotions coordinator. Spent nine years booking adds at stations that no longer exist. Writes about the parts of the industry nobody puts in a press kit.",
} as const;

/* ─────────────────────────────────────────────
   STAGE 1 — THE HOOK (fake article)
───────────────────────────────────────────── */

export const ARTICLE = {
  kicker: "INVESTIGATION · MUSIC INDUSTRY",
  dek: "It started as a scheduling hack inside one mid-market station. Then somebody wrote it down.",
  byline: BRAND.author,
  dateline: "Published 4 hours ago · 11 min read",
  updated: "Updated moments ago",
  /** The scroll trap: paragraphs that keep almost arriving. */
  body: [
    {
      id: "p1",
      text: "The document is eleven pages long. It has no letterhead, no author, and no version history — which is the first thing that made people believe it. It surfaced in a private Discord for independent artists in late February, posted by an account that deleted itself forty minutes later, and by the following weekend it had been mirrored in at least six countries.",
    },
    {
      id: "p2",
      text: "I have read it. I am not going to reproduce it here, and by the end of this piece you will understand why that decision was made for me rather than by me.",
    },
    {
      id: "p3",
      text: "What I can describe is the shape of it. The first section is procedural and dull — a list of nineteen contact behaviours, most of which any working promotions coordinator would recognise as ordinary courtesy. The second section is where it turns. It describes a sequencing method, nineteen minutes long, that reorders those behaviours in a way that measurably changes how a programming director responds to a cold submission.",
    },
    {
      id: "p4",
      text: "“Measurably” is doing a lot of work in that sentence. I want to be careful here.",
    },
    {
      id: "p5",
      text: "A clinical psychologist I sent the second section to — she asked me not to name her, and after our second call I understood the request — described it as “compliance engineering wearing a lanyard.” Her exact phrase, when I asked whether it was ethical to publish, was that circulating it amounted to psychological malpractice. She was not being dramatic. She had spent the previous evening annotating it.",
    },
    {
      id: "p6",
      text: "Here is what stopped me. Between March and August, eleven thousand four hundred and eighty-two people are estimated to have worked through the sequence at least once. That figure comes from mirror-host download logs, so treat it as a floor rather than a ceiling. Of those, I was able to identify and reach forty-one by name.",
    },
    {
      id: "p7",
      text: "Thirty-nine declined to comment.",
    },
    {
      id: "p8",
      text: "Not “declined to comment on the record.” Declined to comment at all. Two of them replied to my first email within minutes and then went silent for the rest of the summer. One asked, before anything else, how I had got their name.",
    },
    {
      id: "p9",
      text: "The two who did speak to me both used a version of the same sentence, which is the detail I have not been able to put down. Neither knew the other. Both said: “I wouldn’t do it again, and I would not undo it.”",
    },
    {
      id: "p10",
      text: "I asked the obvious follow-up. Neither would answer it. One ended the call.",
    },
    {
      id: "p11",
      text: "What follows is the part of the reporting I was advised not to publish, including the intake screen the original document uses to decide who should be allowed to run the sequence at all — and the reason a station in Ohio quietly rewrote its submissions policy in June.",
    },
  ],
  /** the trap: a "continue reading" wall that leads to the offer, not the article */
  wallTitle: "The rest of this piece is not on this page.",
  wallBody:
    "The remaining sections — the intake screen, the nineteen-minute sequence, and the Ohio policy memo — were moved to a separate access-controlled release after the second legal letter. There is no paywall. There is a screening step.",
  wallCta: "Read the rest →",
  wallSub: "You were not meant to find this page. It is still up because nobody has asked for it to come down.",
} as const;

/** Decoy “related” links — low opacity, non-functional. Pure ambiance:
 *  they exist to make one page feel like a site with a back catalogue. */
export const DECOY_LINKS: readonly string[] = [
  "The college station that hasn’t answered an email since 2019 — and still adds 4 records a week",
  "“We stopped reading press kits in 2021.” Six music directors, on the record",
  "What a $40,000 radio campaign actually buys you (an itemised leak)",
  "The submission platform that charges artists to email a folder nobody opens",
  "Inside the spreadsheet 1,100 promoters share and won’t admit to",
  "A programming director explains the 8-second rule",
  "Why your single is being skipped at 0:11",
  "The rotation slot nobody is bidding on",
];

export const TRENDING_STRIP: readonly string[] = [
  "MOST READ",
  "The 8-second rule",
  "Six music directors, on the record",
  "An itemised leak",
  "The Ohio memo",
];

/* ─────────────────────────────────────────────
   STAGE 2 — THE REVEAL (long-form offer)
───────────────────────────────────────────── */

export const REVEAL = {
  eyebrow: "ACCESS-CONTROLLED RELEASE · SECTION 3 OF 3",
  headline: "You were not meant to find this.",
  sub: "Two legal letters, one deleted account, and 11,482 downloads later — the sequence is being released one time, to a screened group, and then this page comes down.",
  agitation: {
    title: "Let’s be honest about where you actually are.",
    beats: [
      "You have sent the emails. You have used the platform that promised “curated placement” and delivered a receipt.",
      "You have watched artists who are worse than you get added, and you have quietly decided it must be a network thing, because the alternative is that there is a method and nobody gave it to you.",
      "There is a method. Nobody gave it to you.",
      "It is not talent, it is not budget, and it is emphatically not luck. It is a sequence — and the reason it works is the reason the psychologist called it malpractice.",
    ],
  },
  authority: {
    title: "Why this is being released at all",
    body: "The original document had no author because the original author had a job. That is no longer true. The Protocol has been rewritten as a nineteen-minute operating sequence, stripped of the two sections counsel flagged, and released under a screening requirement: you answer the intake honestly, or you don’t get it.",
    credentials: [
      { stat: "11,482", label: "recorded runs since March" },
      { stat: "9 yrs", label: "inside station promotions" },
      { stat: "2", label: "legal letters received" },
      { stat: "39/41", label: "participants who refused to comment" },
    ],
  },
  mechanism: {
    title: "What the sequence actually does",
    steps: [
      {
        n: "01",
        title: "The reframe window",
        text: "The first four minutes are not about your music. They are about the state the recipient is in when your name arrives. Nothing you send lands in a neutral room.",
      },
      {
        n: "02",
        title: "The displacement pass",
        text: "You are not competing for a slot. You are competing for the memory of a slot. The pass rewrites which record the director is comparing you to.",
      },
      {
        n: "03",
        title: "The nineteenth minute",
        text: "One instruction, executed once, at the end. This is the section the psychologist annotated. It is included. It is not explained to you until you are inside.",
      },
    ],
  },
  faq: [
    {
      q: "Is this a list of contacts?",
      a: "No. Contact lists are a commodity and you can find one for free in an afternoon. The Protocol assumes you already have the addresses and are getting nothing back from them.",
    },
    {
      q: "Why is it only $27?",
      a: "Because the price is a filter, not a valuation. Free gets hoarded and never run. $27 is the smallest number that reliably produces an actual attempt within 72 hours.",
    },
    {
      q: "What happens after the timer runs out?",
      a: "The screening closes and the page is taken down. Whether it returns is not currently my decision.",
    },
    {
      q: "Is there a refund?",
      a: "There is nothing to refund. This is a research replica of a sales funnel — no payment is ever taken, and no product exists.",
    },
    {
      q: "Why does the intake say lying wastes everyone’s time?",
      a: "Because that sentence measurably raises the earnestness of the answers, which raises how personally the verdict lands. It is a line of copy doing work, and now you know exactly what work.",
    },
  ],
  guarantee: {
    title: "The 19-Minute Standard",
    body: "Run the sequence once, end to end, within seven days. If nothing in your inbox changes, you keep everything and I close your file personally.",
  },
} as const;

export const TESTIMONIALS = [
  {
    name: "Marcus D.",
    role: "Producer · Detroit, MI",
    text: "I ran it on a Sunday night against a list I’d already burned. Two directors who had ignored me for a year replied before lunch. I don’t know what that says about the last year of my life.",
    stat: "2 replies · 9 days",
    initials: "MD",
  },
  {
    name: "Aisling R.",
    role: "Indie folk · Glasgow",
    text: "The nineteenth minute felt wrong to do. I did it. I’m still thinking about why it worked and I don’t especially like the answer.",
    stat: "1 add · 3 weeks",
    initials: "AR",
  },
  {
    name: "Devon O.",
    role: "Hip-hop · Atlanta, GA",
    text: "Was ready to call it a scam at minute four. By minute twelve I understood what it was actually asking me to change, and it was not the email.",
    stat: "17 replies / 120 sent",
    initials: "DO",
  },
  {
    name: "Priya N.",
    role: "Electronic · Lisbon",
    text: "Wouldn’t do it again. Wouldn’t undo it. That’s the honest version and you can print it.",
    stat: "4 spins · 6 weeks",
    initials: "PN",
  },
] as const;

/* ─────────────────────────────────────────────
   STAGE 3 — THE QUALIFICATION RITUAL
───────────────────────────────────────────── */

export const QUIZ_INTRO = {
  title: "Intake screening",
  sub: "Six questions. Answers are weighted against the 11,482-run baseline.",
  /** intimidation copy — has no code path behind it */
  warning:
    "Answers are weighted. Inconsistent responses are flagged automatically and lying only wastes your allocation window.",
} as const;

export const QUIZ: readonly QuizQuestion[] = [
  {
    id: "q1",
    prompt: "How long have you been sending music to stations with no meaningful response?",
    subtext: "Weighted against time-to-first-add across the baseline cohort.",
    options: [
      { id: "a", label: "Under 6 months", weight: 1.4 },
      { id: "b", label: "6 – 18 months", weight: 2.8 },
      { id: "c", label: "2 – 5 years", weight: 4.1 },
      { id: "d", label: "Longer than I want to write down", weight: 4.9 },
    ],
  },
  {
    id: "q2",
    prompt: "When a director doesn’t reply, what do you privately assume?",
    subtext: "Attribution style is the single strongest predictor in the model.",
    options: [
      { id: "a", label: "They never opened it", weight: 2.2 },
      { id: "b", label: "The music wasn’t ready", weight: 3.6 },
      { id: "c", label: "It’s a closed network and I’m outside it", weight: 4.4 },
      { id: "d", label: "I stopped assuming anything", weight: 1.9 },
    ],
  },
  {
    id: "q3",
    prompt: "Have you paid a submission platform in the last 24 months?",
    subtext: "Prior spend correlates with completion. This is not a judgement.",
    options: [
      { id: "a", label: "No", weight: 1.1 },
      { id: "b", label: "Once, and I regret it", weight: 3.3 },
      { id: "c", label: "More than once", weight: 4.2 },
      { id: "d", label: "I have an active subscription right now", weight: 4.8 },
    ],
  },
  {
    id: "q4",
    prompt: "Nineteen minutes, executed exactly, no substitutions. Realistically?",
    subtext: "Stated intent is recorded and compared to your file at release.",
    options: [
      { id: "a", label: "Tonight", weight: 4.6 },
      { id: "b", label: "This week", weight: 3.4 },
      { id: "c", label: "When things calm down", weight: 1.6 },
      { id: "d", label: "I’d have to see it first", weight: 2.4 },
    ],
  },
  {
    id: "q5",
    prompt: "If the final instruction felt uncomfortable to carry out, you would —",
    subtext: "Discomfort tolerance. There is no correct answer here.",
    options: [
      { id: "a", label: "Do it anyway", weight: 4.7 },
      { id: "b", label: "Do it, then feel odd about it", weight: 4.0 },
      { id: "c", label: "Modify it to feel better", weight: 2.1 },
      { id: "d", label: "Not do it", weight: 1.3 },
    ],
  },
  {
    id: "q6",
    prompt: "What would one confirmed add be worth to you, honestly?",
    subtext: "Used only for allocation ordering.",
    options: [
      { id: "a", label: "Under $100", weight: 1.5 },
      { id: "b", label: "$100 – $500", weight: 3.0 },
      { id: "c", label: "$500 – $2,000", weight: 4.3 },
      { id: "d", label: "More than I’d admit to a stranger", weight: 4.9 },
    ],
  },
] as const;

export const LEAD = {
  title: "Where should the clearance be sent?",
  sub: "Your file is scored and held for 09:00. It is released to one address.",
  /** micro-commitment framing: not "sign up", but "confirm the file" */
  cta: "Confirm my file →",
  consent:
    "I understand my responses are weighted and that access is provisional.",
  micro: "No card required at this step. There is no card required at any step.",
} as const;

/* ─────────────────────────────────────────────
   STAGE 4 — CHECKOUT
───────────────────────────────────────────── */

export const CHECKOUT = {
  title: "Release your allocation",
  sub: "Screened price. This number is attached to your file, not to this page.",
  bump: {
    title: "YES — add the Compliance Pack (recommended)",
    body: "The two sections counsel removed, rewritten as a safe-to-run annex, plus the intake scoring sheet so you can screen your own collaborators. Normally $89 — $17 when added now.",
    /** pre-checked. the default IS the persuasion. */
    defaultChecked: true,
  },
  payCta: "Complete secure order",
  legal: "Demo checkout. No payment processor is contacted. No card data is collected, stored, or transmitted.",
  trust: ["256-bit demo TLS", "No card required", "Nothing is charged", "Instant fictional access"],
} as const;

/* ─────────────────────────────────────────────
   STAGE 5 / 6 — OTO + DOWNSELL
───────────────────────────────────────────── */

export const OTO = {
  eyebrow: "WAIT — YOUR ORDER IS NOT FINISHED",
  title: "You have the sequence. You do not have the part that makes it repeatable.",
  body: "The Protocol works once because it is novel. Tier II is the campaign layer: the 12-week rotation calendar, the follow-up cadence that keeps you out of the ignore pile, and the annotated call recordings — including the two the psychologist objected to most.",
  bullets: [
    "12-week rotation calendar (the reason people get a second add)",
    "The follow-up cadence — 6 touches, exact wording, exact intervals",
    "Nine annotated call recordings, including both flagged sections",
    "Direct file review — you send one campaign, I mark it up",
  ],
  acceptCta: "Yes — upgrade my file to Tier II",
  /** guilt decline: tiny, lowercase, self-accusing */
  declineCta: "no thanks, i’ll try it alone and hope it’s different this time",
  pressure: "This is the only time Tier II is offered at this price. Declining is permanent and your file will note it.",
} as const;

export const DOWNSELL = {
  eyebrow: "ONE ADJUSTMENT BEFORE YOU GO",
  title: "Understood. Let’s make the number smaller instead of the offer.",
  body: "Same Tier II. Same recordings. Split into three payments so the decision stops being about money. The file review is removed at this tier — everything else is identical.",
  acceptCta: "Fine — start at $67 today",
  declineCta: "no, i’m sure — take me to my order",
  pressure: "Last screen. This is not offered again and the page does not reload.",
} as const;

/* ─────────────────────────────────────────────
   STAGE 7 — THANK YOU / META REVEAL
───────────────────────────────────────────── */

export const REVEAL_META = {
  title: "There is no Protocol.",
  body: [
    "No payment was taken. No email was sent anywhere. No file exists, no committee reviewed you, and R. Vance Okonjo is four words I made up. The 11,482 downloads, the two legal letters, the psychologist, the Ohio memo, Marcus and Aisling and Devon and Priya — all of it is set dressing.",
    "The patterns were the product. You just walked through nine of them in about six minutes, and the interesting part is that most of them still worked on you while you were reading a page that told you it was fake.",
    "Below is the receipt for what actually happened to your attention.",
  ],
} as const;

/* ─────────────────────────────────────────────
   AMBIENT — support chat + exit intent
───────────────────────────────────────────── */

export const CHAT = {
  agent: "Dana",
  agentRole: "Intake support",
  greeting: "Hi — I see you’re on the release page. Are you stuck on the screening step?",
  /** canned replies, keyword-matched, always funnelling back to the CTA */
  replies: [
    { match: ["price", "cost", "$", "money", "expensive"], text: "The screened price is $27 and it doesn’t change after the timer — the page just stops being reachable. Want me to hold your allocation while you decide?" },
    { match: ["scam", "fake", "real", "legit"], text: "Completely fair question. I’d say the same thing. Everything on this page is a research replica — but let’s pretend I didn’t say that, because a real agent here would say “I understand the hesitation, most of our members felt the same.”" },
    { match: ["refund", "guarantee", "money back"], text: "Nothing is charged, so there is nothing to refund. In the funnel this is copied from, this is where I’d mention the 7-day guarantee to reduce your perceived risk." },
    { match: ["time", "timer", "expire", "deadline"], text: "The countdown resets. It has always reset. I’m telling you that because I’m a demo — the version of me you usually meet says “I can maybe get you five more minutes.”" },
  ],
  fallback:
    "I can’t answer that one, but I can hold your seat for nine minutes while you finish reading. Should I?",
} as const;

export const EXIT_INTENT = {
  title: "Leaving with it unread?",
  body: "Your file is scored and sitting in the release queue. If you close this tab it is released to the next name and the screening does not reopen.",
  /** shame CTA */
  stayCta: "No — I’ll finish reading",
  leaveCta: "I’d rather stay where I am",
  footnote: "This modal is triggered by your cursor leaving toward the tab bar. That is the entire technology.",
} as const;

export const STICKY = {
  label: "Screening closes in",
  cta: "Read the rest →",
  sub: "Free · 11 min",
} as const;
