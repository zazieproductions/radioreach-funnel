import { useRef, useState } from "react";

// Prize segments for the wheel
const PRIZES = [
  { label: "50% OFF DJ List", value: 50, color: "#ffe600" },
  { label: "Try Again", value: 0, color: "#1a1a1f" },
  { label: "30% OFF DJ List", value: 30, color: "#e01b24" },
  { label: "Try Again", value: 0, color: "#1a1a1f" },
  { label: "40% OFF DJ List", value: 40, color: "#2d2d35" },
  { label: "Try Again", value: 0, color: "#1a1a1f" },
  { label: "20% OFF DJ List", value: 20, color: "#3d3d45" },
  { label: "Try Again", value: 0, color: "#1a1a1f" },
];

const DJ_LIST_REGULAR_PRICE = 8.99;
const DJ_LIST_DISCOUNTED_PRICE = 5;

interface LuckyWheelProps {
  onWin: (discount: number, couponCode: string) => void;
  onDecline: () => void;
}

export function LuckyWheel({ onWin, onDecline }: LuckyWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [prize, setPrize] = useState<typeof PRIZES[0] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Generate unique coupon code
  const generateCouponCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "DJ-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const spinWheel = () => {
    if (spinning || hasSpun) return;

    setSpinning(true);
    
    // Random final rotation - spins 5-8 full rotations plus random segment
    const segmentAngle = 360 / PRIZES.length;
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * 360;
    const randomSegment = Math.floor(Math.random() * PRIZES.length);
    const finalRotation = extraSpins + (randomSegment * segmentAngle) + (segmentAngle / 2);
    
    setRotation((prev) => prev + finalRotation);
    
    // Determine prize after animation
    setTimeout(() => {
      // Calculate which segment the pointer is pointing to
      const normalizedRotation = finalRotation % 360;
      const adjustedAngle = (360 - normalizedRotation + segmentAngle / 2) % 360;
      const winningIndex = Math.floor(adjustedAngle / segmentAngle);
      const wonPrize = PRIZES[winningIndex];
      
      setPrize(wonPrize);
      setHasSpun(true);
      setSpinning(false);
      
      // Show result after a brief pause
      setTimeout(() => {
        setShowResult(true);
        if (wonPrize.value > 0) {
          const code = generateCouponCode();
          setCouponCode(code);
          onWin(wonPrize.value, code);
        }
      }, 500);
    }, 4000);
  };

  const segmentAngle = 360 / PRIZES.length;

  return (
    <div className="rounded-xl border-2 border-acid/50 bg-panel p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-3xl">🎰</span>
        <div>
          <p className="font-display text-xl uppercase">Spin & Win!</p>
          <p className="text-sm text-white/60">Try your luck for a discount on our DJ contacts list</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5">
        {/* Wheel Container */}
        <div className="relative">
          {/* Pointer */}
          <div 
            className="absolute left-1/2 -top-2 z-10 -translate-x-1/2"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
          >
            <svg width="24" height="30" viewBox="0 0 24 30" fill="none">
              <path d="M12 30L0 0H24L12 30Z" fill="#ffe600"/>
              <path d="M12 30L0 0H24L12 30Z" stroke="#08080a" strokeWidth="2"/>
            </svg>
          </div>

          {/* Wheel */}
          <div 
            ref={wheelRef}
            className="relative overflow-hidden rounded-full"
            style={{
              width: "280px",
              height: "280px",
              transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <svg viewBox="0 0 280 280" className="w-full h-full">
              <defs>
                {PRIZES.map((prize, i) => (
                  <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={prize.color} />
                    <stop offset="100%" stopColor={adjustColor(prize.color, -20)} />
                  </linearGradient>
                ))}
              </defs>
              
              {PRIZES.map((prize, i) => {
                const startAngle = i * segmentAngle;
                const endAngle = (i + 1) * segmentAngle;
                const x1 = 140 + 130 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 140 + 130 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 140 + 130 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 140 + 130 * Math.sin((endAngle * Math.PI) / 180);
                
                const textAngle = startAngle + segmentAngle / 2;
                const textX = 140 + 85 * Math.cos((textAngle * Math.PI) / 180);
                const textY = 140 + 85 * Math.sin((textAngle * Math.PI) / 180);
                
                return (
                  <g key={i}>
                    <path
                      d={`M 140 140 L ${x1} ${y1} A 130 130 0 0 1 ${x2} ${y2} Z`}
                      fill={`url(#grad-${i})`}
                      stroke="#08080a"
                      strokeWidth="2"
                    />
                    {prize.value > 0 ? (
                      <text
                        x={textX}
                        y={textY}
                        fill={prize.value >= 40 ? "#08080a" : "#ffffff"}
                        fontSize="11"
                        fontFamily="Anton, sans-serif"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                      >
                        {prize.label}
                      </text>
                    ) : (
                      <text
                        x={textX}
                        y={textY}
                        fill="#888"
                        fontSize="10"
                        fontFamily="Inter, sans-serif"
                        fontWeight="600"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                      >
                        ❌ {prize.label}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Center circle */}
              <circle cx="140" cy="140" r="25" fill="#08080a" stroke="#ffe600" strokeWidth="3"/>
              <circle cx="140" cy="140" r="18" fill="#101014"/>
              <text x="140" y="140" fill="#ffe600" fontSize="16" fontFamily="Anton, sans-serif" textAnchor="middle" dominantBaseline="middle">
                🎵
              </text>
            </svg>
          </div>
        </div>

        {/* Spin Button */}
        {!hasSpun ? (
          <button
            onClick={spinWheel}
            disabled={spinning}
            className="cta w-full max-w-[280px] rounded-lg bg-acid px-6 py-4 font-display text-xl uppercase tracking-wide text-ink disabled:opacity-70"
          >
            {spinning ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                Spinning...
              </span>
            ) : (
              <>
                🎰 SPIN TO WIN!
                <span className="block mt-1 text-[11px] font-sans font-normal normal-case tracking-normal">
                  Could win up to 50% off DJ contacts
                </span>
              </>
            )}
          </button>
        ) : showResult ? (
          <div className="w-full max-w-[280px] text-center wheel-bounce-in">
            {prize && prize.value > 0 ? (
              <div className="rounded-lg border-2 border-acid bg-acid/10 p-4">
                <p className="text-4xl mb-2">🎉</p>
                <p className="font-display text-2xl text-acid">YOU WON {prize.value}% OFF!</p>
                <p className="text-sm text-white/70 mt-1">The DJ Contacts List has been added to your order!</p>
                {couponCode && (
                  <p className="mt-2 font-mono text-[13px] bg-ink/50 rounded px-3 py-2 border border-acid/30">
                    Coupon: <span className="text-acid font-bold">{couponCode}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-white/20 bg-white/5 p-4">
                <p className="text-3xl mb-2">😢</p>
                <p className="font-display text-lg text-white/70">Not this time!</p>
                <p className="text-sm text-white/50 mt-1">But you can still add the DJ Contacts List below</p>
              </div>
            )}
          </div>
        ) : null}

        {/* DJ List Product Card */}
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-black/40 p-4 mt-2">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-acid/20 flex items-center justify-center text-2xl shrink-0">
              🎧
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-lg uppercase">50 DJs Contact Info</p>
              <p className="text-sm text-white/60">Direct contacts for playlist curators, mixshow DJs, and podcast hosts</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-white/35 line-through">${DJ_LIST_REGULAR_PRICE.toFixed(2)}</span>
                {prize && prize.value > 0 && showResult ? (
                  <span className="font-display text-2xl text-acid">
                    ${calculateDiscountedPrice(prize.value).toFixed(2)}
                    <span className="text-xs ml-1 normal-case font-sans">with coupon</span>
                  </span>
                ) : (
                  <span className="font-display text-2xl text-acid">${DJ_LIST_DISCOUNTED_PRICE.toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <ul className="grid gap-1.5 text-[13px] text-white/70">
              <li className="flex items-center gap-2"><span className="text-acid">✓</span> 50 verified DJ & curator contacts</li>
              <li className="flex items-center gap-2"><span className="text-acid">✓</span> Mixshow DJs, playlist curators</li>
              <li className="flex items-center gap-2"><span className="text-acid">✓</span> Email, social media, booking info</li>
              <li className="flex items-center gap-2"><span className="text-acid">✓</span> Instant digital delivery</li>
            </ul>
          </div>
        </div>

        {/* Skip button */}
        <button
          onClick={onDecline}
          className="text-sm text-white/40 hover:text-white/60 underline underline-offset-4"
        >
          Skip and continue to checkout →
        </button>
      </div>
    </div>
  );
}

// Helper to darken/lighten colors
function adjustColor(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function calculateDiscountedPrice(discountPercent: number): number {
  const discounted = DJ_LIST_DISCOUNTED_PRICE * (1 - discountPercent / 100);
  return Math.round(discounted * 100) / 100;
}

export { DJ_LIST_REGULAR_PRICE, DJ_LIST_DISCOUNTED_PRICE, calculateDiscountedPrice };
