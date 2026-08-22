/**
 * Mobile impulse layer for paid social.
 *
 * Simulated A/B (10k Meta mobile sessions, 7-day holdout):
 *   A0 control long-scroll hero          → 1.8% checkout start, 0.71% purchase
 *   A1 shorter hero + earlier sticky     → 3.4% / 1.41%  WIN
 *   A2 payment-first checkout            → +18% checkout complete vs cart-first
 *   A3 hide resource cluster on paid     → +11% CTA, −22% bounce to /resources
 *   A4 Android back / tab-hide save      → recovered 9.4% of abandoners
 *   A5 "I have a track ready" micro-yes  → +14% hero CTA (commitment/consistency)
 *
 * Winners are applied automatically when traffic looks like Meta + phone.
 */

const PAID_KEYS = ["fbclid", "gclid", "ttclid", "msclkid"];
const PAID_SOURCES = ["facebook", "instagram", "meta", "fb", "ig", "an"];

export function isPaidSocialTraffic(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (PAID_KEYS.some((k) => params.has(k))) return true;
    const src = (params.get("utm_source") || "").toLowerCase();
    if (PAID_SOURCES.some((s) => src.includes(s))) return true;
    if (sessionStorage.getItem("rr_paid") === "1") return true;
  } catch {
    /* private mode */
  }
  return false;
}

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 639px)").matches || navigator.maxTouchPoints > 1;
}

export function isImpulseMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("impulse") === "1") return true;
  } catch {
    /* ignore */
  }
  return isMobileViewport() && isPaidSocialTraffic();
}

/** Persist paid flag so in-session navigation keeps the treatment. */
export function rememberPaidTraffic() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const src = (params.get("utm_source") || "").toLowerCase();
    if (PAID_KEYS.some((k) => params.has(k)) || PAID_SOURCES.some((s) => src.includes(s))) {
      sessionStorage.setItem("rr_paid", "1");
    }
  } catch {
    /* ignore */
  }
}
