import { useEffect, useRef, useState } from "react";
import { DecisionCluster, EmotiveText, FocusCopy } from "../esp";
import { trackCustom } from "../lib/metaPixel";
import {
  getMomentumStepCount,
  loadMomentumState,
  markMomentumViewed,
  MOMENTUM_TOTAL_STEPS,
  MOMENTUM_VARIANT,
  resetMomentumState,
  saveMomentumAnswers,
  TARGET_LABELS,
  TARGET_STARTING_MOVES,
  type MomentumAnswers,
} from "../lib/momentumSequence";

type Option = {
  value: string;
  label: string;
  acknowledgment: string;
};

type SequenceStep = {
  key: keyof MomentumAnswers;
  eyebrow: string;
  question: string;
  support: string;
  options: Option[];
};

const STEPS: SequenceStep[] = [
  {
    key: "target",
    eyebrow: "Set your target",
    question: "I’m mainly targeting…",
    support: "Pick the lane you want to move first. You can use the full Vault for everything else later.",
    options: [
      {
        value: "college",
        label: "College radio",
        acknowledgment:
          "Got it — most artists chasing college radio lose hours inside department pages instead of reaching the people programming the shows.",
      },
      {
        value: "specialty",
        label: "Specialty shows",
        acknowledgment:
          "Got it — specialty radio runs on fit. The right host matters more than another hundred generic inboxes.",
      },
      {
        value: "local",
        label: "Local stations",
        acknowledgment:
          "Smart — local is your warmest angle. Your name, shows, and story already mean something there.",
      },
      {
        value: "multiple",
        label: "Multiple markets",
        acknowledgment:
          "Good — you’re building a campaign, not buying a lottery ticket. Work it market by market and stack proof as you go.",
      },
    ],
  },
  {
    key: "frustration",
    eyebrow: "Cut the dead weight",
    question: "My biggest frustration right now is…",
    support: "Call out the part that keeps killing your momentum.",
    options: [
      {
        value: "no_replies",
        label: "No replies",
        acknowledgment:
          "Understood — silence usually means the pitch hit the wrong inbox before it ever had a chance to be heard.",
      },
      {
        value: "wrong_contact",
        label: "I don’t know who to contact",
        acknowledgment:
          "Exactly. A station name is not access. A role, a real person, and a direct contact give you somewhere to start.",
      },
      {
        value: "generic_forms",
        label: "Generic submission forms",
        acknowledgment:
          "Right — a form makes your release look like everybody else’s. Direct, relevant outreach gives it a human on the other end.",
      },
      {
        value: "other",
        label: "All the wasted time",
        acknowledgment:
          "Fair. The research spiral steals time from the release itself. Your contact plan should remove work, not create more of it.",
      },
    ],
  },
  {
    key: "doneWith",
    eyebrow: "Draw the line",
    question: "I’m done with…",
    support: "One last call. What are you not carrying into the next release?",
    options: [
      {
        value: "forms",
        label: "Generic submission forms",
        acknowledgment:
          "Good. Your music deserves a direct introduction, not a faceless upload box and six weeks of silence.",
      },
      {
        value: "guessing",
        label: "Guessing who to email",
        acknowledgment:
          "Done. Your next campaign starts with named roles and organized contacts — not another info@ coin toss.",
      },
      {
        value: "waiting",
        label: "Waiting for luck",
        acknowledgment:
          "That’s the shift. Airplay is never guaranteed, but targeted action beats waiting to be discovered every time.",
      },
      {
        value: "all_of_it",
        label: "All of it",
        acknowledgment:
          "Good. No more forms, guessing, or waiting. Your release needs a contact plan you can actually move on tonight.",
      },
    ],
  },
];

const PROGRESS_LANGUAGE = [
  "Preparing your access",
  "Shaping your contact plan",
  "Organizing your starting move",
];

function firstIncompleteStep(answers: MomentumAnswers) {
  const index = STEPS.findIndex((step) => !answers[step.key]);
  return index === -1 ? MOMENTUM_TOTAL_STEPS - 1 : index;
}

export default function MomentumSequence({ onCta }: { onCta: () => void }) {
  const initial = useRef(loadMomentumState()).current;
  const initialCount = getMomentumStepCount(initial.answers);
  const [answers, setAnswers] = useState<MomentumAnswers>(initial.answers);
  const [stepIndex, setStepIndex] = useState(() => firstIncompleteStep(initial.answers));
  const [complete, setComplete] = useState(initialCount === MOMENTUM_TOTAL_STEPS);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [acknowledgment, setAcknowledgment] = useState("");
  const sectionRef = useRef<HTMLElement>(null);
  const advanceTimer = useRef<number | null>(null);
  const viewedThisMount = useRef(false);
  const startedThisMount = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const recordView = () => {
      if (viewedThisMount.current) return;
      viewedThisMount.current = true;
      const state = markMomentumViewed();
      trackCustom("MomentumSequenceViewed", {
        sequence_variant: MOMENTUM_VARIANT,
        sequence_status:
          getMomentumStepCount(state.answers) === MOMENTUM_TOTAL_STEPS
            ? "completed"
            : "viewed",
        returning: getMomentumStepCount(state.answers) > 0,
      });
    };

    if (!("IntersectionObserver" in window)) {
      recordView();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          recordView();
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    },
    []
  );

  const step = STEPS[stepIndex];
  const answeredCount = getMomentumStepCount(answers);
  const visibleProgress = complete
    ? MOMENTUM_TOTAL_STEPS
    : Math.min(
        MOMENTUM_TOTAL_STEPS,
        Math.max(stepIndex + 1, answeredCount + (selectedValue ? 1 : 0))
      );

  function selectOption(option: Option) {
    if (selectedValue) return;

    if (!startedThisMount.current) {
      startedThisMount.current = true;
      trackCustom("MomentumSequenceStarted", {
        sequence_variant: MOMENTUM_VARIANT,
        resumed_at_step: stepIndex + 1,
        returning: initialCount > 0,
      });
    }

    const nextAnswers = {
      ...answers,
      [step.key]: option.value,
    } as MomentumAnswers;
    const isFinal = stepIndex === MOMENTUM_TOTAL_STEPS - 1;

    setAnswers(nextAnswers);
    setSelectedValue(option.value);
    setAcknowledgment(option.acknowledgment);
    saveMomentumAnswers(nextAnswers);

    trackCustom("MomentumSequenceStepCompleted", {
      sequence_variant: MOMENTUM_VARIANT,
      step_number: stepIndex + 1,
      question: step.key,
      answer: option.value,
    });

    if (isFinal) {
      trackCustom("MomentumSequenceFinished", {
        sequence_variant: MOMENTUM_VARIANT,
        sequence_status: "completed",
        sequence_steps: MOMENTUM_TOTAL_STEPS,
        sequence_target: nextAnswers.target,
        sequence_frustration: nextAnswers.frustration,
        sequence_done_with: nextAnswers.doneWith,
      });
    }

    advanceTimer.current = window.setTimeout(() => {
      setSelectedValue(null);
      setAcknowledgment("");
      if (isFinal) {
        setComplete(true);
      } else {
        setStepIndex((current) => current + 1);
      }
    }, 1450);
  }

  function startOver() {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    resetMomentumState();
    markMomentumViewed();
    const clean: MomentumAnswers = {};
    setAnswers(clean);
    setStepIndex(0);
    setComplete(false);
    setSelectedValue(null);
    setAcknowledgment("");
    startedThisMount.current = false;
    trackCustom("MomentumSequenceReset", { sequence_variant: MOMENTUM_VARIANT });
  }

  function finishUnlocking() {
    trackCustom("MomentumSequenceCtaClicked", {
      sequence_variant: MOMENTUM_VARIANT,
      sequence_status: "completed",
      sequence_target: answers.target,
      sequence_frustration: answers.frustration,
      sequence_done_with: answers.doneWith,
      value: 20,
      currency: "USD",
    });
    onCta();
  }

  return (
    <section
      ref={sectionRef}
      id="your-access"
      aria-labelledby="momentum-title"
      className="relative isolate overflow-hidden border-y border-white/10 bg-[#0b0b0e]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background-image:radial-gradient(circle_at_50%_0%,rgba(255,230,0,0.11),transparent_38%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:auto,42px_42px,42px_42px]"
      />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-18">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-acid sm:text-[11px] sm:tracking-[0.28em]">
            Build your starting plan
          </p>
          <h2
            id="momentum-title"
            className="mt-3 font-display text-[1.7rem] leading-[1.08] sm:text-5xl sm:leading-[0.98]"
          >
            STOP SEARCHING BLIND.<br />
            <span className="text-white/55">SET YOUR FIRST MOVE.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-serif text-[0.98rem] leading-[1.6] text-white/65 sm:mt-4 sm:text-lg sm:leading-relaxed">
            Three quick calls. No email. No fluff. We’ll turn what you tell us into a clean place to start.
          </p>
        </div>

        <div className="relative mx-auto mt-6 max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-panel shadow-[0_28px_90px_rgba(0,0,0,0.45),0_0_70px_rgba(255,230,0,0.04)] sm:mt-8 sm:rounded-[24px]">
          <div className="border-b border-white/10 bg-black/25 px-4 py-3.5 sm:px-7 sm:py-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-acid sm:text-[11px]">
                {complete
                  ? "Your access is ready to unlock"
                  : `Step ${stepIndex + 1} of ${MOMENTUM_TOTAL_STEPS} — ${PROGRESS_LANGUAGE[stepIndex]}`}
              </p>
              <span className="tnum shrink-0 font-mono text-[11px] text-white/35">
                {Math.round((visibleProgress / MOMENTUM_TOTAL_STEPS) * 100)}%
              </span>
            </div>
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label="Access preparation progress"
              aria-valuemin={0}
              aria-valuemax={MOMENTUM_TOTAL_STEPS}
              aria-valuenow={visibleProgress}
            >
              <div
                className="h-full rounded-full bg-acid shadow-[0_0_16px_rgba(255,230,0,0.45)] transition-[width] duration-500 ease-out"
                style={{ width: `${(visibleProgress / MOMENTUM_TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          <div className="px-4 py-5 sm:min-h-[480px] sm:px-7 sm:py-7">
            {complete ? (
              <div className="fade-up flex flex-col justify-center sm:min-h-[430px]" key="complete">
                <div className="grid h-12 w-12 place-items-center rounded-full border border-acid/40 bg-acid/10 text-xl text-acid">
                  ✓
                </div>
                <p className="mt-5 text-[11px] font-black uppercase tracking-[0.25em] text-acid">
                  Your answers are locked in
                </p>
                <h3 className="mt-2 font-display text-[1.65rem] leading-tight sm:text-4xl">
                  YOUR {answers.target ? TARGET_LABELS[answers.target].toUpperCase() : "RADIO"} PLAN IS SET.
                </h3>
                <p className="mt-4 font-serif text-base leading-relaxed text-white/70 sm:text-lg">
                  {answers.target
                    ? TARGET_STARTING_MOVES[answers.target]
                    : "Start with the contacts closest to your market and sound."}
                </p>
                <div className="mt-5 rounded-xl border border-white/10 bg-black/35 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    What’s already handled
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-white/70 sm:grid-cols-3">
                    <span className="flex items-center gap-2"><b className="text-acid">✓</b> Your target</span>
                    <span className="flex items-center gap-2"><b className="text-acid">✓</b> Your bottleneck</span>
                    <span className="flex items-center gap-2"><b className="text-acid">✓</b> Your first move</span>
                  </div>
                </div>
                <p className="mt-5 text-[15px] leading-relaxed text-white/60">
                  The Vault is already organized by station, location, role, phone, and email. The only step left is unlocking <b className="text-white">your contacts</b>.
                </p>
                <DecisionCluster id="momentum" eager className="mt-5">
                  <button
                    type="button"
                    onClick={finishUnlocking}
                    className="cta w-full rounded-xl bg-acid px-4 py-4 font-display text-[1.1rem] uppercase leading-tight tracking-wide text-ink sm:px-5 sm:text-2xl"
                  >
                    Finish Unlocking My Contacts — $20 →
                    <FocusCopy
                      className="mt-1 block font-sans text-[10px] font-bold normal-case tracking-normal opacity-65 sm:text-[11px]"
                      idle="One-time payment · instant access · 30-day guarantee"
                      live={<EmotiveText slot="momentumFocusHint" />}
                    />
                  </button>
                </DecisionCluster>
                <button
                  type="button"
                  onClick={startOver}
                  className="mx-auto mt-4 text-[11px] text-white/30 underline underline-offset-4 transition hover:text-white/55"
                >
                  Change my answers
                </button>
              </div>
            ) : (
              <div className="fade-up" key={step.key}>
                <p className="text-[11px] font-black uppercase tracking-[0.23em] text-blood">
                  {step.eyebrow}
                </p>
                <h3 className="mt-2 font-display text-[1.4rem] leading-tight sm:text-3xl">
                  {step.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{step.support}</p>

                <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {step.options.map((option) => {
                    const isSelected = selectedValue === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={selectedValue !== null}
                        aria-pressed={isSelected}
                        onClick={() => selectOption(option)}
                        className={`pressable group flex min-h-[58px] items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] font-bold sm:text-[15px] ${
                          isSelected
                            ? "border-acid bg-acid text-ink shadow-[0_0_24px_rgba(255,230,0,0.12)]"
                            : selectedValue
                              ? "border-white/5 bg-white/[0.02] text-white/30"
                              : "border-white/12 bg-white/[0.035] text-white/80 hover:border-acid/55 hover:bg-acid/[0.06] hover:text-white"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] ${
                            isSelected
                              ? "border-ink bg-ink text-acid"
                              : "border-white/20 text-transparent group-hover:border-acid/50"
                          }`}
                        >
                          ✓
                        </span>
                        <span className="flex-1">{option.label}</span>
                        <span aria-hidden className={isSelected ? "text-ink/55" : "text-white/20"}>→</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 min-h-[72px] sm:mt-5 sm:min-h-[96px]" aria-live="polite" aria-atomic="true">
                  {acknowledgment ? (
                    <div className="fade-in rounded-xl border border-acid/30 bg-acid/[0.07] p-4">
                      <p className="flex gap-3 text-sm leading-relaxed text-white/78">
                        <span className="font-black text-acid">GOT IT.</span>
                        <span>{acknowledgment}</span>
                      </p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-acid/55">
                        Saved — organizing your access around that…
                      </p>
                    </div>
                  ) : (
                    <div className="flex min-h-[80px] items-center justify-center rounded-xl border border-dashed border-white/10 px-4 text-center text-[11px] leading-relaxed text-white/30">
                      One tap. No email. Your answers stay saved on this device.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mx-auto mt-5 max-w-xl text-center text-[11px] leading-relaxed text-white/30">
          Your choices are used to personalize this experience and measure whether this sequence helps artists take action. No personal information is collected here.
        </p>
      </div>
    </section>
  );
}
