/* ─────────────────────────────────────────────────────────────
   OFFER v2 — content model
   ─────────────────────────────────────────────────────────────
   Every claim the v2 offer makes lives here, in one file, so the
   numbers can be audited and corrected in one place instead of
   being scattered across JSX.

   ⚠️  FACT-CHECK CONTRACT
   OFFER_FACTS below are the only hard numbers the new copy is
   allowed to state. They currently mirror the figures already
   published elsewhere in this funnel (18,020 entries, 10,372
   verified emails, 1,940+ buyers, 4.9 rating, 400+ page PDF).
   If any of them changes, change it HERE — the offer block, the
   bonus stack and the guarantee all read from this object.

   Anything that cannot be substantiated is written as a
   process promise ("you'll be able to…"), never as a result
   promise ("you'll get airplay"). The FTC block at the bottom
   of the sales page stays accurate because of that distinction.
───────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";

/* ── The only hard numbers the v2 offer is allowed to claim ── */
export const OFFER_FACTS = {
  entries: "18,020",
  verifiedEmails: "10,372",
  buyers: "1,940+",
  rating: "4.9",
  pages: "400+",
  price: 20,
  priceLabel: "$20",
  anchorLabel: "$49",
  refundDays: 30,
  /** Sum of the line-item values in the existing stack. */
  stackValueLabel: "$742",
  /** Sum of the three founder bonuses below. */
  bonusValueLabel: "$115",
  /** stackValue + bonusValue. */
  totalValueLabel: "$857",
} as const;

/* ═══════════════════════════════════════════════════════════
   1. DREAM OUTCOME — specific, sensory, and time-stamped
   ═══════════════════════════════════════════════════════════
   Hormozi's rule: the dream outcome isn't the product, it's the
   status change. For an indie artist that's not "a database" —
   it's a named human writing back. Every beat below is an action
   the buyer can actually take tonight, not a result we promise.
═══════════════════════════════════════════════════════════ */

export type DreamBeat = {
  clock: string;
  title: string;
  body: ReactNode;
};

export const DREAM_BEATS: DreamBeat[] = [
  {
    clock: "9:41 PM",
    title: "You open one file",
    body: (
      <>
        No login. No trial. No "check your inbox to activate." You filter to{" "}
        <b className="text-white">your city</b> and there they are — the stations that
        actually program your genre, with a human name next to each one.
      </>
    ),
  },
  {
    clock: "10:06 PM",
    title: "You write to a person",
    body: (
      <>
        Your first email opens{" "}
        <b className="text-acid">"Hi Tanya — I'm a Portland artist and I think this fits
        your Thursday show."</b>{" "}
        Not <code className="rounded bg-black/60 px-1 py-0.5 text-white/70">To whom it may concern.</code>{" "}
        Not a 14-field upload form that emails you back never.
      </>
    ),
  },
  {
    clock: "10:38 PM",
    title: "Twenty pitches are gone",
    body: (
      <>
        Twenty stations. Twenty real music and program directors. Same hour you'd
        normally have spent on page six of Google copying station names into a
        spreadsheet you'd abandon by Thursday.
      </>
    ),
  },
  {
    clock: "Next morning",
    title: "Something is in your inbox",
    body: (
      <>
        Maybe it's "send me the WAV." Maybe it's "not for us, try our specialty
        show." Both are <b className="text-white">a reply from a decision-maker</b> — which
        is more than a submission portal has given you all year.
      </>
    ),
  },
];

/* ═══════════════════════════════════════════════════════════
   2. PERCEIVED LIKELIHOOD — specificity is the proof
   ═══════════════════════════════════════════════════════════ */

export type ProofPoint = {
  stat: string;
  label: string;
  detail: string;
};

export const PROOF_POINTS: ProofPoint[] = [
  {
    stat: OFFER_FACTS.verifiedEmails,
    label: "Human-verified emails",
    detail:
      "Not scraped. Each one checked as a deliverable address tied to a named person at the station — program directors, music directors, specialty hosts.",
  },
  {
    stat: OFFER_FACTS.entries,
    label: "Total station entries",
    detail:
      "College, community, commercial and online. Station line, city, format and role attached — so you know who you're writing to before you write.",
  },
  {
    stat: OFFER_FACTS.buyers,
    label: "Artists already inside",
    detail: `Averaging ${OFFER_FACTS.rating} out of 5. The reviews on this page are from verified buyers, with the month of purchase attached.`,
  },
  {
    stat: "0",
    label: "Accounts to create",
    detail:
      "No subscription, no seat, no renewal date, no platform that quietly rebills you at $39/mo for forwarding your track to nobody.",
  },
];

/** Named, checkable specifics — the antidote to \"sounds too good\". */
export const SPECIFICITY_LINES: ReactNode[] = [
  <>
    Spot-check it against your own research. Pick any 10 rows in a city you know and
    verify them before you send a single pitch — that's exactly how the reviews on this
    page describe using it.
  </>,
  <>
    Roles are labelled, not guessed. You'll see <b className="text-white">Music Director</b>,{" "}
    <b className="text-white">Program Director</b>, and specialty-show contacts as separate
    fields — so you can skip the front desk entirely.
  </>,
  <>
    Compiled at a point in time, and we say so out loud. Radio staff turn over; anyone
    promising a permanently perfect list is selling you something. Verify, then send.
  </>,
];

/* ═══════════════════════════════════════════════════════════
   3. TIME DELAY + EFFORT — collapse both, visibly
   ═══════════════════════════════════════════════════════════ */

export type SpeedStep = {
  when: string;
  title: string;
  body: string;
};

export const SPEED_STEPS: SpeedStep[] = [
  {
    when: "0:00",
    title: "Pay with Apple Pay or a card",
    body: "Stripe checkout, on this page. No account to create, no password to invent, no onboarding call.",
  },
  {
    when: "0:30",
    title: "The download link is on screen",
    body: "Instantly. Not a 'your files are being prepared' email that lands in promotions three hours later.",
  },
  {
    when: "2:00",
    title: "You're already filtered to your city",
    body: "It arrives sorted by location, station and role. There is no setup step, no import, no CRM to configure.",
  },
  {
    when: "20:00",
    title: "Your first 20 pitches are sent",
    body: "Using the swipe pack below, so you're not staring at a blank email at 10pm trying to sound professional.",
  },
];

export const EFFORT_REMOVERS: string[] = [
  "Works on your phone, laptop or tablet — PDF plus sortable tables",
  "No software to install, nothing to subscribe to, nothing to cancel",
  "Lifetime access to the file you downloaded — it's yours, offline, forever",
  "Re-download any time from your receipt link if your laptop dies",
];

/* ═══════════════════════════════════════════════════════════
   4. BONUS STACK — expires with the founder timer
   ═══════════════════════════════════════════════════════════
   Deliberately small, deliberately relevant: each one removes a
   step that stands between the download and a sent pitch.
   Source files live in /assets/bonuses (markdown) and are
   bundled into the customer ZIP at release time.
═══════════════════════════════════════════════════════════ */

export type Bonus = {
  id: string;
  tag: string;
  name: string;
  value: string;
  hook: string;
  detail: string;
  bullets: string[];
  /** Source file in this repo that gets packaged for delivery. */
  source: string;
};

export const BONUSES: Bonus[] = [
  {
    id: "swipe",
    tag: "Bonus #1",
    name: "The First-Contact Swipe Pack",
    value: "$47",
    hook: "Seven pitch emails you can send tonight.",
    detail:
      "The exact structure that reads like a local artist and not a press release: subject lines under 50 characters, a three-sentence body, and where the streaming link goes so it doesn't trip spam filters.",
    bullets: [
      "7 fill-in-the-blank pitches — local, tour route, college, specialty show, follow-up, re-pitch, thank-you",
      "12 subject lines that name the station instead of shouting NEW SINGLE",
      "The 4 lines that get you deleted, and what to write instead",
    ],
    source: "assets/bonuses/01-first-contact-swipe-pack.md",
  },
  {
    id: "followup",
    tag: "Bonus #2",
    name: "The 3-Touch Follow-Up System",
    value: "$39",
    hook: "Most replies come after the first email. This is the part artists skip.",
    detail:
      "A simple, non-annoying cadence: what to send on day 4, day 11 and day 25, and the exact sentence that reopens a dead thread without apologizing for existing.",
    bullets: [
      "Day-by-day cadence you can run from a notes app",
      "3 written follow-ups, each shorter than the last",
      "When to stop — so you stay welcome at that station next release",
    ],
    source: "assets/bonuses/02-three-touch-follow-up-system.md",
  },
  {
    id: "fit",
    tag: "Bonus #3",
    name: "The Station-Fit Filter & Send Tracker",
    value: "$29",
    hook: "Turns 18,020 rows into the 40 that are actually worth your night.",
    detail:
      "A one-page filter for deciding who to pitch first, plus a printable tracker so you always know who you've contacted, who replied, and who's due for a follow-up.",
    bullets: [
      "The 5-question fit test — run it in 20 seconds per station",
      "Priority order: hometown → tour route → format match → reach",
      "Send tracker (print or copy into a spreadsheet) with follow-up dates built in",
    ],
    source: "assets/bonuses/03-station-fit-filter-and-send-tracker.md",
  },
];

/* ═══════════════════════════════════════════════════════════
   5. RISK REVERSAL — the specific, credible version
   ═══════════════════════════════════════════════════════════ */

export const GUARANTEE = {
  badge: `${OFFER_FACTS.refundDays}-day`,
  title: "THE \"MORE USEFUL THAN A SUBMISSION FORM\" GUARANTEE",
  promise: (
    <>
      Download it. Open it. Spot-check the contacts against your own research. If you
      don't find it <b className="text-white">significantly more useful than the generic
      submission forms you've been using</b>, email us within {OFFER_FACTS.refundDays} days
      and we'll refund the full {OFFER_FACTS.priceLabel}.
    </>
  ),
  terms: [
    {
      q: "Do I have to explain myself?",
      a: "No. One line is enough — \"it wasn't more useful than the forms\" is a complete request. No survey, no retention call, no 'let me offer you a discount instead'.",
    },
    {
      q: "Do I have to send the files back?",
      a: "You can't un-download a file and we're not going to pretend otherwise. Keep the Vault and keep all three bonuses. The risk sits on this side of the table.",
    },
    {
      q: "What's the catch?",
      a: "There isn't one, and the honest reason is arithmetic: refunding a $20 file costs less than arguing with you about it, and it's the only way to make this an easy yes for someone who's already been burned by a $39/mo platform.",
    },
  ],
};

/* ═══════════════════════════════════════════════════════════
   6. CTA REASSURANCE — the chips under every yellow button
   ═══════════════════════════════════════════════════════════ */

export const CTA_CHIPS: string[] = [
  "Instant download",
  "No account needed",
  `${OFFER_FACTS.refundDays}-day refund`,
  "One-time payment",
];

/** The single line that answers \"what am I actually risking?\" */
export const RISK_LINE = `Costs ${OFFER_FACTS.priceLabel} once. Refundable for ${OFFER_FACTS.refundDays} days. Yours to keep either way.`;
