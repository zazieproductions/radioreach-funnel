/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — VariableReward (variable reward schedules)
   ─────────────────────────────────────────────────────────────
   A slot-machine demo of the production wheel's outcome generator.
   The variant switcher IS the experiment: FR-1 (today's wheel:
   every spin pays) against VR-2/VR-3/VR-8 (pay with probability
   1/2, 1/3, 1/8 plus a rare 8% mega tier) and VI (pay only after a
   variable eligibility window).

   Theory: on FR-1 the dopamine spike fires on the *cue* and
   habituates. On VR schedules the spike fires on the *resolution*
   — the suspense carries the loop, and losses that end in a
   visible near-miss keep the next spin feeling winnable.
   The UI shows the last-10 outcome strip and session stats so the
   schedule difference is legible at a glance.
───────────────────────────────────────────────────────────── */

import { useMemo, useRef, useState } from "react";
import { LabCta, LabFrame, useReveal } from "./shared";
import { SCHEDULE_LABELS, SCHEDULE_WIN_RATE, spinReward, type RewardScheduleKind, type RewardTier } from "../core";
import { labLogAction, labLogMilestone } from "../log";

const SCHEDULES: RewardScheduleKind[] = ["fr-1", "vr-2", "vr-3", "vr-8", "vi"];

const REEL = ["🎡", "🎁", "🎧", "📻", "⭐", "🎉", "💿", "🎤"];

type Outcome = { tier: RewardTier };

export default function VariableReward() {
  return (
    <LabFrame
      experiment="lab_variable_reward"
      title="Jackpot schedule — variable vs fixed ratio"
      principles={["variable_reward", "anticipation"]}
      variants={SCHEDULES}
      footer="Each spin resolves through the same pure schedule function used in the unit tests. Watch the outcome strip: FR-1 pays every time (habituation), VR schedules pay unpredictably (sustained engagement)."
    >
      {(variant) => <Machine schedule={variant as RewardScheduleKind} />}
    </LabFrame>
  );
}

function Machine({ schedule }: { schedule: RewardScheduleKind }) {
  const [spinning, setSpinning] = useState(false);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [nextEligible, setNextEligible] = useState(0);
  const startRef = useRef(0);
  const reveal = useReveal(0);

  const stats = useMemo(() => {
    const spins = outcomes.length;
    const wins = outcomes.filter((o) => o.tier !== "none").length;
    const megas = outcomes.filter((o) => o.tier === "mega").length;
    return { spins, wins, megas, rate: spins ? (wins / spins) * 100 : 0 };
  }, [outcomes]);

  function spin() {
    if (spinning) return;
    if (schedule === "vi" && Date.now() < nextEligible) return;
    setSpinning(true);
    startRef.current = Date.now();
    labLogAction("lab_variable_reward", schedule, "spin", {
      schedule,
      spins_before: stats.spins,
    });
    // 900ms of suspense = the anticipation window where VR schedules work
    window.setTimeout(() => {
      const result = spinReward(schedule, Math.random, Date.now() - startRef.current);
      const outcome: Outcome = { tier: result.tier };
      setOutcomes((prev) => [...prev.slice(-9), outcome]);
      if (schedule === "vi") setNextEligible(Date.now() + result.cooldownMs);
      labLogAction("lab_variable_reward", schedule, "resolved", {
        tier: result.tier,
        spins_before: stats.spins,
      });
      if (result.tier === "mega") {
        labLogMilestone("lab_variable_reward", schedule, "mega_hit", {});
      }
      setSpinning(false);
    }, 900);
  }

  const viLocked = schedule === "vi" && Date.now() < nextEligible;

  return (
    <div>
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
          Schedule: <span className="text-acid">{SCHEDULE_LABELS[schedule]}</span>
        </p>

        <div className="mt-3 flex items-center justify-center gap-2 sm:gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`grid h-16 w-14 place-items-center rounded-xl border text-3xl sm:h-20 sm:w-16 sm:text-4xl ${
                spinning
                  ? "animate-pulse border-acid/60 bg-acid/10 shadow-[0_0_30px_rgba(255,230,0,0.25)]"
                  : outcomes.length
                    ? "border-white/15 bg-black/50"
                    : "border-white/10 bg-black/30 opacity-60"
              }`}
              aria-hidden
            >
              {REEL[(i * 3 + (spinning ? Math.floor(Math.random() * 100) : outcomes.length)) % REEL.length]}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={spin}
          disabled={spinning || viLocked}
          className={`cta mt-4 w-full rounded-full py-3 text-sm font-black uppercase tracking-widest ${
            viLocked ? "bg-white/10 text-white/40" : "bg-gradient-to-r from-[#ff3b82] via-[#7c5cff] to-[#00d4ff] text-white"
          }`}
        >
          {spinning ? "Spinning…" : viLocked ? `Eligible in ${Math.ceil((nextEligible - Date.now()) / 1000)}s` : "Spin — free, 5 sec"}
        </button>

        <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-white/30">
          Theoretical win rate: {Math.round(SCHEDULE_WIN_RATE[schedule] * 100)}% · mega upgrades 8% of wins
        </p>
      </div>

      {/* outcome strip */}
      <div className="mt-3 flex min-h-9 items-center gap-1.5 overflow-x-auto">
        {outcomes.length === 0 ? (
          <p className="text-[11px] text-white/30">No spins yet — the strip fills with your last 10 outcomes.</p>
        ) : (
          outcomes.map((o, i) => (
            <span
              key={i}
              title={o.tier}
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-sm font-black ${
                o.tier === "mega"
                  ? "bg-gradient-to-br from-acid to-orange-400 text-ink"
                  : o.tier === "base"
                    ? "bg-acid/20 text-acid"
                    : "bg-white/5 text-white/30"
              }`}
            >
              {o.tier === "mega" ? "★" : o.tier === "base" ? "✓" : "·"}
            </span>
          ))
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <Stat label="Spins" value={String(stats.spins)} />
        <Stat label="Wins" value={String(stats.wins)} />
        <Stat label="Mega hits" value={String(stats.megas)} />
      </div>

      {reveal ? (
        <div className="mt-3">
          <LabCta
            experiment="lab_variable_reward"
            variant={schedule}
            label="Claim the jackpot path — $21 bundle"
            sub="Prototype conversion probe · price unchanged"
          />
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5">
      <p className="tnum font-mono text-sm font-bold text-white">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">{label}</p>
    </div>
  );
}
