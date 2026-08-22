/* ─────────────────────────────────────────────────────────────
   COPY VARIANTS: one tone per emotional mode, per page slot
   ─────────────────────────────────────────────────────────────
   `default` is always the original RadioReach copy, verbatim.
   the feature-flag-off experience. The three modes rewrite only
   framing and tone: prices, timers, stock, product facts, and
   core offers are never touched here.

   Modes:
     calm    : soften, simplify, de-pressure. "No BS, take
                your time, here's exactly what you get."
     aspire   : identity + future. "You're the serious artist;
                this is how the serious ones got heard."
     urgency  : the cost of waiting. Classy, heavy, not desperate.

   Variants are ReactNode so rich slots keep their highlight
   markup. Lengths are kept close per slot. EmotiveText stacks
   every variant in one grid cell, so the tallest/wideest wins
   and copy swaps never shift the layout.

   Adding a slot: add a key here, drop <EmotiveText slot="…" />
   where the copy lives. Adding a mode variant: add one entry.
───────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";
import type { EmotionalMode } from "./types";

export type SlotKey =
  | "heroEyebrow"
  | "heroSub"
  | "ctaLabel"
  | "ctaTrust"
  | "problemLabel"
  | "problemHeadline"
  | "problemP1"
  | "problemP3"
  | "mathBox"
  | "stackNote"
  | "proofHeadline"
  | "guaranteePara"
  | "roadA"
  | "roadB"
  | "stickyLabel"
  | "exitTitle"
  | "exitBody";

type SlotVariants = { default: ReactNode } & Partial<Record<EmotionalMode, ReactNode>>;

export const SLOT_COPY: Record<SlotKey, SlotVariants> = {
  /* hero eyebrow badge */
  heroEyebrow: {
    default: "For unsigned artists, producers & podcasters who are done being ignored",
    calm: "For unsigned artists, producers & podcasters who want a clear path",
    aspire: "For unsigned artists, producers & podcasters serious about being heard",
  },

  /* hero subheadline */
  heroSub: {
    default: (
      <>
        You finished the record. Now get <span className="font-bold text-acid">18,000+ radio station contacts</span>{" "}
        organized by station, city, role, phone, and email. One instant download for independent artists.
      </>
    ),
    calm: (
      <>
        You finished the record. No platforms. No monthly bills. Just{" "}
        <span className="font-bold text-acid">18,000+ radio station contacts</span> organized by station,
        city, role, phone, and email in one download.
      </>
    ),
    aspire: (
      <>
        Turn your next release into a real outreach plan with{" "}
        <span className="font-bold text-acid">18,000+ radio station contacts</span> organized by station,
        city, role, phone, and email.
      </>
    ),
    urgency: (
      <>
        Every week the record sits is another week lost to research. Start tonight with{" "}
        <span className="font-bold text-acid">18,000+ radio station contacts</span> organized by station,
        city, role, phone, and email.
      </>
    ),
  },

  /* hero CTA box label */
  ctaLabel: {
    default: "One-time access:",
    calm: "One-time price. No subscription, no fine print:",
    aspire: "Join 1,940+ artists inside:",
    urgency: "Start your outreach tonight:",
  },

  /* trust line under the hero CTA */
  ctaTrust: {
    default: "🔒 Stripe checkout · Instant download · 30-day money-back guarantee",
    calm: "🔒 Stripe checkout · Instant download · 30-day money-back guarantee",
    aspire: "🔒 Stripe checkout · Instant download · Join 1,940+ artists",
    urgency: "🔒 Stripe checkout · Instant download · One-time payment",
  },

  /* problem section label */
  problemLabel: {
    default: "Let's be honest about what's happening",
    calm: "Let's simplify what's happening",
    aspire: "Here's what separates the artists who get played",
  },

  /* problem section headline (red half) */
  problemHeadline: {
    default: "IT'S THE CONTACT LIST.",
    calm: "IT'S THE CONTACT LIST.",
    aspire: "IT'S WHO YOU KNOW.",
  },

  /* problem section, first paragraph */
  problemP1: {
    default: (
      <>
        Somewhere tonight, an artist with half your ability is getting spun on a station in a city
        they've never visited. Not because their song is better. Because someone{" "}
        <span className="font-semibold text-white hl">handed them a phone number.</span>
      </>
    ),
    calm: (
      <>
        Somewhere tonight, an artist with half your ability is getting spun on a station in a city
        they've never visited. Not because their song is better. Because someone{" "}
        <span className="font-semibold text-white hl">handed them a phone number.</span> That's the
        whole gap. No algorithm, no luck. Just access.
      </>
    ),
    aspire: (
      <>
        The artists in rotation aren't more talented than you. They're better connected. Somewhere
        tonight, one of them is getting spun in a city they've never visited because someone{" "}
        <span className="font-semibold text-white hl">handed them a phone number.</span> Talent got
        you the record. Access gets it played.
      </>
    ),
    urgency: (
      <>
        Right now, while you're reading this, an artist with half your ability is getting spun on a
        station in a city they've never visited because someone{" "}
        <span className="font-semibold text-white hl">handed them a phone number.</span> Every day
        without it, that gap widens, and your release gets colder.
      </>
    ),
  },

  /* problem section, closing paragraph */
  problemP3: {
    default: (
      <>
        That's not a marketing problem. That's an <b>access</b> problem. And access is the one
        thing that can be handed to you.
      </>
    ),
    calm: (
      <>
        That's not a marketing problem, and it's not a talent problem. It's a gap in your contact
        list, and that gap closes in one download.
      </>
    ),
    aspire: (
      <>
        That's not a marketing problem. That's an <b>access</b> problem. Access is the one
        thing that can be handed to you. Tonight, if you want it.
      </>
    ),
    urgency: (
      <>
        That's not a marketing problem. That's an <b>access</b> problem. And every week it stays
        unsolved, your release loses momentum you don't get back.
      </>
    ),
  },

  /* value-stack math box */
  mathBox: {
    default: (
      <>
        <b className="text-white">The math nobody wants you to do:</b> professional radio databases
        from enterprise data providers run{" "}
        <span className="font-bold text-blood">$300–$500/year</span> and are built for corporate
        marketing departments. This is the same caliber of data: 18,000+ contacts, 10K+ verified
        emails, for <span className="font-bold text-acid">$20</span>. That's{" "}
        <b className="text-white">0.11¢ per contact.</b> Priced for someone currently deciding
        between a mastering session and groceries. I know, because I was.
      </>
    ),
    calm: (
      <>
        <b className="text-white">The math, plainly:</b> professional radio databases from
        enterprise data providers run{" "}
        <span className="font-bold text-blood">$300–$500/year</span> and are built for corporate
        marketing departments. This is the same caliber of data: 18,000+ contacts, 10K+ verified
        emails, for <span className="font-bold text-acid">$20</span>, one time. That's{" "}
        <b className="text-white">0.11¢ per contact.</b> No subscription, no upsell maze, and a
        30-day money-back guarantee if it's not for you.
      </>
    ),
    aspire: (
      <>
        <b className="text-white">The math serious artists do:</b> professional radio databases run{" "}
        <span className="font-bold text-blood">$300–$500/year</span> and are built for corporate
        marketing departments. You're being offered the same caliber of data: 18,000+ contacts,
        10K+ verified emails, for <span className="font-bold text-acid">$20</span>, one time.{" "}
        <b className="text-white">That's the edge the artists in rotation already paid for.</b>
      </>
    ),
    urgency: (
      <>
        <b className="text-white">The faster path:</b> professional databases can run{" "}
        <span className="font-bold text-blood">$300–$500/year</span>. RadioReach gives you an organized
        research starting point for <span className="font-bold text-acid">$20 once</span>, about{" "}
        <b className="text-white">0.11¢ per entry</b>, so tonight can be about outreach instead of more searching.
      </>
    ),
  },

  /* note under the stack CTA */
  stackNote: {
    default: "$20 one-time payment · instant download · no subscription",
    calm: "$20 one-time payment · instant download · no subscription, ever",
    aspire: "$20 today · instant download · join 1,940+ artists inside",
    urgency: "$20 once · start your contact research tonight",
  },

  /* testimonials headline */
  proofHeadline: {
    default: "ARTISTS WHO STOPPED WAITING",
    calm: "REAL ARTISTS. REAL REPLIES.",
    aspire: "ARTISTS WHO GOT HEARD",
  },

  /* guarantee paragraph */
  guaranteePara: {
    default:
      "Download it. Open it. Put it to work: contact at least five stations that fit your music and keep a simple log of what you sent. If you've genuinely tried it and it isn't worth $20, email me within 30 days with your receipt and I'll refund you in full. No airplay or replies required. Just an honest attempt.",
    calm:
      "Download it. Open it. Take your time. Contact at least five stations that fit your music and note what you sent. If you've given it a real look and it isn't worth $20, email me within 30 days with your receipt for a full refund. No replies or airplay required. Just your honest attempt. The risk sits with me, not with you.",
    aspire:
      "Download it. Open it. Serious artists verify their tools: contact at least five stations that fit your music and log what you sent. If it doesn't meet your standard, email me within 30 days with your receipt and I'll refund you in full. You don't need a single reply to qualify; just a genuine, documented effort.",
    urgency:
      "Download it tonight and put it to work. Contact at least five stations that fit your music and log what you sent. If it isn't worth $20 after a genuine try, email me within 30 days with your receipt. I'll issue a full refund, no airplay or replies required.",
  },

  /* final CTA, road A */
  roadA: {
    default:
      "Keep researching one station at a time, checking roles and copying contact details into your own spreadsheet before outreach can begin.",
    calm:
      "Keep building the list yourself. It costs nothing but the time you could otherwise spend on your release and your pitch.",
    aspire:
      "Keep assembling a contact list by hand while your next release waits for a clear outreach plan.",
    urgency:
      "Spend tonight searching for contacts one station at a time instead of sending focused pitches to relevant people.",
  },

  /* final CTA, road B */
  roadB: {
    default:
      "Pay $20, less than a streaming subscription. Open the file in 90 seconds. Email 20 real music directors in your city tonight. Wake up to replies.",
    calm:
      "Pay $20 once, less than a streaming subscription. Open the file in 90 seconds. Email 20 real music directors in your city tonight. Simple as that.",
    aspire:
      "Pay $20 and start reaching the same people the artists in rotation reached. Open the file in 90 seconds and email 20 real music directors in your city tonight. Wake up to replies.",
    urgency:
      "Pay $20 before the founder slots close. Open the file in 90 seconds. Email 20 real music directors in your city tonight. Other artists are still guessing at info@ inboxes.",
  },

  /* sticky bar button label */
  stickyLabel: {
    default: "Get Instant Access for $20",
    calm: "Get The Contacts for $20",
    aspire: "Join The Vault for $20",
    urgency: "Start Outreach for $20",
  },

  /* exit-intent dialog */
  exitTitle: {
    default: "SKIP MONTHS OF CONTACT RESEARCH",
    calm: "TAKE ONE LAST LOOK AT WHAT'S INCLUDED",
    aspire: "TURN YOUR NEXT RELEASE INTO A REAL OUTREACH PLAN",
    urgency: "START OUTREACH INSTEAD OF ANOTHER NIGHT OF SEARCHING",
  },
  exitBody: {
    default: "Get 18,000+ organized radio station entries for one $20 payment.",
    calm: "Review the sample, the guarantee, and the exact deliverables before you decide.",
    aspire: "The Vault gives you the research starting point. Your music and pitch do the rest.",
    urgency: "One click gets you the organized contact resource. Airplay is never guaranteed.",
  },
};

/** Resolve a slot for a mode; always falls back to the original. */
export function copyFor(slot: SlotKey, mode: EmotionalMode): ReactNode {
  return SLOT_COPY[slot][mode] ?? SLOT_COPY[slot].default;
}
