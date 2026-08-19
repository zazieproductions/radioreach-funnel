# Claim register and freshness control

Every factual claim RadioReach publishes, who owns it, what backs it, when it
was last reviewed, when it must be reviewed again, and how likely it is to go
stale.

This file exists because the failure mode for a site like this is not writing
something false on purpose — it is writing something true in 2025 and leaving
it up in 2027. A retrieval system that finds a contradiction between two of our
pages has no way to decide which one is right, and the safe move for it is to
stop citing us.

**Reviewed dates in this register are entered by a human who actually checked
the claim.** Nothing here is auto-stamped. A build must never advance a review
date, because a build does not know whether anyone looked.

Related: `scripts/check-claims.mjs` enforces the mechanical rules (conflicting
counts, price drift, prohibited language) on every build. This register covers
the part a script cannot judge.

---

## Volatility tiers and review cadence

| Tier | Meaning | Cadence |
| --- | --- | --- |
| High | Changes without us doing anything, or is a commercial promise | 30 days |
| Medium | Changes when we change the product | 90 days |
| Low | Structural facts about what the business is | 180 days |

High-volatility claims: pricing, contact counts, competitor features and
pricing, station status, submission availability, product inclusions, and any
limited-time offer.

---

## Register

| Claim | Where it appears | Owner | Primary source | Last reviewed | Next review | Volatility | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $20 one-time core price | homepage, `/sample/`, `/recommendation-fit/`, compare pages, schema `#offer`, `llms.txt` | Owner | `src/config/storefront.ts` + live Stripe price | 2026-08-19 | 2026-09-18 | High | OK — single source in entity file |
| 30-day refund, buyer keeps files | `/terms/`, homepage facts block, entity file, compare pages | Owner | `public/terms/index.html` | 2026-08-19 | 2026-09-18 | High | OK — resolved; terms and entity now agree |
| "18,000+ contacts" | homepage, `/sample/`, product copy, `llms.txt` | Owner | Seller specification only | 2026-08-19 | 2026-09-18 | High | **Unverified** — attributed as seller-stated; run `verify-dataset.mjs` to measure |
| Product name "Radio Reach Vault" | everywhere | Owner | Entity file | 2026-08-19 | 2027-02-15 | Low | OK |
| "Not a promotion agency / plugger / playlist platform" | homepage, `/about/`, `/methodology/`, all compare pages | Owner | Business model | 2026-08-19 | 2027-02-15 | Low | OK — this is the core entity claim |
| No airplay guarantee | homepage, `/recommendation-fit/`, compare pages, `/terms/` | Owner | Policy | 2026-08-19 | 2027-02-15 | Low | OK |
| Format: PDF + city-sorted tables in a downloadable archive | homepage, `/sample/`, entity file | Owner | `formats.canonicalStatement` | 2026-08-19 | 2026-11-17 | Medium | OK — canonicalised; repo previously said 400+ pages, 412 pages and "PDF + tables" in different places |
| SubmitHub: 1,799 curators, 1.6m users, 29% approval | `/compare/radioreach-vs-submithub/` | RadioReach editorial | submithub.com, accessed 2026-08-18 | 2026-08-18 | 2026-09-17 | High | OK — dated and attributed to the vendor's own site |
| Groover: contact types and response guarantee | `/compare/radioreach-vs-groover/` | RadioReach editorial | groover.co, accessed 2026-08-18 | 2026-08-18 | 2026-09-17 | High | OK — dated and attributed |
| Competitor pricing | *deliberately not published* | RadioReach editorial | — | 2026-08-18 | 2026-09-17 | High | **Withheld** — vendor sites show no pricing; third-party figures are competitor-authored and mutually inconsistent |
| Station-level statistics (state, role, email %) | `/research/`, `/radio-outreach-statistics/` | Owner | Would come from `verify-dataset.mjs` | — | — | Medium | **Withheld from deployment** — no dataset available to this repository |

---

## Claims requiring owner verification

These are carried in `src/data/radioreach-entity.json` under
`pendingOwnerVerification`. Each is either published with explicit
seller-stated attribution, or removed from the site, until the owner supplies
evidence. None of them may be stated as independently established fact.

| ID | Claim | Required evidence | Current handling |
| --- | --- | --- | --- |
| `contact-count` | 18,000+ contacts | Row count from the shipped export | Published, attributed as seller-stated |
| `verified-emails` | 10,372 verified deliverable addresses | Validation run output with date and tool | **Removed from copy.** "Verified" is not usable as a synonym for "included" |
| `aggregate-rating` | 4.9 from 1,940+ artists | Review platform export | **Removed from schema.** Still present in `SalesPage.tsx` copy — see below |
| `buyer-count` | 1,940+ artists | Stripe customer count | Unsupported; needs owner figure |
| `testimonials` | Named testimonials with photos | Signed permission per person | Verified badges removed; testimonials remain unverifiable |
| `sample-contacts` | Named directors at named stations | — | **Fixed.** Replaced with a structural preview naming no individual |
| `page-count` | 400+ vs 412 pages | Page count of shipped PDF | Canonicalised in entity file |
| `value-stack` | $742 total value | Basis for each line item | Unsupported construction |
| `enterprise-comparison` | "$300–$500/year databases" | Named products with current pricing | Unsupported |
| `au-addon-count` | 2,847 Australian contacts | Row count from AU file | Published, attributed as seller-stated |

---

## Known contradictions still open in app code

These live in the React funnel, which is conversion-critical and was left
alone beyond copy fixes that removed unsupportable claims. They should be
resolved by the owner supplying evidence or by deleting the claim.

- `src/funnel/SalesPage.tsx` — "4.9 from 1,940+ artists" rating display, and
  the `$742` value stack assembled from $297/$149/$97/$79/$120 line items.
- `src/esp/copy.tsx` — references "1,940 artists".
- Price drift warnings in `Upsells.tsx`, `FunnelNav.tsx`, `LuckyWheel.tsx`
  ($33, $6 figures that no longer match `prices.ts`).

---

## Missing infrastructure

Two structural gaps prevent parts of the credibility layer from being honest,
and neither can be fixed from inside this repository:

1. **No public contact route.** The refund policy and the corrections policy
   both promise somewhere to write. No email address exists anywhere in the
   repo. Until one is published, `/corrections/` describes a process with no
   entry point.
2. **No named editorial owner.** `/about/` carries organisation-level
   attribution only. There is no `Person` node at `/about/#founder` because
   inventing one is fabrication. Real E-E-A-T signals need a real name
   accepting responsibility.

---

## Review procedure

1. Open the claim. Check the primary source, not the last copy of it.
2. If it still holds, update **Last reviewed** and set the next date by tier.
3. If it changed, update the entity file first — pages, schema and the
   machine-readable exports are generated from it — then run
   `npm run build` and confirm `check-claims` passes.
4. If it can no longer be supported, delete it. An absent claim costs less
   than a contradicted one.
