# SEO Measurement Runbook — RadioReach

This is the operating manual for finding *what to fix next*, not vanity metrics.
It is designed around free tooling: **Google Search Console** (required) plus
**Cloudflare Web Analytics** (recommended, cookieless) or **GA4** (optional).

Work it monthly. Every section ends in a prioritized action, not a report.

---

## 1. Instrumentation (one-time setup)

### Google Search Console — required
GSC is the only source of query-level impressions/CTR/position data. Without it,
sections 2–4 below are impossible.

1. Go to <https://search.console.google.com>, add property `radioreach.us`.
2. Verify via **URL prefix** + HTML tag, or via **Domain** property + the
   Cloudflare DNS TXT record (domain property is stronger — covers all subdomains).
3. Submit `https://radioreach.us/sitemap.xml` (Sitemaps → Add).
4. Confirm every URL in the sitemap shows "Discovered – Crawled – Indexed".

### Cloudflare Web Analytics — recommended
Cookieless, no consent banner needed, already on our infra:

1. Cloudflare dashboard → your domain → **Web Analytics** → Enable.
2. Add the beacon `<script>` snippet to `index.html` (before `</head>`) and to
   `scripts/resources/layout.mjs` (one place, regenerates all guide pages).
3. It answers: top pages, top referrers, countries, device mix — enough for a
   funnel this size, with zero privacy surface.

### GA4 — optional
Only if you need conversion funnels beyond Stripe/Meta reporting. If enabled,
set up via GTM or the gtag snippet with `transport_url` left default, and define
key events: `begin_checkout`, `purchase`.

---

## 2. High impressions, low CTR (title/description rewrites)

**Where:** GSC → Performance → Pages. Compare last 28 days vs previous period.

**Filter:** Pages with impressions > 200 and CTR below expected for position:

| Avg. position | Healthy CTR |
|---|---|
| 1–3 | > 10% |
| 4–10 | 3–10% |
| 11–20 | 1–3% |

**Save the query:** GSC → Performance → Pages → add secondary dimension
"Query" is limited; export the Pages report and the Queries report, join in a
sheet on page = landing page.

**Act:**
- Rewrite the `<title>` (front-load the primary intent, keep ≤ 60 chars).
- Rewrite the meta description as a 150–165 char answer to the query with a
  reason to click. For guide pages these live in
  `scripts/resources/content-*.mjs` (`description` field) — edit once,
  rerun `node scripts/build-resources.mjs`.
- Check whether the query deserves its own H2 section or FAQ entry instead.

---

## 3. Striking distance (page two → page one)

**Where:** GSC → Performance → **Queries** report, last 3 months.

**Target set:** Queries with average position 4–15 and impressions > 100.
These are the highest-ROI wins on the site.

**Act, in order of effort:**
1. Add an internal link to the page from 2–3 related guides, using the query
   as (or near) the anchor text. Every guide page has a "Related guides"
   block driven by the `related` field in its content file.
2. Add an H2/FAQ that directly answers the query in 40–60 words (snippet bait).
3. Expand the section covering the query with concrete detail competitors lack.
4. Update the page (real edits only), bump `updated`, rebuild — the sitemap,
   "Updated" dates, and hub "Recently updated" all refresh together.

---

## 4. Orphaned / weakly-linked pages

**Where:**
- GSC → Settings → Crawl stats (pages with low crawl = weak internal linking).
- GSC → Links → Internal links: sort ascending. Anything with < 3 internal
  links is under-served.

**Why our generator matters:** pages are built from content files that render
breadcrumbs, category navigation, related guides, and footer links
automatically — a new page ships with ≥ 5 internal links by construction.
Audit anyway after any manual HTML edits.

**Act:** add contextual in-body links from 2–3 topically-related pages
(the `related` field + in-body anchor text).

---

## 5. Content decay

**Where:** GSC → Performance → Pages → compare last 28 days vs same period
6 months earlier (use the date comparison toggle). Flag pages with clicks
down > 25% period-over-period while aggregate traffic is flat or up.

**Act:**
- Check the SERP yourself: did a feature (AI overview, FAQ block, competitor)
  absorb the clicks? Then differentiate: add a table, templates, or original
  structure the SERP lacks.
- If the content is genuinely dated, do a real update: revise claims, add a
  section, bump `updated`. Never fake-refresh (spinning dates with no edits
  is a spam-policy smell and burns user trust).
- Consider merging two weak overlapping pages and 301-redirecting one
  (add the redirect in the Cloudflare Pages project, not just the HTML).

---

## 6. Technical / crawl issues

**Monthly 5-minute checklist:**
- GSC → **Page indexing** report: watch "Crawled – not indexed" (thin/duplicate
  signal) and "Soft 404" (should be zero — the site serves a real 404 page with
  a 404 status; keep it that way, no SPA catch-all redirects).
- GSC → **Core Web Vitals** report: flag any template slipping. The guide
  template is inline-CSS, no web fonts, no JS beyond the pixel — it should
  stay green. The SPA homepage is the one to watch (it is the heavier template).
- Run <https://pagespeed.web.dev> on `/` (mobile) after any homepage change.
  Watch LCP (hero image is preloaded with `fetchpriority=high` — keep that)
  and INP (interaction handlers in the funnel).
- `site:radioreach.us` spot check: no parameters, no duplicates.

**Crawl-waste notes for this codebase:**
- `/api/*` is disallowed in robots.txt and returns no HTML — correct, keep.
- SPA funnel stages are hash-based, so checkout/upsells never create URLs.
- Stripe return URLs add `?tip=thanks` params to `/` — the canonical tag
  absorbs them; never link internally with those parameters.

---

## 7. Mobile usability

- Cloudflare Web Analytics → Devices: expect > 70% mobile. All guide pages are
  single-column, 16px+ body text, 44px+ tap targets (details/summary FAQ).
- Manual monthly pass: load the homepage and one guide on a real phone;
  check the sticky CTA doesn't cover content and no horizontal scroll exists.

---

## 8. Monthly cadence (put it in the calendar)

| Week | Task | Output |
|---|---|---|
| 1 | GSC review: CTR lows, striking distance | 3 title/desc rewrites + 2 content adds |
| 2 | Content decay + SERP checks | 1 real content refresh |
| 3 | Technical checklist + PSI mobile | Fix list, zero regressions |
| 4 | Internal links + measure last month's changes | Confirm CTR/position moved |

**Rule:** every change gets a note (date, page, what changed, expected effect)
in this file's companion `docs/seo-changelog.md`, so cause and effect are
traceable in GSC's comparison views.
