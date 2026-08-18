/* ─────────────────────────────────────────────────────────────
   OFFER v2 — the value-equation blocks
   ─────────────────────────────────────────────────────────────
   Dream Outcome × Perceived Likelihood
   ────────────────────────────────────  ÷  (Time Delay × Effort)

   Each block below moves exactly one term of that equation and
   is individually feature-flagged (see config/offer.ts), so any
   piece can be pulled at runtime without touching the rest.

   Design constraints, non-negotiable:
     • dark premium surface (bg-panel / black-40, white/10 hairlines)
     • acid yellow reserved for CTAs, values and affirmations
     • blood red reserved for scarcity and loss framing
     • no layout shift, no autoplay motion, reduced-motion safe
───────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";
import { Check, SectionLabel, useCountdown } from "./ui";
import {
  BONUSES,
  CTA_CHIPS,
  DREAM_BEATS,
  EFFORT_REMOVERS,
  GUARANTEE,
  OFFER_FACTS,
  PROOF_POINTS,
  RISK_LINE,
  SPECIFICITY_LINES,
  SPEED_STEPS,
} from "./offerContent";

/* ═══════════════════════════════════════════════════════════
   DREAM OUTCOME
═══════════════════════════════════════════════════════════ */

export function DreamOutcomeBlock({ onCta }: { onCta: () => void }) {
  return (
    <section id="tonight" className="border-y border-white/10 bg-panel">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <SectionLabel>What tonight actually looks like</SectionLabel>
        <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight">
          YOU'RE NOT BUYING A SPREADSHEET.
          <span className="mt-2 block text-acid">
            YOU'RE BUYING THE REPLY.
          </span>
        </h2>
        <p className="mt-4 max-w-2xl font-serif text-[1.05rem] leading-[1.65] text-white/70 sm:text-lg">
          A submission form is a mailbox with no name on it. Here's the version where a
          human being on the other end knows who you are — mapped hour by hour, starting
          the second you download.
        </p>

        <ol className="mt-8 space-y-3 sm:space-y-4">
          {DREAM_BEATS.map((beat, i) => (
            <li
              key={beat.clock}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-5">
                <span className="tnum shrink-0 font-display text-lg leading-none text-acid sm:w-28 sm:text-xl">
                  {beat.clock}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg uppercase leading-tight sm:text-xl">
                    {beat.title}
                  </p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-white/65">
                    {beat.body}
                  </p>
                </div>
              </div>
              {i < DREAM_BEATS.length - 1 && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-0 left-4 h-3 w-px bg-acid/30 sm:left-5"
                />
              )}
            </li>
          ))}
        </ol>

        <div className="mt-7 rounded-xl border border-acid/40 bg-acid/[0.07] p-4 sm:p-5">
          <p className="font-serif text-[1.02rem] leading-[1.6] text-white/85 sm:text-lg">
            <b className="text-acid">That's the entire product:</b> the distance between
            "I don't know who to send this to" and a named music director reading your
            name — closed tonight, for the price of two coffees.
          </p>
          <button
            onClick={onCta}
            className="cta mt-4 w-full rounded-lg bg-acid px-4 py-3.5 font-display text-[1.05rem] uppercase leading-tight tracking-wide text-ink sm:w-auto sm:px-7 sm:text-lg"
          >
            Start Tonight — {OFFER_FACTS.priceLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   PERCEIVED LIKELIHOOD OF SUCCESS
═══════════════════════════════════════════════════════════ */

export function ProofStackBlock() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <SectionLabel>Why this works when the forms didn't</SectionLabel>
      <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight">
        SPECIFICS, NOT <span className="text-blood">PROMISES</span>
      </h2>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {PROOF_POINTS.map((p) => (
          <div
            key={p.label}
            className="rounded-xl border border-white/10 bg-panel p-4 sm:p-5"
          >
            <p className="tnum font-display text-3xl leading-none text-acid sm:text-4xl">
              {p.stat}
            </p>
            <p className="mt-2 font-display text-base uppercase leading-tight sm:text-lg">
              {p.label}
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-white/60">{p.detail}</p>
          </div>
        ))}
      </div>

      <ul className="mt-6 space-y-3 rounded-xl border border-white/10 bg-black/40 p-4 text-[15px] leading-snug sm:p-5">
        {SPECIFICITY_LINES.map((line, i) => (
          <Check key={i}>{line}</Check>
        ))}
      </ul>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   TIME DELAY × EFFORT
═══════════════════════════════════════════════════════════ */

export function SpeedStackBlock() {
  return (
    <section className="border-y border-white/10 bg-panel">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <SectionLabel>From payment to first pitch</SectionLabel>
        <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight">
          TWENTY MINUTES. <span className="text-acid">NOT SIX MONTHS.</span>
        </h2>
        <p className="mt-4 max-w-2xl font-serif text-[1.05rem] leading-[1.65] text-white/70 sm:text-lg">
          There is no onboarding, no account, no "we'll email your files shortly." The
          slowest part of this is you deciding which city to start with.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {SPEED_STEPS.map((s) => (
            <div
              key={s.when}
              className="flex gap-3.5 rounded-xl border border-white/10 bg-black/40 p-4 sm:p-5"
            >
              <span className="tnum shrink-0 font-display text-lg leading-none text-acid sm:text-xl">
                {s.when}
              </span>
              <div className="min-w-0">
                <p className="font-bold leading-snug">{s.title}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-white/60">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <ul className="mt-6 grid gap-2.5 text-[15px] leading-snug sm:grid-cols-2 sm:gap-3">
          {EFFORT_REMOVERS.map((e) => (
            <Check key={e}>{e}</Check>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   BONUS STACK — tied to the founder timer
═══════════════════════════════════════════════════════════ */

/**
 * Shares the sales page's countdown key, so the bonus deadline is
 * literally the same clock the visitor already sees ticking.
 */
export function BonusStackBlock({
  onCta,
  seconds = 897,
}: {
  onCta: () => void;
  seconds?: number;
}) {
  const { h, m, s, pad } = useCountdown(seconds);

  return (
    <section id="bonuses" className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <div className="overflow-hidden rounded-2xl border-2 border-acid/45 bg-gradient-to-b from-acid/[0.09] to-transparent">
        <div className="flex flex-col items-center gap-1.5 border-b border-acid/25 bg-black/50 px-4 py-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blood sm:text-[11px]">
            Founder bonuses — included free until the timer hits zero
          </p>
          <p
            className="tnum shrink-0 font-display text-lg leading-none text-acid sm:text-xl"
            role="timer"
            aria-live="off"
            aria-label={`${h} hours ${m} minutes ${s} seconds remaining`}
          >
            {pad(h)}:{pad(m)}:{pad(s)}
          </p>
        </div>

        <div className="p-4 sm:p-7">
          <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-4xl">
            THREE THINGS THAT TURN THE LIST
            <span className="block text-acid">INTO SENT EMAILS</span>
          </h2>
          <p className="mt-3 max-w-2xl font-serif text-[1.02rem] leading-[1.62] text-white/70 sm:text-lg">
            Contacts are only half the job. These close the gap between having the
            addresses and actually sending something worth reading — and they leave with
            the founder price.
          </p>

          <div className="mt-6 space-y-3 sm:space-y-4">
            {BONUSES.map((b) => (
              <article
                key={b.id}
                className="rounded-xl border border-white/10 bg-black/45 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                  <span className="rounded-full bg-blood px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    {b.tag}
                  </span>
                  <h3 className="font-display text-lg uppercase leading-tight sm:text-xl">
                    {b.name}
                  </h3>
                  <span className="ml-auto shrink-0 font-display text-base text-white/45 line-through decoration-blood sm:text-lg">
                    {b.value}
                  </span>
                </div>
                <p className="mt-2 font-serif text-[15px] leading-relaxed text-acid/90">
                  {b.hook}
                </p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-white/60">
                  {b.detail}
                </p>
                <ul className="mt-3 space-y-2 text-[14px] leading-snug">
                  {b.bullets.map((x) => (
                    <Check key={x}>{x}</Check>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
            <div className="flex items-center justify-between gap-3 bg-black/50 p-3.5 sm:p-4">
              <span className="font-display text-base uppercase leading-tight sm:text-lg">
                Bonuses added today
              </span>
              <span className="font-display text-xl text-white/50 line-through decoration-blood decoration-2 sm:text-2xl">
                {OFFER_FACTS.bonusValueLabel}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-acid p-3.5 text-ink sm:p-4">
              <span className="font-display text-base uppercase leading-tight sm:text-lg">
                You pay today
              </span>
              <span className="font-display text-3xl">{OFFER_FACTS.priceLabel}</span>
            </div>
          </div>

          <button
            onClick={onCta}
            className="cta mt-5 w-full rounded-lg bg-acid px-5 py-4 font-display text-xl uppercase tracking-wide text-ink sm:py-5 sm:text-2xl"
          >
            Claim The Vault + All 3 Bonuses →
          </button>
          <p className="mt-2.5 text-center text-[12px] leading-snug text-white/45">
            When the timer hits zero the bonuses come out and the price returns to{" "}
            {OFFER_FACTS.anchorLabel}.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   RISK REVERSAL
═══════════════════════════════════════════════════════════ */

export function GuaranteeV2Block() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div
        data-esp-zone="safety"
        className="rounded-2xl border-2 border-acid/40 bg-gradient-to-b from-acid/10 to-transparent p-5 text-center sm:p-8"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-acid font-display text-xl leading-none text-acid sm:h-20 sm:w-20 sm:text-2xl">
          {OFFER_FACTS.refundDays}
        </div>
        <h2 className="mt-4 font-display text-[1.55rem] leading-[1.12] sm:text-4xl">
          {GUARANTEE.title}
        </h2>
        <p className="mt-3 font-serif text-[1.05rem] leading-[1.65] text-white/80 sm:text-lg">
          {GUARANTEE.promise}
        </p>

        <dl className="mt-6 grid gap-3 text-left sm:grid-cols-3">
          {GUARANTEE.terms.map((t) => (
            <div
              key={t.q}
              className="rounded-xl border border-white/10 bg-black/40 p-4"
            >
              <dt className="font-display text-base uppercase leading-tight text-acid">
                {t.q}
              </dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed text-white/65">{t.a}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-[13px] font-bold uppercase tracking-wider text-white/45">
          {RISK_LINE}
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED CTA REASSURANCE
═══════════════════════════════════════════════════════════ */

export function CtaChips({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}
      aria-label="Purchase terms"
    >
      {CTA_CHIPS.map((c) => (
        <li
          key={c}
          className="rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60"
        >
          {c}
        </li>
      ))}
    </ul>
  );
}

/** Small inline wrapper so flagged blocks read cleanly in the page. */
export function OfferSlot({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return enabled ? <>{children}</> : null;
}
