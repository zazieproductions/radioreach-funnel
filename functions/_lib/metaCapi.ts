// Meta Conversions API (CAPI) — server-side Purchase events.
//
// Sent from the Stripe webhook after a payment is confirmed. Each event uses
// event_id = the Stripe Checkout session id, which matches the eventID the
// browser pixel sends, so Meta deduplicates the two automatically.
//
// NOTE: this fires from a Stripe webhook, not from the buyer's browser, so
// client_ip_address / client_user_agent are intentionally omitted — the
// request context here belongs to Stripe's servers, and sending their IP
// would pollute matching. Hashed email (em) is the matching key.
//
// Configure via environment variables (Pages project settings):
//   META_PIXEL_ID          e.g. 2551277695315034
//   META_CAPI_ACCESS_TOKEN system-user token from Events Manager > Settings
//   META_TEST_EVENT_CODE   optional; set while validating in Test Events
// If either required variable is missing, sending is silently skipped.

const GRAPH_VERSION = "v21.0";

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type CapiPurchase = {
  /** Stripe Checkout session id — MUST match the browser pixel's eventID. */
  eventId: string;
  /** Unix seconds when the purchase happened. */
  eventTime: number;
  email?: string | null;
  /** Order total in cents (Stripe convention). */
  amountTotalCents: number;
  currency: string;
  contentIds: string[];
  contentName: string;
  attribution?: Record<string, string>;
  eventSourceUrl?: string;
  /** Meta click id (_fbc cookie / fb.1.<ts>.<fbclid>) captured at landing. */
  fbc?: string | null;
  /** Meta browser id (_fbp cookie) captured at landing. */
  fbp?: string | null;
};

export async function sendCapiPurchase(env: Env, purchase: CapiPurchase): Promise<void> {
  const pixelId = env.META_PIXEL_ID;
  const token = env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return; // Not configured — no-op.
  if (!purchase.amountTotalCents || purchase.amountTotalCents <= 0) return;

  const userData: Record<string, unknown> = {};
  if (purchase.email && purchase.email.includes("@")) {
    userData.em = [await sha256Hex(purchase.email.trim().toLowerCase())];
  }
  // Click identifiers are the strongest signal Meta has for tying a
  // conversion back to the ad that produced it. They are already opaque
  // tokens, so they are sent as-is (never hashed) per Meta's spec.
  if (purchase.fbc) userData.fbc = purchase.fbc;
  if (purchase.fbp) userData.fbp = purchase.fbp;
  // Meta requires at least one user_data parameter.
  if (Object.keys(userData).length === 0) return;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: purchase.eventTime,
        event_id: purchase.eventId,
        action_source: "website",
        event_source_url: purchase.eventSourceUrl || "https://radioreach.us/",
        user_data: userData,
        custom_data: {
          value: purchase.amountTotalCents / 100,
          currency: purchase.currency.toUpperCase(),
          content_ids: purchase.contentIds,
          content_name: purchase.contentName,
          content_type: "product",
          num_items: purchase.contentIds.length,
          ...purchase.attribution,
        },
      },
    ],
  };
  if (env.META_TEST_EVENT_CODE) {
    body.test_event_code = env.META_TEST_EVENT_CODE;
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    // Log and move on — conversion tracking must never break fulfillment.
    console.error("[Meta CAPI] send failed", res.status, await res.text().catch(() => ""));
  }
}
