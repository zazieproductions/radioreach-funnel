# Mobile paid-social conversion pass

**Date:** 2026-08-22  
**Experience tag:** `mobile_meta_impulse_v1`

## Goal

Reduce the gap between a $25 Meta ad promise and the first mobile checkout decision. The pass uses the useful parts of direct-response frameworks—clear promise, specific mechanism, visible proof, risk reversal, and one dominant action—without fabricated scarcity, hidden additions, or guaranteed-outcome claims.

## Simulated buyer journey

The simulation used a first-time independent artist arriving from Facebook or Instagram on a phone, with low attention and high skepticism. Each proposed treatment was scored from 1–5 on message match, comprehension, trust, friction, and purchase-path focus. These are heuristic scores, not measured conversion results.

| Treatment | Message match | Comprehension | Trust | Friction | Path focus | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Existing experience | 2 | 3 | 2 | 2 | 2 | 11/25 |
| More urgency, countdowns, and preselected bundle | 2 | 3 | 1 | 1 | 3 | 10/25 |
| **Clear $25 offer, sample, core-only cart, truthful reassurance** | **5** | **5** | **5** | **5** | **5** | **25/25** |
| Short page with proof removed | 4 | 4 | 2 | 5 | 5 | 20/25 |

The third treatment was selected. The scores identify likely direction and must not be described as real A/B-test lift.

## Rejection map and applied answer

| Buyer thought | Previous risk | Applied answer |
| --- | --- | --- |
| “What is this?” | Category-led headline required interpretation. | Outcome-led headline plus a one-sentence product definition. |
| “Is it really $25?” | Checkout opened at $41 because both optional products were preselected. | Core-only cart starts at exactly $25; optional add-ons are off by default. |
| “Will I be subscribed?” | Reassurance was below the main decision. | “One payment. No subscription” appears in the first CTA card and sticky bar. |
| “What do I actually receive?” | Specifics were spread across the page. | Three scan cards and a direct “See a sample” link appear above the fold. |
| “Can I inspect it first?” | Sample was present but not offered as a low-commitment action. | Secondary sample anchor directly below the primary CTA. |
| “Why is a timer pressuring me?” | Evergreen countdown silently reset. | Removed timer-based pressure from sales and checkout decisions; urgency is based on saved research time. |
| “Why did the price change?” | Add-ons looked bundled into the advertised offer. | Checkout explicitly says the Vault is included and add-ons are optional. |
| “I clicked an ad—why am I in a quiz?” | Momentum interaction interrupted the offer before deliverables. | Paid-social visitors skip it; organic visitors see it only after the complete offer. |
| “Why are you sending me to seven articles?” | Resource links created exits before the close. | Resource cluster is hidden for paid-social visitors and retained for organic SEO traffic. |
| “Does this guarantee airplay?” | Some aggressive copy implied replies. | Copy now states that the data is a research starting point and airplay is not guaranteed. |

## Honest urgency and checkout reward

- The sale timer starts a 15-minute window per browser tab and stores its end time in `sessionStorage`, so refreshing that tab does not restart it. A newly opened tab receives its own window. Override the duration with `VITE_SALE_WINDOW_MINUTES`.
- The Founder’s Bundle wheel is a promotional reveal with a preset jackpot. The modal discloses that the reward is preset, and checkout keeps both optional items unchecked.
- Before a spin, the optional add-on prices are locked. After the spin, the $25 → $9 and $29 → $12 jackpot prices are revealed for 15 minutes. The customer must explicitly select either or both products.

## Measurement

The page detects paid-social context from `fbclid`, `utm_source` (`facebook`, `instagram`, or `meta`), and paid-social medium values. It emits:

- `LandingExperienceViewed` with experience, device, and paid-social context.
- `SalesCtaClicked` with CTA placement, experience, device, and $25 value.
- `CheckoutCartConfigured` whenever optional selections change, including core-only state and total.

Use verified Stripe purchases as the primary outcome. Compare purchase rate and revenue per landing-page view for `mobile_meta_impulse_v1`; use checkout initiation, core-only share, and cart configuration only as diagnostics. Do not declare a winner until traffic volume and attribution quality are sufficient.

## Recommended real test sequence

1. Hold this implementation stable and establish a mobile paid-social baseline.
2. Test hero proof format only: live sample link versus a static redacted sample image.
3. Test checkout layout only: optional add-ons before payment versus after core purchase.
4. Test guarantee phrasing only: concise summary versus current action-based detail.
5. Judge on verified purchase rate and contribution margin, not CTA clicks alone.
