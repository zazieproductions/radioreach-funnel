declare global {
  interface Window {
    /** Runtime kill switches. Set before the app bundle executes. */
    __RADIOREACH_FLAGS__?: {
      momentumOwnershipSequence?: boolean;
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
