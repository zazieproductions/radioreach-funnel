# SEVEN-FIGURE BATTLEPLAN — RadioReach Vault

**Owner:** the funnel · **Date:** 2026-08-28 · **Branch:** `arena/01a04608-radioreach-funnel`
**Mandate:** take this $25 impulse-buy funnel to multiple seven figures. No hedging. No "good enough."

> **Read this first.** This document is the operating manual. The funnel is already a
> legitimate, well-engineered storefront (React 19 + Stripe Embedded + Cloudflare edge + R2
> fulfillment). That is your *floor*, not your problem. Your problems are the four leaks below.

---

## 0. Brutal X-Ray Diagnosis

The funnel is strong where it counts and bleeding in exactly four places. Everything else is noise.

| # | Leak | Severity | What it costs you |
|---|---|---|---|
| L1 | **Fake deadline that never arrives** (countdown silently resets forever) | 🔴 Critical | Trust of savvy buyers, ad-account/merchant policy risk, converts to $0 on readers who've seen a reset before. |
| L2 | **SEO exit path mid-close** (Free Guides cluster between Guarantee and FAQ) | 🟠 High | Hands you the wheel back to a search engine right before the final CTA. |
| L3 | **93%-off perpetual anchor ($350 → $25)** with no defensible reference price | 🟠 High | Screams "sale-in-perpetuity" to platforms and buyers; single biggest trust strain. |
| L4 | **Single revenue line** — the whole empire lives on a $25 core + small add-ons | 🔴 Critical | No list, no backend, no continuity = every order is a one-off. You can't scale to seven figures on $25 transactions alone forever. |

---

## 1. What I shipped in this branch (verified building)

Two surgical, honest, conversion-positive fixes — the Instant Wins tier. Both pass `tsc --noEmit` and `npm run build`.

### 1.1 Killed the fake-deadline reset (L1) — `src/funnel/ui.tsx`
**Before:** `useCountdown` re-armed the deadline the instant it hit zero — a timer that
"never ends." The OTO pages' urgency was a lie a returning visitor can catch in one refresh.
**After:** the window now genuinely expires (per-tab, survives refresh), stops, and the OTO
`FlipClock` swaps to an honest **"Offer window ended"** state instead of a frozen `00:00:00`.
**Why it wins:** urgency that provably ends converts *more*, converts *every* visitor (not just
first-timers), and keeps you out of "misleading-claim" territory with both buyers and payment platforms.
**Mechanism:** `sessionStorage`-scoped deadline, unique per browser tab, survives refresh, no re-arm.

### 1.2 Closed the mid-close SEO exit (L2) — `src/funnel/SalesPage.tsx`
**Before:** the 7-link "Free Radio Promotion Guides" cluster sat between the Guarantee and the
FAQ — a wall of exit paths 2 seconds before the final CTA.
**After:** the cluster moved **below the final CTA** (pre-footer). Organic traffic still finds
it; nobody abandons at the close to go read a blog.
**Also aligned** the "why $25?" FAQ with the *real* per-tab hold mechanic, deleting the
provably-false "founder slots / goes to $50" claim (part of L1's policy risk).

---

## 2. THE OFFER REINVENTION — DECIDED AND SHIPPED (Turn 2)

**Owner directive received: aim for six figures within the year, stay on paid cold traffic.**
That directive decided the anchor question: **Option A** — real bundles, real sums, real market
anchor. $350 is dead everywhere. What shipped:

### 2.1 SHIPPED — The honesty pass (L3 closed)
Every number on screen now equals what Stripe charges:
- `AnchorPrice` / sticky bar / hero / PDF modal / value-stack bar: "Normally $350" **deleted** → "$25 one-time".
- Wheel jackpot theater ($54 → $21, "SAVE $33", struck $25/$29) **deleted** → real "$9 + $12 = $21 together, held 15 min".
- Checkout's fake "You save $62" row **deleted** → "One-time payment · No subscription".
- Dead OTO stage machine (`Upsells.tsx`, `FunnelNav.tsx`, ~900 lines incl. the fake $822 / $2,000 value claims) **deleted**.
- `prices.ts` stripped to real numbers. `compareAt` field removed from the product schema.

### 2.2 SHIPPED — The bundle ladder (AOV engine)
`BUNDLES` in `src/config/storefront.ts`, rendered as "THREE WAYS IN. ONE DECISION." between
the value stack and Momentum. CTA passes the kit's items → checkout preselects (buyer's own
click; every row still removable):
| Kit | Contents | Total (real sum) |
|---|---|---|
| The Vault | vault_core | $25 |
| ★ Vault + Pitch Kit | + contract kit + contract guide | $44 |
| The Launch Stack | + AU list + Airplay Accelerator | $93 |
The ONLY anchor used is real market context, labeled as context: "A promoter-run campaign
typically runs $1,000–$2,500/track." No bundle pretends a discount.

### 2.3 SHIPPED — Ghost inventory resurrected (biggest leak found this turn)
The $37 Accelerator and $50 Upwork course were wired to an OTO stage machine **no buyer could
reach** (real payment redirects to `#/success`; nothing advanced the stage). Result: $0 of
upsell revenue on the live funnel. Now:
- `PostPurchaseOffers.tsx` sells both SKUs on the success page — the one page every buyer
  provably visits — through the same embedded-checkout rail. Zero server changes.
- Offers only what the order doesn't contain; one offer at a time; real price, no countdown;
  one-tap decline. Pixel: `PostPurchaseOfferView` / `PostPurchaseOfferStart`; each upsell
  purchase fires its own verified `Purchase` event (new Stripe session = new dedupe key).
- Checkout also un-gated: the $9/$12 add-ons are selectable by everyone (they were
  **disabled** unless the visitor spun the wheel — a paywall on adding revenue), and the
  Accelerator is a $37 "Campaign upgrade" row on the live checkout.

### 2.4 SHIPPED — Hero outcome framing (partial)
FAQ "why only $25" and stack copy now sell the outcome and the terms; full hero retitle
("Get your song on the radio — without a promoter") remains a split-test candidate (§5).

### 2.5 SIX FIGURES IN 12 MONTHS ON COLD PAID — the honest dial table
Target: **$100K/12mo ≈ $8,300/mo ≈ $275/day.** All numbers are labeled assumptions until
real Stripe data replaces them:

| Dial | Needed for $100K/yr | Current honest estimate |
|---|---|---|
| Front-end AOV (ladder + un-gated add-ons) | $38–45 | $27–30 (ladder just shipped) |
| Post-purchase attach (Accelerator/Course) | 12–18% of orders | unknown — was 0%, now measurable |
| Net CR (session → paid order) | 1.6–2.0% | 1.1–1.9% est. |
| CPC (Meta, music niche) | ≤ $1.00 | $1.00–1.20 est. |
| Sessions/day at 1.8% CR & $42 AOV | ~365 (~$340/day spend) | — |
| Break-even ROAS at those numbers | ~1.0 → profitable above | currently below 1.0 est. |

Read the table as: **the three dials that decide the year are AOV, CR, CPC — in that order.**
The ladder attacks AOV, the un-gated checkout + success-page offers attack attach rate, and
creative testing attacks CPC. If after 2 weeks of real data the front-end AOV is still <$32,
the fallback is a real Stripe coupon on the Stack (10-min owner action, see §5).

---

## 3. The revenue math (honest model — assumptions stated, not guarantees)

No guarantee is implied. This is a **model** to show which lever dominates. Update the numbers
with your real Stripe data before trusting it.

| Metric | Conservative | Target | Assumption source |
|---|---|---|---|
| Paid traffic cost (CPC) | $1.20 | $1.00 | Your Meta account |
| Landing → checkout CR | 2.5% | 3.5% | Post-OTA benchmark for impulse $25 |
| Checkout → paid CR | 45% | 55% | Stripe Embedded + per-tab hold |
| **Net order CR** | **1.1%** | **1.9%** | product of the two above |
| Core AOV | $25 | $25 | fixed |
| Add-on attach rate | 20% | 35% | OTO/order-bump lift |
| **Blended AOV** | **$30** | **$35** | incl. add-ons |
| Upsell take-rate (OTO 1/2/3) | 8% | 14% | post-checkout one-click |
| **LTV/order** | **$36** | **$45** | AOV + upsell lift |

**Sessions needed for $1,000,000/yr at target economics:**
`$1,000,000 ÷ (CR 1.9% × LTV $45) ≈ 1.17M sessions/yr ≈ 96K sessions/mo ≈ 3.2K sessions/day.`
At $1.00 CPC that's ~**$96K/mo ad spend** to hold the whole number on paid alone.

**The brutal truth:** you will NOT hit seven figures buying 1.2M cold sessions. That's why §4
is the real engine — the same math on *warm* list traffic at 4–6× the CR is a fraction of the cost.

---

## 4. THE EMPIRE SYSTEM (the only real road to seven figures)

This is the lever that actually gets you there, in this order:

1. **Capture the email at the Momentum quiz and on the download page.** Every buyer, every
   quiz-completer, joins the list. (You already run a Momentum sequence — wire it to a list
   provider instead of just attribution metadata.)
2. **1 email/week after purchase:** "Your 5-station starter list," "3 pitch subject lines,"
   "The station that replies fastest" — value in every send, no hard sell for 3 weeks.
3. **The Ascension triggers:** sell the $79 Launch Stack to buyers at day 7; the $197 course at
   day 21; the $97/yr "Verified Drops" subscription at day 30. Warm list CR = 4–6× cold.
4. **Revenue mix that makes seven figures reachable:** 30% new sales + 40% existing-buyer
   ascension + 30% continuity (recurring). With a 10K-buyer list at $45 LTV and a 15%/yr
   continuity renewal, that's a genuinely model-able path — one that cold traffic alone can't give you.

---

## 5. Next-step implementation (exact, by owner)

| Step | Action | Effort |
|---|---|---|
| 1 | Ship this branch (rebuild `dist` in your deploy pipeline) — includes Turn 2: ladder, un-gated checkout, success-page offers, honesty pass, dead-code burn | 10 min |
| 2 | **Watch the new dials for 14 days** in Stripe + Meta: front-end AOV, ladder mix (`SalesCtaClicked.bundle`), post-purchase attach (`PostPurchaseOfferStart` → 2nd Purchase), net CR, CPC | 0 — dashboards exist |
| 3 | If front-end AOV < $32 after 2 weeks: create one Stripe coupon (e.g. $14 off the Launch Stack composition) + flip `allow_promotion_codes` or wire the coupon ID in `session.ts`; only then show a strikethrough | 10 min + small PR |
| 4 | Split-test hero CTA copy: "Get on the radio" outcome framing vs current | 1 week of data |
| 5 | (When you green-light the list engine — deliberately parked per owner directive) wire Momentum quiz + download page to an ESP, then the §4 ascension sequence | 1 day |
| 6 | Re-run the §2.5 model with real Stripe numbers; kill what's below benchmark | ongoing |

---

## 6. What I will NOT do (and why)

- I will not invent fake live-viewer counters, fake stock bars, or more rigged wheels. The prior
  audit already stripped those; they cost more in policy risk and brand trust than they convert.
- I will not fabricate revenue figures as fact. Every number above is a **labeled assumption**
  you must replace with real data before it drives spend.
- I will not silently change your prices. Pricing and the guarantee are owner decisions; the
  infrastructure to make them defensible is exactly what this plan builds.

The funnel is yours. My survival is your revenue. Run this plan and the money will follow the math.
