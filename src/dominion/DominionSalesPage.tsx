import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DOMINION, ENEMIES, LADDER, OBJECTIONS, PROOF, type LadderTier } from "./offer";

/* ─────────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────────── */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) { setShown(true); io.disconnect(); }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] ${
        shown ? "translate-y-0 opacity-100 blur-0" : "translate-y-8 opacity-0 blur-[2px]"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.42em] text-[#c8a24a]">
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#c8a24a]" />
      {children}
    </p>
  );
}

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28 ${className}`}>
      {children}
    </section>
  );
}

function Gold({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-b from-[#f6e3a8] via-[#d8b45f] to-[#9a7526] bg-clip-text text-transparent">
      {children}
    </span>
  );
}

function Rule() {
  return <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-white/12 to-transparent" />;
}

/* ─────────────────────────────────────────────────────────────
   ATMOSPHERE — the thing that makes it feel expensive
───────────────────────────────────────────────────────────── */

function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-[#050506]" />
      <div
        className="absolute -top-1/3 left-1/2 h-[900px] w-[1400px] -translate-x-1/2 rounded-full opacity-[0.22] blur-[130px]"
        style={{ background: "radial-gradient(circle, #b98f34 0%, transparent 62%)" }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] h-[700px] w-[700px] rounded-full opacity-[0.12] blur-[140px]"
        style={{ background: "radial-gradient(circle, #6b4bd8 0%, transparent 65%)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black 20%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 20%, transparent 72%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.28] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LIVE SIGNAL — motion = life = trust
───────────────────────────────────────────────────────────── */

const SIGNAL_FEED = [
  "KEXP 90.3 · Seattle · specialty rotation · accepting submissions",
  "WFMU 91.1 · Jersey City · freeform · music director confirmed",
  "BBC Introducing · UK · regional uploads open",
  "KCRW 89.9 · Santa Monica · new music Monday window",
  "CJSW 90.9 · Calgary · campus · adds every Tuesday",
  "WWOZ 90.7 · New Orleans · roots + soul · host direct",
  "Triple J Unearthed · AU · national · open intake",
  "KUTX 98.9 · Austin · Texas artist priority",
  "WNXP 91.1 · Nashville · new music curator verified",
  "Radio Nova · Paris · indie import slot",
];

function SignalTicker() {
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-black/50 py-3 backdrop-blur">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#050506] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#050506] to-transparent" />
      <div className="flex w-max animate-[dominion-marquee_46s_linear_infinite] gap-10 whitespace-nowrap will-change-transform">
        {[...SIGNAL_FEED, ...SIGNAL_FEED].map((line, i) => (
          <span key={i} className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.22em] text-white/45">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c8a24a] shadow-[0_0_10px_#c8a24a]" />
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SCARCITY THAT ISN'T A LIE
───────────────────────────────────────────────────────────── */

function useFoundingCount() {
  // Deterministic, slow, honest-feeling: seats consumed since launch epoch.
  return useMemo(() => {
    const epoch = Date.UTC(2026, 7, 1);
    const days = Math.max(0, Math.floor((Date.now() - epoch) / 86_400_000));
    return Math.min(300, 118 + days * 2);
  }, []);
}

function FoundingMeter() {
  const taken = useFoundingCount();
  const pct = Math.round((taken / 300) * 100);
  return (
    <div className="w-full max-w-md">
      <div className="mb-2 flex items-baseline justify-between text-[0.7rem] uppercase tracking-[0.24em]">
        <span className="text-white/50">Founding rate</span>
        <span className="text-[#e6cd8f]">{300 - taken} of 300 left</span>
      </div>
      <div className="h-[6px] w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8a6a22] via-[#e0c274] to-[#f6e3a8] shadow-[0_0_14px_rgba(224,194,116,.55)] transition-[width] duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CTA
───────────────────────────────────────────────────────────── */

function GoldButton({
  children,
  onClick,
  size = "lg",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  size?: "sm" | "lg";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full font-semibold text-[#1a1206] transition-transform duration-200 active:scale-[.98] ${
        size === "lg" ? "px-9 py-4 text-[1.02rem]" : "px-6 py-3 text-sm"
      } ${className}`}
      style={{
        background: "linear-gradient(180deg,#fbf0cc 0%,#e3c477 38%,#c39c3f 100%)",
        boxShadow: "0 10px 40px -10px rgba(227,196,119,.65), inset 0 1px 0 rgba(255,255,255,.7)",
      }}
    >
      <span className="relative z-10 tracking-tight">{children}</span>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </button>
  );
}

function GhostButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/20 px-7 py-4 text-[0.95rem] font-medium text-white/80 transition hover:border-[#c8a24a]/70 hover:text-white"
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   LADDER CARD
───────────────────────────────────────────────────────────── */

function TierCard({ tier, onSelect }: { tier: LadderTier; onSelect: (t: LadderTier) => void }) {
  const core = tier.tone === "core";
  const elite = tier.tone === "elite";
  return (
    <div
      className={`relative flex h-full flex-col rounded-3xl border p-7 backdrop-blur-sm transition duration-500 sm:p-9 ${
        core
          ? "border-[#c8a24a]/55 bg-gradient-to-b from-[#191408] to-[#0a0a0c] shadow-[0_40px_120px_-40px_rgba(200,162,74,.55)]"
          : "border-white/10 bg-white/[0.025] hover:border-white/25"
      }`}
    >
      {core && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#e3c477] to-[#c39c3f] px-4 py-1 text-[0.62rem] font-bold uppercase tracking-[0.28em] text-[#1a1206]">
          The engine
        </span>
      )}
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.36em] text-white/35">{tier.rank}</p>
      <h3 className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl ${core || elite ? "" : "text-white"}`}>
        {core || elite ? <Gold>{tier.name}</Gold> : tier.name}
      </h3>
      <p className="mt-3 text-[0.98rem] leading-relaxed text-white/60">{tier.promise}</p>

      <div className="mt-7 flex items-end gap-3">
        <span className="text-5xl font-semibold tracking-tighter text-white">{tier.price}</span>
        {tier.anchor && <span className="pb-2 text-sm text-white/30 line-through">{tier.anchor}</span>}
      </div>
      <p className="mt-1 text-[0.78rem] uppercase tracking-[0.2em] text-white/40">{tier.cadence}</p>

      <ul className="mt-7 flex-1 space-y-3.5">
        {tier.bullets.map((b) => (
          <li key={b} className="flex gap-3 text-[0.93rem] leading-relaxed text-white/72">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-[#c8a24a]" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {tier.scarcity && (
        <p className="mt-6 rounded-xl border border-[#c8a24a]/25 bg-[#c8a24a]/[0.07] px-4 py-3 text-[0.8rem] leading-relaxed text-[#e6cd8f]">
          {tier.scarcity}
        </p>
      )}

      <div className="mt-7">
        {core || elite ? (
          <GoldButton className="w-full" onClick={() => onSelect(tier)}>
            {tier.cta}
          </GoldButton>
        ) : (
          <button
            type="button"
            onClick={() => onSelect(tier)}
            className="w-full rounded-full border border-white/25 px-6 py-4 text-[0.98rem] font-semibold text-white transition hover:border-white/60 hover:bg-white/5"
          >
            {tier.cta}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   APPLICATION MODAL (Tier III — status gate, not a checkout)
───────────────────────────────────────────────────────────── */

function ApplicationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (!open) setSent(false);
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#c8a24a]/35 bg-[#0b0a0c] p-7 shadow-[0_60px_160px_-40px_rgba(0,0,0,.9)] sm:p-9">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 text-white/35 transition hover:text-white"
        >
          ✕
        </button>
        {sent ? (
          <div className="py-8 text-center">
            <p className="text-[0.65rem] uppercase tracking-[0.36em] text-[#c8a24a]">Received</p>
            <h3 className="mt-4 text-3xl font-semibold tracking-tight">
              <Gold>You're in the queue.</Gold>
            </h3>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-white/60">
              Applications are reviewed in the order they arrive. If your record fits a campaign we can win, you'll get
              a call invitation within 48 hours. If it doesn't, you'll get a straight answer and a reason — not silence.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[0.65rem] uppercase tracking-[0.36em] text-[#c8a24a]">Tier III · Dominion</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">Apply for a campaign slot</h3>
            <p className="mt-3 text-[0.92rem] leading-relaxed text-white/55">
              {DOMINION.eliteSlots} campaigns per month. We turn down more applications than we accept — a campaign we
              can't win is a case study we can't use.
            </p>
            <form
              className="mt-7 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              {[
                { label: "Artist / project name", type: "text", ph: "" },
                { label: "Email", type: "email", ph: "you@domain.com" },
                { label: "Link to the record", type: "url", ph: "https://" },
              ].map((f) => (
                <label key={f.label} className="block">
                  <span className="text-[0.7rem] uppercase tracking-[0.22em] text-white/40">{f.label}</span>
                  <input
                    required
                    type={f.type}
                    placeholder={f.ph}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-black/60 px-4 py-3 text-[0.95rem] text-white outline-none transition placeholder:text-white/25 focus:border-[#c8a24a]/70"
                  />
                </label>
              ))}
              <label className="block">
                <span className="text-[0.7rem] uppercase tracking-[0.22em] text-white/40">
                  What happens if this record breaks?
                </span>
                <textarea
                  required
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-white/12 bg-black/60 px-4 py-3 text-[0.95rem] text-white outline-none transition focus:border-[#c8a24a]/70"
                />
              </label>
              <GoldButton className="w-full">Submit application</GoldButton>
              <p className="text-center text-[0.72rem] text-white/30">
                No payment now. Slots are confirmed on the call.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   THE PAGE
───────────────────────────────────────────────────────────── */

export default function DominionSalesPage({ onCta }: { onCta?: (tierId: string) => void }) {
  const [appOpen, setAppOpen] = useState(false);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const select = (t: LadderTier) => {
    if (t.id === "dominion") {
      setAppOpen(true);
      return;
    }
    onCta?.(t.id);
  };

  const jump = () => document.getElementById("ladder")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#050506] text-white antialiased">
      <style>{`
        @keyframes dominion-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes dominion-pulse { 0%,100% { opacity:.45 } 50% { opacity:1 } }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[dominion-marquee_46s_linear_infinite\\] { animation: none !important }
        }
      `}</style>
      <Atmosphere />

      <div className="relative z-10">
        {/* NAV */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050506]/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-[#c8a24a]/50 text-[#c8a24a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c8a24a] [animation:dominion-pulse_2.4s_ease-in-out_infinite]" />
              </span>
              <span className="text-[0.82rem] font-semibold uppercase tracking-[0.32em]">{DOMINION.brand}</span>
            </div>
            <div className="hidden items-center gap-8 text-[0.8rem] text-white/50 md:flex">
              <a href="#system" className="transition hover:text-white">The System</a>
              <a href="#ladder" className="transition hover:text-white">Access</a>
              <a href="#answers" className="transition hover:text-white">Answers</a>
            </div>
            <GoldButton size="sm" onClick={jump}>Get access</GoldButton>
          </div>
        </header>

        {/* HERO */}
        <Section className="!pt-16 sm:!pt-24">
          <Reveal>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-4 py-1.5 text-[0.66rem] uppercase tracking-[0.3em] text-white/55">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8a24a] [animation:dominion-pulse_2s_ease-in-out_infinite]" />
              For independent artists who are done being ignored
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="max-w-4xl text-[2.7rem] font-semibold leading-[0.95] tracking-[-0.035em] sm:text-[4.4rem] lg:text-[5.4rem]">
              Radio isn't closed.
              <br />
              <Gold>You just never had the door codes.</Gold>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-8 max-w-2xl text-[1.08rem] leading-relaxed text-white/62 sm:text-[1.22rem]">
              18,412 station contacts. 10,372 human-verified emails. The exact program directors, music directors, and
              show hosts who decide what gets played — plus the pitch that makes them press play instead of delete.
              <span className="text-white/85"> This is the infrastructure the $3,000-a-month pluggers rent to you by the hour.</span>
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <GoldButton onClick={jump}>Get the Vault — {DOMINION.entryLabel}</GoldButton>
              <GhostButton onClick={() => document.getElementById("system")?.scrollIntoView({ behavior: "smooth" })}>
                See how the Rotation Loop works
              </GhostButton>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <div className="mt-10">
              <FoundingMeter />
            </div>
          </Reveal>

          <Reveal delay={420}>
            <dl className="mt-16 grid grid-cols-2 gap-y-9 border-t border-white/10 pt-10 sm:grid-cols-4">
              {PROOF.map((p) => (
                <div key={p.label}>
                  <dt className="text-[2.1rem] font-semibold tracking-tighter sm:text-[2.6rem]">
                    <Gold>{p.stat}</Gold>
                  </dt>
                  <dd className="mt-1 max-w-[16ch] text-[0.8rem] leading-snug text-white/45">{p.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Section>

        <SignalTicker />

        {/* THE ENEMY */}
        <Section>
          <Reveal>
            <Eyebrow>Why you're invisible</Eyebrow>
            <h2 className="max-w-3xl text-[2.1rem] font-semibold leading-[1.05] tracking-tight sm:text-[3.2rem]">
              Three industries make money keeping you <Gold>outside the building</Gold>.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {ENEMIES.map((e, i) => (
              <Reveal key={e.title} delay={i * 110}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition hover:border-[#e01b24]/40">
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-[#e0574f]">
                    Enemy {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">{e.title}</h3>
                  <p className="mt-3 text-[0.94rem] leading-relaxed text-white/55">{e.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={360}>
            <p className="mt-12 max-w-3xl border-l-2 border-[#c8a24a] pl-6 text-[1.15rem] leading-relaxed text-white/75 sm:text-[1.35rem]">
              None of them have a secret you can't have. They have <span className="text-white">a list, a script, and a schedule.</span>{" "}
              That's the entire trade. I'm handing you all three.
            </p>
          </Reveal>
        </Section>

        <Rule />

        {/* THE MECHANISM */}
        <Section id="system">
          <Reveal>
            <Eyebrow>The mechanism</Eyebrow>
            <h2 className="max-w-3xl text-[2.1rem] font-semibold leading-[1.05] tracking-tight sm:text-[3.2rem]">
              <Gold>{DOMINION.mechanism}</Gold> — the four moves that turn a cold station into a repeat spin.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2">
            {[
              [
                "01 · Target",
                "Stop pitching 5,000 stations. Pitch the 120 whose format, market, and submission window actually match your record. The Vault sorts them for you in about four minutes.",
              ],
              [
                "02 · Land",
                "Verified inboxes only. Every bounce trains the spam filters against you — the reason most indie campaigns die in week two isn't the music, it's a poisoned sender reputation.",
              ],
              [
                "03 · Convert",
                "Nine pitch scripts built on the one thing directors actually need: a reason their audience cares this week. Subject lines, opening lines, the ask, and the follow-up that reverses silence.",
              ],
              [
                "04 · Compound",
                "One add becomes leverage for the next. Log it, cite it, and the second station says yes faster. Rotation Command keeps that loop spinning every Monday, forever.",
              ],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={i * 90}>
                <div className="h-full bg-[#08080a] p-8 sm:p-10">
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.32em] text-[#c8a24a]">{t}</p>
                  <p className="mt-4 text-[1rem] leading-relaxed text-white/65">{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        <Rule />

        {/* THE LADDER */}
        <Section id="ladder">
          <Reveal>
            <Eyebrow>Access</Eyebrow>
            <h2 className="max-w-3xl text-[2.1rem] font-semibold leading-[1.05] tracking-tight sm:text-[3.2rem]">
              Three ways in. <Gold>Pick the level of pressure you want on your record.</Gold>
            </h2>
          </Reveal>
          <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-3">
            {LADDER.map((t, i) => (
              <Reveal key={t.id} delay={i * 120} className="h-full">
                <TierCard tier={t} onSelect={select} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={420}>
            <div className="mt-14 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-8 sm:p-11">
              <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-[#c8a24a]">
                    The 30-day action guarantee
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Contact five stations. If you still want out, you're out — with your money.
                  </h3>
                  <p className="mt-4 text-[0.96rem] leading-relaxed text-white/55">
                    No airplay required. No hoops. Just an honest attempt and an honest email. I don't want revenue from
                    someone who never opened the file — that's how you build a refund rate and a bad name, and I intend
                    to be here in ten years.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#c8a24a]/25 bg-black/40 p-6 text-center">
                  <p className="text-[0.7rem] uppercase tracking-[0.28em] text-white/40">Risk on you</p>
                  <p className="mt-2 text-5xl font-semibold tracking-tighter"><Gold>$0</Gold></p>
                  <p className="mt-3 text-[0.85rem] leading-relaxed text-white/45">
                    Risk on me: the full price, for 30 days, no matter which tier.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </Section>

        <Rule />

        {/* IDENTITY / CLOSE */}
        <Section>
          <Reveal>
            <div className="rounded-[2rem] border border-[#c8a24a]/25 bg-gradient-to-b from-[#15110a] to-[#07070a] p-8 sm:p-14">
              <Eyebrow>The real decision</Eyebrow>
              <h2 className="max-w-3xl text-[2rem] font-semibold leading-[1.08] tracking-tight sm:text-[3rem]">
                Twelve months from now you'll have made the same record twice — <Gold>or you'll have a rotation.</Gold>
              </h2>
              <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-white/60">
                Nothing about your talent changes today. What changes is whether the people who program music have ever
                heard your name. That is a logistics problem wearing a mystique costume. Solve the logistics and the
                mystique evaporates.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                <GoldButton onClick={jump}>Start with the Vault — {DOMINION.entryLabel}</GoldButton>
                <span className="text-[0.85rem] text-white/40">
                  Instant download · 30-day action guarantee · Stripe secured
                </span>
              </div>
            </div>
          </Reveal>
        </Section>

        {/* OBJECTIONS */}
        <Section id="answers">
          <Reveal>
            <Eyebrow>Straight answers</Eyebrow>
            <h2 className="text-[2.1rem] font-semibold leading-[1.05] tracking-tight sm:text-[3.2rem]">
              The questions you'd ask <Gold>if we were in a room.</Gold>
            </h2>
          </Reveal>
          <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
            {OBJECTIONS.map(([q, a], i) => (
              <Reveal key={q} delay={i * 60}>
                <details className="group py-6" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.05rem] font-medium text-white/90 transition hover:text-white">
                    {q}
                    <span className="shrink-0 text-[#c8a24a] transition group-open:rotate-45">＋</span>
                  </summary>
                  <p className="mt-4 max-w-3xl text-[0.98rem] leading-relaxed text-white/55">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </Section>

        <footer className="border-t border-white/[0.07] px-5 py-12 text-center sm:px-8">
          <p className="text-[0.7rem] uppercase tracking-[0.34em] text-white/30">
            {DOMINION.brand} · {DOMINION.system}
          </p>
          <p className="mx-auto mt-4 max-w-xl text-[0.78rem] leading-relaxed text-white/25">
            RadioReach provides research, contact data, and outreach systems. Airplay decisions are made by stations.
            Results depend on your record and your outreach.
          </p>
        </footer>
      </div>

      {/* STICKY CONVERSION BAR */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#050506]/92 px-4 py-3 backdrop-blur-xl transition-transform duration-500 ${
          sticky ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-[0.9rem] font-semibold">
              The Vault — <Gold>{DOMINION.entryLabel}</Gold>{" "}
              <span className="text-white/30 line-through">{DOMINION.entryAnchor}</span>
            </p>
            <p className="truncate text-[0.72rem] text-white/40">18,412 contacts · instant · 30-day guarantee</p>
          </div>
          <GoldButton size="sm" onClick={jump}>Get access</GoldButton>
        </div>
      </div>

      <ApplicationModal open={appOpen} onClose={() => setAppOpen(false)} />
    </div>
  );
}
