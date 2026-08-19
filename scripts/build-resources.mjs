// Build the RadioReach resource library: static HTML pages under
// public/resources/, the /resources/ hub, and public/sitemap.xml.
//
// Usage:  node scripts/build-resources.mjs
//
// Content lives in scripts/resources/content-*.mjs as page objects.
// The layout in scripts/resources/layout.mjs renders each page with
// consistent metadata, JSON-LD, breadcrumbs, TOC, FAQ, CTA, related
// guides, and footer — so no page can drift into orphanhood or ship
// with an incomplete <head>.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE,
  CATEGORIES,
  categoryById,
  esc,
  prettyDate,
  pagePath,
  pageUrl,
} from "./resources/shared.mjs";
import { renderPage, resolveRelated } from "./resources/layout.mjs";
import { CORE_PAGES } from "./resources/content-core.mjs";
import { TOOL_PAGES } from "./resources/content-tools.mjs";
import { GENRE_REFERENCE_PAGES } from "./resources/content-genre-reference.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const RESOURCES = path.join(PUBLIC, "resources");

const PAGES = [...CORE_PAGES, ...TOOL_PAGES, ...GENRE_REFERENCE_PAGES];

// ---------------------------------------------------------------------------
// Validation — fail the build on SEO defects instead of shipping them.
// ---------------------------------------------------------------------------

const problems = [];
const slugs = new Set(PAGES.map((p) => p.slug));

for (const p of PAGES) {
  const label = `pages/${p.slug}`;
  if (!p.title) problems.push(`${label}: missing title`);
  if (!p.h1) problems.push(`${label}: missing h1`);
  if (!p.description || p.description.length < 110 || p.description.length > 175)
    problems.push(
      `${label}: meta description should be 110–175 chars (got ${p.description?.length ?? 0})`
    );
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.published ?? ""))
    problems.push(`${label}: bad published date`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.updated ?? ""))
    problems.push(`${label}: bad updated date`);
  if (p.updated < p.published)
    problems.push(`${label}: updated earlier than published`);
  // FAQ pairs and glossary terms render into the page — count their words too.
  const renderedExtra = [...(p.faq ?? []).flat(), ...(p.terms ?? []).flat()].join(" ");
  const bodyPlus = (p.body ?? "") + " " + renderedExtra;
  if (bodyPlus.length < 1500)
    problems.push(`${label}: page content too thin (${bodyPlus.length} chars)`);
  const wordCount = bodyPlus.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (wordCount < 450) problems.push(`${label}: under 450 words (${wordCount})`);

  // Every internal /resources/ link must point somewhere we build.
  const hrefs = [...p.body.matchAll(/href="(\/resources\/[^"]*)"/g)].map(
    (m) => m[1]
  );
  for (const href of hrefs) {
    const target = href.replace(/^\/resources\//, "").replace(/\/$/, "");
    if (href !== "/resources/" && !slugs.has(target))
      problems.push(`${label}: links to unknown resource '${href}'`);
  }
  for (const r of p.related ?? [])
    if (!slugs.has(r)) problems.push(`${label}: unknown related slug '${r}'`);

  // h2s used by the TOC need ids; flag stray ones.
  const h2NoId = /<h2>(?!<)/.test(p.body ?? "");
  if (h2NoId) problems.push(`${label}: found <h2> without id (TOC would skip it)`);
}
if (new Set(PAGES.map((p) => p.slug)).size !== PAGES.length)
  problems.push("duplicate slugs detected");
if (problems.length) {
  console.error("✗ Resource build failed validation:");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Glossary: expand the <!-- TERMS --> marker into a definition list.
// ---------------------------------------------------------------------------

function slugifyTerm(t) {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function renderGlossaryTerms(page) {
  const byLetter = new Map();
  for (const [term, def] of page.terms) {
    const letter = term[0].toUpperCase();
    if (!byLetter.has(letter)) byLetter.set(letter, []);
    byLetter.get(letter).push([term, def]);
  }
  let html = "";
  for (const letter of [...byLetter.keys()].sort()) {
    html += `<h2 class="letter" id="letter-${letter.toLowerCase()}">${letter}</h2>\n<dl class="terms">\n`;
    for (const [term, def] of byLetter.get(letter)) {
      html += `<dt id="term-${slugifyTerm(term)}">${term}</dt>\n<dd>${def}</dd>\n`;
    }
    html += `</dl>\n`;
  }
  return html;
}

for (const p of PAGES) {
  if (p.terms) {
    p.body = p.body.replace("<!-- TERMS -->", renderGlossaryTerms(p));
    p.showToc = false; // letter anchors cover navigation; keep the page clean
  }
}

// ---------------------------------------------------------------------------
// Render every page.
// ---------------------------------------------------------------------------

fs.mkdirSync(RESOURCES, { recursive: true });

let written = 0;
for (const p of PAGES) {
  // Glossary pages get a DefinedTermSet in their graph.
  const extras = p.terms
    ? {
        extraSchema: () => ({
          "@type": "DefinedTermSet",
          "@id": `${pageUrl(p.slug)}#glossary`,
          name: "Radio promotion glossary",
          description: p.description,
          url: pageUrl(p.slug),
          hasDefinedTerm: p.terms.map(([term, def]) => ({
            "@type": "DefinedTerm",
            name: term,
            description: def.replace(/<[^>]+>/g, ""),
          })),
        }),
      }
    : {};
  const html = renderPage(p, PAGES, extras);
  const dir = path.join(RESOURCES, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  written++;
}

// ---------------------------------------------------------------------------
// Hub page.
// ---------------------------------------------------------------------------

function cardHtml(p) {
  return `<article class="card">
  <h3><a href="${pagePath(p.slug)}">${esc(p.cardTitle ?? p.h1)}</a></h3>
  <p>${esc(p.card ?? p.description)}</p>
  <p class="meta">Updated <time datetime="${p.updated}">${prettyDate(p.updated)}</time></p>
</article>`;
}

// Short card descriptions used on the hub (kept next to content for freshness).
const CARDS = {
  "college-radio-submissions":
    "Find music directors, time your send around semesters, and pitch college radio the way programmers expect.",
  "radio-stations-accepting-music":
    "The signals that show a station is open to submissions — plus which contacts matter and how to pitch them.",
  "radio-promotion-independent-artists":
    "The full campaign playbook: strategy, geography, an eight-week timeline, and how to measure real results.",
  "how-to-get-your-song-on-the-radio":
    "The complete eight-step path from picking realistic stations to turning spins into your next campaign.",
  "radio-pitch-email-templates":
    "Six tested pitch templates — first contact, specialty shows, follow-ups, and thank-yous — plus subject lines.",
  "electronic-press-kit-radio":
    "Build the EPK and one-sheet radio programmers actually open: bios, photos, links, and airplay history.",
  "diy-radio-promotion-vs-radio-promoter":
    "An honest side-by-side of running your own campaign versus hiring a promoter — costs, control, and red flags.",
  "hip-hop-radio-promotion":
    "Mixshows, college hip-hop directors, DJ pools, clean edits, and building the regional story that opens doors.",
  "electronic-music-radio-promotion":
    "Why dance radio is a world of shows, not stations — and how edits, remixes, and guest mixes get you on.",
  "country-radio-promotion":
    "The two radios of country: why commercial is closed, and how Americana, Triple A, and regional radio aren't.",
  "radio-promotion-glossary":
    "40+ radio terms in plain English — adds, spins, rotation, NACC, one-sheets, mixshows, and more.",
  "radio-promotion-faq":
    "Straight answers to the questions independent artists ask most about getting music on the radio.",
};

function renderHub() {
  const recent = [...PAGES].sort((a, b) => (a.updated < b.updated ? 1 : -1)).slice(0, 5);
  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: "RadioReach",
      url: `${SITE.url}/`,
      logo: { "@type": "ImageObject", url: `${SITE.url}/favicon.svg` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/` },
        { "@type": "ListItem", position: 2, name: "Resources", item: SITE.resourcesUrl },
      ],
    },
    {
      "@type": "CollectionPage",
      "@id": `${SITE.resourcesUrl}#collection`,
      name: "Radio promotion resources for independent artists",
      description:
        "Free RadioReach guides, templates, genre playbooks, and reference material on radio promotion for independent musicians.",
      url: SITE.resourcesUrl,
      inLanguage: "en-US",
      isPartOf: { "@id": `${SITE.url}/#website` },
      publisher: { "@id": `${SITE.url}/#organization` },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: PAGES.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: pageUrl(p.slug),
          name: p.cardTitle ?? p.h1,
        })),
      },
    },
  ];

  const sections = CATEGORIES.map((cat) => {
    const pages = PAGES.filter((p) => p.category === cat.id);
    if (!pages.length) return "";
    return `<section class="hub-section">
      <h2 id="${cat.id}">${esc(cat.name)}</h2>
      <p class="blurb">${esc(cat.blurb)}</p>
      ${pages.map(cardHtml).join("\n")}
    </section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0a0a0c">
<meta name="color-scheme" content="dark">
<title>Radio Promotion Resources &amp; Free Guides | RadioReach</title>
<meta name="description" content="Free radio promotion guides for independent artists: submission how-tos, pitch email templates, EPK building, genre playbooks, a glossary of radio terms, and honest strategy.">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="${SITE.resourcesUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="RadioReach">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="Radio Promotion Resources &amp; Free Guides | RadioReach">
<meta property="og:description" content="Free radio promotion guides for independent artists: submissions, pitch templates, EPKs, genre playbooks, and reference.">
<meta property="og:url" content="${SITE.resourcesUrl}">
<meta property="og:image" content="${SITE.url}${SITE.ogImage}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="800">
<meta property="og:image:alt" content="${esc(SITE.ogImageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Radio Promotion Resources &amp; Free Guides | RadioReach">
<meta name="twitter:description" content="Free radio promotion guides for independent artists: submissions, pitch templates, EPKs, genre playbooks, and reference.">
<meta name="twitter:image" content="${SITE.url}${SITE.ogImage}">
<link rel="icon" href="/favicon.ico?v=2" sizes="32x32">
<link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" sizes="180x180">
<script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 1)}
</script>
<style>
:root{--bg:#0a0a0c;--panel:#111114;--line:#2a2a30;--text:#d6d6da;--muted:#9b9ba3;--accent:#c7ff4a}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration-thickness:1px;text-underline-offset:3px}
a:hover{color:#e2ff8a}
a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.wrap{max-width:900px;margin:0 auto;padding:0 22px}
.sitebar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 0;border-bottom:1px solid var(--line)}
.brand{font-weight:800;color:#fff;text-decoration:none;font-size:1.05rem}
.brand span{color:var(--accent)}
nav.breadcrumbs{font-size:.88rem;color:var(--muted);margin:26px 0}
nav.breadcrumbs ol{list-style:none;display:flex;gap:6px;margin:0;padding:0}
nav.breadcrumbs li+li::before{content:"/";margin-right:6px;opacity:.6}
h1{color:#fff;font-size:clamp(1.9rem,4.6vw,2.9rem);line-height:1.12;margin:0 0 14px}
main{padding:34px 0 64px}
.hub-section{margin-top:44px}
.hub-section h2{color:#fff;font-size:1.4rem;margin:0 0 4px}
.blurb{color:var(--muted);margin:0 0 18px;font-size:.98rem}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px 20px}
.card h3{margin:0 0 8px;font-size:1.05rem;line-height:1.35}
.card p{margin:0 0 8px;font-size:.95rem}
.card .meta{color:var(--muted);font-size:.82rem}
.recent{border:1px solid var(--line);border-radius:10px;background:var(--panel);padding:18px 22px;margin-top:40px}
.recent h2{margin:0 0 10px;font-size:1.1rem;color:#fff}
.recent ul{list-style:none;margin:0;padding:0}
.recent li{margin:6px 0;font-size:.95rem}
.cta{margin:52px 0 8px;padding:26px;border:1px solid var(--line);background:linear-gradient(180deg,#141418,#0e0e11);border-radius:12px}
.cta h2{margin:0 0 10px;font-size:1.35rem;color:#fff}
.cta p{margin:0 0 14px}
.cta a.button{display:inline-block;background:var(--accent);color:#0a0a0c;font-weight:800;padding:12px 20px;border-radius:8px;text-decoration:none}
footer.site{border-top:1px solid var(--line);margin-top:64px;padding:28px 0 44px;font-size:.9rem;color:var(--muted)}
footer.site nav{display:flex;flex-wrap:wrap;gap:8px 22px;margin-bottom:14px}
.small{font-size:.85rem}
</style>
</head>
<body>
<header class="wrap sitebar">
  <a class="brand" href="/">Radio<span>Reach</span></a>
  <nav aria-label="Site" style="font-size:.92rem"><a href="/">Vault →</a></nav>
</header>
<main class="wrap">
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <ol><li><a href="/">Home</a></li><li><span aria-current="page">Resources</span></li></ol>
  </nav>
  <h1>Radio promotion resources for independent artists</h1>
  <p style="max-width:44rem">Everything RadioReach knows about getting independent music on the radio, in
  plain English: step-by-step guides, pitch templates you can adapt tonight, genre
  playbooks, and reference material for the terms programmers use. All free, all
  written for artists doing it themselves.</p>

  <section class="recent" aria-label="Recently updated">
    <h2>Recently updated</h2>
    <ul>
      ${recent
        .map(
          (p) =>
            `<li><a href="${pagePath(p.slug)}">${esc(
              p.cardTitle ?? p.h1
            )}</a> — updated ${prettyDate(p.updated)}</li>`
        )
        .join("\n      ")}
    </ul>
  </section>

  ${sections}

  <section class="cta" aria-label="About the Radio Reach Vault">
    <h2>When the research layer is the bottleneck</h2>
    <p>Every guide above works better with an organized target list. The Radio Reach
    Vault is 18,000+ radio station contacts — station, location, role, phone, and
    email — so your campaign starts on target instead of on a scavenger hunt.</p>
    <p><a class="button" href="/">Explore the Radio Reach Vault →</a></p>
  </section>
</main>
<footer class="site">
  <div class="wrap">
    <nav aria-label="Footer">
      <a href="/">Radio Reach Vault</a>
      <a href="/resources/">Free guides</a>
      <a href="/privacy-policy/">Privacy policy</a>
      <a href="/terms/">Terms of service</a>
    </nav>
    <p class="small">© ${new Date().getFullYear()} RadioReach. Guidance here is general
    information — individual radio stations set their own submission and programming
    policies.</p>
  </div>
</footer>
</body>
</html>
`;
}

fs.writeFileSync(path.join(RESOURCES, "index.html"), renderHub());

// ---------------------------------------------------------------------------
// Sitemap — every indexable URL with an honest lastmod.
// ---------------------------------------------------------------------------

const HOME_LASTMOD = "2026-08-18"; // homepage updated in this pass
const LEGAL = [
  { loc: "https://radioreach.us/privacy-policy/", lastmod: "2026-08-15" },
  { loc: "https://radioreach.us/terms/", lastmod: "2026-08-10" },
];

const urls = [
  { loc: `${SITE.url}/`, lastmod: HOME_LASTMOD },
  { loc: SITE.resourcesUrl, lastmod: HOME_LASTMOD },
  ...PAGES.map((p) => ({ loc: pageUrl(p.slug), lastmod: p.updated })),
  ...LEGAL,
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`
  )
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(PUBLIC, "sitemap.xml"), sitemap);

console.log(
  `✓ Built ${written} resource pages + hub + sitemap (${PAGES.length} URLs incl. legal/home)`
);
