/* ─────────────────────────────────────────────────────────────
   STAGE 3 — THE QUALIFICATION RITUAL
   ─────────────────────────────────────────────────────────────
   Four phases: quiz → lead capture → fake analysis → verdict.

   The quiz asks the visitor to describe their own failure six
   times in a row. By the verdict screen the argument for buying
   has been written by the buyer, in the first person, which is
   the only kind of argument that doesn't trigger counter-
   argument. The score is real arithmetic. It gates nothing.
───────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react";
import { LEAD, QUIZ, QUIZ_INTRO } from "../copy";
import {
  PHASE_PROGRESS,
  maxScore,
  quizProgressPct,
  scoreQuiz,
  verdictFor,
} from "../core";
import { nav } from "../router";
import { useFunnel } from "../state";
import {
  AnalysisTerminal,
  ProgressRail,
  ScarcityRail,
  SocialToasts,
} from "../widgets";
import { Xray } from "../xray";

type Phase = "quiz" | "lead" | "analysing" | "result";

export default function Qualify() {
  const { seed, answers, patch, teardown, verdict } = useFunnel();
  const [phase, setPhase] = useState<Phase>("quiz");
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const total = QUIZ.length;
  const score = useMemo(() => scoreQuiz(QUIZ, answers), [answers]);

  // quiz: step/(total+1) · lead + analysis: a hard-set 85% ·
  // verdict: a hard-set 100%. None of the three measures anything.
  const pct =
    phase === "quiz"
      ? quizProgressPct(step, total)
      : phase === "result"
        ? PHASE_PROGRESS.result
        : PHASE_PROGRESS.lead;

  const choose = (qid: string, oid: string) => {
    const next = { ...answers, [qid]: oid };
    patch({ answers: next });
    // a beat of delay so the selection registers as "recorded"
    window.setTimeout(() => {
      if (step + 1 >= total) setPhase("lead");
      else setStep((s) => s + 1);
    }, 240);
  };

  const submitLead = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!firstName.trim() || !/.+@.+\..+/.test(email)) return;
    patch({ lead: { firstName: firstName.trim(), email: email.trim() } });
    setPhase("analysing");
  };

  const finishAnalysis = () => {
    patch({ verdict: verdictFor(score, QUIZ) });
    setPhase("result");
  };

  const q = QUIZ[Math.min(step, total - 1)];

  return (
    <div className="min-h-screen bg-ink pb-20">
      <ScarcityRail />

      <div className="mx-auto max-w-2xl px-4 pt-8">
        <div className="mb-7">
          <ProgressRail
            pct={pct}
            step={phase === "quiz" ? step : total}
            total={total}
            phase={phase === "quiz" ? "quiz" : phase === "result" ? "result" : "lead"}
          />
        </div>

        {/* ── PHASE 1 — the quiz ──────────────────────────── */}
        {phase === "quiz" && (
          <Xray id="qualification-ritual">
            <section>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                {QUIZ_INTRO.title}
              </p>
              <h1 className="mt-2 font-display text-2xl uppercase leading-tight text-white sm:text-4xl">
                {q.prompt}
              </h1>
              <p className="mt-2 text-[12px] text-white/45">{q.subtext}</p>

              <div className="mt-6 space-y-2.5">
                {q.options.map((o) => {
                  const selected = answers[q.id] === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => choose(q.id, o.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left transition ${
                        selected
                          ? "border-acid bg-acid/10"
                          : "border-white/12 bg-panel hover:border-white/30 hover:bg-white/[0.06]"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                          selected ? "border-acid bg-acid" : "border-white/25"
                        }`}
                      >
                        {selected && (
                          <span className="h-2 w-2 rounded-full bg-ink" />
                        )}
                      </span>
                      <span className="flex-1 text-[15px] text-white/85">
                        {o.label}
                      </span>
                      {teardown && (
                        <span className="font-mono text-[10px] text-xray">
                          w={o.weight}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <Xray id="weighted-intimidation" className="mt-5">
                <p className="flex gap-2 rounded border border-blood/25 bg-blood/[0.07] p-3 text-[12px] leading-relaxed text-white/60">
                  <span aria-hidden className="text-blood">⚠</span>
                  {QUIZ_INTRO.warning}
                </p>
              </Xray>

              {teardown && (
                <p className="mt-3 font-mono text-[11px] leading-relaxed text-xray">
                  grep the source: no consistency check exists, no answer
                  vector fails, and the running score ({score.toFixed(2)} /{" "}
                  {maxScore(QUIZ).toFixed(2)}) only chooses which compliment the
                  verdict screen pays you.
                </p>
              )}

              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="mt-5 text-[11px] lowercase text-white/30 underline underline-offset-2 hover:text-white/50"
                >
                  back
                </button>
              )}
            </section>
          </Xray>
        )}

        {/* ── PHASE 2 — lead capture at a hard-set 85% ────── */}
        {phase === "lead" && (
          <Xray id="lead-capture">
            <section>
              <h1 className="font-display text-2xl uppercase leading-tight text-white sm:text-4xl">
                {LEAD.title}
              </h1>
              <p className="mt-2 text-[14px] text-white/60">{LEAD.sub}</p>

              <form onSubmit={submitLead} className="mt-6 space-y-3">
                <div>
                  <label
                    htmlFor="df-name"
                    className="text-[11px] uppercase tracking-wider text-white/45"
                  >
                    First name
                  </label>
                  <input
                    id="df-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="off"
                    className="mt-1 w-full rounded-lg border border-white/12 bg-black/40 px-4 py-3.5 text-[15px] text-white placeholder:text-white/25 focus:border-acid/60 focus:outline-none"
                    placeholder="What the file should be addressed to"
                  />
                </div>
                <div>
                  <label
                    htmlFor="df-email"
                    className="text-[11px] uppercase tracking-wider text-white/45"
                  >
                    Release address
                  </label>
                  <input
                    id="df-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                    className="mt-1 w-full rounded-lg border border-white/12 bg-black/40 px-4 py-3.5 text-[15px] text-white placeholder:text-white/25 focus:border-acid/60 focus:outline-none"
                    placeholder="you@example.com"
                  />
                  <p className="mt-1.5 font-mono text-[10px] text-white/30">
                    Nothing is sent anywhere. This form has no action, no
                    endpoint, and no network code behind it.
                  </p>
                </div>

                {touched && (!firstName.trim() || !/.+@.+\..+/.test(email)) && (
                  <p className="text-[12px] text-blood">
                    Both fields are required to release the file.
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-acid px-6 py-4 text-base font-black uppercase tracking-wide text-ink transition hover:brightness-95"
                >
                  {LEAD.cta}
                </button>
                <p className="text-center text-[11px] text-white/40">
                  {LEAD.micro}
                </p>
              </form>
            </section>
          </Xray>
        )}

        {/* ── PHASE 3 — manufactured labour ───────────────── */}
        {phase === "analysing" && (
          <section>
            <h1 className="font-display text-2xl uppercase leading-tight text-white sm:text-3xl">
              Scoring your file
            </h1>
            <p className="mt-2 text-[13px] text-white/50">
              Do not close this window. Allocation is held while the screen
              runs.
            </p>
            <div className="mt-5">
              <AnalysisTerminal
                profile={{
                  firstName: firstName || "subject",
                  score,
                  tier: verdictFor(score, QUIZ).tier,
                }}
                seed={seed}
                onDone={finishAnalysis}
              />
            </div>
            {teardown && (
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-xray">
                The verdict object was constructed before the first line
                printed. Total runtime ≈ 5.4s of animation over 0ms of work.
              </p>
            )}
          </section>
        )}

        {/* ── PHASE 4 — the verdict (there is no other kind) ─ */}
        {phase === "result" && verdict && (
          <Xray id="no-fail-branch">
            <section className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-emerald-400/50 bg-emerald-400/10">
                <span className="text-2xl text-emerald-400">✓</span>
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-400">
                {verdict.headline}
              </p>
              <h1 className="mt-2 font-display text-3xl uppercase leading-[0.95] text-white sm:text-5xl">
                {firstName ? `${firstName}, you’re in.` : "You’re in."}
              </h1>

              <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2">
                {[
                  { k: "Composite", v: verdict.score.toFixed(2) },
                  { k: "Tier", v: verdict.tier },
                  { k: "Percentile", v: `${verdict.percentile}th` },
                ].map((c) => (
                  <div
                    key={c.k}
                    className="rounded-lg border border-white/10 bg-panel p-3"
                  >
                    <p className="tnum font-display text-xl uppercase leading-none text-acid">
                      {c.v}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-white/40">
                      {c.k}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/70">
                {verdict.reason}
              </p>

              {teardown && (
                <p className="mx-auto mt-4 max-w-xl rounded border border-dashed border-xray/60 p-2 font-mono text-[11px] leading-relaxed text-xray">
                  every one of the 4⁶ = 4,096 answer combinations reaches this
                  screen. `approved` is typed as the literal `true` — the type
                  system cannot express a rejection.
                </p>
              )}

              <button
                type="button"
                onClick={() => nav("/checkout")}
                className="mt-7 w-full rounded-lg bg-acid px-8 py-4 text-base font-black uppercase tracking-wide text-ink transition hover:brightness-95 sm:w-auto"
              >
                Release my allocation →
              </button>
              <p className="mt-2 text-[11px] text-white/40">
                Held for 09:00 · demo checkout · no card required
              </p>
            </section>
          </Xray>
        )}
      </div>

      <SocialToasts />
    </div>
  );
}
