import { useEffect, useRef, useState } from "react";
import {
  generateLuckyCoupon,
  saveLuckyCoupon,
  type LuckyCoupon,
  formatRemainingMs,
} from "../lib/luckyCoupon";

type Segment = {
  label: string;
  sub?: string;
  color: string;
  textColor: string;
  isJackpot?: boolean;
  isSecret?: boolean;
};

// 8-slice carnival — clean, premium, not cluttered
const SEGMENTS: Segment[] = [
  { label: "10% OFF", color: "#F59E0B", textColor: "#111" }, // amber — near-miss
  { label: "$100", sub: "GUITAR CENTER", color: "#FB923C", textColor: "#fff" },
  { label: "TRY AGAIN", color: "#60A5FA", textColor: "#fff" },
  { label: "FREE MIX", color: "#F472B6", textColor: "#fff" },
  { label: "NO LUCK", color: "#A78BFA", textColor: "#fff" },
  { label: "SECRET", sub: "CODE", color: "#06B6D4", textColor: "#fff", isSecret: true },
  { label: "5% OFF", color: "#EF4444", textColor: "#fff" },
  { label: "JACKPOT", sub: "AU + KIT", color: "#10B981", textColor: "#fff", isJackpot: true },
];

const SEGMENT_COUNT = SEGMENTS.length;
const SECRET_INDEX = SEGMENTS.findIndex((s) => s.isSecret);
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
  return `conic-gradient(from -11.25deg, ${stops})`;
}

// audio — soft, not harsh
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
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 p-[1.5px] shadow-[0_4px_16px_rgba(251,146,60,0.35)] transition hover:shadow-[0_6px_24px_rgba(251,146,60,0.45)] hover:scale-[1.015] active:scale-[0.985] ${className}`}
    >
      <span className={`flex items-center gap-2.5 rounded-full bg-[#0F0F12] px-5 py-2.5 ${small ? "text-xs" : "text-sm"}`}>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-[13px]">🎡</span>
        <span className="font-extrabold tracking-tight text-white">Spin the wheel for a free discount</span>
        <span className="hidden sm:inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-black tracking-widest text-zinc-900">1 in 10,000</span>
      </span>
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

  useEffect(() => {
    if (phase !== "firstWon" && phase !== "secondWon" && phase !== "secondWheel") return;
    if (!firstCoupon) return;
    const t = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase, firstCoupon]);

  useEffect(() => {
    if (isOpen) {
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
    const NEAR_MISS_INDEX = 0; // 10% OFF
    const spins = 5 + Math.random() * 0.6;
    const nearMissCenter = NEAR_MISS_INDEX * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const jitter = (Math.random() - 0.5) * 2.5;
    const targetNearMiss = spins * 360 + (360 - nearMissCenter) + jitter;
    const targetJackpot = targetNearMiss + SEGMENT_ANGLE;

    const start = Date.now();
    const tickInterval = window.setInterval(() => {
      if (Date.now() - start > 3350) {
        clearInterval(tickInterval);
        return;
      }
      playTick(0.9);
    }, 78);

    setWheelTransition("transform 3550ms cubic-bezier(0.22, 0.85, 0.24, 1)");
    requestAnimationFrame(() => setRotation(targetNearMiss));

    const nearMissTimeout = window.setTimeout(() => {
      clearInterval(tickInterval);
      playNearMissTick();
      const hesitation = window.setTimeout(() => {
        playRisingDing();
        try {
          navigator.vibrate?.([18, 22, 18]);
        } catch {}
        setWheelTransition("transform 720ms cubic-bezier(0.34, 1.56, 0.64, 1)");
        setRotation(targetJackpot);
        timeoutRef.current = window.setTimeout(() => {
          setWheelTransition("none");
          const c = generateLuckyCoupon();
          saveLuckyCoupon(c);
          setFirstCoupon(c);
          setPhase("firstWon");
          setSpinning(false);
          onWin(c);
          try {
            navigator.vibrate?.([24, 16, 24]);
          } catch {}
        }, 740) as unknown as number;
      }, 480) as unknown as number;
      void hesitation;
    }, 3550) as unknown as number;

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
    const spins = 5 + Math.random() * 0.7;
    const secretCenter = SECRET_INDEX * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const jitter = (Math.random() - 0.5) * 3;
    const targetRotation = spins * 360 + (360 - secretCenter) + jitter;
    setWheelTransition("transform 4200ms cubic-bezier(0.18, 0.82, 0.22, 1)");
    const sStart = Date.now();
    const sTick = window.setInterval(() => {
      if (Date.now() - sStart > 3800) {
        clearInterval(sTick);
        return;
      }
      playTick(0.85);
    }, 88);
    void sTick;
    requestAnimationFrame(() => setRotation(targetRotation));
    timeoutRef.current = window.setTimeout(() => {
      setWheelTransition("none");
      setPhase("secondWon");
      setSpinning(false);
      playRisingDing();
      try {
        navigator.vibrate?.([28, 18, 28]);
        localStorage.setItem("rr_secret_playlist_revealed", "1");
      } catch {}
    }, 4200);
  };

  const remainingMs = firstCoupon ? Math.max(0, firstCoupon.expiresAt - nowMs) : 0;
  const showConfetti = phase === "firstWon" || phase === "secondWon";

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-[#070709]/80 p-4 backdrop-blur-[10px]"
      onClick={() => !spinning && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wheel-title"
    >
      {/* subtle backdrop gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,146,60,0.12),transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(6,182,212,0.10),transparent_55%)]" />

      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {Array.from({ length: 36 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 rounded-full animate-[confettiFall_1.4s_ease-out_forwards]"
              style={{
                left: `${3 + i * 2.6}%`,
                width: `${5 + (i % 3) * 3}px`,
                height: `${7 + (i % 2) * 5}px`,
                background: ["#F59E0B", "#FB923C", "#06B6D4", "#10B981", "#A78BFA", "#F472B6", "#fff"][i % 7],
                animationDelay: `${i * 28}ms`,
                transform: `rotate(${Math.random() * 360}deg)`,
                opacity: 0.95,
              }}
            />
          ))}
          <style>{`@keyframes confettiFall{0%{transform:translateY(-20vh) rotate(0deg); opacity:1} 100%{transform:translateY(110vh) rotate(680deg); opacity:0}}`}</style>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[520px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0F0F12] shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)]"
      >
        {/* top bar — minimal */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
          <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            {phase === "secondWon" || phase === "secondWheel" ? "SECRET CODE" : "VERIFIED DRAW"}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-[11px] tracking-wide text-white/50">
            1 in 10,000
            <span className="h-1 w-1 rounded-full bg-white/40" />
            live
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={spinning}
            aria-label="Close"
            className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            ×
          </button>
        </div>

        {phase === "firstWheel" && (
          <div className="px-6 pt-6 pb-6 sm:px-7">
            <div className="text-center">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-black tracking-[0.12em] text-amber-300">
                <span className="text-[13px]">🎪</span> 8-SLICE CARNIVAL WHEEL
              </p>
              <h2 id="wheel-title" className="mt-3 font-display text-[1.7rem] leading-none tracking-tight text-white sm:text-[1.9rem]">
                Spin for your <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">discount</span>
              </h2>
              <p className="mx-auto mt-2 max-w-[32ch] text-[13px] leading-relaxed text-white/55">
                Novelty prizes inside — watch it <span className="font-semibold text-amber-300">near-miss 10% OFF</span> then snap to <span className="font-semibold text-emerald-400">JACKPOT</span>
              </p>
            </div>

            {/* wheel stage — premium, not cluttered */}
            <div className="relative mx-auto mt-6 flex justify-center">
              {/* pointer — sleek */}
              <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[1px]">
                <div className="relative">
                  <div className="h-0 w-0 border-l-[11px] border-r-[11px] border-t-[18px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)]" />
                  <div className="absolute left-1/2 top-[-1px] h-2.5 w-2.5 -translate-x-1/2 rounded-full border-[2px] border-white bg-amber-400 shadow-[0_0_10px_rgba(251,146,60,0.9)]" />
                </div>
              </div>

              {/* soft glow */}
              <div className="absolute left-1/2 top-1/2 h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-500/[0.07] via-orange-500/[0.07] to-cyan-500/[0.07] blur-[20px]" />

              <div className="relative h-[300px] w-[300px] sm:h-[330px] sm:w-[330px]">
                {/* outer gold ring with subtle lights — minimal */}
                <div className="absolute inset-[-7px] rounded-full bg-gradient-to-b from-white/15 to-white/5 p-[1px] shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
                  <div className="h-full w-full rounded-full bg-[#0F0F12] p-[6px]">
                    <div className="relative h-full w-full rounded-full bg-[#0F0F12] shadow-[inset_0_2px_12px_rgba(0,0,0,0.5)]">
                      {/* lights — very subtle, 16 dots, slow */}
                      <div className="pointer-events-none absolute inset-[-9px] rounded-full" aria-hidden>
                        {Array.from({ length: 16 }).map((_, i) => (
                          <span
                            key={i}
                            className={`absolute h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full ${i % 2 === 0 ? "bg-amber-300" : "bg-white"} shadow-[0_0_8px_rgba(255,255,255,0.7)]`}
                            style={{
                              left: `${50 + 50.5 * Math.cos((i * 22.5 * Math.PI) / 180)}%`,
                              top: `${50 + 50.5 * Math.sin((i * 22.5 * Math.PI) / 180)}%`,
                              opacity: 0.9,
                            }}
                          />
                        ))}
                      </div>

                      <div
                        className="absolute inset-[7px] overflow-hidden rounded-full border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] will-change-transform"
                        style={{
                          background: buildConicGradient(),
                          transform: `rotate(${rotation}deg)`,
                          transition: wheelTransition,
                        }}
                      >
                        {/* inner highlight */}
                        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_8px_rgba(0,0,0,0.25)]" />
                        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full rounded-full" aria-hidden>
                          {SEGMENTS.map((_, i) => {
                            const angle = (i * SEGMENT_ANGLE * Math.PI) / 180;
                            const x2 = 50 + 50 * Math.sin(angle);
                            const y2 = 50 - 50 * Math.cos(angle);
                            return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="rgba(255,255,255,0.14)" strokeWidth="0.6" />;
                          })}
                        </svg>
                        {/* labels — clean, single line where possible */}
                        {SEGMENTS.map((seg, i) => {
                          const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
                          const isJack = seg.isJackpot;
                          return (
                            <div
                              key={seg.label + i}
                              className="absolute left-1/2 top-1/2"
                              style={{ transform: `rotate(${angle}deg)`, transformOrigin: "0 0" }}
                            >
                              <div
                                className="flex flex-col items-center text-center"
                                style={{
                                  transform: `translate(-50%, -102px) rotate(90deg)`,
                                  width: isJack ? "94px" : "78px",
                                }}
                              >
                                <span
                                  className={`font-black tracking-[0.02em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] ${isJack ? "text-[11px]" : "text-[10px]"}`}
                                  style={{ color: seg.textColor, lineHeight: 1.05, whiteSpace: "pre-line" }}
                                >
                                  {seg.label}
                                  {seg.sub ? `\n${seg.sub}` : ""}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* center hub — premium */}
                      <div className="absolute left-1/2 top-1/2 grid h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] sm:h-[92px] sm:w-[92px]">
                        <div className="grid h-[72px] w-[72px] place-items-center rounded-full border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent sm:h-[80px] sm:w-[80px]">
                          <div className="text-center">
                            <div className="font-display text-[12px] tracking-[0.16em] text-white">SPIN</div>
                            <div className="text-[9px] font-bold tracking-[0.18em] text-white/45">TO WIN</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleFirstSpin}
                disabled={spinning}
                className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-[14px] font-black tracking-tight text-zinc-900 shadow-[0_8px_20px_rgba(251,146,60,0.35)] transition hover:shadow-[0_10px_28px_rgba(251,146,60,0.45)] hover:brightness-[1.03] active:scale-[0.985] disabled:cursor-wait disabled:opacity-60"
              >
                <span className="flex items-center justify-center gap-2 text-[15px]">
                  {spinning ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900/20 border-t-zinc-900" />
                      Spinning...
                    </>
                  ) : (
                    <>Tap to spin — free</>
                  )}
                </span>
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition duration-700" />
              </button>
              <p className="mt-2.5 text-center text-[11px] font-medium tracking-wide text-white/35">342 spinning now • No email • 5 seconds</p>
            </div>
          </div>
        )}

        {phase === "firstWon" && firstCoupon && (
          <div className="px-5 pb-6 pt-5 sm:px-6">
            <div className="text-center">
              <div className="mx-auto grid h-[56px] w-[56px] place-items-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-xl shadow-[0_8px_20px_rgba(251,146,60,0.35)]">
                ✓
              </div>
              <p className="mt-3 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black tracking-[0.14em] text-emerald-300">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                JACKPOT — 1 IN 10,000
              </p>
              <h3 className="mt-2 font-display text-[1.65rem] leading-none tracking-tight text-white">
                You won <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">AU + KIT</span>
              </h3>
              <p className="mx-auto mt-1.5 max-w-[30ch] text-[13px] leading-relaxed text-white/55">
                Pre-selected at checkout for <span className="font-semibold text-white">$21</span> <span className="line-through opacity-40">$54</span> • <span className="font-mono text-white/70">{firstCoupon.code}</span>
              </p>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03]">
              <div className="grid gap-px bg-white/[0.06] p-px">
                <div className="flex items-center justify-between bg-[#0F0F12] px-3.5 py-2.5">
                  <span className="text-sm font-semibold text-white">📄 Indie Contract Kit</span>
                  <span className="text-right">
                    <span className="block text-[11px] line-through text-white/30">$25</span>
                    <span className="font-display text-[15px] leading-none text-emerald-400">$9</span>
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[#0F0F12] px-3.5 py-2.5">
                  <span className="text-sm font-semibold text-white">🇦🇺 AU Radio List</span>
                  <span className="text-right">
                    <span className="block text-[11px] line-through text-white/30">$29</span>
                    <span className="font-display text-[15px] leading-none text-emerald-400">$12</span>
                  </span>
                </div>
                <div className="flex items-center justify-between bg-emerald-500/[0.08] px-3.5 py-3">
                  <span className="text-xs font-black tracking-[0.12em] text-emerald-300">BUNDLE</span>
                  <span className="text-right">
                    <span className="text-[11px] line-through text-white/30">$54</span>
                    <span className="ml-2 font-display text-lg leading-none text-white">$21</span>
                    <span className="ml-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black tracking-widest text-white">SAVE $33</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
                <span className="font-mono text-xs font-bold tracking-wide text-white/70">{firstCoupon.code}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs tabular-nums text-amber-300">{formatRemainingMs(remainingMs)}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(firstCoupon.code)}
                    className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black tracking-wide text-zinc-900 hover:bg-zinc-100"
                  >
                    Copy
                  </button>
                </span>
              </div>
              <div className="h-1 bg-white/10">
                <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-1000" style={{ width: `${Math.max(6, (remainingMs / (15 * 60 * 1000)) * 100)}%` }} />
              </div>
            </div>

            <button
              type="button"
              onClick={onClaim}
              className="mt-4 w-full rounded-full bg-white px-6 py-3.5 font-black tracking-tight text-zinc-900 shadow-[0_8px_20px_rgba(255,255,255,0.12)] hover:bg-zinc-100 active:scale-[0.985]"
            >
              Continue to checkout →
            </button>

            <div className="relative my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-black tracking-[0.12em] text-cyan-300">ONE MORE CHANCE</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="rounded-2xl border border-cyan-500/15 bg-gradient-to-b from-cyan-500/[0.06] to-transparent p-4 text-left">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">🤫</span>
                <div>
                  <p className="text-xs font-black tracking-[0.12em] text-cyan-300">SECOND SPIN UNLOCKED</p>
                  <p className="text-sm font-bold leading-none text-white">Reveal your secret code</p>
                </div>
                <span className="ml-auto hidden sm:inline-flex rounded-full bg-white px-2 py-1 text-[10px] font-black tracking-widest text-zinc-900">FR2AZEF</span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-2.5">
                <span className="font-mono text-sm font-black tracking-[0.16em] text-white/20 blur-[3px]">FR2AZEF</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black tracking-wide text-zinc-900">Tap spin to reveal</span>
              </div>
              <button
                type="button"
                onClick={handleGoToSecondWheel}
                className="mt-3 w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-black tracking-tight text-white shadow-[0_8px_20px_rgba(6,182,212,0.3)] hover:brightness-[1.05] active:scale-[0.985]"
              >
                Spin again — reveal secret →
              </button>
              <p className="mt-2 text-center text-[11px] font-medium text-white/35">Always lands on <span className="font-bold text-cyan-300">SHHH... INDUSTRY SECRET</span></p>
            </div>
          </div>
        )}

        {phase === "secondWheel" && (
          <div className="px-6 pt-5 pb-6 sm:px-7">
            <div className="text-center">
              <p className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-black tracking-[0.12em] text-cyan-300">🤫 SECOND SPIN</p>
              <h2 className="mt-2 font-display text-xl leading-none tracking-tight text-white">One more prize</h2>
              <p className="mx-auto mt-1.5 max-w-[30ch] text-[13px] leading-relaxed text-white/55">Hidden industry secret — <span className="font-semibold text-white">PlaylistPush code</span> inside.</p>
            </div>

            <div className="relative mx-auto mt-6 flex justify-center">
              <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[1px]">
                <div className="h-0 w-0 border-l-[11px] border-r-[11px] border-t-[18px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)]" />
              </div>
              <div className="relative h-[300px] w-[300px] sm:h-[330px] sm:w-[330px]">
                <div className="absolute inset-[-7px] rounded-full bg-gradient-to-b from-white/15 to-white/5 p-[1px]">
                  <div className="h-full w-full rounded-full bg-[#0F0F12] p-[6px]">
                    <div className="relative h-full w-full rounded-full bg-[#0F0F12]">
                      <div className="pointer-events-none absolute inset-[-9px] rounded-full" aria-hidden>
                        {Array.from({ length: 16 }).map((_, i) => (
                          <span
                            key={i}
                            className="absolute h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                            style={{
                              left: `${50 + 50.5 * Math.cos((i * 22.5 * Math.PI) / 180)}%`,
                              top: `${50 + 50.5 * Math.sin((i * 22.5 * Math.PI) / 180)}%`,
                            }}
                          />
                        ))}
                      </div>
                      <div
                        className="absolute inset-[7px] overflow-hidden rounded-full border border-white/10 will-change-transform"
                        style={{ background: buildConicGradient(), transform: `rotate(${rotation}deg)`, transition: wheelTransition }}
                      >
                        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full rounded-full" aria-hidden>
                          {SEGMENTS.map((_, i) => {
                            const angle = (i * SEGMENT_ANGLE * Math.PI) / 180;
                            const x2 = 50 + 50 * Math.sin(angle);
                            const y2 = 50 - 50 * Math.cos(angle);
                            return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="rgba(255,255,255,0.14)" strokeWidth="0.6" />;
                          })}
                        </svg>
                        {SEGMENTS.map((seg, i) => {
                          const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
                          const isJack = seg.isJackpot;
                          return (
                            <div key={seg.label + i} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${angle}deg)`, transformOrigin: "0 0" }}>
                              <div className="flex flex-col items-center text-center" style={{ transform: `translate(-50%, -102px) rotate(90deg)`, width: isJack ? "94px" : "78px" }}>
                                <span className={`font-black tracking-[0.02em] ${isJack ? "text-[11px]" : "text-[10px]"}`} style={{ color: seg.textColor, lineHeight: 1.05, whiteSpace: "pre-line" }}>
                                  {seg.label}
                                  {seg.sub ? `\n${seg.sub}` : ""}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="absolute left-1/2 top-1/2 grid h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-[0_8px_24px_rgba(0,0,0,0.5)] sm:h-[92px] sm:w-[92px]">
                        <div className="grid h-[72px] w-[72px] place-items-center rounded-full border border-white/10 bg-white/[0.06] sm:h-[80px] sm:w-[80px]">
                          <div className="text-center">
                            <div className="font-display text-[12px] tracking-[0.16em] text-white">SPIN</div>
                            <div className="text-[9px] font-bold tracking-[0.18em] text-white/45">AGAIN</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSecondSpin}
              disabled={spinning}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3.5 font-black tracking-tight text-white shadow-[0_8px_20px_rgba(6,182,212,0.3)] hover:brightness-[1.05] disabled:opacity-60"
            >
              {spinning ? "Spinning for secret..." : "Spin for secret code"}
            </button>
            <p className="mt-2 text-center text-[11px] text-white/35">
              Affiliate promo for <a href={PLAYLIST_PUSH_URL} target="_blank" rel="noreferrer" className="underline decoration-cyan-400 underline-offset-2">PlaylistPush</a>
            </p>
          </div>
        )}

        {phase === "secondWon" && firstCoupon && (
          <div className="px-5 pb-6 pt-5 sm:px-6">
            <div className="text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">🤫</div>
              <p className="mt-3 inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-black tracking-[0.12em] text-cyan-300">SECRET UNLOCKED</p>
              <h3 className="mt-2 font-display text-xl leading-none tracking-tight text-white">
                SHHH... <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">INDUSTRY SECRET</span>
              </h3>
              <p className="mx-auto mt-1.5 max-w-[32ch] text-[13px] leading-relaxed text-white/55">Don't tell anyone — insiders use this for PlaylistPush.</p>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/[0.06] to-transparent">
              <div className="bg-cyan-500/10 px-4 py-2.5 text-center">
                <p className="text-[11px] font-black tracking-[0.14em] text-cyan-300">PLAYLIST CAMPAIGN DISCOUNT</p>
              </div>
              <div className="p-4">
                <div className="rounded-xl border-2 border-dashed border-cyan-500/30 bg-zinc-900 p-4 text-center">
                  <p className="text-[10px] font-black tracking-[0.14em] text-white/40">TAP TO COPY</p>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className="font-mono text-2xl font-black tracking-[0.14em] text-white">{PLAYLIST_PUSH_CODE}</span>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(PLAYLIST_PUSH_CODE)} className="rounded-full bg-white px-3 py-1.5 text-xs font-black tracking-wide text-zinc-900">
                      Copy
                    </button>
                  </div>
                  <a href={PLAYLIST_PUSH_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center rounded-full bg-cyan-400 px-4 py-2 text-xs font-black tracking-wide text-zinc-900">
                    Open PlaylistPush.com →
                  </a>
                  <p className="mt-2 text-[11px] italic text-white/30">“Shh, don’t tell anyone I gave it to you…”</p>
                </div>
                <p className="mt-3 text-center text-xs text-white/50">
                  Use at <a href={PLAYLIST_PUSH_URL} target="_blank" rel="noreferrer" className="font-semibold text-cyan-300 underline">PlaylistPush.com</a> checkout • Founder bundle {firstCoupon.code} still active
                </p>
              </div>
            </div>

            <button type="button" onClick={onClaim} className="mt-4 w-full rounded-full bg-white px-6 py-3.5 font-black tracking-tight text-zinc-900 hover:bg-zinc-100">
              Claim bundle & keep code →
            </button>
            <p className="mt-2 text-center text-[11px] text-white/25">Affiliate code • Use anytime at PlaylistPush</p>
          </div>
        )}

        <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center text-[10px] tracking-wide text-white/25">
          {phase === "secondWon" ? <>Code {PLAYLIST_PUSH_CODE} for PlaylistPush.com • Bundle reserved for this browser</> : <>Verified • Novelty prizes for fun • Jackpot is pre-selected upsells</>}
        </div>
      </div>
    </div>
  );
}

export function LuckyUpsellInline({
  coupon,
  onSpinClick,
}: {
  coupon: LuckyCoupon | null;
  onSpinClick: () => void;
}) {
  if (coupon && coupon.expiresAt > Date.now()) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black tracking-[0.14em] text-white">JACKPOT ACTIVE</span>
          <span className="font-mono text-xs tabular-nums text-emerald-300">{formatRemainingMs(Math.max(0, coupon.expiresAt - Date.now()))}</span>
        </div>
        <p className="mt-2 font-display text-base leading-none text-white">FOUNDER BUNDLE $21</p>
        <p className="mt-1 font-mono text-xs text-white/60">
          {coupon.code} • <span className="text-emerald-300">saves $33</span>
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-sm">🎡</span>
        <div>
          <p className="text-sm font-bold leading-none text-white">Want the founder price?</p>
          <p className="mt-1 text-xs leading-snug text-white/50">
            Spin — <span className="font-semibold text-white">1 in 10,000</span> wins AU + Kit for <span className="font-semibold text-white">$21</span>
          </p>
        </div>
      </div>
      <button type="button" onClick={onSpinClick} className="mt-3 w-full rounded-full bg-white px-4 py-2.5 text-sm font-black tracking-tight text-zinc-900 hover:bg-zinc-100">
        Spin the wheel — free
      </button>
    </div>
  );
}
