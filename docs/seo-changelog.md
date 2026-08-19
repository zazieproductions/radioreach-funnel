# SEO Changelog — radioreach.us

Public-facing freshness signals (visible "Updated" dates, sitemap lastmod, hub
"Recently updated" block) are generated from the `updated` fields in
`scripts/resources/content-*.mjs` — **only bump a date when the page actually
changed.** This file records what changed and why, so GSC movement can be
traced back to specific work.

## 2026-08-19 — SEO pass 2: commercial clusters + safe programmatic expansion

### Search-led expansion (16 new pages)
- Commercial-intent resources for `radio station email list` and `music director
  contact list`, including a buyer-quality framework and Dataset schema where
  the downloadable contact resource is the factual main entity.
- Station-type cluster: community, internet, and public radio submission guides.
- Genre cluster expanded with indie rock, jazz, and metal campaign playbooks.
- Country cluster: Canada, United Kingdom, and Australia, each with distinct
  radio-market structure and applicable outreach/privacy considerations.
- State cluster: California, Texas, and New York market guides. These explicitly
  avoid pretending to be live station inventories and require first-party
  verification before outreach.
- Artist-goal cluster: tour-support checklist and radio-interview workflow.
- Resource hub now exposes every cluster in crawlable category grids; all new
  pages have breadcrumbs, contextual related links, FAQ schema, Article schema,
  canonical metadata, and sitemap entries.

### Technical, performance, security, and policy
- Added WebSite nodes to generated schema graphs, a factual homepage Dataset
  node, homepage FAQPage markup, raster Organization logos, Twitter image alt
  text, and fixed HowTo `totalTime` serialization.
- Added `npm run audit:seo`: checks all sitemap URLs for a corresponding HTML
  file, canonical, index directives, description length, exactly one resource
  H1, parseable JSON-LD, duplicate URLs, and broken resource links.
- Removed eager Stripe preconnects from the sales page. Checkout remains
  code-split; resource pages remain zero-framework static HTML with inline CSS.
- Upgraded Vite and audited dependencies; `npm audit` reports zero known
  vulnerabilities at this pass.
- Replaced unconditional Meta Pixel loading with an explicit accept/reject gate.
  Optional analytics stays off until acceptance, and the privacy page provides
  a preference control. Removed tracking pixels that executed without consent.
- Reconciled the Terms with the advertised 30-day refund policy, expanded legal
  page metadata/navigation, and updated truthful sitemap dates.
- Updated `llms.txt`, cache rules, homepage crawl paths, and shortened titles
  that were likely to truncate in search results.

### Guardrails
- No fabricated station records, submission status, review markup, ratings,
  airplay outcomes, or personal contacts.
- Programmatic pages are limited to dimensions with a distinct workflow and
  substantial original guidance; they state that policies and contacts must be
  verified on first-party station sites.
- No mass-email instructions, address harvesting, cloaking, doorway pages, or
  guaranteed-airplay claims.

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
