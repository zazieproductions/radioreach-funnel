/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — CuriosityLoop (curiosity loops + anticipation)
   ─────────────────────────────────────────────────────────────
   Three high-stakes questions tease their answers; tap to close
   the gap. Each reveal chains into the next open loop ("Mistake
   #2 is the one you're making right now"). Open loops are
   psychologically aversive to leave unclosed — the visitor keeps
   tapping until the page's argument has been fully read, which is
   exactly what a sales page wants.

   Control = answers visible (today's FAQ style). No dark patterns:
   every gap closes in one tap and never re-locks.
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { LabCta, LabFrame } from "./shared";
import { labLogAction } from "../log";

const GAPS = [
  {
    id: "g1",
    tease: "The #1 reason radio emails get deleted",
    reveal:
      "It never reaches a person. It lands in info@ or a generic form that an intern clears every Friday. 10,372 of the Vault's emails are verified deliverable addresses tied to a named decision-maker.",
    chain: "Mistake #2 is worse — and it's the one you're making right now ↓",
  },
  {
    id: "g2",
    tease: "The mistake you're making right now",
    reveal:
      "You're blasting the same pitch to 40 stations. Music directors can smell a template from the subject line. The Vault is organized by station, role, and city so your first line is 'Hi [name]' — not 'Dear Program Director.'",
    chain: "But the fix has a trap ↓",
  },
  {
    id: "g3",
    tease: "The fix with a trap in it",
    reveal:
      "Starting local. Artists skip their hometown stations because they feel 'small' — but local is the warmest lead on earth: you're the local act, not a stranger. Sort the Vault by city and start where your name already means something.",
    chain: null,
  },
];

export default function CuriosityLoop() {
  return (
    <LabFrame
      experiment="lab_curiosity_gap"
      title="The open loop — mistakes artists make"
      principles={["curiosity", "anticipation"]}
      variants={["control", "tap-to-reveal", "chained loops"]}
      footer="Control shows answers. 'tap-to-reveal' hides them behind teased questions. 'chained loops' adds the next-gap hook after each reveal so closing one gap opens the next."
    >
      {(variant) => <Gaps variant={variant} />}
    </LabFrame>
  );
}

function Gaps({ variant }: { variant: string }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function openGap(id: string) {
    if (open[id]) return;
    setOpen((o) => ({ ...o, [id]: true }));
    labLogAction("lab_curiosity_gap", variant, "gap_opened", { gap: id });
  }

  return (
    <div className="space-y-2.5">
      {GAPS.map((g, i) => {
        const isOpen = variant === "control" || open[g.id];
        return (
          <div key={g.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
            <button
              type="button"
              onClick={() => variant !== "control" && openGap(g.id)}
              disabled={variant === "control"}
              aria-expanded={isOpen}
              className={`pressable flex w-full items-center gap-3 px-4 py-3 text-left ${variant === "control" ? "cursor-default" : ""}`}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-black ${isOpen ? "bg-acid text-ink" : "bg-white/10 text-white/60"}`}>
                {i + 1}
              </span>
              <span className={`flex-1 text-[13px] font-bold leading-snug ${isOpen ? "text-white" : "text-white/75"}`}>
                {g.tease}
              </span>
              {variant !== "control" && (
                <span className={`text-acid transition-transform ${isOpen ? "rotate-45" : ""}`} aria-hidden>
                  +
                </span>
              )}
            </button>
            {isOpen && (
              <div className="fade-in border-t border-white/10 px-4 py-3">
                <p className="font-serif text-[13px] leading-relaxed text-white/75">{g.reveal}</p>
                {variant === "chained loops" && g.chain && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-acid">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-acid" />
                    {g.chain}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
      <LabCta
        experiment="lab_curiosity_gap"
        variant={variant}
        label="Stop making mistake #2 — $20"
        sub="Named contacts, not templates"
      />
    </div>
  );
}
