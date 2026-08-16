import { isMomentumSequenceEnabled } from "../config/features";

export const MOMENTUM_STORAGE_KEY = "radioreach:momentum-ownership:v1";
export const MOMENTUM_VARIANT = "momentum_v1";
export const MOMENTUM_TOTAL_STEPS = 3;

type Target = "college" | "specialty" | "local" | "multiple";
type Frustration = "no_replies" | "wrong_contact" | "generic_forms" | "other";
type DoneWith = "forms" | "guessing" | "waiting" | "all_of_it";

export type MomentumAnswers = {
  target?: Target;
  frustration?: Frustration;
  doneWith?: DoneWith;
};

export type MomentumState = {
  version: 1;
  variant: typeof MOMENTUM_VARIANT;
  answers: MomentumAnswers;
  viewedAt?: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
};

export type MomentumAttribution = {
  sequence_variant: string;
  sequence_status: "disabled" | "not_seen" | "viewed" | "started" | "completed";
  sequence_steps: string;
  sequence_target: string;
  sequence_frustration: string;
  sequence_done_with: string;
};

export const TARGET_LABELS: Record<Target, string> = {
  college: "College radio",
  specialty: "Specialty shows",
  local: "Local stations",
  multiple: "Multiple markets",
};

export const TARGET_STARTING_MOVES: Record<Target, string> = {
  college: "Filter for college stations, then lead with the music director or the host whose show fits your sound.",
  specialty: "Start with specialty hosts whose programming already matches your genre. Fit beats volume.",
  local: "Filter to your city first and lead with the local angle. That is your warmest opening.",
  multiple: "Work one market at a time. Build proof locally, then carry it into the next city.",
};

const TARGETS = new Set<Target>(["college", "specialty", "local", "multiple"]);
const FRUSTRATIONS = new Set<Frustration>([
  "no_replies",
  "wrong_contact",
  "generic_forms",
  "other",
]);
const DONE_WITH = new Set<DoneWith>(["forms", "guessing", "waiting", "all_of_it"]);

function now() {
  return new Date().toISOString();
}

function emptyState(): MomentumState {
  return {
    version: 1,
    variant: MOMENTUM_VARIANT,
    answers: {},
    updatedAt: now(),
  };
}

function validAnswers(value: unknown): MomentumAnswers {
  if (!value || typeof value !== "object") return {};
  const input = value as Record<string, unknown>;
  return {
    ...(TARGETS.has(input.target as Target) ? { target: input.target as Target } : {}),
    ...(FRUSTRATIONS.has(input.frustration as Frustration)
      ? { frustration: input.frustration as Frustration }
      : {}),
    ...(DONE_WITH.has(input.doneWith as DoneWith)
      ? { doneWith: input.doneWith as DoneWith }
      : {}),
  };
}

export function getMomentumStepCount(answers: MomentumAnswers) {
  return [answers.target, answers.frustration, answers.doneWith].filter(Boolean).length;
}

export function loadMomentumState(): MomentumState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(MOMENTUM_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<MomentumState>;
    const answers = validAnswers(parsed.answers);
    return {
      version: 1,
      variant: MOMENTUM_VARIANT,
      answers,
      ...(typeof parsed.viewedAt === "string" ? { viewedAt: parsed.viewedAt } : {}),
      ...(typeof parsed.startedAt === "string" ? { startedAt: parsed.startedAt } : {}),
      ...(typeof parsed.completedAt === "string" ? { completedAt: parsed.completedAt } : {}),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : now(),
    };
  } catch {
    return emptyState();
  }
}

export function saveMomentumState(state: MomentumState) {
  try {
    window.localStorage.setItem(MOMENTUM_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is best-effort in private browsing or locked-down contexts.
  }
}

export function markMomentumViewed() {
  const current = loadMomentumState();
  if (current.viewedAt) return current;
  const next = { ...current, viewedAt: now(), updatedAt: now() };
  saveMomentumState(next);
  return next;
}

export function saveMomentumAnswers(answers: MomentumAnswers) {
  const current = loadMomentumState();
  const count = getMomentumStepCount(answers);
  const timestamp = now();
  const next: MomentumState = {
    ...current,
    answers,
    startedAt: current.startedAt || timestamp,
    ...(count === MOMENTUM_TOTAL_STEPS
      ? { completedAt: current.completedAt || timestamp }
      : {}),
    updatedAt: timestamp,
  };
  saveMomentumState(next);
  return next;
}

export function resetMomentumState() {
  try {
    window.localStorage.removeItem(MOMENTUM_STORAGE_KEY);
  } catch {
    // Best effort only.
  }
}

/** Stable, low-cardinality fields suitable for analytics and Stripe metadata. */
export function getMomentumAttribution(): MomentumAttribution {
  if (!isMomentumSequenceEnabled()) {
    return {
      sequence_variant: "control",
      sequence_status: "disabled",
      sequence_steps: "0",
      sequence_target: "",
      sequence_frustration: "",
      sequence_done_with: "",
    };
  }

  const state = loadMomentumState();
  const steps = getMomentumStepCount(state.answers);
  const status =
    steps === MOMENTUM_TOTAL_STEPS
      ? "completed"
      : steps > 0
        ? "started"
        : state.viewedAt
          ? "viewed"
          : "not_seen";

  return {
    sequence_variant: MOMENTUM_VARIANT,
    sequence_status: status,
    sequence_steps: String(steps),
    sequence_target: state.answers.target || "",
    sequence_frustration: state.answers.frustration || "",
    sequence_done_with: state.answers.doneWith || "",
  };
}
