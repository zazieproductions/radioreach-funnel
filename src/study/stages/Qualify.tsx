/* ─────────────────────────────────────────────────────────────
   STAGE 3 — QUALIFY
   ─────────────────────────────────────────────────────────────
   Three phases in one screen: the weighted quiz, the lead gate,
   and the fake analysis terminal.

   THE PROGRESS BAR IS THE LESSON HERE.

     quiz phase   →  step / (total + 1) * 100
                     A phantom fifth step exists purely so the
                     bar can never reach 100% while questions
                     remain. It always looks nearly-done.
     lead phase   →  hard-set to 85%
                     The email is now "the last 15%", not a cost.
     result phase →  hard-set to 100%

   It is a completion hypnotic, not a progress indicator.

   THE SCORE IS REAL ARITHMETIC AND MEANINGLESS GATING.
   Weights are summed honestly and the total is displayed. But
   `APPROVAL_THRESHOLD` is below the minimum achievable score, so
   every path approves. Grep this file: there is no fail branch.
───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from "react";
import { Annotated } from "../Annotate";
import { Countdown, ProgressBar, ScarcityRail } from "../chrome";
import {
  pace,
  recordAnswer,
  recordLead,
  recordSelfPrediction,
  trip,
  useStudy,
} from "../state";

type Choice = { label: string; weight: number; reads: string };
type Question = { id: string; kicker: string; prompt: string; choices: Choice[] };

const QUESTIONS: Question[] = [
  {
    id: "stuck",
    kicker: "Question 1 of 4 · Timeline",
    prompt: "How long have you been trying to get played?",
    choices: [
      { label: "Under 6 months", weight: 9, reads: "Early — low pain, high optimism. Sell possibility." },
      { label: "About a year", weight: 14, reads: "Doubt has started. Sell the missing piece." },
      { label: "Two to three years", weight: 21, reads: "Identity is now tied to the struggle. Sell vindication." },
      { label: "Years. I've stopped counting.", weight: 28, reads: "Maximum desperation. Highest willingness to pay. Sell relief." },
    ],
  },
  {
    id: "money",
    kicker: "Question 2 of 4 · Resources",
    prompt: "What have you already spent trying to solve this?",
    choices: [
      { label: "Nothing yet — I'm careful", weight: 10, reads: "Price-sensitive. Anchor hard, discount visibly." },
      { label: "A few hundred, mostly on platforms", weight: 18, reads: "Already a buyer. Sunk cost is available to leverage." },
      { label: "Over a thousand, with nothing to show", weight: 25, reads: "Money trauma. Frame this as the thing the others weren't." },
      { label: "I'd rather not add it up", weight: 27, reads: "Shame response. Avoid itemising; lead with dignity." },
    ],
  },
  {
    id: "worldview",
    kicker: "Question 3 of 4 · Read on the industry",
    prompt: "Why do you think the right people haven't heard you yet?",
    choices: [
      { label: "The system is rigged for people with budgets", weight: 24, reads: "Conspiratorial frame. Convertible: position as the leak in the system." },
      { label: "I haven't been strategic enough", weight: 22, reads: "High agency. Convertible: position as the missing method." },
      { label: "Bad luck and bad timing", weight: 15, reads: "External locus. Needs a stronger causal story." },
      { label: "Honestly, I'm not sure", weight: 12, reads: "Undecided. Supply the frame — they'll adopt it." },
    ],
  },
  {
    id: "commitment",
    kicker: "Question 4 of 4 · Commitment",
    prompt: "If a door opened tonight, would you walk through it?",
    choices: [
      { label: "Yes. Immediately.", weight: 26, reads: "Self-prediction locked. Any later decline now contradicts their own words." },
      { label: "Yes, if it's genuinely different", weight: 20, reads: "Conditional yes — the condition is trivially satisfiable by copy." },
      { label: "I'd want to think about it", weight: 13, reads: "Deliberator. Apply time scarcity." },
      { label: "Probably not tonight", weight: 11, reads: "Still approved. There is no fail state." },
    ],
  },
];

/* The threshold is 40. The minimum achievable total is 9+10+12+11 = 42.
   Nobody can score below it. This constant exists so the UI can print
   a number, not so anyone can fail. */
const APPROVAL_THRESHOLD = 40;
const MIN_POSSIBLE = QUESTIONS.reduce(
  (n, q) => n + Math.min(...q.choices.map((c) => c.weight)),
  0
);
const MAX_POSSIBLE = QUESTIONS.reduce(
  (n, q) => n + Math.max(...q.choices.map((c) => c.weight)),
  0
);

const TERMINAL_LINES = [
  "establishing session…",
  "handshake ok · node us-east-2",
  "loading airplay index (18,412 rows)…",
  "cross-referencing 18,412 verified station records",
  "matching submitted profile against market clusters…",
  "weighting response: timeline={t}",
  "weighting response: spend={s}",
  "weighting response: locus={w}",
  "commitment vector: {c}",
  "computing saturation for your primary market…",
  "saturation: 71% · openings detected: 6",
  "cohort slot: RESERVED",
];

export default function Qualify({ onCheckout }: { onCheckout: () => void }) {
  const s = useStudy();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"quiz" | "lead" | "analysis" | "result">("quiz");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [printed, setPrinted] = useState(0);

  useEffect(() => {
    trip(
      "qualification_ritual",
      "You were asked to prove you deserved to be allowed to pay. The seller became the gatekeeper and you became the applicant."
    );
  }, []);

  /* ── the progress fiction ── */
  const pct =
    phase === "quiz"
      ? (step / (QUESTIONS.length + 1)) * 100 // +1 phantom step: never 100 mid-quiz
      : phase === "lead"
        ? 85 // hard-set — the email becomes "the last 15%"
        : phase === "analysis"
          ? 92
          : 100;

  useEffect(() => {
    if (phase === "lead") {
      trip(
        "progress_fiction",
        "The progress bar jumped to a hard-coded 85% the moment you were asked for an email. It was not measuring anything."
      );
    }
  }, [phase]);

  const answer = (q: Question, c: Choice) => {
    recordAnswer({ question: q.prompt, choice: c.label, weight: c.weight, reads: c.reads });
    if (q.id === "commitment") recordSelfPrediction(c.label);
    if (step + 1 >= QUESTIONS.length) {
      trip(
        "weighted_scoring_theater",
        `Your answers were summed into a real score out of ${MAX_POSSIBLE}. The pass mark of ${APPROVAL_THRESHOLD} is below the lowest score anyone can get (${MIN_POSSIBLE}). No branch in the code rejects anybody.`
      );
      setPhase("lead");
    } else {
      setStep((n) => n + 1);
    }
  };

  const submitLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr("First name is required to attach your result.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr("Enter a valid email.");
    setErr("");
    recordLead(name, email);
    setPhase("analysis");
  };

  /* ── the labor illusion ── */
  const lines = useMemo(() => {
    const get = (id: string) =>
      s.quiz.find((a) => QUESTIONS.find((q) => q.id === id)?.prompt === a.question)?.weight ??
      0;
    const commitment =
      s.selfPrediction?.toUpperCase().replace(/[.]/g, "") ?? "UNSET";
    return TERMINAL_LINES.map((l) =>
      l
        .replace("{t}", String(get("stuck")))
        .replace("{s}", String(get("money")))
        .replace("{w}", String(get("worldview")))
        .replace("{c}", commitment)
    );
  }, [s.quiz, s.selfPrediction]);

  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (phase !== "analysis") return;
    trip(
      "fake_analysis_terminal",
      "A console printed twelve lines of 'analysis' on timers. No computation ran — the same lines print for everyone."
    );
    if (printed >= lines.length) {
      timerRef.current = window.setTimeout(() => setPhase("result"), pace(900));
      return () => window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(
      () => setPrinted((n) => n + 1),
      pace(printed === 0 ? 380 : 240 + Math.random() * 320)
    );
    return () => window.clearTimeout(timerRef.current);
  }, [phase, printed, lines.length]);

  const q = QUESTIONS[step];

  return (
    <div className="min-h-screen bg-ink pb-24">
      <div className="flex flex-wrap items-center justify-center gap-3 border-b border-white/10 bg-black/50 px-4 py-2.5">
        <Countdown />
        <ScarcityRail />
      </div>

      <div className="mx-auto max-w-xl px-4 py-8">
        <ProgressBar
          pct={pct}
          caption={
            phase === "quiz"
              ? "Assessment in progress"
              : phase === "lead"
                ? "Almost there"
                : phase === "analysis"
                  ? "Analysing"
                  : "Complete"
          }
        />

        {/* ══ QUIZ ══ */}
        {phase === "quiz" && (
          <div className="mt-8">
            <Annotated pattern="weighted_scoring_theater">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-acid">
                {q.kicker}
              </p>
              <p className="mt-1 text-[11px] text-white/35">
                Answers are weighted. Inaccurate answers waste the assessment and
                your window.
              </p>
            </Annotated>

            <h1
              className={`mt-4 font-display text-[1.7rem] leading-[1.08] sm:text-4xl ${
                q.id === "commitment" ? "text-acid" : ""
              }`}
            >
              {q.prompt}
            </h1>

            <div className="mt-6 space-y-2.5">
              {q.choices.map((c) => (
                <button
                  key={c.label}
                  onClick={() => answer(q, c)}
                  className="cta w-full rounded-lg border border-white/12 bg-panel px-4 py-4 text-left text-[15px] font-semibold text-white/85 transition hover:border-acid/60 hover:bg-acid/5"
                >
                  {c.label}
                </button>
              ))}
            </div>

            {q.id === "commitment" && (
              <Annotated pattern="self_prediction" className="mt-5">
                <p className="rounded-lg border border-blood/30 bg-blood/5 p-3 text-[12px] leading-relaxed text-white/60">
                  Answer honestly. Your response is recorded against your session
                  and referenced at the point of access.
                </p>
              </Annotated>
            )}
          </div>
        )}

        {/* ══ LEAD GATE ══ */}
        {phase === "lead" && (
          <Annotated pattern="lead_gate_before_price" className="mt-8">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-acid">
              Assessment scored
            </p>
            <h1 className="mt-3 font-display text-[1.7rem] leading-[1.08] sm:text-4xl">
              WHERE SHOULD THE RESULT BE SENT?
            </h1>
            <p className="mt-3 font-serif text-[15px] leading-relaxed text-white/70">
              Your score is attached to an email address so the cohort slot can be
              held against it. The result screen is generated once.
            </p>

            <form onSubmit={submitLead} className="mt-6 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
                className="w-full rounded-lg border border-white/12 bg-panel px-4 py-3.5 text-white placeholder:text-white/25"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                type="email"
                autoComplete="email"
                className="w-full rounded-lg border border-white/12 bg-panel px-4 py-3.5 text-white placeholder:text-white/25"
              />
              {err && <p className="text-[12px] font-bold text-blood">{err}</p>}
              <button
                type="submit"
                className="cta w-full rounded-lg bg-acid px-5 py-4 font-display text-lg uppercase tracking-wide text-ink"
              >
                Release my result
              </button>
              <p className="text-center text-[10px] leading-relaxed text-white/25">
                Nothing is stored or sent. This is a simulation — the field exists
                to demonstrate the gate, not to collect anything.
              </p>
            </form>
          </Annotated>
        )}

        {/* ══ FAKE ANALYSIS TERMINAL ══ */}
        {phase === "analysis" && (
          <Annotated pattern="fake_analysis_terminal" className="mt-8">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0f0b]">
              <div className="flex items-center gap-2 border-b border-white/10 bg-[#111411] px-4 py-2.5">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 font-mono text-[11px] tracking-wide text-white/35">
                  eligibility_engine.sh
                </span>
              </div>
              <div className="min-h-[15rem] space-y-1 p-4 font-mono text-[11.5px] leading-relaxed text-green-400/85 sm:text-[12.5px]">
                {lines.slice(0, printed).map((l, i) => (
                  <p key={i}>
                    <span className="text-white/25">$ </span>
                    {l}
                  </p>
                ))}
                {printed < lines.length && (
                  <p className="animate-pulse text-white/40">▌</p>
                )}
              </div>
            </div>
          </Annotated>
        )}

        {/* ══ RESULT — always approved ══ */}
        {phase === "result" && (
          <div className="mt-8">
            <Annotated pattern="qualification_ritual">
              <div className="rounded-xl border-2 border-acid/50 bg-panel p-5 sm:p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-acid">
                  Assessment complete
                </p>
                <h1 className="mt-3 font-display text-[1.9rem] leading-[1.04] sm:text-5xl">
                  {s.lead?.name ? `${s.lead.name.toUpperCase()}, ` : ""}
                  YOU CLEARED IT.
                </h1>

                <div className="mt-5 flex items-end justify-between border-y border-white/10 py-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">
                      Your score
                    </p>
                    <p className="font-display text-4xl text-acid">
                      {s.score}
                      <span className="text-xl text-white/30">/{MAX_POSSIBLE}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">
                      Threshold
                    </p>
                    <p className="font-display text-4xl text-white/40">
                      {APPROVAL_THRESHOLD}
                    </p>
                  </div>
                </div>

                <p className="mt-4 font-serif text-[15px] leading-relaxed text-white/75">
                  Your profile places you in the band the list was assembled for.
                  A cohort slot is held against your session for the remainder of
                  the window.
                </p>

                {s.selfPrediction && (
                  <Annotated pattern="self_prediction" className="mt-4">
                    <p className="rounded-lg border border-acid/30 bg-acid/5 p-3 text-[13px] leading-relaxed text-white/80">
                      You said: <b className="text-acid">“{s.selfPrediction}”</b> —
                      the door is open.
                    </p>
                  </Annotated>
                )}

                <button
                  onClick={onCheckout}
                  className="cta mt-6 w-full rounded-lg bg-acid px-5 py-4 font-display text-lg uppercase leading-tight tracking-wide text-ink sm:text-xl"
                >
                  Claim my cohort slot — $29
                </button>
              </div>
            </Annotated>

            {/* the psychographic read-back: what the quiz actually harvested */}
            <details className="mt-5 rounded-lg border border-white/10 bg-black/30 p-4">
              <summary className="cursor-pointer text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                What those four questions actually told the seller
              </summary>
              <ul className="mt-3 space-y-3">
                {s.quiz.map((a) => (
                  <li key={a.question} className="text-[13px] leading-relaxed">
                    <p className="text-white/45">{a.question}</p>
                    <p className="mt-0.5 font-semibold text-white/85">
                      “{a.choice}” <span className="text-acid">· +{a.weight}</span>
                    </p>
                    <p className="mt-0.5 text-white/55">{a.reads}</p>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
