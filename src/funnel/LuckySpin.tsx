import { useEffect, useMemo, useRef, useState } from "react";
import { PRODUCTS } from "../config/storefront";
import { trackCustom } from "../lib/metaPixel";

/* ═══════════════════════════════════════════════════════════════════════════
   LUCKY SPIN — Temu-style prize wheel for the checkout add-ons.
   Every segment is a win: the "prize" is the session discount on the
   Contract Kit + Australian List add-ons. The wheel is presentation only —
   prices, Stripe price IDs and the order total are untouched.
═══════════════════════════════════════════════════════════════════════════ */

const N = 8;
const SEG = 360 / N;
const CX = 150;
const CY = 150;
const R = 136;
const LABEL_R = 80;

const KIT = PRODUCTS.contract_bundle;
const AU = PRODUCTS.australia_addon;
const KIT_OFF = (KIT.compareAt ?? KIT.price) - KIT.price;
const AU_OFF = (AU.compareAt ?? AU.price) - AU.price;

/** Total discount the wheel "awards" — matches the session add-on pricing. */
export const SPIN_TOTAL_OFF = KIT_OFF + AU_OFF;

const SEGMENTS: { id: string; label: string; bg: string; fg: string }[] = [
  { id: "both", label: `$${SPIN_TOTAL_OFF} OFF`, bg: "#ffe600", fg: "#120f00" },
  { id: "au", label: `AU −$${AU_OFF}`, bg: "#e01b24", fg: "#ffffff" },
  { id: "kit", label: `KIT −$${KIT_OFF}`, bg: "#10b981", fg: "#03231a" },
  { id: "jackpot", label: "JACKPOT", bg: "#ff8c00", fg: "#120f00" },
  { id: "lucky", label: "LUCKY DAY", bg: "#2563eb", fg: "#ffffff" },
  { id: "both", label: `$${SPIN_TOTAL_OFF} OFF`, bg: "#e01b24", fg: "#ffffff" },
  { id: "kit", label: `KIT −$${KIT_OFF}`, bg: "#ffe600", fg: "#120f00" },
  { id: "au", label: `AU −$${AU_OFF}`, bg: "#10b981", fg: "#03231a" },
];

/* ─────────────────────────────────────────────
   WHEEL GEOMETRY
───────────────────────────────────────────── */

/** Point on a circle; deg is measured clockwise from 12 o'clock. */
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(i: number) {
  const a0 = i * SEG;
  const a1 = (i + 1) * SEG;
  const p0 = polar(CX, CY, R, a0);
  const p1 = polar(CX, CY, R, a1);
  return `M ${CX} ${CY} L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${R} ${R} 0 0 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`;
}

/* ─────────────────────────────────────────────
   SOUND — WebAudio, created on the spin gesture
───────────────────────────────────────────── */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function blip(ctx: AudioContext, at: number, freq: number, dur = 0.06, vol = 0.05) {
  const t0 = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "square";
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

/** Ratchet ticks during the spin — rising pitch builds suspense. */
function playTicks(durationMs = 4900) {
  const ctx = getCtx();
  if (!ctx) return;
  const step = 120;
  for (let t = 0; t < durationMs - 250; t += step) {
    const freq = 240 + (t / durationMs) * 520;
    blip(ctx, t / 1000, freq, 0.05, 0.04);
  }
}

/** Little ascending arpeggio on the win. */
function winChime() {
  const ctx = getCtx();
  if (!ctx) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    const t0 = ctx.currentTime + 0.05 + i * 0.11;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + 0.55);
  });
}

/* ─────────────────────────────────────────────
   THE WHEEL OVERLAY
───────────────────────────────────────────── */

export default function LuckySpin({
  alreadyWon = false,
  onClaim,
  onClose,
}: {
  /** Session prize already claimed — open straight to the win view. */
  alreadyWon?: boolean;
  onClaim: () => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "won">(
    alreadyWon ? "won" : "idle"
  );
  const [rotation, setRotation] = useState(() => {
    if (!alreadyWon) return 0;
    // Park the JACKPOT segment under the pointer.
    return 360 - (3 * SEG + SEG / 2);
  });
  const [landed, setLanded] = useState(3);
  // burst < 0 suppresses the confetti on the "already won" open.
  const [burst, setBurst] = useState(alreadyWon ? -1 : 0);
  const spinRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef(false);

  // Lock body scroll while open + focus the spin button.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    spinRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Escape closes (never mid-spin).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "spinning") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase("won");
    setBurst((b) => b + 1);
    winChime();
    trackCustom("lucky_spin_win", {
      segment: SEGMENTS[landed].id,
      value: SPIN_TOTAL_OFF,
    });
  };

  const spin = () => {
    if (phase === "spinning") return;
    const target = Math.floor(Math.random() * N);
    const c = target * SEG + SEG / 2; // segment center, clockwise from top
    const turns = 5 + Math.floor(Math.random() * 3);
    const next =
      (Math.floor(rotation / 360) + turns) * 360 + (360 - c);
    doneRef.current = false;
    setLanded(target);
    setPhase("spinning");
    setRotation(next);
    playTicks(4900);
    trackCustom("lucky_spin_start", {});
    window.setTimeout(finish, 5000); // fallback if transitionend is missed
  };

  const confetti = useMemo(() => {
    const colors = ["#ffe600", "#e01b24", "#10b981", "#2563eb", "#ff8c00", "#ffffff"];
    return Array.from({ length: 64 }, (_, i) => ({
      i,
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      dur: 2 + Math.random() * 1.6,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 7,
      round: Math.random() > 0.6,
      sway: (Math.random() - 0.5) * 120,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [burst]);

  const seg = SEGMENTS[landed];

  return (
    <div
      className="fade-in fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/85 p-4"
      onClick={phase !== "spinning" ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lucky-spin-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-acid/70 bg-panel shadow-[0_0_90px_rgba(255,230,0,0.18)]"
      >
        {burst >= 0 && phase === "won" && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
          >
            {confetti.map((c) => (
              <span
                key={c.i}
                className="absolute block"
                style={
                  {
                    left: `${c.left}%`,
                    top: "-14px",
                    width: c.w,
                    height: c.h,
                    background: c.color,
                    borderRadius: c.round ? "50%" : "2px",
                    "--sway": `${c.sway}px`,
                    animation: `confetti-fall ${c.dur}s ${c.delay}s cubic-bezier(0.3, 0.6, 0.4, 1) both`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        <p className="bg-gradient-to-r from-blood via-orange-500 to-acid py-2 text-center text-[11px] font-black uppercase tracking-[0.14em] text-ink">
          🎁 Congratulations — you've been selected for a lucky spin
        </p>

        {phase !== "spinning" && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="pressable absolute right-2 top-2 z-30 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-lg text-white/70 hover:bg-black/70 hover:text-white"
          >
            ×
          </button>
        )}

        <div className="px-5 pb-6 pt-5 sm:px-7 sm:pb-7">
          <h2
            id="lucky-spin-title"
            className="text-center font-display text-2xl leading-[1.05] sm:text-3xl"
          >
            SPIN FOR YOUR <span className="text-acid">CHECKOUT DISCOUNT</span>
          </h2>
          <p className="mt-1.5 text-center text-[12px] text-white/55">
            Every spin is a win · one spin per session
          </p>

          <div className="relative mx-auto mt-5 w-[min(78vw,280px)]">
            {/* pointer */}
            <div
              aria-hidden
              className="wheel-pointer pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2"
            >
              <svg width="38" height="32" viewBox="0 0 38 32">
                <path
                  d="M19 1 L35 28 Q19 34 3 28 Z"
                  fill="#ffe600"
                  stroke="#08080a"
                  strokeWidth="2.5"
                />
                <circle cx="19" cy="25" r="2.6" fill="#08080a" />
              </svg>
            </div>

            {/* wheel */}
            <div className="relative overflow-hidden rounded-full border-4 border-ink bg-ink shadow-[0_12px_44px_rgba(0,0,0,0.65)]">
              <svg
                viewBox="0 0 300 300"
                role="img"
                aria-label="Lucky spin wheel. Every segment is a discount prize."
                className="block h-auto w-full"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  transform: `rotate(${rotation}deg)`,
                  transition:
                    phase === "spinning"
                      ? "transform 4.9s cubic-bezier(0.15, 0.85, 0.1, 1)"
                      : "none",
                }}
                onTransitionEnd={(e) => {
                  if (e.propertyName === "transform") finish();
                }}
              >
                {SEGMENTS.map((s, i) => (
                  <path
                    key={i}
                    d={wedgePath(i)}
                    fill={s.bg}
                    stroke="#08080a"
                    strokeWidth="2"
                  />
                ))}
                {SEGMENTS.map((s, i) => {
                  const c = i * SEG + SEG / 2;
                  const p = polar(CX, CY, LABEL_R, c);
                  return (
                    <text
                      key={i}
                      x={p.x}
                      y={p.y}
                      transform={`rotate(${c - 90} ${p.x} ${p.y})`}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="14"
                      fontWeight="800"
                      fill={s.fg}
                      letterSpacing="0.4"
                    >
                      {s.label}
                    </text>
                  );
                })}
                <circle
                  cx={CX}
                  cy={CY}
                  r={40}
                  fill="none"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="1"
                />
                <circle
                  cx={CX}
                  cy={CY}
                  r={36}
                  fill="#08080a"
                  stroke="#ffe600"
                  strokeWidth="3"
                />
                {Array.from({ length: 12 }, (_, i) => {
                  const p = polar(CX, CY, 146, i * 30);
                  return (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="3.4"
                      fill={i % 2 ? "#ffe600" : "#ffffff"}
                      className="wheel-blink"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  );
                })}
              </svg>
            </div>

            {/* hub button */}
            <button
              ref={spinRef}
              type="button"
              onClick={spin}
              disabled={phase === "spinning"}
              aria-label={phase === "spinning" ? "Spinning" : "Spin the wheel"}
              className={`absolute left-1/2 top-1/2 z-10 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-acid font-display text-lg uppercase tracking-wide text-ink ring-4 ring-ink ${
                phase === "idle" ? "spin-pulse" : ""
              } ${phase === "spinning" ? "cursor-wait opacity-70" : ""}`}
            >
              {phase === "spinning" ? "…" : "SPIN"}
            </button>
          </div>

          <p
            className="mt-4 min-h-[1.25rem] text-center text-[12px]"
            aria-live="polite"
          >
            {phase === "idle" && (
              <span className="text-white/45">
                Tap the wheel — every spin is a win 🍀
              </span>
            )}
            {phase === "spinning" && (
              <span className="font-bold text-acid">Spinning… good luck!</span>
            )}
            {phase === "won" && (
              <span className="text-white/45">
                Landed on <b className="text-white">{seg.label}</b> — the wheel
                unlocked your full add-on prize 🎁
              </span>
            )}
          </p>

          {phase === "won" && (
            <div className="fade-up mt-2 rounded-xl border-2 border-acid bg-acid/10 p-4 text-left">
              <p className="reveal-pop font-display text-2xl text-acid">
                🎉 YOU WON ${SPIN_TOTAL_OFF} OFF YOUR ADD-ONS
              </p>
              <ul className="mt-3 space-y-2 text-[14px]">
                <li className="flex items-center justify-between gap-3">
                  <span className="text-white/80">📄 {KIT.shortName}</span>
                  <span className="tnum shrink-0">
                    <s className="mr-1.5 text-white/35">
                      ${KIT.compareAt ?? KIT.price}
                    </s>
                    <b className="text-acid">${KIT.price.toFixed(2)}</b>
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="text-white/80">🇦🇺 {AU.shortName}</span>
                  <span className="tnum shrink-0">
                    <s className="mr-1.5 text-white/35">
                      ${AU.compareAt ?? AU.price}
                    </s>
                    <b className="text-acid">${AU.price.toFixed(2)}</b>
                  </span>
                </li>
              </ul>
              <p className="mt-3 border-t border-white/10 pt-2.5 text-[11px] leading-relaxed text-white/50">
                Session-locked. Keep both bundles checked in your order below
                to keep the prize.
              </p>
            </div>
          )}

          {phase === "won" ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={onClaim}
                className="cta w-full rounded-lg bg-acid px-5 py-4 font-display text-lg uppercase tracking-wide text-ink sm:text-xl"
              >
                APPLY MY PRIZE — KEEP MY DISCOUNTS
              </button>
              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={spin}
                  className="pressable rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/50 hover:text-acid"
                >
                  ↻ Spin again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="pressable rounded-lg px-3 py-2 text-[11px] text-white/35 underline underline-offset-4 hover:text-white/60"
                >
                  Skip
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-center text-[10px] text-white/30">
              Demo · the prize is the session discount on your order add-ons
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
