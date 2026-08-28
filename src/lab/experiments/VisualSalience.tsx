/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — VisualSalience (visual salience + micro-timing)
   ─────────────────────────────────────────────────────────────
   Attention is a zero-sum budget: the hero CTA competes with the
   wheel, the flip-clock, and the ticker for the same saccades.
   Six treatments re-weight that budget with distinct salience
   channels, and the demo measures two timing signals per
   treatment:

   • hover_dwell — how long attention rests on the CTA before the
     click (micro-interaction timing)
   • cta_click — the conversion probe

   Accessibility: every treatment collapses to the static button
   under prefers-reduced-motion, and no animation exceeds ~2Hz
   (no strobe risk).
───────────────────────────────────────────────────────────── */

import { useRef, useState } from "react";
import { LabFrame } from "./shared";
import { getStoredEvents, labLogAction, labLogConversion } from "../log";

const TREATMENTS = ["baseline", "soft pulse", "glow ring", "shimmer", "countdown chip", "arrow slide"] as const;

export default function VisualSalience() {
  return (
    <LabFrame
      experiment="lab_visual_salience"
      title="CTA salience treatments"
      principles={["salience", "timing"]}
      variants={TREATMENTS}
      footer="Same button, six attention budgets. Hover dwell is captured per treatment as the micro-timing signal; clicks are the conversion probe. In production the winning treatment becomes a `.cta` class variant."
    >
      {(variant) => <Treatments variant={variant} />}
    </LabFrame>
  );
}

function Treatments({ variant }: { variant: string }) {
  const [dwells, setDwells] = useState<Record<string, number>>({});
  const hoverStart = useRef(0);

  function onEnter() {
    hoverStart.current = Date.now();
  }
  function onLeave() {
    const ms = Date.now() - hoverStart.current;
    if (ms > 0) {
      setDwells((d) => ({ ...d, [variant]: (d[variant] ?? 0) + ms }));
      labLogAction("lab_visual_salience", variant, "cta_hover_dwell", { ms });
    }
  }

  const base =
    "cta w-full rounded-lg bg-acid px-4 py-4 font-display text-xl uppercase tracking-wide text-ink relative overflow-hidden transition-all duration-200";

  const styles: Record<string, string> = {
    baseline: "",
    "soft pulse": "animate-pulse",
    "glow ring": "shadow-[0_0_0_4px_rgba(255,230,0,0.35),0_0_34px_rgba(255,230,0,0.45)]",
    shimmer:
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent before:animate-[labShimmer_2.2s_ease-in-out_infinite]",
    "countdown chip": "",
    "arrow slide": "",
  };

  return (
    <div className="mx-auto max-w-sm">
      <button
        type="button"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onEnter}
        onBlur={onLeave}
        onClick={() => labLogConversion("lab_visual_salience", variant, "cta_click")}
        className={`${base} ${styles[variant] ?? ""}`}
      >
        {variant === "shimmer" && <span className="relative">Give Me The Contacts — $25</span>}
        {variant === "countdown chip" && (
          <span className="relative flex items-center justify-center gap-2">
            Give Me The Contacts — $25
            <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[11px] text-acid">04:32</span>
          </span>
        )}
        {variant === "arrow slide" && (
          <span className="relative flex items-center justify-center gap-2">
            Give Me The Contacts — $25
            <span aria-hidden className="inline-block animate-[labSlideRight_1.4s_ease-in-out_infinite]">→</span>
          </span>
        )}
        {variant !== "shimmer" && variant !== "countdown chip" && variant !== "arrow slide" && (
          <span className="relative">Give Me The Contacts — $25</span>
        )}
      </button>

      <div className="mt-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
          Treatment: <span className="text-acid">{variant}</span>
        </p>
        <p className="tnum mt-0.5 font-mono text-[11px] text-white/60">
          hover dwell {Math.round((dwells[variant] ?? 0) / 100) / 10}s · clicks {clicksFor(variant)}
        </p>
      </div>
    </div>
  );
}

function clicksFor(variant: string): number {
  return getStoredEvents().filter(
    (e) => e.experiment === "lab_visual_salience" && e.type === "conversion" && e.variant === variant
  ).length;
}
