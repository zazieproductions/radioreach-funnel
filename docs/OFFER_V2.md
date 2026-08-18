# Offer v2 — value-equation rebuild

The main offer on the sales page, rewritten against Alex Hormozi's value equation and
shipped as a **50/50 A/B test** against the existing offer.

```
              Dream Outcome  ×  Perceived Likelihood of Success
Value  =  ────────────────────────────────────────────────────────
                   Time Delay  ×  Effort & Sacrifice
```

Nothing about the price, the timer, the licenses-left bar, the dark theme or the acid
CTAs changed. The four terms above did.

---

## What each block moves

| Block | Term | File | Flag |
|---|---|---|---|
| "You're buying the reply" — a 4-beat, time-stamped tonight | ↑ Dream Outcome | `OfferV2.tsx › DreamOutcomeBlock` | `dreamOutcome` |
| "Specifics, not promises" — 4 hard numbers + 3 checkable claims | ↑ Likelihood | `OfferV2.tsx › ProofStackBlock` | `proofStack` |
| "Twenty minutes, not six months" — 0:00 → 20:00 timeline | ↓ Time Delay / Effort | `OfferV2.tsx › SpeedStackBlock` | `speedStack` |
| 3 expiring founder bonuses tied to the live countdown | ↑ Dream / ↓ Effort | `OfferV2.tsx › BonusStackBlock` | `bonusStack` |
| "More useful than a submission form" guarantee | ↓ perceived risk | `OfferV2.tsx › GuaranteeV2Block` | `guaranteeV2` |
| Hero + final CTA proof bullets and reassurance chips | all four | inline in `SalesPage.tsx` | `ctaV2` |

All copy and every number live in **`src/funnel/offerContent.tsx`**. That file is the
single source of truth — the JSX only arranges it.

---

## Feature flags

Master switch plus one flag per block, resolved in `src/config/offer.ts`.

**Precedence (first match wins):**

1. **Build env** — `VITE_OFFER_V2=off | on | ab` (default `ab`)
2. **URL param** — `?offer=v2`, `?offer=v1` *(persists, for QA and stakeholder review)*
3. **Runtime object** — `window.__RADIOREACH_FLAGS__.offer.offerV2 = false`
4. **localStorage** — `rr.offer.variant` = `v2` | `control` *(the sticky bucket)*
5. **Coin flip** — 50/50, then persisted

Sub-flags default on whenever v2 is on, and can be pulled individually:

```
?offer=v2&offer.bonusStack=off          # URL, per visit
window.__RADIOREACH_FLAGS__.offer = { bonusStack: false }   # runtime
```

### Emergency kill

Edit the inline script in `index.html`:

```html
<script>window.__RADIOREACH_FLAGS__={momentumOwnershipSequence:true,offer:{offerV2:false}};</script>
```

That sends 100% of traffic to the control offer on the next page load, with no
rebuild. To pin the winner permanently later, set `VITE_OFFER_V2=on` and delete the
losing branch.

---

## The A/B test

- **Split:** 50/50, sticky per browser via `localStorage["rr.offer.variant"]`.
- **Why sticky matters:** a visitor who sees v2, bounces to checkout, and returns must
  not land on the control. There's a regression test for exactly this.
- **Attribution:** `getOfferAttribution()` returns `{ offer_variant, offer_build_mode }`.
  It's attached to:
  - the `OfferVariantAssigned` Meta custom event (fires once on mount)
  - every ESP `cta_click` conversion log

To read results, split Purchase events by `offer_variant`. **Judge on
purchases-per-visitor, not CTA clicks** — v2 has more CTAs on the page, so raw click
counts are not comparable between arms.

---

## Claims policy

`OFFER_FACTS` in `offerContent.tsx` holds the only hard numbers the offer states. They
mirror figures already published elsewhere in the funnel:

| Fact | Value |
|---|---|
| Entries | 18,020 |
| Verified emails | 10,372 |
| Buyers / rating | 1,940+ / 4.9 |
| Stack value / + bonuses | $742 / $857 |

Two rules, both load-bearing for the FTC block at the foot of the page:

1. **Process promises, never result promises.** "You'll be able to email 20 named music
   directors tonight" is fine. "You'll get airplay" is not, and appears nowhere.
2. **Change a number here, not in the JSX.** Every block reads from `OFFER_FACTS`.

The guarantee is deliberately generic about the address ("email us") because no support
inbox is configured in this repo yet. When one exists, add it to `GUARANTEE` in
`offerContent.tsx`.

---

## Bonus fulfilment — action required

The offer promises three bonuses. The deliverables are written and live in
`assets/bonuses/`:

| # | Bonus | Value | Source |
|---|---|---|---|
| 1 | The First-Contact Swipe Pack | $47 | `01-first-contact-swipe-pack.md` |
| 2 | The 3-Touch Follow-Up System | $39 | `02-three-touch-follow-up-system.md` |
| 3 | The Station-Fit Filter & Send Tracker | $29 | `03-station-fit-filter-and-send-tracker.md` |

**They are not yet wired into delivery.** Before turning `bonusStack` on in production,
render them to PDF and either add them to `vault/radio-reach-vault.zip` in R2 (simplest
— no code change) or register a separate `bonus_pack` product. See
`assets/bonuses/README.md`.

Until that's done, run with `?offer.bonusStack=off` or
`window.__RADIOREACH_FLAGS__.offer={bonusStack:false}`.

---

## Tests

```sh
npm run test:offer   # 44 checks — flag precedence, stickiness, kill switches, render
npm run test:esp     # existing ESP suite
npm test             # both
```

The offer suite guards the money cases: the split is sticky, every kill switch works,
the guarantee **replaces** rather than duplicates, and the control arm is byte-for-byte
the old offer.

> **Note:** the ESP suite now pins `?offer=v1` on every scenario URL. Without that it
> would draw a random arm each run and fail ~50% of the time.
