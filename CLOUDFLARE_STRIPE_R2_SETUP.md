# RadioReach.us — Stripe + Cloudflare Pages + Private R2 Setup

## Architecture

- **Frontend:** React + Vite funnel served from Cloudflare Pages
- **Payments:** Stripe Embedded Checkout
- **Backend:** Cloudflare Pages Functions (no Node server)
- **Order verification:** Stripe webhook → KV-backed order records
- **File delivery:** private R2 objects via short-lived presigned GET URLs

## Cloudflare Pages build settings

| Setting | Value |
|---|---|
| Framework | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node version | `20` |

## Required Cloudflare bindings

### KV namespace
Bind a KV namespace as:

- `ORDER_STORE`

### R2 bucket
Create a **private** bucket. Do **not** attach a public custom domain.

Suggested bucket name:

- `radioreach-private-bundles`

### Environment variables / secrets
Add all values from `.env.example`.

For production on `radioreach.us`, set:

- `PUBLIC_APP_URL=https://radioreach.us`
- all `STRIPE_PRICE_*` values to **live** Price IDs
- `VITE_STRIPE_PUBLISHABLE_KEY` + `STRIPE_PUBLISHABLE_KEY` to the **live** publishable key
- `STRIPE_SECRET_KEY` to the **live** secret key

For preview / test, use `pk_test`, `sk_test`, and test-mode price IDs.

## Stripe Embedded Checkout flow

1. Frontend posts selected product keys to `/api/checkout/session`
2. Pages Function validates requested products against an **allowlist**
3. Function creates a Stripe Checkout Session with `ui_mode: embedded`
4. Function returns the `client_secret`
5. React mounts Stripe Embedded Checkout in-place
6. Stripe redirects back to `/#/success?session_id=...`
7. Success page verifies the session server-side via `/api/checkout/verify`
8. Webhook has already recorded the paid order in KV
9. Frontend requests `/api/downloads/session?session_id=...`
10. Function generates **short-lived** presigned R2 URLs only for purchased bundles

## Webhook setup

Create a webhook endpoint in Stripe pointing to:

- `https://radioreach.us/api/stripe/webhook`

Subscribe to at least:

- `checkout.session.completed`

Store the webhook signing secret in:

- `STRIPE_WEBHOOK_SECRET`

### Stripe CLI testing

```bash
stripe login
stripe listen --forward-to http://127.0.0.1:8788/api/stripe/webhook
```

Copy the printed webhook secret into your local `.dev.vars` or env.

To trigger a checkout flow in test mode, use Stripe test cards in the embedded form.

## Local development

Because Pages Functions require Cloudflare runtime bindings, use Wrangler dev when testing the backend:

```bash
npm run build
npx wrangler pages dev dist
```

If you prefer pure Vite for frontend-only work:

```bash
npm run dev
```

But checkout, webhooks, and download verification require Pages dev or deployed preview.

## R2 upload / replace bundle workflow

Upload ZIP files to the exact keys mapped in:

- `src/config/storefront.ts`
- `functions/_lib/config.ts`

Example keys:

- `vault/radio-reach-vault.zip`
- `addons/indie-music-contract-bundle.zip`
- `addons/australian-radio-contact-list.zip`
- `upsells/airplay-accelerator.zip`
- `upsells/advanced-upwork-proposals-course.zip`
- `upsells/arcane-type-vault.zip`

## Admin guide — add a new product

1. **Upload the ZIP** to private R2
   - Choose a unique object key, e.g. `upsells/new-product.zip`
2. **Create a Stripe Product + Price**
   - In test mode first, then live mode
3. **Map the product in client config**
   - Add it to `src/config/storefront.ts`
4. **Map the product in function allowlist**
   - Add it to `functions/_lib/config.ts`
5. **Add the price ID env var**
   - e.g. `STRIPE_PRICE_NEW_PRODUCT=price_...`
6. **Expose it in the funnel UI**
   - Checkout add-on, upsell page, or success downloads
7. **Test end-to-end in test mode**
   - Embedded checkout renders
   - Webhook receives `checkout.session.completed`
   - KV order record is created once
   - Success page verifies server-side
   - Download links appear only after payment
   - R2 links expire after 15 minutes

## Security notes

- Card data is handled **only by Stripe Embedded Checkout**
- The frontend never renders card number / expiry / CVC inputs
- All secret keys stay in Cloudflare env vars / secrets only
- Checkout session creation only accepts **allowlisted** price IDs from server config
- Fulfillment happens **only** after verified Stripe webhook receipt
- Success page alone never fulfills an order
- Download links are generated per verified session and expire quickly
- Private R2 buckets remain private; no direct public object URLs are exposed
- Duplicate webhook events are ignored using event-id dedupe in KV

## radioreach.us deployment checklist

- [ ] DNS for `radioreach.us` points to Cloudflare Pages project
- [ ] Live Stripe publishable key set in client env
- [ ] Live Stripe secret + live price IDs set in Pages env
- [ ] Webhook endpoint added in live Stripe dashboard
- [ ] R2 private bucket populated with all ZIP bundles
- [ ] KV namespace bound as `ORDER_STORE`
- [ ] `PUBLIC_APP_URL=https://radioreach.us`
- [ ] Test purchase completes and unlocks only paid bundles
