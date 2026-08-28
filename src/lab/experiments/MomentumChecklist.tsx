/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — MomentumChecklist (perceived momentum + friction + goal gradient)
   ─────────────────────────────────────────────────────────────
   A four-item checkout-prep checklist that opens 75% complete.
   Perceived progress is real progress: showing the finish line
   close by reduces the psychological distance to the payment
   action — paying becomes *closing a loop* instead of *starting a
   process*.

   Treatment "pre-completed + auto-advance" goes further: the
   third item visibly completes itself after 1.4s ("Preparing your
   copy…"), so the visitor watches the funnel do work *for them*
   and arrives at the only remaining step already in motion.

   Guardrail: every pre-checked item must be a true statement —
   the founder price really is locked, the copy really is instant.
───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { LabCta, LabFrame } from "./shared";
import { labLogAction, labLogMilestone } from "../log";

const STEPS = [
  { id: "found", label: "Found the contacts", detail: "18,000+ entries, sorted city by city" },
  { id: "price", label: "Price locked", detail: "Founder rate $25 — held for this session" },
  { id: "prepared", label: "Copy prepared", detail: "Your download is packaged and waiting" },
  { id: "pay", label: "Pay", detail: "The only step left" },
];

export default function MomentumChecklist() {
  return (
    <LabFrame
      experiment="lab_perceived_momentum"
      title="The checklist that's already 75% done"
      principles={["momentum", "friction", "goal_gradient"]}
      variants={["control", "pre-completed checklist", "pre-completed + auto-advance"]}
      footer="Control = bare payment step. Treatments open with 3 of 4 steps visibly finished, so paying is the last 25% of a running process instead of the first 100% of a new one."
    >
      {(variant) => <Checklist variant={variant} />}
    </LabFrame>
  );
}

function Checklist({ variant }: { variant: string }) {
  const [done, setDone] = useState<Record<string, boolean>>(() => ({
    found: variant !== "control",
    price: variant !== "control",
    prepared: false,
    pay: false,
  }));

  useEffect(() => {
    if (variant !== "pre-completed + auto-advance") return;
    const t = window.setTimeout(() => {
      setDone((d) => {
        if (d.prepared) return d;
        labLogAction("lab_perceived_momentum", variant, "step_auto_completed", { step: "prepared" });
        return { ...d, prepared: true };
      });
    }, 1400);
    return () => window.clearTimeout(t);
  }, [variant]);

  if (variant === "control") {
    return (
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-white/55">
          Control — the payment step starts at zero. No progress visible.
        </p>
        <LabCta experiment="lab_perceived_momentum" variant={variant} label="Enter payment — $25" sub="A fresh 100% in front of you" />
      </div>
    );
  }

  function finishPay() {
    setDone((d) => ({ ...d, pay: true }));
    labLogMilestone("lab_perceived_momentum", variant, "checklist_finished", {});
  }

  const finished = STEPS.filter((s) => done[s.id]).length;
  const pct = finished / STEPS.length;

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-acid">
            {done.pay ? "Checklist complete" : "Your vault, almost in hand"}
          </p>
          <span className="tnum font-mono text-[11px] text-white/45">{finished}/4</span>
        </div>

        <ul className="mt-3 space-y-2.5">
          {STEPS.map((s, i) => {
            const isDone = done[s.id];
            const isActive = !isDone && (i === 0 || done[STEPS[i - 1].id]);
            return (
              <li key={s.id} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black ${
                    isDone ? "bg-acid text-ink" : isActive ? "animate-pulse border border-acid/70 text-acid" : "border border-white/15 text-white/25"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-bold leading-tight ${isDone ? "text-white/80" : isActive ? "text-white" : "text-white/35"}`}>
                    {s.label}
                    {isDone && !done.pay && <span className="ml-1.5 text-[10px] font-black uppercase tracking-wider text-acid/70">done</span>}
                  </p>
                  <p className={`text-[11px] leading-snug ${isDone ? "text-white/45" : "text-white/30"}`}>{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>

        {done.prepared && !done.pay && (
          <p className="fade-in mt-2 rounded bg-acid/10 px-2.5 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.14em] text-acid">
            Everything's ready — only the payment step remains
          </p>
        )}
      </div>

      <div className="mt-3">
        <LabCta
          experiment="lab_perceived_momentum"
          variant={variant}
          onClick={finishPay}
          label={done.pay ? "Done — $25 ✓" : "Finish the last step — $25"}
          sub={done.pay ? "Checklist complete" : `${Math.round(pct * 100)}% already done for you`}
        />
      </div>
    </div>
  );
}
