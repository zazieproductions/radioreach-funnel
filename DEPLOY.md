# Deploying RadioReach to Cloudflare Pages

## Build and deployment

Use Node 22.13 or newer (Node 22 recommended).

```sh
npm ci
npm run lint
npm test
npm run build
```

The build produces `dist/index.html`, hashed JS/CSS in `dist/assets/`, and static legal/resource pages. Deploy from the repository root using Pages Git integration (build command `npm run build`, output `dist`) or Wrangler:

```sh
npx wrangler pages deploy dist --project-name=<existing-pages-project>
```

Use the existing project name from the Cloudflare dashboard, not a newly created project. **Do not use dashboard drag-and-drop:** uploading only `dist` omits the `functions/` checkout, verification, webhook, and download APIs. Wrangler must run from the repository root so it bundles `functions/` and reads `wrangler.jsonc`.

## Required production configuration

- Set build variable `VITE_STRIPE_PUBLISHABLE_KEY` before building. It is compiled into browser assets; setting it only after a build does not work.
- Configure runtime secrets `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `APP_SECRET`.
- Configure each `STRIPE_PRICE_*` variable used by `functions/_lib/config.ts`. All prices and publishable/secret keys must belong to the same Stripe account and test/live mode.
- Keep `ORDER_STORE` bound to the intended production KV namespace.
- Runtime download signing requires `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`. The R2 binding alone does not configure these S3 signing credentials. Keep the bucket private.
- Preserve `nodejs_compat` in `wrangler.jsonc` for Node-dependent SDKs.
- Configure preview separately; do not point test purchases at production KV or live Stripe prices.

Never put secret keys in `VITE_*` variables or commit them.

## Stripe webhook and post-deploy smoke checks

Configure Stripe to send `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed` to `https://<production-domain>/api/stripe/webhook`. Use that endpoint's signing secret.

1. Verify `/api/checkout/session` handles POST as JSON, not static HTML/404. Bypass any dashboard Cache Everything or challenge rules for `/api/*`; responses include `Cache-Control: no-store`.
2. In an isolated test-mode preview, complete checkout, check successful Stripe webhook delivery, confirm the success page unlocks downloads, and open each download.
3. Confirm webhook retries do not duplicate orders and delayed payment success can create fulfillment even if it arrives before the completed event.
4. Check Cloudflare Functions logs for Stripe configuration or R2 access failures. Do not log secret keys or full checkout client secrets.

The success page retries pending verification and transient failures before displaying an error, with a manual Retry action. Longer delays or missing webhook delivery still require operational investigation.

## Resource pages and feature flags

Resource content lives in `scripts/resources/content-*.mjs`; `npm run build:resources` regenerates `public/resources/` and the sitemap. The production build runs this automatically.

Disable the Momentum sequence with `VITE_MOMENTUM_SEQUENCE_ENABLED=false` and rebuild, or set `window.__RADIOREACH_FLAGS__.momentumOwnershipSequence=false` in `index.html`. The runtime flag cannot override a build-time disable.
