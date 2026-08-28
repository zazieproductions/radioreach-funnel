# ZIP & DELIVERY GUIDE — Frequency Dominion [Frequency-Dominion-97-Upsell.zip]

*Step-by-step: package, host, deliver. 5 minutes, repeatable for every buyer.*

---

## STEP 1 — VERIFY THE PACKAGE

Confirm the folder `Frequency-Dominion-Upsell/` contains all required assets:

- `SALES-PAGE.html` — the $997 → $97 upsell page (host separately; see Step 4)
- `Course-Overview.md` + `Course-Overview.pdf` — doctrine + module map
- `Module-1-Command-Identity/` … `Module-6-Empire-Loop/` — 4 lessons each (24 total), each with:
  - `Lessons/Lesson-X.Y-*.md` — video script + drills + prompts
  - `Templates/TX.Y-*.csv` / `.md` — fillable implementation template
  - `War-Room-Notes/War-Room-*.pdf` — elite private strategy PDF
  - `Community-Prompts/*.md` — group engagement prompts
- `Bonuses/Bonus-1…5/` — heat map DB, audio script vault, EPK deck, audit engine, resources index
- `Resources/` — heat maps, calendars, pitch vaults, follow-up sequences, audit checklist

## STEP 2 — COMPILE THE ZIP (from the repo root)

```bash
cd /path/to/radioreach-funnel
rm -f Frequency-Dominion-97-Upsell.zip
zip -r Frequency-Dominion-97-Upsell.zip Frequency-Dominion-Upsell \
  -x "*/.DS_Store" -x "*/__pycache__/*"
ls -lh Frequency-Dominion-97-Upsell.zip
```

Expected output: one `.zip` (~2–6 MB depending on PDFs), no stray folders, no `node_modules`.

## STEP 3 — UPLOAD TO R2 (PRIVATE FULFILLMENT)

1. Upload `Frequency-Dominion-97-Upsell.zip` to the private R2 bucket (object key e.g. `courses/frequency-dominion-97.zip`).
2. Add the object to the fulfillment allowlist used by `functions/` so the existing signed-URL flow authorizes it.
3. Test: complete a test order → success screen → download → unzip → verify folder structure.

## STEP 4 — HOST THE SALES PAGE

- Option A (recommended, live upsell): host `SALES-PAGE.html` at `https://radioreach.us/frequency-dominion` (path may be added to the Cloudflare Pages app).
- Option B (post-purchase upsell): render it as the checkout add-on / post-checkout upsell screen in the existing funnel (`src/funnel/`) with the new Stripe Price ID for $97.
- **Payment wiring:** create the Stripe price ($97 USD, one-time) and add its Price ID to the server-side allowlist (`functions/` + `src/config/storefront.ts` keys). Never trust a browser-supplied price.
- **Attribution:** pass `utm_*` + `fd_upsell` metadata into Stripe checkout metadata so the purchase is attributable to this offer (audit requirement).

## STEP 5 — SEQUENCE & QA

- Sales page copy test: anchor $997 renders, countdown persists 7 days per visitor (localStorage), sticky CTA appears after hero.
- Risk-reversal copy confirms: run the 21-day campaign, log it, 30-day refund + keep bonuses.
- Email follow-up (post-purchase): Day 0 access link → Day 2 start Module 1 → Day 7 Lesson 1.3/1.4 drill → Day 14 Module 2 → Day 21 campaign calendar → Day 30 refund window message.
- Community: invite buyers into the member group; post Module-N community prompts weekly.

## STEP 6 — RELEASE

1. `git add` the course folder (or keep it in the repo — recommended).
2. Open the PR from `arena/01a0462a-radioreach-funnel` → `main`, merge, deploy.
3. Send the live-page URL to traffic, verify the zip flow end-to-end, and log first-week conversion.

---

## WHAT NOT TO SHIP

- ✗ The 24 war-room PDFs are **member-only** — never publish them on the public site.
- ✗ Never include the RadioReach Vault data file(s) inside this zip (they're a separate product).
- ✗ Never change the $97 price in the page without updating the Stripe Price ID + anchor logic together.

*Frequency Dominion · built to print. Execute the loop.*
