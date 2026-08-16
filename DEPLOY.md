# Deploying to Cloudflare Pages

This funnel builds to a **single self-contained `index.html`** (JS + CSS are inlined by
`vite-plugin-singlefile`). Deployment is drag-and-drop simple.

## Build

```bash
npm install
npm run build
```

Output lands in `dist/`:

```
dist/
├── index.html        ← app shell + SEO head
├── 404.html          ← real 404 page (served with a 404 status)
├── _headers          ← security + cache rules
├── _redirects        ← canonical redirects + 404 handling
├── robots.txt
├── sitemap.xml
├── llms.txt
├── resources/        ← static guide pages + /resources/ hub
├── privacy-policy/
├── terms/
└── images/
    ├── studio-640.jpg
    ├── studio-1280.jpg
    └── radioreach-share-v2.jpg   ← OG/Twitter share card
```

## Option A — Drag & Drop (fastest)

1. Go to **Cloudflare Dashboard → Workers & Pages → Create → Pages → Upload assets**
2. Give the project a name (e.g. `radio-reach-vault`)
3. **Drag the entire `dist` folder** onto the upload area
4. Click **Deploy site**

Live in ~20 seconds at `https://<project>.pages.dev`.

## Option B — Git integration (auto-deploy on push)

Connect the repo in Cloudflare Pages and use:

| Setting | Value |
|---|---|
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `18` or higher |

## Option C — Wrangler CLI

```bash
npm i -g wrangler
wrangler pages deploy dist --project-name=radio-reach-vault
```

## What's already configured

- **`public/_redirects`** — canonical 301s plus `/* /404.html 404`. The app uses
  **hash** routing (`/#/success`), so there are no path routes to rewrite; a
  catch-all `200` rewrite would turn every bad URL into a soft 404 that
  duplicates the homepage
- **`public/_headers`** — long-lived immutable caching on `/images/*`,
  `must-revalidate` on `index.html`, plus `X-Content-Type-Options`,
  `Referrer-Policy: strict-origin-when-cross-origin` (keeps referral
  attribution working), `X-Frame-Options`, `X-Robots-Tag: noindex` on `/api/*`,
  and a `Permissions-Policy` that disables FLoC/geolocation/mic/camera
- **Single-file bundle** — one HTTP request for the whole app; no chunk
  waterfall, no CORS surprises, works from any subpath
- **Relative asset paths** — deploys correctly on `*.pages.dev`, a custom
  domain, or a subdirectory
- **Testimonial photos** are hot-linked from the Pexels CDN, so they cost you
  no bandwidth and no storage

## Custom domain

Cloudflare Pages → your project → **Custom domains → Set up a domain**.
If the domain is already on Cloudflare, DNS is configured automatically and
SSL is issued within a minute.

## Momentum sequence feature flag

The mid-page Momentum + Ownership sequence has two kill switches:

1. **Runtime (fastest):** set `window.__RADIOREACH_FLAGS__.momentumOwnershipSequence`
   to `false` in `index.html`. The section is omitted entirely on the next page load.
2. **Build-time (hard off):** set `VITE_MOMENTUM_SEQUENCE_ENABLED=false` in the
   Cloudflare Pages environment and redeploy.

The runtime flag cannot turn the feature back on when the build-time flag is off.
Answers are stored under `radioreach:momentum-ownership:v1` in localStorage and
are also attached as low-cardinality `sequence_*` Stripe metadata. Client events
are sent to Meta as custom events, pushed to `dataLayer`, and dispatched as a
`radioreach:analytics` browser event. The tracked lifecycle is viewed, started,
each step completed, finished, and sequence CTA clicked. InitiateCheckout and
Purchase include the same `sequence_*` attribution for conversion analysis.

## SEO maintenance

- **Sitemap** — `public/sitemap.xml` lists every indexable URL. Add new pages
  there and bump `<lastmod>` when content changes materially.
- **Resource page heads** — `node scripts/patch-resource-seo.mjs` regenerates the
  canonical/OG/Twitter/JSON-LD block (Article + WebPage + BreadcrumbList +
  FAQPage) for everything under `public/resources/*`. Re-run it after editing a
  guide's title, description or H1.
- **Funnel states** — `src/App.tsx` swaps the `robots` meta to `noindex,nofollow`
  and retitles the document once the visitor leaves the sales screen, so
  checkout/upsell/success states never get indexed at the root URL.
- **Meta Pixel** — loaded on `load` (or first interaction) on every page so it
  never blocks first paint or LCP.
