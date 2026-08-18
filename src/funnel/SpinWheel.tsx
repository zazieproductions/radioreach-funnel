import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isSpinWheelEnabled } from "../config/features";
import { PRODUCTS } from "../config/storefront";
import { trackCustom } from "../lib/metaPixel";
import {
  DJ_CONTACTS_DEAL,
  DJ_CONTACTS_REGULAR,
  generateWheelCoupon,
  readWheelCoupon,
  saveWheelCoupon,
  type WheelCoupon,
} from "../lib/wheelCoupon";

type Segment = {
  label: string;
  sub?: string;
  color: string;
  text: string;
  win: boolean;
};

const SEGMENTS: Segment[] = [
  { label: "50 DJs", sub: "$5", color: "#ff1744", text: "#fff", win: true },
  { label: "8% OFF", color: "#ff6d00", text: "#fff", win: false },
  { label: "ALMOST", color: "#ffd600", text: "#1a1200", win: false },
  { label: "$1 OFF", color: "#76ff03", text: "#102000", win: false },
  { label: "50 DJs", sub: "$5", color: "#00e676", text: "#062014", win: true },
  { label: "12% OFF", color: "#00e5ff", text: "#041820", win: false },
  { label: "TRY AGAIN", color: "#2979ff", text: "#fff", win: false },
  { label: "BONUS", color: "#651fff", text: "#fff", win: false },
  { label: "50 DJs", sub: "$5", color: "#d500f9", text: "#fff", win: true },
  { label: "LUCKY", color: "#f50057", text: "#fff", win: false },
  { label: "5% OFF", color: "#ff9100", text: "#1a0e00", win: false },
  { label: "JACKPOT", color: "#ff4081", text: "#fff", win: false },
];

const SLICE = 360 / SEGMENTS.length;
const WIN_INDEX = 0;
const SPIN_MS = 5200;
const CX = 200;
const CY = 200;
const RADIUS = 186;

type SpinCtx = {
  open: boolean;
  setOpen: (next: boolean) => void;
  coupon: WheelCoupon | null;
  onWin?: (coupon: WheelCoupon) => void;
  onClaim?: () => void;
};

const SpinContext = createContext<SpinCtx | null>(null);

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}

function slicePath(start: number, end: number) {
  const [x1, y1] = polar(CX, CY, RADIUS, start);
  const [x2, y2] = polar(CX, CY, RADIUS, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${x2} ${y2} Z`;
}

function landingRotation(spins = 7) {
  const jitter = Math.random() * 14 - 7;
  return 360 * spins + (360 - WIN_INDEX * SLICE - SLICE / 2) + jitter;
}

export function SpinWheelProvider({
  children,
  onClaim,
  onWin,
}: {
  children: ReactNode;
  onClaim?: () => void;
  onWin?: (coupon: WheelCoupon) => void;
}) {
  const [open, setOpen] = useState(false);
  const [coupon, setCoupon] = useState<WheelCoupon | null>(() => readWheelCoupon());

  const handleWin = useCallback(
    (next: WheelCoupon) => {
      setCoupon(next);
      onWin?.(next);
    },
    [onWin]
  );

  const value = useMemo(
    () => ({
      open,
      setOpen,
      coupon,
      onWin: handleWin,
      onClaim,
    }),
    [open, coupon, handleWin, onClaim]
  );

  if (!isSpinWheelEnabled()) return <>{children}</>;

  return (
    <SpinContext.Provider value={value}>
      {children}
      <WheelModal />
    </SpinContext.Provider>
  );
}

function useSpin() {
  return useContext(SpinContext);
}

export function SpinDiscountButton({
  variant = "hero",
}: {
  variant?: "hero" | "floating" | "checkout" | "inline";
}) {
  const ctx = useSpin();
  if (!ctx || !isSpinWheelEnabled()) return null;

  const { setOpen, coupon } = ctx;

  if (variant === "floating") {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="spin-float pressable"
        aria-haspopup="dialog"
      >
        <span aria-hidden className="text-lg leading-none">
          🎡
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase leading-tight tracking-[0.12em]">
            {coupon ? "Your $5 coupon" : "Free discount"}
          </span>
          <span className="mt-0.5 block truncate font-sans text-[11px] font-bold normal-case tracking-normal opacity-90">
            {coupon ? coupon.code : "Spin the wheel"}
          </span>
        </span>
      </button>
    );
  }

  if (variant === "checkout") {
    return (
      <button type="button" onClick={() => setOpen(true)} className="spin-btn-rainbow w-full">
        {coupon ? `View coupon ${coupon.code}` : "Spin a wheel for a free discount"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`spin-btn-rainbow ${variant === "inline" ? "w-full" : "mt-3 w-full"}`}
    >
      {coupon ? "View your wheel prize" : "Spin a wheel for a free discount"}
    </button>
  );
}

function WheelModal() {
  const ctx = useSpin();
  const [phase, setPhase] = useState<"idle" | "spinning" | "won">("idle");
  const [rotation, setRotation] = useState(0);
  const [coupon, setCoupon] = useState<WheelCoupon | null>(null);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const revealTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!ctx?.open) return;
    const existing = readWheelCoupon();
    if (existing) {
      setCoupon(existing);
      setPhase("won");
      setRotation(landingRotation(0));
    } else {
      setPhase("idle");
      setCoupon(null);
      setRotation(0);
    }
    closeRef.current?.focus();
    trackCustom("SpinWheelOpened", { already_won: Boolean(existing) });
  }, [ctx?.open]);

  useEffect(() => {
    if (!ctx?.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "spinning") ctx.setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [ctx, phase]);

  useEffect(
    () => () => {
      if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
    },
    []
  );

  if (!ctx?.open) return null;

  const spin = () => {
    if (phase === "spinning") return;
    if (coupon || readWheelCoupon()) {
      setPhase("won");
      return;
    }

    const next = generateWheelCoupon();
    const reduced = prefersReducedMotion();
    const dest = landingRotation(reduced ? 0 : 7);

    setPhase("spinning");
    trackCustom("SpinWheelSpun", { prize: "dj_contacts" });

    const reveal = () => {
      saveWheelCoupon(next);
      setCoupon(next);
      setPhase("won");
      ctx.onWin?.(next);
      trackCustom("SpinWheelWon", {
        prize: "dj_contacts",
        coupon_code: next.code,
        deal_price: DJ_CONTACTS_DEAL,
      });
    };

    if (reduced) {
      setRotation(dest);
      reveal();
      return;
    }

    // Apply the destination rotation on the next frame so the CSS
    // transition is already armed (same-frame transform+transition can snap).
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setRotation(dest));
    });
    revealTimer.current = window.setTimeout(reveal, SPIN_MS + 80);
  };

  const copyCode = async () => {
    if (!coupon) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const claim = () => {
    trackCustom("SpinWheelClaimed", { coupon_code: coupon?.code || "" });
    ctx.setOpen(false);
    ctx.onClaim?.();
  };

  return (
    <div
      className="fade-in fixed inset-0 z-[80] grid place-items-center bg-black/88 p-3 sm:p-4"
      onClick={() => phase !== "spinning" && ctx.setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wheel-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[28rem] overflow-hidden rounded-2xl border-2 border-white/15 bg-[#0c0c12] shadow-[0_30px_80px_rgba(0,0,0,0.65)]"
      >
        <div className="spin-modal-banner px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.16em] text-ink">
          Limited spin · one prize per visit
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={() => ctx.setOpen(false)}
          disabled={phase === "spinning"}
          aria-label="Close prize wheel"
          className="pressable absolute right-2 top-9 grid h-10 w-10 place-items-center rounded-full text-xl text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          ×
        </button>

        {phase === "won" && coupon && <Confetti />}

        <div className="px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
            Radio Reach lucky wheel
          </p>
          <h2
            id="wheel-title"
            className="mt-1 text-center font-display text-[1.65rem] leading-[1.05] sm:text-4xl"
          >
            {phase === "won" ? (
              <>
                YOU WON A <span className="text-acid">$5 DEAL</span>
              </>
            ) : (
              <>
                SPIN FOR A <span className="rainbow-text">FREE DISCOUNT</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-center text-[13px] leading-relaxed text-white/60">
            {phase === "won"
              ? "Your coupon unlocks the 50 DJs Contact List at checkout — usually $8.99, yours for $5."
              : "One spin. A rainbow of prizes. Add the winner at checkout if you want it."}
          </p>

          <div className="relative mx-auto mt-4 w-[min(86vw,22rem)]">
            <Pointer />
            <div className="spin-wheel-stage">
              <svg viewBox="0 0 400 400" className="spin-wheel-svg" aria-hidden>
                <defs>
                  <filter id="wheel-soft" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.45" />
                  </filter>
                  <radialGradient id="hub-grad" cx="50%" cy="40%" r="70%">
                    <stop offset="0%" stopColor="#fff6a8" />
                    <stop offset="55%" stopColor="#ffe600" />
                    <stop offset="100%" stopColor="#c9a000" />
                  </radialGradient>
                </defs>

                <circle cx={CX} cy={CY} r="198" fill="#111118" />
                {Array.from({ length: 24 }, (_, i) => {
                  const a = (i * 360) / 24;
                  const [lx, ly] = polar(CX, CY, 196, a);
                  return (
                    <circle
                      key={i}
                      cx={lx}
                      cy={ly}
                      r="4.2"
                      className={i % 2 === 0 ? "spin-lamp-a" : "spin-lamp-b"}
                    />
                  );
                })}

                <g
                  className="spin-wheel-rotor"
                  filter="url(#wheel-soft)"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition:
                      phase === "spinning"
                        ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.68, 0.08, 1)`
                        : "none",
                  }}
                >
                  {SEGMENTS.map((seg, i) => {
                    const start = i * SLICE;
                    const end = start + SLICE;
                    const mid = start + SLICE / 2;
                    const [tx, ty] = polar(CX, CY, 118, mid);
                    return (
                      <g key={`${seg.label}-${i}`}>
                        <path d={slicePath(start, end)} fill={seg.color} />
                        <path
                          d={slicePath(start, end)}
                          fill="none"
                          stroke="rgba(0,0,0,0.28)"
                          strokeWidth="1.2"
                        />
                        <text
                          fill={seg.text}
                          fontSize={seg.sub ? "13" : "12.5"}
                          fontWeight="800"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`translate(${tx} ${ty}) rotate(${mid})`}
                          letterSpacing="0.02em"
                        >
                          {seg.label}
                          {seg.sub ? (
                            <tspan x="0" dy="14" fontSize="12">
                              {seg.sub}
                            </tspan>
                          ) : null}
                        </text>
                      </g>
                    );
                  })}
                </g>

                <circle cx={CX} cy={CY} r="46" fill="url(#hub-grad)" stroke="#fff4a0" strokeWidth="3" />
                <circle cx={CX} cy={CY} r="38" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
                <text
                  x={CX}
                  y={CY - 4}
                  textAnchor="middle"
                  fill="#1a1400"
                  fontSize="13"
                  fontWeight="900"
                  letterSpacing="0.14em"
                >
                  SPIN
                </text>
                <text
                  x={CX}
                  y={CY + 13}
                  textAnchor="middle"
                  fill="#5a4800"
                  fontSize="9"
                  fontWeight="800"
                  letterSpacing="0.16em"
                >
                  TO WIN
                </text>
              </svg>

              {phase !== "won" && (
                <button
                  type="button"
                  onClick={spin}
                  disabled={phase === "spinning"}
                  className="spin-hub-hit"
                  aria-label={phase === "spinning" ? "Wheel spinning" : "Spin the prize wheel"}
                />
              )}
            </div>
          </div>

          <div className="mt-4 min-h-[7.5rem]" aria-live="polite">
            {phase === "idle" && (
              <button type="button" onClick={spin} className="spin-btn-rainbow w-full text-[1.05rem]">
                Spin a wheel for a free discount
              </button>
            )}

            {phase === "spinning" && (
              <p className="py-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-acid">
                Spinning…
              </p>
            )}

            {phase === "won" && coupon && (
              <div className="prize-pop rounded-xl border border-acid/50 bg-acid/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-acid">
                      Coupon unlocked
                    </p>
                    <p className="mt-1 font-display text-xl leading-tight sm:text-2xl">
                      {PRODUCTS.dj_contacts.name}
                    </p>
                    <p className="mt-1 text-[13px] text-white/65">
                      <span className="mr-2 text-white/35 line-through">${DJ_CONTACTS_REGULAR.toFixed(2)}</span>
                      <b className="text-acid">${DJ_CONTACTS_DEAL.toFixed(2)}</b> add-on at checkout
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-acid px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-ink">
                    You won
                  </span>
                </div>

                <button
                  type="button"
                  onClick={copyCode}
                  className="coupon-ticket mt-3 w-full"
                  aria-label={`Coupon code ${coupon.code}`}
                >
                  <span className="font-mono text-lg font-black tracking-[0.18em] text-ink sm:text-xl">
                    {coupon.code}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink/60">
                    {copied ? "Copied" : "Tap to copy · auto-applied at checkout"}
                  </span>
                </button>

                <button type="button" onClick={claim} className="cta mt-3 w-full rounded-lg bg-acid px-4 py-3.5 font-display text-lg uppercase tracking-wide text-ink">
                  Add my $5 DJ list at checkout →
                </button>
                <button
                  type="button"
                  onClick={() => ctx.setOpen(false)}
                  className="tap-sm mt-2 w-full text-center text-[12px] text-white/40 underline underline-offset-4 hover:text-white/70"
                >
                  Keep browsing — coupon stays saved
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pointer() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[-6px] z-10 -translate-x-1/2" aria-hidden>
      <svg width="36" height="44" viewBox="0 0 36 44">
        <path d="M18 44 L2 8 Q18 0 34 8 Z" fill="#ffe600" stroke="#1a1400" strokeWidth="2" />
        <circle cx="18" cy="14" r="4" fill="#1a1400" />
      </svg>
    </div>
  );
}

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        delay: `${(i % 12) * 0.08}s`,
        duration: `${1.8 + (i % 5) * 0.25}s`,
        color: SEGMENTS[i % SEGMENTS.length].color,
        rotate: `${(i * 47) % 360}deg`,
        wide: i % 3 === 0,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((b) => (
        <span
          key={b.id}
          className="spin-confetti"
          style={{
            left: b.left,
            background: b.color,
            animationDelay: b.delay,
            animationDuration: b.duration,
            width: b.wide ? 9 : 6,
            transform: `rotate(${b.rotate})`,
          }}
        />
      ))}
    </div>
  );
}

export function WheelCouponChip({ coupon }: { coupon: WheelCoupon }) {
  return (
    <div className="mt-3 rounded-lg border border-acid/40 bg-acid/10 px-3 py-2 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-acid">Wheel coupon locked in</p>
      <p className="mt-0.5 font-mono text-sm font-bold tracking-[0.14em] text-white">{coupon.code}</p>
      <p className="text-[11px] text-white/55">
        50 DJs list · <span className="line-through opacity-60">${DJ_CONTACTS_REGULAR.toFixed(2)}</span>{" "}
        <b className="text-acid">${DJ_CONTACTS_DEAL.toFixed(2)}</b> at checkout
      </p>
    </div>
  );
}
