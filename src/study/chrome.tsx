/* ─────────────────────────────────────────────────────────────
   PERSUASION STUDY — persistent chrome
   ─────────────────────────────────────────────────────────────
   The widgets that follow the visitor across every stage:
   countdown, seat decay, live viewers, social-proof toasts,
   exit-intent shame modal, sticky mobile CTA, support chat.

   Each one registers a `trip` the first time it actually fires
   on this visitor, so the debrief can prove it happened rather
   than merely assert it.
───────────────────────────────────────────────────────────── */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  decaySeat,
  driftViewers,
  formatRemaining,
  pace,
  rearmDeadlineIfExpired,
  remainingMs,
  trip,
  useStudy,
} from "./state";
import { Annotated } from "./Annotate";

/* ═══════════════════════════════════════════════════════════
   COUNTDOWN
═══════════════════════════════════════════════════════════ */

export function useTicker(intervalMs = 1000) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
}

export function Countdown({ compact = false }: { compact?: boolean }) {
  useTicker(1000);
  const left = remainingMs();

  useEffect(() => {
    rearmDeadlineIfExpired();
  });

  const label = formatRemaining(left);
  const urgent = left < 120_000;

  return (
    <span
      role="timer"
      aria-live="off"
      className={`tnum inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono font-bold ${
        urgent ? "border-blood/60 bg-blood/15 text-blood" : "border-acid/40 bg-acid/10 text-acid"
      } ${compact ? "text-[11px]" : "text-sm"}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${urgent ? "bg-blood" : "bg-acid"} animate-pulse`} />
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCARCITY RAIL — seats + viewers
═══════════════════════════════════════════════════════════ */

export function ScarcityRail() {
  const s = useStudy();

  // Seats decay on an irregular schedule so the fall feels organic.
  useEffect(() => {
    let cancelled = false;
    const schedule = () => {
      const wait = pace(11_000 + Math.random() * 17_000);
      window.setTimeout(() => {
        if (cancelled) return;
        decaySeat();
        schedule();
      }, wait);
    };
    schedule();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => driftViewers(), pace(4200));
    return () => window.clearInterval(t);
  }, []);

  const pctGone = Math.round(((41 - s.seats) / 41) * 100);

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] sm:gap-3">
      <Annotated pattern="seat_decay" as="span">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-blood/40 bg-blood/10 px-2 py-1 font-bold text-blood">
          <span className="tnum">{s.seats}</span> seats left
          <span className="hidden text-white/35 sm:inline">· {pctGone}% claimed</span>
        </span>
      </Annotated>
      <Annotated pattern="live_viewer_count" as="span">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 font-bold text-white/70">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
          <span className="tnum">{s.viewers}</span> reading now
        </span>
      </Annotated>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SOCIAL-PROOF TOASTS
═══════════════════════════════════════════════════════════ */

const TOAST_PEOPLE = [
  ["Marcus", "Detroit, MI", "unlocked access"],
  ["Aiyana", "Portland, OR", "cleared the assessment"],
  ["Tomás", "Austin, TX", "unlocked access"],
  ["Priya", "Brooklyn, NY", "took the last seat in her market"],
  ["Devon", "Atlanta, GA", "added the Deliverability Layer"],
  ["Saoirse", "Dublin, IE", "unlocked access"],
  ["Kwame", "Chicago, IL", "cleared the assessment"],
  ["Lena", "Berlin, DE", "unlocked access"],
  ["Rosa", "Miami, FL", "added the Deliverability Layer"],
  ["Jonas", "Seattle, WA", "unlocked access"],
] as const;

type Toast = { id: number; name: string; city: string; action: string; ago: string };

export function SocialProofToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const schedule = (first = false) => {
      const wait = first ? pace(6_000) : pace(9_000 + Math.random() * 11_000);
      window.setTimeout(() => {
        if (cancelled) return;
        const [name, city, action] =
          TOAST_PEOPLE[Math.floor(Math.random() * TOAST_PEOPLE.length)];
        const id = ++idRef.current;
        const ago = `${Math.floor(Math.random() * 6) + 1} min ago`;
        setToasts((t) => [...t.slice(-2), { id, name, city, action, ago }]);
        trip(
          "social_proof_toasts",
          "A purchase notification for a person who does not exist appeared in your peripheral vision."
        );
        window.setTimeout(() => {
          setToasts((t) => t.filter((x) => x.id !== id));
        }, pace(6_500));
        schedule();
      }, wait);
    };
    schedule(true);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-24 left-3 z-40 flex w-[min(19rem,calc(100vw-1.5rem))] flex-col gap-2 sm:bottom-6"
    >
      {toasts.map((t) => (
        <Annotated key={t.id} pattern="social_proof_toasts">
          <div className="pointer-events-auto animate-[studyToastIn_260ms_ease-out] rounded-lg border border-white/10 bg-panel/95 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur">
            <p className="text-[12px] leading-snug text-white/85">
              <b className="text-acid">{t.name}</b> {t.action}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/35">
              {t.city} · {t.ago}
            </p>
          </div>
        </Annotated>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EXIT-INTENT SHAME MODAL
═══════════════════════════════════════════════════════════ */

export function ExitIntentModal({ onStay }: { onStay: () => void }) {
  const [open, setOpen] = useState(false);
  const firedRef = useRef(false);
  const s = useStudy();

  const fire = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    setOpen(true);
    trip(
      "exit_intent_shame",
      "You tried to leave. A full-screen interstitial blocked the exit and made you click a self-critical sentence to escape."
    );
  }, []);

  useEffect(() => {
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 2) fire();
    };
    // Mobile analogue: a hard upward flick near the top of the page.
    let lastY = 0;
    const onTouch = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      if (lastY && y - lastY > 90 && window.scrollY < 40) fire();
      lastY = y;
    };
    document.addEventListener("mouseout", onLeave);
    document.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      document.removeEventListener("mouseout", onLeave);
      document.removeEventListener("touchmove", onTouch);
    };
  }, [fire]);

  if (!open) return null;

  const name = s.lead?.name ? `, ${s.lead.name}` : "";

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4 backdrop-blur-sm">
      <Annotated pattern="exit_intent_shame" className="w-full max-w-lg">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Before you go"
          className="w-full rounded-2xl border-2 border-blood/50 bg-panel p-6 shadow-[0_30px_90px_rgba(0,0,0,0.8)] sm:p-8"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blood">
            Wait{name}
          </p>
          <h2 className="mt-3 font-display text-3xl leading-[1.05] sm:text-4xl">
            YOU GOT THIS FAR AND STOPPED.
          </h2>
          <p className="mt-4 font-serif text-[15px] leading-relaxed text-white/75">
            {s.selfPrediction
              ? `Forty seconds ago you said: “${s.selfPrediction}”. The door is open. It closes when the timer does.`
              : "Everyone who leaves this page says they'll come back later. The seat does not wait, and the assessment does not run twice."}
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
            <Countdown />
            <span className="text-[11px] text-white/45">
              {s.seats} seats · {s.viewers} people on this page
            </span>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              onStay();
            }}
            className="cta mt-6 w-full rounded-lg bg-acid px-5 py-4 font-display text-xl uppercase tracking-wide text-ink"
          >
            Keep my seat
          </button>

          <Annotated pattern="confirmshaming_decline" as="div" className="mt-4 text-center">
            <button
              onClick={() => setOpen(false)}
              className="text-[10px] leading-tight text-white/25 underline decoration-white/15 underline-offset-2"
            >
              No thanks — I'll keep doing the thing that hasn't worked
            </button>
          </Annotated>
        </div>
      </Annotated>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STICKY MOBILE CTA
═══════════════════════════════════════════════════════════ */

export function StickyCta({
  label,
  sub,
  onClick,
  visible = true,
}: {
  label: string;
  sub?: string;
  onClick: () => void;
  visible?: boolean;
}) {
  useEffect(() => {
    if (visible) {
      trip(
        "sticky_mobile_cta",
        "A non-dismissible action bar tracked your thumb for the entire session."
      );
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Annotated
      pattern="sticky_mobile_cta"
      className="fixed inset-x-0 bottom-0 z-50"
    >
      <div className="border-t border-white/10 bg-panel/95 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur mobile-solid">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="truncate text-[11px] font-bold uppercase tracking-wider text-white/55">
              {sub}
            </p>
            <Countdown compact />
          </div>
          <button
            onClick={onClick}
            className="cta w-full rounded-lg bg-acid px-4 py-3.5 font-display text-base uppercase leading-tight tracking-wide text-ink sm:w-auto sm:flex-1"
          >
            {label}
            <span className="mt-0.5 block text-[10px] font-sans font-bold tracking-normal opacity-70 sm:hidden">
              {sub}
            </span>
          </button>
        </div>
      </div>
    </Annotated>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUPPORT CHAT THEATER
═══════════════════════════════════════════════════════════ */

type ChatLine = { from: "them" | "you"; text: string };

const CANNED: { match: RegExp; reply: string }[] = [
  {
    match: /refund|money back|guarantee/i,
    reply:
      "Totally understand. There's a 30-day window — but honestly, almost nobody uses it once they see the market list. Want me to hold your seat while you decide?",
  },
  {
    match: /real|scam|legit|fake/i,
    reply:
      "Ha — fair question, we get it a lot. I've been on the team two years. The assessment is what filters people, not the price. Did you already complete it?",
  },
  {
    match: /price|cost|how much|\$/i,
    reply:
      "It's $29 today, and that's tied to the current window rather than a permanent price. I can't extend the timer from my side, sorry.",
  },
  {
    match: /human|bot|who am i talking/i,
    reply: "I'm here! Give me one sec, I'm with another artist too. What's the question?",
  },
];

const FALLBACK =
  "Good question — the fastest path is to finish the assessment, that's what unlocks the market data for your city. Want the link?";

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [lines, setLines] = useState<ChatLine[]>([]);
  const bootedRef = useRef(false);

  // Unprompted "agent" message — the oldest trick in the widget.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (bootedRef.current) return;
      bootedRef.current = true;
      setUnread(1);
      setLines([
        {
          from: "them",
          text: "Hey — saw you looking at the assessment. Anything I can answer before your window closes?",
        },
      ]);
      trip(
        "support_chat_theater",
        "A scripted widget with a human photo messaged you first and was never disclosed as automated."
      );
    }, pace(26_000));
    return () => window.clearTimeout(t);
  }, []);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setLines((l) => [...l, { from: "you", text }]);
    setTyping(true);
    const reply = CANNED.find((c) => c.match.test(text))?.reply ?? FALLBACK;
    window.setTimeout(() => {
      setTyping(false);
      setLines((l) => [...l, { from: "them", text: reply }]);
    }, pace(1400 + text.length * 22));
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen((o) => !o);
          setUnread(0);
        }}
        aria-label="Support chat"
        className="cta fixed bottom-24 right-3 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-panel text-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] sm:bottom-6"
      >
        <span aria-hidden>💬</span>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-blood text-[10px] font-black">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <Annotated
          pattern="support_chat_theater"
          className="fixed bottom-40 right-3 z-50 w-[min(20rem,calc(100vw-1.5rem))] sm:bottom-24"
        >
          <div className="overflow-hidden rounded-xl border border-white/12 bg-panel shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-3 py-2.5">
              <img
                src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=64&h=64"
                alt=""
                aria-hidden
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover ring-2 ring-acid/40"
              />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold">Dana · Artist Support</p>
                <p className="text-[10px] text-green-400">online now</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="ml-auto text-white/40"
              >
                ✕
              </button>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto p-3">
              {lines.map((l, i) => (
                <p
                  key={i}
                  className={`max-w-[85%] rounded-lg px-2.5 py-2 text-[12px] leading-snug ${
                    l.from === "them"
                      ? "bg-white/8 text-white/85"
                      : "ml-auto bg-acid/90 text-ink"
                  }`}
                >
                  {l.text}
                </p>
              ))}
              {typing && (
                <p className="w-14 rounded-lg bg-white/8 px-2.5 py-2 text-[12px] text-white/50">
                  <span className="animate-pulse">• • •</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-white/10 p-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message…"
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-2.5 py-2 text-[12px] text-white placeholder:text-white/25"
              />
              <button
                onClick={send}
                className="rounded-md bg-acid px-3 py-2 text-[11px] font-black uppercase text-ink"
              >
                Send
              </button>
            </div>
          </div>
        </Annotated>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROGRESS BAR (the completion hypnotic)
═══════════════════════════════════════════════════════════ */

export function ProgressBar({
  pct,
  caption,
}: {
  pct: number;
  caption?: ReactNode;
}) {
  return (
    <Annotated pattern="progress_fiction" as="div">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
        <span>{caption}</span>
        <span className="tnum text-acid">{Math.round(pct)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-acid transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </Annotated>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED BITS
═══════════════════════════════════════════════════════════ */

export function Stars({ n = 5 }: { n?: number }) {
  return (
    <span aria-label={`${n} out of 5 stars`} className="text-[13px] tracking-tight text-acid">
      {"★".repeat(n)}
      <span className="text-white/15">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span aria-hidden className="mt-0.5 shrink-0 font-black text-acid">
        ✓
      </span>
      <span className="text-white/80">{children}</span>
    </li>
  );
}

/** The tiny, low-contrast, first-person decline link. */
export function GuiltDecline({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Annotated pattern="confirmshaming_decline" as="div" className="mt-5 text-center">
      <button
        onClick={onClick}
        className="max-w-full text-[10px] leading-tight text-white/25 underline decoration-white/15 underline-offset-2 transition hover:text-white/40"
      >
        {children}
      </button>
    </Annotated>
  );
}

/** Formats the memoized quiz answer for guilt callbacks. */
export function usePredictionQuote(): string | null {
  const s = useStudy();
  return useMemo(() => s.selfPrediction, [s.selfPrediction]);
}
