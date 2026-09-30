# Product snippets: "Missing field" warnings

## What Search Console is reporting

The homepage (`https://radioreach.us/`) has one `Product` node in its JSON-LD
graph (`index.html`, `#radio-reach-vault`) with a qualifying `Offer` (USD 25.00,
`InStock`, canonical URL, `RadioReach` seller). Google’s
[Product snippet documentation](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)
requires a `Product` to declare **`name`** and **at least one of**
`offers`, `review`, or `aggregateRating`.

`aggregateRating` and `review` are **recommended** properties, not required
ones — which is exactly why Search Console classifies both findings as
**"non-critical" (warnings)** rather than errors. The page is fully eligible
for product snippets today; the warnings flag enhancements Google could render
if the data existed.

## Why we do not "fix" them by adding markup

Both warnings are cleared only by adding **real** rating/review data:

- `aggregateRating` needs a genuine `ratingValue` and `reviewCount` derived
  from ratings actually collected and shown on the page.
- `review` needs a named reviewer (Person or Team), a rating, and review
  content visible to users.

The repository has no verifiable first-party review dataset. The testimonials
in `src/funnel/testimonials.ts` are not a structured rating set (no per-item
scores, no collection mechanism), and Google’s structured data policies treat
self-serving invented ratings as spam. The testimonials already carry an FTC
disclaimer that they are individual experiences, not guarantees.

Fabricating `aggregateRating`/`review` would trade two cosmetic warnings for a
manual-action risk against the whole domain. The decision to omit them was
already recorded in `docs/seo-changelog.md` (2026-08-18 — "Intentionally not
done"); this document is the standing explanation for the warnings.

## How to evaluate this notice

1. Open the URL Inspection / Rich Results report for `https://radioreach.us/`
   and confirm the only findings are these two **non-critical** items — no
   errors, and the `Offer` is detected.
2. Validate the live markup with the
   [Rich Results Test](https://search.google.com/test/rich-results) if the page
   was recently changed.
3. Confirm the price/availability in the markup still matches the live
   storefront before dismissing anything (`npm run test:seo` checks this).

## Options that would make the warnings legitimate

Pick these in order of effort; none are required for snippet eligibility.

1. **Ship a first-party review flow.** After purchase, collect a star rating
   (and optional text) tied to a verified order, store it, expose it in the
   page HTML, and only then emit:
   - `Product.aggregateRating` = `{ ratingValue, reviewCount, bestRating: 5 }`
     with the average computed from the stored ratings;
   - `Product.review` entries for each published review, each with a real
     `author.name`, `reviewRating`, and `reviewBody` that is visible on the page.
   Never emit a rating that is not also shown to users, and never aggregate
   third-party ratings that are not about this product.
2. **Leave the warnings in place.** They do not block product snippets and
   they cost nothing technically. Dismiss/acknowledge them in Search Console
   with a note pointing at this document so the state is intentional.
3. **Use Merchant Center ratings instead**, if the store is later listed in
   Merchant Center and the ratings come from an approved third-party
   provider — that keeps review data out of the site’s JSON-LD entirely.

## Guardrail

`npm run test:seo` (`scripts/test-structured-data.ts`) asserts the homepage
JSON-LD parses, contains exactly one `Product` with `name` + a qualifying
`Offer`, that price/currency match `src/config/storefront.ts` and the Open
Graph meta tags, and that image/canonical/brand/seller references resolve. It
deliberately never requires `aggregateRating` or `review`, so no future change
can be tempted to satisfy the warnings with fabricated values. Run it against
the built artifact with:

```bash
npm run build && RADIOREACH_HTML_PATH=dist/index.html npm run test:seo
```
