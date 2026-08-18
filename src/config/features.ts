declare global {
  interface Window {
    /** Runtime kill switches. Set before the app bundle executes. */
    __RADIOREACH_FLAGS__?: {
      momentumOwnershipSequence?: boolean;
      vaultOfferUpgrade?: boolean;
    };
  }
}

const buildAllowsMomentumSequence =
  import.meta.env.VITE_MOMENTUM_SEQUENCE_ENABLED !== "false";

const buildAllowsVaultOfferUpgrade =
  import.meta.env.VITE_VAULT_OFFER_UPGRADE_ENABLED !== "false";

/**
 * The build flag is the hard switch. The runtime flag is the fast kill switch.
 * Both default to enabled so the live experience does not depend on a request.
 */
export function isMomentumSequenceEnabled() {
  if (!buildAllowsMomentumSequence) return false;
  if (typeof window === "undefined") return buildAllowsMomentumSequence;
  return window.__RADIOREACH_FLAGS__?.momentumOwnershipSequence !== false;
}

/**
 * Gates the upgraded main-offer block (vivid dream outcome, concrete proof
 * points, effort-reduction microcopy, and the beat-the-form guarantee).
 * Defaults to enabled; flip off with
 * `VITE_VAULT_OFFER_UPGRADE_ENABLED=false` at build time or
 * `__RADIOREACH_FLAGS__.vaultOfferUpgrade = false` at runtime.
 */
export function isVaultOfferUpgradeEnabled() {
  if (!buildAllowsVaultOfferUpgrade) return false;
  if (typeof window === "undefined") return buildAllowsVaultOfferUpgrade;
  return window.__RADIOREACH_FLAGS__?.vaultOfferUpgrade !== false;
}
