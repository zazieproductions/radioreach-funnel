import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFocusTrap, useLockBodyScroll } from "../a11y";

/* ─────────────────────────────────────────────
   COUNTDOWN
───────────────────────────────────────────── */

export function useCountdown(seconds: number, key = "zp_deadline") {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    let end = Number(sessionStorage.getItem(key));
    if (!end || Number.isNaN(end) || end < Date.now()) {
      end = Date.now() + seconds * 1000;
      sessionStorage.setItem(key, String(end));
    }
    const tick = () => {
      const diff = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setLeft(diff);
      if (diff === 0) {
        end = Date.now() + seconds * 1000;
        sessionStorage.setItem(key, String(end));
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [seconds, key]);

  return {
    h: Math.floor(left / 3600),
    m: Math.floor((left % 3600) / 60),
    s: left % 60,
    pad: (n: number) => String(n).padStart(2, "0"),
  };
}

/** Fixed-width, tabular digits — cannot cause layout shift as it ticks. */
export function FlipClock({ seconds = 897, size = "md" }: { seconds?: number; size?: "sm" | "md" }) {
  const { h, m, s, pad } = useCountdown(seconds);
  const digit = size === "sm" ? "text-lg sm:text-2xl" : "text-[1.35rem] sm:text-3xl";

  const Unit = ({ v, l }: { v: string; l: string }) => (
    <div className="flex flex-col items-center">
      <div
        className={`tnum rounded-md border border-white/10 bg-black px-1.5 py-1 font-display leading-none text-acid sm:px-2 sm:py-1.5 ${digit}`}
        style={{ minWidth: "2.4ch", textAlign: "center" }}
      >
        {v}
      </div>
      <span className="mt-1 text-[8px] uppercase tracking-[0.16em] text-white/60 sm:text-[9px] sm:tracking-[0.18em]">{l}</span>
    </div>
  );

  return (
    <div
      className="flex items-start gap-1.5"
      role="timer"
      aria-live="off"
      aria-label={`${h} hours ${m} minutes ${s} seconds remaining`}
    >
      <Unit v={pad(h)} l="hrs" />
      <span aria-hidden className={`pt-1 font-display leading-none text-blood ${digit}`}>:</span>
      <Unit v={pad(m)} l="min" />
      <span aria-hidden className={`pt-1 font-display leading-none text-blood ${digit}`}>:</span>
      <Unit v={pad(s)} l="sec" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATIC URGENCY STRIP (no marquee, no overflow)
───────────────────────────────────────────── */

export function Ticker() {
  const items = [
    "18,000+ radio station contacts",
    "1,940+ independent artists inside",
    "Price returns to $49 when the timer ends",
  ];
  return (
    <div className="border-y border-acid/25 bg-acid/10">
      <ul className="mx-auto flex min-h-9 max-w-5xl items-center justify-center px-3 py-1.5 text-center text-[10px] font-bold uppercase leading-snug tracking-[0.1em] text-acid sm:min-h-0 sm:gap-6 sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[0.14em]">
        {items.map((t, index) => (
          <li key={t} className={index === 0 ? "" : "hidden sm:list-item"}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOP NAV — anchor links, sticky, keyboard safe
───────────────────────────────────────────── */

const LINKS = [
  { href: "#inside", label: "What's inside" },
  { href: "#proof", label: "Results" },
  { href: "#faq", label: "FAQ" },
];

export function TopNav({ onCta }: { onCta: () => void }) {
  return (
    <header className="mobile-solid sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/80">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-12 max-w-5xl items-center gap-3 px-3 sm:h-14 sm:gap-4 sm:px-4"
      >
        <a href="#top" className="tap-target min-w-0 justify-start truncate font-display text-[0.95rem] tracking-wide text-white sm:text-lg">
          RADIO REACH <span className="ml-1 text-acid">VAULT</span>
        </a>

        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="pressable rounded-md px-3 py-2 text-[13px] font-semibold text-white/65 hover:bg-white/10 hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onCta}
          className="cta ml-auto shrink-0 rounded-lg bg-acid px-3 py-2 text-[12px] font-black uppercase tracking-wide text-ink sm:px-4 sm:text-[13px] md:ml-0"
        >
          Get access <span className="hidden min-[380px]:inline">— $20</span>
        </button>
      </nav>
    </header>
  );
}

/* ─────────────────────────────────────────────
   EXIT INTENT — desktop only, once, escapable
───────────────────────────────────────────── */

export function ExitIntent({
  onTake,
  title,
  body,
}: {
  onTake: () => void;
  /** Adaptive copy (EmotiveText) — falls back to the defaults below. */
  title?: ReactNode;
  body?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const fired = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(open, panelRef);
  useLockBodyScroll(open);

  useEffect(() => {
    // Pointer-based intent only. No timers, never on touch devices.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !fired.current) {
        fired.current = true;
        setOpen(true);
      }
    };
    document.addEventListener("mouseleave", onLeave);
    return () => document.removeEventListener("mouseleave", onLeave);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fade-in fixed inset-0 z-[70] grid place-items-center bg-black/85 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        aria-describedby="exit-body"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-xl border-2 border-acid bg-panel text-center"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close offer"
          className="pressable absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-xl text-white/70 hover:bg-white/10 hover:text-white"
        >
          ×
        </button>

        <p className="bg-blood py-2 text-[12px] font-black uppercase tracking-[0.18em]">
          Your founder price is still active
        </p>

        <div className="p-6 sm:p-8">
          <h2 id="exit-title" className="font-display text-3xl leading-tight sm:text-4xl">
            {title ?? (
              <>
                LEAVING MEANS PAYING <span className="text-blood line-through">$49</span> LATER
              </>
            )}
          </h2>
          <p id="exit-body" className="mt-3 text-[15px] leading-relaxed text-white/70">
            {body ?? "You're one click from 18,000+ radio station contacts."}
          </p>

          <div className="mt-5 flex justify-center">
            <FlipClock seconds={897} size="sm" />
          </div>

          <button
            type="button"
            onClick={onTake}
            className="cta mt-6 w-full rounded-lg bg-acid px-6 py-4 font-display text-xl uppercase tracking-wide text-ink"
          >
            Hold my $20 spot
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="tap-sm mt-3 w-full justify-center text-[13px] text-white/65 underline underline-offset-4 hover:text-white"
          >
            No thanks, take me back
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STICKY CTA BAR
───────────────────────────────────────────── */

export function StickyBar({
  onCta,
  label = "Get Instant Access — $20",
}: {
  onCta: () => void;
  /** String or adaptive copy (EmotiveText slot "stickyLabel"). */
  label?: ReactNode;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      const threshold = window.matchMedia("(max-width: 639px)").matches ? 380 : 700;
      raf = requestAnimationFrame(() => setShow(window.scrollY > threshold));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className={`mobile-solid safe-b fixed inset-x-0 bottom-0 z-50 border-t border-acid/40 bg-ink/98 backdrop-blur transition-transform duration-200 ${
        show ? "pointer-events-auto translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-3 py-2 sm:gap-3 sm:py-2.5">
        <div className="hidden shrink-0 sm:block">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blood">Founder price ends in</p>
          <FlipClock seconds={897} size="sm" />
        </div>
        <div className="hidden shrink-0 flex-col justify-center min-[400px]:flex sm:hidden">
          <p className="text-[9px] font-bold uppercase tracking-wider text-blood">Ends in</p>
          <p className="tnum font-display text-sm leading-none text-acid">
            <span className="line-through opacity-50">$49</span> $20
          </p>
        </div>
        <div className="min-w-0 flex-1 sm:ml-auto sm:flex-none">
          <button
            onClick={onCta}
            tabIndex={show ? 0 : -1}
            className="cta w-full rounded-lg bg-acid px-4 py-3 font-display text-[0.98rem] uppercase leading-tight tracking-wide text-ink sm:w-auto sm:px-8 sm:py-3.5 sm:text-lg"
          >
            {label}
          </button>
          <p className="mt-1 text-center text-[10px] text-white/45">
            <span className="line-through">$49</span> · instant download · 30-day refund
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SMALL PIECES
───────────────────────────────────────────── */

export function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 sm:gap-3">
      <span aria-hidden className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-acid text-[12px] font-black text-ink">
        ✓
      </span>
      <span className="min-w-0 leading-snug">{children}</span>
    </li>
  );
}

export function Cross({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-white/55 sm:gap-3">
      <span aria-hidden className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blood/80 text-[12px] font-black text-white">
        ✕
      </span>
      <span className="min-w-0 leading-snug">{children}</span>
    </li>
  );
}

export function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="text-acid" aria-label={`${n} out of 5 stars`}>
      <span aria-hidden>{"★".repeat(n)}{"☆".repeat(5 - n)}</span>
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-acid sm:mb-3 sm:text-[11px] sm:tracking-[0.24em]">{children}</p>;
}
