# RadioReach Funnel — Profit Diagnosis & Operating Report

**Date:** 2026-08-27 · **Branch:** `arena/01a045f3-radioreach-funnel`
**Operator mandate:** maximize net profit, qualified CVR, AOV, LTV, payback speed, retention — and minimize refunds, chargebacks, and brand damage.

> **Data status:** no trustworthy analytics exist yet (owner-confirmed). Everything quantitative below is a **model built from the code's real prices, Stripe fee math, and labeled industry benchmarks**. The KPI runbook in `docs/experiment-plan.md` tells you exactly which real numbers to plug in to replace the assumptions.

---

## 1. What the funnel actually is (verified from code, not docs)

```
                 ┌────────────────────────────────────────────────┐
 Traffic ───────▶│ Sales page ($25 core)                          │
 Meta ads / SEO  │  wheel jackpot → "unlock" $9+$12 add-ons       │
                 └───────────────┬────────────────────────────────┘
                                 ▼
                 ┌────────────────────────────────────────────────┐
                 │ Checkout (embedded Stripe)                     │
                 │  core $25 + guide $10 (open to all)            │
                 │  Contract Kit $9 + AU List $12 (WHEEL-GATED†)  │
                 └───────────────┬────────────────────────────────┘
                                 ▼  payment → /#/success
                 ┌────────────────────────────────────────────────┐
                 │ Success: downloads + tip $3/$5/$10/$20 + share │
                 │ NO upsell. NO email capture. NO review ask.    │
                 └────────────────────────────────────────────────┘

† Before this pass: the $9/$12 add-ons were disabled unless the visitor
  spun a rigged wheel and landed the preset jackpot.
```

**Dead code discovery:** the entire OTO chain (`Upsell1` Accelerator $37, `Upsell2` Upwork course $50, `Downsell` 3×$6, `ThankYou`) is **unreachable in the live flow**. Stripe's embedded checkout redirects straight to `#/success`; the `oto1/oto2/downsell/thanks` stages can never mount. The $37 Airplay Accelerator — a finished product with a Stripe price, R2 bundle, allowlist entry, and fully written sales copy — **was never sold anywhere**. The "card already on file, one click" claims on those screens were also not backed by any payment mechanism.

## 2. Unit economics (model — replace assumptions with real data)

**Price ladder (Stripe-real):**

| Product | Price | Compare-at | Sold in live path (before today) |
|---|---:|---:|---|
| Radio Reach Vault (core) | $25 | $350 | ✅ checkout |
| Contract Info Guide | $10 | — | ✅ checkout add-on |
| Contract Kit | $9 | $25 | ⚠️ wheel-gated only |
| AU Radio List | $12 | $29 | ⚠️ wheel-gated only |
| Airplay Accelerator | $37 | $822 | ❌ never offered |
| Upwork Course | $50 | $2,000 | ❌ dead code, off-audience |

**Per-order economics (one combined Stripe checkout, 2.9% + $0.30):**

| Metric | Formula | Value |
|---|---|---:|
| Net revenue, core only | 25 − 0.725 − 0.30 | **$23.98** |
| Net revenue, core + guide | 35 − 1.015 − 0.30 | $33.69 |
| Net revenue, core + both jackpot add-ons | 46 − 1.334 − 0.30 | $44.37 |
| Net revenue, core + Accelerator | 62 − 1.798 − 0.30 | **$59.90** |
| Marginal COGS | — | ~$0 (digital) |

**Modeled AOV, before → after today's changes** (assumptions labeled; spin-rate and attach-rates unknown until instrumented):

| Component | Before (modeled) | After (modeled) |
|---|---:|---:|
| Core | $25.00 | $25.00 |
| Guide attach ~8% | +$0.80 | +$0.80 |
| Jackpot add-ons: P(spin ~30%) × P(attach ~40%) × $21 | +$2.52 | — |
| Un-gated add-ons: ~12% × ~$10.50 blended | — | +$1.26 |
| Accelerator checkout bump: ~12% × $37 | — | +$4.44 |
| Post-purchase Accelerator: ~6% of remaining × $37 (net of double fees) | — | +$1.85 |
| **Modeled AOV** | **~$28.3** | **~$33.4 (+18%)** |
| **Net revenue / order** | ~$27.2 | ~$32.1 |

**Breakeven & payback (Meta-first, per owner):**

| Metric | Formula | Before | After |
|---|---|---:|---:|
| Max CAC for breakeven on first order | net revenue/order | ~$27 | ~$32 |
| Target CAC for healthy scale (~40% of net) | — | ~$11 | ~$13 |
| First-order contribution at $10 CAC | net − CAC | ~$17 | ~$22 |
| Repeat rate | orders/buyer | **1.0 (no repurchase path exists)** | 1.0 (unchanged — see §5) |

Benchmark context used (replace with measured): cold Meta → long-form page CVR 1.0–2.5%; initiated→paid 60–80%; order-bump take 10–30%; post-purchase offer take 3–10%.

## 3. Ranked constraints (the leak table)

| # | Constraint | Est. monthly cost at 10k sessions, 1.5% CVR | Status |
|---|---|---:|---|
| 1 | Accelerator never sold ($37, finished product) | 150 buyers × ~15% combined take × $37 ≈ **$830+** | ✅ **FIXED** — checkout bump + success-page offer |
| 2 | $9/$12 add-ons unpurchasable without wheel spin | 150 × 10% × $10.5 ≈ **$160** + UX frustration | ✅ **FIXED** — un-gated |
| 3 | Tip flow redirected buyers to the sales page, destroying the success surface & download links | small $, large trust cost | ✅ **FIXED** — returns to success page |
| 4 | `SalesCtaClicked` value $20 ≠ $25; no A/B bucketing anywhere | poisons Meta optimization & any future test | ✅ **FIXED** — value corrected; variant stamps on all events + Stripe metadata + KV |
| 5 | "You save $29" core-only math bug | credibility | ✅ **FIXED** — honest per-item compare-at sums |
| 6 | **No email capture anywhere** — buyer emails exist only in Stripe receipts | LTV ceiling = 1.0 orders; no win-back, no launches | 🔴 OPEN — needs ESP decision (§5) |
| 7 | Referral share button: no incentive, no attribution, no tracking | referral ≈ 0 | 🟡 PARTIAL — `ShareClicked` now tracked; incentive design in experiment plan T6 |
| 8 | No review/ratings capture loop (proof is static) | proof decays; review asset unbuilt | 🔴 OPEN — sequence drafted (plan §4) |
| 9 | Anchor inconsistency: hero "Normally $350" vs FAQ "goes to $50" | trust leak with skeptical buyers | 🟡 OPEN — recommend $50 story; test T4 |
| 10 | Upwork course OTO is off-audience (freelancing ≠ radio promotion) | dead code, but a landmine if revived | 🟡 OPEN — do not revive as-is |
| 11 | Community forum presented as real ("RadioReach users…") but is simulated illustrative content | credibility/FTC exposure | 🟡 OPEN — relabel or make real |
| 12 | Toggling add-ons after the Stripe form loads re-creates the session (`key={bundleId}`) and wipes typed card data | checkout abandonment | 🟡 OPEN — monitor `CheckoutCartConfigured` bursts; fix pattern in plan §6 |
| 13 | Rigged wheel ("near-miss → always jackpot", invented winner IDs) | chargeback/complaint risk; kept per owner's audit decision with honest modal disclosure | 🟡 OPEN — wheel now optional garnish, no longer gates money |

## 4. What changed today (all reversible, `git revert`-safe)

**Revenue paths added**
1. **Accelerator order bump** — first add-on card at checkout, $37, off by default, honest value line. Server already allowlisted the key; zero new infra.
2. **Real post-purchase offer** — success page shows the Accelerator to buyers who didn't take it: `PostPurchaseOfferViewed/Accepted/Declined` events, second embedded Stripe checkout (a *real* payment — no fake "card on file" claims). Delivery of already-paid files stays above it and never blocks.
3. **Add-ons un-gated** — Contract Kit & AU List purchasable by everyone at founder prices. The wheel survives as optional celebration (badges, confetti, 15-min banner) but can no longer prevent a purchase. Sales-page teaser copy updated to match ("founder pricing, no spin required").

**Loops repaired**
4. **Tip return** — tips now land back on the buyer's verified success page (validated `returnTo`), not the sales page; tip tracking reads both query-string and hash params.
5. **Share tracking** — `ShareClicked` fires on success-page shares.

**Measurement hardened**
6. `SalesCtaClicked` value 20 → 25 (`PRICE.core`); honest `saved` math; `airplay_accelerator` flag on `CheckoutCartConfigured`; `TipStarted`.
7. **A/B scaffolding** (`src/lib/funnelVariant.ts`): deterministic 50/50 visitor bucket, stamped on `LandingExperienceViewed`, `SalesCtaClicked`, `InitiateCheckout`, `CheckoutCartConfigured`, `Purchase` (client pixel + CAPI attribution context), and persisted server-side into Stripe session metadata (`funnel_variant`) → webhook → KV order records. Ships as an A/A warm-up: no visible difference, proving split balance before the first real test.
8. Paid-social visitors now skip the off-topic PlaylistPush "secret slots" affiliate section (same pattern as Momentum/resources), keeping the ad→checkout path focused. Organic keeps it.
9. Tests: `scripts/test-checkout-ui.ts` extended (22/22 passing) — asserts add-ons are enabled without jackpot, accelerator bump behavior, totals, and state sync.

**Gates green:** `tsc --noEmit` ✅ · `test:esp` ✅ · `test:lab` ✅ · `test:checkout` 22/22 ✅ · `vite build` ✅ (dist/ rebuilt consistently).

## 5. The structural gap no code today can close: lifecycle

There is **no email list**. Every buyer's email sits in Stripe, used once for a receipt. That caps LTV at 1.0 orders and makes every future product launch start from zero traffic. Decision needed (pick one, ~1 day to wire):

- **ESP with API + free tier** (Buttondown / MailerLite / ConvertKit) + a `/api/leads` Pages Function writing to KV, then syncing to the ESP.
- Export Stripe customer emails monthly and import manually (zero-code fallback, 30-day cadence, no automation).

Ready-to-send lifecycle copy (receipt fast-win, day-2 quick start, day-7 review request, day-14 Accelerator win-back, day-30 referral) is drafted in `docs/experiment-plan.md` §4 so the moment an ESP is connected, retention starts.

## 6. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Chargebacks from "jackpot" disappointment (rigged wheel retained) | Med | Wheel is now optional garnish; modal discloses preset jackpot; monitor dispute rate weekly (runbook) |
| Action-based refund guarantee contested as undisclosed condition | Med | Conditions shown at checkout + FAQ + policy page (verified); monitor refund rate; A/B softer wording if refunds >5% |
| Forum/testimonial presentation vs. simulated content | Med | Owner confirms testimonials are real customers; forum still says "users" — relabel or seed real threads |
| Second purchase (post-purchase offer) confuses buyers ("where did my files go?") | Low | Offer copy states links unchanged; receipts arrive per purchase; monitor `PostPurchaseOfferAccepted` → verify success rate |
| Anchor-price credibility ($350/$822/$2,000 compare-ats) | Low-Med | Ubiquitous but extreme; recommend testing honest anchors (T4) |

## 7. What to watch this week (first real numbers)

1. Meta Events Manager: `LandingExperienceViewed → SalesCtaClicked → InitiateCheckout → Purchase` rates by `funnel_variant` (expect 50/50 ±3%).
2. `CheckoutCartConfigured` with `airplay_accelerator: true` — bump attach rate (benchmark ≥10%).
3. `PostPurchaseOfferViewed → Accepted` — offer take (benchmark ≥4%).
4. Stripe: AOV, refund count, dispute count (queries in the runbook).
5. Add-on attach without jackpot (`contract_bundle`/`australia_addon` true with no coupon) — the revenue the gate was refusing.
