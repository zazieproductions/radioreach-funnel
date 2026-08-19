import { useEffect, useRef, useState } from "react";
import { SectionLabel } from "./ui";
import {
  REEL_LENGTH,
  REEL_COUNT,
  VISIBLE_ROWS,
  PAYLINE_INDEX,
  SECRET_SYMBOL,
  NEAR_MISS_SYMBOL,
  SECRET_INDEX,
  NEAR_MISS_INDEX,
  SECRET_ODDS,
  SYMBOL_STYLE,
  symbolAtRow,
  isSecretCombo,
  reelStopForSymbol,
  nudgeToPayline,
  rewindOffset,
  type ReelSymbol,
} from "../lib/slots";
import { PLAYLISTPUSH_CODE } from "../lib/secretCode";

// Visual language — vibrant carnival gradients shared with the lucky wheel:
// the machine is the colorful thing you can't help but pull. Structure stays
// clean (line-art glyphs, slim typography) so it reads vibrant, not messy.
const RAINBOW_CONIC =
  "conic-gradient(from 0deg,#EF4444,#FB923C,#FACC15,#34D399,#22D3EE,#60A5FA,#A78BFA,#F472B6,#EF4444)";
const RAINBOW_LINEAR_90 =
  "linear-gradient(90deg,#EF4444,#FB923C,#FACC15,#34D399,#22D3EE,#60A5FA,#A78BFA,#F472B6,#EF4444)";
const RAINBOW_LINEAR_135 =
  "linear-gradient(135deg,#FACC15,#FB923C,#F472B6,#A78BFA,#22D3EE,#34D399)";
const RAINBOW_TEXT =
  "linear-gradient(90deg,#FACC15,#FB923C,#F472B6,#A78BFA,#22D3EE,#FACC15)";

// Reel geometry — one strip per reel, ROW_H-tall tiles, repeated symbol
// cycles so the strip is always taller than the largest translate.
const ROW_H = 44;
const STRIP_CYCLES = 8;
const STRIP_ROWS = REEL_LENGTH * STRIP_CYCLES; // 64 rows per strip
const MAX_STRIP_OFFSET = STRIP_ROWS - 4; // keep the window inside the strip

// Choreography (mirrors the wheel's near-miss → jackpot arc):
// reels stop one by one (1 → 2 → 3 locked), a beat of suspense, then the
// third reel clicks one row from LOCK to KEY with a rising ding.
const REEL_0_MS = 2000;
const REEL_1_DELAY = 150;
const REEL_1_MS = 2500;
const REEL_2_DELAY = 300;
const REEL_2_MS = 2900;
const NEAR_MISS_AT = REEL_2_DELAY + REEL_2_MS; // third reel rests on LOCK
const NUDGE_AT = NEAR_MISS_AT + 480; // hesitation
const NUDGE_MS = 720;
const REVEAL_AT = NUDGE_AT + NUDGE_MS + 60;

const SPIN_EASING = "cubic-bezier(0.22, 0.85, 0.24, 1)";
const NUDGE_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// Motion for the cabinet. Reduced-motion users get all of it collapsed by
// the global `prefers-reduced-motion` rule — content stays.
const KEYFRAME_CSS = `
@keyframes slotChase{0%,100%{opacity:.15}50%{opacity:1}}
.slot-chase-idle{animation:slotChase 2s ease-in-out infinite}
.slot-chase-spinning{animation:slotChase .5s linear infinite}
.slot-chase-nearMiss{animation:slotChase .9s ease-in-out infinite}
.slot-chase-reveal{animation:slotChase .3s linear infinite}
@keyframes gradientFlow{to{background-position:200% center}}
@keyframes reelBlur{0%{filter:blur(0px)}50%{filter:blur(1.6px)}100%{filter:blur(0px)}}
@keyframes settleThunk{0%{transform:translateY(-4px)}45%{transform:translateY(2px)}70%{transform:translateY(-1px)}100%{transform:translateY(0)}}
@keyframes shineSweep{0%{transform:translateX(-150%) skewX(-18deg)}100%{transform:translateX(260%) skewX(-18deg)}}
@keyframes winFlash{0%,100%{filter:brightness(1)}50%{filter:brightness(1.14)}}
@keyframes keyPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
@keyframes burstRing{0%{transform:translate(-50%,-50%) scale(.15);opacity:.9}100%{transform:translate(-50%,-50%) scale(2.6);opacity:0}}
@keyframes codeGlow{0%,100%{box-shadow:0 0 0 rgba(255,230,0,0)}50%{box-shadow:0 0 22px rgba(255,230,0,.4)}}
@keyframes slotCardIn{0%{opacity:0;transform:scale(.97) translateY(8px)}100%{opacity:1;transform:scale(1) translateY(0)}}
`;

const LIGHT_COLORS = ["#FACC15", "#FB923C", "#F87171", "#F472B6", "#A78BFA", "#22D3EE", "#38BDF8", "#34D399"];

// audio — soft, not harsh (same helpers as the lucky wheel)
let _audioCtx: AudioContext | null = null;
function getAudio() {
  if (typeof window === "undefined") return null;
  if (_audioCtx) return _audioCtx;
  try {
    const Ctx = (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    _audioCtx = new Ctx();
    if (_audioCtx.state === "suspended") _audioCtx.resume().catch(() => {});
    return _audioCtx;
  } catch {
    return null;
  }
}
function playTick(intensity = 1) {
  const ctx = getAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 820 + Math.random() * 60;
  gain.gain.value = 0.06 * intensity;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc.start(now);
  osc.stop(now + 0.06);
}
function playRisingDing() {
  const ctx = getAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(1320, now + 0.5);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.9);
}
function playNearMissTick() {
  playTick(0.5);
  setTimeout(() => playTick(0.7), 120);
}
function playWinChime() {
  const ctx = getAudio();
  if (!ctx) return;
  const notes = [880, 1174, 1568];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const at = ctx.currentTime + i * 0.11;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.12, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.45);
  });
}

// Line-art glyphs — clean shapes, but each one glows its own vivid color.
function SymbolGlyph({ id, className = "" }: { id: ReelSymbol; className?: string }) {
  const s = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "note":
      return (
        <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden>
          <path d="M9 17.5V5l10-2v12.5" />
          <circle cx="6.8" cy="17.5" r="2.3" />
          <circle cx="16.8" cy="15.5" r="2.3" />
        </svg>
      );
    case "disc":
      return (
        <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden>
          <circle cx="12" cy="12" r="8.2" />
          <circle cx="12" cy="12" r="2.1" />
          <path d="M12 3.8v3" />
        </svg>
      );
    case "mic":
      return (
        <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden>
          <rect x="9.2" y="2.8" width="5.6" height="10.6" rx="2.8" />
          <path d="M5 10.8a7 7 0 0 0 14 0" />
          <path d="M12 17.8v3.4" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden>
          <path d="M12 3.2l2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.6-5 2.6 1-5.6-4.1-4 5.6-.8z" />
        </svg>
      );
    case "tower":
      return (
        <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden>
          <path d="M12 2.8V21" />
          <path d="M7.6 7.6a4.4 4.4 0 0 0 0 5.8" />
          <path d="M16.4 7.6a4.4 4.4 0 0 1 0 5.8" />
          <path d="M9 21h6" />
        </svg>
      );
    case "headphones":
      return (
        <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden>
          <path d="M4 13.5v-1a8 8 0 0 1 16 0v1" />
          <rect x="3" y="13" width="4.6" height="6.8" rx="2.2" />
          <rect x="16.4" y="13" width="4.6" height="6.8" rx="2.2" />
        </svg>
      );
    case "lock":
      return (
        <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden>
          <rect x="5.4" y="10.6" width="13.2" height="9.6" rx="2" />
          <path d="M8 10.6V7.8a4 4 0 0 1 8 0v2.8" />
          <circle cx="12" cy="15.2" r="1.3" />
        </svg>
      );
    case "key":
      return (
        <svg viewBox="0 0 24 24" className={className} {...s} aria-hidden>
          <circle cx="7.6" cy="16.4" r="3.8" />
          <path d="M10.4 13.6L19.5 4.5" />
          <path d="M15.4 8.6l2.6 2.6" />
          <path d="M18.3 5.7l2.2 2.2" />
        </svg>
      );
  }
}

function ChaseDots({ count, phase, className = "" }: { count: number; phase: Phase; className?: string }) {
  return (
    <div className={`pointer-events-none flex items-center justify-between ${className}`} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`h-1 w-1 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.5)] slot-chase-${phase}`}
          style={{
            background: LIGHT_COLORS[i % LIGHT_COLORS.length],
            animationDelay: `${(i % 7) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

type ReelVisual = { offset: number; transition: string };

type Phase = "idle" | "spinning" | "nearMiss" | "reveal";

const IDLE_OFFSETS: ReelVisual[] = Array.from({ length: REEL_COUNT }, () => ({
  offset: 0,
  transition: "none",
}));

/** Offsets that rest all three reels on the secret payline (revealed state). */
function secretRestOffsets(): ReelVisual[] {
  return [0, 1, 2].map((i) => ({
    offset: reelStopForSymbol(SECRET_INDEX, 2 + i, () => 0),
    transition: "none",
  }));
}

export default function SecretSlotsSection() {
  // Deliberately less prominent than the lucky wheel: the wheel is a
  // hero-level CTA, so at rest this is just a single teaser row. But it
  // still wears the rainbow so it begs the click. The machine (and the
  // code) stay hidden until the teaser is opened AND a spin lands — every
  // visit, no persistence.
  const [expanded, setExpanded] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  return (
    <section className="defer-render mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <SectionLabel>The industry doesn't advertise this</SectionLabel>
      <h2 className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight">
        THE OTHER HALF OF THE GAME — <span className="hl">PLAYLISTS</span>
      </h2>
      <p className="mt-4 max-w-2xl font-serif text-[1.05rem] leading-[1.65] text-white/70 sm:text-lg">
        Radio gets you spins. Playlists get you streams. Same gatekeepers,
        different door — and the door the pros use quietly is PlaylistPush:
        they pitch your track to Spotify curators while you sleep. The code
        below is the part they never print.
      </p>

      <div className="mx-auto mt-6 max-w-[560px]">
        {!expanded ? (
          <div
            className="rounded-[14px] p-[1.5px] shadow-[0_8px_28px_rgba(251,146,60,0.28)] transition hover:shadow-[0_10px_34px_rgba(167,139,250,0.4)]"
            style={{ background: RAINBOW_LINEAR_90 }}
          >
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-expanded={false}
              className="group flex w-full items-center gap-3 rounded-[12px] bg-[#0E0E13] px-4 py-3 text-left transition hover:bg-[#14141A] sm:px-5"
            >
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full p-[1.5px]"
                style={{ background: RAINBOW_CONIC }}
              >
                <span className="grid h-full w-full place-items-center rounded-full bg-[#0E0E13]">
                  <span className="flex h-4 items-end gap-[3px]">
                    <span className="w-[3px] rounded-full" style={{ height: 8, background: "linear-gradient(to top,#FB923C,#FACC15)" }} />
                    <span className="w-[3px] rounded-full" style={{ height: 13, background: "linear-gradient(to top,#F472B6,#A78BFA)" }} />
                    <span className="w-[3px] rounded-full" style={{ height: 10, background: "linear-gradient(to top,#22D3EE,#34D399)" }} />
                  </span>
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-black uppercase tracking-[0.14em] text-white/80">
                  The code isn't public — you have to win it
                </span>
                <span className="mt-0.5 block text-[12px] text-white/50">
                  One free pull, it always lands on the key.
                  {unlocked ? " Code unlocked — tap to view." : ""}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-pink-400 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-900 shadow-[0_2px_10px_rgba(251,146,60,0.4)] transition group-hover:brightness-[1.06]">
                {unlocked ? "View the code →" : "Spin the reels →"}
              </span>
            </button>
          </div>
        ) : (
          <div className="animate-[slotCardIn_0.32s_cubic-bezier(0.16,1,0.3,1)]">
            <Machine
              initialRevealed={unlocked}
              onUnlock={() => setUnlocked(true)}
              onCollapse={() => setExpanded(false)}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function Machine({
  initialRevealed = false,
  onUnlock,
  onCollapse,
}: {
  initialRevealed?: boolean;
  onUnlock?: () => void;
  onCollapse?: () => void;
}) {
  // Always starts hidden — the code only appears after a spin. The only
  // exception is reopening within the same visit after a win, so the
  // visitor can get back to the code they already earned.
  const [phase, setPhase] = useState<Phase>(initialRevealed ? "reveal" : "idle");
  const [reels, setReels] = useState<ReelVisual[]>(() =>
    initialRevealed ? secretRestOffsets() : IDLE_OFFSETS
  );
  const [settled, setSettled] = useState<boolean[]>([false, false, false]);
  const [copied, setCopied] = useState(false);
  const timersRef = useRef<number[]>([]);
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = timersRef.current;
    return () => timers.forEach((t) => {
      clearTimeout(t);
      clearInterval(t);
    });
  }, []);

  const setReel = (i: number, offset: number, transition: string) => {
    setReels((prev) => {
      const next = prev.slice();
      next[i] = { offset, transition };
      return next;
    });
  };

  const setAll = (next: ReelVisual[]) => setReels(next);

  const handleSpin = () => {
    if (phase === "spinning" || phase === "nearMiss") return;

    setPhase("spinning");
    setSettled([false, false, false]);
    getAudio();

    // Whole-row targets only. Randomness is the rotation count (like the
    // wheel's turn count) — the payline always lands on the requested symbol.
    const targets = [
      reelStopForSymbol(SECRET_INDEX, 2, Math.random),
      reelStopForSymbol(SECRET_INDEX, 3, Math.random),
      reelStopForSymbol(NEAR_MISS_INDEX, 3, Math.random),
    ];
    const finalThird = nudgeToPayline(targets[2], SECRET_INDEX);

    if (reduceRef.current) {
      // Reduced motion: resolve instantly, keep the content.
      setAll(
        [0, 1, 2].map((i) => ({
          offset: i === 2 ? finalThird : targets[i],
          transition: "none",
        }))
      );
      const t = window.setTimeout(() => finish(), 80) as unknown as number;
      timersRef.current.push(t);
      return;
    }

    // Keep the translate inside the strip: rewind by whole cycles (visually
    // identical — the strip is periodic) when the next target runs long.
    // The rewind must paint before the spin transition starts, so the plan
    // begins one animation frame after it.
    const maxTarget = Math.max(...targets, finalThird);
    const needsRewind = maxTarget > MAX_STRIP_OFFSET;
    if (needsRewind) {
      setAll(
        reels.map((r) => ({ offset: rewindOffset(r.offset, 3), transition: "none" }))
      );
    }

    const apply = (fn: () => void, at: number) => {
      const t = window.setTimeout(fn, at) as unknown as number;
      timersRef.current.push(t);
    };

    const begin = () => {
      // Reel tick while anything spins (soft, 90ms apart).
      let tickInterval: number | null = null;
      apply(() => {
        tickInterval = window.setInterval(() => playTick(0.9), 90) as unknown as number;
        timersRef.current.push(tickInterval);
      }, 0);
      apply(() => {
        if (tickInterval) window.clearInterval(tickInterval);
      }, NEAR_MISS_AT - 60);

      // Staggered stops: reel 1, reel 2, then reel 3 resting on LOCK.
      apply(() => setReel(0, targets[0], `transform ${REEL_0_MS}ms ${SPIN_EASING}`), 0);
      apply(() => setReel(1, targets[1], `transform ${REEL_1_MS}ms ${SPIN_EASING}`), REEL_1_DELAY);
      apply(() => setReel(2, targets[2], `transform ${REEL_2_MS}ms ${SPIN_EASING}`), REEL_2_DELAY);

      // Near miss: two keys visible, third reel "locked" — a beat of suspense.
      apply(() => {
        setPhase("nearMiss");
        playNearMissTick();
      }, NEAR_MISS_AT);

      // The click: one row from LOCK to KEY with the rising ding. The third
      // reel's thunk replays when this lands (settle toggles off first).
      apply(() => {
        setReel(2, finalThird, `transform ${NUDGE_MS}ms ${NUDGE_EASING}`);
        setSettled((prev) => {
          const n = prev.slice();
          n[2] = false;
          return n;
        });
        playRisingDing();
        try {
          navigator.vibrate?.([18, 22, 18]);
        } catch {}
      }, NUDGE_AT);

      apply(() => finish(), REVEAL_AT);
    };

    if (needsRewind) {
      // One frame lets React commit the rewound position before the spin
      // transition is applied, so the browser eases from the rewound spot.
      requestAnimationFrame(begin);
    } else {
      begin();
    }
  };

  const finish = () => {
    setPhase("reveal");
    playWinChime();
    onUnlock?.();
    try {
      navigator.vibrate?.([24, 16, 24]);
    } catch {}
  };

  const isSecret = isSecretCombo(reels.map((r) => r.offset));
  const leverPulled = phase === "spinning" || phase === "nearMiss";
  const status =
    phase === "nearMiss"
      ? "So close — the third reel is still locked…"
      : phase === "spinning"
        ? "Spinning…"
        : isSecret && phase === "reveal"
          ? `Three keys! Code unlocked: ${PLAYLISTPUSH_CODE}.`
          : "Three reels. One payline. The key lands every time — free spin below.";

  const handleCopy = () => {
    navigator.clipboard?.writeText(PLAYLISTPUSH_CODE);
    setCopied(true);
    const t = window.setTimeout(() => setCopied(false), 1600) as unknown as number;
    timersRef.current.push(t);
  };

  return (
    <>
      <div
        className={`relative mx-auto max-w-[360px] rounded-[22px] p-[2px] shadow-[0_18px_60px_rgba(0,0,0,0.55),0_0_24px_rgba(251,146,60,0.12)] transition-shadow duration-500 ${
          phase === "reveal"
            ? "shadow-[0_0_50px_rgba(255,230,0,0.18),0_22px_60px_rgba(0,0,0,0.6)]"
            : ""
        }`}
        style={{ background: RAINBOW_CONIC }}
      >
        {/* ── cabinet interior ── */}
        <div className="relative overflow-hidden rounded-[20px] bg-[#0E0E13]">
          {/* marquee — rainbow title + chasing lights */}
          <div className="relative border-b border-white/10 bg-gradient-to-b from-[#16161d] to-[#0d0d12] px-4 pb-2.5 pt-4 text-center">
            <ChaseDots count={10} phase={phase} className="absolute inset-x-5 top-1.5" />
            <p
              className="font-display text-[1.1rem] leading-none tracking-[0.16em] sm:text-[1.2rem]"
              style={{
                backgroundImage: RAINBOW_TEXT,
                backgroundSize: "200% auto",
              }}
            >
              <span className="bg-clip-text text-transparent animate-[gradientFlow_2.4s_linear_infinite]">
                {phase === "reveal" ? "CODE UNLOCKED" : "SECRET SLOTS"}
              </span>
            </p>
            <p className="mt-1 font-mono text-[8px] font-bold tracking-[0.3em] text-white/40">
              3-REEL&nbsp;·&nbsp;1-IN-{SECRET_ODDS}-PAYLINE&nbsp;·&nbsp;FREE
            </p>
          </div>

          {/* ── main face ── */}
          <div
            className={`relative px-3.5 pb-3.5 pt-3.5 sm:px-4 ${phase === "reveal" ? "animate-[winFlash_1.6s_ease-in-out]" : ""}`}
          >
            {/* burst ring on the win — gold */}
            {phase === "reveal" && (
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[40%] h-32 w-32 rounded-full border border-amber-300/50 animate-[burstRing_0.7s_ease-out_forwards]"
                style={{ boxShadow: "0 0 30px rgba(255,230,0,0.25)" }}
              />
            )}

            {/* reel window */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#08080c] shadow-[inset_0_2px_10px_rgba(0,0,0,0.7)]">
              <div className="flex">
                {reels.map((reel, i) => {
                  return (
                    <div
                      key={i}
                      className={`relative flex-1 overflow-hidden ${
                        i > 0 ? "border-l border-white/[0.06]" : ""
                      } ${settled[i] ? "animate-[settleThunk_0.32s_cubic-bezier(0.34,1.56,0.64,1)]" : ""}`}
                      style={{ height: VISIBLE_ROWS * ROW_H }}
                    >
                      <div
                        className={`absolute inset-x-0 top-0 will-change-transform ${
                          phase === "spinning" ? "animate-[reelBlur_0.16s_linear_infinite_alternate]" : ""
                        }`}
                        style={{
                          transform: `translateY(${-reel.offset * ROW_H}px)`,
                          transition: reel.transition,
                          backfaceVisibility: "hidden",
                        }}
                        onTransitionEnd={(e) => {
                          if (e.propertyName !== "transform") return;
                          setSettled((prev) => {
                            const n = prev.slice();
                            n[i] = true;
                            return n;
                          });
                        }}
                      >
                        {Array.from({ length: STRIP_ROWS }).map((_, row) => {
                          const sym = symbolAtRow(row);
                          const style = SYMBOL_STYLE[sym];
                          const isKey = sym === SECRET_SYMBOL;
                          const isLock = sym === NEAR_MISS_SYMBOL;
                          return (
                            <div
                              key={row}
                              className={`grid place-items-center border-b border-white/[0.03] ${isKey && phase === "reveal" ? "animate-[keyPulse_1.1s_ease-in-out_infinite]" : ""}`}
                              style={{ height: ROW_H }}
                              aria-hidden
                            >
                              <span
                                className="grid place-items-center"
                                style={{
                                  color: style.tint,
                                  filter: `drop-shadow(0 0 ${isKey ? 7 : 4}px ${style.glow})`,
                                  opacity: isLock ? 0.75 : 1,
                                }}
                              >
                                <SymbolGlyph
                                  id={sym}
                                  className={`h-[20px] w-[20px] sm:h-[22px] sm:w-[22px] ${isKey ? "scale-110" : ""}`}
                                />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* glass — top/bottom shading + diagonal reflection */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-gradient-to-b from-black/70 to-transparent" aria-hidden />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
              <div
                className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 rotate-[24deg] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
                aria-hidden
              />

              {/* payline — double bracket around the middle row, rainbow */}
              {[PAYLINE_INDEX, PAYLINE_INDEX + 1].map((edge) => (
                <div
                  key={edge}
                  className="pointer-events-none absolute inset-x-0 z-10"
                  style={{ top: edge * ROW_H - 1 }}
                  aria-hidden
                >
                  <div className="relative h-[2px] overflow-hidden bg-[linear-gradient(90deg,transparent,#FACC15,#FB923C,#F472B6,#A78BFA,#22D3EE,transparent)] shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                    <span
                      className={`absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent ${
                        leverPulled ? "animate-[shineSweep_0.9s_linear_infinite]" : "animate-[shineSweep_2.8s_ease-in-out_infinite]"
                      }`}
                    />
                  </div>
                  <span className="absolute -left-[3px] top-1/2 h-[9px] w-[9px] -translate-y-1/2 rotate-45 border border-yellow-300/90 bg-black shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
                  <span className="absolute -right-[3px] top-1/2 h-[9px] w-[9px] -translate-y-1/2 rotate-45 border border-yellow-300/90 bg-black shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
                </div>
              ))}
            </div>

            {/* status — announced politely for screen readers */}
            <p
              role="status"
              className="mt-2 min-h-[16px] text-center text-[11px] font-medium tracking-wide text-white/45"
            >
              {status}
            </p>

            {/* ── lever / reveal ── */}
            {phase === "reveal" ? (
              <div className="mt-2 animate-[slotCardIn_0.32s_cubic-bezier(0.16,1,0.3,1)]">
                {/* the whisper — the whole point of the machine */}
                <div className="text-center">
                  <h3 className="font-display text-[1.15rem] leading-tight tracking-tight text-white sm:text-[1.3rem]">
                    SHH…{" "}
                    <span className="bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                      DON'T TELL ANYONE I GAVE IT TO YOU.
                    </span>
                  </h3>
                  <p className="mx-auto mt-1 max-w-[36ch] text-[12px] leading-relaxed text-white/55">
                    You didn't hear this from me.
                  </p>
                </div>

                {/* code card — rainbow border, shine sweep */}
                <div className="relative mt-2.5 overflow-hidden rounded-2xl p-[1.5px]" style={{ background: RAINBOW_LINEAR_135 }}>
                  {/* shine sweep once */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 w-2/5 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shineSweep_1.4s_ease-in-out_0.35s_forwards]"
                  />
                  <div className="relative rounded-[15px] bg-[#0F0F12] p-3.5 text-center sm:p-4">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-white/40">
                      Insider code — PlaylistPush
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="rounded-lg border border-acid/25 bg-black/60 px-3.5 py-2 font-mono text-[21px] font-black tracking-[0.22em] text-acid animate-[codeGlow_1.8s_ease-in-out_infinite] sm:text-[24px]">
                        {PLAYLISTPUSH_CODE}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`rounded-full px-3 py-1.5 text-[12px] font-black tracking-wide transition-colors active:scale-[0.97] ${
                          copied ? "bg-emerald-400 text-black" : "bg-white text-zinc-900 hover:bg-zinc-100"
                        }`}
                      >
                        {copied ? "Copied ✓" : "Copy code"}
                      </button>
                    </div>
                    <p className="mx-auto mt-2 max-w-[36ch] text-[11px] leading-relaxed text-white/55">
                      They pitch your track to the Spotify curators that
                      actually fit your genre. Paste{" "}
                      <span className="font-mono text-white/80">{PLAYLISTPUSH_CODE}</span> into
                      PlaylistPush's checkout and the discount lands before you pay.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPhase("idle");
                        setAll(IDLE_OFFSETS);
                        setSettled([false, false, false]);
                      }}
                      className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-white/35 hover:text-white/60"
                    >
                      Spin the reels again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={leverPulled}
                  className="group relative w-full overflow-hidden rounded-full p-[2px] shadow-[0_6px_16px_rgba(251,146,60,0.35)] transition hover:shadow-[0_8px_24px_rgba(167,139,250,0.45)] hover:brightness-[1.03] active:scale-[0.985] disabled:cursor-wait disabled:opacity-60"
                  style={{ background: RAINBOW_CONIC }}
                >
                  <span className="relative flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-pink-400 px-5 py-2.5 text-[13px] font-black uppercase tracking-[0.12em] text-zinc-900">
                    {/* lever — rotates down while pulled */}
                    <span
                      className="relative inline-grid h-7 w-6 shrink-0 place-items-end pb-0.5"
                      style={{
                        transform: leverPulled ? "rotate(-38deg)" : "rotate(0deg)",
                        transformOrigin: "50% 92%",
                        transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                      }}
                      aria-hidden
                    >
                      <span className="absolute bottom-0.5 left-1/2 h-5 w-[3px] -translate-x-1/2 rounded-full bg-zinc-700" />
                      <span className="relative z-10 h-3.5 w-3.5 rounded-full bg-gradient-to-b from-red-400 to-red-600 shadow-[0_2px_5px_rgba(0,0,0,0.5)] ring-2 ring-red-300/50" />
                    </span>
                    {leverPulled ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-900/20 border-t-zinc-900" />
                        Spinning…
                      </>
                    ) : (
                      <>Pull the lever — free spin</>
                    )}
                  </span>
                </button>
                <p className="mt-2 text-center font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                  Always lands on the key · no email · 5-second spin
                </p>
              </div>
            )}
          </div>

          {/* ── plinth — quiet machine plate ── */}
          <div className="flex items-center justify-between border-t border-white/10 bg-gradient-to-b from-[#0d0d12] to-[#15151b] px-4 py-2.5">
            <span className="font-mono text-[8px] font-bold tracking-[0.26em] text-white/35">RADIO REACH</span>
            <span className={`font-mono text-[9px] font-bold tracking-[0.2em] ${phase === "reveal" ? "text-acid" : "text-white/45"}`}>
              {phase === "reveal" ? "WINNER ✓" : "FREE SPIN"}
            </span>
          </div>
        </div>
      </div>

      {/* quiet collapse control — the machine tucks back into the teaser */}
      <div className="mt-2.5 text-center">
        <button
          type="button"
          onClick={onCollapse}
          className="text-[10px] font-bold uppercase tracking-widest text-white/35 transition hover:text-white/60"
        >
          ✕ Hide machine
        </button>
      </div>
      <style>{KEYFRAME_CSS}</style>
    </>
  );
}
