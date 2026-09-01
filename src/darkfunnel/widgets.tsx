/* ─────────────────────────────────────────────────────────────
   DARK FUNNEL TEARDOWN — the widget shelf
   ─────────────────────────────────────────────────────────────
   Countdown, seat decay, live viewers, social-proof toasts,
   exit-intent, sticky CTA, support chat, progress bar, fake
   terminal. Each one is wrapped in <Xray> at its call site so
   the teardown can name it while it runs.

   Every "live" number here is a pure function of (seed, elapsed).
   Nothing polls anything. That is the finding, not a shortcut.
───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CHAT,
  EXIT_INTENT,
  STICKY,
} from "./copy";
import {
  CTA_SCROLL_THRESHOLD,
  analysisScript,
  countdownRemaining,
  formatClock,
  honestProgressPct,
  mulberry32,
  rollingDeadline,
  scrollDepth,
  seatsLeft,
  shouldShowCta,
  toastSchedule,
  viewerCount,
  type TerminalLine,
} from "./core";
import { useFunnel } from "./state";
import { Xray } from "./xray";

/* ── shared clock ───────────────────────────────────────── */

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

/* ── 1. the countdown that never ends ───────────────────── */

const WINDOW_MS = 9 * 60 * 1000;

export function useDeadline() {
  const { startedAt } = useFunnel();
  const now = useNow(1000);
  const end = rollingDeadline(startedAt, WINDOW_MS, now);
  return { secondsLeft: countdownRemaining(end, now), label: formatClock(countdownRemaining(end, now)) };
}

export function Countdown({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { label } = useDeadline();
  const cls =
    size === "lg"
      ? "text-4xl sm:text-5xl"
      : size === "sm"
        ? "text-base"
        : "text-2xl";
  return (
    <span
      className={`tnum font-display leading-none text-acid ${cls}`}
      role="timer"
      aria-live="off"
    >
      {label}
    </span>
  );
}

/* ── 2. decaying seats ──────────────────────────────────── */

export function useSeats() {
  const { startedAt, seed } = useFunnel();
  const now = useNow(1000);
  const start = 38 + (seed % 9);
  return seatsLeft({ start, floor: 3, intervalMs: 26_000 }, now - startedAt);
}

export function SeatMeter() {
  const seats = useSeats();
  const pct = Math.max(4, Math.min(100, (seats / 47) * 100));
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.16em] text-white/50">
        <span>Allocations remaining</span>
        <span className="tnum font-bold text-blood">{seats}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blood to-acid transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── 3. live viewers (a bounded random walk) ────────────── */

export function useViewers() {
  const { seed } = useFunnel();
  const rand = useMemo(() => mulberry32(seed), [seed]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((v) => v + 1), 4200);
    return () => window.clearInterval(t);
  }, []);
  return viewerCount({ base: 63, spread: 14 }, tick, rand);
}

export function ViewerCount() {
  const viewers = useViewers();
  return (
    <span className="inline-flex items-center gap-2 text-xs text-white/60">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 df-pulse" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <span className="tnum font-semibold text-white/85">{viewers}</span> reading
      this page now
    </span>
  );
}

/* ── the whole scarcity rail, one import ────────────────── */

export function ScarcityRail() {
  return (
    <div
      className="sticky z-40 border-b border-white/10 bg-ink/95 backdrop-blur"
      style={{ top: "var(--df-bar-h, 0px)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <Xray id="rolling-countdown" below className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">
            Screening closes
          </span>
          <Countdown size="sm" />
        </Xray>

        <Xray id="seat-decay" below className="min-w-[9rem] flex-1">
          <SeatMeter />
        </Xray>

        <Xray id="live-viewers" below className="hidden sm:block">
          <ViewerCount />
        </Xray>
      </div>
    </div>
  );
}

/* ── 4. social-proof toasts ─────────────────────────────── */

type LiveToast = { key: number; name: string; city: string; action: string; ago: string };

export function SocialToasts() {
  const { seed } = useFunnel();
  const [visible, setVisible] = useState<LiveToast[]>([]);
  const schedule = useMemo(() => toastSchedule(seed, 14), [seed]);

  useEffect(() => {
    const timers: number[] = [];
    for (const t of schedule) {
      timers.push(
        window.setTimeout(() => {
          setVisible((v) => [...v, { key: t.id, name: t.name, city: t.city, action: t.action, ago: t.ago }]);
          timers.push(
            window.setTimeout(
              () => setVisible((v) => v.filter((x) => x.key !== t.id)),
              6200,
            ),
          );
        }, t.atMs),
      );
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [schedule]);

  if (visible.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 left-3 z-40 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col gap-2 sm:bottom-6">
      {visible.slice(-2).map((t) => (
        <Xray key={t.key} id="social-toasts" className="pointer-events-auto">
          <div className="df-toast flex items-center gap-3 rounded-lg border border-white/12 bg-panel/95 px-3 py-2.5 shadow-2xl backdrop-blur">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-acid/80 to-blood/70 text-[11px] font-black text-ink">
              {t.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] leading-tight text-white">
                <span className="font-semibold">{t.name}</span> from {t.city}{" "}
                <span className="text-white/70">{t.action}</span>
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/40">
                {t.ago} · verified
              </p>
            </div>
          </div>
        </Xray>
      ))}
    </div>
  );
}

/* ── 5. scroll depth + the gated sticky CTA ─────────────── */

export function useScrollDepth(): number {
  const [depth, setDepth] = useState(0);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      setDepth(
        scrollDepth(
          window.scrollY,
          window.innerHeight,
          document.documentElement.scrollHeight,
        ),
      );
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return depth;
}

/**
 * The bar does not exist until the visitor is 35% down the page.
 * `showCta` is one boolean and it is the difference between
 * "an ad" and "a helpful shortcut".
 */
export function StickyCta({ onCta, light = false }: { onCta: () => void; light?: boolean }) {
  const depth = useScrollDepth();
  const showCta = shouldShowCta(depth);
  const { teardown } = useFunnel();
  const { label } = useDeadline();

  if (!showCta) {
    return teardown ? (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-dashed border-xray/60 bg-black/70 px-4 py-2 text-center font-mono text-[11px] text-xray">
        sticky CTA suppressed — scroll depth {(depth * 100).toFixed(0)}% ≤ {CTA_SCROLL_THRESHOLD * 100}%
      </div>
    ) : null;
  }

  return (
    <Xray
      id="sticky-mobile-cta"
      className="fixed bottom-0 left-0 right-0 z-40"
    >
      <div
        className={`df-rise flex items-center gap-3 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
          light
            ? "border-rule bg-white/95 backdrop-blur"
            : "border-white/12 bg-ink/95 backdrop-blur"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p
            className={`text-[10px] uppercase tracking-[0.16em] ${light ? "text-black/50" : "text-white/45"}`}
          >
            {STICKY.label} <span className="tnum font-bold text-blood">{label}</span>
          </p>
          <p
            className={`truncate text-[13px] font-semibold ${light ? "text-black" : "text-white"}`}
          >
            {STICKY.sub}
          </p>
        </div>
        <button
          type="button"
          onClick={onCta}
          className="shrink-0 rounded-md bg-acid px-4 py-2.5 text-[13px] font-black uppercase tracking-wide text-ink transition hover:brightness-95 active:scale-[0.98]"
        >
          {STICKY.cta}
        </button>
      </div>
    </Xray>
  );
}

/* ── 6. exit intent ─────────────────────────────────────── */

export function ExitIntent({ onStay }: { onStay: () => void }) {
  const [open, setOpen] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    const onLeave = (e: MouseEvent) => {
      if (fired.current) return;
      // cursor exiting through the top edge → tab bar / address bar
      if (e.clientY > 6) return;
      fired.current = true;
      setOpen(true);
    };
    // give the visitor a moment first; instant modals read as popups
    const arm = window.setTimeout(
      () => document.addEventListener("mouseout", onLeave),
      6000,
    );
    return () => {
      window.clearTimeout(arm);
      document.removeEventListener("mouseout", onLeave);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="df-exit-title"
    >
      <Xray id="exit-intent" className="w-full max-w-lg">
        <div className="df-rise rounded-xl border border-blood/40 bg-panel p-6 shadow-2xl sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blood">
            Hold on
          </p>
          <h2
            id="df-exit-title"
            className="mt-2 font-display text-3xl uppercase leading-[0.95] text-white sm:text-4xl"
          >
            {EXIT_INTENT.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            {EXIT_INTENT.body}
          </p>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onStay();
            }}
            className="mt-6 w-full rounded-lg bg-acid px-5 py-4 text-base font-black uppercase tracking-wide text-ink transition hover:brightness-95"
          >
            {EXIT_INTENT.stayCta}
          </button>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mx-auto mt-3 block text-[11px] lowercase text-white/35 underline underline-offset-2 hover:text-white/55"
          >
            {EXIT_INTENT.leaveCta}
          </button>

          <p className="mt-5 border-t border-white/10 pt-3 font-mono text-[10px] leading-relaxed text-white/30">
            {EXIT_INTENT.footnote}
          </p>
        </div>
      </Xray>
    </div>
  );
}

/* ── 7. support chat ────────────────────────────────────── */

type ChatMsg = { from: "agent" | "you"; text: string };

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [log, setLog] = useState<ChatMsg[]>([{ from: "agent", text: CHAT.greeting }]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setNudge(true), 22_000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [log, typing]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setLog((l) => [...l, { from: "you", text }]);
    setTyping(true);
    const lower = text.toLowerCase();
    const hit = CHAT.replies.find((r) => r.match.some((m) => lower.includes(m)));
    window.setTimeout(
      () => {
        setTyping(false);
        setLog((l) => [...l, { from: "agent", text: hit ? hit.text : CHAT.fallback }]);
      },
      1100 + text.length * 22,
    );
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setNudge(false);
          }}
          className="fixed bottom-20 right-3 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-panel/95 py-2.5 pl-2.5 pr-4 shadow-2xl backdrop-blur transition hover:border-white/30 sm:bottom-4"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-black text-ink">
            {CHAT.agent.slice(0, 1)}
          </span>
          <span className="text-[13px] font-semibold text-white">
            {nudge ? "Need a hand?" : "Chat"}
          </span>
          {nudge && (
            <span className="h-2 w-2 rounded-full bg-blood df-pulse" aria-hidden />
          )}
        </button>
      )}

      {open && (
        <Xray
          id="support-chat"
          className="fixed bottom-20 right-3 z-50 w-[min(21rem,calc(100vw-1.5rem))] sm:bottom-4"
        >
          <div className="flex h-[26rem] flex-col overflow-hidden rounded-xl border border-white/12 bg-panel shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-white/10 bg-white/[0.04] px-3 py-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-black text-ink">
                {CHAT.agent.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-tight text-white">
                  {CHAT.agent}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-emerald-400">
                  online now
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded px-2 py-1 text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div ref={bodyRef} className="flex-1 space-y-2.5 overflow-y-auto p-3">
              {log.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                    m.from === "agent"
                      ? "bg-white/8 text-white/85"
                      : "ml-auto bg-acid text-ink"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {typing && (
                <div className="max-w-[60%] rounded-2xl bg-white/8 px-3 py-2 text-[13px] text-white/50">
                  <span className="df-pulse">{CHAT.agent} is typing…</span>
                </div>
              )}
            </div>

            <form
              className="flex gap-2 border-t border-white/10 p-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about the price…"
                className="min-w-0 flex-1 rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:border-acid/60 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-white/10 px-3 py-2 text-[13px] font-semibold text-white hover:bg-white/20"
              >
                Send
              </button>
            </form>
          </div>
        </Xray>
      )}
    </>
  );
}

/* ── 8. the progress bar ────────────────────────────────── */

export function ProgressRail({
  pct,
  step,
  total,
  phase,
}: {
  pct: number;
  step: number;
  total: number;
  phase: "quiz" | "lead" | "result";
}) {
  const { teardown } = useFunnel();
  const honest = honestProgressPct(step, total);

  return (
    <Xray id="progress-fiction" below className="w-full">
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.18em] text-white/45">
        <span>
          {phase === "quiz"
            ? `Question ${Math.min(step + 1, total)} of ${total}`
            : phase === "lead"
              ? "Final step"
              : "Screening complete"}
        </span>
        <span className="tnum text-acid">{Math.round(pct)}%</span>
      </div>
      <div className="relative mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-acid via-acid to-emerald-400 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
        {teardown && phase === "quiz" && (
          <div
            className="absolute inset-y-0 w-[2px] bg-xray"
            style={{ left: `${honest}%` }}
            title={`honest progress: ${honest.toFixed(1)}%`}
          />
        )}
      </div>
      {teardown && (
        <p className="mt-1 font-mono text-[10px] text-xray">
          {phase === "quiz"
            ? `shown ${pct.toFixed(1)}% = ${step}/(${total}+1) · honest ${honest.toFixed(1)}% · distortion −${(honest - pct).toFixed(1)}pt`
            : phase === "lead"
              ? "hard-set 85% — not derived from anything"
              : "hard-set 100%"}
        </p>
      )}
    </Xray>
  );
}

/* ── 9. the fake analysis terminal ──────────────────────── */

export function AnalysisTerminal({
  profile,
  seed,
  onDone,
}: {
  profile: { firstName: string; score: number; tier: string };
  seed: number;
  onDone: () => void;
}) {
  const script = useMemo(() => analysisScript(profile, seed), [profile, seed]);
  const [shown, setShown] = useState<TerminalLine[]>([]);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const timers = script.map((line, i) =>
      window.setTimeout(() => {
        setShown((s) => [...s, line]);
        if (i === script.length - 1) {
          window.setTimeout(() => doneRef.current(), 900);
        }
      }, line.atMs),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [script]);

  const color: Record<TerminalLine["kind"], string> = {
    info: "text-white/55",
    ok: "text-emerald-400",
    warn: "text-amber-400",
  };

  return (
    <Xray id="labour-illusion" className="w-full">
      <div className="df-terminal min-h-[15rem] rounded-lg border border-emerald-400/20 p-4 font-mono text-[12px] leading-relaxed sm:text-[13px]">
        {shown.map((l, i) => (
          <p key={i} className={`${color[l.kind]} df-rise`}>
            {l.text}
          </p>
        ))}
        <p className="df-caret text-emerald-400/70" />
      </div>
    </Xray>
  );
}
