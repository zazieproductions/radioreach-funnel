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
├── _redirects        ← SPA fallback
└── images/
    ├── studio.jpg
    └── mockup.png
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

- **`public/_redirects`** — `/* /index.html 200` so every route serves the app
- **`public/_headers`** — long-lived immutable caching on `/images/*`,
  `must-revalidate` on `index.html`, plus `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options` and a `Permissions-Policy` that
  disables FLoC/geolocation/mic/camera
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
