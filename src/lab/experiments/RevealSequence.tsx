/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — RevealSequence (anticipation & reveal + narrative framing)
   ─────────────────────────────────────────────────────────────
   Two mechanisms in one demo:

   • Staggered reveal — the value stack arrives as five face-down
     cards flipping one by one (250ms stagger). The gap between
     knowing a reveal is coming and seeing it is anticipation, and
     anticipation amplifies the perceived value of each item.

   • Narrative framing — treatment "flip + story captions" opens
     with a second-person scene (the 2am Google spiral) so the
     value stack reads as the *resolution* of a story the visitor
     has already lived. Narrative transportation suppresses
     counter-arguing.

   prefers-reduced-motion: the sequence renders as the flat list
   (the control), matching the production accessibility rule.
───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { LabCta, LabFrame } from "./shared";
import { labLogAction, labLogMilestone } from "../log";

const CARDS = [
  { icon: "📇", title: "18,000+ entries", value: "$297", caption: "The room. Program directors, music directors, decision-makers." },
  { icon: "📕", title: "400+ page document", value: "$97", caption: "The gatekeepers in one file." },
  { icon: "📍", title: "City-by-city organization", value: "$79", caption: "Start local, expand along your tour route." },
  { icon: "🔓", title: "Lifetime access", value: "$120", caption: "No subscription. No renewal." },
  { icon: "📮", title: "Direct emails", value: "$149", caption: "Tied to a named person, not a generic inbox." },
];

export default function RevealSequence() {
  return (
    <LabFrame
      experiment="lab_anticipation_reveal"
      title="Staggered vault reveal + story framing"
      principles={["anticipation", "narrative"]}
      variants={["control", "flip reveal", "flip + story captions"]}
      footer="Control = flat list (today's stack). Treatments stagger the reveals and optionally open with a 3-line scene — anticipation raises perceived value; narrative suppresses counter-arguing."
    >
      {(variant) => <Reveal variant={variant} />}
    </LabFrame>
  );
}

function Reveal({ variant }: { variant: string }) {
  const [flipped, setFlipped] = useState<boolean[]>(CARDS.map(() => false));
  const reduceMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const flat = variant === "control" || reduceMotion;

  useEffect(() => {
    if (flat) {
      setFlipped(CARDS.map(() => true));
      return;
    }
    setFlipped(CARDS.map(() => false));
    const timers = CARDS.map((_, i) =>
      window.setTimeout(() => {
        setFlipped((f) => {
          const next = [...f];
          next[i] = true;
          return next;
        });
        labLogAction("lab_anticipation_reveal", variant, "card_flipped", { card: i + 1 });
        if (i === CARDS.length - 1) {
          labLogMilestone("lab_anticipation_reveal", variant, "reveal_complete", {});
        }
      }, 600 + i * 250)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, flat]);

  return (
    <div>
      {variant === "flip + story captions" && (
        <div className="mb-4 rounded-xl border border-blood/30 bg-blood/[0.06] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blood">2:47am. Page 6 of Google.</p>
          <p className="mt-2 font-serif text-[13px] leading-relaxed text-white/80">
            You're copying station names into a spreadsheet, guessing at email formats, firing your life's work
            into <code className="rounded bg-black/60 px-1.5 py-0.5 text-acid">info@</code> inboxes nobody opens.
            Six months of that. And then you found the drawer that ends the search —
          </p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {CARDS.map((c, i) => {
          const up = flipped[i];
          return (
            <div
              key={c.title}
              className={`relative min-h-[92px] overflow-hidden rounded-xl border transition-all duration-500 ${
                up ? "border-acid/30 bg-black/40" : "border-white/10 bg-black/30"
              }`}
            >
              {!up && (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-white/[0.04] to-transparent">
                  <span className="text-xl opacity-50" aria-hidden>🂠</span>
                </div>
              )}
              <div className={`relative flex h-full items-start gap-3 p-3 transition-opacity duration-500 ${up ? "opacity-100" : "opacity-0"}`}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-acid/15 text-base" aria-hidden>
                  {c.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13px] font-bold text-white">{c.title}</p>
                    <span className="shrink-0 font-display text-sm text-white/40 line-through decoration-blood">{c.value}</span>
                  </div>
                  <p className="mt-0.5 text-[12px] leading-snug text-white/55">{c.caption}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-acid/10 px-4 py-3">
        <span className="font-display text-sm uppercase text-white/80">Total real value</span>
        <span className="font-display text-xl text-white/50 line-through decoration-blood decoration-2">$742</span>
        <span className="font-display text-3xl text-acid">$20</span>
      </div>

      <div className="mt-3">
        <LabCta
          experiment="lab_anticipation_reveal"
          variant={variant}
          label="Open the whole drawer — $20"
          sub="Everything above, instantly"
        />
      </div>
    </div>
  );
}
