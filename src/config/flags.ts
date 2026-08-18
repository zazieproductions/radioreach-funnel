/* ─────────────────────────────────────────────────────────────
   FLAG REGISTRY — one global object, one place to kill things
   ─────────────────────────────────────────────────────────────
   Every runtime kill switch on the funnel hangs off a single
   global set before the app bundle executes (see index.html):

     window.__RADIOREACH_FLAGS__ = {
       momentumOwnershipSequence: true,
       offer: { offerV2: true, bonusStack: true },
     };

   This module owns the type and the safe reader. Feature modules
   (features.ts, offer.ts) layer their own resolution rules on top
   — build env, URL params, localStorage, A/B buckets — but they
   all read the runtime object through here so there is exactly
   one `declare global` for it in the codebase.
───────────────────────────────────────────────────────────── */

/** Individually flaggable pieces of the v2 offer block. */
export const OFFER_FLAG_KEYS = [
  /** Master switch for the whole v2 offer experience. */
  "offerV2",
  /** "What Monday morning looks like" dream-outcome block. */
  "dreamOutcome",
  /** Verified-data proof strip that raises perceived likelihood. */
  "proofStack",
  /** Payment → first pitch timeline that collapses time delay + effort. */
  "speedStack",
  /** Expiring bonus stack attached to the founder timer. */
  "bonusStack",
  /** Upgraded, specific risk reversal. */
  "guaranteeV2",
  /** Upgraded hero + final CTA copy and reassurance chips. */
  "ctaV2",
] as const;

export type OfferFlagKey = (typeof OFFER_FLAG_KEYS)[number];

export type RadioReachFlags = {
  /** Existing momentum/ownership question sequence. */
  momentumOwnershipSequence?: boolean;
  /** v2 offer block switches. `false` on a key disables that piece only. */
  offer?: Partial<Record<OfferFlagKey, boolean>>;
};

declare global {
  interface Window {
    /** Runtime kill switches. Set before the app bundle executes. */
    __RADIOREACH_FLAGS__?: RadioReachFlags;
  }
}

/** Never throws, never assumes a browser. */
export function readRuntimeFlags(): RadioReachFlags {
  if (typeof window === "undefined") return {};
  return window.__RADIOREACH_FLAGS__ ?? {};
}

/** localStorage read that survives private mode / disabled storage. */
export function readStoredFlag(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** localStorage write that survives private mode / disabled storage. */
export function writeStoredFlag(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore — the caller always has a usable fallback */
  }
}

/** Current URL search params, or an empty set when unavailable. */
export function readSearchParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
}

/** Loose truthy/falsy parsing for URL + storage values. */
export function parseFlagValue(raw: string | null | undefined): boolean | null {
  if (raw == null) return null;
  const v = raw.trim().toLowerCase();
  if (["1", "on", "true", "yes", "v2"].includes(v)) return true;
  if (["0", "off", "false", "no", "v1"].includes(v)) return false;
  return null;
}
