import { lazy, Suspense, useEffect, useState } from "react";
import {
  Check,
  Cross,
  ExitIntent,
  SectionLabel,
  Stars,
  StickyBar,
  TopNav,
} from "./ui";
import TerminalPreview from "./TerminalPreview";
import { isMomentumSequenceEnabled } from "../config/features";

// The Momentum + Ownership quiz is OFF by default (kill switch in
// index.html): a multi-step quiz costs taps between a cold ad click
// and the buy button. It stays lazy so it never loads while disabled.
const MomentumSequence = lazy(() => import("./MomentumSequence"));

import { TESTIMONIALS } from "./testimonials";

import {
  DebugPanel,
  EmotiveText,
  espLogConversion,
  initEsp,
  readEspFlag,
} from "../esp";

const FAQS = [
  [
    "What exactly am I buying?",
    "A downloadable radio contact database: 18,000+ station entries with program directors, music directors, and decision-maker contacts — organized by station, location, role, phone, and email in a 400+ page PDF plus city-sorted tables. One payment, instant download, yours forever.",
  ],
  [
    "Are these contacts scraped from Google?",
    "No. 10,372 of the emails are individually verified deliverable addresses tied to a real human — program directors, music directors, and station decision-makers. The remaining entries include station lines and city data. If it were scraped you'd be paying $0 and getting bounces.",
  ],
  [
    "How do I get it, and how fast?",
    "Instantly. The moment your payment clears, your private download links appear on screen and are emailed to you. Works on any device. No software, no subscription, no monthly fee that quietly renews.",
  ],
  [
    "Will this guarantee me airplay?",
    "The database gets you in the room. Your music and your pitch close it. This is built for targeted, relevant, human outreach — not spam. Be personal. Be respectful. That's what works.",
  ],
  [
    "Why is it only $20?",
    "Because enterprise data vendors sell to corporate marketing teams on annual contracts with a sales call attached. I'm an independent artist. I built this because I had to do the research myself and refuse to gatekeep it. $20 is the launch rate — it steps to $49 once launch ends.",
  ],
  [
    "What if it's not for me?",
    "You get 30 days. Email me, tell me it didn't help, and I'll refund you — and you keep the file. I'd rather have your respect than your $20.",
  ],
];

type Props = {
  onCta: () => void;
};

export default function SalesPage({ onCta }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [espDebug] = useState(() => readEspFlag().debug);

  // Start the Emotional State Proxy. Behind the feature flag this is
  // a no-op; cleanup fully detaches it when the funnel leaves this page.
  useEffect(() => initEsp(), []);

  // Every CTA in the page funnels through here, so each click can be
  // logged as a conversion event tagged with the mode the visitor
  // was in — the data we'll later use to see which states convert.
  const handleCta = (label = "cta") => {
    espLogConversion("cta_click", { label });
    onCta();
  };

  return (
    <div id="top" className="min-h-screen bg-ink pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))]">
      <ExitIntent
        onTake={() => handleCta("exit_intent")}
        title={<EmotiveText slot="exitTitle" />}
        body={<EmotiveText slot="exitBody" />}
      />
      <StickyBar
        onCta={() => handleCta("sticky")}
        label={<EmotiveText slot="stickyLabel" />}
      />

      {/* value bar — what the offer is, in one line */}
      <div className="bg-blood">
        <p className="mx-auto max-w-5xl px-3 py-2 text-center text-[10px] font-black uppercase leading-snug tracking-[0.1em] sm:px-4 sm:text-[11px] sm:tracking-[0.16em]">
          <EmotiveText slot="alertBar" />
        </p>
      </div>

      <TopNav onCta={() => handleCta("topnav")} />

      {/* HERO — what it is, who it's for, the price, the proof, the button.
          All of it inside the first mobile screen. */}
      <section className="relative isolate overflow-hidden">
        <img
          src="/images/studio-1280.jpg"
          srcSet="/images/studio-640.jpg 640w, /images/studio-1280.jpg 1280w"
          sizes="100vw"
          alt=""
          aria-hidden
          width={1280}
          height={853}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          onError={(e) => (e.currentTarget.style.display = "none")}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
        <div className="relative mx-auto max-w-4xl px-4 pt-5 pb-8 text-center sm:pt-10 sm:pb-14">
          <p className="mx-auto mb-3 inline-block max-w-[24rem] border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase leading-snug tracking-[0.12em] text-white/70 sm:mb-5 sm:max-w-none sm:text-[11px] sm:tracking-[0.2em]">
            <EmotiveText slot="heroEyebrow" />
          </p>

          <h1 className="font-display text-[1.85rem] leading-[1.06] sm:text-6xl sm:leading-[0.95] md:text-7xl">
            RADIO STATION CONTACTS <span className="text-blood">FOR MUSICIANS</span>
            <span className="mt-1.5 block text-[0.55em] tracking-wide text-white/85">"Who do I even send it to?"</span>
          </h1>
          <EmotiveText
            slot="heroSub"
            as="p"
            className="mx-auto mt-3 max-w-2xl font-serif text-[1.02rem] leading-[1.55] text-white/80 sm:mt-5 sm:text-2xl sm:leading-relaxed"
          />

          {/* CTA box — price, button, trust. Nothing else. */}
          <div
            data-esp-zone="pricing"
            className="mobile-solid mx-auto mt-5 max-w-md rounded-xl border-2 border-acid/50 bg-black/85 p-4 text-left backdrop-blur sm:mt-8 sm:bg-black/60 sm:p-5"
          >
            <div data-esp-zone="scarcity" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
                <EmotiveText slot="ctaLabel" />
              </p>
              <p className="tnum font-display text-lg leading-none sm:text-xl">
                <span className="mr-2 text-white/35 line-through">$49</span>
                <span className="text-acid">$20</span>
                <span className="ml-1.5 font-sans text-[11px] font-bold uppercase tracking-wider text-white/50">one-time</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCta("hero")}
              className="cta mt-3.5 min-h-14 w-full rounded-lg bg-acid px-4 py-4 font-display text-[1.15rem] uppercase leading-tight tracking-wide text-ink sm:mt-4 sm:px-5 sm:text-xl"
            >
              Get Instant Access — $20
              <span className="mt-0.5 block text-[11px] font-sans font-bold tracking-normal">
                Download starts in ~90 seconds
              </span>
            </button>
            <p className="mt-3 text-center text-[12px] text-white/60">
              <Stars /> <b className="text-white/80">4.9</b> from <b className="text-white/80">1,940+</b> artists
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
              <span>🔒 Stripe secure</span>
              <span>⚡ Instant download</span>
              <span>🛡 30-day refund</span>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-white/30">
              <EmotiveText slot="ctaTrust" />
            </p>
          </div>
        </div>
      </section>

      {/* 2 · SOCIAL PROOF — the first thing after the offer */}
      <section
        id="proof"
        data-esp-zone="proof"
        className="defer-render mx-auto max-w-5xl px-4 py-9 sm:py-16"
      >
        <SectionLabel>Receipts</SectionLabel>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <EmotiveText
            slot="proofHeadline"
            as="h2"
            className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight"
          />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-acid/30 bg-acid/10 px-3 py-1 text-[11px] font-bold text-acid">
            <Stars /> 4.9 · 1,940+ artists inside
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rounded-xl border border-white/10 bg-panel p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <Stars />
                {t.verified && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400/80">
                    <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-green-500 text-[8px] text-black">
                      ✓
                    </span>
                    {t.verified}
                  </span>
                )}
              </div>
              <blockquote className="mt-2.5 font-serif text-[15px] leading-[1.55] text-white/80 sm:mt-3 sm:text-[16px] sm:leading-relaxed">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-3 sm:mt-4 sm:pt-4">
                <img
                  src={t.photo}
                  alt=""
                  aria-hidden
                  width={44}
                  height={44}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 shrink-0 rounded-full bg-white/5 object-cover ring-2 ring-acid/40 sm:h-11 sm:w-11"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold">{t.name}</p>
                  <p className="truncate text-[12px] text-white/50">{t.role}</p>
                </div>
                <span className="rounded-full bg-acid/15 px-2.5 py-1 text-[10px] font-bold text-acid sm:px-3 sm:text-[11px]">
                  {t.stat}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 3 · PRODUCT PREVIEW — see exactly what you buy */}
      <section className="defer-render border-y border-white/10 bg-panel">
        <div className="mx-auto max-w-4xl px-4 py-9 sm:py-14">
          <SectionLabel>Product preview</SectionLabel>
          <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight">
            THIS IS THE FILE <span className="hl">YOU DOWNLOAD</span>
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60 sm:text-base">
            A live sample from the database — seven real entries out of 18,020. Names, roles, and
            working emails, sorted city by city.
          </p>
          <div className="mt-5 sm:mt-7">
            <TerminalPreview onCta={() => handleCta("terminal")} />
          </div>
        </div>
      </section>

      {/* 4 · BENEFITS — the gap, who it's for, and what changes */}
      <section className="defer-render mx-auto max-w-3xl px-4 py-9 sm:py-14">
        <SectionLabel>
          <EmotiveText slot="problemLabel" />
        </SectionLabel>
        <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight">
          THE GAP ISN'T TALENT.{" "}
          <EmotiveText slot="problemHeadline" className="text-blood" />
        </h2>
        <div className="mt-4 space-y-3.5 font-serif text-[1.02rem] leading-[1.6] text-white/75 sm:mt-6 sm:text-lg sm:leading-relaxed">
          <p>
            <EmotiveText slot="problemP1" />
          </p>
          <p>
            Meanwhile you're guessing at <code className="rounded bg-black/60 px-1.5 py-0.5 text-acid">info@</code>{" "}
            addresses at 2am — firing your life's work into inboxes nobody reads.
          </p>
          <p className="text-white/90">
            <EmotiveText slot="problemP3" />
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:mt-9 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-lg border border-blood/40 bg-blood/5 p-4 sm:p-5">
            <p className="mb-3 font-display text-lg text-blood sm:text-xl">WITHOUT THE VAULT</p>
            <ul className="space-y-2.5 text-[15px] leading-snug">
              <Cross>6+ months of manual research per campaign</Cross>
              <Cross>$29–$79/mo submission platforms that "forward" your track</Cross>
              <Cross>Generic info@ inboxes, zero names, zero replies</Cross>
              <Cross>Bouncing emails from lists nobody ever verified</Cross>
            </ul>
          </div>
          <div className="rounded-lg border border-acid/50 bg-acid/5 p-4 sm:p-5">
            <p className="mb-3 font-display text-lg text-acid sm:text-xl">WITH THE VAULT</p>
            <ul className="space-y-2.5 text-[15px] leading-snug">
              <Check>18,000+ entries, ready in the next 90 seconds</Check>
              <Check>Named program &amp; music directors — the people who decide</Check>
              <Check>Sorted city by city, so you start where you're strongest</Check>
              <Check>Every email starts with "Hi [name]", not "Dear Sir/Madam"</Check>
            </ul>
          </div>
        </div>

        {/* who it's for — self-identification in four checks */}
        <div className="mt-8 rounded-xl border border-white/10 bg-panel p-4 sm:mt-10 sm:p-6">
          <h3 className="font-display text-xl sm:text-2xl">THIS IS FOR YOU IF…</h3>
          <ul className="mt-3.5 grid gap-2.5 text-[15px] leading-snug sm:mt-4 sm:grid-cols-2 sm:text-[16px]">
            <Check>You're an independent musician with a release to pitch</Check>
            <Check>You're a podcaster chasing syndication or features</Check>
            <Check>You're sick of monthly platforms that deliver nothing</Check>
            <Check>You want to start outreach today, not in six months</Check>
          </ul>
          <p className="mt-4 border-l-2 border-blood pl-3.5 text-[13px] leading-relaxed text-white/55 sm:mt-5 sm:text-[14px]">
            <b className="text-white">Not for you if</b> you plan to blast 18,000 identical emails.
            That's spam and it doesn't work. Targeted. Relevant. Human. That's the deal.
          </p>
        </div>
      </section>

      {/* MOMENTUM + OWNERSHIP — runtime feature flagged, off by default */}
      {isMomentumSequenceEnabled() && (
        <Suspense
          fallback={
            <div className="min-h-[680px] border-y border-white/10 bg-[#0b0b0e]" aria-hidden="true" />
          }
        >
          <MomentumSequence onCta={() => handleCta("momentum")} />
        </Suspense>
      )}

      {/* 5 · MECHANISM — how artists actually use it */}
      <section className="defer-render border-y border-white/10 bg-panel">
        <div className="mx-auto max-w-4xl px-4 py-9 sm:py-14">
          <SectionLabel>The mechanism</SectionLabel>
          <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight">
            HOW TO <span className="hl">SUBMIT MUSIC TO RADIO STATIONS</span> CITY BY CITY
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60 sm:mt-4 sm:text-base">
            Major-market stations drown in label submissions. Local stations actively look for
            local talent. The city-by-city structure turns a cold list into a warm ladder:
          </p>
          <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
            {[
              ["01", "START LOCAL", "Pitch your hometown stations first. You're not a stranger — you're the local act. Warmest leads on earth."],
              ["02", "PITCH YOUR ROUTE", "Email every station in a tour city 3 weeks before the date. Spins + interviews + ticket sales, stacked."],
              ["03", "STACK CREDITS", "Regional airplay is proof. Proof opens bigger markets. Bigger markets open doors labels pretend are locked."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-lg border border-white/10 bg-ink p-4 sm:p-5">
                <span className="font-display text-3xl text-acid/30 sm:text-4xl">{n}</span>
                <p className="mt-1.5 font-display text-lg sm:mt-2 sm:text-xl">{t}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-white/60">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 · WHAT'S INCLUDED — the complete stack */}
      <section id="inside" className="defer-render mx-auto max-w-3xl px-4 py-9 sm:py-16">
        <SectionLabel>Everything you get today</SectionLabel>
        <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight">
          THE RADIO REACH VAULT
          <span className="mt-2 block text-[0.55em] text-white/60">
            RADIO CONTACT LIST FOR INDEPENDENT ARTISTS
          </span>
        </h2>
        <div
          data-esp-zone="pricing"
          className="mt-6 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-panel sm:mt-8"
        >
          {[
            ["18,000+ radio station entries", "Program directors, music directors, decision-makers.", "$297"],
            ["10,372 verified deliverable emails", "Checked one by one — real people, not info@ inboxes.", "$149"],
            ["400+ page organized document", "Direct access to the gatekeepers, in one file.", "$97"],
            ["City-by-city organization", "Start local, expand along your tour route.", "$79"],
            ["Lifetime file access", "No subscription. No renewal. No monthly bleed.", "$120"],
          ].map(([t, d, v]) => (
            <div key={t} className="flex items-start gap-3 p-3.5 sm:gap-4 sm:p-4">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-acid text-[13px] font-black text-ink">
                ✓
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-snug">{t}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-white/55 sm:text-[14px]">{d}</p>
              </div>
              <span className="shrink-0 font-display text-base text-white/45 line-through decoration-blood sm:text-lg">{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 bg-acid/10 p-3.5 sm:p-4">
            <span className="font-display text-base uppercase leading-tight sm:text-lg">Total real value</span>
            <span className="font-display text-xl text-white/50 line-through decoration-blood decoration-2 sm:text-2xl">$742</span>
          </div>
          <div className="flex items-center justify-between gap-3 bg-acid p-3.5 text-ink sm:p-4">
            <span className="font-display text-base uppercase leading-tight sm:text-lg">Your price right now</span>
            <span className="font-display text-3xl">$20</span>
          </div>
        </div>

        <p className="mt-4 rounded-lg border border-white/10 bg-black/40 px-3.5 py-3 text-center text-[12px] leading-relaxed text-white/55 sm:text-[13px]">
          Optional at checkout: <b className="text-white/80">Indie Contract Kit</b> ($9, reg. $25) and{" "}
          <b className="text-white/80">AU Radio List</b> ($12, reg. $29). Uncheck anything you don't want —
          the Vault alone is everything above.
        </p>

        <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-4 text-[15px] leading-relaxed text-white/70 sm:p-5">
          <EmotiveText slot="mathBox" />
        </div>

        <button
          type="button"
          onClick={() => handleCta("stack")}
          className="cta mt-6 w-full rounded-lg bg-acid px-5 py-5 font-display text-xl uppercase tracking-wide text-ink sm:text-2xl"
        >
          Claim The Radio Reach Vault For $20 →
        </button>
        <p className="mt-2 text-center text-[12px] text-white/40">
          <EmotiveText slot="stackNote" />
        </p>
      </section>

      {/* 7 · FAQ — objections answered */}
      <section id="faq" className="defer-render mx-auto max-w-3xl px-4 pb-9 sm:pb-16">
        <SectionLabel>Objections, handled</SectionLabel>
        <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-4xl">QUESTIONS YOU'RE ABOUT TO ASK</h2>
        <div className="mt-5 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-panel sm:mt-6">
          {FAQS.map(([q, a], i) => {
            const isOpen = openFaq === i;
            return (
              <div key={q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-btn-${i}`}
                    className="pressable flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-white/5 sm:gap-4 sm:p-5"
                  >
                    <span className="font-bold leading-snug">{q}</span>
                    <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center font-display text-xl leading-none text-acid">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-btn-${i}`}
                  hidden={!isOpen}
                >
                  <p className="px-4 pb-4 text-[14px] leading-[1.65] text-white/65 sm:px-5 sm:pb-5 sm:text-[15px] sm:leading-relaxed">{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8 · RISK REDUCTION — the guarantee */}
      <section className="defer-render mx-auto max-w-3xl px-4 pb-10 sm:pb-16" data-esp-zone="safety">
        <div className="rounded-2xl border-2 border-acid/40 bg-gradient-to-b from-acid/10 to-transparent p-5 text-center sm:p-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-acid font-display text-xl text-acid sm:h-20 sm:w-20 sm:text-2xl">
            30
          </div>
          <h2 className="mt-4 font-display text-[1.7rem] leading-[1.1] sm:text-4xl">THE "I'LL EAT THE COST" GUARANTEE</h2>
          <p className="mt-3 font-serif text-[1.02rem] leading-[1.6] text-white/75 sm:text-lg">
            <EmotiveText slot="guaranteePara" />
          </p>
        </div>
      </section>

      {/* 9 · FINAL CTA — one decision, one button */}
      <section
        data-esp-zone="cta"
        className="defer-render border-t border-white/10 bg-gradient-to-b from-blood/20 to-ink"
      >
        <div className="mx-auto max-w-3xl px-4 py-11 text-center sm:py-16">
          <h2 className="font-display text-[2rem] leading-[1.05] sm:text-6xl sm:leading-[0.95]">
            GET THE CONTACTS. <span className="text-acid">START TONIGHT.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-serif text-[1.02rem] leading-[1.6] text-white/75 sm:text-lg">
            Pay $20 once — less than a streaming subscription. Open the file in 90 seconds.
            Email 20 real music directors in your city tonight. Wake up to replies.
          </p>
          <button
            type="button"
            onClick={() => handleCta("final")}
            className="cta mt-6 w-full rounded-lg bg-acid px-4 py-4 font-display text-[1.25rem] uppercase leading-tight tracking-wide text-ink sm:mt-8 sm:px-6 sm:py-5 sm:text-3xl"
          >
            Give Me Instant Access — $20
          </button>
          <p className="mt-3 text-[11px] leading-snug text-white/40 sm:text-[12px]">
            Secure checkout · Instant download · 30-day refund · No subscription, ever
          </p>
        </div>
      </section>

      {/* FREE GUIDES — for visitors not ready yet, tucked after the decision point */}
      <section className="defer-render mx-auto max-w-4xl px-4 pb-10 sm:pb-12">
        <details className="group overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-6 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-acid sm:text-xs sm:tracking-[0.18em]">
                Free radio promotion guides
              </span>
              <span className="mt-0.5 block font-display text-lg leading-tight sm:text-2xl">
                DO THE RESEARCH BEFORE YOU HIT SEND
              </span>
            </span>
            <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center font-display text-xl text-acid transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="border-t border-white/10 px-4 pb-4 pt-3.5 sm:px-6 sm:pb-6">
            <p className="max-w-2xl text-[13px] leading-relaxed text-white/60 sm:text-[14px]">
              Not ready for the Vault yet? Start with the field guides: how to find stations that
              accept independent music, approach college radio, and build a targeted campaign
              without spraying spam.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <a
                href="/resources/college-radio-submissions/"
                className="min-h-[44px] rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-acid/50 hover:bg-white/[0.06]"
              >
                <strong className="block text-white">College Radio Submissions</strong>
                <span className="mt-1 block text-sm text-white/55">
                  Find the right station contacts and pitch college radio.
                </span>
              </a>
              <a
                href="/resources/radio-stations-accepting-music/"
                className="min-h-[44px] rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-acid/50 hover:bg-white/[0.06]"
              >
                <strong className="block text-white">Stations Accepting Music</strong>
                <span className="mt-1 block text-sm text-white/55">
                  Research stations, submission contacts, and programming fit.
                </span>
              </a>
              <a
                href="/resources/radio-promotion-independent-artists/"
                className="min-h-[44px] rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-acid/50 hover:bg-white/[0.06]"
              >
                <strong className="block text-white">Independent Radio Promotion</strong>
                <span className="mt-1 block text-sm text-white/55">
                  Build a focused outreach campaign instead of a giant email blast.
                </span>
              </a>
            </div>
          </div>
        </details>
      </section>

      {/* FTC DISCLAIMER */}
      <section className="defer-render border-t border-white/10 bg-black/60 px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-panel p-4 text-[11px] leading-relaxed text-white/40 sm:p-6 sm:text-[12px]">
          <p className="mb-2 font-bold uppercase tracking-widest text-white/60">
            FTC Disclaimer &amp; Legal Notice
          </p>
          <p className="mb-3">
            <b className="text-white/55">Results are not guaranteed or typical.</b> The testimonials, case
            studies, and examples shown on this page are individual experiences of real customers. They are
            not intended to represent or guarantee that anyone will achieve the same or similar results.
            Individual outcomes will vary based on your music, your pitch quality, your genre, your target
            market, and many other factors entirely outside our control.
          </p>
          <p className="mb-3">
            <b className="text-white/55">Contact data accuracy &amp; changes over time.</b> This database
            was compiled and verified at a point in time. Radio station contacts, program directors, music
            directors, and email addresses change regularly due to staff turnover, station ownership
            changes, format shifts, and station closures. We cannot guarantee that every contact or email
            in this database is currently accurate, active, or deliverable at the time of your purchase or
            use. You are purchasing a research resource, not a live-updated service. We strongly recommend
            verifying contacts before outreach and using the data as a starting point, not a guaranteed
            deliverable list.
          </p>
          <p className="mb-3">
            <b className="text-white/55">No income or airplay guarantee.</b> Purchasing this product does
            not guarantee radio airplay, interviews, playlist placements, increased streams, ticket sales,
            record deals, or income of any kind. Any reference to earning potential or airplay outcomes is
            illustrative only.
          </p>
          <p>
            <b className="text-white/55">Spam &amp; CAN-SPAM compliance.</b> This database is intended
            solely for personal, targeted, relevant outreach. You are solely responsible for ensuring your
            use of this data complies with the CAN-SPAM Act, GDPR, CASL, and any other applicable laws in
            your jurisdiction. Mass automated emailing is expressly prohibited.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-[11px] leading-relaxed text-white/30">
        <p className="mx-auto max-w-2xl">
          This product is a contact database intended for targeted, relevant, human outreach.
          Do not use this data for automated spam.
        </p>
        <p className="mt-3">© {new Date().getFullYear()} Radio Reach Vault. All rights reserved.</p>
      </footer>

      {/* Dev-only overlay — visible only with ?esp=debug */}
      {espDebug && <DebugPanel />}
    </div>
  );
}
