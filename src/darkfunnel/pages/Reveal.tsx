/* ─────────────────────────────────────────────────────────────
   STAGE 2 — THE REVEAL
   ─────────────────────────────────────────────────────────────
   The register changes without warning: paper → pitch. The
   visitor who was reading an investigation is now inside a long-
   form sales letter, and the transition is deliberately made to
   feel like a continuation of the article ("SECTION 3 OF 3")
   rather than the beginning of a pitch.

   Structure is the 1970s direct-response skeleton, unchanged:
   forbidden-knowledge open → agitation → authority → mechanism →
   proof → FAQ (objection pre-emption) → guarantee → CTA.
───────────────────────────────────────────────────────────── */

import { BRAND, REVEAL, TESTIMONIALS } from "../copy";
import { OFFER, money } from "../core";
import { nav } from "../router";
import { useFunnel } from "../state";
import { Countdown, ExitIntent, ScarcityRail, StickyCta } from "../widgets";
import { Xray } from "../xray";

export default function Reveal() {
  const { teardown } = useFunnel();
  const go = () => nav("/qualify");

  return (
    <div className="min-h-screen bg-ink pb-28">
      <ScarcityRail />

      <div className="mx-auto max-w-3xl px-4">
        {/* ── forbidden knowledge ─────────────────────────── */}
        <section className="pt-10 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blood">
            {REVEAL.eyebrow}
          </p>

          <Xray id="forbidden-knowledge" className="mt-4">
            <h1 className="font-display text-[2.4rem] uppercase leading-[0.9] text-white sm:text-6xl">
              {REVEAL.headline}
            </h1>
          </Xray>

          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65 sm:text-base">
            {REVEAL.sub}
          </p>

          {teardown && (
            <p className="mx-auto mt-4 max-w-xl rounded border border-dashed border-xray/60 p-2 font-mono text-[11px] leading-relaxed text-xray">
              specialness (“you”) + paranoia (“not meant to”) in six words.
              Suppression is offered as evidence of value, which makes the
              claim unfalsifiable.
            </p>
          )}

          <button
            type="button"
            onClick={go}
            className="mt-7 w-full rounded-lg bg-acid px-8 py-4 text-base font-black uppercase tracking-wide text-ink transition hover:brightness-95 active:scale-[0.99] sm:w-auto"
          >
            Start the intake screening →
          </button>
          <p className="mt-2 text-[11px] text-white/40">
            6 questions · under 90 seconds · no card
          </p>
        </section>

        {/* ── agitation ───────────────────────────────────── */}
        <Xray id="agitation" className="mt-14">
          <section className="rounded-xl border border-white/10 bg-panel p-6 sm:p-8">
            <h2 className="font-display text-2xl uppercase leading-tight text-white sm:text-3xl">
              {REVEAL.agitation.title}
            </h2>
            <div className="mt-4 space-y-4">
              {REVEAL.agitation.beats.map((b, i) => (
                <p
                  key={i}
                  className={`text-[15px] leading-relaxed ${
                    i === REVEAL.agitation.beats.length - 1
                      ? "font-semibold text-acid"
                      : "text-white/70"
                  }`}
                >
                  {b}
                </p>
              ))}
            </div>
          </section>
        </Xray>

        {/* ── authority ───────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl uppercase text-white sm:text-3xl">
            {REVEAL.authority.title}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            {REVEAL.authority.body}
          </p>

          <Xray id="borrowed-authority" className="mt-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {REVEAL.authority.credentials.map((c) => (
                <div
                  key={c.label}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center"
                >
                  <p className="tnum font-display text-2xl leading-none text-acid">
                    {c.stat}
                  </p>
                  <p className="mt-1.5 text-[10px] uppercase leading-tight tracking-wider text-white/45">
                    {c.label}
                  </p>
                </div>
              ))}
            </div>
          </Xray>

          <div className="mt-5 flex gap-3 rounded-lg border-l-2 border-acid/60 bg-white/[0.02] p-4">
            <span className="font-display text-3xl leading-none text-acid">“</span>
            <p className="text-[15px] italic leading-relaxed text-white/75">
              Compliance engineering wearing a lanyard.
              <span className="mt-1 block text-[12px] not-italic text-white/40">
                — clinical psychologist, name withheld at her request
              </span>
            </p>
          </div>
        </section>

        {/* ── mechanism ───────────────────────────────────── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl uppercase text-white sm:text-3xl">
            {REVEAL.mechanism.title}
          </h2>
          <div className="mt-5 space-y-3">
            {REVEAL.mechanism.steps.map((s) => (
              <div
                key={s.n}
                className="flex gap-4 rounded-lg border border-white/10 bg-panel p-4"
              >
                <span className="font-display text-3xl leading-none text-white/15">
                  {s.n}
                </span>
                <div>
                  <p className="font-bold uppercase tracking-wide text-acid">
                    {s.title}
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-white/65">
                    {s.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── proof ───────────────────────────────────────── */}
        <Xray id="testimonial-theatre" className="mt-12">
          <section>
            <h2 className="font-display text-2xl uppercase text-white sm:text-3xl">
              The two who talked, and two who shouldn’t have
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.name}
                  className="rounded-lg border border-white/10 bg-panel p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-acid/80 to-blood/70 text-[12px] font-black text-ink">
                      {t.initials}
                    </span>
                    <div>
                      <p className="text-[13px] font-bold text-white">{t.name}</p>
                      <p className="text-[11px] text-white/45">{t.role}</p>
                    </div>
                    <span className="ml-auto rounded-sm bg-emerald-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                      {t.stat}
                    </span>
                  </div>
                  <blockquote className="mt-3 text-[14px] leading-relaxed text-white/70">
                    “{t.text}”
                  </blockquote>
                </figure>
              ))}
            </div>
            {teardown && (
              <p className="mt-3 font-mono text-[11px] text-xray">
                Note the hedges (“wouldn’t do it again”). Qualified praise
                out-converts unqualified praise because it reads as unscripted.
                All four are scripted.
              </p>
            )}
          </section>
        </Xray>

        {/* ── price + FAQ ─────────────────────────────────── */}
        <section className="mt-12 rounded-xl border border-acid/25 bg-gradient-to-b from-acid/[0.07] to-transparent p-6 text-center sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
            Screened release price
          </p>
          <Xray id="price-anchor" className="mt-3">
            <p className="flex items-baseline justify-center gap-3">
              <span className="font-display text-2xl text-white/35 line-through decoration-blood decoration-2">
                {money(OFFER.tripwireAnchor)}
              </span>
              <span className="font-display text-6xl leading-none text-acid">
                {money(OFFER.tripwire)}
              </span>
            </p>
          </Xray>
          <p className="mt-2 text-[13px] text-white/55">
            One payment. No subscription. Nothing recurs — because nothing
            exists.
          </p>
          <div className="mt-5 flex flex-col items-center gap-2">
            <Countdown size="lg" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              until the screening closes
            </span>
          </div>
          <button
            type="button"
            onClick={go}
            className="mt-6 w-full rounded-lg bg-acid px-8 py-4 text-base font-black uppercase tracking-wide text-ink transition hover:brightness-95 sm:w-auto"
          >
            Take the intake screening →
          </button>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl uppercase text-white sm:text-3xl">
            Objections, pre-empted
          </h2>
          <div className="mt-4 divide-y divide-white/10 rounded-xl border border-white/10 bg-panel">
            {REVEAL.faq.map((f) => (
              <details key={f.q} className="group p-4">
                <summary className="cursor-pointer list-none text-[14px] font-semibold text-white marker:hidden">
                  <span className="mr-2 text-acid group-open:hidden">+</span>
                  <span className="mr-2 hidden text-acid group-open:inline">−</span>
                  {f.q}
                </summary>
                <p className="mt-2 pl-5 text-[14px] leading-relaxed text-white/65">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="font-display text-xl uppercase text-acid">
            {REVEAL.guarantee.title}
          </p>
          <p className="mx-auto mt-2 max-w-xl text-[14px] leading-relaxed text-white/65">
            {REVEAL.guarantee.body}
          </p>
        </section>

        <footer className="py-10 text-center font-mono text-[10px] leading-relaxed text-white/25">
          {BRAND.product} is not a product. This page is a replica of a
          long-form offer page, built for teardown.
        </footer>
      </div>

      <StickyCta onCta={go} />
      <ExitIntent onStay={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
    </div>
  );
}
