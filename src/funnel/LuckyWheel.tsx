import { useEffect, useRef, useState } from "react";
import {
  generateLuckyCoupon,
  saveLuckyCoupon,
  type LuckyCoupon,
  formatRemainingMs,
} from "../lib/luckyCoupon";

// Freecash-style novelty placeholders + real jackpots
type Segment = {
  label: string;
  sub?: string;
  color: string;
  textColor: string;
  isJackpot?: boolean;
  isSecret?: boolean;
};

const SEGMENTS: Segment[] = [
  { label: "10% OFF", color: "#eab308", textColor: "#111" }, // yellow — near-miss (clockwise after jackpot)
  { label: "$100", sub: "GUITAR CENTER", color: "#f97316", textColor: "#fff" }, // placeholder — Guitar Center $100
  { label: "TRY", sub: "AGAIN", color: "#3b82f6", textColor: "#fff" }, // blue
  { label: "FREE MIXING", sub: "$150 VALUE", color: "#ec4899", textColor: "#fff" }, // placeholder — other music prize
  { label: "NO LUCK", color: "#8b5cf6", textColor: "#fff" }, // purple
  { label: "SECRET CODE", sub: "PLAYLIST PUSH", color: "#06b6d4", textColor: "#fff", isSecret: true }, // second spin jackpot
  { label: "5% OFF", color: "#ef4444", textColor: "#fff" }, // red
  { label: "★ JACKPOT ★", sub: "AU + KIT", color: "#22c55e", textColor: "#fff", isJackpot: true }, // first spin jackpot — AU + KIT (carnival green)
];

const SEGMENT_COUNT = SEGMENTS.length;
const SECRET_INDEX = SEGMENTS.findIndex((s) => s.isSecret); // 5
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

const PLAYLIST_PUSH_CODE = "FR2AZEF";
const PLAYLIST_PUSH_URL = "https://playlistpush.com/";

function buildConicGradient() {
  let stops = "";
  SEGMENTS.forEach((seg, i) => {
    const start = i * SEGMENT_ANGLE;
    const end = (i + 1) * SEGMENT_ANGLE;
    stops += `${seg.color} ${start}deg ${end}deg${i < SEGMENTS.length - 1 ? ", " : ""}`;
  });
  return `conic-gradient(from 0deg, ${stops})`;
}

// — dopamine audio: tick + rising ding via Web Audio —
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
  osc.type = "square";
  osc.frequency.value = 900 + Math.random() * 80;
  gain.gain.value = 0.09 * intensity;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  osc.start(now);
  osc.stop(now + 0.07);
}
function playRisingDing() {
  const ctx = getAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(480, now);
  osc.frequency.exponentialRampToValueAtTime(1400, now + 0.55);
  osc.frequency.exponentialRampToValueAtTime(1800, now + 0.9);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 1.2);
  // second harmonic for sparkle
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(960, now + 0.08);
  osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.7);
  gain2.gain.setValueAtTime(0, now + 0.08);
  gain2.gain.linearRampToValueAtTime(0.08, now + 0.12);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.9);
}
function playNearMissTick() {
  playTick(0.7);
  setTimeout(() => playTick(0.9), 110);
  setTimeout(() => playTick(0.6), 240);
}

export function LuckyWheelButton({
  onClick,
  small,
  className = "",
}: {
  onClick: () => void;
  small?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cta group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#ff3b82] via-[#7c5cff] to-[#00d4ff] p-[2px] shadow-[0_6px_20px_rgba(124,92,255,0.45)] transition hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      <span
        className={`flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-black uppercase tracking-wide text-white ${small ? "text-xs" : "text-sm"}`}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-acid to-yellow-400 text-ink animate-[spin_3s_linear_infinite] text-[16px] leading-none">
          🎡
        </span>
        <span className="bg-gradient-to-r from-[#ff3b82] via-acid to-[#00e5ff] bg-clip-text text-transparent">
          Spin the wheel for a free discount
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-acid px-2 py-1 text-[10px] font-black tracking-widest text-ink">
          1 in 10,000
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blood" />
        </span>
      </span>
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent group-hover:translate-x-full transition duration-700" />
    </button>
  );
}

type Phase = "firstWheel" | "firstWon" | "secondWheel" | "secondWon";

export function LuckyWheelModal({
  isOpen,
  onClose,
  onWin,
  onClaim,
  existingCoupon,
}: {
  isOpen: boolean;
  onClose: () => void;
  onWin: (coupon: LuckyCoupon) => void;
  onClaim: () => void;
  existingCoupon?: LuckyCoupon | null;
}) {
  const [phase, setPhase] = useState<Phase>("firstWheel");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wheelTransition, setWheelTransition] = useState("none");
  const [firstCoupon, setFirstCoupon] = useState<LuckyCoupon | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const timeoutRef = useRef<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // live countdown for first coupon
  useEffect(() => {
    if (phase !== "firstWon" && phase !== "secondWon" && phase !== "secondWheel") return;
    if (!firstCoupon) return;
    const t = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase, firstCoupon]);

  // reset / hydrate on open
  useEffect(() => {
    if (isOpen) {
      // if user already won the founder bundle, jump straight to firstWon with that coupon
      if (existingCoupon && existingCoupon.expiresAt > Date.now()) {
        setFirstCoupon(existingCoupon);
        setPhase("firstWon");
        setSpinning(false);
        setRotation(0);
        setWheelTransition("none");
        setNowMs(Date.now());
      } else {
        setPhase("firstWheel");
        setFirstCoupon(null);
        setSpinning(false);
        setRotation(0);
        setWheelTransition("none");
        setNowMs(Date.now());
      }
    } else {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    }
  }, [isOpen, existingCoupon]);

  // close on esc
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !spinning) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, spinning, onClose]);

  if (!isOpen) return null;

  const handleFirstSpin = () => {
    if (spinning || phase !== "firstWheel") return;
    setSpinning(true);
    getAudio();
    // 8-slice carnival near-miss: slam to 10% OFF (index 0, clockwise after jackpot) then elastic snap to JACKPOT
    const NEAR_MISS_INDEX = 0; // 10% OFF — adjacent clockwise after jackpot
    const spins = 5 + Math.random() * 0.8;
    const nearMissCenter = NEAR_MISS_INDEX * SEGMENT_ANGLE + SEGMENT_ANGLE / 2; // 22.5
    const jitter = (Math.random() - 0.5) * 3; // tiny jitter so jackpot feels alive
    const targetNearMiss = spins * 360 + (360 - nearMissCenter) + jitter; // lands on 10% OFF (near-miss)
    const targetJackpot = targetNearMiss + SEGMENT_ANGLE; // 45° clockwise nudge to JACKPOT · AU + KIT

    // tick storm during first fast spin — dopaminergic ticks
    const tickIds: number[] = [];
    const start = Date.now();
    const tickInterval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed > 3400) {
        clearInterval(tickInterval);
        return;
      }
      playTick(elapsed < 2000 ? 1 : 0.85);
    }, 82);
    tickIds.push(tickInterval as unknown as number);

    // phase 1: slam to 10% OFF (near-miss) — fast, exciting
    setWheelTransition("transform 3650ms cubic-bezier(0.15, 0.88, 0.20, 1)");
    requestAnimationFrame(() => setRotation(targetNearMiss));
    // use ref to store intermediate timeouts for cleanup
    const nearMissTimeout = window.setTimeout(() => {
      clearInterval(tickInterval);
      playNearMissTick(); // tick tick — hesitation
      // brief hesitation — wheel appears to stick on 10% OFF — dopamine near-miss
      const hesitation = window.setTimeout(() => {
        // nudge to JACKPOT with elastic snap + rising ding
        playRisingDing();
        try {
          navigator.vibrate?.([20, 30, 20, 40]);
        } catch {}
        // elastic carnival snap into jackpot
        setWheelTransition("transform 680ms cubic-bezier(0.34, 1.56, 0.64, 1)");
        setRotation(targetJackpot);
        // after nudge, show win with confetti explosion
        timeoutRef.current = window.setTimeout(() => {
          setWheelTransition("none");
          const c = generateLuckyCoupon();
          saveLuckyCoupon(c);
          setFirstCoupon(c);
          setPhase("firstWon");
          setSpinning(false);
          onWin(c);
          // final vibration burst
          try {
            navigator.vibrate?.([30, 20, 30, 50]);
          } catch {}
        }, 720) as unknown as number;
      }, 520) as unknown as number;
      tickIds.push(hesitation as unknown as number);
    }, 3650) as unknown as number;

    // store for cleanup (only last timeout is tracked in timeoutRef, but we clear on unmount via phase reset)
    timeoutRef.current = nearMissTimeout as unknown as number;
  };

  const handleGoToSecondWheel = () => {
    setPhase("secondWheel");
    setSpinning(false);
    setWheelTransition("none");
    setRotation(0);
  };

  const handleSecondSpin = () => {
    if (spinning || phase !== "secondWheel") return;
    setSpinning(true);
    getAudio();
    const spins = 5 + Math.random() * 1.2;
    const secretCenter = SECRET_INDEX * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const jitter = (Math.random() - 0.5) * 6;
    const targetRotation = spins * 360 + (360 - secretCenter) + jitter;
    setWheelTransition("transform 4200ms cubic-bezier(0.12, 0.78, 0.18, 1)");
    // tick storm for second spin too
    const sStart = Date.now();
    const sTick = window.setInterval(() => {
      if (Date.now() - sStart > 3800) { clearInterval(sTick); return; }
      playTick(0.9);
    }, 90);
    requestAnimationFrame(() => setRotation(targetRotation));
    timeoutRef.current = window.setTimeout(() => {
      setWheelTransition("none");
      setPhase("secondWon");
      setSpinning(false);
      playRisingDing();
      try {
        navigator.vibrate?.([30, 50, 30, 50]);
        localStorage.setItem("rr_secret_playlist_revealed", "1");
      } catch {}
    }, 4200);
  };

  const remainingMs = firstCoupon ? Math.max(0, firstCoupon.expiresAt - nowMs) : 0;
  const showConfetti = phase === "firstWon" || phase === "secondWon";

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-3 backdrop-blur-[6px] sm:p-4"
      onClick={() => !spinning && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wheel-title"
    >
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {Array.from({ length: 44 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 animate-[confettiFall_1.35s_ease-out_forwards] rounded-full"
              style={{
                left: `${2 + i * 2.25}%`,
                width: `${6 + (i % 3) * 4}px`,
                height: `${8 + (i % 2) * 6}px`,
                background: ["#ffe600", "#ff3b82", "#00d4ff", "#22c55e", "#a855f7", "#f97316", "#ffffff"][i % 7],
                animationDelay: `${i * 32}ms`,
                transform: `rotate(${Math.random() * 360}deg)`,
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
            />
          ))}
          <style>{`@keyframes confettiFall{0%{transform:translateY(-22vh) rotate(0deg) scale(1); opacity:1} 50%{opacity:1} 100%{transform:translateY(108vh) rotate(720deg) scale(0.9); opacity:0}}`}</style>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[480px] overflow-hidden rounded-[20px] border-2 border-white/15 bg-gradient-to-b from-[#1a1a22] to-[#08080a] shadow-[0_20px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)] sm:max-w-[520px] sm:rounded-[28px]"
      >
        <div className="bg-gradient-to-r from-[#ff3b82] via-[#7c5cff] to-[#00d4ff] px-3 py-2 text-center">
          <p className="font-black text-[11px] uppercase tracking-[0.18em] text-white drop-shadow sm:text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white shadow" />
              {phase === "secondWon" || phase === "secondWheel"
                ? "Secret industry code — shh..."
                : "Only 1 in 10,000 visitors win the jackpot"}
              <span className="hidden sm:inline">• verified live draw</span>
            </span>
          </p>
        </div>

        {/* FIRST WHEEL */}
        {phase === "firstWheel" && (
          <>
            <div className="px-5 pt-5 text-center sm:px-7 sm:pt-6">
              <h2 id="wheel-title" className="font-display text-[1.55rem] leading-[1] sm:text-3xl">
                <span className="bg-gradient-to-r from-[#ff6b9d] via-acid to-[#00e5ff] bg-clip-text text-transparent">
                  SPIN THE RAINBOW WHEEL
                </span>
              </h2>
              <p className="mx-auto mt-2 max-w-[36ch] text-[13px] leading-[1.5] text-white/70 sm:text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-acid/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-acid border border-acid/20">🎪 8-SLICE CARNIVAL WHEEL</span>
                <br className="hidden sm:block" />
                <span className="mt-1 inline-block">
                  Novelty prizes like <b className="text-white">$100 Guitar Center</b> & <b className="text-white">secret code</b> — watch it <b className="text-yellow-300">near-miss 10% OFF</b> then snap to green <b className="text-acid">JACKPOT · AU + KIT</b> for <b className="text-acid">$21</b> <span className="text-white/40 line-through">($54)</span>
                </span>
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-bold uppercase tracking-wider text-white/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> 342 spinning now
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-acid/30 bg-acid/10 px-2.5 py-1 font-bold uppercase tracking-wider text-acid">
                  3 jackpots in last hour
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-white/50">
                  draw #RR-{(Math.floor(Math.random() * 9000) + 1000)}
                </span>
              </div>
              <p className="mt-2 text-center text-[10px] uppercase tracking-[0.14em] text-white/30">
                Freecash-style novelty prizes on wheel • jackpot is pre-selected upsells at founder price
              </p>
            </div>

            <div className="relative mx-auto mt-5 flex justify-center px-4 pb-2 sm:mt-6">
              <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
                <div className="relative">
                  <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
                  <div className="absolute left-1/2 top-[-2px] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-acid shadow-[0_0_12px_rgba(255,230,0,0.8)]" />
                </div>
              </div>
              <div className="absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#ff3b82]/20 via-[#7c5cff]/20 to-[#00d4ff]/20 blur-[18px]" />
              <div className="relative h-[300px] w-[300px] shrink-0 sm:h-[340px] sm:w-[340px]">
              {/* carnival lights — 20 bulbs around wheel */}
              <div className="pointer-events-none absolute inset-[-14px] rounded-full" aria-hidden>
                {Array.from({ length: 20 }).map((_, i) => (
                  <span
                    key={i}
                    className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-[0_0_10px_rgba(255,255,255,0.9)] ${i % 2 === 0 ? "bg-acid" : i % 3 === 0 ? "bg-[#ff3b82]" : "bg-white"} animate-[carnivalBlink_0.9s_ease-in-out_infinite]`}
                    style={{
                      left: `${50 + 52 * Math.cos((i * 18 * Math.PI) / 180)}%`,
                      top: `${50 + 52 * Math.sin((i * 18 * Math.PI) / 180)}%`,
                      animationDelay: `${i * 70}ms`,
                    }}
                  />
                ))}
                <style>{`@keyframes carnivalBlink{0%,100%{opacity:1; transform:translate(-50%,-50%) scale(1); box-shadow:0 0 10px rgba(255,255,255,0.9)}50%{opacity:0.35; transform:translate(-50%,-50%) scale(0.78); box-shadow:0 0 4px rgba(255,255,255,0.4)}}`}</style>
              </div>
                <div
                  ref={wheelRef}
                  className="absolute inset-0 rounded-full border-[8px] border-white shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_0_0_3px_rgba(255,255,255,0.15)] will-change-transform"
                  style={{
                    background: buildConicGradient(),
                    transform: `rotate(${rotation}deg)`,
                    transition: wheelTransition,
                  }}
                >
                  <div className="absolute inset-[10px] rounded-full border border-white/25" />
                  <div className="absolute inset-[14px] rounded-full border border-black/10" />
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full rounded-full pointer-events-none" aria-hidden>
                    {SEGMENTS.map((_, i) => {
                      const angle = (i * SEGMENT_ANGLE * Math.PI) / 180;
                      const x2 = 50 + 50 * Math.sin(angle);
                      const y2 = 50 - 50 * Math.cos(angle);
                      return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="rgba(255,255,255,0.9)" strokeWidth="0.8" strokeLinecap="round" />;
                    })}
                  </svg>
                  {SEGMENTS.map((seg, i) => {
                    const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
                    const isJack = seg.isJackpot;
                    const isSecret = seg.isSecret;
                    return (
                      <div
                        key={seg.label + i}
                        className="absolute left-1/2 top-1/2"
                        style={{ transform: `rotate(${angle}deg)`, transformOrigin: "0 0" }}
                      >
                        <div
                          className="flex flex-col items-center text-center"
                          style={{ transform: `translate(-50%, -92px) rotate(90deg)`, width: isJack ? "96px" : isSecret ? "84px" : "72px" }}
                        >
                          <span
                            className={`font-black leading-none tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] ${isJack ? "text-[10px] sm:text-[11px]" : "text-[9px] sm:text-[10px]"}`}
                            style={{ color: seg.textColor, textShadow: "0 1px 3px rgba(0,0,0,0.6)", lineHeight: isJack ? "1.05" : "1.15", whiteSpace: "pre-line" }}
                          >
                            {seg.label}
                            {seg.sub ? `\n${seg.sub}` : ""}
                          </span>
                          {isJack && (
                            <span className="mt-0.5 rounded-full bg-black/20 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-white/90 border border-white/30">
                              SAVE $33
                            </span>
                          )}
                          {isSecret && (
                            <span className="mt-0.5 rounded-full bg-black/20 px-1 py-0.5 text-[6px] font-black uppercase tracking-[0.12em] text-white/90 border border-white/30">
                              2ND PRIZE
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="absolute left-1/2 top-1/2 flex h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-white bg-gradient-to-br from-[#1a1a22] to-black shadow-[0_6px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] sm:h-[96px] sm:w-[96px]">
                    <div className="text-center">
                      <div className="font-display text-[13px] leading-none tracking-[0.14em] text-acid sm:text-sm">SPIN</div>
                      <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/50">to win</div>
                    </div>
                    <div className="absolute inset-0 rounded-full">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span
                          key={i}
                          className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80"
                          style={{
                            left: `${50 + 38 * Math.cos((i * 30 * Math.PI) / 180)}%`,
                            top: `${50 + 38 * Math.sin((i * 30 * Math.PI) / 180)}%`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-[-6px] rounded-full border border-white/10" />
              </div>
            </div>

            <div className="px-5 pb-5 sm:px-7 sm:pb-6">
              <button
                type="button"
                onClick={handleFirstSpin}
                disabled={spinning}
                className={`cta relative w-full overflow-hidden rounded-full px-6 py-4 font-display text-xl uppercase tracking-wide text-white shadow-[0_10px_30px_rgba(124,92,255,0.45)] transition ${spinning ? "cursor-wait bg-white/10 text-white/50" : "bg-gradient-to-r from-[#ff3b82] via-[#7c5cff] to-[#00d4ff] hover:brightness-[1.08] active:scale-[0.99]"}`}
              >
                <span className="relative flex items-center justify-center gap-2">
                  {spinning ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Spinning...
                    </>
                  ) : (
                    <>
                      <span className="text-xl">🎡</span> TAP TO SPIN <span className="hidden sm:inline text-sm opacity-80">— free</span>
                    </>
                  )}
                </span>
                {!spinning && <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.6s_ease_infinite]" />}
              </button>
              <div className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] leading-none text-white/35">
                <span className="h-px w-8 bg-white/10" />
                <span>No email required • Instant win check</span>
                <span className="h-px w-8 bg-white/10" />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <img src="https://i.pravatar.cc/100?img=33" alt="" aria-hidden className="h-7 w-7 rounded-full object-cover ring-1 ring-white/15" />
                  <div className="text-left leading-tight">
                    <p className="text-[12px] font-bold text-white">Maya K. just won</p>
                    <p className="text-[11px] text-white/50">Founder Bundle $21 • 2m ago</p>
                  </div>
                </div>
                <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-green-400 border border-green-500/20">Live</span>
              </div>
              <button type="button" onClick={onClose} disabled={spinning} className="mx-auto mt-3 block text-[12px] text-white/30 underline underline-offset-4 hover:text-white/60 disabled:opacity-30">
                No thanks, I don't like discounts
              </button>
              <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
            </div>
          </>
        )}

        {phase === "firstWon" && firstCoupon && (
          <div className="px-5 py-6 text-center sm:px-7 sm:py-7">
            <div className="mx-auto -mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-acid via-yellow-300 to-[#ff3b82] text-3xl shadow-[0_10px_30px_rgba(255,230,0,0.45)] ring-4 ring-white/15 animate-[pop_420ms_cubic-bezier(0.34,1.56,0.64,1)]">
              🎉
            </div>
            <style>{`@keyframes pop{0%{transform:scale(0.4)}100%{transform:scale(1)}}`}</style>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-acid to-yellow-300 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-ink">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blood" /> Jackpot Winner Verified
            </p>
            <h3 className="mt-3 font-display text-[1.75rem] leading-[0.95] sm:text-4xl">
              YOU DID IT —{" "}
              <span className="bg-gradient-to-r from-acid via-[#ff6b9d] to-[#00e5ff] bg-clip-text text-transparent">1 IN 10,000!</span>
            </h3>
            <p className="mx-auto mt-3 max-w-[38ch] text-[13px] leading-[1.55] text-white/70 sm:text-sm">
              You beat <b className="text-white">9,999</b> other visitors. The rainbow stopped on <b className="text-acid">JACKPOT</b> — that almost never happens.
              <br />
              <span className="text-white/50">
                Winner ID: <b className="font-mono text-white">{firstCoupon.winnerId}</b> • Draw #{firstCoupon.winnerNumber}
              </span>
            </p>

            <div className="relative mt-5 overflow-hidden rounded-2xl border-2 border-acid bg-gradient-to-b from-acid/15 via-white/[0.04] to-black/20 p-4 text-left shadow-[0_12px_40px_rgba(255,230,0,0.18)] sm:p-5">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-acid/15 blur-2xl" />
              <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-[#7c5cff]/15 blur-2xl" />
              <div className="relative">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-acid">Your exclusive prize — pre-selected at checkout</p>
                <p className="mt-1 font-display text-xl leading-none sm:text-2xl">FOUNDER'S BUNDLE UNLOCKED</p>
                <div className="mt-3 grid gap-2">
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-bold text-white">📄 Indie Contract Kit</p>
                      <p className="text-[11px] text-white/50">6 templates + guide</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 line-through">$25</p>
                      <p className="font-display text-xl leading-none text-acid">$9</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-bold text-white">🇦🇺 AU Radio List</p>
                      <p className="text-[11px] text-white/50">2,847 contacts • 1,612 emails</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 line-through">$29</p>
                      <p className="font-display text-xl leading-none text-acid">$12</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border-2 border-acid/50 bg-acid/10 px-3 py-2.5">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-acid">Bundle total</p>
                      <p className="text-xs text-white/60">Both add-ons together</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/40 line-through">$54</p>
                      <p className="font-display text-2xl leading-none text-acid">$21</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Save $33 • 61% OFF</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Coupon code</p>
                  <p className="mt-1 flex items-center gap-2 font-mono text-[13px] font-black tracking-[0.08em] text-white">
                    {firstCoupon.code}
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(firstCoupon.code)}
                      className="rounded bg-white px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-ink hover:bg-acid"
                    >
                      Copy
                    </button>
                  </p>
                  <p className="mt-1 text-[11px] text-white/40">Auto-applied at checkout</p>
                </div>
                <div className="rounded-xl border border-acid/30 bg-acid/10 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-acid/70">Prize expires in</p>
                  <p className="mt-1 font-display text-2xl leading-none tracking-wide text-acid tabular-nums">{formatRemainingMs(remainingMs)}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-white/50">Don't miss it</p>
                </div>
              </div>
              <div className="relative mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-green-500 text-xs font-black text-white">✓</span>
                <p className="text-[12px] leading-snug text-white/70">
                  <b className="text-white">Both boxes will be pre-ticked at checkout.</b> You can untick, but you won't see this celebration again.
                </p>
              </div>
              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gradient-to-r from-acid via-[#ff6b9d] to-[#00d4ff] transition-all duration-1000" style={{ width: `${Math.max(8, (remainingMs / (15 * 60 * 1000)) * 100)}%` }} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/35">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-green-400" /> 11 people claimed in last 10 minutes • 1 jackpot / 10,000 spins
            </div>

            <button
              type="button"
              onClick={onClaim}
              className="cta mt-5 w-full rounded-full bg-acid px-6 py-4 font-display text-[1.15rem] uppercase tracking-wide text-ink shadow-[0_10px_30px_rgba(255,230,0,0.45)] hover:brightness-[1.06] active:scale-[0.99] sm:text-xl"
            >
              Claim My Founder Bundle →
              <span className="mt-0.5 block text-[11px] font-sans font-bold normal-case tracking-normal opacity-70">Takes you to checkout • Both add-ons pre-selected • $21</span>
            </button>

            <div className="relative my-4 flex items-center gap-2">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/30">or spin again</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoToSecondWheel}
              className="cta w-full rounded-full bg-gradient-to-r from-[#ff3b82] via-[#7c5cff] to-[#00d4ff] px-6 py-3.5 font-black uppercase tracking-widest text-white shadow-[0_8px_24px_rgba(124,92,255,0.4)] hover:brightness-[1.05] active:scale-[0.99]"
            >
              🎁 Spin Again for One More Prize →
              <span className="mt-0.5 block text-[11px] font-bold normal-case tracking-normal opacity-80">Secret PlaylistPush code inside… shh 🤫</span>
            </button>
            <p className="mt-2 text-center text-[11px] text-white/30">One more spin — hidden industry secret code</p>

            <button type="button" onClick={onClose} className="mx-auto mt-4 block text-[12px] text-white/40 underline underline-offset-4 hover:text-white/70">
              Keep shopping without bonus
            </button>
            <p className="mx-auto mt-3 max-w-[40ch] text-center text-[10px] leading-snug text-white/25">Founder pricing is reserved for this browser for 15 minutes — after that the checkout returns to standard.</p>
          </div>
        )}

        {phase === "secondWheel" && (
          <>
            <div className="px-5 pt-5 text-center sm:px-7 sm:pt-6">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7c5cff] to-[#00d4ff] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">
                🤫 SECOND SPIN — SECRET CODE
              </p>
              <h2 className="mt-3 font-display text-[1.45rem] leading-[1] sm:text-3xl">
                <span className="bg-gradient-to-r from-[#00e5ff] via-acid to-[#ff6b9d] bg-clip-text text-transparent">ONE MORE PRIZE</span>
              </h2>
              <p className="mx-auto mt-2 max-w-[36ch] text-[13px] leading-[1.5] text-white/70 sm:text-sm">
                You already hit the jackpot — now try for the{" "}
                <b className="text-acid">hidden industry secret</b>:{" "}
                <b className="text-white">PlaylistPush promo code</b> creators whisper about.
              </p>
              <p className="mx-auto mt-2 max-w-[34ch] rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-[11px] leading-snug text-cyan-200">
                🤫 Shh, don't tell anyone I gave it to you…
              </p>
            </div>

            <div className="relative mx-auto mt-5 flex justify-center px-4 pb-2 sm:mt-6">
              <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
                <div className="relative">
                  <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
                  <div className="absolute left-1/2 top-[-2px] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-acid shadow-[0_0_12px_rgba(255,230,0,0.8)]" />
                </div>
              </div>
              <div className="absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-500/20 via-[#7c5cff]/20 to-[#ff3b82]/20 blur-[18px]" />
              <div className="relative h-[300px] w-[300px] shrink-0 sm:h-[340px] sm:w-[340px]">
              {/* carnival lights — 20 bulbs around wheel */}
              <div className="pointer-events-none absolute inset-[-14px] rounded-full" aria-hidden>
                {Array.from({ length: 20 }).map((_, i) => (
                  <span
                    key={i}
                    className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-[0_0_10px_rgba(255,255,255,0.9)] ${i % 2 === 0 ? "bg-acid" : i % 3 === 0 ? "bg-[#ff3b82]" : "bg-white"} animate-[carnivalBlink_0.9s_ease-in-out_infinite]`}
                    style={{
                      left: `${50 + 52 * Math.cos((i * 18 * Math.PI) / 180)}%`,
                      top: `${50 + 52 * Math.sin((i * 18 * Math.PI) / 180)}%`,
                      animationDelay: `${i * 70}ms`,
                    }}
                  />
                ))}
                <style>{`@keyframes carnivalBlink{0%,100%{opacity:1; transform:translate(-50%,-50%) scale(1); box-shadow:0 0 10px rgba(255,255,255,0.9)}50%{opacity:0.35; transform:translate(-50%,-50%) scale(0.78); box-shadow:0 0 4px rgba(255,255,255,0.4)}}`}</style>
              </div>
                <div
                  ref={wheelRef}
                  className="absolute inset-0 rounded-full border-[8px] border-white shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_0_0_3px_rgba(255,255,255,0.15)] will-change-transform"
                  style={{
                    background: buildConicGradient(),
                    transform: `rotate(${rotation}deg)`,
                    transition: wheelTransition,
                  }}
                >
                  <div className="absolute inset-[10px] rounded-full border border-white/25" />
                  <div className="absolute inset-[14px] rounded-full border border-black/10" />
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full rounded-full pointer-events-none" aria-hidden>
                    {SEGMENTS.map((_, i) => {
                      const angle = (i * SEGMENT_ANGLE * Math.PI) / 180;
                      const x2 = 50 + 50 * Math.sin(angle);
                      const y2 = 50 - 50 * Math.cos(angle);
                      return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="rgba(255,255,255,0.9)" strokeWidth="0.8" strokeLinecap="round" />;
                    })}
                  </svg>
                  {SEGMENTS.map((seg, i) => {
                    const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
                    const isJack = seg.isJackpot;
                    const isSecret = seg.isSecret;
                    return (
                      <div key={seg.label + i} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${angle}deg)`, transformOrigin: "0 0" }}>
                        <div className="flex flex-col items-center text-center" style={{ transform: `translate(-50%, -92px) rotate(90deg)`, width: isJack ? "96px" : isSecret ? "84px" : "72px" }}>
                          <span
                            className={`font-black leading-none tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] ${isJack ? "text-[10px] sm:text-[11px]" : "text-[9px] sm:text-[10px]"}`}
                            style={{ color: seg.textColor, textShadow: "0 1px 3px rgba(0,0,0,0.6)", lineHeight: isJack ? "1.05" : "1.15", whiteSpace: "pre-line" }}
                          >
                            {seg.label}
                            {seg.sub ? `\n${seg.sub}` : ""}
                          </span>
                          {isJack && <span className="mt-0.5 rounded-full bg-black/20 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-white/90 border border-white/30">SAVE $33</span>}
                          {isSecret && <span className="mt-0.5 rounded-full bg-cyan-400 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-ink">2ND PRIZE</span>}
                        </div>
                      </div>
                    );
                  })}
                  <div className="absolute left-1/2 top-1/2 flex h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-white bg-gradient-to-br from-[#1a1a22] to-black shadow-[0_6px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] sm:h-[96px] sm:w-[96px]">
                    <div className="text-center">
                      <div className="font-display text-[13px] leading-none tracking-[0.14em] text-cyan-400 sm:text-sm">SPIN</div>
                      <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/50">again</div>
                    </div>
                    <div className="absolute inset-0 rounded-full">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span
                          key={i}
                          className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/80"
                          style={{ left: `${50 + 38 * Math.cos((i * 30 * Math.PI) / 180)}%`, top: `${50 + 38 * Math.sin((i * 30 * Math.PI) / 180)}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-[-6px] rounded-full border border-cyan-500/20" />
              </div>
            </div>

            <div className="px-5 pb-5 sm:px-7 sm:pb-6">
              <button
                type="button"
                onClick={handleSecondSpin}
                disabled={spinning}
                className={`cta relative w-full overflow-hidden rounded-full px-6 py-4 font-display text-xl uppercase tracking-wide text-white shadow-[0_10px_30px_rgba(6,182,212,0.45)] transition ${spinning ? "cursor-wait bg-white/10 text-white/50" : "bg-gradient-to-r from-[#06b6d4] via-[#7c5cff] to-[#00d4ff] hover:brightness-[1.08] active:scale-[0.99]"}`}
              >
                <span className="relative flex items-center justify-center gap-2">
                  {spinning ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Spinning for secret...
                    </>
                  ) : (
                    <>
                      <span className="text-xl">🤫</span> SPIN FOR SECRET CODE
                    </>
                  )}
                </span>
              </button>
              <p className="mt-3 text-center text-[11px] leading-snug text-white/40">
                Hidden industry code — affiliate promo for{" "}
                <a href={PLAYLIST_PUSH_URL} target="_blank" rel="noreferrer" className="underline decoration-cyan-400 underline-offset-2 hover:text-cyan-300">
                  PlaylistPush
                </a>
                {" "}campaigns
              </p>
            </div>
          </>
        )}

        {phase === "secondWon" && firstCoupon && (
          <div className="px-5 py-6 text-center sm:px-7 sm:py-7">
            <div className="mx-auto -mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-[#7c5cff] to-[#ff3b82] text-3xl shadow-[0_10px_30px_rgba(6,182,212,0.45)] ring-4 ring-white/15 animate-[pop_420ms_cubic-bezier(0.34,1.56,0.64,1)]">
              🤫
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-[#7c5cff] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Secret Unlocked
            </p>
            <h3 className="mt-3 font-display text-[1.6rem] leading-[0.95] sm:text-3xl">
              SHHH...{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-acid to-[#7c5cff] bg-clip-text text-transparent">INDUSTRY SECRET</span>
            </h3>
            <p className="mx-auto mt-3 max-w-[38ch] text-[13px] leading-[1.55] text-white/70 sm:text-sm">
              Don't tell anyone I gave it to you… this is the code insiders whisper about for{" "}
              <b className="text-white">PlaylistPush</b> campaigns.
            </p>

            <div className="relative mt-5 overflow-hidden rounded-2xl border-2 border-cyan-400 bg-gradient-to-b from-cyan-500/15 via-white/[0.04] to-black/20 p-4 text-left shadow-[0_12px_40px_rgba(6,182,212,0.18)] sm:p-5">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/15 blur-2xl" />
              <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-[#7c5cff]/15 blur-2xl" />
              <div className="relative">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">Your hidden promo code</p>
                <p className="mt-1 font-display text-lg leading-none sm:text-xl">PLAYLIST CAMPAIGN DISCOUNT</p>
                <p className="mt-1 text-[12px] leading-snug text-white/60">
                  Use at checkout on{" "}
                  <a href={PLAYLIST_PUSH_URL} target="_blank" rel="noreferrer" className="font-bold text-cyan-300 underline underline-offset-2">
                    PlaylistPush.com
                  </a>{" "}
                  — genuine affiliate promo, gamified just for you.
                </p>
                <div className="mt-4 rounded-xl border-2 border-dashed border-cyan-400/40 bg-black/40 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Tap to copy — paste at PlaylistPush checkout</p>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className="font-mono text-2xl font-black tracking-[0.12em] text-white sm:text-3xl">{PLAYLIST_PUSH_CODE}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(PLAYLIST_PUSH_CODE)}
                      className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-black uppercase tracking-widest text-ink hover:bg-white"
                    >
                      Copy
                    </button>
                  </div>
                  <a
                    href={PLAYLIST_PUSH_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-ink hover:bg-cyan-50"
                  >
                    Open PlaylistPush.com →
                  </a>
                  <p className="mt-2 text-[11px] italic text-white/40">“Shh, don’t tell anyone I gave it to you…”</p>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-500 text-xs font-black text-white">✓</span>
                  <div>
                    <p className="text-[12px] font-bold leading-none text-white">Both prizes secured</p>
                    <p className="text-[11px] leading-snug text-white/50">
                      Founder Bundle {firstCoupon.code} • {formatRemainingMs(remainingMs)} left • + Secret {PLAYLIST_PUSH_CODE}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={onClaim}
                className="cta w-full rounded-full bg-acid px-6 py-4 font-display text-[1.05rem] uppercase tracking-wide text-ink shadow-[0_10px_30px_rgba(255,230,0,0.45)] hover:brightness-[1.06] sm:text-lg"
              >
                Claim Founder Bundle & Keep Code →
                <span className="mt-0.5 block text-[11px] font-sans font-bold normal-case tracking-normal opacity-70">Goes to checkout • Code saved • Use anytime at PlaylistPush</span>
              </button>
              <a
                href={PLAYLIST_PUSH_URL}
                target="_blank"
                rel="noreferrer"
                className="cta flex w-full items-center justify-center gap-2 rounded-full border-2 border-cyan-400 bg-transparent px-6 py-3.5 font-black uppercase tracking-widest text-cyan-300 hover:bg-cyan-400 hover:text-ink"
              >
                Go to PlaylistPush.com
              </a>
            </div>
            <p className="mx-auto mt-3 max-w-[38ch] text-center text-[10px] leading-snug text-white/25">
              Affiliate disclosure: this is a genuine PlaylistPush promo code shared via gamification. Use it at PlaylistPush checkout for your campaign.
            </p>

            <button type="button" onClick={onClose} className="mx-auto mt-4 block text-[12px] text-white/40 underline underline-offset-4 hover:text-white/70">
              Close and keep both codes
            </button>
          </div>
        )}

        <div className="border-t border-white/10 bg-black/20 px-4 py-3 text-center text-[10px] leading-relaxed tracking-wide text-white/25 sm:px-6">
          {phase === "secondWon" ? (
            <>Affiliate code {PLAYLIST_PUSH_CODE} for PlaylistPush.com • Founder Bundle reserved for this browser only</>
          ) : (
            <>Verified draw • This price is reserved for this browser only • Novelty prizes on wheel for fun</>
          )}
        </div>
      </div>
    </div>
  );
}

// small inline banner that sits near checkout to promote spin
export function LuckyUpsellInline({
  coupon,
  onSpinClick,
}: {
  coupon: LuckyCoupon | null;
  onSpinClick: () => void;
}) {
  if (coupon && coupon.expiresAt > Date.now()) {
    return (
      <div className="rounded-xl border-2 border-acid bg-gradient-to-br from-acid/15 via-acid/5 to-transparent p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1 rounded-full bg-acid px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-ink">🎉 Jackpot Unlocked</p>
            <p className="mt-2 font-display text-lg leading-none">FOUNDER BUNDLE $21</p>
            <p className="mt-1 text-[12px] text-white/60">
              Code <b className="font-mono text-white">{coupon.code}</b> • 1 in 10,000 • saves $33 • <b className="text-acid">{formatRemainingMs(Math.max(0, coupon.expiresAt - Date.now()))}</b> left
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-green-500 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">Active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a22] to-black/40 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#ff3b82] to-[#7c5cff] text-lg">🎡</span>
        <div className="flex-1">
          <p className="font-black text-sm leading-none">Want the founder price?</p>
          <p className="mt-1 text-[12px] leading-snug text-white/55">
            Spin the rainbow wheel — <b className="text-white">only 1 in 10,000</b> wins both add-ons for <b className="text-acid">$21</b> <span className="line-through">($54)</span>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSpinClick}
        className="cta mt-3 w-full rounded-full bg-gradient-to-r from-[#ff3b82] via-[#7c5cff] to-[#00d4ff] px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_6px_20px_rgba(124,92,255,0.35)]"
      >
        Spin the wheel — free
      </button>
      <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-white/25">Takes 5 seconds • No email needed</p>
    </div>
  );
}
