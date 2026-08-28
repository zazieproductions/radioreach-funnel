# RadioReach — Experiment Plan, KPI Runbook & Lifecycle Assets

**Companion to:** `docs/funnel-profit-diagnosis.md` · **Channel priority:** Meta paid social (owner-confirmed)

---

## 1. Test queue (run top to bottom; one test at a time)

The scaffolding is live: every visitor gets a deterministic `funnel_variant` (`base`/`test`) stamped into all pixel events, dataLayer, Stripe metadata, and KV order records. Today both variants render the same experience (A/A warm-up). After ~1,000 sessions or 2 weeks, confirm the split is 50/50 ±3% and CVR difference is within noise — then start T1.

| ID | Test | Hypothesis | Primary metric | Guardrails | Min. sample |
|---|---|---|---|---|---|
| T0 | A/A balance check | Variant assignment is balanced and purchase-rate-neutral | base vs test Purchase/session Δ < 1% | — | 1,000 sessions |
| T1 | Accelerator bump price: $37 (base) vs $27 | Lower price lifts attach enough to beat revenue loss | **Revenue per checkout-session** | Checkout CVR, refund rate | 12,000 sessions/variant* |
| T2 | Post-purchase offer: $37 (base) vs $29 | Lower friction lifts take rate on warmed buyers | Offer revenue per buyer | Download completion, tip rate | 8,000 buyers/variant** |
| T3 | Hero headline: current "STOP GUESSING WHO TO EMAIL" (base) vs outcome-led "GET YOUR SONG ON LOCAL RADIO THIS MONTH" | Outcome framing beats agitation for cold Meta traffic | SalesCtaClicked rate (then Purchase) | Bounce/scroll depth | 10,000 sessions/variant |
| T4 | Honest anchors: $350→$50 "regular price" story everywhere | Credible anchor beats extreme anchor for skeptical musicians | Purchase CVR | AOV (must not drop >5%) | 10,000 sessions/variant |
| T5 | Wheel: keep as garnish (base) vs remove entirely | Wheel costs more trust than it adds endowment | Purchase CVR | Refund rate, chargebacks | 15,000 sessions/variant |
| T6 | Referral incentive: give-$5/get-$5 Stripe promotion codes on success page | Incentivized sharing generates tracked new-customer sessions | Referred sessions → Purchase | Margin erosion ≤ $5/referral | 30 days |
| T7 | Re-run wheel gating (legacy behavior) vs current un-gated | Validates that un-gating didn't reduce urgency-driven attach | AOV + Purchase CVR jointly | — | 12,000 sessions/variant |

\* Power math: baseline checkout→purchase ~65%; detecting a 10-point relative shift at 80% power, α=0.05 needs ~2,600/variant for rates — but bump tests move **revenue**, which is noisier; 12k/variant is the safe budget. At ~300 sessions/day this is ~40 days: run T1 on revenue-per-session with sequential monitoring rather than fixed-horizon stopping.
\** T2 runs on the success page only, so it can run concurrently with a sales-page test without interference (separate populations by stage reached).

**Decision rules (write them before looking at data):**
- Ship if primary metric lifts ≥ the MDE at ≥95% confidence AND no guardrail degrades >5%.
- Kill if primary metric drops ≥ MDE at ≥95% confidence.
- Otherwise extend to the sample target; if still flat, declare inconclusive and move down the queue. Never run two sales-page tests at once.

## 2. KPI runbook (weekly, 20 minutes, free tools)

**North star:** `net profit per session = (orders × net revenue/order) − ad spend) / sessions`. Every optimization answers to this, not to CVR alone.

| KPI | Source | Query / where | Healthy (launch) | Alarm |
|---|---|---|---|---|
| Sessions & CVR | Meta Events Manager or Cloudflare Web Analytics | `LandingExperienceViewed` count; Purchase ÷ sessions | 1–2.5% (cold Meta) | <0.8% sustained |
| CTA→checkout rate | Events Manager | `SalesCtaClicked ÷ LandingExperienceViewed` | 6–12% | <4% |
| Checkout completion | Events Manager | `Purchase ÷ InitiateCheckout` | 60–80% | <50% |
| Bump attach | Events Manager (custom) | `CheckoutCartConfigured` with `airplay_accelerator:true` ÷ Purchase | ≥10% | <5% |
| Post-purchase take | Events Manager | `PostPurchaseOfferAccepted ÷ PostPurchaseOfferViewed` | ≥4% | <2% |
| AOV (gross) | Stripe | Payments → last 7d → gross volume Ó payments count | ≥$30 | <$27 |
| Net revenue/order | Stripe + fee math | (gross − 2.9% − $0.30) per checkout (combined orders) | ≥$29 | — |
| Refund rate | Stripe | Refunds ÷ payments, trailing 30d | <5% | >8% |
| Disputes | Stripe | Disputes list, trailing 30d | <0.3% | >0.6% (Stripe program risk) |
| CAC / ROAS | Meta Ads Manager | Spend ÷ purchases (7d click, 1d view) | CAC ≤ $13 | CAC > net revenue |
| Variant balance | Events Manager | `funnel_variant` breakdown on Purchase | 50/50 ±3% | >57/43 → flag split bug |

**Monthly:** export Stripe payments CSV; join with KV order metadata (`funnel_variant`, `utm_*`, `sequence_*`, add-on keys) — every field now flows through the webhook into `ORDER_STORE` and Stripe metadata, so the export is analysis-ready.

## 3. Meta creative → funnel message-match rules (paid-social priority)

The page's `mobile_meta_impulse_v1` experience already skips the quiz, the resources cluster, and (now) the affiliate slots for `fbclid` visitors. Keep ad→page promise identical:

| Ad angle | Landing promise to keep identical | Watch |
|---|---|---|
| "18,000+ verified radio contacts, $25 once" | Hero stat chips (18K+ / $25 / 90 sec) — exact numbers | If ad says "verified emails," page FAQ's 10,372-verified line must stay visible |
| "Stop guessing who to email" | Current H1 mirrors it | T3 tests a stronger outcome angle |
| Price锚 "was $350" | Avoid in ads until T4 settles the honest-anchor story | Mixed anchors across touchpoints raise refund propensity |

## 4. Lifecycle assets (ready to send once an ESP is connected)

Buyer emails arrive from Stripe; wire an ESP (see diagnosis §5), then load these.

**Email 1 — Receipt + fast win (immediately, via ESP trigger on Stripe webhook)**
> Subject: Your Vault is open — do this first (takes 9 minutes)
> Your downloads: [links]. Step 1: open the Vault, filter to your city. Step 2: pick the 5 stations that fit your genre. Step 3: send one personalized email tonight using the music director's name — not info@. Reply to this email with your send count and I'll tell you if your pitch needs work.

**Email 2 — Day 2: quick start nudge**
> Subject: The 20-email rule (week one)
> Artists who send 20 targeted emails in week one are the ones who get replies. Here's the 3-line pitch structure that got [real buyer] 2 spins in 9 days: [structure]. Open your Vault → [link].

**Email 3 — Day 7: review request (feeds real proof)**
> Subject: Did any station reply?
> You've had the Vault for a week. Two questions, 30 seconds: [1–5 star rating] and [one line about how it's going]. Great stories become testimonials (with permission and your artist name — real credit, real link).

**Email 4 — Day 14: Accelerator win-back (non-buyers of the bump)**
> Subject: The half of radio promotion the Vault doesn't cover
> The list tells you WHO. The Accelerator tells you WHAT to send and WHEN: the 6-week calendar, 11 subject lines with real open rates, and the 3-touch follow-up. Owners get airplay ~2× more often in month one [replace with measured stat]. Reader price: $37 → [buy link].

**Email 5 — Day 30: referral + next release**
> Subject: Your next single deserves the same runway
> Two things: (1) your download links never expire — [link]. (2) Know another artist who'd use this properly? Forward this — they get the Vault at the founder price, and you get [T6 incentive once enabled].

**Win-back (non-buyers, requires lead capture first):** 3-email sequence for cart abandoners (`InitiateCheckout` without `Purchase`): objection handling (guarantee, sample PDF), one testimonial, final "price rises to $50 at launch end" only if/when that claim is real.

## 5. Compliance guardrails baked into tests

- Never test price shown vs price charged (Stripe allowlist enforces this).
- Never fake scarcity/proof in a treatment; the earlier UX audit removed those patterns — tests must not reintroduce them.
- Refund-rate guardrail on every test; disputes kill Meta accounts faster than bad CVR kills profit.
- `allow_promotion_codes` stays `false` until T6 ships real, auditable codes server-side.

## 6. Known follow-ups (engineering debt from this pass)

1. **Embedded checkout reset on add-on toggle** — changing `items` re-keys the provider and wipes a half-typed card. Monitor `CheckoutCartConfigured` bursts >3 in 5 min as a proxy; fix = freeze line items once `EmbeddedCheckout` mounts and require an explicit "Update order" action to re-key.
2. **Post-purchase second purchase shows only the new item's downloads** — the success page is session-scoped. Enhancement: accept a `prior_session_id` in verify to merge prior paid items into the same download list.
3. **Remove or replace the Upwork OTO2 screen** if the demo chain is ever revived; replace with a music-career product for message match.
4. **`#/community` forum** — relabel as community preview or seed with real threads before scaling paid traffic to it.
