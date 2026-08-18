/* The wheel's entry point, split out from the wheel itself.
   The modal (canvas rendering, WebAudio ticks, confetti) is a few hundred
   lines the landing view never needs. Keeping only the button in the main
   bundle means the offer paints sooner; the wheel loads on tap. */

export const RAINBOW_CONIC =
  "conic-gradient(from 0deg,#EF4444,#FB923C,#FACC15,#34D399,#22D3EE,#60A5FA,#A78BFA,#F472B6,#EF4444)";

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
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[1.5px] shadow-[0_4px_16px_rgba(251,146,60,0.35)] transition hover:shadow-[0_6px_24px_rgba(167,139,250,0.45)] hover:scale-[1.015] active:scale-[0.985] ${className}`}
      style={{ background: RAINBOW_CONIC }}
    >
      <span className={`flex items-center gap-2.5 rounded-full bg-[#0F0F12] px-5 py-2.5 ${small ? "text-xs" : "text-sm"}`}>
        <span className="grid h-7 w-7 place-items-center rounded-full p-[2px]" style={{ background: RAINBOW_CONIC }}>
          <span className="grid h-full w-full place-items-center rounded-full bg-[#0F0F12] text-[13px]">🎡</span>
        </span>
        <span className="font-extrabold tracking-tight text-white">Spin the wheel for a free discount</span>
        <span className="hidden sm:inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-black tracking-widest text-zinc-900">FREE SPIN</span>
      </span>
    </button>
  );
}
