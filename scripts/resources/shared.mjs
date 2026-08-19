// Shared constants and helpers for the RadioReach resource-page generator.

export const SITE = {
  name: "RadioReach",
  url: "https://radioreach.us",
  productName: "Radio Reach Vault",
  productUrl: "https://radioreach.us/",
  ogImage: "/images/og/radioreach-share-1200x800.jpg",
  ogImageWidth: 1200,
  ogImageHeight: 800,
  ogImageAlt:
    "RadioReach — radio station contacts and promotion guides for independent artists",
  resourcesUrl: "https://radioreach.us/resources/",
};

export const CATEGORIES = [
  {
    id: "core",
    name: "Core guides",
    blurb:
      "The fundamentals of radio promotion for independent artists: research, targeting, pitching, and follow-up.",
  },
  {
    id: "tools",
    name: "Templates & press kits",
    blurb:
      "Copy-and-adapt outreach templates and the assets stations expect you to have ready before you pitch.",
  },
  {
    id: "genre",
    name: "Genre playbooks",
    blurb:
      "How radio airplay actually works inside specific genres — and where independent artists realistically get spins.",
  },
  {
    id: "station-type",
    name: "Station-type submission guides",
    blurb:
      "Distinct outreach workflows for community, public, internet, and other radio programming models.",
  },
  {
    id: "market",
    name: "Country & market guides",
    blurb:
      "Market-specific radio maps, outreach considerations, and submission workflows for international campaigns.",
  },
  {
    id: "strategy",
    name: "Comparisons & strategy",
    blurb:
      "Honest comparisons and decision frameworks for planning a campaign that fits your budget and goals.",
  },
  {
    id: "reference",
    name: "Reference & answers",
    blurb:
      "Plain-English definitions of radio industry terms and answers to the questions artists ask most.",
  },
];

export function categoryById(id) {
  const c = CATEGORIES.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown category: ${id}`);
  return c;
}

/** Escape a string for safe inclusion in HTML text content. */
export function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Escape a string for safe inclusion inside a JSON-LD <script> block. */
export function escJson(s) {
  return JSON.stringify(String(s), null, 0);
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-08-18" -> "August 18, 2026" */
export function prettyDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Rough reading time in minutes for a body of HTML. */
export function readingMinutes(html) {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean)
    .length;
  return Math.max(1, Math.round(words / 220));
}

/**
 * Pull `<h2 id="...">Label</h2>` pairs out of a body string so the layout can
 * render an "On this page" box without duplicating headings by hand.
 */
export function extractH2s(html) {
  const out = [];
  const re = /<h2 id="([^"]+)">(.*?)<\/h2>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push({ id: m[1], label: m[2].replace(/<[^>]+>/g, "") });
  }
  return out;
}

/** Relative URL for a page slug. */
export function pagePath(slug) {
  return slug === "resources" ? "/resources/" : `/resources/${slug}/`;
}

export function pageUrl(slug) {
  return `${SITE.url}${pagePath(slug)}`;
}
