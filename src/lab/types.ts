/* ─────────────────────────────────────────────────────────────
   CONVERSION LAB — shared types
   ─────────────────────────────────────────────────────────────
   The Lab is a parallel system to the ESP: instead of adapting
   copy tone, it hosts *conversion experiments* — flag-gated
   prototypes built from game-design loops, reinforcement-learning
   schedules, and consumer-psychology effects. Every experiment is
   a card in `catalog.ts` with a mechanism, a falsifiable
   hypothesis, a primary metric, and a guardrail.
───────────────────────────────────────────────────────────── */

/** The 19 psychological principles the lab plays with. */
export type LabPrinciple =
  | "variable_reward"
  | "progression"
  | "unlockable"
  | "achievement"
  | "collection"
  | "streak"
  | "goal_gradient"
  | "curiosity"
  | "anticipation"
  | "choice_architecture"
  | "friction"
  | "momentum"
  | "narrative"
  | "salience"
  | "timing"
  | "personalization"
  | "commitment"
  | "endowment"
  | "anchoring";

/** Where in the funnel the experiment bites. */
export type FunnelStage =
  | "attention" // first 3 seconds, hero, above the fold
  | "engage" // scroll, proof, sections below the fold
  | "configure" // checkout, add-ons, cart composition
  | "pay" // the payment moment itself
  | "post_purchase"; // delivery, activation, retention

/** A single experiment card — the behavioral-economics spec sheet. */
export type LabExperiment = {
  /** Stable id; used for deterministic visitor bucketing. */
  id: string;
  title: string;
  /** One-line promise the variant makes to the visitor. */
  pitch: string;
  principles: LabPrinciple[];
  stage: FunnelStage;
  /** The psychological mechanism, in plain language. */
  mechanism: string;
  /** Falsifiable: If we change X, then Y, because Z. */
  hypothesis: string;
  /** What we expect to see if the mechanism holds. */
  prediction: string;
  /** The number that decides ship/kill. */
  primaryMetric: string;
  /** The number that must not move (ethics + business safety). */
  guardrail: string;
  /** Variant names; first is always control. */
  variants: string[];
  /** Which working prototype demonstrates it (key of PROTOTYPES). */
  prototype: string;
  /** Suggested mount point in the production funnel, when shipped. */
  dropIn: string;
  /** risk of confusing/annoying visitors: low | medium | high */
  risk: "low" | "medium" | "high";
  /** expected effect size on the primary metric, for power planning */
  expectedLift: string;
};

/** Parsed feature-flag state for the whole lab. */
export type LabFlag = {
  enabled: boolean;
  debug: boolean;
  /** Forced variant per experiment, e.g. ?lab=lab_anchoring:treatment */
  overrides: Record<string, string>;
};

/** Event log entry shape (sessionStorage ring, like esp.log). */
export type LabEvent = {
  at: number;
  experiment: string;
  variant: string;
  type:
    | "assignment"
    | "exposure"
    | "action"
    | "milestone"
    | "conversion"
    | "variant_switch"
    | "lab_off";
  data?: Record<string, unknown>;
};

/** Snapshot attached to every conversion event for later correlation. */
export type LabSnapshot = {
  visitorId: string;
  assignments: Record<string, string>;
};
