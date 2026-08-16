// Meta Pixel helpers: Advanced Matching + event tracking with dedup support.
//
// Advanced Matching values (em, ph) are normalized and SHA-256 hashed in the
// browser before being handed to fbq, per Meta's manual advanced matching spec:
// https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Every pixel initialized in index.html. fbq('track') fans out to all of them. */
const PIXEL_IDS = ["1615271090014015", "2551277695315034"];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  // Digits only — Meta expects country code + number, no symbols or spaces.
  return phone.replace(/[^0-9]/g, "");
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Attach hashed customer details to all initialized pixels so subsequent
 * events carry Advanced Matching parameters (improves Event Match Quality).
 */
export async function setAdvancedMatching(user: { email?: string; phone?: string }) {
  if (typeof window === "undefined" || !window.fbq) return;

  const matched: Record<string, string> = {};

  if (user.email && user.email.includes("@")) {
    matched.em = await sha256Hex(normalizeEmail(user.email));
  }
  if (user.phone) {
    const digits = normalizePhone(user.phone);
    if (digits.length >= 7) matched.ph = await sha256Hex(digits);
  }

  if (Object.keys(matched).length === 0) return;

  for (const id of PIXEL_IDS) {
    window.fbq("init", id, matched);
  }
}

/** Fire a standard pixel event. Pass eventId to enable CAPI deduplication. */
export function track(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (eventId) {
    window.fbq("track", event, params ?? {}, { eventID: eventId });
  } else {
    window.fbq("track", event, params ?? {});
  }
}

/**
 * Track a completed tip when Stripe redirects back with
 * ?tip=thanks&tip_amount=<cents>&tip_session=<cs_...>.
 * Deduplicated per tip session via localStorage + eventID.
 */
export function trackTipFromReturnUrl() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  if (params.get("tip") !== "thanks") return;

  const sessionId = params.get("tip_session") || "";
  const cents = Number(params.get("tip_amount"));
  // Only the amounts the tip endpoint actually allows.
  if (!sessionId || ![300, 500, 1000, 2000].includes(cents)) return;

  const guardKey = `rr_fbq_tip:${sessionId}`;
  try {
    if (localStorage.getItem(guardKey)) return;
  } catch {
    // localStorage unavailable — fire anyway.
  }

  track(
    "Purchase",
    {
      value: cents / 100,
      currency: "USD",
      content_ids: ["tip"],
      content_name: "RadioReach Tip",
      content_type: "product",
      num_items: 1,
    },
    sessionId
  );

  try {
    localStorage.setItem(guardKey, "1");
  } catch {
    // Best effort only.
  }
}

/**
 * Fire Purchase exactly once per verified Stripe Checkout session.
 * - Guarded via localStorage so refreshing the success page can't double-count.
 * - eventID = Stripe session id, so a future Conversions API integration can
 *   send the same event server-side and Meta will deduplicate.
 */
export async function trackVerifiedPurchase(opts: {
  sessionId: string;
  email?: string;
  value: number;
  currency: string;
  contentIds: string[];
  contentName: string;
}) {
  const guardKey = `rr_fbq_purchase:${opts.sessionId}`;
  try {
    if (localStorage.getItem(guardKey)) return;
  } catch {
    // localStorage unavailable (private mode) — fire anyway.
  }

  await setAdvancedMatching({ email: opts.email });

  track(
    "Purchase",
    {
      value: opts.value,
      currency: opts.currency,
      content_ids: opts.contentIds,
      content_name: opts.contentName,
      content_type: "product",
      num_items: opts.contentIds.length,
    },
    opts.sessionId
  );

  try {
    localStorage.setItem(guardKey, "1");
  } catch {
    // Best effort only.
  }
}
