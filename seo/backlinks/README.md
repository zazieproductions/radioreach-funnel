# RadioReach Backlink Pipeline

A reusable, terminal-based backlink acquisition system for
[RadioReach](https://radioreach.us) — a resource helping independent
musicians find radio-station contacts and conduct direct radio outreach.

The pipeline automates **discovery, scoring, qualification, asset selection,
outreach drafting, verification, and reporting** — but it never spams sites,
bypasses moderation, impersonates users, exploits abandoned domains, or places
links without permission. Anything that needs a human decision lands in a
review queue.

> **Google spam-policy note.** This system operates within Google's spam
> policies: no link schemes, no expired-domain repurposing for authority, no
> scaled content abuse, no disguised manipulation. Every link is earned through
> a genuine editorial fit or a legitimate directory submission.
> See [Google's Spam Policies for Web Search](https://developers.google.com/search/docs/essentials/spam-policies).

---

## Layout

```text
seo/backlinks/
  prospects.csv         All discovered opportunities (raw)
  qualified.csv         Scored ≥ 65 — ready for outreach prep
  rejected.csv          Rejected with reasons (score < 65 or rules)
  outreach-ready.csv    Personalized drafts awaiting human send
  submitted.csv         Log of every form submitted / email sent
  acquired.csv          Live backlinks, verified weekly
  lost.csv              Links that disappeared, with loss reason
  templates/            Outreach message templates
  reports/              Weekly + on-demand acquisition reports
  assets/               Linkable assets index (the pitchable library)
  scripts/              CLI pipeline (Node.js, no external deps)
```

## Quick start

```bash
# Discover prospects (demo mode: realistic sample data, no network)
./seo/backlinks/scripts/backlink-pipeline.sh discover --demo --output seo/backlinks/prospects.csv

# Score and qualify (threshold: 65)
./seo/backlinks/scripts/backlink-pipeline.sh score \
  --input seo/backlinks/prospects.csv \
  --output-qualified seo/backlinks/qualified.csv \
  --output-rejected seo/backlinks/rejected.csv

# Generate unique outreach drafts for every qualified prospect
./seo/backlinks/scripts/backlink-pipeline.sh generate-outreach \
  --input seo/backlinks/qualified.csv \
  --output seo/backlinks/outreach-ready.csv

# Weekly: re-verify acquired links, regenerate report
./seo/backlinks/scripts/weekly-check.sh

# One-shot: full report
./seo/backlinks/scripts/backlink-pipeline.sh report
```

For a live (network) run, drop `--demo` and pass real keywords:

```bash
./seo/backlinks/scripts/backlink-pipeline.sh all \
  --keywords "independent artist resources,radio promotion tools,music marketing software" \
  --competitors "promoly.com,radioairplay.com,musformation.com"
```

**Requires Node.js 18+** (uses the built-in `fetch`). No npm dependencies —
run it from a checkout of this repo or copy `seo/backlinks/` anywhere.

---

## Commands

| Command | Purpose |
| --- | --- |
| `discover` | Find prospects: curated directories, search patterns, direct URLs. `--demo` generates sample data with no network. |
| `score` | Score every prospect 0–100 with the rubric below; write `qualified.csv` (≥ 65) and `rejected.csv`. |
| `generate-outreach` | Pick the best linkable asset per prospect and draft a unique, honest message. Never auto-sends by default. |
| `enrich` | Crawl each prospect's public page to fill in contact name/email (public pages only). |
| `analyze-competitors` | Classify a competitor's backlink profile (`--import export.csv`) into pursuable vs. non-pursuable link types. |
| `detect-broken` | Check pages for dead outbound links to radio resources; suggest the closest RadioReach replacement. |
| `crawl-prospect` | Analyze one page: resource-page indicators, relevance signals, public emails, robots.txt. |
| `verify` | Re-check acquired links (HTTP status + link/anchor presence). Moves losses to `lost.csv`. |
| `unlinked-mentions` | Prepare polite linking requests for brand mentions that don't link (`--import mentions.csv`). |
| `report` | Generate the acquisition report (markdown). |
| `all` | Chain discover → score → competitors → broken-links → outreach → report. |

Run any script directly for full flag help:

```bash
node seo/backlinks/scripts/score.js          # prints usage
node seo/backlinks/scripts/verify.js --help
```

---

## Scoring rubric (0–100)

| Component | Max | Basis |
| --- | --- | --- |
| Topical relevance | 25 | Term matching against page title/description + category context |
| Editorial legitimacy | 20 | Domain type (.edu/.gov/.org), category, visible editorial standards |
| Real audience value | 15 | Category: universities/associations > blogs > generic directories |
| Likelihood of acceptance | 15 | Submission path: directories accept listings; editorial sites don't |
| Page quality & maintenance | 10 | Meta completeness, fetch success, freshness signals |
| Traffic / visibility potential | 10 | Category-based |
| Ease of legitimate submission | 5 | Directory forms are easy; editorial pitches require effort |

**Penalties:** unrelated content −30, link farm −50, paid follow link −40,
no editorial standards −20, sitewide exact-match −30, suspicious outbound
patterns −30. **Reject instantly:** abandoned/hacked/expired domains.

Only prospects scoring **≥ 65** reach `qualified.csv`.

## Outreach rules (enforced in code + templates)

- One **unique** message per prospect: recipient name (when public), the exact
  page, a specific reason the asset fits, one URL.
- No exaggerated praise, no fake familiarity, no guilt/pressure tactics.
- **Max two follow-ups**, spaced ~7 days. Stop on any rejection/unsubscribe.
- **No auto-submission** unless the site explicitly offers a public
  business/resource form, automated use is permitted, info is truthful, and no
  CAPTCHA bypass is needed — otherwise the draft lands in `outreach-ready.csv`
  for a human.
- **Anchor text:** natural anchors only (`RadioReach`, page title, asset name).
  Never request commercial exact-match anchors.

## Linkable assets

`assets/index.json` lists the pitchable library (guides, templates, reference
pages on radioreach.us). Add new assets there as they launch; the pipeline
picks the best fit per prospect automatically. Assets should have a stable
URL, authorship, update date, mobile-friendly formatting, and be useful
without payment.

## Weekly maintenance

```bash
./seo/backlinks/scripts/weekly-check.sh
```

or schedule with cron:

```text
0 9 * * 0 /path/to/repo/seo/backlinks/scripts/weekly-check.sh
```

The weekly run re-verifies every link in `acquired.csv`, moves losses to
`lost.csv`, and writes a fresh report to `reports/`.

## Recording an acquired backlink

Log it in `acquired.csv` with: source URL, target URL, anchor text, link type,
follow/nofollow/sponsored status, date acquired, last verified date,
acquisition method, and contact history. `verify.js` keeps the
`last_verified_date` current each week.

## Compliance guardrails (do not cross)

1. **No expired/abandoned domains** — rejected outright unless previously
   owned by RadioReach or a defensible brand variation hosting a genuine
   standalone resource with clean history.
2. **No spam** — no mass directory dumps, no scraped private data, no
   bypassing CAPTCHA/moderation, no fake accounts, no promotional comments.
3. **No fabricated claims** — podcast/data pitches must use RadioReach's real
   numbers; never invent statistics or memberships.
4. **Robots.txt, rate limits, site terms** — always respected. The pipeline
   rate-limits itself (~1.5–2s between requests) and records crawler identity.
5. **Human review for everything uncertain** — `outreach-ready.csv` is a
   queue, not a send-batch.

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `RADIO_REACH_SENDER` | Real name used in outreach sign-off | `the RadioReach team` |
| `RADIO_REACH_OUTREACH_EMAIL` | Reply-to email for directory submissions | `outreach@radioreach.us` |

## Extending

- **Search-API discovery:** replace the placeholder pattern loop in
  `discover.js` with a search-API call (the output schema stays the same).
- **Backlink exports:** `analyze-competitors.js --import` accepts CSVs from
  Ahrefs/Semrush/Moz (columns: `source_url`, `title`, `anchor`,
  `domain_rating`).
- **Mention monitoring:** export from Google Alerts/Brand24 as
  `url,title,content` CSV and feed `unlinked-mentions.js --import`.

## Notes on the sandbox

In this repository's sandbox, outbound network is restricted, so live
crawling returns connection errors. Use `--demo` for offline pipeline runs.
The scripts degrade gracefully (fetch failures are logged, never fatal) and
work normally in any networked environment.
