<p align="center">
  <a href="https://radioreach.us" aria-label="Visit RadioReach">
    <img src="./public/images/radioreach-share-v2.png" alt="RadioReach — 18,000+ radio contacts for independent artists" width="100%" />
  </a>
</p>

<h1 align="center">RadioReach Funnel</h1>

<p align="center">
  <strong>A conversion-focused, edge-native storefront that turns discovery into secure digital delivery.</strong>
</p>

<p align="center">
  RadioReach combines an adaptive React sales experience, Stripe Embedded Checkout,<br />
  verified Cloudflare fulfillment, and private R2 downloads in one production commerce flow.
</p>

<p align="center">
  <a href="https://radioreach.us"><strong>View the live experience</strong></a>
  ·
  <a href="./CLOUDFLARE_STRIPE_R2_SETUP.md">Commerce setup</a>
  ·
  <a href="./DEPLOY.md">Deployment guide</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=07111A" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Stripe-Embedded_Checkout-635BFF?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe Embedded Checkout" />
  <img src="https://img.shields.io/badge/Cloudflare-Edge_Native-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare edge native" />
</p>

---

## Overview

**RadioReach Funnel** is the production commerce experience behind [RadioReach](https://radioreach.us), a radio-promotion resource for independent musicians. It takes a visitor from a long-form, mobile-first sales page through an on-page payment experience and into verified, private file delivery—without requiring a traditional always-on application server.

The frontend is a React and TypeScript application deployed on Cloudflare Pages. Commerce and fulfillment run through Cloudflare Pages Functions, Stripe, KV, and a private R2 bucket. Product selection, payment confirmation, attribution, order state, and download authorization are carried across the entire journey.

> [!IMPORTANT]
> This is a private production storefront, not a reusable checkout template. Use Stripe test mode and non-production Cloudflare resources for local development and preview deployments.

## What makes it different

| Capability | Implementation |
| --- | --- |
| **Conversion-led experience** | Responsive long-form sales page, interactive proof, offer stacking, exit intent, sticky CTAs, checkout add-ons, modular upsell screens, and a focused post-purchase journey. |
| **Adaptive copy system** | The Emotional State Proxy (ESP) interprets passive behavioral signals and gently adjusts tone—never price, offer terms, or product facts. |
| **First-party intent capture** | A feature-flagged Momentum + Ownership sequence records low-cardinality intent and carries it into Stripe metadata, fulfillment, and analytics. |
| **Embedded payments** | Stripe Embedded Checkout keeps delivery and payment details inside the branded experience while Stripe handles sensitive card data. |
| **Verified fulfillment** | Signed Stripe webhooks, idempotent KV order records, HMAC fulfillment tokens, and server-generated R2 URLs ensure files unlock only for paid items. |
| **Edge-native operations** | Static assets and serverless functions deploy together on Cloudflare Pages, with no persistent origin server to provision or maintain. |
| **Measurement-ready** | UTM capture, Meta Pixel, server-side Meta Conversions API, browser/server event deduplication, `dataLayer`, and first-party DOM analytics events. |
| **Search and performance foundations** | Structured data, Open Graph metadata, sitemap, resource pages, responsive imagery, route-level code splitting, security headers, and accessible interaction patterns. |

## Customer journey

1. **Discover** — the visitor enters a responsive, SEO-aware sales experience built for independent artists.
2. **Engage** — ESP and the Momentum sequence respond to behavior and intent while preserving the underlying offer.
3. **Configure** — the buyer selects the core vault and optional add-ons; totals update immediately.
4. **Pay** — the browser sends product keys—not trusted prices—to a Pages Function, which resolves server-allowlisted Stripe Price IDs.
5. **Confirm** — Stripe sends a signed webhook; the function verifies it and writes an idempotent order record to KV.
6. **Unlock** — the success screen verifies both Stripe payment state and the stored order before requesting a signed fulfillment token.
7. **Deliver** — the download endpoint authorizes only purchased products and returns time-limited URLs for objects in private R2 storage.
8. **Measure** — purchase events are sent through browser and server channels with a shared Stripe session ID for deduplication.

## Architecture

```mermaid
flowchart LR
    U[Visitor] --> P[Cloudflare Pages CDN]

    subgraph Browser
      P --> S[React sales experience]
      S --> C[Embedded Stripe checkout]
      C --> X[Verified success screen]
    end

    subgraph Cloudflare[Cloudflare edge]
      F[Pages Functions API]
      K[(KV order store)]
      R[(Private R2 bundles)]
    end

    S -->|Product keys + attribution| F
    F -->|Allowlisted Price IDs| T[Stripe]
    C <-->|Secure payment UI| T
    T -->|Signed webhook| F
    F <-->|Orders + event deduplication| K
    X -->|Verify session| F
    F -->|Check payment state| T
    X -->|Fulfillment token| F
    F -->|Check object + sign request| R
    F -->|Time-limited download URL| X
    X -->|Authorized file request| R
    F -.->|Deduplicated Purchase event| M[Meta CAPI]
```

### Security model

- **Stripe owns card-data collection.** The application never renders or processes raw card number, expiry, or CVC fields.
- **The browser submits product keys, not prices.** Pages Functions map those keys to a server-side allowlist of configured Stripe Price IDs.
- **Webhook signatures are verified against the raw request body** before an order can become eligible for fulfillment.
- **Webhook events are deduplicated in KV** to make retries safe and prevent duplicate downstream conversion events.
- **Success-page access alone cannot fulfill an order.** Stripe payment state and the KV order record must both verify.
- **Fulfillment tokens are HMAC-SHA256 signed and expire.** Download requests with missing, altered, or expired tokens are rejected.
- **R2 remains private.** Purchased objects are exposed only through scoped, time-limited presigned URLs.
- **Secrets remain server-side.** Only `VITE_*` values are compiled into the browser bundle.

## Technology stack

| Layer | Technology | Responsibility |
| --- | --- | --- |
| UI | React 19, TypeScript | Funnel stages, checkout state, adaptive content, delivery UI |
| Styling | Tailwind CSS 4 | Responsive design system, motion, and accessible states |
| Build | Vite 7 | Development server, optimization, and production bundling |
| Payments | Stripe Checkout + Stripe.js | Embedded payment collection, sessions, invoices, and webhooks |
| Runtime | Cloudflare Pages + Pages Functions | Static delivery and edge API routes |
| State | Cloudflare KV | Order records, fulfillment status, and webhook idempotency |
| Files | Cloudflare R2 + AWS S3 SDK | Private bundle storage and presigned download URLs |
| Analytics | Meta Pixel, Meta CAPI, `dataLayer` | Funnel events, attribution, and browser/server purchase deduplication |
| Tests | jsdom + custom TypeScript runner | ESP decision logic and browser-level integration scenarios |

## Repository layout

```text
radioreach-funnel/
├── functions/
│   ├── _lib/                    # Stripe, KV, R2, token, and analytics helpers
│   └── api/                     # Checkout, verification, webhook, and download routes
├── public/
│   ├── images/                  # Production artwork and responsive media
│   ├── resources/               # Search-focused editorial landing pages
│   ├── privacy-policy/          # Static privacy policy
│   └── terms/                   # Static terms page
├── scripts/                     # ESP unit/integration test harness and asset tooling
├── src/
│   ├── config/                  # Storefront catalog and feature controls
│   ├── esp/                     # Emotional State Proxy engine and adaptive copy
│   ├── funnel/                  # Sales, checkout, upsell, and success experiences
│   ├── lib/                     # API, attribution, and analytics clients
│   └── App.tsx                  # Funnel orchestration and success routing
├── CLOUDFLARE_STRIPE_R2_SETUP.md
├── DEPLOY.md
├── vite.config.ts
└── wrangler.jsonc
```

## Getting started

### Prerequisites

- **Node.js 22.22+** recommended for the current Vite and jsdom toolchain
- **npm**
- A **Stripe** account for checkout testing
- A **Cloudflare** account with Pages, KV, and R2 for end-to-end development
- Optional: the [Stripe CLI](https://docs.stripe.com/stripe-cli) for local webhook forwarding

### Install

```bash
git clone https://github.com/zazieproductions/radioreach-funnel.git
cd radioreach-funnel
npm ci
```

### Frontend development

Create `.env.local` with a Stripe **test-mode** publishable key:

```dotenv
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Optional feature controls; both default to enabled.
VITE_ESP_ENABLED=true
VITE_MOMENTUM_SEQUENCE_ENABLED=true
```

Then start Vite:

```bash
npm run dev
```

The sales experience and client interactions work in Vite. Checkout, webhook verification, KV order state, and private downloads require the Cloudflare Functions runtime described below.

### Full-stack local development

Create a local `.dev.vars` file for Pages Functions. **Never commit this file.**

```dotenv
# Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_local_webhook_secret
STRIPE_PRICE_VAULT_CORE=price_...
STRIPE_PRICE_CONTRACT_BUNDLE=price_...
STRIPE_PRICE_AUSTRALIA_ADDON=price_...
STRIPE_PRICE_AIRPLAY_ACCELERATOR=price_...
STRIPE_PRICE_UPWORK_COURSE=price_...

# Application
PUBLIC_APP_URL=http://localhost:8788
APP_SECRET=replace_with_a_long_random_secret

# Private R2 access
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_private_bucket_name

# Optional Meta Conversions API
META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=
META_TEST_EVENT_CODE=
```

Build the frontend and serve it together with Pages Functions:

```bash
npm run build
npx wrangler pages dev dist --port 8788
```

In a second terminal, forward Stripe events:

```bash
stripe listen \
  --forward-to http://localhost:8788/api/stripe/webhook \
  --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed
```

Copy the webhook signing secret printed by Stripe into `STRIPE_WEBHOOK_SECRET`, restart Wrangler, and complete purchases with [Stripe test cards](https://docs.stripe.com/testing#cards).

> [!TIP]
> Generate a suitable local `APP_SECRET` with `openssl rand -hex 32`. Keep test and production credentials strictly separated.

## Environment reference

### Browser build variables

| Variable | Required | Purpose |
| --- | :---: | --- |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key compiled into the checkout bundle |
| `VITE_ESP_ENABLED` | No | Set to `false` to disable ESP for an entire build |
| `VITE_MOMENTUM_SEQUENCE_ENABLED` | No | Set to `false` to remove the Momentum sequence from a build |

### Pages Functions variables and secrets

| Variable | Required | Purpose |
| --- | :---: | --- |
| `STRIPE_SECRET_KEY` | Yes | Server-side Stripe API access |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signature verification |
| `STRIPE_PRICE_*` | Yes | Server-controlled Price IDs for every enabled catalog item |
| `PUBLIC_APP_URL` | Yes | Canonical application origin and redirect fallback |
| `APP_SECRET` | Recommended | Dedicated HMAC key for fulfillment tokens |
| `R2_ACCOUNT_ID` | Yes | Cloudflare account used by the R2 S3-compatible endpoint |
| `R2_ACCESS_KEY_ID` | Yes | R2 API credential used for object checks and signing |
| `R2_SECRET_ACCESS_KEY` | Yes | Secret half of the R2 API credential |
| `R2_BUCKET_NAME` | Yes | Private bucket containing deliverable bundles |
| `META_PIXEL_ID` | No | Enables server-side Meta Purchase events |
| `META_CAPI_ACCESS_TOKEN` | No | Authorizes Meta Conversions API requests |
| `META_TEST_EVENT_CODE` | No | Routes CAPI events into Meta Test Events during validation |

### Cloudflare bindings

| Binding | Type | Purpose |
| --- | --- | --- |
| `ORDER_STORE` | KV namespace | Paid-order records, fulfillment state, and webhook event deduplication |

## API surface

| Method | Route | Responsibility |
| --- | --- | --- |
| `POST` | `/api/checkout/session` | Validate selected product keys and create an embedded Stripe Checkout Session |
| `POST` | `/api/checkout/tip` | Create an optional, allowlisted post-purchase tip session |
| `GET` | `/api/checkout/verify` | Reconcile Stripe payment state with the stored KV order and issue a fulfillment token |
| `POST` | `/api/downloads/session` | Validate the token and create private links for purchased R2 objects |
| `POST` | `/api/stripe/webhook` | Verify Stripe events, persist order state, deduplicate retries, and dispatch CAPI purchases |

## Product catalog

The browser and edge runtime intentionally maintain separate product definitions:

- `src/config/storefront.ts` controls customer-facing names, prices, copy, and funnel placement.
- `functions/_lib/config.ts` is the server-side allowlist for Stripe environment variables and R2 object keys.

When adding or changing a product:

1. Upload the bundle to the **private** R2 bucket.
2. Create matching Stripe Products and Prices in test mode, then production.
3. Update both catalog files with the same product key and R2 object key.
4. Configure the corresponding `STRIPE_PRICE_*` environment variable.
5. Expose the product in checkout, an upsell, or the delivery experience.
6. Test payment, webhook persistence, entitlement boundaries, and download expiry end to end.

See [`CLOUDFLARE_STRIPE_R2_SETUP.md`](./CLOUDFLARE_STRIPE_R2_SETUP.md) for the complete operational checklist.

## Feature controls and QA

### Emotional State Proxy

ESP is a client-side behavioral state engine with four modes: `default`, `calm`, `aspire`, and `urgency`. Signal scores decay over time, mode changes require confidence and a cooldown, and copy variants crossfade without causing layout shift.

| Control | Effect |
| --- | --- |
| `VITE_ESP_ENABLED=false` | Disable ESP at build time |
| `?esp=off` | Disable ESP for the current visit |
| `localStorage.setItem("esp.disabled", "1")` | Disable ESP persistently in the current browser |
| `?esp=debug` | Show the live signal, score, event, and mode overlay |
| `?esp=calm`, `?esp=aspire`, `?esp=urgency` | Force a mode for copy review |

Read the implementation notes in [`src/esp/README.md`](./src/esp/README.md).

### Momentum + Ownership sequence

- **Build-time hard switch:** `VITE_MOMENTUM_SEQUENCE_ENABLED=false`
- **Runtime kill switch:** set `window.__RADIOREACH_FLAGS__.momentumOwnershipSequence` to `false` before the application bundle runs.

The sequence stores answers under `radioreach:momentum-ownership:v1`, emits lifecycle analytics, and attaches normalized `sequence_*` attribution to checkout and purchase events.

## Scripts and quality checks

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the optimized production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run test:esp` | Run ESP decision-logic and jsdom integration scenarios |
| `npx tsc --noEmit` | Run the strict frontend TypeScript check |

Before opening a pull request, run:

```bash
npm run test:esp
npx tsc --noEmit
npm run build
```

## Deployment

RadioReach is designed for Cloudflare Pages Git deployments.

| Pages setting | Value |
| --- | --- |
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Recommended Node version | `22` |

A production release also requires:

- the `ORDER_STORE` KV binding;
- all Stripe, application, and R2 secrets configured in Pages;
- production Stripe Price IDs and a live publishable key;
- a private R2 bucket populated at the catalog object keys;
- a Stripe webhook pointing to `https://radioreach.us/api/stripe/webhook`;
- the `checkout.session.completed` event, plus asynchronous payment success/failure events if those payment methods are enabled;
- a full test purchase confirming that only paid bundles unlock.

For deployment options and cache/header behavior, see [`DEPLOY.md`](./DEPLOY.md).

## Contributing

This repository supports a production commerce property. Keep changes focused, reviewable, and safe to deploy:

1. Work on a dedicated branch.
2. Use Stripe test mode and preview Cloudflare resources.
3. Keep client and server catalog definitions synchronized.
4. Include tests for changes to behavioral state or fulfillment logic.
5. Run the full quality-check sequence above.
6. Never commit API keys, webhook secrets, customer data, order exports, or private product files.

## Ownership

Copyright © 2026 RadioReach. All rights reserved.

This repository does not include an open-source license. Access to the source does not grant permission to copy, redistribute, sublicense, or use it outside authorized RadioReach development and operations.
