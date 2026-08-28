/**
 * Deterministic 50/50 funnel variant bucketing.
 *
 * Purpose: every visitor gets a stable, client-assigned variant stamped into
 * analytics events and Stripe metadata so future A/B tests have a clean,
 * pre-randomized split — even before any test actually changes the experience.
 * v1 assigns variants but the funnel renders the same experience for both;
 * this is the "A/A warm-up" that proves the split is balanced before it
 * carries a treatment.
 *
 * Rules:
 * - The visitor id is generated once and persisted in localStorage
 *   (sessionStorage fallback) so the variant is stable across sessions.
 * - Assignment is a plain hash of the id — no flicker, no server round-trip,
 *   no dependence on auth or cookies.
 * - The variant only ever changes *presentation* in future tests. It must
 *   never be used to change price, product facts, or offer terms.
 */

const VISITOR_ID_KEY = "rr_visitor_id_v1";

function hashString(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function randomId() {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {
    // fall through to Math.random below
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing =
      localStorage.getItem(VISITOR_ID_KEY) ||
      sessionStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;

    const id = randomId();
    try {
      localStorage.setItem(VISITOR_ID_KEY, id);
    } catch {
      try {
        sessionStorage.setItem(VISITOR_ID_KEY, id);
      } catch {
        // storage unavailable — id stays per-page-load only
      }
    }
    return id;
  } catch {
    return randomId();
  }
}

export type FunnelVariant = "base" | "test";

export function getFunnelVariant(): FunnelVariant {
  if (typeof window === "undefined") return "base";
  return hashString(getVisitorId()) % 2 === 0 ? "base" : "test";
}

/**
 * Params to spread into every analytics event and the checkout session
 * payload so variants can be segmented in Meta, dataLayer, Stripe, and KV.
 */
export function funnelVariantParams(): {
  visitor_id: string;
  funnel_variant: FunnelVariant;
} {
  return {
    visitor_id: getVisitorId(),
    funnel_variant: getFunnelVariant(),
  };
}
