import { useEffect, useRef, useState } from "react";
import {
  generateLuckyCoupon,
  saveLuckyCoupon,
  type LuckyCoupon,
  formatRemainingMs,
} from "../lib/luckyCoupon";

// Rainbow segments — 8 slices
type Segment = {
  label: string;
  sub?: string;
  color: string;
  textColor: string;
  isJackpot?: boolean;
};

const SEGMENTS: Segment[] = [
  { label: "5% OFF", color: "#ef4444", textColor: "#fff" }, // red
  { label: "TRY", sub: "AGAIN", color: "#3b82f6", textColor: "#fff" }, // blue
  { label: "$2 OFF", color: "#f97316", textColor: "#fff" }, // orange
  { label: "NO LUCK", color: "#ec4899", textColor: "#fff" }, // pink
  { label: "10% OFF", color: "#8b5cf6", textColor: "#fff" }, // purple
  { label: "20% OFF", color: "#06b6d4", textColor: "#fff" }, // cyan
  { label: "15% OFF", color: "#eab308", textColor: "#111" }, // yellow
  { label: "★ JACKPOT ★", sub: "BOTH FOR $21", color: "#22c55e", textColor: "#fff", isJackpot: true }, // jackpot green — pre-selected upsells
];

const SEGMENT_COUNT = SEGMENTS.length;
const JACKPOT_INDEX = SEGMENTS.findIndex((s) => s.isJackpot); // 7
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

function buildConicGradient() {
  let stops = "";
  SEGMENTS.forEach((seg, i) => {
    const start = i * SEGMENT_ANGLE;
    const end = (i + 1) * SEGMENT_ANGLE;
    stops += `${seg.color} ${start}deg ${end}deg${i < SEGMENTS.length - 1 ? ", " : ""}`;
  });
  return `conic-gradient(from 0deg, ${stops})`;
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

export function LuckyWheelModal({
  isOpen,
  onClose,
  onWin,
  onClaim,
}: {
  isOpen: boolean;
  onClose: () => void;
  onWin: (coupon: LuckyCoupon) => void;
  onClaim: () => void;
}) {
  const [spinning, setSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [coupon, setCoupon] = useState<LuckyCoupon | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const timeoutRef = useRef<number | null>(null);
  const resultTimeoutRef = useRef<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // live countdown for result screen
  useEffect(() => {
    if (!showResult || !coupon) return;
    const t = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [showResult, coupon]);

  // reset on open
  useEffect(() => {
    if (isOpen) {
      setSpinning(false);
      setHasSpun(false);
      setShowResult(false);
      setRotation(0);
      setCoupon(null);
      setNowMs(Date.now());
    } else {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (resultTimeoutRef.current) window.clearTimeout(resultTimeoutRef.current);
    }
  }, [isOpen]);

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

  const handleSpin = () => {
    if (spinning || hasSpun) return;
    setSpinning(true);
    setHasSpun(true);

    // rigged to jackpot — pre-selected upsells at discounted price
    const spins = 5 + Math.random() * 1.2; // 5-6.2 full spins
    const jackpotCenter = JACKPOT_INDEX * SEGMENT_ANGLE + SEGMENT_ANGLE / 2; // 337.5
    const jitter = (Math.random() - 0.5) * 8;
    const targetRotation = spins * 360 + (360 - jackpotCenter) + jitter;

    requestAnimationFrame(() => {
      setRotation(targetRotation);
    });

    timeoutRef.current = window.setTimeout(() => {
      const c = generateLuckyCoupon();
      saveLuckyCoupon(c);
      setCoupon(c);
      setShowResult(true);
      setSpinning(false);
      onWin(c);
      try {
        navigator.vibrate?.([30, 50, 30]);
      } catch {}
    }, 4200);
  };

  const remainingMs = coupon ? Math.max(0, coupon.expiresAt - nowMs) : 0;

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-3 backdrop-blur-[6px] sm:p-4"
      onClick={() => !spinning && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wheel-title"
    >
      {/* confetti behind modal when won */}
      {showResult && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 h-2 w-1.5 animate-[confettiFall_1.2s_ease-out_forwards] rounded-full"
              style={{
                left: `${4 + i * 3.4}%`,
                background: ["#ffe600", "#ff3b82", "#00d4ff", "#22c55e", "#a855f7", "#f97316"][i % 6],
                animationDelay: `${i * 45}ms`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
          <style>{`@keyframes confettiFall{0%{transform:translateY(-20vh) rotate(0deg); opacity:1} 100%{transform:translateY(105vh) rotate(720deg); opacity:0}}`}</style>
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[480px] overflow-hidden rounded-[20px] border-2 border-white/15 bg-gradient-to-b from-[#1a1a22] to-[#08080a] shadow-[0_20px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)] sm:max-w-[520px] sm:rounded-[28px]"
      >
        {/* top rarity bar */}
        <div className="bg-gradient-to-r from-[#ff3b82] via-[#7c5cff] to-[#00d4ff] px-3 py-2 text-center">
          <p className="font-black text-[11px] uppercase tracking-[0.18em] text-white drop-shadow sm:text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white shadow" />
              Only 1 in 10,000 visitors win the jackpot
              <span className="hidden sm:inline">• verified live draw</span>
            </span>
          </p>
        </div>

        {!showResult ? (
          <>
            {/* header */}
            <div className="px-5 pt-5 text-center sm:px-7 sm:pt-6">
              <h2
                id="wheel-title"
                className="font-display text-[1.55rem] leading-[1] sm:text-3xl"
              >
                <span className="bg-gradient-to-r from-[#ff6b9d] via-acid to-[#00e5ff] bg-clip-text text-transparent">
                  SPIN THE RAINBOW WHEEL
                </span>
              </h2>
              <p className="mx-auto mt-2 max-w-[36ch] text-[13px] leading-[1.5] text-white/70 sm:text-sm">
                8 possibilities. 1 jackpot. Land on the green{" "}
                <b className="text-acid">JACKPOT</b> and unlock{" "}
                <b className="text-white">both checkout add-ons</b> at their founder price —{" "}
                <b className="text-acid">$21</b>{" "}
                <span className="text-white/40 line-through">($54)</span>.
              </p>

              <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-bold uppercase tracking-wider text-white/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  342 spinning now
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-acid/30 bg-acid/10 px-2.5 py-1 font-bold uppercase tracking-wider text-acid">
                  3 winners in last hour
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-white/50">
                  draw #RR-{(Math.floor(Math.random() * 9000) + 1000)}
                </span>
              </div>
            </div>

            {/* wheel stage */}
            <div className="relative mx-auto mt-5 flex justify-center px-4 pb-2 sm:mt-6">
              {/* pointer */}
              <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
                <div className="relative">
                  <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
                  <div className="absolute left-1/2 top-[-2px] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-acid shadow-[0_0_12px_rgba(255,230,0,0.8)]" />
                </div>
              </div>

              {/* glow behind wheel */}
              <div className="absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#ff3b82]/20 via-[#7c5cff]/20 to-[#00d4ff]/20 blur-[18px]" />

              {/* wheel container */}
              <div className="relative h-[300px] w-[300px] shrink-0 sm:h-[340px] sm:w-[340px]">
                <div
                  ref={wheelRef}
                  className="absolute inset-0 rounded-full border-[8px] border-white shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_0_0_3px_rgba(255,255,255,0.15)] will-change-transform"
                  style={{
                    background: buildConicGradient(),
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning
                      ? "transform 4.2s cubic-bezier(0.12, 0.78, 0.18, 1)"
                      : "none",
                  }}
                >
                  {/* inner highlight ring */}
                  <div className="absolute inset-[10px] rounded-full border border-white/25" />
                  <div className="absolute inset-[14px] rounded-full border border-black/10" />

                  {/* segment dividers */}
                  <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 h-full w-full rounded-full pointer-events-none"
                    aria-hidden
                  >
                    {SEGMENTS.map((_, i) => {
                      const angle = (i * SEGMENT_ANGLE * Math.PI) / 180;
                      const x2 = 50 + 50 * Math.sin(angle);
                      const y2 = 50 - 50 * Math.cos(angle);
                      return (
                        <line
                          key={i}
                          x1="50"
                          y1="50"
                          x2={x2}
                          y2={y2}
                          stroke="rgba(255,255,255,0.9)"
                          strokeWidth="0.8"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </svg>

                  {/* labels */}
                  {SEGMENTS.map((seg, i) => {
                    const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
                    const isJack = seg.isJackpot;
                    return (
                      <div
                        key={seg.label + i}
                        className="absolute left-1/2 top-1/2"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          transformOrigin: "0 0",
                        }}
                      >
                        <div
                          className="flex flex-col items-center text-center"
                          style={{
                            transform: `translate(-50%, -92px) rotate(90deg)`,
                            width: isJack ? "96px" : "72px",
                          }}
                        >
                          <span
                            className={`font-black leading-none tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] ${
                              isJack
                                ? "text-[10px] sm:text-[11px]"
                                : "text-[10px] sm:text-[11px]"
                            }`}
                            style={{
                              color: seg.textColor,
                              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                              lineHeight: isJack ? "1.05" : "1.15",
                              whiteSpace: "pre-line",
                            }}
                          >
                            {seg.label}
                            {seg.sub ? `\n${seg.sub}` : ""}
                          </span>
                          {isJack && (
                            <span className="mt-0.5 rounded-full bg-black/20 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-white/90 border border-white/30">
                              SAVE $33
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* center hub */}
                  <div className="absolute left-1/2 top-1/2 flex h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-white bg-gradient-to-br from-[#1a1a22] to-black shadow-[0_6px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] sm:h-[96px] sm:w-[96px]">
                    <div className="text-center">
                      <div className="font-display text-[13px] leading-none tracking-[0.14em] text-acid sm:text-sm">
                        SPIN
                      </div>
                      <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/50">
                        to win
                      </div>
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

            {/* spin button */}
            <div className="px-5 pb-5 sm:px-7 sm:pb-6">
              <button
                type="button"
                onClick={handleSpin}
                disabled={spinning || hasSpun}
                className={`cta relative w-full overflow-hidden rounded-full px-6 py-4 font-display text-xl uppercase tracking-wide text-white shadow-[0_10px_30px_rgba(124,92,255,0.45)] transition ${
                  spinning || hasSpun
                    ? "cursor-wait bg-white/10 text-white/50"
                    : "bg-gradient-to-r from-[#ff3b82] via-[#7c5cff] to-[#00d4ff] hover:brightness-[1.08] active:scale-[0.99]"
                }`}
              >
                <span className="relative flex items-center justify-center gap-2">
                  {spinning ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Spinning...
                    </>
                  ) : hasSpun ? (
                    "Good luck..."
                  ) : (
                    <>
                      <span className="text-xl">🎡</span> TAP TO SPIN
                      <span className="hidden sm:inline text-sm opacity-80">— free</span>
                    </>
                  )}
                </span>
                {!spinning && !hasSpun && (
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.6s_ease_infinite]" />
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] leading-none text-white/35">
                <span className="h-px w-8 bg-white/10" />
                <span>No email required • Instant win check</span>
                <span className="h-px w-8 bg-white/10" />
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <img
                    src="https://i.pravatar.cc/100?img=33"
                    alt=""
                    aria-hidden
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-white/15"
                  />
                  <div className="text-left leading-tight">
                    <p className="text-[12px] font-bold text-white">Maya K. just won</p>
                    <p className="text-[11px] text-white/50">Founder Bundle $21 • 2m ago</p>
                  </div>
                </div>
                <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-green-400 border border-green-500/20">
                  Live
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={spinning}
                className="mx-auto mt-3 block text-[12px] text-white/30 underline underline-offset-4 hover:text-white/60 disabled:opacity-30"
              >
                No thanks, I don't like discounts
              </button>

              <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
            </div>
          </>
        ) : (
          // RESULT - JACKPOT WIN — pre-selected upsells at discounted price
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
              <span className="bg-gradient-to-r from-acid via-[#ff6b9d] to-[#00e5ff] bg-clip-text text-transparent">
                1 IN 10,000!
              </span>
            </h3>

            <p className="mx-auto mt-3 max-w-[38ch] text-[13px] leading-[1.55] text-white/70 sm:text-sm">
              You beat <b className="text-white">9,999</b> other visitors. The rainbow stopped on{" "}
              <b className="text-acid">JACKPOT</b> — that almost never happens.
              <br />
              <span className="text-white/50">
                Winner ID: <b className="font-mono text-white">{coupon?.winnerId}</b> • Draw #{coupon?.winnerNumber}
              </span>
            </p>

            {/* coupon card — both add-ons */}
            <div className="relative mt-5 overflow-hidden rounded-2xl border-2 border-acid bg-gradient-to-b from-acid/15 via-white/[0.04] to-black/20 p-4 text-left shadow-[0_12px_40px_rgba(255,230,0,0.18)] sm:p-5">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-acid/15 blur-2xl" />
              <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-[#7c5cff]/15 blur-2xl" />

              <div className="relative">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-acid">
                  Your exclusive prize — pre-selected at checkout
                </p>
                <p className="mt-1 font-display text-xl leading-none sm:text-2xl">
                  FOUNDER'S BUNDLE UNLOCKED
                </p>
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
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Coupon code
                  </p>
                  <p className="mt-1 flex items-center gap-2 font-mono text-[13px] font-black tracking-[0.08em] text-white">
                    {coupon?.code}
                    <button
                      type="button"
                      onClick={() => {
                        if (coupon) navigator.clipboard?.writeText(coupon.code);
                      }}
                      className="rounded bg-white px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-ink hover:bg-acid"
                    >
                      Copy
                    </button>
                  </p>
                  <p className="mt-1 text-[11px] text-white/40">Auto-applied at checkout</p>
                </div>
                <div className="rounded-xl border border-acid/30 bg-acid/10 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-acid/70">
                    Prize expires in
                  </p>
                  <p className="mt-1 font-display text-2xl leading-none tracking-wide text-acid tabular-nums">
                    {formatRemainingMs(remainingMs)}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
                    Don't miss it
                  </p>
                </div>
              </div>

              <div className="relative mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-green-500 text-xs font-black text-white">
                  ✓
                </span>
                <p className="text-[12px] leading-snug text-white/70">
                  <b className="text-white">Both boxes will be pre-ticked at checkout.</b> You can untick, but you won't see this celebration again.
                </p>
              </div>

              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-acid via-[#ff6b9d] to-[#00d4ff] transition-all duration-1000"
                  style={{
                    width: `${Math.max(
                      8,
                      (remainingMs / (15 * 60 * 1000)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/35">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-green-400" />
              11 people claimed in last 10 minutes • 1 jackpot / 10,000 spins
            </div>

            <button
              type="button"
              onClick={onClaim}
              className="cta mt-5 w-full rounded-full bg-acid px-6 py-4 font-display text-[1.15rem] uppercase tracking-wide text-ink shadow-[0_10px_30px_rgba(255,230,0,0.45)] hover:brightness-[1.06] active:scale-[0.99] sm:text-xl"
            >
              Claim My Founder Bundle →
              <span className="mt-0.5 block text-[11px] font-sans font-bold normal-case tracking-normal opacity-70">
                Takes you to checkout • Both add-ons pre-selected • $21
              </span>
            </button>

            <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-white/30">
              <span>🔒 Stripe checkout</span>
              <span>•</span>
              <span>Instant access</span>
              <span>•</span>
              <span>Use once per order</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mx-auto mt-4 block text-[12px] text-white/40 underline underline-offset-4 hover:text-white/70"
            >
              Keep shopping without bonus
            </button>

            <p className="mx-auto mt-3 max-w-[40ch] text-center text-[10px] leading-snug text-white/25">
              Founder pricing is reserved for this browser for 15 minutes — after that the checkout returns to standard.
            </p>
          </div>
        )}

        {/* footer trust */}
        <div className="border-t border-white/10 bg-black/20 px-4 py-3 text-center text-[10px] leading-relaxed tracking-wide text-white/25 sm:px-6">
          Verified draw • This price is reserved for this browser only • Not available at this
          price anywhere else
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
            <p className="inline-flex items-center gap-1 rounded-full bg-acid px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-ink">
              🎉 Jackpot Unlocked
            </p>
            <p className="mt-2 font-display text-lg leading-none">
              FOUNDER BUNDLE $21
            </p>
            <p className="mt-1 text-[12px] text-white/60">
              Code <b className="font-mono text-white">{coupon.code}</b> • 1 in 10,000 • saves $33 •{" "}
              <b className="text-acid">{formatRemainingMs(Math.max(0, coupon.expiresAt - Date.now()))}</b> left
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-green-500 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
            Active
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a22] to-black/40 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#ff3b82] to-[#7c5cff] text-lg">
          🎡
        </span>
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
      <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-white/25">
        Takes 5 seconds • No email needed
      </p>
    </div>
  );
}
