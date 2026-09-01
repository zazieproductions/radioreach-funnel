import { useEffect, useMemo, useState } from "react";
import TerminalPreview from "./TerminalPreview";
import PdfSampleModal from "./PdfSampleModal";
import { TESTIMONIALS } from "./testimonials";
import { trackCustom } from "../lib/metaPixel";
import { EmotiveText, espLogConversion, initEsp } from "../esp";

const FAQS = [
  [
    "What exactly do I receive?",
    "The RadioReach Vault is an instant digital download: a 400+ page organized directory with 18,000+ radio contacts sorted by station, location, role, phone, and email. It is a research resource you can use on any device; there is no app, subscription, or monthly renewal.",
  ],
  [
    "Are these just generic station inboxes?",
    "The Vault is organized around the people and submission points that matter: program directors, music directors, DJs, station lines, and city data. Contact records change over time, so verify a contact before you send and use the file as a focused starting point rather than a promise of deliverability.",
  ],
  [
    "Will this guarantee airplay?",
    "No contact list can guarantee a spin. Your music, timing, fit, and pitch still do the work. RadioReach removes the most expensive first bottleneck: spending weeks hunting for the right stations and the right person to contact.",
  ],
  [
    "Is this a subscription?",
    "No. The Vault is a one-time $25 purchase with lifetime access to the file you receive. Optional add-ons are clearly labeled at checkout and are never added automatically.",
  ],
  [
    "What is the refund policy?",
    "You have 30 days to put the Vault to work. Contact at least five relevant stations, keep a simple record of your outreach, and if you decide it is not right for you, email us within 30 days with your receipt and a short note about what happened. No airplay or reply is required.",
  ],
];

type Props = {
  onCta: () => void;
  luckyCoupon?: unknown;
  onOpenWheel?: () => void;
  onClaimWheel?: () => void;
};

const Arrow = () => <span aria-hidden className="ml-1 transition-transform group-hover:translate-x-1">↗</span>;
const Check = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-[14px] leading-relaxed text-white/72">
    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#c9f31d] text-[11px] font-black text-[#0a0b0b]">✓</span>
    <span>{children}</span>
  </li>
);

function LogoMark() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] border border-[#c9f31d]/55 bg-[#c9f31d] text-[#0a0b0b] shadow-[0_0_24px_rgba(201,243,29,0.18)]">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d="M4 13.5a8 8 0 0 1 16 0M7 13.5a5 5 0 0 1 10 0M10 13.5a2 2 0 0 1 4 0M12 4v2" strokeLinecap="round" />
        <circle cx="12" cy="17.5" r="1.3" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

function StatusPill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "red" | "muted" }) {
  const toneClass = tone === "red" ? "text-[#ff5d5d] border-[#ff5d5d]/25 bg-[#ff5d5d]/[0.06]" : tone === "muted" ? "text-white/45 border-white/10 bg-white/[0.03]" : "text-[#c9f31d] border-[#c9f31d]/25 bg-[#c9f31d]/[0.06]";
  return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${toneClass}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{children}</span>;
}

export default function SalesPage({ onCta }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const trafficContext = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const source = `${params.get("utm_source") ?? ""} ${params.get("utm_medium") ?? ""}`.toLowerCase();
    const paidSocial = params.has("fbclid") || /facebook|instagram|meta/.test(source);
    return { paidSocial, mobile: window.matchMedia("(max-width: 767px)").matches };
  }, []);

  useEffect(() => {
    trackCustom("LandingExperienceViewed", {
      experience: trafficContext.paidSocial ? "signal_room_v2_paid_social" : "signal_room_v2_organic",
      paid_social: trafficContext.paidSocial,
      mobile: trafficContext.mobile,
    });
  }, [trafficContext]);

  useEffect(() => initEsp(), []);

  useEffect(() => {
    const handleHash = () => {
      if (["#pdf", "#sample-pdf", "#pdf-sample", "#document-sample"].includes(window.location.hash.toLowerCase())) setIsPdfOpen(true);
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleCta = (placement: string) => {
    espLogConversion("cta_click", { placement, experience: trafficContext.paidSocial ? "signal_room_v2_paid_social" : "signal_room_v2_organic" });
    trackCustom("SalesCtaClicked", {
      placement,
      experience: trafficContext.paidSocial ? "signal_room_v2_paid_social" : "signal_room_v2_organic",
      paid_social: trafficContext.paidSocial,
      value: 25,
      currency: "USD",
    });
    onCta();
  };

  return (
    <div id="top" className="min-h-screen overflow-hidden bg-[#0a0b0b] pb-20 text-white selection:bg-[#c9f31d] selection:text-[#0a0b0b]">
      {/* Thin, editorial announcement bar. It communicates the offer without manufacturing panic. */}
      <div className="border-b border-white/[0.08] bg-[#c9f31d] px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-[#0a0b0b] sm:text-[11px]">
        <span>Field kit for independent artists</span><span className="mx-2 opacity-40">·</span><span>18,000+ contacts · one-time access</span>
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0a0b0b]/90 backdrop-blur-xl">
        <nav aria-label="Primary" className="mx-auto flex h-[4.25rem] max-w-[1180px] items-center gap-5 px-5 lg:px-8">
          <a href="#top" className="group flex min-w-0 items-center gap-2.5" aria-label="RadioReach home">
            <LogoMark />
            <span className="truncate font-display text-[1.08rem] tracking-[0.03em] text-white">RADIO<span className="text-[#c9f31d]">REACH</span></span>
          </a>
          <div className="ml-auto hidden items-center gap-7 lg:flex">
            {["The problem", "Inside the Vault", "Proof", "FAQ"].map((label, i) => <a key={label} href={["#problem", "#inside", "#proof", "#faq"][i]} className="text-[12px] font-semibold tracking-wide text-white/50 transition hover:text-white">{label}</a>)}
          </div>
          <button type="button" onClick={() => setShowMobileMenu((value) => !value)} className="ml-auto grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-white/70 lg:hidden" aria-label="Toggle navigation" aria-expanded={showMobileMenu}>
            <span className="text-lg">{showMobileMenu ? "×" : "☰"}</span>
          </button>
          <button type="button" onClick={() => handleCta("nav")} className="group cta hidden rounded-lg bg-[#c9f31d] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#0a0b0b] sm:block">Open the Vault <Arrow /></button>
        </nav>
        {showMobileMenu && <div className="border-t border-white/[0.08] bg-[#111313] px-5 py-3 lg:hidden"><div className="mx-auto flex max-w-[1180px] flex-wrap gap-x-6 gap-y-1">{["#problem", "#inside", "#proof", "#faq"].map((href) => <a key={href} href={href} onClick={() => setShowMobileMenu(false)} className="py-2 text-xs font-semibold uppercase tracking-wider text-white/60">{href.slice(1)}</a>)}</div></div>}
      </header>

      <main>
        {/* HERO */}
        <section className="relative isolate border-b border-white/[0.08]">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_13%_25%,rgba(201,243,29,0.09),transparent_28%),linear-gradient(115deg,#0a0b0b_0%,#0a0b0b_46%,rgba(10,11,11,0.55)_72%,#0a0b0b_100%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.14] bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
          <div className="mx-auto grid max-w-[1180px] gap-10 px-5 pb-12 pt-12 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-20 lg:pt-20">
            <div className="relative z-10">
              <StatusPill><EmotiveText slot="heroEyebrow" /></StatusPill>
              <h1 className="mt-6 max-w-[710px] font-display text-[3.3rem] leading-[0.92] tracking-[-0.015em] text-white sm:text-[5.1rem] lg:text-[6.25rem]">
                THE ADDRESS IS<br /><span className="text-[#c9f31d]">THE ADVANTAGE.</span>
              </h1>
              <EmotiveText slot="heroSub" as="p" className="mt-6 max-w-[570px] font-serif text-[1.06rem] leading-[1.65] text-white/65 sm:text-[1.24rem]" />
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button type="button" onClick={() => handleCta("hero_primary")} className="group cta inline-flex min-h-14 items-center justify-center rounded-lg bg-[#c9f31d] px-6 font-display text-[1.18rem] uppercase tracking-[0.04em] text-[#0a0b0b] shadow-[0_12px_34px_rgba(201,243,29,0.13)] sm:px-8">Open the RadioReach Vault <Arrow /></button>
                <a href="#sample" className="inline-flex min-h-14 items-center justify-center rounded-lg border border-white/15 px-5 text-[12px] font-bold uppercase tracking-[0.12em] text-white/65 transition hover:border-white/35 hover:text-white">See a live sample <span aria-hidden className="ml-2">↓</span></a>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40"><span>✓ $25 once</span><span>✓ Instant download</span><span>✓ 30-day guarantee</span></div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px] lg:justify-self-end">
              <div className="absolute -inset-5 rounded-[28px] bg-[#c9f31d]/[0.06] blur-3xl" aria-hidden />
              <div data-esp-zone="pricing" className="relative overflow-hidden rounded-[18px] border border-white/15 bg-[#141716] shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
                <div className="relative aspect-[0.94] overflow-hidden">
                  <img src="/images/studio-1280.jpg" alt="Radio studio mixing desk with an On Air sign" width={1280} height={853} fetchPriority="high" className="h-full w-full object-cover opacity-65" />
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(9,10,10,0.3),rgba(9,10,10,0.04)_44%,rgba(9,10,10,0.78))]" />
                  <div className="absolute left-5 top-5 right-5 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">RR / signal room 01</span><span className="flex items-center gap-2 rounded-full border border-[#ff5d5d]/35 bg-[#0a0b0b]/55 px-2.5 py-1 font-mono text-[10px] text-[#ff7777]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5d5d]" />ON AIR</span></div>
                  <div className="absolute inset-x-5 bottom-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#c9f31d]">The Vault / field data</p>
                    <p className="mt-2 max-w-[15ch] font-display text-4xl leading-[0.92] sm:text-5xl">FIND THE<br />RIGHT<br /><span className="text-[#c9f31d]">INBOX.</span></p>
                  </div>
                </div>
                <div data-esp-zone="scarcity" className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-[#111313]">
                  <div className="p-3.5 sm:p-4"><b className="block font-display text-2xl text-[#c9f31d] sm:text-3xl">18K+</b><span className="mt-1 block text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-white/40">contacts</span></div>
                  <div className="p-3.5 sm:p-4"><b className="block font-display text-2xl text-white sm:text-3xl">400+</b><span className="mt-1 block text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-white/40">pages organized</span></div>
                  <div className="p-3.5 sm:p-4"><b className="block font-display text-2xl text-white sm:text-3xl">$25</b><span className="mt-1 block text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-white/40">one time</span></div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-3 hidden rounded-xl border border-white/15 bg-[#111313] p-3 shadow-2xl sm:block sm:-left-8"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#c9f31d] text-[#0a0b0b]">↗</span><div><p className="font-mono text-[9px] uppercase tracking-wider text-white/40">next move</p><p className="text-[12px] font-bold text-white">Start with your city</p></div></div></div>
            </div>
          </div>
        </section>

        {/* SIGNAL BAR */}
        <div className="border-b border-white/[0.08] bg-[#111313]">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 lg:px-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">A better first move for your next release</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.13em] text-white/55"><span><i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#c9f31d]" />College</span><span><i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#c9f31d]" />Community</span><span><i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#c9f31d]" />Commercial</span><span><i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#c9f31d]" />Online</span></div>
          </div>
        </div>

        {/* PROBLEM / MECHANISM */}
        <section id="problem" className="border-b border-white/[0.08] bg-[#0a0b0b]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 lg:px-8 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:gap-20">
              <div><p className="eyebrow">01 / The bottleneck</p><h2 className="mt-4 max-w-[390px] font-display text-[2.6rem] leading-[0.96] sm:text-[4.25rem]">YOUR SONG<br /><span className="text-[#ff5d5d]">DESERVES</span><br />A BETTER<br />FIRST EMAIL.</h2></div>
              <div className="max-w-2xl lg:pt-8"><p className="font-serif text-[1.12rem] leading-[1.7] text-white/70 sm:text-[1.3rem]">The hardest part of radio outreach is usually not the pitch. It is finding the station, the format, the market, and the actual person who decides what gets heard.</p><p className="mt-5 text-[15px] leading-[1.75] text-white/50">That is where release momentum disappears: tabs open, names guessed, generic inboxes copied, and a record you believe in quietly ages out of the conversation.</p><div className="mt-9 grid gap-3 sm:grid-cols-3"><div className="border-t border-[#ff5d5d]/55 pt-3"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#ff5d5d]">the old way</p><p className="mt-2 text-[14px] leading-relaxed text-white/60">Search until the release window closes.</p></div><div className="border-t border-[#c9f31d]/55 pt-3"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#c9f31d]">the shift</p><p className="mt-2 text-[14px] leading-relaxed text-white/60">Filter by city, format, and role.</p></div><div className="border-t border-white/25 pt-3"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/45">the result</p><p className="mt-2 text-[14px] leading-relaxed text-white/60">Send a relevant email to a real person.</p></div></div></div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.08] bg-[#111313]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 lg:px-8 lg:py-24">
            <div className="max-w-2xl"><p className="eyebrow">02 / The operating system</p><h2 className="mt-4 font-display text-[2.7rem] leading-[0.96] sm:text-[4.4rem]">TURN A COLD LIST<br /><span className="text-[#c9f31d]">INTO A WARM LADDER.</span></h2><p className="mt-5 max-w-xl font-serif text-[1.05rem] leading-relaxed text-white/60 sm:text-[1.2rem]">RadioReach is not a magic button. It is a cleaner sequence for doing the work that matters.</p></div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
              {[ ["01", "Start local", "Begin with the stations in your city. Your location is context, not a weakness."], ["02", "Build the route", "Sort the file by the next market on your tour, launch, or regional push."], ["03", "Stack proof", "Every relevant reply, interview, and add gives the next pitch more weight." ] ].map(([number, title, copy]) => <div key={number} className="bg-[#0f1111] p-6 sm:p-7"><span className="font-display text-4xl text-white/15">{number}</span><h3 className="mt-5 font-display text-2xl uppercase text-[#c9f31d]">{title}</h3><p className="mt-3 text-[14px] leading-[1.7] text-white/55">{copy}</p></div>)}
            </div>
          </div>
        </section>

        {/* LIVE SAMPLE */}
        <section id="sample" className="border-b border-white/[0.08] bg-[#0a0b0b]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 lg:px-8 lg:py-24">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">03 / Look under the hood</p><h2 className="mt-4 font-display text-[2.7rem] leading-[0.96] sm:text-[4.2rem]">THIS IS WHAT<br /><span className="text-[#c9f31d]">“ORGANIZED”</span> LOOKS LIKE.</h2></div><button type="button" onClick={() => setIsPdfOpen(true)} className="tap-target self-start text-left text-[12px] font-bold uppercase tracking-[0.12em] text-white/55 underline decoration-[#c9f31d]/40 underline-offset-4 transition hover:text-[#c9f31d] sm:self-end">Preview the 400+ page PDF →</button></div>
            <div className="mt-9 grid gap-8 lg:grid-cols-[1.28fr_0.72fr] lg:items-center"><div className="rounded-2xl border border-white/10 bg-[#101212] p-1 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"><TerminalPreview onCta={() => handleCta("sample")} onOpenPdf={() => setIsPdfOpen(true)} /></div><div className="lg:pl-7"><div className="border-l-2 border-[#c9f31d] pl-5"><p className="font-display text-2xl uppercase text-white">A contact you can act on.</p><p className="mt-3 text-[14px] leading-[1.75] text-white/55">Station. City. Role. Name. Email. The file is built to get you from “I should promote this” to the first five relevant pitches.</p></div><ul className="mt-7 space-y-4"><Check>Search by the market you already understand</Check><Check>Lead with the person closest to programming</Check><Check>Keep outreach personal, relevant, and human</Check></ul><button type="button" onClick={() => handleCta("sample_side")} className="group mt-8 inline-flex items-center text-[12px] font-black uppercase tracking-[0.14em] text-[#c9f31d]">Unlock the full directory <Arrow /></button></div></div>
          </div>
        </section>

        {/* OFFER */}
        <section id="inside" className="border-b border-white/[0.08] bg-[#111313]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 lg:px-8 lg:py-24">
            <div className="max-w-3xl"><p className="eyebrow">04 / The field kit</p><h2 className="mt-4 font-display text-[2.8rem] leading-[0.94] sm:text-[4.5rem]">EVERYTHING YOU NEED<br /><span className="text-[#c9f31d]">TO START TONIGHT.</span></h2><p className="mt-5 max-w-2xl font-serif text-[1.05rem] leading-relaxed text-white/60 sm:text-[1.2rem]">One clear purchase. One useful file. No platform to learn, no monthly fee quietly bleeding your budget.</p></div>
            <div className="mt-10 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div data-esp-zone="pricing" className="rounded-2xl border border-[#c9f31d]/40 bg-[#0a0b0b] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.25)] sm:p-8"><div className="flex items-start justify-between gap-4 border-b border-white/10 pb-6"><div><StatusPill>Core access</StatusPill><EmotiveText slot="ctaLabel" as="p" className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50" /><h3 className="mt-2 font-display text-3xl uppercase sm:text-4xl">The RadioReach<br />Vault</h3></div><div className="text-right"><p className="text-[11px] font-bold uppercase tracking-wider text-white/35 line-through">$350 value</p><p className="font-display text-5xl text-[#c9f31d]">$25</p><p className="text-[10px] font-bold uppercase tracking-wider text-white/35">one time</p></div></div><ul className="mt-6 grid gap-3 sm:grid-cols-2"><Check>18,000+ radio station entries</Check><Check>400+ page organized document</Check><Check>Station, city, role, phone, and email</Check><Check>College, community, commercial, and online radio</Check><Check>Instant digital delivery after payment</Check><Check>Lifetime access to the file you receive</Check></ul><button type="button" onClick={() => handleCta("offer")} className="group cta mt-8 flex min-h-14 w-full items-center justify-center rounded-lg bg-[#c9f31d] px-5 font-display text-xl uppercase tracking-wide text-[#0a0b0b]">Get Instant Access for $25 <Arrow /></button><p className="mt-3 text-center text-[11px] text-white/35">Secure Stripe checkout · no subscription · 30-day action guarantee</p></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><div className="rounded-2xl border border-white/10 bg-[#0a0b0b] p-6 sm:p-7"><p className="eyebrow">Optional, at checkout</p><h3 className="mt-3 font-display text-2xl uppercase">Build your next market.</h3><p className="mt-3 text-[14px] leading-[1.7] text-white/55">Add the Indie Music Contract Kit or the Australian station list only if it supports the campaign you are actually running. Nothing is pre-selected.</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-bold text-white/60">Contract Kit · $9</span><span className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-bold text-white/60">AU List · $12</span></div></div><div className="rounded-2xl border border-[#ff5d5d]/25 bg-[#ff5d5d]/[0.045] p-6 sm:p-7"><p className="eyebrow text-[#ff7777]">What this is not</p><h3 className="mt-3 font-display text-2xl uppercase">Not a spam machine.</h3><p className="mt-3 text-[14px] leading-[1.7] text-white/55">The advantage is relevance. Use the data to send fewer, better emails. Respect station preferences, verify details, and make the pitch worth opening.</p></div></div>
            </div>
          </div>
        </section>

        {/* PROOF */}
        <section id="proof" data-esp-zone="proof" className="border-b border-white/[0.08] bg-[#0a0b0b]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 lg:px-8 lg:py-24"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">05 / From the field</p><EmotiveText slot="proofHeadline" as="h2" className="mt-4 font-display text-[2.8rem] leading-[0.95] sm:text-[4.5rem]" /></div><p className="max-w-xs text-[12px] leading-relaxed text-white/40 sm:text-right">Results vary by music, fit, timing, and follow-through. The common thread: relevant outreach starts faster.</p></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{TESTIMONIALS.slice(0, 3).map((testimonial) => <figure key={testimonial.name} className="flex flex-col rounded-2xl border border-white/10 bg-[#111313] p-5 sm:p-6"><div className="flex items-center justify-between"><span className="text-sm tracking-[0.1em] text-[#c9f31d]">★★★★★</span><span className="rounded-full border border-[#c9f31d]/20 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#c9f31d]/75">{testimonial.stat}</span></div><blockquote className="mt-5 flex-1 font-serif text-[15px] leading-[1.7] text-white/72">“{testimonial.text}”</blockquote><figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4"><img src={testimonial.photo} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 rounded-full object-cover grayscale" /><div><p className="text-[13px] font-bold text-white">{testimonial.name}</p><p className="mt-0.5 text-[11px] text-white/40">{testimonial.role}</p></div></figcaption></figure>)}</div></div>
        </section>

        {/* GUARANTEE + AUDIENCE */}
        <section className="border-b border-white/[0.08] bg-[#111313]"><div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-8 lg:py-24"><div><p className="eyebrow">06 / Use it well</p><h2 className="mt-4 font-display text-[2.8rem] leading-[0.95] sm:text-[4.2rem]">FEWER EMAILS.<br /><span className="text-[#c9f31d]">BETTER TARGETS.</span></h2></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-[#0a0b0b] p-6"><span className="font-display text-4xl text-[#c9f31d]">01</span><h3 className="mt-5 font-display text-xl uppercase">You have a release</h3><p className="mt-2 text-[14px] leading-relaxed text-white/50">A single, EP, podcast, or project you are ready to put in front of the right audience.</p></div><div className="rounded-2xl border border-white/10 bg-[#0a0b0b] p-6"><span className="font-display text-4xl text-[#c9f31d]">02</span><h3 className="mt-5 font-display text-xl uppercase">You want momentum</h3><p className="mt-2 text-[14px] leading-relaxed text-white/50">You would rather send five relevant pitches tonight than research blindly for another month.</p></div><div className="rounded-2xl border border-[#ff5d5d]/25 bg-[#ff5d5d]/[0.045] p-6 sm:col-span-2"><h3 className="font-display text-xl uppercase text-[#ff7777]">This is not for blasting 18,000 identical emails.</h3><p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/55">That is spam, it burns trust, and it misses the point. RadioReach is a map. Your judgment and your respect for the people receiving your pitch are the engine.</p></div></div></div></section>

        <section className="border-b border-white/[0.08] bg-[#0a0b0b] px-5 py-16 lg:px-8 lg:py-24"><div className="mx-auto max-w-[880px] rounded-3xl border border-[#c9f31d]/35 bg-[radial-gradient(circle_at_50%_0%,rgba(201,243,29,0.12),transparent_50%),#111313] p-7 text-center sm:p-12"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#c9f31d]/60 bg-[#c9f31d]/10 font-display text-xl text-[#c9f31d]">30</div><p className="eyebrow mt-5">Risk reversal, without the fine print fog</p><h2 className="mt-4 font-display text-[2.35rem] leading-[0.96] sm:text-[4rem]">PUT THE VAULT<br /><span className="text-[#c9f31d]">TO WORK.</span></h2><p className="mx-auto mt-5 max-w-2xl font-serif text-[1rem] leading-[1.7] text-white/65 sm:text-[1.15rem]">Contact at least five relevant stations, keep a simple outreach record, and decide if the Vault belongs in your process. If it does not, request your refund within 30 days. No airplay or reply is required.</p><a href="/refund-policy/" className="mt-5 inline-block text-[11px] font-bold uppercase tracking-[0.13em] text-white/45 underline decoration-[#c9f31d]/35 underline-offset-4 hover:text-[#c9f31d]">Read the full refund policy →</a></div></section>

        {/* FAQ */}
        <section id="faq" className="border-b border-white/[0.08] bg-[#111313]"><div className="mx-auto max-w-[880px] px-5 py-16 lg:px-8 lg:py-24"><p className="eyebrow">07 / Clear the air</p><h2 className="mt-4 font-display text-[2.8rem] leading-[0.95] sm:text-[4.2rem]">QUESTIONS,<br /><span className="text-[#c9f31d]">ANSWERED.</span></h2><div className="mt-9 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b0b]">{FAQS.map(([question, answer], index) => { const isOpen = openFaq === index; return <div key={question} className="border-b border-white/10 last:border-b-0"><h3><button type="button" onClick={() => setOpenFaq(isOpen ? null : index)} aria-expanded={isOpen} className="flex min-h-16 w-full items-center justify-between gap-5 px-5 text-left transition hover:bg-white/[0.03] sm:px-6"><span className="text-[14px] font-bold text-white/85 sm:text-[15px]">{question}</span><span className="font-display text-2xl text-[#c9f31d]">{isOpen ? "−" : "+"}</span></button></h3>{isOpen && <p className="px-5 pb-6 text-[14px] leading-[1.75] text-white/55 sm:px-6">{answer}</p>}</div>; })}</div></div></section>

        {/* CLOSE */}
        <section className="relative overflow-hidden bg-[#c9f31d] px-5 py-16 text-[#0a0b0b] lg:px-8 lg:py-24"><div aria-hidden className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[38px] border-[#0a0b0b]/[0.08]" /><div className="relative mx-auto max-w-[880px] text-center"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Your next release is already waiting</p><h2 className="mt-5 font-display text-[3.5rem] leading-[0.88] tracking-[-0.01em] sm:text-[6.3rem]">FIND THE<br />RIGHT INBOX.</h2><p className="mx-auto mt-5 max-w-xl font-serif text-[1.05rem] leading-relaxed text-[#0a0b0b]/70">Open the Vault, choose your city, and send the first five relevant pitches tonight.</p><button type="button" onClick={() => handleCta("final")} className="group cta mt-8 inline-flex min-h-14 items-center justify-center rounded-lg bg-[#0a0b0b] px-8 font-display text-xl uppercase tracking-wide text-[#c9f31d] shadow-[0_10px_26px_rgba(0,0,0,0.18)]">Open the Vault — $25 <Arrow /></button><p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a0b0b]/55">One-time payment · instant download · 30-day action guarantee</p></div></section>
      </main>

      <footer className="border-t border-white/[0.1] bg-[#0a0b0b] px-5 py-10 text-center text-[11px] leading-relaxed text-white/38"><div className="mx-auto flex max-w-[1180px] flex-col items-center gap-4 sm:flex-row sm:justify-between sm:text-left"><div className="flex items-center gap-2"><LogoMark /><span className="font-display text-sm tracking-wide text-white/75">RADIO<span className="text-[#c9f31d]">REACH</span></span></div><p className="max-w-lg">A contact database for targeted, relevant, human outreach. Verify contacts before sending and comply with applicable email laws.</p><nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:justify-end"><a href="/privacy-policy/" className="underline decoration-white/20 underline-offset-4 hover:text-white">Privacy</a><a href="/terms/" className="underline decoration-white/20 underline-offset-4 hover:text-white">Terms</a><a href="/refund-policy/" className="underline decoration-white/20 underline-offset-4 hover:text-white">Refunds</a></nav></div><p className="mx-auto mt-7 max-w-[1180px] text-white/25 sm:text-left">© {new Date().getFullYear()} RadioReach. Built for the artists doing it themselves.</p></footer>

      <div className="mobile-solid fixed inset-x-0 bottom-0 z-40 border-t border-[#c9f31d]/35 bg-[#0a0b0b]/95 px-3 py-2.5 backdrop-blur-xl sm:hidden"><button type="button" onClick={() => handleCta("mobile_sticky")} className="cta flex min-h-12 w-full items-center justify-center rounded-lg bg-[#c9f31d] font-display text-lg uppercase tracking-wide text-[#0a0b0b]"><EmotiveText slot="stickyLabel" /> <Arrow /></button></div>

      <PdfSampleModal isOpen={isPdfOpen} onClose={() => setIsPdfOpen(false)} onCta={() => handleCta("pdf_sample_unlock")} />
    </div>
  );
}
