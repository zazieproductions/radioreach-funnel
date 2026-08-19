/* ─────────────────────────────────────────────────────────────
   CONVERSION LAB — gallery (#/lab)
   ─────────────────────────────────────────────────────────────
   The review surface for every prototype. Each experiment renders
   with its hypothesis card (expandable) and its working prototype
   with a variant switcher. A live event feed shows what every
   interaction logged, and the header exposes the assignment
   snapshot — the same data that would ride along with Stripe
   metadata in production.

   Kill switches: ?lab=off, lab.disabled=1, VITE_LAB_ENABLED=false.
   QA: ?lab=debug shows the raw feed; ?lab=<exp>:<variant> forces
   a variant; the switchers persist per session.
───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from "react";
import { EXPERIMENTS, PRINCIPLE_LABELS, STAGE_LABELS } from "./catalog";
import type { LabPrinciple } from "./types";
import { readLabFlag, reviveLab } from "./flag";
import { getLabSnapshot, getStoredEvents, setLabDebug, subscribeLab } from "./log";

import VariableReward from "./experiments/VariableReward";
import ProgressionLadder from "./experiments/ProgressionLadder";
import UnlockableContent from "./experiments/UnlockableContent";
import CollectionKit from "./experiments/CollectionKit";
import StreakTracker from "./experiments/StreakTracker";
import AchievementToasts from "./experiments/AchievementToasts";
import CuriosityLoop from "./experiments/CuriosityLoop";
import RevealSequence from "./experiments/RevealSequence";
import PriceAnchoring from "./experiments/PriceAnchoring";
import EndowmentWidget from "./experiments/EndowmentWidget";
import CommitmentLadder from "./experiments/CommitmentLadder";
import VisualSalience from "./experiments/VisualSalience";
import MomentumChecklist from "./experiments/MomentumChecklist";
import FrictionLab from "./experiments/FrictionLab";

import type { ComponentType } from "react";

const PROTOTYPES: Record<string, ComponentType> = {
  VariableReward,
  ProgressionLadder,
  UnlockableContent,
  CollectionKit,
  StreakTracker,
  AchievementToasts,
  CuriosityLoop,
  RevealSequence,
  PriceAnchoring,
  EndowmentWidget,
  CommitmentLadder,
  VisualSalience,
  MomentumChecklist,
  FrictionLab,
};

const PRINCIPLES = Object.keys(PRINCIPLE_LABELS) as LabPrinciple[];

export default function LabGallery() {
  const flag = useMemo(() => readLabFlag(), []);
  const [feedOpen, setFeedOpen] = useState(flag.debug);
  const [tick, setTick] = useState(0);
  const [showSpec, setShowSpec] = useState(false);

  // Re-render the live event feed whenever a lab event lands.
  useEffect(() => subscribeLab(() => setTick((t) => t + 1)), []);
  useEffect(() => {
    setLabDebug(flag.debug);
  }, [flag.debug]);

  const snapshot = getLabSnapshot();
  const events = getStoredEvents().slice(-14).reverse();
  void tick;

  if (!flag.enabled) {
    return (
      <div id="main" className="min-h-screen bg-ink px-4 py-16 text-center">
        <h1 id="page-heading" tabIndex={-1} className="font-display text-4xl uppercase text-white">Conversion Lab is off</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">
          The lab was disabled via <code className="rounded bg-white/10 px-1.5 py-0.5 text-acid">?lab=off</code>,{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-acid">lab.disabled=1</code>, or the build flag.
          The production funnel is unaffected.
        </p>
        <button
          type="button"
          onClick={() => {
            reviveLab();
            window.location.reload();
          }}
          className="cta mt-6 rounded-full bg-acid px-6 py-3 text-sm font-black uppercase tracking-widest text-ink"
        >
          Re-enable the lab →
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink pb-24 text-white">
      {/* header */}
      <header className="border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-acid sm:text-[11px]">
            RadioReach · Conversion Lab · behavioral prototype suite
          </p>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[1.02] sm:text-6xl">
            The experiment shelf
          </h1>
          <p className="mt-3 max-w-2xl font-serif text-[15px] leading-relaxed text-white/65 sm:text-lg">
            19 falsifiable experiments across game-design loops, reinforcement schedules, and consumer
            psychology — each with a mechanism, a hypothesis, a metric, a guardrail, and a working prototype.
            Switch variants, watch the event feed, read the spec.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] text-white/55">
              visitor {snapshot.visitorId.slice(0, 8)}…
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] text-white/55">
              {Object.keys(snapshot.assignments).length} assignments
            </span>
            <button
              type="button"
              onClick={() => setShowSpec((s) => !s)}
              className={`pressable rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                showSpec ? "bg-acid text-ink" : "border border-white/15 bg-white/5 text-white/60"
              }`}
            >
              {showSpec ? "Hide hypothesis cards" : "Show hypothesis cards"}
            </button>
            <button
              type="button"
              onClick={() => setFeedOpen((o) => !o)}
              className={`pressable rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                feedOpen ? "bg-acid text-ink" : "border border-white/15 bg-white/5 text-white/60"
              }`}
            >
              {feedOpen ? "Hide event feed" : "Live event feed"}
            </button>
          </div>

          {/* principle index */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {PRINCIPLES.map((p) => (
              <a
                key={p}
                href={`#lab-${p}`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50 transition hover:border-acid/50 hover:text-acid"
              >
                {PRINCIPLE_LABELS[p]}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* experiment cards */}
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {EXPERIMENTS.map((exp) => {
            const Proto = PROTOTYPES[exp.prototype];
            return (
              <section key={exp.id} id={`lab-${exp.principles[0]}`}>
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-acid px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-ink">
                    {STAGE_LABELS[exp.stage]}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                      exp.risk === "low"
                        ? "bg-green-500/15 text-green-400"
                        : exp.risk === "medium"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-blood/20 text-blood"
                    }`}
                  >
                    risk: {exp.risk}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/45">
                    {exp.variants.length} variants
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-white/35">{exp.principles[0]}</span>
                </div>

                {showSpec && <SpecCard exp={exp} />}

                <div className={showSpec ? "mt-3" : ""}>
                  <Proto />
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* live event feed */}
      {feedOpen && (
        <aside
          aria-label="Lab event feed"
          className="fixed bottom-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/15 bg-black/95 shadow-[0_24px_80px_rgba(0,0,0,0.7)] backdrop-blur"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-acid">
              Event feed <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-acid" />
            </p>
            <button
              type="button"
              onClick={() => setFeedOpen(false)}
              className="pressable grid h-6 w-6 place-items-center rounded-full bg-white/10 text-xs text-white/60 hover:text-white"
              aria-label="Close event feed"
            >
              ✕
            </button>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto p-2 font-mono text-[10px]">
            {events.length === 0 ? (
              <p className="px-1 py-2 text-white/30">Interact with a prototype — events land here.</p>
            ) : (
              events.map((e, i) => (
                <p key={`${e.at}-${i}`} className="flex items-baseline gap-1.5 px-1">
                  <span className="shrink-0 text-white/30">{new Date(e.at).toISOString().slice(11, 19)}</span>
                  <span className="shrink-0 text-acid/80">{e.experiment.slice(4)}</span>
                  <span className="shrink-0 text-white/50">{e.type}</span>
                  <span className="truncate text-white/80">{e.variant}</span>
                </p>
              ))
            )}
          </div>
        </aside>
      )}

      <footer className="mx-auto max-w-6xl px-4 pt-4 text-[11px] leading-relaxed text-white/30">
        Prototypes run in this gallery only — nothing here mounts on the production funnel unless an
        experiment is deliberately wired in (see <code className="text-white/50">src/lab/README.md</code>).
        Lab rule: presentation, framing, sequence, and reward structure may vary — price, product facts,
        and offer terms never do.
      </footer>
    </div>
  );
}

function SpecCard({ exp }: { exp: (typeof EXPERIMENTS)[number] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-[12px] leading-relaxed">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">Mechanism</p>
          <p className="mt-1 text-white/70">{exp.mechanism}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">Hypothesis</p>
          <p className="mt-1 font-bold text-white/90">{exp.hypothesis}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">Prediction</p>
          <p className="mt-1 text-acid/90">{exp.prediction}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
            Metric / guardrail
          </p>
          <p className="mt-1 text-white/70">
            <b className="text-white">M:</b> {exp.primaryMetric}
          </p>
          <p className="text-white/50">
            <b className="text-white/60">G:</b> {exp.guardrail}
          </p>
        </div>
      </div>
      <p className="mt-2 border-t border-white/10 pt-2 text-[11px] text-white/40">
        <b className="text-white/60">Ship as:</b> {exp.dropIn} · expected {exp.expectedLift}
      </p>
    </div>
  );
}
