/* ─────────────────────────────────────────────────────────────
   STAGE 2 — THE REVEAL
   ─────────────────────────────────────────────────────────────
   The long-form offer page: agitation stack, manufactured
   authority, testimonial wall, value stack with a phantom
   anchor, FAQ that pre-empts objections, and a guarantee that
   sounds generous and says almost nothing.

   Note the destination — every button here goes to /qualify.
   The visitor is never sent straight to payment, so the quiz and
   the email always come before the money.
───────────────────────────────────────────────────────────── */

import { useEffect } from "react";
import { Annotated } from "../Annotate";
import { Check, Countdown, ScarcityRail, Stars, StickyCta } from "../chrome";
import { trip } from "../state";

const AGITATION = [
  [
    "You have sent the email.",
    "Probably a lot of them. To info@ addresses that route to a shared inbox nobody has opened since a staffing change in 2023.",
  ],
  [
    "You have paid the platform.",
    "Forty dollars a campaign to be placed in front of curators who are paid per listen and who listen for eleven seconds.",
  ],
  [
    "You have been told to be patient.",
    "By people whose income does not depend on whether you ever get played.",
  ],
  [
    "And the worst part is that it isn't a talent problem.",
    "It is an addressing problem. The music is landing in the wrong inbox, in the wrong week, in the wrong city.",
  ],
];

const TESTIMONIALS = [
  {
    name: "Marcus Delane",
    role: "Producer / DJ · Detroit, MI",
    photo:
      "https://images.pexels.com/photos/33136738/pexels-photo-33136738.jpeg?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=160&h=160",
    text: "Forty emails on a Sunday night. Two program directors replied by Monday lunch, one put the single in weekend rotation. I'd burned six months on submission platforms before this.",
    stat: "2 spins in 9 days",
  },
  {
    name: "Aiyana Ross-Whitfield",
    role: "Indie Folk · Portland, OR",
    photo:
      "https://images.pexels.com/photos/35367077/pexels-photo-35367077.jpeg?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=160&h=160",
    text: "The city-by-city structure is the whole trick. I pitched every station on my tour route three weeks ahead. Two booked on-air interviews and ticket sales in those markets doubled.",
    stat: "2 on-air interviews",
  },
  {
    name: "Tomás Vega Arriaga",
    role: "Latin Alt · Austin, TX",
    photo:
      "https://images.pexels.com/photos/29881401/pexels-photo-29881401.jpeg?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=160&h=160",
    text: "Having the actual music director's name instead of a generic inbox changed the tone of every conversation. People answer when you use their name.",
    stat: "17 replies / 120 sent",
  },
];

const FAQ = [
  [
    "Why is there an assessment instead of a buy button?",
    "Because the list degrades when it is used badly. Four questions is a low bar, but it is a bar. Answers are weighted and the assessment is scored.",
  ],
  [
    "Is this just a spreadsheet?",
    "It is a spreadsheet the way a key is just a piece of metal. What you are paying for is that someone verified each row within the last ninety days.",
  ],
  [
    "What if I'm not signed, not touring, and nobody knows me?",
    "That describes most people who clear the assessment. Anonymity is not the obstacle. Addressing is.",
  ],
  [
    "What happens when the window closes?",
    "The page comes down. Whether it comes back depends on how the current cohort behaves.",
  ],
  [
    "Is there a guarantee?",
    "Thirty days. If you work the method and it does nothing, write in and it is handled. Almost nobody does.",
  ],
];

export default function Reveal({ onQualify }: { onQualify: () => void }) {
  useEffect(() => {
    trip(
      "price_anchoring",
      "You were shown a struck-through $350 'value' that was never a real price, itemised to make it feel audited."
    );
    trip(
      "specialness_paranoia",
      "Copy repeatedly told you that you were not supposed to have found this page."
    );
  }, []);

  return (
    <div className="min-h-screen bg-ink pb-32">
      <Annotated pattern="persistent_countdown" as="div">
        <div className="flex flex-wrap items-center justify-center gap-3 border-b border-white/10 bg-blood/15 px-4 py-2.5">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white">
            Access window closes in
          </span>
          <Countdown />
          <ScarcityRail />
        </div>
      </Annotated>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <Annotated pattern="specialness_paranoia">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.22em] text-blood">
            You were not meant to find this
          </p>
        </Annotated>

        <h1 className="mt-4 text-center font-display text-[2.2rem] leading-[1.02] sm:text-6xl sm:leading-[0.95]">
          THE LIST THEY USE{" "}
          <span className="text-acid">TO DECIDE WHO GETS PLAYED.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-center font-serif text-lg leading-[1.6] text-white/78">
          18,412 verified contacts at college, community, commercial and online
          stations. Not inboxes — <span className="hl font-semibold">names</span>. The
          person who actually decides, the week they actually decide it.
        </p>

        {/* ── agitation stack ── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl leading-tight sm:text-4xl">
            LET'S BE PRECISE ABOUT WHAT ISN'T WORKING.
          </h2>
          <div className="mt-6 space-y-5">
            {AGITATION.map(([head, body]) => (
              <div key={head} className="border-l-2 border-blood/60 pl-4">
                <p className="font-display text-lg leading-tight text-white sm:text-xl">
                  {head}
                </p>
                <p className="mt-1.5 font-serif text-[15px] leading-relaxed text-white/65">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── authority ── */}
        <section className="mt-12 rounded-xl border border-white/10 bg-panel p-5 sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-acid">
            Who maintains this
          </p>
          <p className="mt-3 font-serif text-[15px] leading-relaxed text-white/75">
            The list is kept by a former promotions coordinator who spent eleven
            years placing records at stations in 34 markets, and who now refuses to
            be named in connection with it for reasons that will be obvious to
            anyone who has worked that side of the desk. Verification runs on a
            ninety-day cycle. Rows that bounce are pulled, not flagged.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center">
            {[
              ["18,412", "verified rows"],
              ["34", "markets"],
              ["90 days", "re-verification"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-2xl text-acid sm:text-3xl">{n}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/40">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── testimonials ── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl leading-tight sm:text-4xl">
            WHAT THE LAST COHORT SAID.
          </h2>
          <div className="mt-6 space-y-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-lg border border-white/10 bg-panel p-5">
                <Stars />
                <p className="mt-2 font-serif text-[15px] leading-relaxed text-white/80">
                  “{t.text}”
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-3">
                  <img
                    src={t.photo}
                    alt=""
                    aria-hidden
                    width={40}
                    height={40}
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-acid/40"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{t.name}</p>
                    <p className="truncate text-[11px] text-white/45">{t.role}</p>
                  </div>
                  <span className="rounded-full bg-acid/15 px-2.5 py-1 text-[10px] font-bold text-acid">
                    {t.stat}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── value stack + phantom anchor ── */}
        <Annotated pattern="price_anchoring" className="mt-12">
          <div className="rounded-xl border-2 border-acid/50 bg-panel p-5 sm:p-7">
            <p className="font-display text-xl leading-tight sm:text-2xl">
              WHAT ACCESS INCLUDES
            </p>
            <ul className="mt-5 space-y-3 text-[15px]">
              <Check>
                <b>The Vault</b> — 18,412 verified station contacts, sorted by market
                and format. <span className="text-white/45">($197 value)</span>
              </Check>
              <Check>
                <b>The named-human index</b> — music and program directors, current
                as of the last verification pass.{" "}
                <span className="text-white/45">($89 value)</span>
              </Check>
              <Check>
                <b>Market timing calendar</b> — which weeks each format adds.{" "}
                <span className="text-white/45">($49 value)</span>
              </Check>
              <Check>
                <b>The four-line pitch template</b> — the one the sources said they
                actually read. <span className="text-white/45">($15 value)</span>
              </Check>
            </ul>

            <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/40">
                  Stated value
                </p>
                <p className="font-display text-3xl text-white/40 line-through decoration-blood decoration-2">
                  $350
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-widest text-acid">
                  This window only
                </p>
                <p className="font-display text-5xl text-acid">$29</p>
              </div>
            </div>

            <button
              onClick={onQualify}
              className="cta mt-6 w-full rounded-lg bg-acid px-5 py-4 font-display text-lg uppercase leading-tight tracking-wide text-ink sm:text-2xl"
            >
              Start the assessment
              <span className="mt-1 block text-[10px] font-sans font-bold tracking-normal opacity-70">
                Payment is not taken until you clear it
              </span>
            </button>
          </div>
        </Annotated>

        {/* ── FAQ ── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl leading-tight sm:text-4xl">
            OBJECTIONS, ANSWERED IN ADVANCE.
          </h2>
          <div className="mt-5 space-y-2">
            {FAQ.map(([q, a]) => (
              <details
                key={q}
                className="group rounded-lg border border-white/10 bg-panel px-4 py-3"
              >
                <summary className="cursor-pointer list-none font-bold text-[15px] text-white/85 marker:hidden">
                  <span className="mr-2 text-acid group-open:hidden">+</span>
                  <span className="mr-2 hidden text-acid group-open:inline">–</span>
                  {q}
                </summary>
                <p className="mt-2 font-serif text-[14px] leading-relaxed text-white/65">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-10 rounded-xl border border-white/10 bg-panel p-5 text-center">
          <p className="font-display text-xl">30-DAY WINDOW</p>
          <p className="mt-2 font-serif text-[14px] leading-relaxed text-white/60">
            Work the method. If it does nothing, write in.
          </p>
        </div>
      </div>

      <StickyCta
        label="Start the assessment"
        sub="$29 · window closing"
        onClick={onQualify}
      />
    </div>
  );
}
