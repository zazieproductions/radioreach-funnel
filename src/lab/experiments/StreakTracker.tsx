/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — StreakTracker (streak systems + commitment)
   ─────────────────────────────────────────────────────────────
   Post-purchase activation mechanic: a 7-day outreach calendar
   that reframes "use the product" as "don't break the chain."
   A streak is a self-sustaining commitment device — the sunk cost
   of a 3-day chain makes skipping day 4 a visible loss. One freeze
   token per week softens the blow so a missed day doesn't kill
   the loop entirely.

   The demo compresses time: buttons simulate yesterday/today.
   All streak math lives in core.ts (pure, tested).
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { LabCta, LabFrame } from "./shared";
import { STREAK_FREEZE_LIMIT, STREAK_GOAL, updateStreak, type StreakState } from "../core";
import { labLogAction, labLogMilestone } from "../log";

function dayOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function StreakTracker() {
  return (
    <LabFrame
      experiment="lab_streak_calendar"
      title="7-day outreach streak"
      principles={["streak", "commitment"]}
      variants={["control", "streak calendar", "streak + freeze token"]}
      footer="Control = static 'start outreach' CTA (today's success page). Treatments add the chain. Days are simulated — in production, completion is tracked per day."
    >
      {(variant) => <Streak variant={variant} />}
    </LabFrame>
  );
}

function Streak({ variant }: { variant: string }) {
  const hasFreeze = variant === "streak + freeze token";
  const [state, setState] = useState<StreakState>({
    current: 3,
    best: 3,
    // the plain calendar variant starts with its freeze budget spent,
    // so a missed day breaks the chain — that IS the variant difference
    freezesUsed: hasFreeze ? 0 : STREAK_FREEZE_LIMIT,
    lastDoneDay: dayOffset(-1),
  });
  const [todayDone, setTodayDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const today = dayOffset(0);
  const yesterday = dayOffset(-1);

  if (variant === "control") {
    return (
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-white/55">
          Control — a static post-purchase CTA. No chain, no loss on the table.
        </p>
        <LabCta experiment="lab_streak_calendar" variant={variant} label="Start my outreach →" sub="One link, no tracking" />
      </div>
    );
  }

  function completeToday() {
    if (todayDone) return;
    const next = updateStreak(state, today, yesterday, true);
    setState(next);
    setTodayDone(true);
    labLogAction("lab_streak_calendar", variant, "day_complete", { current: next.current });
    if (next.current >= STREAK_GOAL) {
      labLogMilestone("lab_streak_calendar", variant, "streak_complete", {});
      setMessage("7 days straight — that's how a release actually moves.");
    } else {
      setMessage(`Day ${next.current} locked. The chain is alive.`);
    }
  }

  function simulateMiss() {
    // Miss *today*: the streak survives once via a freeze token
    // (if the variant has one), otherwise the chain breaks.
    const next = updateStreak(state, today, yesterday, false);
    setState(next);
    labLogAction("lab_streak_calendar", variant, "miss_simulated", {});
    setMessage(
      next.current === 0
        ? "Chain broken. Day 1 starts now — the calendar doesn't judge."
        : `Missed day frozen. ${STREAK_FREEZE_LIMIT - next.freezesUsed} freeze${STREAK_FREEZE_LIMIT - next.freezesUsed === 1 ? "" : "s"} left.`
    );
  }

  const days = Array.from({ length: STREAK_GOAL }, (_, i) => {
    const done = i < state.current || (i === state.current && todayDone);
    const isToday = i === state.current;
    return { day: i + 1, done, isToday };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3">
        <div>
          <p className="font-display text-2xl leading-none text-acid">{state.current}/{STREAK_GOAL}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
            Day streak · best {state.best}
          </p>
        </div>
        <span className="text-2xl" aria-hidden>{state.current > 0 ? "🔥" : "🧊"}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {days.map((d) => (
          <div
            key={d.day}
            className={`grid h-10 flex-1 place-items-center rounded-lg border text-sm font-black transition ${
              d.done
                ? "border-acid bg-acid text-ink"
                : d.isToday
                  ? "animate-pulse border-acid/70 bg-acid/10 text-acid"
                  : "border-white/10 bg-black/30 text-white/30"
            }`}
          >
            {d.done ? "✓" : d.day}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={todayDone}
          onClick={completeToday}
          className={`pressable rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${
            todayDone ? "bg-acid/20 text-acid" : "bg-acid text-ink hover:brightness-110"
          }`}
        >
          {todayDone ? "Day logged ✓" : "Log today's outreach"}
        </button>
        <button
          type="button"
          onClick={simulateMiss}
          className="pressable rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-white/60 hover:text-white/90"
        >
          Simulate a missed day
        </button>
      </div>

      {variant === "streak + freeze token" && (
        <p className="text-[11px] text-white/45">
          ❄️ Freeze tokens: {STREAK_FREEZE_LIMIT - state.freezesUsed} left — one missed day doesn't break the chain.
        </p>
      )}

      {message && <p className="fade-in rounded-lg border border-acid/30 bg-acid/[0.07] px-3 py-2 text-[12px] font-bold text-white/85">{message}</p>}

      <LabCta
        experiment="lab_streak_calendar"
        variant={variant}
        label="Open today's outreach list →"
        sub="Day-by-day, city-by-city"
      />
    </div>
  );
}
