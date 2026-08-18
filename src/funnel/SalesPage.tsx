import { lazy, Suspense, useEffect, useState } from "react";
import {
  Check,
  Cross,
  ExitIntent,
  FlipClock,
  SectionLabel,
  Stars,
  StickyBar,
  Ticker,
  TopNav,
} from "./ui";
import TerminalPreview from "./TerminalPreview";
import { isMomentumSequenceEnabled } from "../config/features";

// Keep the substantial below-the-fold interaction out of the initial mobile
// bundle so it never competes with the hero for main-thread time.
const MomentumSequence = lazy(() => import("./MomentumSequence"));

import { TESTIMONIALS } from "./testimonials";
import { LuckyWheelButton } from "./LuckyWheel";
import {
  formatRemainingMs,
  getLuckyCouponRemainingMs,
  type LuckyCoupon,
} from "../lib/luckyCoupon";

import {
  DebugPanel,
  EmotiveText,
  espLogConversion,
  initEsp,
  readEspFlag,
} from "../esp";

const FAQS = [
  [
    "How do I submit music to radio stations?",
    "Start by finding stations that actually fit your genre, location, or audience. Identify the music director, program director, DJ, or submission contact when possible, then send a short personalized pitch with a streaming link and the information the station requests. RadioReach is designed to make the contact-research part faster so you can focus on relevant, human outreach instead of sending the same pitch everywhere.",
  ],
  [
    "Are these radio station contacts scraped from Google?",
    "No. 10,372 of the emails are individually verified deliverable addresses tied to a real human — program directors, music directors, and station decision-makers. The remaining entries include station lines and city data. If it were scraped you'd be paying $0 and getting bounces.",
  ],
  [
    "What format is the radio station contact list delivered in?",
    "Instant download: a 400+ page organized PDF plus the city-sorted contact tables. Works on any device. No software, no subscription, no monthly fee that quietly renews.",
  ],
  [
    "Will contacting radio stations guarantee airplay?",
    "The database gets you in the room. Your music and your pitch close it. This is meant for targeted, relevant, human outreach — not spam. Be personal. Be respectful. That's what works.",
  ],
  [
    "Why is the RadioReach radio contact list only $20?",
    "Because enterprise data vendors sell to corporate marketing teams on annual contracts with a sales call attached. I'm an independent artist. I built this because I had to do the research myself and refuse to gatekeep it. $20 is the launch rate — it goes to $49 once the founder slots are gone.",
  ],
  [
    "Does RadioReach have a refund policy?",
    "You get 30 days. Email me, tell me it didn't help, and I'll refund you. I'd rather have your respect than your $20.",
  ],
];

type Props = {
  onCta: () => void;
  luckyCoupon?: LuckyCoupon | null;
  onOpenWheel?: () => void;
  onClaimWheel?: () => void;
};

export default function SalesPage({ onCta, luckyCoupon, onOpenWheel, onClaimWheel }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [espDebug] = useState(() => readEspFlag().debug);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!luckyCoupon) return;
    const t = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [luckyCoupon]);

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

  const hasWinningCoupon =
    !!luckyCoupon && getLuckyCouponRemainingMs(luckyCoupon) > 0;
  const remainingStr = luckyCoupon ? formatRemainingMs(Math.max(0, luckyCoupon.expiresAt - nowMs)) : "";

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

      {/* lucky winner top banner — founder bundle */}
      {hasWinningCoupon && luckyCoupon ? (
        <div className="bg-gradient-to-r from-acid via-yellow-300 to-[#7c5cff] px-3 py-2 text-center">
          <p className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-ink sm:gap-3 sm:text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[10px] tracking-[0.16em] text-acid">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              JACKPOT UNLOCKED
            </span>
            <span>
              <span className="font-mono">{luckyCoupon.code}</span> • Founder Bundle{" "}
              <span className="line-through opacity-60">$54</span> → $21
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-1 font-mono text-acid">
              ⏳ {remainingStr}
            </span>
            <button
              type="button"
              onClick={onClaimWheel}
              className="rounded-full bg-ink px-3 py-1 text-[11px] font-black tracking-widest text-white hover:bg-black"
            >
              Claim at checkout →
            </button>
          </p>
        </div>
      ) : null}

      <TopNav onCta={() => handleCta("topnav")} />
      <Ticker />

      {/* HERO */}
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
        <div className="relative mx-auto max-w-4xl px-4 pt-6 pb-10 text-center sm:pt-10 sm:pb-14">
          <p className="mx-auto mb-4 inline-block max-w-[22rem] border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase leading-snug tracking-[0.12em] text-white/70 sm:mb-5 sm:max-w-none sm:text-[11px] sm:tracking-[0.2em]">
            <EmotiveText slot="heroEyebrow" />
          </p>

          <h1 className="font-display text-[1.85rem] leading-[1.06] sm:text-6xl sm:leading-[0.95] md:text-7xl">
            RADIO STATION CONTACTS <span className="text-blood">FOR MUSICIANS</span>
            <span className="mt-2 block text-[0.58em] tracking-wide">"WHO DO I EVEN SEND IT TO?"</span>
          </h1>
          <EmotiveText
            slot="heroSub"
            as="p"
            className="mx-auto mt-4 max-w-2xl font-serif text-[1.05rem] leading-[1.6] text-white/80 sm:mt-5 sm:text-2xl sm:leading-relaxed"
          />

          {/* CTA box */}
          <div
            data-esp-zone="pricing"
            className="mobile-solid mx-auto mt-6 max-w-md rounded-xl border-2 border-acid/50 bg-black/85 p-4 text-left backdrop-blur sm:mt-8 sm:bg-black/60 sm:p-5"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blood">
              <EmotiveText slot="ctaLabel" />
            </p>
            <div data-esp-zone="scarcity" className="mt-2 flex justify-center">
              <FlipClock seconds={897} />
            </div>
            <button
              type="button"
              onClick={() => handleCta("hero")}
              className="cta mt-5 min-h-14 w-full rounded-lg bg-acid px-4 py-4 font-display text-[1.15rem] uppercase leading-tight tracking-wide text-ink sm:px-5 sm:text-xl"
            >
              Yes — Give Me The Contacts
              <span className="mt-0.5 block text-[11px] font-sans font-bold tracking-normal">
                Instant download · <span className="line-through opacity-60">$49</span> $20 today
              </span>
            </button>
            <div className="mt-3 flex flex-col items-center gap-1.5 text-center">
              <p className="text-[12px] text-white/55">
                <Stars /> 4.9 from <b className="text-white/75">1,940+</b> artists
              </p>
              <p className="text-[11px] text-white/50">
                <EmotiveText slot="ctaTrust" />
              </p>
            </div>
          </div>

          {!hasWinningCoupon && (
            <div className="mt-5 flex flex-col items-center gap-2">
              <LuckyWheelButton onClick={() => onOpenWheel?.()} />
              <p className="max-w-[32ch] text-center text-[11px] leading-snug text-white/40">
                Free spin · no email · unlock the founder bundle
              </p>
            </div>
          )}

          {/* Terminal preview */}
          <div className="mt-8 w-full sm:mt-10">
            <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-white/60 sm:text-[11px] sm:tracking-[0.2em]">
              ↓ live sample — 7 of 18,000+ entries
            </p>
            <TerminalPreview onCta={() => handleCta("terminal")} />
          </div>
        </div>
      </section>

      {/* THE PROBLEM — agitation */}
      <section className="defer-render border-y border-white/10 bg-panel">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <SectionLabel>
            <EmotiveText slot="problemLabel" />
          </SectionLabel>
          <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight">
            THE GAP ISN'T TALENT.{" "}
            <EmotiveText slot="problemHeadline" className="text-blood" />
          </h2>
          <div className="mt-5 space-y-4 font-serif text-[1.05rem] leading-[1.65] text-white/75 sm:mt-6 sm:text-lg sm:leading-relaxed">
            <p>
              <EmotiveText slot="problemP1" />
            </p>
            <p>
              Meanwhile you're on page 6 of Google at 2am, copying station names into a spreadsheet,
              guessing at email formats, firing your life's work into <code className="rounded bg-black/60 px-1.5 py-0.5 text-acid">info@</code>{" "}
              inboxes that a 19-year-old intern clears every Friday without opening.
            </p>
            <p className="text-white/90">
              <EmotiveText slot="problemP3" />
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:mt-9 sm:grid-cols-2 sm:gap-4">
            <div className="rounded-lg border border-blood/40 bg-blood/5 p-4 sm:p-5">
              <p className="mb-3 font-display text-lg text-blood sm:text-xl">WITHOUT THE VAULT</p>
              <ul className="space-y-2.5 text-[15px] leading-snug">
                <Cross>6+ months of manual research per campaign</Cross>
                <Cross>$29–$79/mo submission platforms that "forward" your track</Cross>
                <Cross>Generic info@ inboxes, zero names, zero replies</Cross>
                <Cross>Bouncing emails from lists nobody ever verified</Cross>
                <Cross>Watching your release cycle die in 3 weeks</Cross>
              </ul>
            </div>
            <div className="rounded-lg border border-acid/50 bg-acid/5 p-4 sm:p-5">
              <p className="mb-3 font-display text-lg text-acid sm:text-xl">WITH THE VAULT</p>
              <ul className="space-y-2.5 text-[15px] leading-snug">
                <Check>18,000+ entries, ready in the next 90 seconds</Check>
                <Check>Organized by station, location, role, phone, and email</Check>
                <Check>Program &amp; music directors — the people who decide</Check>
                <Check>Sorted city by city so you start where you're strongest</Check>
                <Check>Named decision-makers, so your email starts with "Hi [name]"</Check>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MOMENTUM + OWNERSHIP — runtime feature flagged */}
      {isMomentumSequenceEnabled() && (
        <Suspense
          fallback={
            <div className="min-h-[680px] border-y border-white/10 bg-[#0b0b0e]" aria-hidden="true" />
          }
        >
          <MomentumSequence onCta={() => handleCta("momentum")} />
        </Suspense>
      )}

      {/* MECHANISM */}
      <section className="defer-render mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <SectionLabel>The mechanism</SectionLabel>
        <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight">
          HOW TO <span className="hl">SUBMIT MUSIC TO RADIO STATIONS</span> CITY BY CITY
        </h2>
        <p className="mt-4 max-w-2xl font-serif text-[1.05rem] leading-[1.65] text-white/70 sm:text-lg">
          Major-market stations are drowning in label submissions. Local stations are actively looking for
          local talent to champion. Sorting the database by city turns a cold list into a warm ladder:
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["01", "START LOCAL", "Pitch your hometown stations first. You're not a stranger — you're the local act. Warmest leads on earth."],
            ["02", "PITCH YOUR ROUTE", "Email every station in a tour city 3 weeks before the date. Spins + interviews + ticket sales, stacked."],
            ["03", "STACK CREDITS", "Regional airplay is proof. Proof opens bigger markets. Bigger markets open doors labels pretend are locked."],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-lg border border-white/10 bg-panel p-4 sm:p-5">
              <span className="font-display text-3xl text-acid/30 sm:text-4xl">{n}</span>
              <p className="mt-1.5 font-display text-lg sm:mt-2 sm:text-xl">{t}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT'S INSIDE / STACK */}
      <section id="inside" className="defer-render border-y border-white/10 bg-panel">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
          <SectionLabel>Everything you get today</SectionLabel>
          <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight">
            THE RADIO REACH VAULT
            <span className="mt-2 block text-[0.55em] text-white/60">
              RADIO CONTACT LIST FOR INDEPENDENT ARTISTS
            </span>
          </h2>
          <div
            data-esp-zone="pricing"
            className="mt-8 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/40"
          >
            {[
              ["18,000+ radio station entries", "Program directors, music directors, decision-makers.", "$297"],
              ["Detailed contact information", "Organized by station, location, role, phone, and email.", "$149"],
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

          {/* Founder bundle teaser — pre-selected upsells */}
          <div className={`mt-6 rounded-xl border-2 p-4 sm:p-5 ${hasWinningCoupon ? "border-acid bg-acid/10" : "border-white/10 bg-gradient-to-br from-[#1a1a22] to-black/40"}`}>
            <div className="flex items-start gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg ${hasWinningCoupon ? "bg-acid text-ink" : "bg-gradient-to-br from-[#ff3b82] to-[#7c5cff] text-white"}`}>
                {hasWinningCoupon ? "✓" : "🎁"}
              </span>
              <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-acid">
                  {hasWinningCoupon ? "Jackpot unlocked" : "Bonus — spin to unlock founder price"}
                </p>
                <p className="mt-1 font-display text-lg leading-none sm:text-xl">FOUNDER'S BUNDLE — BOTH ADD-ONS</p>
                <div className="mt-2 grid gap-2">
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <span className="text-[13px] font-bold text-white">📄 Indie Contract Kit <span className="font-normal text-white/50">— 6 templates + guide</span></span>
                    <span className="text-right"><span className="block text-[11px] line-through text-white/30">$25</span><span className="block font-display text-sm leading-none text-acid">$9</span></span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <span className="text-[13px] font-bold text-white">🇦🇺 AU Radio List <span className="font-normal text-white/50">— 2,847 contacts</span></span>
                    <span className="text-right"><span className="block text-[11px] line-through text-white/30">$29</span><span className="block font-display text-sm leading-none text-acid">$12</span></span>
                  </div>
                </div>
                <p className="mt-2 text-[13px] leading-snug text-white/60">
                  Normally <span className="line-through">$54</span> together —{" "}
                  {hasWinningCoupon ? (
                    <>
                      <b className="text-acid">yours for $21 (save $33)</b> with code <b className="font-mono text-white">{luckyCoupon.code}</b> • waiting at checkout
                    </>
                  ) : (
                    <>
                      <b className="text-white">spin to unlock both add-ons</b> at the founder price
                    </>
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {hasWinningCoupon ? (
                    <button
                      type="button"
                      onClick={onClaimWheel}
                      className="cta rounded-full bg-acid px-4 py-2 text-xs font-black uppercase tracking-widest text-ink"
                    >
                      Go to checkout — $21 bundle →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenWheel?.()}
                      className="cta rounded-full bg-gradient-to-r from-[#ff3b82] via-[#7c5cff] to-[#00d4ff] px-4 py-2 text-xs font-black uppercase tracking-widest text-white"
                    >
                      🎡 Spin the wheel — free
                    </button>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50">
                    {hasWinningCoupon ? `⏳ ${remainingStr} left` : "Free spin"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-black/40 p-5 text-[15px] leading-relaxed text-white/70">
            <EmotiveText slot="mathBox" />
          </div>

          <button
            type="button"
            onClick={() => handleCta("stack")}
            className="cta mt-7 w-full rounded-lg bg-acid px-5 py-5 font-display text-xl uppercase tracking-wide text-ink sm:text-2xl"
          >
            Claim The Radio Reach Vault For $20 →
          </button>
          <p className="mt-2 text-center text-[12px] text-white/40">
            <EmotiveText slot="stackNote" />
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        id="proof"
        data-esp-zone="proof"
        className="defer-render mx-auto max-w-5xl px-4 py-10 sm:py-16"
      >
        <SectionLabel>Receipts</SectionLabel>
        <EmotiveText
          slot="proofHeadline"
          as="h2"
          className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight"
        />
        <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
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
              <blockquote className="mt-3 font-serif text-[15px] leading-[1.6] text-white/80 sm:text-[16px] sm:leading-relaxed">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-3 sm:pt-4">
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

      {/* WHO IT'S FOR */}
      <section className="defer-render border-y border-white/10 bg-panel">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <SectionLabel>Is this you?</SectionLabel>
          <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-4xl">THIS IS FOR YOU IF…</h2>
          <ul className="mt-5 grid gap-3 text-[15px] leading-snug sm:mt-6 sm:grid-cols-2 sm:text-[16px]">
            <Check>You're an independent musician with a release to pitch</Check>
            <Check>You're a podcaster chasing syndication or features</Check>
            <Check>You're sick of monthly platforms that deliver nothing</Check>
            <Check>You want to start outreach today, not in six months</Check>
          </ul>
          <p className="mt-8 border-l-2 border-blood pl-4 text-[15px] text-white/55">
            <b className="text-white">This is NOT for you if</b> you plan to blast 18,000 identical emails.
            That's spam, it burns the wells for everyone, and it won't work. Targeted. Relevant. Human.
            Personal. Respectful. That's the deal.
          </p>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="defer-render mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div
          data-esp-zone="safety"
          className="rounded-2xl border-2 border-acid/40 bg-gradient-to-b from-acid/10 to-transparent p-5 text-center sm:p-8"
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-acid font-display text-xl text-acid sm:h-20 sm:w-20 sm:text-2xl">
            30
          </div>
          <h2 className="mt-4 font-display text-[1.7rem] leading-[1.1] sm:text-4xl">THE "I'LL EAT THE COST" GUARANTEE</h2>
          <p className="mt-3 font-serif text-[1.05rem] leading-[1.65] text-white/75 sm:text-lg">
            <EmotiveText slot="guaranteePara" />
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="defer-render mx-auto max-w-3xl px-4 pb-10 sm:pb-16">
        {/* SEO / RESOURCE CLUSTER */}
        <section className="mx-auto max-w-4xl py-8 sm:py-12">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-acid sm:text-xs sm:tracking-[0.18em]">
              Free Radio Promotion Guides
            </p>

            <h2 className="mt-3 font-display text-[1.55rem] leading-[1.1] sm:text-4xl sm:leading-tight">
              DO THE RESEARCH BEFORE YOU HIT SEND
            </h2>

            <p className="mt-3 max-w-2xl font-serif text-[0.98rem] leading-[1.62] text-white/70 sm:text-base sm:leading-relaxed">
              Not ready for the Vault yet? Start with the field guides: how to find
              stations that accept independent music, approach college radio, and
              build a targeted radio promotion campaign without spraying spam.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <a
                href="/resources/college-radio-submissions/"
                className="min-h-[44px] rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-acid/50 hover:bg-white/[0.06]"
              >
                <strong className="block text-white">
                  College Radio Submissions
                </strong>
                <span className="mt-1 block text-sm text-white/55">
                  Find the right station contacts and pitch college radio.
                </span>
              </a>

              <a
                href="/resources/radio-stations-accepting-music/"
                className="min-h-[44px] rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-acid/50 hover:bg-white/[0.06]"
              >
                <strong className="block text-white">
                  Stations Accepting Music
                </strong>
                <span className="mt-1 block text-sm text-white/55">
                  Research stations, submission contacts, and programming fit.
                </span>
              </a>

              <a
                href="/resources/radio-promotion-independent-artists/"
                className="min-h-[44px] rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-acid/50 hover:bg-white/[0.06]"
              >
                <strong className="block text-white">
                  Independent Radio Promotion
                </strong>
                <span className="mt-1 block text-sm text-white/55">
                  Build a focused outreach campaign instead of a giant email blast.
                </span>
              </a>

              <a
                href="/resources/radio-pitch-email-templates/"
                className="min-h-[44px] rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-acid/50 hover:bg-white/[0.06]"
              >
                <strong className="block text-white">
                  Radio Pitch Email Templates
                </strong>
                <span className="mt-1 block text-sm text-white/55">
                  Six tested outreach templates plus subject lines that get opened.
                </span>
              </a>

              <a
                href="/resources/how-to-get-your-song-on-the-radio/"
                className="min-h-[44px] rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-acid/50 hover:bg-white/[0.06]"
              >
                <strong className="block text-white">
                  Get Your Song on the Radio
                </strong>
                <span className="mt-1 block text-sm text-white/55">
                  The full eight-step path, from station research to confirmed spins.
                </span>
              </a>

              <a
                href="/resources/radio-promotion-glossary/"
                className="min-h-[44px] rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-acid/50 hover:bg-white/[0.06]"
              >
                <strong className="block text-white">
                  Radio Promotion Glossary
                </strong>
                <span className="mt-1 block text-sm text-white/55">
                  40+ radio terms in plain English — adds, spins, rotation, NACC.
                </span>
              </a>

              <a
                href="/resources/"
                className="min-h-[44px] rounded-lg border border-acid/30 bg-acid/5 p-4 transition hover:border-acid/60 hover:bg-acid/10"
              >
                <strong className="block text-acid">
                  All Free Guides →
                </strong>
                <span className="mt-1 block text-sm text-white/55">
                  Genre playbooks, EPK building, comparisons, and answers — the
                  complete resource library.
                </span>
              </a>
            </div>
          </div>
        </section>

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

      {/* FINAL CTA */}
      <section
        data-esp-zone="cta"
        className="defer-render border-t border-white/10 bg-gradient-to-b from-blood/20 to-ink"
      >
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-16">
          <h2 className="font-display text-[2rem] leading-[1.05] sm:text-6xl sm:leading-[0.95]">
            TWO ROADS. <span className="text-acid">PICK ONE.</span>
          </h2>
          <div className="mt-6 grid gap-3 text-left sm:mt-8 sm:grid-cols-2 sm:gap-4">
            <div className="rounded-lg border border-white/10 bg-black/40 p-4 sm:p-5">
              <p className="font-display text-lg text-white/50 sm:text-xl">ROAD A</p>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55 sm:text-[15px]">
                <EmotiveText slot="roadA" />
              </p>
            </div>
            <div className="rounded-lg border-2 border-acid bg-acid/10 p-4 sm:p-5">
              <p className="font-display text-lg text-acid sm:text-xl">ROAD B</p>
              <p className="mt-2 text-[14px] leading-relaxed text-white/80 sm:text-[15px]">
                <EmotiveText slot="roadB" />
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCta("final")}
            className="cta mt-7 w-full rounded-lg bg-acid px-4 py-4 font-display text-[1.25rem] uppercase leading-tight tracking-wide text-ink sm:mt-8 sm:px-6 sm:py-5 sm:text-3xl"
          >
            Give Me Instant Access — $20
          </button>
          <p className="mt-3 text-[11px] leading-snug text-white/40 sm:text-[12px]">
            Secure checkout · Instant download · 30-day refund · No subscription, ever
          </p>
        </div>
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
        <nav
          aria-label="Site"
          className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
        >
          <a href="/resources/" className="underline decoration-white/20 underline-offset-4 hover:text-white/60">
            Free radio promotion guides
          </a>
          <a href="/privacy-policy/" className="underline decoration-white/20 underline-offset-4 hover:text-white/60">
            Privacy policy
          </a>
          <a href="/terms/" className="underline decoration-white/20 underline-offset-4 hover:text-white/60">
            Terms of service
          </a>
        </nav>
        <p className="mt-3">© {new Date().getFullYear()} Radio Reach Vault. All rights reserved.</p>
      </footer>

      {/* Dev-only overlay — visible only with ?esp=debug */}
      {espDebug && <DebugPanel />}
    </div>
  );
}
