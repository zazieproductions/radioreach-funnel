/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — ProgressionLadder (progression + unlockable + goal gradient)
   ─────────────────────────────────────────────────────────────
   An engagement-XP ladder. In production, the XP sources would be
   real signals (scroll depth, zone dwell, FAQ opens — the same
   signal layer the ESP uses). Here they're simulated with buttons
   so the mechanic can be reviewed in isolation.

   Rank unlocks are real bonus content (guides, templates, price
   lock) — progression converts passive reading into a scored
   activity, and the eased goal-gradient bar makes the final
   stretch to each rank feel faster than it is. Cooldowns prevent
   farming; the label always shows honest XP.
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { GoalBar, LabCta, LabFrame } from "./shared";
import { nextRank, rankForXp, XP_RANKS } from "../core";
import { labLogMilestone } from "../log";

const XP_SOURCES = [
  { action: "scrolled", label: "Scroll the page", xp: 5, cooldown: 2_000 },
  { action: "read_proof", label: "Read the proof section", xp: 10, cooldown: 3_000 },
  { action: "check_price", label: "Compare the price", xp: 5, cooldown: 2_000 },
  { action: "open_faq", label: "Open one FAQ", xp: 15, cooldown: 3_000 },
  { action: "hover_cta", label: "Linger on the CTA", xp: 5, cooldown: 2_000 },
];

export default function ProgressionLadder() {
  return (
    <LabFrame
      experiment="lab_progression_ladder"
      title="Airplay ladder — XP for engagement"
      principles={["progression", "unlockable", "goal_gradient"]}
      variants={["control", "ladder", "ladder + unlock toasts"]}
      footer="Control shows no ladder (the page as-is). Treatment grants XP for engagement with named ranks. Production wiring: swap the demo buttons for the ESP signal layer — the XP math is already pure and tested."
    >
      {(variant) => <Ladder variant={variant} />}
    </LabFrame>
  );
}

function Ladder({ variant }: { variant: string }) {
  const [xp, setXp] = useState(variant === "control" ? 999 : 0);
  const [toasts, setToasts] = useState<string[]>([]);
  const [cooling, setCooling] = useState<Record<string, boolean>>({});

  const rank = rankForXp(xp);
  const next = nextRank(xp);
  const pct = next
    ? Math.min(1, (xp - rank.minXp) / (next.minXp - rank.minXp))
    : 1;

  if (variant === "control") {
    return (
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-white/55">
          Control — no progression system. The visitor reads the page; engagement earns nothing visible.
        </p>
        <LabCta
          experiment="lab_progression_ladder"
          variant={variant}
          label="Claim the Vault — $20"
          sub="Straight CTA, no ladder"
        />
      </div>
    );
  }

  function earn(action: string, amount: number, cooldown: number) {
    if (cooling[action]) return;
    const before = rankForXp(xp).name;
    setXp((prev) => prev + amount);
    setCooling((c) => ({ ...c, [action]: true }));
    window.setTimeout(() => setCooling((c) => ({ ...c, [action]: false })), cooldown);
    const after = rankForXp(xp + amount).name;
    if (after !== before) {
      const toast = `Rank up — ${after}`;
      if (variant === "ladder + unlock toasts") {
        setToasts((t) => [...t.slice(-2), toast]);
        window.setTimeout(() => setToasts((t) => t.filter((x) => x !== toast)), 3500);
      }
      labLogMilestone("lab_progression_ladder", variant, "rank_up", {
        rank: after,
        xp: xp + amount,
      });
    }
  }

  return (
    <div className="relative space-y-4">
      {/* unlock toasts */}
      {toasts.length > 0 && (
        <div className="pointer-events-none absolute right-2 top-0 z-10 space-y-1.5">
          {toasts.map((t) => (
            <div key={t} className="fade-in rounded-lg border border-acid/50 bg-black/90 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-acid shadow-[0_8px_30px_rgba(255,230,0,0.15)]">
              🏆 {t}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-xl uppercase leading-none text-white">
            Rank: <span className="text-acid">{rank.name}</span>
          </p>
          <p className="tnum font-mono text-xs text-white/50">{xp} XP</p>
        </div>
        <div className="mt-3">
          <GoalBar
            pct={pct}
            label={next ? `${next.minXp - xp} XP to ${next.name}` : "Max rank — all unlocks claimed"}
          />
        </div>
        <p className="mt-2 text-[11px] text-white/45">
          Current unlock: <b className="text-white/80">{rank.unlock}</b>
          {next ? ` · next: ${next.unlock}` : ""}
        </p>
      </div>

      {/* rank ladder */}
      <div className="flex items-center gap-1.5">
        {XP_RANKS.map((r, i) => {
          const reached = xp >= r.minXp;
          return (
            <div key={r.name} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`grid h-9 w-9 place-items-center rounded-full border-2 text-sm ${
                  reached ? "border-acid bg-acid text-ink" : "border-white/15 bg-black/40 text-white/30"
                }`}
              >
                {reached ? "✓" : i + 1}
              </div>
              <p className={`text-center text-[9px] font-bold uppercase leading-tight tracking-wide ${reached ? "text-acid" : "text-white/35"}`}>
                {r.name}
              </p>
            </div>
          );
        })}
      </div>

      {/* simulated signal sources */}
      <div>
        <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
          Simulate page signals (production: real scroll/zone events)
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {XP_SOURCES.map((s) => (
            <button
              key={s.action}
              type="button"
              disabled={!!cooling[s.action]}
              onClick={() => earn(s.action, s.xp, s.cooldown)}
              className={`pressable rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                cooling[s.action] ? "text-white/30" : "text-white/75 hover:border-acid/50 hover:bg-acid/10 hover:text-white"
              }`}
            >
              {cooling[s.action] ? "Cooldown…" : `${s.label} +${s.xp} XP`}
            </button>
          ))}
        </div>
      </div>

      <LabCta
        experiment="lab_progression_ladder"
        variant={variant}
        label={next ? `Keep climbing — Vault $20` : "Founder price locked — Claim $20"}
        sub={next ? `${rank.unlock} unlocked · ${next.unlock} next` : "All bonuses unlocked"}
      />
    </div>
  );
}
