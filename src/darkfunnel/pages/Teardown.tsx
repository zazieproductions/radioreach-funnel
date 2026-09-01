/* ─────────────────────────────────────────────────────────────
   THE TEARDOWN — the research surface (#/teardown)
   ─────────────────────────────────────────────────────────────
   Everything the replica does, indexed: the pattern catalogue
   with mechanism / cost / legal exposure, the headline formula
   broken into its two moving parts, and the progress-bar
   arithmetic printed as a table so the fiction is arithmetic
   rather than an accusation.
───────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react";
import {
  PATTERNS,
  RISK_COLOR,
  RISK_LABEL,
  type Pattern,
  type PatternRisk,
} from "../annotations";
import {
  HEADLINES,
  PHASE_PROGRESS,
  honestProgressPct,
  maxScore,
  quizProgressPct,
  verdictFor,
} from "../core";
import { QUIZ } from "../copy";
import { nav } from "../router";
import { inspectPattern } from "../xray";

const QUIZ_TOTAL_FOR_DOCS = QUIZ.length;

const STAGES: Array<{ id: Pattern["stage"] | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "hook", label: "1 · Hook" },
  { id: "reveal", label: "2 · Reveal" },
  { id: "qualify", label: "3 · Qualify" },
  { id: "checkout", label: "4 · Checkout" },
  { id: "oto", label: "5 · Upsell" },
  { id: "downsell", label: "6 · Downsell" },
  { id: "ambient", label: "Ambient" },
];

export default function Teardown() {
  const [stage, setStage] = useState<Pattern["stage"] | "all">("all");
  const [risk, setRisk] = useState<PatternRisk | "all">("all");

  const shown = useMemo(
    () =>
      PATTERNS.filter(
        (p) =>
          (stage === "all" || p.stage === stage) &&
          (risk === "all" || p.risk === risk),
      ),
    [stage, risk],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of PATTERNS) c[p.risk] = (c[p.risk] ?? 0) + 1;
    return c;
  }, []);

  const rows = useMemo(() => {
    const total = QUIZ_TOTAL_FOR_DOCS;
    return Array.from({ length: total + 1 }, (_, step) => ({
      step,
      shown: quizProgressPct(step, total),
      honest: honestProgressPct(step, total),
    }));
  }, []);

  return (
    <div className="min-h-screen bg-ink pb-24">
      <header className="border-b border-white/10 bg-panel">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-xray">
            Research artifact · never deployed
          </p>
          <h1 className="mt-2 font-display text-[2.2rem] uppercase leading-[0.92] text-white sm:text-5xl">
            Anatomy of a tripwire funnel
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65">
            {PATTERNS.length} named techniques across seven screens. The
            replica in this build runs every one of them for real — real
            defaults, real timers, real copy — so they can be measured instead
            of described. Nothing is for sale and no payment path exists.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {(Object.keys(RISK_LABEL) as PatternRisk[]).map((r) => (
              <span
                key={r}
                className="rounded-sm px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-ink"
                style={{ background: RISK_COLOR[r] }}
              >
                {counts[r] ?? 0} {RISK_LABEL[r]}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => nav("/hook")}
            className="mt-6 rounded-lg bg-acid px-5 py-3 text-[13px] font-black uppercase tracking-wide text-ink transition hover:brightness-95"
          >
            ← Walk the funnel
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4">
        {/* ── filters ─────────────────────────────────────── */}
        <div
          className="sticky z-20 -mx-4 mb-6 border-b border-white/10 bg-ink/95 px-4 py-3 backdrop-blur"
          style={{ top: "var(--df-bar-h, 0px)" }}
        >
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStage(s.id)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                  stage === s.id
                    ? "bg-acid text-ink"
                    : "border border-white/12 text-white/55 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["all", ...Object.keys(RISK_LABEL)] as Array<PatternRisk | "all">).map(
              (r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRisk(r)}
                  className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wide transition ${
                    risk === r
                      ? "bg-white text-ink"
                      : "border border-white/12 text-white/45 hover:text-white"
                  }`}
                >
                  {r === "all" ? "any exposure" : RISK_LABEL[r as PatternRisk]}
                </button>
              ),
            )}
          </div>
        </div>

        {/* ── pattern cards ───────────────────────────────── */}
        <ul className="grid gap-3">
          {shown.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-white/10 bg-panel p-5"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="font-display text-xl uppercase leading-none text-white">
                  {p.label}
                </h2>
                <span
                  className="rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-ink"
                  style={{ background: RISK_COLOR[p.risk] }}
                >
                  {RISK_LABEL[p.risk]}
                </span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-white/30">
                  {p.stage}
                </span>
              </div>

              <p className="mt-1 font-mono text-[11px] text-acid">{p.principle}</p>
              <p className="mt-3 text-[14px] leading-relaxed text-white/70">
                {p.mechanism}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/50">
                <span className="font-bold uppercase tracking-wide text-white/70">
                  Extracts:{" "}
                </span>
                {p.cost}
              </p>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-white/35">
                {p.citation}
              </p>
              <button
                type="button"
                onClick={() => inspectPattern(p.id)}
                className="mt-3 text-[11px] font-bold uppercase tracking-wide text-xray underline underline-offset-2"
              >
                Open inspector
              </button>
            </li>
          ))}
        </ul>

        {/* ── headline formula ────────────────────────────── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl uppercase text-white sm:text-3xl">
            The headline formula
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/60">
            <span className="font-bold text-acid">
              outrage premise + withheld outcome.
            </span>{" "}
            The premise supplies moral arousal so the reader has a stake before
            they have a subject. The second clause names a consequence and then
            refuses to state it — the gap is manufactured by the refusal, not
            by the topic. Swap either half and the click rate moves; remove
            either half and the headline stops working.
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-white/[0.04] font-mono text-[10px] uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-3 py-2">Outrage premise</th>
                  <th className="px-3 py-2">Withheld outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {HEADLINES.map((h) => (
                  <tr key={h.premise} className="align-top">
                    <td className="px-3 py-2.5 text-white/80">{h.premise}</td>
                    <td className="px-3 py-2.5 text-white/55">{h.withheld}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── progress arithmetic ─────────────────────────── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl uppercase text-white sm:text-3xl">
            Progress-bar arithmetic
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/60">
            The quiz bar is <code className="text-acid">step / (total + 1) × 100</code>.
            The inflated denominator guarantees the bar cannot reach 100% while
            questions remain — the visitor is held permanently in the
            goal-gradient zone, where effort per unit of remaining progress is
            highest. Lead capture then hard-sets{" "}
            <span className="text-acid">{PHASE_PROGRESS.lead}%</span> and the
            verdict screen{" "}
            <span className="text-acid">{PHASE_PROGRESS.result}%</span>, neither
            derived from anything.
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-white/[0.04] font-mono text-[10px] uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-3 py-2">Step</th>
                  <th className="px-3 py-2">Bar shows</th>
                  <th className="px-3 py-2">Honest</th>
                  <th className="px-3 py-2">Distortion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 font-mono">
                {rows.map((r) => (
                  <tr key={r.step}>
                    <td className="px-3 py-1.5 text-white/60">
                      {r.step} / {QUIZ_TOTAL_FOR_DOCS}
                    </td>
                    <td className="px-3 py-1.5 text-acid">
                      {r.shown.toFixed(1)}%
                    </td>
                    <td className="px-3 py-1.5 text-white/60">
                      {r.honest.toFixed(1)}%
                    </td>
                    <td className="px-3 py-1.5 text-blood">
                      −{(r.honest - r.shown).toFixed(1)}pt
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── the gate that isn't ─────────────────────────── */}
        <section className="mt-12">
          <h2 className="font-display text-2xl uppercase text-white sm:text-3xl">
            The gate that isn’t
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/60">
            Six questions, four options each — {4 ** QUIZ.length} possible
            answer vectors, scored honestly out of{" "}
            {maxScore(QUIZ).toFixed(2)}. The minimum-scoring vector and the
            maximum-scoring vector both return{" "}
            <span className="text-acid">approved</span>; the score only selects
            which flattery is printed.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Worst possible answers", score: minScoreOf() },
              { label: "Best possible answers", score: maxScore(QUIZ) },
            ].map((c) => {
              const v = verdictFor(c.score, QUIZ);
              return (
                <div
                  key={c.label}
                  className="rounded-xl border border-white/10 bg-panel p-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                    {c.label} · {c.score.toFixed(2)}
                  </p>
                  <p className="mt-1.5 font-display text-lg uppercase text-emerald-400">
                    {v.headline}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">
                    {v.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function minScoreOf(): number {
  return (
    Math.round(
      QUIZ.reduce(
        (sum, q) => sum + Math.min(...q.options.map((o) => o.weight)),
        0,
      ) * 100,
    ) / 100
  );
}
