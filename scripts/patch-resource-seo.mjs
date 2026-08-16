/**
 * One-shot maintenance script used to normalise the <head> of the static
 * resource pages in public/resources/*. Kept in the repo so the same SEO
 * baseline can be re-applied if a page is hand-edited later.
 *
 *   node scripts/patch-resource-seo.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RESOURCES = path.join(ROOT, "public", "resources");
const ORIGIN = "https://radioreach.us";

const IMAGE = `${ORIGIN}/images/radioreach-share-v2.jpg`;
const IMAGE_ALT =
  "RadioReach — radio station contact database for independent musicians";
const TODAY = "2026-08-16";

const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].trim() : "";
};

const decode = (s) =>
  s
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const jsonEsc = (s) => JSON.stringify(decode(s));

const stripTags = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const PIXEL = `<!-- Meta Pixel — deferred so it never blocks first paint. -->
<script>
window.fbq=window.fbq||function(){(window.fbq.queue=window.fbq.queue||[]).push(arguments)};
function __rrLoadPixel(){if(window.__rrPixelLoaded)return;window.__rrPixelLoaded=!0;
!function(f,b,e,v,n,t,s){if(f.fbq&&f.fbq.loaded)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=(window.fbq&&window.fbq.queue)||[];
t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','2551277695315034');fbq('track','PageView');}
if(document.readyState==='complete'){setTimeout(__rrLoadPixel,0)}
else{window.addEventListener('load',function(){setTimeout(__rrLoadPixel,0)},{once:true})}
['pointerdown','keydown','touchstart'].forEach(function(e){
window.addEventListener(e,__rrLoadPixel,{once:true,passive:true})});
</script>
<noscript><img height="1" width="1" style="display:none" alt=""
src="https://www.facebook.com/tr?id=2551277695315034&amp;ev=PageView&amp;noscript=1"></noscript>`;

const slugs = readdirSync(RESOURCES, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const slug of slugs) {
  const file = path.join(RESOURCES, slug, "index.html");
  let html = readFileSync(file, "utf8");

  const url = `${ORIGIN}/resources/${slug}/`;
  const title = pick(html, /<title>([\s\S]*?)<\/title>/);
  const description = pick(html, /<meta name="description" content="([^"]*)"/);
  const h1 = stripTags(pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/));
  const style = pick(html, /(<style>[\s\S]*?<\/style>)/) || "";

  // FAQ schema from the question-shaped H2s in the article body
  const faq = [];
  const sectionRe =
    /<section><h2>([^<]*\?)<\/h2>([\s\S]*?)<\/section>/g;
  let m;
  while ((m = sectionRe.exec(html))) {
    const q = decode(m[1].trim());
    const a = decode(stripTags(m[2]));
    if (q && a) faq.push({ q, a });
  }

  const graph = [
    `{
      "@type":"Article",
      "@id":${jsonEsc(url + "#article")},
      "headline":${jsonEsc(h1)},
      "description":${jsonEsc(description)},
      "inLanguage":"en-US",
      "datePublished":"2026-08-07",
      "dateModified":"${TODAY}",
      "image":${jsonEsc(IMAGE)},
      "mainEntityOfPage":{"@id":${jsonEsc(url + "#webpage")}},
      "author":{"@id":${jsonEsc(ORIGIN + "/#organization")}},
      "publisher":{"@id":${jsonEsc(ORIGIN + "/#organization")}}
    }`,
    `{
      "@type":"WebPage",
      "@id":${jsonEsc(url + "#webpage")},
      "url":${jsonEsc(url)},
      "name":${jsonEsc(title)},
      "description":${jsonEsc(description)},
      "inLanguage":"en-US",
      "isPartOf":{"@id":${jsonEsc(ORIGIN + "/#website")}},
      "breadcrumb":{"@id":${jsonEsc(url + "#breadcrumb")}}
    }`,
    `{
      "@type":"Organization",
      "@id":${jsonEsc(ORIGIN + "/#organization")},
      "name":"RadioReach",
      "url":${jsonEsc(ORIGIN + "/")},
      "logo":{"@type":"ImageObject","url":${jsonEsc(IMAGE)}}
    }`,
    `{
      "@type":"WebSite",
      "@id":${jsonEsc(ORIGIN + "/#website")},
      "url":${jsonEsc(ORIGIN + "/")},
      "name":"RadioReach",
      "inLanguage":"en-US",
      "publisher":{"@id":${jsonEsc(ORIGIN + "/#organization")}}
    }`,
    `{
      "@type":"BreadcrumbList",
      "@id":${jsonEsc(url + "#breadcrumb")},
      "itemListElement":[
        {"@type":"ListItem","position":1,"name":"RadioReach","item":${jsonEsc(ORIGIN + "/")}},
        {"@type":"ListItem","position":2,"name":"Resources","item":${jsonEsc(ORIGIN + "/resources/")}},
        {"@type":"ListItem","position":3,"name":${jsonEsc(h1)},"item":${jsonEsc(url)}}
      ]
    }`,
  ];

  if (faq.length) {
    graph.push(`{
      "@type":"FAQPage",
      "@id":${jsonEsc(url + "#faq")},
      "isPartOf":{"@id":${jsonEsc(url + "#webpage")}},
      "mainEntity":[${faq
        .map(
          (f) =>
            `{"@type":"Question","name":${JSON.stringify(
              f.q
            )},"acceptedAnswer":{"@type":"Answer","text":${JSON.stringify(
              f.a
            )}}}`
        )
        .join(",")}]
    }`);
  }

  const head = `<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0a0a0a">
<meta name="color-scheme" content="dark">
<meta name="referrer" content="strict-origin-when-cross-origin">

<title>${esc(decode(title))}</title>
<meta name="description" content="${esc(decode(description))}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en-US" href="${url}">
<link rel="alternate" hreflang="x-default" href="${url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">

<meta property="og:type" content="article">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(decode(title))}">
<meta property="og:description" content="${esc(decode(description))}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="RadioReach">
<meta property="og:image" content="${IMAGE}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="800">
<meta property="og:image:alt" content="${IMAGE_ALT}">
<meta property="article:published_time" content="2026-08-07">
<meta property="article:modified_time" content="${TODAY}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(decode(title))}">
<meta name="twitter:description" content="${esc(decode(description))}">
<meta name="twitter:image" content="${IMAGE}">
<meta name="twitter:image:alt" content="${IMAGE_ALT}">

<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[${graph.join(",")}]}
</script>

${style}
${PIXEL}
</head>`;

  html = html.replace(/<head>[\s\S]*?<\/head>/, head);

  // Accessible, crawlable breadcrumb trail in the body
  html = html.replace(
    /<nav>\s*<a href="\/">RadioReach<\/a> \/ Resources\s*<\/nav>/,
    `<nav aria-label="Breadcrumb">
<ol>
<li><a href="/">RadioReach</a></li>
<li><a href="/resources/">Resources</a></li>
<li aria-current="page">${esc(h1)}</li>
</ol>
</nav>`
  );

  writeFileSync(file, html);
  console.log(`patched ${slug} (${faq.length} FAQ entries)`);
}
