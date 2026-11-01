import type { ProductKey } from "../config/storefront";
import type { MomentumAttribution } from "./momentumSequence";

export type CheckoutSelection = {
  items: ProductKey[];
  bundleId: string;
  utm: Record<string, string>;
  momentum: MomentumAttribution;
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

export async function verifySession(sessionId: string, signal?: AbortSignal) {
  const res = await fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`, { signal, cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new VerificationError(data?.error || "Unable to verify order", res.status);
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

export function collectUtm() {
  const url = new URL(window.location.href);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
  return Object.fromEntries(keys.map((k) => [k, url.searchParams.get(k) || ""]).filter(([, v]) => v));
}

class VerificationError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

/** Retry pending orders and transient failures, never invalid requests. */
export async function waitForVerifiedSession(sessionId: string, signal: AbortSignal) {
  for (let attempt = 0; attempt < 5; attempt++) {
    signal.throwIfAborted();
    try {
      const result = await verifySession(sessionId, signal);
      if (result.verified && result.token) return result;
    } catch (error) {
      signal.throwIfAborted();
      if (error instanceof VerificationError && error.status < 500 && error.status !== 429) throw error;
      if (attempt === 4) throw error;
    }
    if (attempt < 4) await new Promise<void>((resolve, reject) => {
      const onAbort = () => { clearTimeout(timer); reject(signal.reason); };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, 2000);
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }
  throw new Error("We could not verify this purchase yet. Retry in a moment. If this continues, contact support with your receipt email. Please do not purchase again.");
}
