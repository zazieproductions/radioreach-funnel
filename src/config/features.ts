declare global {
  interface Window {
    /** Runtime kill switches. Set before the app bundle executes. */
    __RADIOREACH_FLAGS__?: {
      momentumOwnershipSequence?: boolean;
      decisionFocus?: boolean;
    };
  }
}

const buildAllowsMomentumSequence =
  import.meta.env.VITE_MOMENTUM_SEQUENCE_ENABLED !== "false";

/**
 * The build flag is the hard switch. The runtime flag is the fast kill switch.
 * Both default to enabled so the live experience does not depend on a request.
 */
export function isMomentumSequenceEnabled() {
  if (!buildAllowsMomentumSequence) return false;
  if (typeof window === "undefined") return buildAllowsMomentumSequence;
  return window.__RADIOREACH_FLAGS__?.momentumOwnershipSequence !== false;
}

const buildAllowsDecisionFocus =
  import.meta.env.VITE_DECISION_FOCUS_ENABLED !== "false";

/**
 * Soft spotlight around the buy CTA at the moment of choice.
 * Build flag is the hard switch; runtime flag is the fast kill.
 */
export function isDecisionFocusEnabled() {
  if (!buildAllowsDecisionFocus) return false;
  if (typeof window === "undefined") return buildAllowsDecisionFocus;
  return window.__RADIOREACH_FLAGS__?.decisionFocus !== false;
}
