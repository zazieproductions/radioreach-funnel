/* ─────────────────────────────────────────────────────────────
   TRAFFIC CONTEXT — who just landed, and where from
   ─────────────────────────────────────────────────────────────
   Meta (Facebook / Instagram) ad traffic behaves differently from
   organic: it arrives cold, on a phone, usually inside the
   Facebook or Instagram in-app browser, and decides in seconds.

   This module captures the landing context ONCE (first paint) and
   keeps it in sessionStorage, because:

   1. The funnel is a single-page app — after the first navigation
      the `fbclid` / `utm_*` params are no longer on the URL.
   2. Stripe returns to `/#/success?session_id=…`, which drops the
      original query string entirely.

   Everything here is defensive: private mode, blocked storage, and
   missing APIs all degrade to "unknown traffic", never an error.
───────────────────────────────────────────────────────────── */

export type MetaPlatform = "facebook" | "instagram" | "meta" | "other";

export type TrafficContext = {
  /** Arrived from a Meta ad / Meta surface. */
  isMeta: boolean;
  /** Rendering inside the Facebook or Instagram in-app webview. */
  isInAppBrowser: boolean;
  platform: MetaPlatform;
  fbclid: string;
  utm: Record<string, string>;
  landingUrl: string;
  referrer: string;
  landedAt: number;
};

const STORAGE_KEY = "rr_traffic_v1";
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

const META_SOURCES = /(facebook|fb|ig|instagram|meta|messenger)/i;
const META_REFERRERS = /(facebook\.com|instagram\.com|fb\.me|l\.facebook|lm\.facebook|m\.facebook)/i;
/** FBAN/FBAV = Facebook app webview, Instagram = IG in-app browser. */
const IN_APP_UA = /(FBAN|FBAV|FB_IAB|FBIOS|Instagram)/i;

let cached: TrafficContext | null = null;

function readStored(): TrafficContext | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrafficContext;
    return typeof parsed?.isMeta === "boolean" ? parsed : null;
  } catch {
    return null;
  }
}

function persist(ctx: TrafficContext) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    /* private mode — in-memory only */
  }
}

function detect(): TrafficContext {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  const fbclid = params.get("fbclid") || "";
  const utm = Object.fromEntries(
    UTM_KEYS.map((k) => [k, params.get(k) || ""]).filter(([, v]) => v)
  ) as Record<string, string>;

  const referrer = document.referrer || "";
  const ua = navigator.userAgent || "";
  const isInAppBrowser = IN_APP_UA.test(ua);

  const source = (utm.utm_source || "").toLowerCase();
  const isMeta =
    !!fbclid ||
    META_SOURCES.test(source) ||
    META_REFERRERS.test(referrer) ||
    isInAppBrowser;

  let platform: MetaPlatform = "other";
  if (/instagram|ig/i.test(source) || /instagram/i.test(referrer) || /Instagram/i.test(ua)) {
    platform = "instagram";
  } else if (/facebook|fb|messenger/i.test(source) || META_REFERRERS.test(referrer) || /FB/i.test(ua)) {
    platform = "facebook";
  } else if (isMeta) {
    platform = "meta";
  }

  return {
    isMeta,
    isInAppBrowser,
    platform,
    fbclid,
    utm,
    landingUrl: url.href.slice(0, 480),
    referrer: referrer.slice(0, 240),
    landedAt: Date.now(),
  };
}

/**
 * The landing context for this session. Detected on first call,
 * then replayed from sessionStorage for the rest of the visit.
 */
export function getTrafficContext(): TrafficContext {
  if (cached) return cached;
  if (typeof window === "undefined") {
    cached = {
      isMeta: false,
      isInAppBrowser: false,
      platform: "other",
      fbclid: "",
      utm: {},
      landingUrl: "",
      referrer: "",
      landedAt: 0,
    };
    return cached;
  }

  const stored = readStored();
  const fresh = detect();

  // A stored Meta landing always wins: the visitor came from an ad even if
  // they are three in-app navigations deep and the params are long gone.
  if (stored) {
    cached = {
      ...stored,
      isMeta: stored.isMeta || fresh.isMeta,
      isInAppBrowser: fresh.isInAppBrowser,
      fbclid: stored.fbclid || fresh.fbclid,
      utm: Object.keys(stored.utm || {}).length ? stored.utm : fresh.utm,
    };
  } else {
    cached = fresh;
  }

  persist(cached);
  return cached;
}

/** Shorthand: is this visitor a cold, ad-sourced buyer? */
export function isMetaTraffic() {
  return getTrafficContext().isMeta;
}

/** Shorthand: are we inside the Facebook / Instagram webview? */
export function isInAppBrowser() {
  return getTrafficContext().isInAppBrowser;
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : "";
}

/**
 * Meta click identifiers for Conversions API matching.
 *
 * `_fbp` / `_fbc` are written by the pixel. When the pixel has not
 * finished loading yet (we defer it for speed) we synthesize `fbc`
 * from the captured `fbclid` using Meta's documented format:
 *   fb.1.<unix-ms>.<fbclid>
 * Sending it server-side materially improves Event Match Quality,
 * which is what Meta's optimizer uses to find more buyers.
 */
export function getMetaClickIds(): { fbc: string; fbp: string; fbclid: string } {
  const ctx = getTrafficContext();
  const fbp = readCookie("_fbp");
  let fbc = readCookie("_fbc");

  if (!fbc && ctx.fbclid) {
    fbc = `fb.1.${ctx.landedAt || Date.now()}.${ctx.fbclid}`;
  }

  return { fbc, fbp, fbclid: ctx.fbclid };
}
