/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — AchievementToasts (achievements + micro-timing)
   ─────────────────────────────────────────────────────────────
   Small named rewards for real micro-behaviors. Naming behavior
   makes it self-defining ("I'm the kind of artist who checks the
   receipts") — consistency pressure then pushes the visitor to
   behave like the person the toast just described. The 3/6
   counter is itself a collection that begs completion.

   Timing matters: toasts fire 400–900ms after the behavior with a
   staggered entrance, so the reward lands after the action is
   understood but before attention moves on. Max 1 per 20s in
   production — acknowledgment is rare enough to stay special.
───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import { LabFrame } from "./shared";
import { labLogAction, labLogMilestone } from "../log";

const ACHIEVEMENTS = [
  { id: "proof", label: "Prove It", detail: "You checked the receipts.", behavior: "Linger on proof" },
  { id: "price", label: "Price Sleuth", detail: "You compared prices twice.", behavior: "Revisit the price" },
  { id: "faq", label: "Skeptic, Handled", detail: "You opened the FAQ.", behavior: "Open one FAQ" },
  { id: "scroll", label: "Deep Dive", detail: "You read to the bottom.", behavior: "Reach the final CTA" },
  { id: "wheel", label: "Feeling Lucky", detail: "You took the spin.", behavior: "Take the spin" },
  { id: "closer", label: "Closer", detail: "You're one step from the vault.", behavior: "Click any CTA" },
];

type Toast = { id: string; label: string; detail: string; at: number };

export default function AchievementToasts() {
  return (
    <LabFrame
      experiment="lab_achievement_toasts"
      title="Achievement toasts for micro-behaviors"
      principles={["achievement", "timing", "momentum"]}
      variants={["control", "toasts", "toasts + counter"]}
      footer="Simulate the visitor behaviors with the buttons. Control logs silently; treatments mirror each behavior back as a named achievement 400–900ms later."
    >
      {(variant) => <Achievements variant={variant} />}
    </LabFrame>
  );
}

function Achievements({ variant }: { variant: string }) {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastToastAt, setLastToastAt] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  function trigger(id: string) {
    labLogAction("lab_achievement_toasts", variant, `behavior_${id}`, {});
    if (variant === "control") return;
    if (unlocked.includes(id)) return;
    const now = Date.now();
    const wait = Math.max(400, 900 - (now - lastToastAt)); // rate-limit-ish stagger
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    timers.current.push(
      window.setTimeout(() => {
        setToasts((t) => [...t.slice(-2), { id, label: a.label, detail: a.detail, at: Date.now() }]);
        setUnlocked((u) => [...u, id]);
        setLastToastAt(Date.now());
        labLogMilestone("lab_achievement_toasts", variant, "achievement_unlocked", { achievement: id });
        timers.current.push(
          window.setTimeout(() => {
            setToasts((t) => t.filter((x) => x.id !== id));
          }, 3400)
        );
      }, wait)
    );
  }

  const counter = variant === "toasts + counter" ? `${unlocked.length}/${ACHIEVEMENTS.length} unlocked` : null;

  return (
    <div className="relative">
      {/* toast host */}
      <div className="pointer-events-none absolute right-0 top-0 z-20 w-56 space-y-1.5">
        {toasts.map((t) => (
          <div
            key={`${t.id}-${t.at}`}
            className="fade-in rounded-xl border border-acid/50 bg-black/95 px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
          >
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-acid">
              <span aria-hidden>🏆</span> {t.label}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-white/60">{t.detail}</p>
            {counter && <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-acid/60">{counter}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ACHIEVEMENTS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => trigger(a.id)}
            className={`pressable rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
              unlocked.includes(a.id)
                ? "border-acid/50 bg-acid/10 text-acid"
                : "border-white/15 bg-white/[0.04] text-white/75 hover:border-acid/50 hover:text-white"
            }`}
          >
            {a.behavior}
            {unlocked.includes(a.id) ? " ✓" : ""}
          </button>
        ))}
      </div>

      {variant !== "control" && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ACHIEVEMENTS.map((a) => (
            <div
              key={a.id}
              className={`rounded-lg border p-2 text-center ${
                unlocked.includes(a.id) ? "border-acid/40 bg-acid/[0.07]" : "border-white/10 bg-black/30"
              }`}
            >
              <p className={`text-base ${unlocked.includes(a.id) ? "" : "opacity-30 grayscale"}`} aria-hidden>
                🏆
              </p>
              <p className={`mt-0.5 text-[9px] font-black uppercase leading-tight tracking-wider ${unlocked.includes(a.id) ? "text-acid" : "text-white/30"}`}>
                {a.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {variant === "control" && (
        <p className="mt-3 text-[12px] text-white/45">
          Control — behaviors fire silently. In production, both variants log the same events; only the toast differs.
        </p>
      )}
    </div>
  );
}
