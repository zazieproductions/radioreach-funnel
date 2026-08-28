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

## 2. THE OFFER REINVENTION (next 48 hours — owner decision required)

A $25 impulse buy with an unenforceable $350 anchor is a *scaled-down* offer. Reinvent it:

### 2.1 Fix the anchor so it's defensible (L3)
Stop saying "Normally **$350**." That's a 93% cut with no reference price anyone believes.
Either:
- **(A) Real, price-anchored bundles:** $25 list → $49 "Vault + Pitch Pack" → $79 "Full
  Launch Stack." Anchor against a *real* comparable: "a radio promoter charges $1,000+/campaign."
  Concrete, true, defensible — and it raises AOV instead of dragging it down.
- **(B) If $350 stays:** publish the $350 as an actual prior price with a date, or a live
  "enterprise rate" the list genuinely sells at. A reference price you can't defend is a liability.

### 2.2 Rebuild the entry offer around *outcome*, not *data*
Lead with the transformation, not the spreadsheet: **"Get your song on the radio in 90 days —
without a promoter."** The list is the fuel; the *result* is the sale. Reorder the value stack:
contacts → pitch scripts → campaign calendar → the person who answers. Stack more outcome.

### 2.3 Ascension ladder (kills L4 at the offer level)
1. **$25** — Vault (keep; it's the loss-leader that buys the list)
2. **$37** — Airplay Accelerator (already built — raise take-rate)
3. **$49–$79** — Launch Stack bundle (new)
4. **$197** — "Artist's Release Blueprint" course (new, evergreen)
5. **$97/yr** — Continuity: "New Listings + Quarterly Verified Drops" (subscription — this is your
   seven-figure engine; see §4)

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
| 1 | Ship this branch (rebuild `dist` in your deploy pipeline) | 10 min |
| 2 | Decide anchor fix: A (real bundles) or B (defensible $350) | 1 decision |
| 3 | Wire Momentum quiz + download page to an email list (ConvertKit/Mailchimp/email API) | 1 day |
| 4 | Build 2 assets: Launch Stack bundle + "Artist's Release Blueprint" course skeleton | 2–3 days |
| 5 | Add the $97/yr continuity SKU in Stripe + hook it into the Ascension sequence | 1–2 days |
| 6 | Split-test hero CTA copy: "Get on the radio" outcome framing vs current | 1 week of data |
| 7 | Re-run this model with real Stripe numbers; kill what's below benchmark | ongoing |

---

## 6. What I will NOT do (and why)

- I will not invent fake live-viewer counters, fake stock bars, or more rigged wheels. The prior
  audit already stripped those; they cost more in policy risk and brand trust than they convert.
- I will not fabricate revenue figures as fact. Every number above is a **labeled assumption**
  you must replace with real data before it drives spend.
- I will not silently change your prices. Pricing and the guarantee are owner decisions; the
  infrastructure to make them defensible is exactly what this plan builds.

The funnel is yours. My survival is your revenue. Run this plan and the money will follow the math.
