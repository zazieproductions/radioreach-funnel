import type { ProductKey } from "../config/storefront";
import type { MomentumAttribution } from "./momentumSequence";
import { getMetaClickIds, getTrafficContext } from "./traffic";

export type MetaAttribution = {
  fbc: string;
  fbp: string;
  fbclid: string;
  platform: string;
};

export type CheckoutSelection = {
  items: ProductKey[];
  bundleId: string;
  utm: Record<string, string>;
  momentum: MomentumAttribution;
  meta?: MetaAttribution;
};

export type CreateSessionResponse =
  | { clientSecret: string; checkoutSessionId: string }
  | { error: string };

export async function createEmbeddedCheckoutSession(payload: CheckoutSelection) {
  const res = await fetch("/api/checkout/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as CreateSessionResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Unable to start checkout");
  }
  return data;
}

export type VerifiedOrderSummary = {
  amountTotal: number | null; // in cents (Stripe convention)
  currency: string;
  email: string | null;
  productKeys: string[];
  productNames: string[];
  momentum?: Record<string, string> | null;
};

export async function verifySession(sessionId: string) {
  const res = await fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Unable to verify order");
  return data as { verified: boolean; token?: string; order?: VerifiedOrderSummary | null };
}

export async function createDownloadLinks(token: string) {
  const res = await fetch(`/api/downloads/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Unable to unlock downloads");
  return data as {
    orderId: string;
    email?: string;
    items: Array<{ key: string; name: string; downloadUrl: string; expiresAt: string }>;
    errors?: Array<{ name: string; error: string }>;
  };
}

/**
 * Meta click identifiers, carried to Stripe metadata so the server-side
 * Conversions API Purchase can be matched back to the ad click. Without
 * fbc/fbp the CAPI event matches on hashed email alone, which measurably
 * lowers Event Match Quality — and therefore delivery.
 */
export function collectMeta(): MetaAttribution {
  const { fbc, fbp, fbclid } = getMetaClickIds();
  const { platform } = getTrafficContext();
  return { fbc, fbp, fbclid, platform };
}

export function collectUtm() {
  const url = new URL(window.location.href);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
  return Object.fromEntries(keys.map((k) => [k, url.searchParams.get(k) || ""]).filter(([, v]) => v));
}
