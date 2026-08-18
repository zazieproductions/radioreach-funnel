# Founder bonus assets

Source files for the three expiring bonuses shown in the v2 offer block on the sales
page. These are the actual customer deliverables — keep them in sync with the copy in
`src/funnel/offerContent.tsx` (`BONUSES`), which references each file by path.

| # | Bonus (as sold) | Stated value | Source |
|---|---|---|---|
| 1 | The First-Contact Swipe Pack | $47 | `01-first-contact-swipe-pack.md` |
| 2 | The 3-Touch Follow-Up System | $39 | `02-three-touch-follow-up-system.md` |
| 3 | The Station-Fit Filter & Send Tracker | $29 | `03-station-fit-filter-and-send-tracker.md` |

Stated bonus total: **$115** (`OFFER_FACTS.bonusValueLabel`).

## Fulfilment

The offer promises these are delivered with the Vault download. Two options:

1. **Bundle into the existing ZIP** (recommended) — add the rendered PDFs to
   `vault/radio-reach-vault.zip` in R2. No code change needed; the existing
   `vault_core` download already points at that key.
2. **Separate download row** — add a `bonus_pack` entry to `PRODUCTS` in
   `src/config/storefront.ts` with its own `r2BundleKey`, and include it in the
   `items` array for every order containing `vault_core`.

## Rendering to PDF

Any markdown-to-PDF path works. For example:

```sh
# one file
npx md-to-pdf assets/bonuses/01-first-contact-swipe-pack.md

# all three
npx md-to-pdf assets/bonuses/0*.md
```

## Editing rules

- Every claim in these documents must stay consistent with the FTC disclaimer on the
  sales page: **process promises, never result promises.** No guaranteed airplay,
  no guaranteed reply rates.
- Keep the anti-spam guidance at the foot of each document. It is both accurate and
  legally load-bearing.
- If a bonus name, value, or bullet list changes here, update `BONUSES` in
  `src/funnel/offerContent.tsx` in the same commit.
