/* ─────────────────────────────────────────────────────────────
   COPY VARIANTS — one tone per emotional mode, per page slot
   ─────────────────────────────────────────────────────────────
   `default` is always the original RadioReach copy, verbatim —
   the feature-flag-off experience. The three modes rewrite only
   framing and tone: prices, timers, stock, product facts, and
   core offers are never touched here.

   Modes:
     calm     — soften, simplify, de-pressure. "No BS, take
                your time, here's exactly what you get."
     aspire   — identity + future. "You're the serious artist;
                this is how the serious ones got heard."
     urgency  — the cost of waiting. Classy, heavy, not desperate.

   Variants are ReactNode so rich slots keep their highlight
   markup. Lengths are kept close per slot — EmotiveText stacks
   every variant in one grid cell, so the tallest/wideest wins
   and copy swaps never shift the layout.

   Adding a slot: add a key here, drop <EmotiveText slot="…" />
   where the copy lives. Adding a mode variant: add one entry.
───────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";
import type { EmotionalMode } from "./types";

export type SlotKey =
  | "alertBar"
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
  /* — top alert strip — */
  alertBar: {
    default: "Founder pricing ends when the timer hits zero",
    calm: "Founder pricing is still open — take your time",
    aspire: "Built by an indie artist — priced for indie artists",
    urgency: "Founder pricing ends at zero — then it's $49",
  },

  /* — hero eyebrow badge — */
  heroEyebrow: {
    default: "For unsigned artists, producers & podcasters who are done being ignored",
    calm: "For unsigned artists, producers & podcasters who want a clear path",
    aspire: "For unsigned artists, producers & podcasters serious about being heard",
  },

  /* — hero subheadline — */
  heroSub: {
    default: (
      <>
        You finished the record. You mixed it, mastered it, bled on it — and then it died in a{" "}
        <span className="font-semibold text-white">generic submission form</span>. Here are{" "}
        <span className="font-bold text-acid">18,000+ radio station contacts</span> organized by
        station, location, role, phone, and email to skip the form entirely.
      </>
    ),
    calm: (
      <>
        You finished the record. You mixed it, mastered it, bled on it — and then it died in a{" "}
        <span className="font-semibold text-white">generic submission form</span>. No platforms.
        No monthly bills. No noise. Just{" "}
        <span className="font-bold text-acid">18,000+ radio station contacts</span> organized by
        station, location, role, phone, and email — one file that skips the form entirely.
      </>
    ),
    aspire: (
      <>
        You didn't finish this record to disappear into a{" "}
        <span className="font-semibold text-white">generic submission form</span>. The artists in
        rotation all have one thing in common — they reached the right people directly. Here are{" "}
        <span className="font-bold text-acid">18,000+ radio station contacts</span> organized by
        station, location, role, phone, and email. The people who decide what gets played.
      </>
    ),
    urgency: (
      <>
        Every week the record sits, the release gets colder — and someone else's song takes the
        slot you were building toward. It's already dying in a{" "}
        <span className="font-semibold text-white">generic submission form</span> while{" "}
        <span className="font-bold text-acid">18,000+ radio station contacts</span> sit organized
        by station, location, role, phone, and email — and the founder price is still $20.
      </>
    ),
  },

  /* — hero CTA box label — */
  ctaLabel: {
    default: "Founder price locks in for:",
    calm: "One-time price — no subscription, no fine print:",
    aspire: "Founder price — what the first 1,940 artists paid:",
    urgency: "Founder price expires in:",
  },

  /* — trust line under the hero CTA — */
  ctaTrust: {
    default: "30-day refund guarantee · One-time payment",
    calm: "30-day refund guarantee · No pressure, no lock-in",
    aspire: "30-day refund guarantee · Join 1,940+ artists",
    urgency: "30-day refund guarantee · Price returns to $49",
  },

  /* — problem section label — */
  problemLabel: {
    default: "Let's be honest about what's happening",
    calm: "Let's simplify what's happening",
    aspire: "Here's what separates the artists who get played",
  },

  /* — problem section headline (red half) — */
  problemHeadline: {
    default: "IT'S THE CONTACT LIST.",
    calm: "IT'S THE CONTACT LIST.",
    aspire: "IT'S WHO YOU KNOW.",
  },

  /* — problem section, first paragraph — */
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
        whole gap — no algorithm, no luck. Just access.
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
        station in a city they've never visited — because someone{" "}
        <span className="font-semibold text-white hl">handed them a phone number.</span> Every day
        without it, that gap widens, and your release gets colder.
      </>
    ),
  },

  /* — problem section, closing paragraph — */
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
        list — and that gap closes in one download.
      </>
    ),
    aspire: (
      <>
        That's not a marketing problem. That's an <b>access</b> problem — and access is the one
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

  /* — value-stack math box — */
  mathBox: {
    default: (
      <>
        <b className="text-white">The math nobody wants you to do:</b> professional radio databases
        from enterprise data providers run{" "}
        <span className="font-bold text-blood">$300–$500/year</span> and are built for corporate
        marketing departments. This is the same caliber of data — 18,000+ contacts, 10K+ verified
        emails — for <span className="font-bold text-acid">$20</span>. That's{" "}
        <b className="text-white">0.11¢ per contact.</b> Priced for someone currently deciding
        between a mastering session and groceries. I know, because I was.
      </>
    ),
    calm: (
      <>
        <b className="text-white">The math, plainly:</b> professional radio databases from
        enterprise data providers run{" "}
        <span className="font-bold text-blood">$300–$500/year</span> and are built for corporate
        marketing departments. This is the same caliber of data — 18,000+ contacts, 10K+ verified
        emails — for <span className="font-bold text-acid">$20</span>, one time. That's{" "}
        <b className="text-white">0.11¢ per contact.</b> No subscription, no upsell maze, and a
        30-day refund if it's not for you.
      </>
    ),
    aspire: (
      <>
        <b className="text-white">The math serious artists do:</b> professional radio databases run{" "}
        <span className="font-bold text-blood">$300–$500/year</span> and are built for corporate
        marketing departments. You're being offered the same caliber of data — 18,000+ contacts,
        10K+ verified emails — for <span className="font-bold text-acid">$20</span>, one time.{" "}
        <b className="text-white">That's the edge the artists in rotation already paid for.</b>
      </>
    ),
    urgency: (
      <>
        <b className="text-white">The math nobody wants you to do:</b> professional databases run{" "}
        <span className="font-bold text-blood">$300–$500/year</span>. The same caliber of data is{" "}
        <span className="font-bold text-acid">$20</span> right now — but only while the founder
        slots hold. At $49 it's still a bargain. At $20 it's{" "}
        <b className="text-white">0.11¢ per contact.</b> That number won't be here when the timer
        ends.
      </>
    ),
  },

  /* — note under the stack CTA — */
  stackNote: {
    default: "73% off · price returns to $49 when the timer expires · instant download",
    calm: "73% off · one-time payment · instant download — no subscription, ever",
    aspire: "73% off today · instant download · join 1,940+ artists inside",
    urgency: "73% off · returns to $49 when the timer expires · founder slots are going",
  },

  /* — testimonials headline — */
  proofHeadline: {
    default: "ARTISTS WHO STOPPED WAITING",
    calm: "REAL ARTISTS. REAL REPLIES.",
    aspire: "ARTISTS WHO GOT HEARD",
  },

  /* — guarantee paragraph — */
  guaranteePara: {
    default:
      "Download it. Open it. Check the emails against your own research. If you decide it wasn't worth $20, email me inside 30 days and I'll refund you — and you can keep the file. I'm an independent artist too. I'd rather you make it than hold your money hostage.",
    calm:
      "Download it. Open it. Check the emails against your own research — take your time. If you decide it wasn't worth $20, email me inside 30 days and I'll refund you, and you can keep the file. The risk sits with me, not with you. That's the whole arrangement.",
    aspire:
      "Download it. Open it. Check the emails against your own research — serious artists verify their tools. If it doesn't meet your standard, email me inside 30 days and I'll refund you, and you can keep the file. I'm an independent artist too. I'd rather you make it than hold your money hostage.",
    urgency:
      "Download it tonight, while the founder price holds. Check the emails against your own research. If it isn't worth $20, email me inside 30 days and I'll refund you — and you can keep the file. The only way to lose here is to come back after the price returns to $49.",
  },

  /* — final CTA, road A — */
  roadA: {
    default:
      "Close this tab. Go back to Google. Spend the next six months building a worse list by hand while your release gets colder. Pay $49 if you come back.",
    calm:
      "Close this tab and think it over — no pressure from us, the file will still be here. Just know the founder price steps up to $49 once the launch window closes.",
    aspire:
      "Close this tab. Go back to Google. Spend six months building a worse list by hand while artists with your sound take the slots in your own city. Then come back and pay $49.",
    urgency:
      "Close this tab. Go back to Google. Spend six months building a worse list by hand while your release gets colder — and pay $49 when you come back, because the founder slots will be gone.",
  },

  /* — final CTA, road B — */
  roadB: {
    default:
      "Pay $20 — less than a streaming subscription. Open the file in 90 seconds. Email 20 real music directors in your city tonight. Wake up to replies.",
    calm:
      "Pay $20 once — less than a streaming subscription. Open the file in 90 seconds. Email 20 real music directors in your city tonight. Simple as that.",
    aspire:
      "Pay $20 and start reaching the same people the artists in rotation reached. Open the file in 90 seconds and email 20 real music directors in your city tonight. Wake up to replies.",
    urgency:
      "Pay $20 before the founder slots close. Open the file in 90 seconds. Email 20 real music directors in your city tonight — while other artists are still guessing at info@ inboxes.",
  },

  /* — sticky bar button label — */
  stickyLabel: {
    default: "Get Instant Access — $20",
    calm: "Get The Contacts — $20",
    aspire: "Join The Vault — $20",
    urgency: "Lock In $20 Before It's $49",
  },

  /* — exit-intent dialog — */
  exitTitle: {
    default: (
      <>
        LEAVING MEANS PAYING <span className="text-blood line-through">$49</span> LATER
      </>
    ),
    calm: "THINK IT OVER — THE $20 DOOR STAYS OPEN FOR NOW",
    aspire: "THE ARTISTS WHO MOVE FIRST GET PLAYED FIRST",
    urgency: (
      <>
        LEAVING MEANS PAYING <span className="text-blood line-through">$49</span> LATER
      </>
    ),
  },
  exitBody: {
    default: "You're one click from 18,000+ radio station contacts.",
    calm: "No pressure. But the founder price steps up to $49 when the launch window closes.",
    aspire: "You're one click from the same list the artists in rotation used.",
    urgency: "You're one click from 18,000+ radio station contacts — and the $20 founder price.",
  },
};

/** Resolve a slot for a mode; always falls back to the original. */
export function copyFor(slot: SlotKey, mode: EmotionalMode): ReactNode {
  return SLOT_COPY[slot][mode] ?? SLOT_COPY[slot].default;
}
