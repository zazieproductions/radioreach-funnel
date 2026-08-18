import { useEffect, useMemo, useRef, useState } from "react";
import { isLuckySpinEnabled } from "../config/features";
import { trackCustom } from "../lib/metaPixel";
import {
  getLuckyPrizeTotal,
  getLuckySpinStatus,
  LUCKY_SPIN_EVENT,
  LUCKY_SPIN_VARIANT,
  markLuckySpinSkipped,
  markLuckySpinWon,
  type LuckySpinStatus,
} from "../lib/luckySpin";
import { cn } from "../utils/cn";

/* ─────────────────────────────────────────────
   SESSION HOOK
───────────────────────────────────────────── */

export function useLuckySpinStatus(): LuckySpinStatus {
  const [status, setStatus] = useState<LuckySpinStatus>(() =>
    typeof window === "undefined" ? "idle" : getLuckySpinStatus()
  );

  useEffect(() => {
    const sync = () => setStatus(getLuckySpinStatus());
    window.addEventListener(LUCKY_SPIN_EVENT, sync);
    return () => window.removeEventListener(LUCKY_SPIN_EVENT, sync);
  }, []);

  return status;
}

/* ─────────────────────────────────────────────
   WHEEL GEOMETRY
   8 slices. The session prize is always slice 4.
   Rotation is computed so the pointer settles on
   that slice — close to the next-worse prize.
───────────────────────────────────────────── */

const SLICE_COUNT = 8;
const PRIZE_INDEX = 4;
const SLICE_DEG = 360 / SLICE_COUNT;

const SLICES: { label: string; sub?: string; fill: string; ink: string }[] = [
  { label: "TRY AGAIN", fill: "#14141a", ink: "#8a8a96" },
  { label: "$1 OFF", fill: "#f4efe4", ink: "#1a1a1a" },
  { label: "5% OFF", fill: "#e01b24", ink: "#ffffff" },
  { label: "MYSTERY", fill: "#1c1c24", ink: "#ffe600" },
  { label: "JACKPOT", sub: "AU + KIT", fill: "#ffe600", ink: "#08080a" },
  { label: "10% OFF", fill: "#c41820", ink: "#ffffff" },
  { label: "SO CLOSE", fill: "#111118", ink: "#b8b8c4" },
  { label: "NICE TRY", fill: "#ece7dc", ink: "#1a1a1a" },
];

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function piePath(index: number, r: number) {
  const a0 = index * SLICE_DEG;
  const a1 = (index + 1) * SLICE_DEG;
  const p0 = polar(200, 200, r, a0);
  const p1 = polar(200, 200, r, a1);
  return `M 200 200 L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 0 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function prizeRotation() {
  // Pointer reads the wheel at (360 - rotation) % 360.
  // Settle near the far edge of the prize slice so it feels like a near-miss.
  const sliceEnd = (PRIZE_INDEX + 1) * SLICE_DEG;
  const nearMiss = sliceEnd - 6 - Math.random() * 10;
  const extraTurns = 5 + Math.floor(Math.random() * 3);
  return extraTurns * 360 + (360 - nearMiss);
}

/* ─────────────────────────────────────────────
   TINY WEB-AUDIO HITS — no files, click-gated
───────────────────────────────────────────── */

let audioCtx: AudioContext | null = null;

function getAudio() {
  const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

function playTick(urgency: number) {
  const ctx = getAudio();
  if (!ctx) return;
  void ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 620 + urgency * 520;
  gain.gain.setValueAtTime(0.028, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 0.04);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.045);
}

function playWinFanfare() {
  const ctx = getAudio();
  if (!ctx) return;
  void ctx.resume();
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.09;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

/* ─────────────────────────────────────────────
   CONFETTI
───────────────────────────────────────────── */

const CONFETTI_COLORS = ["#ffe600", "#e01b24", "#ffffff", "#ff8a00", "#7cff6b"];

function Confetti({ on }: { on: boolean }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.45,
        duration: 1.6 + Math.random() * 1.4,
        dx: (Math.random() - 0.5) * 180,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rot: Math.random() * 360,
      })),
    []
  );

  if (!on) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((bit) => (
        <span
          key={bit.id}
          className="lucky-confetti absolute top-0 rounded-[1px]"
          style={{
            left: `${bit.left}%`,
            width: bit.size,
            height: bit.size * (0.45 + (bit.id % 3) * 0.3),
            background: bit.color,
            animationDelay: `${bit.delay}s`,
            animationDuration: `${bit.duration}s`,
            ["--dx" as string]: `${bit.dx}px`,
            transform: `rotate(${bit.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FAKE LIVE FEED
───────────────────────────────────────────── */

const FEED = [
  "Lena in Austin unlocked the Lucky Bundle",
  "Andre in Columbus just claimed AU + Contracts",
  "Maya in Brooklyn spun the jackpot",
  "Dee in Ohio locked in the session prize",
  "Jordan in Nashville claimed both add-ons",
];

function LiveFeed() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % FEED.length), 2800);
    return () => window.clearInterval(t);
  }, []);
  return (
    <p className="flex items-center justify-center gap-2 text-[11px] text-white/55" aria-live="polite">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
      <span key={i} className="fade-in">
        {FEED[i]}
      </span>
    </p>
  );
}

/* ─────────────────────────────────────────────
   COUNT-UP
───────────────────────────────────────────── */

function useCountUp(target: number, run: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  return value;
}

/* ─────────────────────────────────────────────
   WHEEL SVG
───────────────────────────────────────────── */

function WheelFace() {
  return (
    <svg viewBox="0 0 400 400" className="lucky-spin-svg h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="lucky-hub-shade" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
        </radialGradient>
      </defs>
      {SLICES.map((slice, i) => {
        const mid = (i + 0.5) * SLICE_DEG;
        const labelAt = polar(200, 200, 128, mid);
        const isPrize = i === PRIZE_INDEX;
        return (
          <g key={slice.label}>
            <path d={piePath(i, 188)} fill={slice.fill} stroke="#08080a" strokeWidth="1.5" />
            {isPrize && (
              <path d={piePath(i, 188)} fill="none" stroke="#fff4a3" strokeWidth="3" opacity="0.85" />
            )}
            <g transform={`rotate(${mid} ${labelAt.x} ${labelAt.y})`}>
              <text
                x={labelAt.x}
                y={labelAt.y}
                textAnchor="middle"
                fill={slice.ink}
                style={{ fontFamily: isPrize ? "Anton, sans-serif" : "Inter, sans-serif" }}
                fontSize={isPrize ? 22 : 13}
                fontWeight={isPrize ? 400 : 800}
                letterSpacing={isPrize ? "0.04em" : "0.08em"}
              >
                {slice.label}
              </text>
              {slice.sub && (
                <text
                  x={labelAt.x}
                  y={labelAt.y + 18}
                  textAnchor="middle"
                  fill={slice.ink}
                  style={{ fontFamily: "Inter, sans-serif" }}
                  fontSize={10}
                  fontWeight={800}
                  letterSpacing="0.16em"
                >
                  {slice.sub}
                </text>
              )}
            </g>
          </g>
        );
      })}
      <circle cx="200" cy="200" r="188" fill="url(#lucky-hub-shade)" pointerEvents="none" />
      {Array.from({ length: SLICE_COUNT }, (_, i) => {
        const p = polar(200, 200, 188, i * SLICE_DEG);
        return <circle key={i} cx={p.x} cy={p.y} r="5.5" fill="#ffe600" stroke="#08080a" strokeWidth="1.5" />;
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   MODAL
───────────────────────────────────────────── */

type LuckySpinModalProps = {
  open: boolean;
  context: "sales" | "checkout";
  onClaim: () => void;
  onSkip: () => void;
};

export function LuckySpinModal({ open, context, onClaim, onSkip }: LuckySpinModalProps) {
  const [phase, setPhase] = useState<"ready" | "spinning" | "won">("ready");
  const [rotation, setRotation] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [bulbOn, setBulbOn] = useState(0);
  const spinBtn = useRef<HTMLButtonElement>(null);
  const claimBtn = useRef<HTMLButtonElement>(null);
  const raf = useRef(0);
  const winTimer = useRef(0);
  const lastSlice = useRef(0);
  const prize = useMemo(() => getLuckyPrizeTotal(), []);
  const savedCount = useCountUp(prize.saved, phase === "won");

  useEffect(() => {
    if (!open) return;
    setPhase("ready");
    setRotation(0);
    setShowSkip(false);
    spinBtn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const skipTimer = window.setTimeout(() => setShowSkip(true), 3800);
    trackCustom("LuckySpinOpened", {
      sequence_variant: LUCKY_SPIN_VARIANT,
      context,
    });
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(skipTimer);
      window.clearTimeout(winTimer.current);
      cancelAnimationFrame(raf.current);
    };
  }, [open, context]);

  useEffect(() => {
    if (phase === "won") claimBtn.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (!open || phase === "won") return;
    const t = window.setInterval(() => setBulbOn((n) => n + 1), phase === "spinning" ? 90 : 280);
    return () => window.clearInterval(t);
  }, [open, phase]);

  function finishWin() {
    markLuckySpinWon();
    setPhase("won");
    playWinFanfare();
    trackCustom("LuckySpinWon", {
      sequence_variant: LUCKY_SPIN_VARIANT,
      context,
      prize: "au_contracts_bundle",
      value: prize.price,
      saved: prize.saved,
    });
  }

  function spin() {
    if (phase !== "ready") return;
    setPhase("spinning");
    trackCustom("LuckySpinStarted", { sequence_variant: LUCKY_SPIN_VARIANT, context });

    const reduce = prefersReducedMotion();
    const from = rotation % 360;
    const to = from + prizeRotation();
    const duration = reduce ? 180 : 4600 + Math.random() * 700;
    const start = performance.now();
    lastSlice.current = Math.floor(((360 - (from % 360) + 360) % 360) / SLICE_DEG);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4.35);
      const deg = from + (to - from) * eased;
      setRotation(deg);

      const underPointer = (360 - (deg % 360) + 360) % 360;
      const slice = Math.floor(underPointer / SLICE_DEG) % SLICE_COUNT;
      if (slice !== lastSlice.current) {
        lastSlice.current = slice;
        if (!reduce) playTick(t);
      }

      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setRotation(to);
        winTimer.current = window.setTimeout(finishWin, reduce ? 0 : 220);
      }
    };

    raf.current = requestAnimationFrame(tick);
  }

  function claim() {
    trackCustom("LuckySpinClaimed", {
      sequence_variant: LUCKY_SPIN_VARIANT,
      context,
      prize: "au_contracts_bundle",
    });
    onClaim();
  }

  function skip() {
    markLuckySpinSkipped();
    trackCustom("LuckySpinSkipped", { sequence_variant: LUCKY_SPIN_VARIANT, context });
    onSkip();
  }

  if (!open || !isLuckySpinEnabled()) return null;

  return (
    <div
      className="fade-in fixed inset-0 z-[80] grid place-items-end overflow-y-auto bg-black/88 p-3 sm:place-items-center sm:p-4"
      role="presentation"
    >
      <Confetti on={phase === "won"} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucky-spin-title"
        className="relative my-2 w-full max-w-md overflow-hidden rounded-2xl border-2 border-acid bg-panel shadow-[0_30px_80px_rgba(0,0,0,0.65),0_0_80px_rgba(255,230,0,0.08)]"
      >
        <p className="bg-blood py-2 text-center text-[11px] font-black uppercase tracking-[0.18em]">
          {phase === "won" ? "Jackpot — locked to this session" : "One free spin · this device only"}
        </p>

        <div className="px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-acid">
            {phase === "won" ? "You just unlocked the add-ons" : "Spin before checkout"}
          </p>
          <h2 id="lucky-spin-title" className="mt-1 text-center font-display text-[1.7rem] leading-[1.05] sm:text-4xl">
            {phase === "won" ? (
              <>
                YOU WON THE <span className="text-acid">LUCKY BUNDLE</span>
              </>
            ) : (
              <>
                SPIN TO UNLOCK A <span className="text-blood">SESSION BONUS</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-center text-[13px] leading-relaxed text-white/60">
            {phase === "won"
              ? "The Contract Kit and the Australian Radio List just dropped to their lucky-spin prices."
              : "One tap. The wheel decides what gets added to this checkout at a session price."}
          </p>

          <div className="relative mx-auto mt-5 aspect-square w-[min(100%,300px)] sm:w-[320px]">
            <div className="lucky-rim absolute inset-0 rounded-full" />

            {Array.from({ length: 16 }, (_, i) => (
              <span
                key={i}
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ transform: `rotate(${i * 22.5}deg)` }}
              >
                <span
                  className="absolute left-1/2 top-[3px] h-2.5 w-2.5 -translate-x-1/2 rounded-full"
                  style={{
                    background: (i + bulbOn) % 2 === 0 ? "#ffe600" : phase === "won" ? "#fff4a3" : "#5a5740",
                    boxShadow: (i + bulbOn) % 2 === 0 ? "0 0 8px #ffe600" : "none",
                  }}
                />
              </span>
            ))}

            <div className="absolute left-1/2 top-[2px] z-20 -translate-x-1/2">
              <div className="h-0 w-0 border-x-[11px] border-t-[20px] border-x-transparent border-t-acid drop-shadow-[0_2px_0_#08080a]" />
              <div className="absolute left-1/2 top-[-6px] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-ink bg-acid" />
            </div>

            <div className={cn("absolute inset-[18px] rounded-full", phase === "won" && "lucky-win-glow")}>
              <div
                className={cn("h-full w-full rounded-full", phase === "ready" && "lucky-idle")}
                style={
                  phase === "ready"
                    ? undefined
                    : { transform: `rotate(${rotation}deg)`, willChange: phase === "spinning" ? "transform" : undefined }
                }
              >
                <WheelFace />
              </div>
            </div>

            <button
              ref={spinBtn}
              type="button"
              onClick={spin}
              disabled={phase !== "ready"}
              className={cn(
                "absolute left-1/2 top-1/2 z-20 grid h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[6px] border-ink font-display text-xl uppercase tracking-wide shadow-[0_8px_0_#3d3500,0_0_24px_rgba(255,230,0,0.35)]",
                phase === "ready" && "cta bg-acid text-ink",
                phase === "spinning" && "cursor-wait bg-acid/80 text-ink",
                phase === "won" && "bg-ink text-acid"
              )}
              aria-label={phase === "ready" ? "Spin the wheel" : phase === "won" ? "You won the lucky bundle" : "Wheel spinning"}
            >
              {phase === "ready" ? "SPIN" : phase === "won" ? "✓" : "···"}
            </button>
          </div>

          <p className="sr-only" aria-live="polite">
            {phase === "spinning" && "The wheel is spinning."}
            {phase === "won" && "The wheel landed on the Lucky Bundle. Contract Kit and Australian Radio List unlocked at session prices."}
          </p>

          {phase === "won" ? (
            <div className="fade-up mt-5 rounded-xl border border-acid/50 bg-acid/10 p-4">
              <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-acid">
                Session prize · applied at checkout
              </p>
              <ul className="mt-3 space-y-2.5">
                {prize.items.map((item) => (
                  <li key={item.key} className="flex items-end justify-between gap-3">
                    <span>
                      <span className="block text-[13px] font-bold leading-tight">{item.shortName}</span>
                      <span className="block text-[11px] text-white/45">Lucky-spin price</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="mr-2 text-[13px] text-white/35 line-through">${item.compareAt}</span>
                      <b className="font-display text-2xl leading-none text-acid">${item.price}</b>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-[12px] uppercase tracking-widest text-white/45">You unlocked</span>
                <span className="tnum font-display text-3xl text-acid">${savedCount.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={claim}
                className="cta mt-4 w-full rounded-lg bg-acid px-4 py-4 font-display text-[1.05rem] uppercase leading-tight tracking-wide text-ink sm:text-xl"
              >
                {context === "checkout" ? "Apply to my order" : "Claim my prizes — checkout"}
                <span className="mt-1 block font-sans text-[11px] font-bold normal-case tracking-normal opacity-70">
                  Contract Kit ${prize.items[0].price} · AU List ${prize.items[1].price} · this session only
                </span>
              </button>
            </div>
          ) : (
            <div className="mt-5">
              <LiveFeed />
              <p className="mt-2 text-center text-[11px] text-white/35">
                1 free spin remaining on this device
              </p>
            </div>
          )}

          {showSkip && phase === "ready" && (
            <button
              type="button"
              onClick={skip}
              className="fade-in mx-auto mt-4 block text-[11px] text-white/30 underline underline-offset-4 hover:text-white/55"
            >
              Continue without spinning
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FLOATING LAUNCHER (sales page)
───────────────────────────────────────────── */

export function LuckySpinLauncher({
  onOpen,
  onWonCta,
}: {
  onOpen: () => void;
  onWonCta?: () => void;
}) {
  const status = useLuckySpinStatus();
  if (!isLuckySpinEnabled()) return null;
  if (status === "skipped") return null;

  if (status === "won") {
    return (
      <button
        type="button"
        onClick={onWonCta}
        className="lucky-float tap-target fixed right-3 z-[45] max-w-[11.5rem] rounded-full border border-acid/50 bg-ink/95 px-3 py-2 text-left shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        style={{ bottom: "calc(6.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-acid">Prize unlocked</span>
        <span className="block text-[11px] font-bold leading-tight text-white">Lucky bundle → checkout</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="lucky-pulse tap-target fixed right-3 z-[45] grid h-[72px] w-[72px] place-items-center rounded-full border-2 border-acid bg-ink text-center shadow-[0_10px_28px_rgba(0,0,0,0.5),0_0_22px_rgba(255,230,0,0.25)]"
      style={{ bottom: "calc(6.75rem + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Spin the wheel for a session bonus"
    >
      <span className="font-display text-[13px] leading-none text-acid">SPIN</span>
      <span className="mt-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white/55">to win</span>
    </button>
  );
}

/* ─────────────────────────────────────────────
   CHECKOUT FRAMING
───────────────────────────────────────────── */

export function LuckySpinBanner() {
  const won = useLuckySpinStatus() === "won";
  if (!isLuckySpinEnabled() || !won) return null;
  const prize = getLuckyPrizeTotal();
  return (
    <div className="bg-acid py-2 text-center text-[11px] font-black uppercase tracking-[0.14em] text-ink">
      Lucky spin applied — Contract Kit + AU list at prize prices · you unlocked ${prize.saved.toFixed(0)}
    </div>
  );
}

export function LuckyPrizeBadge({ compact }: { compact?: boolean }) {
  const won = useLuckySpinStatus() === "won";
  if (!isLuckySpinEnabled() || !won) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-acid font-black uppercase tracking-wider text-ink",
        compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
      )}
    >
      You won this
    </span>
  );
}

export function LuckyPriceNote() {
  const won = useLuckySpinStatus() === "won";
  if (!isLuckySpinEnabled() || !won) return null;
  return <span className="ml-1 text-[11px] font-semibold text-acid/80">· lucky-spin price</span>;
}
