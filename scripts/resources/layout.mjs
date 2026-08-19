// Layout + JSON-LD builders for generated RadioReach resource pages.
import {
  SITE,
  CATEGORIES,
  categoryById,
  esc,
  escJson,
  prettyDate,
  readingMinutes,
  extractH2s,
  pagePath,
  pageUrl,
} from "./shared.mjs";

const OG_IMAGE_ABS = `${SITE.url}${SITE.ogImage}`;

const CSS = `
:root{--bg:#0a0a0c;--panel:#111114;--line:#2a2a30;--text:#d6d6da;--muted:#9b9ba3;--accent:#c7ff4a;--accent-dim:#8fb832}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration-thickness:1px;text-underline-offset:3px}
a:hover{color:#e2ff8a}
a:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}
.skip{position:absolute;left:-9999px;top:0;background:var(--accent);color:#000;padding:10px 16px;font-weight:700;z-index:10}
.skip:focus{left:12px;top:12px}
.wrap{max-width:860px;margin:0 auto;padding:0 22px}
header.site{border-bottom:1px solid var(--line)}
.sitebar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 0}
.brand{font-weight:800;letter-spacing:.02em;color:#fff;text-decoration:none;font-size:1.05rem}
.brand span{color:var(--accent)}
.sitebar nav{font-size:.92rem}
main{padding:40px 0 64px}
nav.breadcrumbs{font-size:.88rem;color:var(--muted);margin-bottom:26px}
nav.breadcrumbs ol{list-style:none;display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0}
nav.breadcrumbs li{display:flex;gap:6px;align-items:center}
nav.breadcrumbs li+li::before{content:"/";color:var(--muted);opacity:.6;margin-right:6px}
nav.breadcrumbs [aria-current]{color:var(--text)}
h1{color:#fff;font-size:clamp(1.9rem,4.6vw,2.9rem);line-height:1.12;margin:0 0 14px;letter-spacing:-.01em}
.byline{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:.88rem;color:var(--muted);margin:0 0 30px;padding-bottom:22px;border-bottom:1px solid var(--line)}
.toc{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px 22px;margin:0 0 38px}
.toc strong{display:block;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.toc ul{list-style:none;margin:0;padding:0;columns:2;column-gap:32px;font-size:.95rem}
.toc li{margin:4px 0;break-inside:avoid}
@media (max-width:560px){.toc ul{columns:1}}
article h2{color:#fff;font-size:1.45rem;line-height:1.25;margin:46px 0 12px;scroll-margin-top:20px}
article h3{color:#fff;font-size:1.12rem;margin:28px 0 8px}
article p{margin:0 0 16px;font-size:1.05rem}
article ul,article ol{margin:0 0 18px;padding-left:24px}
article li{margin:6px 0}
code{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:1px 6px;font-size:.92em}
table{width:100%;border-collapse:collapse;margin:8px 0 20px;font-size:.97rem}
th,td{border:1px solid var(--line);padding:10px 12px;text-align:left;vertical-align:top}
th{background:var(--panel);color:#fff}
blockquote{margin:18px 0;padding:14px 20px;border-left:3px solid var(--accent);background:var(--panel);border-radius:0 8px 8px 0}
dl.terms dt{color:#fff;font-weight:700;margin-top:26px;scroll-margin-top:20px}
dl.terms dd{margin:6px 0 0 0;padding-left:0}
dl.terms{margin:0}
.letter{color:#fff;font-size:1.3rem;margin:40px 0 8px;border-bottom:1px solid var(--line);padding-bottom:6px}
details.faq{border:1px solid var(--line);border-radius:10px;background:var(--panel);margin:12px 0}
details.faq summary{cursor:pointer;padding:15px 18px;font-weight:600;color:#fff;list-style-position:inside;min-height:44px}
details.faq[open] summary{border-bottom:1px solid var(--line)}
details.faq .a{padding:6px 18px 16px}
.cta{margin:52px 0 8px;padding:26px 26px 22px;border:1px solid var(--line);background:linear-gradient(180deg,#141418,#0e0e11);border-radius:12px}
.cta h2{margin:0 0 10px;font-size:1.35rem;color:#fff}
.cta p{margin:0 0 14px}
.cta a.button{display:inline-block;background:var(--accent);color:#0a0a0c;font-weight:800;padding:12px 20px;border-radius:8px;text-decoration:none;min-height:44px}
.cta a.button:hover{background:#e2ff8a}
.related{margin-top:44px;border-top:1px solid var(--line);padding-top:26px}
.related h2{margin:0 0 14px;font-size:1.2rem;color:#fff}
.related ul{list-style:none;margin:0;padding:0}
.related li{margin:10px 0}
.related .k{font-size:.82rem;color:var(--muted)}
footer.site{border-top:1px solid var(--line);margin-top:64px;padding:28px 0 44px;font-size:.9rem;color:var(--muted)}
footer.site nav{display:flex;flex-wrap:wrap;gap:8px 22px;margin-bottom:14px}
.small{font-size:.85rem;color:var(--muted)}
.template{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px 20px;margin:14px 0}
.template strong.t{display:block;color:#fff;margin-bottom:6px}
.tag{display:inline-block;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--line);color:var(--muted);border-radius:999px;padding:2px 10px;margin-left:10px;vertical-align:middle}
`;

const META_PIXEL = `
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '2551277695315034');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=2551277695315034&ev=PageView&noscript=1"
alt=""
/></noscript>`;

/** Graph nodes shared by every generated page. */
function orgNode() {
  return {
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: "RadioReach",
    url: `${SITE.url}/`,
    logo: {
      "@type": "ImageObject",
      url: `${SITE.url}/favicon.svg`,
    },
  };
}

function breadcrumbNodes(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function articleNode(page) {
  return {
    "@type": "Article",
    "@id": `${pageUrl(page.slug)}#article`,
    headline: page.h1,
    description: page.description,
    datePublished: page.published,
    dateModified: page.updated,
    mainEntityOfPage: { "@id": pageUrl(page.slug) },
    image: OG_IMAGE_ABS,
    inLanguage: "en-US",
    articleSection: categoryById(page.category).name,
    author: {
      "@type": "Organization",
      name: "RadioReach team",
      url: `${SITE.url}/`,
    },
    publisher: { "@id": `${SITE.url}/#organization` },
    isPartOf: { "@id": `${SITE.url}/resources/#collection` },
  };
}

function faqNode(faq) {
  return {
    "@type": "FAQPage",
    "@id": "#faq",
    mainEntity: faq.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

function howtoNode(howto, slug) {
  return {
    "@type": "HowTo",
    "@id": `${pageUrl(slug)}#howto`,
    name: howto.name,
    description: howto.description,
    totalTime: "PT0M" in howto ? howto.totalTime : undefined,
    step: howto.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

function jsonLd(graph) {
  const clean = graph.filter(Boolean);
  return `<script type="application/ld+json">\n${JSON.stringify(
    { "@context": "https://schema.org", "@graph": clean },
    null,
    1
  )}\n</script>`;
}

/** Render one resource page (not the hub). */
export function renderPage(page, allPages, extras = {}) {
  const h2s = page.showToc === false ? [] : extractH2s(page.body);
  const related = resolveRelated(page, allPages);
  const cat = categoryById(page.category);

  const graph = [
    orgNode(),
    breadcrumbNodes([
      { name: "Home", url: `${SITE.url}/` },
      { name: "Resources", url: SITE.resourcesUrl },
      { name: page.breadcrumbLabel ?? page.h1, url: pageUrl(page.slug) },
    ]),
    articleNode(page),
    page.faq?.length ? faqNode(page.faq) : null,
    page.howto ? howtoNode(page.howto, page.slug) : null,
    (extras.extraSchema ?? page.extraSchema)?.() ?? null,
  ];

  const title = page.title.includes("RadioReach")
    ? page.title
    : `${page.title} | RadioReach`;

  const tocHtml = h2s.length
    ? `<nav class="toc" aria-label="On this page">
        <strong>On this page</strong>
        <ul>${h2s
          .map((h) => `<li><a href="#${h.id}">${h.label}</a></li>`)
          .join("")}</ul>
      </nav>`
    : "";

  const faqHtml = page.faq?.length
    ? `<section id="faq">
        <h2 id="frequently-asked-questions">Frequently asked questions</h2>
        ${page.faq
          .map(
            ([q, a]) =>
              `<details class="faq"><summary>${q}</summary><div class="a"><p>${a}</p></div></details>`
          )
          .join("")}
      </section>`
    : "";

  const cta = extras.cta ?? defaultCta(page);

  const relatedHtml = `<section class="related" aria-label="Related guides">
    <h2>Related guides</h2>
    <ul>
      ${related
        .map(
          (r) =>
            `<li><a href="${r.path}">${esc(r.cardTitle ?? r.h1)}</a> <span class="k">— ${esc(
              r.card ?? ""
            )}</span></li>`
        )
        .join("")}
    </ul>
  </section>`;

  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0a0a0c">
<meta name="color-scheme" content="dark">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="${pageUrl(page.slug)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="RadioReach">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${pageUrl(page.slug)}">
<meta property="og:image" content="${OG_IMAGE_ABS}">
<meta property="og:image:secure_url" content="${OG_IMAGE_ABS}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="800">
<meta property="og:image:alt" content="${esc(SITE.ogImageAlt)}">
<meta property="article:published_time" content="${page.published}">
<meta property="article:modified_time" content="${page.updated}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${OG_IMAGE_ABS}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
${jsonLd(graph)}
<style>${CSS}</style>
<!-- Meta Pixel Code -->${META_PIXEL}
<!-- End Meta Pixel Code -->
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="site">
  <div class="wrap sitebar">
    <a class="brand" href="/">Radio<span>Reach</span></a>
    <nav aria-label="Site"><a href="/resources/">All guides →</a></nav>
  </div>
</header>
<main class="wrap" id="content">
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/resources/">Resources</a></li>
      <li><span aria-current="page">${esc(
        page.breadcrumbLabel ?? page.h1
      )}</span></li>
    </ol>
  </nav>
  <article>
    <h1>${page.h1}${page.h1Suffix ? `<span class="tag">${esc(page.h1Suffix)}</span>` : ""}</h1>
    <p class="byline">
      <span>By the RadioReach team</span>
      <span>Updated <time datetime="${page.updated}">${prettyDate(
        page.updated
      )}</time></span>
      <span>${readingMinutes(page.body)} min read</span>
      <span>${esc(cat.name)}</span>
    </p>
    ${tocHtml}
    ${page.body}
    ${faqHtml}
  </article>
  ${cta}
  ${relatedHtml}
</main>
<footer class="site">
  <div class="wrap">
    <nav aria-label="Footer">
      <a href="/">Radio Reach Vault</a>
      <a href="/resources/">Free guides</a>
      <a href="/privacy-policy/">Privacy policy</a>
      <a href="/terms/">Terms of service</a>
    </nav>
    <p class="small">© ${new Date().getFullYear()} RadioReach. Guidance on this
    page is general information — individual radio stations set their own
    submission and programming policies.</p>
  </div>
</footer>
</body>
</html>
`;
}

function defaultCta(page) {
  return `<section class="cta" aria-label="About the Radio Reach Vault">
  <h2>Stop hunting for radio contacts one station at a time</h2>
  <p>The Radio Reach Vault is a downloadable directory of 18,000+ radio station
  contacts organized by station, location, and role — so the research layer of
  ${page.ctaContext ? esc(page.ctaContext) : "your radio campaign"} takes hours
  instead of weeks.</p>
  <p><a class="button" href="/">Explore the Radio Reach Vault →</a></p>
</section>`;
}

/**
 * Related-guide selection: explicit list first, then same-category neighbors,
 * then a sensible fallback so every page always has at least three internal
 * links to sibling content.
 */
export function resolveRelated(page, allPages) {
  const bySlug = new Map(allPages.map((p) => [p.slug, p]));
  const out = [];
  const push = (slug) => {
    if (slug && slug !== page.slug && bySlug.has(slug) && !out.some((o) => o.slug === slug)) {
      out.push({ ...bySlug.get(slug), path: pagePath(slug) });
    }
  };
  (page.related ?? []).forEach(push);
  if (out.length >= 4) return out.slice(0, 4);
  for (const p of allPages) if (p.category === page.category) push(p.slug);
  if (out.length >= 4) return out.slice(0, 4);
  for (const p of allPages) {
    push(p.slug);
    if (out.length >= 4) break;
  }
  return out.slice(0, 4);
}
