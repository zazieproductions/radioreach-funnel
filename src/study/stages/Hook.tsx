/* ─────────────────────────────────────────────────────────────
   STAGE 1 — THE HOOK
   ─────────────────────────────────────────────────────────────
   A sales page wearing an article's clothes. Outrage premise in
   the eyebrow, withheld outcome in the deck, scroll trap in the
   body, decoy archive in the sidebar, and a sticky CTA that
   stays hidden until scroll depth passes 35% — because a reader
   who skims past a third is warm, and the bar should appear
   exactly then.

   Every CTA on this page routes to /qualify. Never to payment.
───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import { Annotated } from "../Annotate";
import { ScarcityRail, StickyCta } from "../chrome";
import { trip } from "../state";

const DECOYS = [
  "The 2019 consent decree that quietly deregulated indie submissions",
  "Why 'submission platforms' pay curators per listen — and what that buys you",
  "Inside the spreadsheet 11,000 artists pass around in Discord DMs",
  "A program director explains the 1.4-second delete",
  "The FCC filing nobody in music PR wants you to read",
  "Six markets where unsigned rotation is still decided by one person",
];

function useScrollDepth(threshold: number) {
  const [passed, setPassed] = useState(false);
  const lockedRef = useRef(false);

  useEffect(() => {
    if (lockedRef.current) return;
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const depth = window.scrollY / max;
      if (depth > threshold && !lockedRef.current) {
        lockedRef.current = true;
        setPassed(true);
        trip(
          "scroll_gated_cta",
          `You scrolled past ${Math.round(threshold * 100)}% of the article, which is what unlocked the sticky bar. Depth was read as intent.`
        );
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return passed;
}

export default function Hook({ onQualify }: { onQualify: () => void }) {
  const showCta = useScrollDepth(0.35);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    trip(
      "advertorial_camouflage",
      "You began reading a sales page formatted as an investigation — byline, dateline, read time, comments. No ad disclosure appeared above the fold."
    );
    trip(
      "outrage_premise",
      "The headline opened with an unsourced professional condemnation, which implies the method works."
    );
  }, []);

  return (
    <div className="min-h-screen bg-ink pb-32">
      {/* masthead — the whole point is that this looks like a publication */}
      <header className="border-b border-white/10 bg-black/60">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <span className="font-display text-lg tracking-tight text-acid">
            THE SIGNAL DESK
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-white/35 sm:inline">
            Independent music · Investigations
          </span>
          <span className="ml-auto hidden gap-4 text-[11px] uppercase tracking-wider text-white/30 sm:flex">
            <span>Reporting</span>
            <span>Data</span>
            <span>Archive</span>
          </span>
        </div>
      </header>

      <article className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="min-w-0">
          <Annotated pattern="outrage_premise">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blood">
              Investigation · Radio &amp; Airplay
            </p>
            <h1 className="mt-3 font-display text-[2.1rem] leading-[1.02] sm:text-5xl sm:leading-[0.98]">
              PROGRAM DIRECTORS ARE CALLING IT{" "}
              <span className="text-blood">PSYCHOLOGICAL MALPRACTICE.</span>
            </h1>
          </Annotated>

          <Annotated pattern="curiosity_gap" className="mt-4">
            <p className="font-serif text-lg leading-[1.55] text-white/80 sm:text-xl">
              11,482 independent artists did it anyway last quarter — and{" "}
              <span className="hl font-semibold">none of them will say what happened next.</span>
            </p>
          </Annotated>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-white/10 py-3 text-[11px] text-white/40">
            <span className="font-bold text-white/70">By R. Calloway</span>
            <span>Contributing editor</span>
            <span className="hidden sm:inline">·</span>
            <span>Updated 4 hours ago</span>
            <span className="hidden sm:inline">·</span>
            <span>9 min read</span>
            <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5">1.2k comments</span>
          </div>

          <div className="mt-5">
            <ScarcityRail />
          </div>

          {/* ── the scroll trap ── */}
          <Annotated pattern="scroll_trap" className="mt-7">
            <div className="space-y-4 font-serif text-[1.02rem] leading-[1.72] text-white/78">
              <p>
                The first thing you should know is that nobody wanted this written
                down.
              </p>
              <p>
                I spent six weeks trying to get a straight answer out of people who
                book rotation at mid-market stations. Most wouldn't talk. Two did,
                on the condition I not name the station, the city, or the format.
              </p>
              <p>
                What they described was not a conspiracy. It was worse than that. It
                was a{" "}
                <span className="hl font-semibold">
                  procedural habit that nobody has ever bothered to defend in public
                </span>
                , because nobody outside the building knew it existed.
              </p>
              <p className="text-white/90">
                I'll get to what it is. First you need the number.
              </p>
              <p>
                Between January and March, 11,482 unsigned artists submitted to
                terrestrial and college stations using a method that one of my
                sources described, unprompted, as "borderline unethical."
              </p>
              <p>
                Not illegal. He was specific about that. He said it twice.
              </p>
              <p>
                What bothered him wasn't the method. It was the{" "}
                <span className="hl font-semibold">response rate</span>.
              </p>

              <figure className="my-6 border-l-2 border-acid pl-4">
                <blockquote className="font-serif text-[1.15rem] italic leading-snug text-white">
                  "If everyone did this, we'd have to change how we screen entirely.
                  So I'd really rather you didn't print it."
                </blockquote>
                <figcaption className="mt-2 text-[11px] uppercase tracking-wider text-white/35">
                  — Program director, top-40 market, speaking on background
                </figcaption>
              </figure>

              <p>
                Here is the part where I'm supposed to explain the mechanism.
              </p>
              <p>
                I'm not going to, and I want to be honest about why: the people who
                gave me this asked for one thing in exchange, and it was that the
                method not be published as a free article that gets aggregated into
                twelve newsletters by Friday.
              </p>
              <p className="text-white/90">
                What I can do is point you at where it lives.
              </p>
            </div>
          </Annotated>

          {/* fake "continue reading" expansion — pure deferral */}
          {!expanded && (
            <Annotated pattern="scroll_trap" className="relative mt-2">
              <div className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-gradient-to-t from-ink to-transparent" />
              <button
                onClick={() => {
                  setExpanded(true);
                  trip(
                    "scroll_trap",
                    "You clicked 'continue reading' on an article that had no ending — the payoff was always one section further down."
                  );
                }}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-white/70"
              >
                Continue reading — 4 min remaining
              </button>
            </Annotated>
          )}

          {expanded && (
            <div className="mt-4 space-y-4 font-serif text-[1.02rem] leading-[1.72] text-white/78">
              <p>
                The short version: the artists who got replies were not sending more
                emails. They were sending{" "}
                <span className="hl font-semibold">fewer, to named human beings</span>
                , in a specific order, in markets chosen for a reason they could
                articulate on the phone.
              </p>
              <p>
                That's it. That's the whole thing. It sounds obvious written down,
                which is exactly why it has never been written down.
              </p>
              <p>
                The obstacle was never the technique. It was the list — who, where,
                which inbox, and which of them still answers.
              </p>
              <p className="text-white/90">
                One of my sources maintains that list. He has agreed to open it, in
                a limited way, to people who can demonstrate they will actually use
                it.
              </p>
              <Annotated pattern="specialness_paranoia">
                <p className="rounded-lg border border-blood/30 bg-blood/5 p-4 text-[0.96rem] not-italic text-white/85">
                  A note before you click through: this page was not meant to be
                  indexed. It was shared to a private list on Thursday and picked up
                  by an aggregator within nine hours, which is how you are most
                  likely reading it. That access window has not been extended. It
                  has simply not been closed yet.
                </p>
              </Annotated>
            </div>
          )}

          {/* ── mid-article CTA block ── */}
          <Annotated pattern="lead_gate_before_price" className="mt-8">
            <div className="rounded-xl border-2 border-acid/40 bg-panel p-5 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-acid">
                Editor's note
              </p>
              <p className="mt-2 font-serif text-[1.02rem] leading-relaxed text-white/80">
                Access is not sold on this page. It is granted after a four-question
                assessment that takes about ninety seconds. Answers are weighted;
                the assessment is not a formality.
              </p>
              <button
                onClick={onQualify}
                className="cta mt-5 w-full rounded-lg bg-acid px-5 py-4 font-display text-lg uppercase leading-tight tracking-wide text-ink sm:text-xl"
              >
                See if you qualify for access
                <span className="mt-1 block text-[10px] font-sans font-bold tracking-normal opacity-70">
                  4 questions · ~90 seconds · no card required
                </span>
              </button>
            </div>
          </Annotated>

          {/* comments — set dressing that implies an audience */}
          <div className="mt-8 border-t border-white/10 pt-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
              1,204 comments
            </p>
            <div className="mt-4 space-y-4">
              {[
                ["Dana_R", "I did the assessment last night and I'm still thinking about question 4."],
                ["mikeonthelow", "Third article this week that stops right before the useful part."],
                ["velvetrooms", "Went through it. Not saying more than that."],
              ].map(([who, what]) => (
                <div key={who} className="rounded-lg bg-white/[0.03] p-3">
                  <p className="text-[12px] font-bold text-white/70">{who}</p>
                  <p className="mt-1 font-serif text-[14px] leading-relaxed text-white/60">
                    {what}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── decoy archive rail ── */}
        <aside className="hidden lg:block">
          <Annotated pattern="decoy_links">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              Related coverage
            </p>
            <ul className="mt-3 space-y-3 opacity-35">
              {DECOYS.map((d) => (
                <li
                  key={d}
                  className="cursor-default font-serif text-[13px] leading-snug text-white/70 underline decoration-white/20 underline-offset-2"
                >
                  {d}
                </li>
              ))}
            </ul>
          </Annotated>
        </aside>
      </article>

      <StickyCta
        visible={showCta}
        label="See if you qualify"
        sub="Access closes with the window"
        onClick={onQualify}
      />
    </div>
  );
}
