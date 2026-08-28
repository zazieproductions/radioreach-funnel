/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — CommitmentLadder (commitment & consistency + friction)
   ─────────────────────────────────────────────────────────────
   A foot-in-the-door ladder: two low-cost self-commitments before
   the $25 ask. Each yes is an act of identity — once a visitor
   says they'd do the outreach, declining the tool that enables it
   becomes self-inconsistent. Consistency pressure, not pressure
   tactics, does the closing: the final CTA merely echoes back
   what the visitor already said.

   Skip path: one visible tap, always available, never nagged.
   (The skip rate is itself a metric — it measures the ladder's
   cost in attention.)
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { LabCta, LabFrame } from "./shared";
import { labLogAction } from "../log";

type Answer = "yes" | "no" | null;

export default function CommitmentLadder() {
  return (
    <LabFrame
      experiment="lab_commitment_ladder"
      title="Two small yesses before the big one"
      principles={["commitment", "friction"]}
      variants={["control", "yes-ladder", "yes-ladder + echo-back"]}
      footer="Control = straight CTA. The ladder asks two micro-commitments first; the echo-back variant quotes the visitor's own yesses into the final CTA so declining becomes self-inconsistent."
    >
      {(variant) => <Ladder variant={variant} />}
    </LabFrame>
  );
}

function Ladder({ variant }: { variant: string }) {
  const [q1, setQ1] = useState<Answer>(null);
  const [q2, setQ2] = useState<Answer>(null);
  const [skipped, setSkipped] = useState(false);

  if (variant === "control") {
    return (
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-white/55">
          Control — the CTA stands alone. No commitments requested.
        </p>
        <LabCta experiment="lab_commitment_ladder" variant={variant} label="Get the contacts — $25" sub="Straight ask" />
      </div>
    );
  }

  function answer(setter: (a: Answer) => void, which: "q1" | "q2", value: Answer) {
    setter(value);
    labLogAction("lab_commitment_ladder", variant, `${which}_${value ?? "skip"}`, {});
  }

  const bothYes = q1 === "yes" && q2 === "yes";

  return (
    <div className="mx-auto max-w-sm">
      {!skipped && q1 === null && (
        <div className="fade-in rounded-xl border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Quick check — 1 of 2</p>
          <p className="mt-2 font-display text-lg uppercase leading-tight text-white">Do you have a release coming this year?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => answer(setQ1, "q1", "yes")} className="pressable rounded-lg bg-acid px-3 py-2.5 text-sm font-black uppercase tracking-wider text-ink">
              Yes
            </button>
            <button type="button" onClick={() => answer(setQ1, "q1", "no")} className="pressable rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm font-bold text-white/70">
              Not yet
            </button>
          </div>
          <button type="button" onClick={() => setSkipped(true)} className="mt-3 text-[11px] text-white/30 underline underline-offset-4 hover:text-white/60">
            Skip — show me the price
          </button>
        </div>
      )}

      {!skipped && q1 !== null && q2 === null && (
        <div className="fade-in rounded-xl border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Last one — 2 of 2</p>
          <p className="mt-2 font-display text-lg uppercase leading-tight text-white">
            If the contacts were in front of you, would you send 5 personal pitches?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => answer(setQ2, "q2", "yes")} className="pressable rounded-lg bg-acid px-3 py-2.5 text-sm font-black uppercase tracking-wider text-ink">
              Yes — 5 pitches, easy
            </button>
            <button type="button" onClick={() => answer(setQ2, "q2", "no")} className="pressable rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm font-bold text-white/70">
              Probably not
            </button>
          </div>
          <button type="button" onClick={() => setSkipped(true)} className="mt-3 text-[11px] text-white/30 underline underline-offset-4 hover:text-white/60">
            Skip — show me the price
          </button>
        </div>
      )}

      {!skipped && q2 !== null && (
        <div className="fade-in space-y-3">
          {bothYes && (
            <p className="rounded-lg border border-acid/40 bg-acid/10 px-3 py-2 text-[12px] font-bold leading-relaxed text-white/85">
              {variant === "yes-ladder + echo-back" ? (
                <>You said <b className="text-acid">“5 pitches, easy.”</b> Then the only thing between you and those pitches is the list — 18,000 contacts, named and sorted.</>
              ) : (
                <>The only thing between you and those 5 pitches is the list.</>
              )}
            </p>
          )}
          {q1 === "yes" && q2 === "no" && (
            <p className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] leading-relaxed text-white/60">
              Fair — the Vault isn't a magic button. But it removes the research spiral so the *pitching* is the only work left.
            </p>
          )}
          <LabCta
            experiment="lab_commitment_ladder"
            variant={variant}
            label={bothYes ? "Then here are your contacts — $25" : "Get the contacts — $25"}
            sub={bothYes ? "Consistent with your plan" : "Instant access · lifetime"}
          />
          <button type="button" onClick={() => setSkipped(true)} className="mx-auto block text-[11px] text-white/30 underline underline-offset-4 hover:text-white/60">
            Actually, skip everything
          </button>
        </div>
      )}

      {skipped && (
        <div className="space-y-3">
          <p className="text-[12px] text-white/50">
            Skipped the ladder — straight to the offer. (The skip rate is tracked as the ladder's attention cost.)
          </p>
          <LabCta experiment="lab_commitment_ladder" variant={variant} label="Get the contacts — $25" sub="No questions asked" />
        </div>
      )}
    </div>
  );
}
