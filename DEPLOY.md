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
├── index.html        ← entire app, inlined (~92 kB gzipped)
├── _headers          ← security + cache rules
├── 404.html          ← real 404s for unknown URLs (no SPA catch-all:
│                       the app uses hash routing, so a /* /index.html
│                       fallback would only create soft-404s)
├── resources/        ← SEO guide library + hub (generated, see below)
├── sitemap.xml
└── images/
    └── ...
```

## Resource pages (SEO library)

The guide pages under `/resources/` are **generated** — do not edit the HTML in
`public/resources/` directly. Content lives in `scripts/resources/content-*.mjs`;
run:

```bash
npm run build:resources
```

That regenerates every guide page, the `/resources/` hub, and `public/sitemap.xml`
with consistent metadata, structured data, breadcrumbs, and internal links
(the build fails if a page is thin, a link is dead, or metadata is missing).
`npm run build` runs it automatically before Vite.

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

- **`public/_headers`** — long-lived immutable caching on `/images/*`,
  `must-revalidate` on all HTML, plus `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`, `Strict-Transport-Security` and a
  `Permissions-Policy` that disables FLoC/geolocation/mic/camera
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
