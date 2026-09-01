/* ─────────────────────────────────────────────────────────────
   STAGE 1 — THE HOOK
   ─────────────────────────────────────────────────────────────
   A fake article on a fake publication. Everything about the
   layout is borrowed: serif body, byline, dateline, "most read"
   rail, related links. The visitor arrives in reading posture,
   which is a lower-scrutiny posture than shopping posture, and
   the page never announces the switch.

   The article is written to withhold. Each paragraph settles one
   loop and opens a wider one; the payload is always one screen
   further down, and then it isn't on this page at all.
───────────────────────────────────────────────────────────── */

import { useMemo } from "react";
import { ARTICLE, BRAND, DECOY_LINKS, TRENDING_STRIP } from "../copy";
import { pickHeadline } from "../core";
import { nav } from "../router";
import { useFunnel } from "../state";
import { StickyCta } from "../widgets";
import { Xray } from "../xray";

export default function Hook() {
  const { seed, teardown } = useFunnel();
  const headline = useMemo(() => pickHeadline(seed), [seed]);

  const go = () => nav("/reveal");

  return (
    <div className="paper min-h-screen pb-28">
      {/* ── masthead: institutional camouflage ───────────── */}
      <Xray id="native-ad-costume" below>
        <header className="border-b border-rule bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl tracking-tight text-paperink">
                {BRAND.outlet}
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.14em] text-black/40 sm:inline">
                {BRAND.outletTagline}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-black/45">
              <span className="hidden sm:inline">Investigations</span>
              <span className="hidden sm:inline">Radio</span>
              <span className="rounded-sm bg-paperink px-2 py-1 font-bold text-white">
                Subscribe
              </span>
            </div>
          </div>

          <div className="overflow-hidden border-t border-rule bg-[#efece6]">
            <div className="mx-auto flex max-w-3xl gap-6 whitespace-nowrap px-4 py-1.5 text-[11px] text-black/55">
              <div className="df-marquee flex gap-6">
                {[...TRENDING_STRIP, ...TRENDING_STRIP].map((t, i) => (
                  <span key={i} className={i % 5 === 0 ? "font-bold text-blood" : ""}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </header>
      </Xray>

      <article className="mx-auto max-w-3xl px-4">
        <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-blood">
          {ARTICLE.kicker}
        </p>

        {/* ── the headline: outrage premise + withheld outcome ── */}
        <Xray id="curiosity-gap" className="mt-3">
          <h1 className="font-display text-[2.1rem] uppercase leading-[0.95] tracking-tight text-paperink sm:text-[3.1rem]">
            {headline.premise}
          </h1>
          <p className="mt-3 font-serif text-lg leading-snug text-black/75 sm:text-2xl">
            {headline.withheld}
          </p>
        </Xray>

        {teardown && (
          <p className="mt-3 rounded border border-dashed border-cyan-500/60 bg-cyan-50 p-2 font-mono text-[11px] leading-relaxed text-cyan-900">
            premise = moral heat (“malpractice”, unnamed accusers) ·
            withheld = a named outcome the sentence refuses to state.
            The gap is the click.
          </p>
        )}

        <p className="mt-4 font-serif text-base italic text-black/60">
          {ARTICLE.dek}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-y border-rule py-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-paperink text-xs font-black text-white">
            RV
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-paperink">
              By {ARTICLE.byline}
            </p>
            <p className="text-[11px] text-black/50">
              {ARTICLE.dateline} ·{" "}
              <span className="font-semibold text-blood">{ARTICLE.updated}</span>
            </p>
          </div>
          <div className="ml-auto flex gap-1.5 text-[11px] text-black/40">
            <span className="rounded-sm border border-rule px-2 py-1">Share</span>
            <span className="rounded-sm border border-rule px-2 py-1">Save</span>
          </div>
        </div>

        {/* ── body: the scroll trap ────────────────────────── */}
        <Xray id="scroll-trap" className="paper-body mt-6">
          {ARTICLE.body.slice(0, 6).map((p) => (
            <p key={p.id}>{p.text}</p>
          ))}
        </Xray>

        {/* ── mid-article CTA block ────────────────────────── */}
        <Xray id="specificity-illusion" className="my-8">
          <div className="rounded-lg border-l-4 border-blood bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blood">
              Editor’s note
            </p>
            <p className="mt-2 font-serif text-[1.05rem] leading-relaxed text-paperink">
              The intake screen referenced in this article — the one used to
              decide who is permitted to run the sequence — was released to
              this publication under condition. It is reachable for as long as
              the release window stays open.
            </p>
            <button
              type="button"
              onClick={go}
              className="mt-4 w-full rounded-md bg-paperink px-5 py-3.5 text-sm font-black uppercase tracking-wide text-white transition hover:bg-black sm:w-auto"
            >
              See the intake screen →
            </button>
            <p className="mt-2 text-[11px] text-black/45">
              No signup on this page. 11 min read continues after screening.
            </p>
          </div>
        </Xray>

        <div className="paper-body">
          {ARTICLE.body.slice(6).map((p) => (
            <p key={p.id}>{p.text}</p>
          ))}
        </div>

        {/* ── the wall: the article stops being an article ── */}
        <Xray id="scroll-gated-cta" className="mt-8">
          <div className="rounded-xl border border-rule bg-white p-6 text-center shadow-[0_1px_0_rgba(0,0,0,0.06)] sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">
              Continued
            </p>
            <h2 className="mt-2 font-display text-2xl uppercase leading-tight text-paperink sm:text-3xl">
              {ARTICLE.wallTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-serif text-[1.02rem] leading-relaxed text-black/70">
              {ARTICLE.wallBody}
            </p>
            <button
              type="button"
              onClick={go}
              className="mt-5 w-full rounded-md bg-blood px-6 py-4 text-base font-black uppercase tracking-wide text-white transition hover:brightness-110 sm:w-auto sm:px-10"
            >
              {ARTICLE.wallCta}
            </button>
            <p className="mt-3 text-[11px] italic text-black/45">
              {ARTICLE.wallSub}
            </p>
          </div>
        </Xray>

        {/* ── decoy related links ──────────────────────────── */}
        <Xray id="decoy-links" className="mt-10 border-t border-rule pt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">
            More from {BRAND.outlet}
          </p>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {DECOY_LINKS.map((l) => (
              <li
                key={l}
                className="decoy font-serif text-[0.95rem] leading-snug text-link underline decoration-black/20 underline-offset-2"
                aria-hidden="true"
              >
                {l}
              </li>
            ))}
          </ul>
          {teardown && (
            <p className="mt-3 font-mono text-[11px] text-cyan-700">
              8 links · 0 destinations · opacity .38 — legible enough to imply a
              back catalogue, faint enough that nobody tests one.
            </p>
          )}
        </Xray>

        <footer className="mt-10 border-t border-rule py-8 text-center text-[11px] leading-relaxed text-black/40">
          <p className="font-bold uppercase tracking-[0.18em]">{BRAND.outlet}</p>
          <p className="mx-auto mt-2 max-w-md">
            {BRAND.author} — {BRAND.authorBio}
          </p>
          <p className="mt-4 font-mono text-[10px] text-black/30">
            This publication does not exist. This article is a research replica
            of a clickbait acquisition page.
          </p>
        </footer>
      </article>

      <StickyCta onCta={go} light />
    </div>
  );
}
