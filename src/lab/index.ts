/* ─────────────────────────────────────────────────────────────
   CONVERSION LAB — public surface
   ─────────────────────────────────────────────────────────────
   The production funnel imports from here when an experiment is
   deliberately wired in. Everything stays inert unless a
   component mounts or a log call fires — same zero-cost contract
   as the ESP.

   Typical wiring when shipping an experiment:

     import { useLabVariant } from "./lab";
     const [variant] = useLabVariant("lab_anchoring", ["control", "treatment"]);
     if (variant === "treatment") return <Treatment />;
     return <Control />;

   Attribution: `getLabAttribution()` returns the visitor's full
   assignment map as low-cardinality strings — attach it to
   checkout analytics and Stripe metadata exactly like
   `getMomentumAttribution()`.
───────────────────────────────────────────────────────────── */

export { readLabFlag, killLab, reviveLab } from "./flag";
export {
  labLog,
  labLogAction,
  labLogMilestone,
  labLogConversion,
  getStoredEvents,
  getLabSnapshot,
  getLabAttribution,
  registerExperiment,
  subscribeLab,
} from "./log";
export {
  getVisitorId,
  fnv1a,
  assignVariant,
  goalGradientEase,
  spinReward,
  XP_RANKS,
  rankForXp,
  nextRank,
  updateStreak,
  collectionStats,
  perDayFrame,
  anchorStack,
} from "./core";
export type {
  LabExperiment,
  LabPrinciple,
  FunnelStage,
  LabEvent,
  LabFlag,
  LabSnapshot,
} from "./types";
export { EXPERIMENTS, EXPERIMENT_BY_ID, PRINCIPLE_LABELS, STAGE_LABELS } from "./catalog";
export { LabFrame, LabCta, useLabVariant, useLabEventCount } from "./experiments/shared";
