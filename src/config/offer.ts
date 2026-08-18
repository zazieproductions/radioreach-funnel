/* ─────────────────────────────────────────────────────────────
   OFFER v2 — feature flags + sticky 50/50 A/B assignment
   ─────────────────────────────────────────────────────────────
   The rebuilt main offer (dream outcome, proof stack, speed
   stack, bonus stack, guarantee, CTA) ships as a measurable
   experiment against the current offer, not as a silent
   overwrite.

   Resolution order for the master switch (first match wins):

     1. Build env    VITE_OFFER_V2=off|on|ab   (per deploy)
     2. URL param    ?offer=v2 | v1 | off      (per visit, QA)
     3. Runtime      window.__RADIOREACH_FLAGS__.offer.offerV2
                                               (instant kill switch)
     4. localStorage rr.offer.variant          (sticky bucket)
     5. Coin flip    50/50, then persisted     (the experiment)

   Sub-flags (dreamOutcome, proofStack, speedStack, bonusStack,
   guaranteeV2, ctaV2) each default ON when the master switch is
   on, and can be individually disabled at runtime or with
   ?offer.bonusStack=off — so any single block can be pulled
   without reverting the rest.

   Kill everything, instantly, from the console:
     window.__RADIOREACH_FLAGS__.offer = { offerV2: false }
   …or persistently for this browser:
     localStorage.setItem("rr.offer.variant", "control")
───────────────────────────────────────────────────────────── */

import {
  OFFER_FLAG_KEYS,
  parseFlagValue,
  readRuntimeFlags,
  readSearchParams,
  readStoredFlag,
  writeStoredFlag,
  type OfferFlagKey,
} from "./flags";

export type OfferVariant = "control" | "v2";

const VARIANT_KEY = "rr.offer.variant";
const URL_PARAM = "offer";
const SUB_FLAG_PREFIX = "offer.";

/** Per-deploy hard switch: "off" forces control, "on" forces v2, else A/B. */
const BUILD_MODE = (import.meta.env.VITE_OFFER_V2 ?? "ab").toString().trim().toLowerCase();

function coinFlip(): OfferVariant {
  // crypto when available — Math.random is a perfectly fine fallback for a
  // 50/50 marketing split and never blocks rendering.
  try {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const buf = new Uint8Array(1);
      crypto.getRandomValues(buf);
      return buf[0] % 2 === 0 ? "control" : "v2";
    }
  } catch {
    /* fall through */
  }
  return Math.random() < 0.5 ? "control" : "v2";
}

let resolved: OfferVariant | null = null;

/**
 * Clears the in-process variant cache.
 *
 * Only for tests: production resolves the variant once per page load on
 * purpose, so the offer can never change under a visitor mid-scroll.
 */
export function __resetOfferVariantCacheForTests(): void {
  resolved = null;
}

/**
 * The visitor's assigned variant. Sticky for the browser so a reload,
 * a checkout bounce, or a return visit never flips the offer mid-funnel.
 */
export function getOfferVariant(): OfferVariant {
  if (resolved) return resolved;
  if (typeof window === "undefined") return "control";

  // 1. Build env wins — lets a deploy force one arm without touching code.
  if (BUILD_MODE === "off" || BUILD_MODE === "false" || BUILD_MODE === "v1") {
    resolved = "control";
    return resolved;
  }
  if (BUILD_MODE === "on" || BUILD_MODE === "true" || BUILD_MODE === "v2") {
    resolved = "v2";
    return resolved;
  }

  // 2. URL param — QA + stakeholder previews, also persists so the whole
  //    session stays on the arm you're reviewing.
  const param = readSearchParams().get(URL_PARAM)?.trim().toLowerCase() ?? "";
  if (param === "v2" || param === "on") {
    resolved = "v2";
    writeStoredFlag(VARIANT_KEY, resolved);
    return resolved;
  }
  if (param === "v1" || param === "off" || param === "control") {
    resolved = "control";
    writeStoredFlag(VARIANT_KEY, resolved);
    return resolved;
  }

  // 3. Runtime kill switch — flip offerV2:false to send everyone to control.
  if (readRuntimeFlags().offer?.offerV2 === false) {
    resolved = "control";
    return resolved;
  }

  // 4. Sticky bucket from a previous visit.
  const saved = readStoredFlag(VARIANT_KEY);
  if (saved === "control" || saved === "v2") {
    resolved = saved;
    return resolved;
  }

  // 5. Fresh 50/50 assignment.
  resolved = coinFlip();
  writeStoredFlag(VARIANT_KEY, resolved);
  return resolved;
}

/** True when this visitor is in the v2 arm and v2 hasn't been killed. */
export function isOfferV2(): boolean {
  return getOfferVariant() === "v2";
}

/**
 * Individual block switch. Every sub-flag requires the master switch, then
 * honours (in order) `?offer.<key>=off`, the runtime flags object, and
 * finally defaults to on.
 */
export function isOfferFlagEnabled(key: OfferFlagKey): boolean {
  if (key !== "offerV2" && !isOfferV2()) return false;
  if (key === "offerV2") return isOfferV2();

  const fromUrl = parseFlagValue(readSearchParams().get(`${SUB_FLAG_PREFIX}${key}`));
  if (fromUrl !== null) return fromUrl;

  const fromRuntime = readRuntimeFlags().offer?.[key];
  if (typeof fromRuntime === "boolean") return fromRuntime;

  return true;
}

/** Snapshot of every flag — used for analytics attribution and the QA panel. */
export function getOfferFlagSnapshot(): Record<OfferFlagKey, boolean> {
  return OFFER_FLAG_KEYS.reduce((acc, key) => {
    acc[key] = isOfferFlagEnabled(key);
    return acc;
  }, {} as Record<OfferFlagKey, boolean>);
}

/** Attribution params attached to CTA/checkout events for the A/B readout. */
export function getOfferAttribution(): Record<string, string> {
  return {
    offer_variant: getOfferVariant(),
    offer_build_mode: BUILD_MODE,
  };
}

export { OFFER_FLAG_KEYS, type OfferFlagKey };
