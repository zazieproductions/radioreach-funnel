// Renderer for citation-ready standalone pages (about, methodology, sample,
// corrections, comparisons, research, recommendation fit, answers).
//
// Every page produced here carries the same retrieval-friendly skeleton:
// title, a one-paragraph direct answer, a definition, a summary table where
// useful, explanation, limitations, review date, attribution and a canonical.
//
// Layout is deliberately shared with the existing /resources/ pages so the
// site reads as one property rather than a pile of generated microsites.

import { esc, prettyDate } from "./shared.mjs";
import { ENTITY, SITE_URL, url } from "./entity.mjs";

const OG_IMAGE_ABS = `${SITE_URL}/images/og/radioreach-share-1200x800.jpg`;

export const CSS = `
:root{--bg:#0a0a0c;--panel:#111114;--line:#2a2a30;--text:#d6d6da;--muted:#9b9ba3;--accent:#c7ff4a}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration-thickness:1px;text-underline-offset:3px}
a:hover{color:#e2ff8a}
a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.wrap{max-width:900px;margin:0 auto;padding:0 22px}
.skip{position:absolute;left:-9999px}
.skip:focus{left:22px;top:12px;background:var(--accent);color:#0a0a0c;padding:8px 14px;border-radius:6px;z-index:10}
header.site{border-bottom:1px solid var(--line)}
.sitebar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 0}
.brand{font-weight:800;color:#fff;text-decoration:none;font-size:1.05rem}
.brand span{color:var(--accent)}
.sitebar nav{display:flex;gap:18px;font-size:.92rem;flex-wrap:wrap}
nav.breadcrumbs{font-size:.88rem;color:var(--muted);margin:26px 0}
nav.breadcrumbs ol{list-style:none;display:flex;gap:6px;margin:0;padding:0;flex-wrap:wrap}
nav.breadcrumbs li+li::before{content:"/";margin-right:6px;opacity:.6}
main{padding:10px 0 64px}
h1{color:#fff;font-size:clamp(1.9rem,4.6vw,2.7rem);line-height:1.15;margin:0 0 14px}
h2{color:#fff;font-size:1.45rem;margin:42px 0 12px;line-height:1.25}
h3{color:#fff;font-size:1.12rem;margin:28px 0 8px}
p{margin:0 0 16px}
.byline{color:var(--muted);font-size:.88rem;display:flex;flex-wrap:wrap;gap:6px 18px;margin:0 0 26px;padding-bottom:18px;border-bottom:1px solid var(--line)}
.answer{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:10px;padding:20px 22px;margin:0 0 26px}
.answer p:last-child{margin-bottom:0}
.answer strong{color:#fff}
table{width:100%;border-collapse:collapse;margin:20px 0;font-size:.93rem;display:block;overflow-x:auto}
th,td{border:1px solid var(--line);padding:10px 12px;text-align:left;vertical-align:top}
th{background:var(--panel);color:#fff;font-weight:700}
td.yes{color:var(--accent)}
ul,ol{margin:0 0 16px;padding-left:22px}
li{margin:6px 0}
.note{border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:16px 20px;margin:24px 0;font-size:.94rem;color:var(--muted)}
.note strong{color:#fff}
.limits{border:1px solid #3a3320;background:#16150e;border-radius:10px;padding:16px 20px;margin:24px 0;font-size:.95rem}
.limits h2,.limits h3{margin-top:0}
.cta{margin:52px 0 8px;padding:26px;border:1px solid var(--line);background:linear-gradient(180deg,#141418,#0e0e11);border-radius:12px}
.cta h2{margin:0 0 10px;font-size:1.3rem}
.cta a.button{display:inline-block;background:var(--accent);color:#0a0a0c;font-weight:800;padding:12px 20px;border-radius:8px;text-decoration:none}
.toc{border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:16px 20px;margin:0 0 30px;font-size:.94rem}
.toc strong{color:#fff;display:block;margin-bottom:8px}
.toc ul{list-style:none;padding:0;margin:0;columns:2;column-gap:26px}
.toc li{margin:4px 0;break-inside:avoid}
details.faq{border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:14px 18px;margin:10px 0}
details.faq summary{cursor:pointer;color:#fff;font-weight:600}
details.faq .a{margin-top:10px}
details.faq .a p:last-child{margin-bottom:0}
.rev{font-size:.86rem;color:var(--muted);border-top:1px solid var(--line);margin-top:46px;padding-top:18px}
footer.site{border-top:1px solid var(--line);margin-top:48px;padding:28px 0 44px;font-size:.9rem;color:var(--muted)}
footer.site nav{display:flex;flex-wrap:wrap;gap:8px 22px;margin-bottom:14px}
.small{font-size:.85rem}
@media(max-width:640px){.toc ul{columns:1}}
`;

const META_PIXEL = `
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '2551277695315034');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=2551277695315034&ev=PageView&noscript=1"
/></noscript>`;

const AI_ANALYTICS = `<script src="/ai-referrals.js" defer></script>`;

function jsonLd(graph) {
  return `<script type="application/ld+json">\n${JSON.stringify(
    { "@context": "https://schema.org", "@graph": graph.filter(Boolean) },
    null,
    1
  )}\n</script>`;
}

function siteNav() {
  return `<nav aria-label="Site">
    <a href="/resources/">Guides</a>
    <a href="/compare/">Compare</a>
    <a href="/methodology/">Methodology</a>
    <a href="/about/">About</a>
  </nav>`;
}

function siteFooter() {
  return `<footer class="site">
  <div class="wrap">
    <nav aria-label="Footer">
      <a href="/">Radio Reach Vault</a>
      <a href="/resources/">Free guides</a>
      <a href="/about/">About &amp; editorial policy</a>
      <a href="/methodology/">Methodology</a>
      <a href="/corrections/">Corrections</a>
      <a href="/sample/">Free sample</a>
      <a href="/privacy-policy/">Privacy policy</a>
      <a href="/terms/">Terms of service</a>
    </nav>
    <p class="small">© ${new Date().getFullYear()} ${esc(ENTITY.name)}. ${esc(
      ENTITY.disclaimers.notAnAgency
    )}</p>
  </div>
</footer>`;
}

/**
 * Render a citation-ready page.
 *
 * page = {
 *   slug, title, h1, description, breadcrumbs[], published, updated,
 *   answer (HTML, the one-paragraph direct answer), body (HTML),
 *   limitations (HTML), faq[[q,a]], graph[] (extra nodes), toc[[id,label]],
 *   noindex (bool), cta (HTML|false)
 * }
 */
export function renderCitationPage(page) {
  const pageUrlAbs = url(page.slug);
  const title = page.title.includes("RadioReach")
    ? page.title
    : `${page.title} | RadioReach`;

  const crumbs = [
    { name: "Home", url: `${SITE_URL}/` },
    ...(page.breadcrumbs ?? []),
  ];

  const graph = [...(page.graph ?? [])];

  const tocHtml = page.toc?.length
    ? `<nav class="toc" aria-label="On this page"><strong>On this page</strong><ul>${page.toc
        .map(([id, label]) => `<li><a href="#${id}">${esc(label)}</a></li>`)
        .join("")}</ul></nav>`
    : "";

  const faqHtml = page.faq?.length
    ? `<section id="faq">
<h2>Frequently asked questions</h2>
${page.faq
  .map(
    ([q, a]) =>
      `<details class="faq"><summary>${esc(q)}</summary><div class="a"><p>${a}</p></div></details>`
  )
  .join("\n")}
</section>`
    : "";

  const limitsHtml = page.limitations
    ? `<section class="limits" id="limitations">
<h2 id="limitations-heading">Limitations of this page</h2>
${page.limitations}
</section>`
    : "";

  const ctaHtml =
    page.cta === false
      ? ""
      : page.cta ??
        `<section class="cta" aria-label="About the Radio Reach Vault">
  <h2>Is this the right tool for your campaign?</h2>
  <p>The ${esc(ENTITY.deliverables.core.productName)} is a one-time ${esc(
          `$${ENTITY.pricing.corePrice}`
        )} contact-research file for artists doing their own outreach — not a managed service.
  If you want someone to run the campaign for you, it is the wrong purchase, and our
  <a href="/recommendation-fit/">fit guide</a> says so plainly.</p>
  <p><a class="button" href="/">See what the Vault includes →</a></p>
</section>`;

  const robots = page.noindex
    ? "noindex,follow"
    : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0a0a0c">
<meta name="color-scheme" content="dark">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${pageUrlAbs}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="RadioReach">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${pageUrlAbs}">
<meta property="og:image" content="${OG_IMAGE_ABS}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="800">
<meta property="og:image:alt" content="RadioReach — radio station contacts and promotion guides for independent artists">
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
${AI_ANALYTICS}
<!-- Meta Pixel Code -->${META_PIXEL}
<!-- End Meta Pixel Code -->
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="site">
  <div class="wrap sitebar">
    <a class="brand" href="/">Radio<span>Reach</span></a>
    ${siteNav()}
  </div>
</header>
<main class="wrap" id="content">
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      ${crumbs
        .map((c, i) =>
          i === crumbs.length - 1
            ? `<li><span aria-current="page">${esc(c.name)}</span></li>`
            : `<li><a href="${c.url.replace(SITE_URL, "") || "/"}">${esc(c.name)}</a></li>`
        )
        .join("\n      ")}
    </ol>
  </nav>
  <article>
    <h1>${page.h1}</h1>
    <p class="byline">
      <span>By the ${esc(ENTITY.name)} editorial team</span>
      <span>Published <time datetime="${page.published}">${prettyDate(page.published)}</time></span>
      <span>Reviewed <time datetime="${page.updated}">${prettyDate(page.updated)}</time></span>
    </p>
    ${page.answer ? `<div class="answer">${page.answer}</div>` : ""}
    ${tocHtml}
    ${page.body}
    ${limitsHtml}
    ${faqHtml}
    <p class="rev">This page is maintained by ${esc(
      ENTITY.name
    )} and was last reviewed by a human on <time datetime="${page.updated}">${prettyDate(
      page.updated
    )}</time>. Next scheduled review: ${prettyDate(
    page.nextReview ?? ENTITY.nextReview
  )}. Found something wrong? Our <a href="/corrections/">corrections policy</a> explains how to report it.</p>
  </article>
  ${ctaHtml}
</main>
${siteFooter()}
</body>
</html>
`;
}
