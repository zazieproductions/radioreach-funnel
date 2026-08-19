import { useState } from "react";
import { Check, FlipClock, Stars } from "./ui";
import { T_ACCELERATOR, T_FONTS, T_UPWORK, type Testimonial } from "./testimonials";

/** Shared testimonial card with photo */
export function TCard({ t, compact }: { t: Testimonial; compact?: boolean }) {
  return (
    <figure className="rounded-lg border border-white/10 bg-panel p-5">
      <Stars />
      <blockquote className={`mt-2 font-serif leading-relaxed text-white/80 ${compact ? "text-[14px]" : "text-[16px]"}`}>
        “{t.text}”
      </blockquote>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-3">
        <img
          src={t.photo}
          alt=""
          aria-hidden
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
          className="h-10 w-10 shrink-0 rounded-full bg-white/5 object-cover ring-2 ring-acid/40"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold">{t.name}</p>
          <p className="truncate text-[11px] text-white/55">{t.role}</p>
        </div>
        <span className="rounded-full bg-acid/15 px-2.5 py-1 text-[10px] font-bold text-acid">
          {t.stat}
        </span>
      </figcaption>
    </figure>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED SHELL
═══════════════════════════════════════════════════════════════════════════ */

function OtoShell({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink pb-16">
      <p className="bg-acid py-2 text-center text-[11px] font-black uppercase tracking-[0.16em] text-ink">
        Order confirmed — one last offer before your downloads
      </p>
      <p className="bg-blood py-1.5 text-center text-[11px] font-black uppercase tracking-[0.16em]">
        {kicker}
      </p>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-9">{children}</div>
    </div>
  );
}

function StepMeter({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="mx-auto mt-3 flex max-w-md items-center gap-2"
      role="img"
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < current ? "bg-acid" : "bg-white/15"}`}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OTO 1 — AIRPLAY ACCELERATOR
═══════════════════════════════════════════════════════════════════════════ */

export function Upsell1({
  onAccept,
  onDecline,
}: {
  onAccept: (price: number) => void;
  onDecline: () => void;
}) {
  const decline = onDecline;

  return (
    <OtoShell kicker="Special offer — Step 2 of 3 · this page is never shown again">
      <div>
        <p className="text-center text-[11px] font-black uppercase tracking-[0.28em] text-acid">
          Step 2 of 3 · Your download unlocks after this page
        </p>
        <StepMeter current={2} total={3} />

        <h1 id="page-heading" tabIndex={-1} className="mt-6 text-center font-display text-[1.85rem] leading-[1.06] sm:mt-7 sm:text-6xl sm:leading-[0.95]">
          YOU HAVE THE LIST.{" "}
          <span className="text-blood">NOW WHO WRITES THE PITCH?</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center font-serif text-[1.05rem] leading-[1.62] text-white/75 sm:text-lg">
          18,000+ contacts are worthless if your email gets deleted in 1.4 seconds. Add the{" "}
          <span className="hl font-semibold">AIRPLAY ACCELERATOR</span> — the scripts, the
          campaign calendar, the follow-ups, and 4,812 bonus curator contacts.
        </p>

        <div className="mt-8 flex justify-center">
          <FlipClock seconds={299} />
        </div>

        <div className="mt-7 rounded-xl border-2 border-acid/50 bg-panel p-4 sm:mt-8 sm:p-6">
          <p className="font-display text-xl leading-tight sm:text-2xl">WHAT GETS ADDED TO YOUR ORDER RIGHT NOW:</p>
          <ul className="mt-5 space-y-3 text-[15px]">
            <Check><b>4,812 bonus curator contacts</b> — Spotify playlist curators, music blogs, college radio hosts, podcast bookers. <span className="text-white/50">($297 value)</span></Check>
            <Check><b>The 6-Week Airplay Campaign Calendar</b> — exactly who to email on which day, pre-release to add-date follow-up. <span className="text-white/50">($149 value)</span></Check>
            <Check><b>The "Local Artist" Angle Swipe File</b> — 11 subject lines with open rates attached. <span className="text-white/50">($97 value)</span></Check>
            <Check><b>Follow-Up Sequence That Isn't Annoying</b> — the 3-touch cadence that doubled replies. <span className="text-white/50">($79 value)</span></Check>
            <Check><b>One personal pitch review</b> — send your email, we'll rewrite it. Capped at 25/month. <span className="text-white/50">($200 value)</span></Check>
          </ul>

          <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
            <div>
              <p className="text-[12px] uppercase tracking-widest text-white/40">Total value</p>
              <p className="font-display text-3xl text-white/40 line-through decoration-blood decoration-2">$822</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] uppercase tracking-widest text-acid">One-time, on this page only</p>
              <p className="font-display text-5xl text-acid">$37</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAccept(37)}
            className="cta mt-6 w-full rounded-lg bg-acid px-4 py-4 font-display text-[1.1rem] uppercase leading-tight tracking-wide text-ink sm:px-5 sm:py-5 sm:text-2xl"
          >
            YES — ADD THE ACCELERATOR TO MY ORDER
            <span className="mt-1 block text-[11px] font-sans font-bold tracking-normal">
              One click. Card already on file. No re-entry.
            </span>
          </button>

          <button
            type="button"
            onClick={decline}
            className="mt-5 block w-full text-[12px] leading-relaxed text-white/65 underline underline-offset-4 hover:text-white"
          >
            No thanks — I'll figure out what to write on my own and hope the program director doesn't delete it
          </button>
        </div>

        <div className="mt-6">
          <TCard t={T_ACCELERATOR} />
        </div>

        <p className="mt-6 text-center text-[11px] text-white/30">
          This offer is not available in the members area, by email, or at this price ever again.
        </p>
      </div>
    </OtoShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OTO 2 — ADVANCED UPWORK PROPOSALS COURSE
═══════════════════════════════════════════════════════════════════════════ */

const PARTS = [
  {
    n: "PART 01",
    title: "Foundation & Profile Positioning",
    lessons: 7,
    value: "$450",
    blurb:
      "Before a single proposal goes out, your profile has to do the selling. Part 1 rebuilds it from scratch so clients land on you already convinced.",
    list: [
      "The 3-second headline formula that stops the scroll",
      "Portfolio framing: showing outcomes, not just work",
      "Rate anchoring on your profile to pre-qualify clients",
      "Niching down without shrinking your opportunity pool",
      "Keyword architecture to rank in Upwork search",
      "The 'proof block' every top-rated profile has",
      "Profile teardown: before & after real examples",
    ],
  },
  {
    n: "PART 02",
    title: "The 10X Proposal Framework",
    lessons: 9,
    value: "$700",
    blurb:
      "The core of the course. The P.A.I.D. method — Problem, Angle, Insight, Deliverable — tested across 600+ live proposals in every major freelance category.",
    list: [
      "Why 96% of proposals get deleted in under 4 seconds",
      "The P.A.I.D. framework explained end-to-end",
      "Opening lines that prove you read the brief",
      "The 'insight drop' that makes you the expert instantly",
      "Structuring the deliverable so pricing feels inevitable",
      "Length, formatting & scannability rules",
      "Attachments, loom videos & when they backfire",
      "10 annotated winning proposals (real, redacted)",
      "The 4-line swap system: 1 template, any job post",
    ],
  },
  {
    n: "PART 03",
    title: "Pricing, Negotiation & Closing",
    lessons: 7,
    value: "$500",
    blurb:
      "Getting the reply is half the job. Part 3 is about converting that reply into a signed contract at a rate you're not resentful about.",
    list: [
      "Reading budget signals in a job post",
      "Anchoring high without scaring the client",
      "The lowball response script (word for word)",
      "Scope creep: catching it before you sign",
      "The counter-offer sequence — 2.4× average uplift",
      "Discovery call structure that closes on the call",
      "When to walk away (and how to do it profitably)",
    ],
  },
  {
    n: "PART 04",
    title: "Reviews, Retainers & Scaling",
    lessons: 7,
    value: "$350",
    blurb:
      "One-off gigs are a hamster wheel. Part 4 turns every client into recurring revenue and pushes your profile into Upwork's Top-Rated tier.",
    list: [
      "The ethical review-stacking path to Top-Rated in 90 days",
      "Triggering Upwork's algorithm to surface your profile",
      "Converting a one-time client into a monthly retainer",
      "The upsell offer to make at project delivery",
      "Follow-up cadence for dormant clients",
      "Building a pipeline so you stop bidding entirely",
      "Moving clients off-platform legally & safely",
    ],
  },
];

const TOTAL_LESSONS = PARTS.reduce((n, p) => n + p.lessons, 0);

export function Upsell2({
  onAccept,
  onDecline,
}: {
  onAccept: (price: number) => void;
  onDecline: () => void;
}) {
  const [openModule, setOpenModule] = useState<number | null>(0);
  const decline = onDecline;

  return (
    <OtoShell kicker="One more thing — this offer disappears when you leave this page">
      <div>
        <p className="text-center text-[11px] font-black uppercase tracking-[0.28em] text-acid">
          Step 3 of 3 · Final upgrade available
        </p>
        <StepMeter current={3} total={3} />

        {/* unmistakable course banner */}
        <div className="mt-7 overflow-hidden rounded-xl border-2 border-acid bg-gradient-to-r from-acid/25 via-acid/10 to-transparent">
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="text-4xl" aria-hidden>🎓</span>
            <div>
              <p className="font-display text-xl leading-tight sm:text-2xl">
                ADVANCED UPWORK PROPOSALS
              </p>
              <p className="mt-0.5 font-mono text-[12px] text-acid">
                Tips to 10X Client Responses Fast — FULL COURSE
              </p>
            </div>
          </div>
        </div>

        {/* kicker badge */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-acid/40 bg-acid/10 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-acid">
            Full Course · $2,000 value
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
            4 Parts · {TOTAL_LESSONS} Lessons · Any Niche
          </span>
        </div>

        <h1 id="page-heading" tabIndex={-1} className="mt-4 text-center font-display text-[1.85rem] leading-[1.06] sm:text-6xl sm:leading-[0.95]">
          YOU GOT THE CONTACTS.{" "}
          <span className="text-acid">NOW GET THE CLIENTS.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-center font-serif text-[1.05rem] leading-[1.62] text-white/75 sm:mt-5 sm:text-lg">
          Radio airplay is your credibility. Your <b className="text-white">income</b> comes from
          clients — sync deals, scoring, beat licensing, podcast music, game audio, mixing,
          mastering. This is the complete{" "}
          <span className="hl font-semibold">4-part, {TOTAL_LESSONS}-lesson system</span> for
          10×-ing your Upwork response rate. Built on music freelance data, but the framework works
          in <b className="text-white">any niche you apply it to</b> — design, writing, video, dev.
        </p>

        {/* terminal-style "course loading" flavour */}
        <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f0b] font-mono text-[12px]">
          <div className="flex items-center gap-2 border-b border-white/10 bg-[#111411] px-4 py-2.5">
            <span aria-hidden className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span aria-hidden className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span aria-hidden className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 text-[11px] text-white/35 tracking-widest">upwork_course_index.txt</span>
          </div>
          <div className="px-4 py-3 text-green-400/60">
            <span className="text-white/25">$ </span>
            <span>tree ./advanced_upwork_proposals/ --depth 1</span>
          </div>
          <div className="border-t border-white/5 px-4 pb-4 space-y-1 text-[11px] text-white/50">
            {PARTS.map((p) => (
              <div key={p.n} className="flex gap-3">
                <span className="text-green-400/50 shrink-0">drwxr-xr-x</span>
                <span className="text-acid/70 shrink-0">{p.n.replace(" ", "_")}/</span>
                <span className="text-white/40 truncate">{p.title}</span>
                <span className="ml-auto shrink-0 text-white/25">{p.lessons} lessons</span>
              </div>
            ))}
            <div className="flex gap-3 mt-2 pt-2 border-t border-white/5">
              <span className="text-green-400/50 shrink-0">-rw-r--r--</span>
              <span className="text-white/30">
                4 parts · {TOTAL_LESSONS} lessons · lifetime access · any niche
              </span>
            </div>
          </div>
        </div>

        {/* part accordion */}
        <div className="mt-8 rounded-xl border-2 border-acid/40 bg-panel overflow-hidden">
          <div className="bg-acid/10 border-b border-acid/20 px-5 py-3 flex items-baseline justify-between gap-3">
            <p className="font-display text-xl uppercase">The Full Curriculum</p>
            <p className="font-mono text-[11px] text-acid/70">
              4 parts · {TOTAL_LESSONS} lessons
            </p>
          </div>
          {PARTS.map((p, i) => (
            <div key={p.n} className="border-b border-white/10 last:border-0">
              <button
                type="button"
                onClick={() => setOpenModule(openModule === i ? null : i)}
                aria-expanded={openModule === i}
                aria-controls={`module-panel-${i}`}
                id={`module-btn-${i}`}
                className="pressable flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-white/5"
              >
                <span className="font-mono text-[11px] text-acid/50 shrink-0 mt-1 tracking-widest">
                  {p.n}
                </span>
                <span className="flex-1">
                  <span className="block font-bold">{p.title}</span>
                  <span className="block text-[12px] text-white/40 mt-0.5">
                    {p.lessons} lessons · {openModule === i ? "▲ collapse" : "▼ see all lessons"}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] text-white/30 line-through mt-1">{p.value}</span>
              </button>
              {openModule === i && (
                <div id={`module-panel-${i}`} role="region" aria-labelledby={`module-btn-${i}`} className="px-5 pb-5 border-t border-white/5 pt-3">
                  <p className="text-[14px] leading-relaxed text-white/65">{p.blurb}</p>
                  <ol className="mt-3 space-y-1.5">
                    {p.list.map((l, li) => (
                      <li key={l} className="flex gap-3 text-[13px] text-white/60">
                        <span className="font-mono text-acid/50 shrink-0">
                          {String(li + 1).padStart(2, "0")}
                        </span>
                        <span>{l}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* value stack */}
        <div className="mt-8 rounded-xl border border-white/10 bg-panel p-6">
          <p className="font-display text-xl mb-4 uppercase">What This Is Actually Worth</p>
          <div className="space-y-2 text-[14px]">
            {PARTS.map((p) => (
              <div key={p.n} className="flex justify-between gap-4">
                <span className="text-white/60">
                  {p.n}: {p.title}{" "}
                  <span className="text-white/30">({p.lessons} lessons)</span>
                </span>
                <span className="text-white/35 line-through shrink-0">{p.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/35">Combined value</p>
              <p className="font-display text-3xl text-white/30 line-through decoration-blood decoration-2">$2,000</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest text-acid mb-1">Your price — today only</p>
              <p className="font-display text-5xl text-acid">$50</p>
            </div>
          </div>
          <p className="mt-3 text-center font-mono text-[11px] text-white/30">
            That's $1.67 per lesson · 97.5% off the standalone value
          </p>
        </div>

        {/* social proof */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {T_UPWORK.map((t) => (
            <TCard key={t.name} t={t} compact />
          ))}
        </div>

        {/* timer + CTA */}
        <div className="mt-8 flex justify-center">
          <FlipClock seconds={479} />
        </div>

        <button
          type="button"
          onClick={() => onAccept(50)}
          className="cta mt-6 w-full rounded-lg bg-acid px-5 py-5 font-display text-xl uppercase leading-tight tracking-wide text-ink sm:text-2xl"
        >
          YES — ADD THE FULL COURSE FOR $50
          <span className="mt-1 block text-[11px] font-sans font-bold tracking-normal">
            One click · card on file · instant access · 4 parts · {TOTAL_LESSONS} lessons · $2,000 value
          </span>
        </button>

        <button
          onClick={decline}
            className="mt-5 block w-full text-[12px] leading-relaxed text-white/45 underline underline-offset-4 hover:text-white/75"
          >
            No thanks — I'll keep applying to Upwork jobs with a generic proposal and wondering why nobody replies
        </button>

        <p className="mt-6 text-center text-[11px] text-white/25">
          This offer is not shown in the members area, via email, or at checkout. This page only.
        </p>
      </div>
    </OtoShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OTO 3 — 20,000 FONTS MEGA BUNDLE · THE ARCANE TYPE VAULT
═══════════════════════════════════════════════════════════════════════════ */

const FONT_CATS = [
  ["Blackletter & Occult", "1,840"],
  ["Display & Poster", "3,220"],
  ["Grunge & Distressed", "1,470"],
  ["Serif & Editorial", "2,690"],
  ["Sans & Geometric", "2,910"],
  ["Script & Signature", "2,180"],
  ["Monospace & Techno", "1,120"],
  ["Handwritten & Marker", "1,640"],
  ["Retro & Vintage", "1,930"],
  ["Symbols & Dingbats", "1,000"],
];

export function Upsell3({
  onAccept,
  onDecline,
}: {
  onAccept: (price: number) => void;
  onDecline: () => void;
}) {
  const decline = onDecline;

  return (
    <OtoShell kicker="Final offer — the type vault closes when you leave">
      <div>
        <p className="text-center text-[11px] font-black uppercase tracking-[0.28em] text-acid">
          Bonus unlock · Last page before your downloads
        </p>

        {/* banner */}
        <div className="mt-6 overflow-hidden rounded-xl border-2 border-acid bg-gradient-to-r from-acid/25 via-acid/10 to-transparent">
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="font-display text-4xl leading-none text-acid">Aa</span>
            <div>
              <p className="font-display text-xl leading-tight sm:text-2xl">
                20,000 FONTS MEGA BUNDLE (A–Z)
              </p>
              <p className="mt-0.5 font-mono text-[12px] text-acid">
                The Arcane Type Vault — Logos · Branding · Posters
              </p>
            </div>
          </div>
        </div>

        <h1 id="page-heading" tabIndex={-1} className="mt-7 text-center font-display text-4xl leading-[0.95] sm:text-6xl">
          YOUR MUSIC IS READY.<br />
          <span className="text-blood">YOUR ARTWORK ISN'T.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-center font-serif text-lg text-white/75">
          You're about to email 18,000+ program directors. The first thing most of them do is{" "}
          <b className="text-white">look at your cover art</b>. Amateur type is the fastest way to
          get filed under "bedroom project." Grab{" "}
          <span className="hl font-semibold">20,000 professional fonts</span> — one download,
          lifetime use, every cover, poster and merch drop you'll ever make.
        </p>

        {/* type specimen strip */}
        <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-black/60">
          <div className="border-b border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white/35">
            specimen preview — 10 of 20,000
          </div>
          <div className="divide-y divide-white/5">
            {[
              { t: "MIDNIGHT ROTATION", c: "font-display text-3xl tracking-tight" },
              { t: "Late Night Frequencies", c: "font-serif text-2xl italic" },
              { t: "AIRPLAY / VOL.01", c: "font-mono text-xl tracking-[0.3em]" },
              { t: "Static & Signal", c: "font-serif text-3xl font-bold" },
              { t: "THE LOCAL CIRCUIT", c: "font-display text-2xl tracking-[0.2em]" },
            ].map((s) => (
              <div key={s.t} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className={`${s.c} text-white/85 truncate`}>{s.t}</span>
                <span className="shrink-0 font-mono text-[10px] text-acid/50">.otf .ttf</span>
              </div>
            ))}
          </div>
        </div>

        {/* categories */}
        <div className="mt-8 rounded-xl border-2 border-acid/40 bg-panel overflow-hidden">
          <div className="flex items-baseline justify-between gap-3 border-b border-acid/20 bg-acid/10 px-5 py-3">
            <p className="font-display text-xl uppercase">What's In The Vault</p>
            <p className="font-mono text-[11px] text-acid/70">A–Z organized</p>
          </div>
          <div className="grid gap-x-6 gap-y-2 p-5 sm:grid-cols-2">
            {FONT_CATS.map(([cat, n]) => (
              <div key={cat} className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="flex items-center gap-2 text-white/70">
                  <span className="text-acid">✓</span> {cat}
                </span>
                <span className="font-mono text-[12px] text-white/35">{n}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 px-5 py-4 space-y-2 text-[14px]">
            <Check><b>Commercial license included</b> — use on covers, merch, client work, logos. No per-project fees.</Check>
            <Check><b>.OTF + .TTF for every face</b> — works in Photoshop, Illustrator, Figma, Canva, Procreate, Word.</Check>
            <Check><b>Sorted A–Z into labelled folders</b> — no 20,000-file dump. Find a face in under a minute.</Check>
          </div>
        </div>

        {/* value */}
        <div className="mt-8 rounded-xl border border-white/10 bg-panel p-6">
          <p className="mb-4 font-display text-xl uppercase">The Math On This One</p>
          <div className="space-y-2 text-[14px]">
            <div className="flex justify-between"><span className="text-white/60">Average single display font license</span><span className="text-white/35">$35</span></div>
            <div className="flex justify-between"><span className="text-white/60">Typical 5-font brand kit</span><span className="text-white/35">$175</span></div>
            <div className="flex justify-between"><span className="text-white/60">Annual foundry subscription</span><span className="text-white/35">$180–$400/yr</span></div>
            <div className="flex justify-between border-t border-white/10 pt-2"><span className="text-white/60">20,000 fonts at even $1 each</span><span className="text-white/35 line-through">$20,000</span></div>
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/35">Conservative value</p>
              <p className="font-display text-3xl text-white/30 line-through decoration-blood decoration-2">$1,200</p>
            </div>
            <div className="text-right">
              <p className="mb-1 text-[11px] uppercase tracking-widest text-acid">This page only</p>
              <p className="font-display text-5xl text-acid">$29</p>
            </div>
          </div>
          <p className="mt-3 text-center font-mono text-[11px] text-white/30">
            That's $0.00145 per font · you will never buy type again
          </p>
        </div>

        {/* social proof */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {T_FONTS.map((t) => <TCard key={t.name} t={t} compact />)}
        </div>

        <div className="mt-8 flex justify-center">
          <FlipClock seconds={359} />
        </div>

        <button
          type="button"
          onClick={() => onAccept(29)}
          className="cta mt-6 w-full rounded-lg bg-acid px-5 py-5 font-display text-xl uppercase leading-tight tracking-wide text-ink sm:text-2xl"
        >
          YES — ADD 20,000 FONTS FOR $29
          <span className="mt-1 block text-[11px] font-sans font-bold tracking-normal">
            One click · card on file · commercial license · lifetime access
          </span>
        </button>

        <button
          type="button"
          onClick={decline}
            className="mt-5 block w-full text-[12px] leading-relaxed text-white/65 underline underline-offset-4 hover:text-white"
          >
            No thanks — I'll keep making covers in the default font and hope nobody notices
        </button>

        <p className="mt-6 text-center text-[11px] text-white/25">
          Not available in the members area or at checkout. This page only.
        </p>
      </div>
    </OtoShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOWNSELL — AIRPLAY ACCELERATOR LITE
═══════════════════════════════════════════════════════════════════════════ */

export function Downsell({
  onAccept,
  onDecline,
}: {
  onAccept: (price: number) => void;
  onDecline: () => void;
}) {
  const decline = onDecline;

  return (
    <OtoShell kicker="Last call — a smaller version of the same offer">
      <div>
        <p className="text-center text-[11px] font-black uppercase tracking-[0.28em] text-blood-aa">
          Hold on. Was it the price?
        </p>
        <h1 id="page-heading" tabIndex={-1} className="mt-3 text-center font-display text-4xl leading-[0.95] sm:text-5xl">
          FINE. TAKE <span className="text-acid">$19 OFF</span> AND <br /> SPLIT IT IN THREE.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center font-serif text-lg text-white/75">
          I'd rather you have the scripts than have my $37. Here's the <b className="text-white">Lite</b>{" "}
          version — the swipe file, the calendar, and 1,900 of the curator contacts — for{" "}
          <span className="hl font-semibold">3 payments of $6</span>.
        </p>

        <div className="mt-7 flex justify-center">
          <FlipClock seconds={179} />
        </div>

        <div className="mt-7 rounded-xl border-2 border-acid/50 bg-panel p-4 sm:p-6">
          <ul className="space-y-3 text-[15px]">
            <Check>The 11 subject lines with real open rates</Check>
            <Check>9 pitch email templates (copy, paste, personalize)</Check>
            <Check>The 6-Week Airplay Campaign Calendar</Check>
            <Check>1,900 curator + blog contacts (of the 4,812)</Check>
            <li className="flex gap-3 text-white/35">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[12px]">✕</span>
              <span>Personal pitch review — not included at this price</span>
            </li>
          </ul>

          <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
            <p className="font-display text-2xl text-white/35 line-through decoration-blood">$37</p>
            <div className="text-right">
              <p className="font-display text-4xl text-acid">3 × $6</p>
              <p className="text-[12px] text-white/40">$18 total · no interest</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAccept(18)}
            className="cta mt-6 w-full rounded-lg bg-acid px-5 py-5 font-display text-xl uppercase tracking-wide text-ink sm:text-2xl"
          >
            OK — ADD THE LITE VERSION FOR $6 TODAY
          </button>
          <button
            type="button"
            onClick={decline}
            className="mt-5 block w-full text-[12px] text-white/65 underline underline-offset-4 hover:text-white"
          >
            No — I'm certain I want to send cold emails with no template and no plan
          </button>
        </div>
      </div>
    </OtoShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   THANK YOU
═══════════════════════════════════════════════════════════════════════════ */

export function ThankYou({
  total,
  hasContracts,
  hasAu,
  hasUpwork,
  // hasFonts,
  onRestart,
}: {
  total: number;
  hasContracts?: boolean;
  hasAu?: boolean;
  hasUpwork?: boolean;
  // hasFonts?: boolean;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const downloads: [string, string, string][] = [
    ["📁", "Radio Reach Vault — 18,000+ entries", "PDF + tables · 412 pages"],
    ["✉️", "Detailed contact information", "Organized by station, location, role, phone, and email"],
    ...(hasContracts ? [["📄", "The Indie Music Contract Kit", "6 Agreement Templates + Plain-English Usage Guide"] as [string, string, string]] : []),
    ...(hasAu ? [["🇦🇺", "Australian Radio Contact List", "Major national and regional AU contacts"] as [string, string, string]] : []),
    ...(hasUpwork ? [["🎓", "Advanced Upwork Proposals — Full Course", `4 parts · ${TOTAL_LESSONS} lessons · lifetime access`] as [string, string, string]] : []),
    // ...(hasFonts ? [["🔤", "20,000 Fonts Mega Bundle — Arcane Type Vault", "A–Z folders · .OTF + .TTF · commercial license"] as [string, string, string]] : []),
  ];

  return (
    <div className="min-h-screen bg-ink">
      <div className="bg-green-600 py-2 text-center text-[11px] font-black uppercase tracking-[0.2em]">
        ✅ Payment complete — your files are unlocked
      </div>
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-acid font-display text-3xl text-ink">
          ✓
        </div>
        <h1 id="page-heading" tabIndex={-1} className="mt-6 font-display text-4xl leading-tight sm:text-5xl">
          WELCOME TO THE VAULT
        </h1>
        <p className="mt-3 font-serif text-lg text-white/75">
          Order total <b className="text-acid">${total.toFixed(2)}</b>. Your receipt and download
          links are on their way. Open the file, filter to your city, and email{" "}
          <b className="text-white">20 people tonight</b> — momentum dies if you "start Monday."
        </p>

        <div className="mt-8 space-y-3 text-left">
          {downloads.map(([icon, title, sub]) => (
            <div
              key={title}
              className="flex items-center gap-4 rounded-lg border border-white/10 bg-panel p-4"
            >
              <span className="text-2xl">{icon}</span>
              <div className="flex-1">
                <p className="font-bold">{title}</p>
                <p className="text-[13px] text-white/50">{sub}</p>
              </div>
              <span className="rounded bg-acid px-3 py-1.5 text-[12px] font-black uppercase text-ink">
                Download
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-acid/40 bg-acid/5 p-6 text-left">
          <p className="font-display text-xl text-acid">ONE ASK BEFORE YOU GO</p>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">
            Use this like a human. Personalize every email. Reference a show, a segment, a song they
            actually played. The database opens the door — your manners keep it open for the next
            independent artist who buys this. 🫂
          </p>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-4 rounded-lg border border-acid px-4 py-2.5 text-[13px] font-bold uppercase tracking-wide text-acid hover:bg-acid hover:text-ink"
          >
            {copied ? "Link copied ✓" : "Copy link & send to a bandmate"}
          </button>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="mt-10 text-[12px] text-white/55 underline underline-offset-4 hover:text-white"
        >
          ↺ Replay the funnel from the top (demo)
        </button>

        <p className="mt-8 text-[11px] leading-relaxed text-white/25">
          Demo funnel · No real payment was processed.
        </p>
      </div>
    </div>
  );
}
