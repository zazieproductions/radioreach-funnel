/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — UnlockableContent (unlockable + curiosity)
   ─────────────────────────────────────────────────────────────
   The value stack re-framed as a vault with sealed drawers. Two
   drawers are open; three open only after a micro-action (answer
   one question, open one FAQ, take the spin). Effort-begets-value
   (IKEA effect): what the visitor *earns* is liked more than what
   is given, and the still-sealed drawers are an information gap
   that the page invites them to close.

   Control = today's flat list. Every unlock is one tap; nothing
   here requires real data or an email.
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { LabCta, LabFrame } from "./shared";
import { labLogAction, labLogMilestone } from "../log";

type Drawer = {
  id: string;
  icon: string;
  title: string;
  value: string;
  body: string;
  unlockLabel: string;
  unlockAction: string;
};

const DRAWERS: Drawer[] = [
  {
    id: "contacts",
    icon: "📇",
    title: "18,000+ radio station entries",
    value: "$297",
    body: "Program directors, music directors, decision-makers — organized by station, location, role, phone, email.",
    unlockLabel: "Already open",
    unlockAction: "open",
  },
  {
    id: "pdf",
    icon: "📕",
    title: "400+ page organized document",
    value: "$97",
    body: "The gatekeepers in one file. City-sorted tables, ready for outreach tonight.",
    unlockLabel: "Already open",
    unlockAction: "open",
  },
  {
    id: "contracts",
    icon: "📄",
    title: "Indie Contract Kit",
    value: "$25",
    body: "Six agreement templates + a plain-English guide — so the first deal doesn't split you 80/20.",
    unlockLabel: "Answer one question to open",
    unlockAction: "answer",
  },
  {
    id: "au",
    icon: "🇦🇺",
    title: "AU Radio List — 2,847 contacts",
    value: "$29",
    body: "triple j, community, commercial, regional. Direct emails where stations publish them.",
    unlockLabel: "Open one FAQ to open",
    unlockAction: "faq",
  },
  {
    id: "bonus",
    icon: "🎁",
    title: "Secret founder bonus",
    value: "?",
    body: "The fifth drawer only opens after you take the spin. That's the rule. We don't make the rules.",
    unlockLabel: "Take the spin to open",
    unlockAction: "spin",
  },
];

export default function UnlockableContent() {
  return (
    <LabFrame
      experiment="lab_unlockable_drawers"
      title="Locked drawers in the vault"
      principles={["unlockable", "curiosity"]}
      variants={["control", "locked drawers"]}
      footer="Control lists everything flat. Treatment seals 3 of 5 drawers behind one-tap micro-actions — earned access raises perceived value, and the sealed drawer stays an open loop."
    >
      {(variant) => <Vault variant={variant} />}
    </LabFrame>
  );
}

function Vault({ variant }: { variant: string }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DRAWERS.map((d) => [d.id, variant === "control" || d.unlockAction === "open"]))
  );
  const [micro, setMicro] = useState<Record<string, string | null>>({});
  const openedCount = Object.values(open).filter(Boolean).length;

  function unlock(d: Drawer, action: string) {
    if (open[d.id]) return;
    setOpen((o) => ({ ...o, [d.id]: true }));
    setMicro((m) => ({ ...m, [d.id]: action }));
    labLogAction("lab_unlockable_drawers", variant, `unlock_${action}`, { drawer: d.id });
    if (openedCount + 1 === DRAWERS.length) {
      labLogMilestone("lab_unlockable_drawers", variant, "all_drawers_open", {});
    }
  }

  return (
    <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/40">
      {DRAWERS.map((d) => {
        const isOpen = open[d.id];
        return (
          <div key={d.id} className={`flex items-start gap-3 p-3.5 transition sm:gap-4 sm:p-4 ${isOpen ? "bg-white/[0.02]" : "bg-black/30"}`}>
            <span
              className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base ${
                isOpen ? "bg-acid/15" : "border border-dashed border-white/20 opacity-60"
              }`}
              aria-hidden
            >
              {isOpen ? d.icon : "🔒"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className={`font-bold leading-snug ${isOpen ? "text-white" : "text-white/60"}`}>
                  {d.title}
                </p>
                <span className={`shrink-0 font-display text-sm ${isOpen ? "text-white/45 line-through decoration-blood" : "text-white/30"}`}>
                  {d.value}
                </span>
              </div>
              {isOpen ? (
                <>
                  <p className="fade-in mt-0.5 text-[13px] leading-snug text-white/60">{d.body}</p>
                  {micro[d.id] && (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-acid/60">
                      ✓ Unlocked via {micro[d.id]}
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {d.unlockAction === "answer" && (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => unlock(d, "answer")}
                        className="pressable rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/70 hover:bg-acid hover:text-ink"
                      >
                        Q: Touring this year? — Yes
                      </button>
                      <span className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/35">No</span>
                    </div>
                  )}
                  {d.unlockAction === "faq" && (
                    <button
                      type="button"
                      onClick={() => unlock(d, "faq")}
                      className="pressable rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/70 hover:bg-acid hover:text-ink"
                    >
                      Open the refund FAQ to unseal →
                    </button>
                  )}
                  {d.unlockAction === "spin" && (
                    <button
                      type="button"
                      onClick={() => unlock(d, "spin")}
                      className="pressable rounded-full bg-gradient-to-r from-[#ff3b82] via-[#7c5cff] to-[#00d4ff] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white"
                    >
                      🎡 Take the spin
                    </button>
                  )}
                  <span className="text-[10px] uppercase tracking-wider text-white/30">{d.unlockLabel}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between gap-3 bg-acid/10 p-3.5 sm:p-4">
        <span className="font-display text-sm uppercase leading-tight text-white/80 sm:text-base">
          {openedCount} of {DRAWERS.length} drawers open
        </span>
        <span className="font-display text-lg text-acid sm:text-xl">$20</span>
      </div>

      <div className="p-3.5 sm:p-4">
        <LabCta
          experiment="lab_unlockable_drawers"
          variant={variant}
          label={openedCount < DRAWERS.length ? "Open the rest after purchase — $20" : "Everything's open. Claim it — $20"}
          sub="Unlocks persist in the vault forever"
        />
      </div>
    </div>
  );
}

export { DRAWERS };
