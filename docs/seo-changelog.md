# SEO Changelog — radioreach.us

Public-facing freshness signals (visible "Updated" dates, sitemap lastmod, hub
"Recently updated" block) are generated from the `updated` fields in
`scripts/resources/content-*.mjs` — **only bump a date when the page actually
changed.** This file records what changed and why, so GSC movement can be
traced back to specific work.

## 2026-09-30 — Product snippet warnings triaged (no markup change)

- GSC reported two **non-critical** Product snippet items on `/`:
  `aggregateRating` and `review`. Neither is a required property — Google
  requires `name` plus one of `offers` / `review` / `aggregateRating`, and the
  homepage `Product` (`#radio-reach-vault`) already ships a valid `Offer`
  (USD 25.00, `InStock`, canonical URL, `RadioReach` seller). Snippet
  eligibility is unaffected.
- No structured data changed: there is still no verifiable first-party rating
  set, and inventing one violates Google's structured data policies. Standing
  explanation and the legitimate paths to clear the warnings (a real
  post-purchase review flow, or Merchant Center ratings) are documented in
  `docs/product-snippets.md`.
- Added `scripts/test-structured-data.ts` (`npm run test:seo`) as a regression
  guard: it asserts the homepage JSON-LD parses, contains exactly one `Product`
  with `name` + a qualifying `Offer`, that price/currency match
  `src/config/storefront.ts` and the OG product meta tags, and that
  canonical/image/brand/seller references resolve. It intentionally never
  requires `aggregateRating` or `review`, so the warnings can't be "fixed" by
  fabricated values.

## 2026-08-18 — SEO pass 1: content library + technical foundation

### Content expansion (12 pages + hub)
- New `/resources/` hub: categorized library with auto "Recently updated",
  `CollectionPage` + `ItemList` schema. (The old breadcrumb pointed to a
  resources index that did not exist.)
- New guides: `how-to-get-your-song-on-the-radio` (HowTo schema),
  `radio-pitch-email-templates`, `electronic-press-kit-radio`,
  `diy-radio-promotion-vs-radio-promoter`, `hip-hop-radio-promotion`,
  `electronic-music-radio-promotion`, `country-radio-promotion`,
  `radio-promotion-glossary` (40+ terms, `DefinedTermSet`),
  `radio-promotion-faq` (FAQPage schema).
- Existing 3 guides upgraded in place (same URLs): added sections, FAQs,
  breadcrumbs, TOC, dates, full OG/Twitter cards.

### Technical
- All guide pages rebuilt from `scripts/build-resources.mjs`: consistent
  canonicals, hreflang-free single-locale metadata, BreadcrumbList schema,
  author/datePublished/dateModified, skip-link, semantic HTML, inline CSS
  (no render-blocking requests), system fonts.
- Sitemap regenerated with all 16 indexable URLs + honest lastmod dates.
- Homepage OG/Twitter image switched from 1.9 MB PNG to 192 KB 1200×800 JPEG
  (`/images/og/radioreach-share-1200x800.jpg`); added `og:image:alt`,
  `twitter:image:alt`, `og:locale`.
- Homepage footer: added links to resources hub, privacy, terms (previously
  orphaned legal pages). "Free Radio Promotion Guides" section expanded from
  3 to 8 links.
- 404 page: added recirculation links (still noindex).
- `_headers`: explicit `must-revalidate` for all HTML, HSTS, hourly cache for
  sitemap/robots/llms.txt.
- Removed stale committed `dist/_redirects` whose `/* /index.html 200`
  catch-all served the homepage with HTTP 200 for every unknown URL (soft 404s).
  The SPA uses hash routing, so no fallback rewrite is needed; real 404s now
  return the 404 status via `404.html`.
- `llms.txt` rewritten to cover the full library.
- Added `docs/seo-measurement.md` (GSC/CWA runbook).

### Intentionally not done
- No programmatic state/city landing pages: without a real per-state station
  dataset in the repo, templated pages would be thin content. Revisit only if
  the Vault export can seed genuinely unique per-state data.
- No `aggregateRating` or review markup on the Product schema: no verifiable
  first-party review data; fabricating it violates Google's structured data
  policies.
- FAQ rich-result eligibility note: Google restricted FAQ rich results to
  government/health sites in 2023. FAQPage markup is kept (valid, used by
  other engines, reinforces Q&A semantics) but no Google FAQ rich result
  should be expected.
