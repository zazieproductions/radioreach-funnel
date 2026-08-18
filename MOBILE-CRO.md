# Mobile-First Conversion Pass — Meta (Facebook / Instagram) Ad Traffic

**Date:** 2026-08-18 · **Branch:** `arena/01a0130d-radioreach-funnel`
**Scope:** Landing → checkout → delivery, optimized for a cold visitor on a phone,
inside the Facebook/Instagram in-app browser, deciding in 15–30 seconds.

**Constraint respected:** no rebrand. Anton / Domine / Inter, acid `#ffe600`,
blood `#e01b24`, near-black `#08080a`, the same sections in the same voice.
Everything below is speed, hierarchy, ergonomics and measurement.

---

## 1. The visitor this was built for

Taps an ad → lands in a webview → holds the phone in one hand → reads roughly
one line of body copy → decides. Three things had to be true that weren't:

1. The page had to **paint and be tappable immediately**.
2. The **offer and the price** had to be on the first screen, above the fold.
3. **Buying** had to be reachable without hunting, and survivable inside a webview.

---

## 2. Speed — what now happens before the visitor's thumb moves

| Change | Detail | Effect |
|---|---|---|
| Meta Pixel deferred | The queueing stub still installs synchronously and `PageView` still fires at time zero; only the 70 KB `fbevents.js` transport waits for first interaction / `load` / 1.5 s, whichever is first. Queued events flush on arrival. | Removes a third-party fetch from the critical path with **no event loss**. |
| First-paint CSS inlined | `<style>` in `<head>` paints the dark surface plus a 4-block skeleton inside `#root`. | No white flash, structure visible in ~100 ms instead of a blank screen. |
| Hero image → WebP | `studio-640/960/1280.webp` via `<picture>`, preloaded with `type="image/webp"`. | 48.9 KB → **15.5 KB** on phones (−68%); JPEG kept as fallback. |
| Fonts | `display=optional` → `display=swap`, plus a condensed fallback stack (`Arial Narrow / Haettenschweiler / Impact`) for Anton. | Headline text paints instantly in a face shaped like Anton, then swaps — no invisible text, minimal shift. |
| Lucky Wheel code-split | Modal (canvas + WebAudio + confetti) moved behind `lazy()`; only `LuckyWheelButton` stays in the entry bundle. | Entry bundle **319.6 KB → 304.2 KB** (−15.4 KB raw, −4.2 KB gzip). |
| Checkout pre-warmed | `requestIdleCallback` imports the checkout chunk (and with it Stripe.js) after the hero settles. | Tapping buy renders the payment step from cache instead of two round trips. |
| OG image | 1.9 MB PNG → **180 KB JPEG** (1200×800). | Meta's crawler and the feed thumbnail resolve far faster. |
| Preconnects | Ordered by need: `fonts.gstatic` → `js.stripe.com` → `connect.facebook.net`. | Handshakes overlap with parsing. |

Suspense fallbacks are now **shaped like their destination** (checkout skeleton,
Stripe form skeleton with field placeholders) rather than a centred spinner.

---

## 3. Above the fold — the 15-second answer

Order on a 390 × 844 screen, all visible without scrolling:

1. Eyebrow (tightened) → **headline** → one-line promise
2. **Value chips:** `18,000+ contacts · Instant download · One-time $20 · 30-day refund`
3. **Price block:** `$20` beside a struck-through `$49` and a `Save 59%` badge
4. **Primary CTA** (54 px tall, full width)
5. Rating line, trust line, and **payment badges** (Stripe / Visa / Mastercard / Amex / Apple Pay / Google Pay)

Supporting moves:

- The desktop hero paragraph is long-form; phones get a new adaptive slot
  `heroSubShort` (one sentence per emotional mode), so the ESP still adapts tone
  without costing four lines of vertical space.
- The big flip clock became a single inline `⏳ 00:14:57` chip on phones and
  stays a flip clock from `sm:` up — same urgency, ~60 px cheaper.
- The **terminal sample now sits directly under the price** (proof of product
  before the wheel detour), with the wheel entry point moved below it.
- Testimonials are a **swipeable snap rail** on phones instead of eight stacked
  cards, and become the two-column grid again at `sm:`.
- The **SEO resource cluster moved below the final CTA**. It used to offer three
  ways off the page immediately before the close.

---

## 4. Thumb ergonomics

- **Sticky buy bar appears at 120 px of scroll** (was 380 px) on phones, and now
  carries price, live countdown, the CTA, and a one-line reassurance. A scrim
  separates it from content; `.pb-buybar` keeps the last section clear of it.
- Every primary CTA is ≥ 54 px tall and full width; secondary controls ≥ 44 px.
- `:active` feedback on non-CTA surfaces (`.pressable`, labels) so nothing feels
  dead under a thumb.
- Sticky layers get `translateZ(0)` to stop sub-pixel jitter during momentum scroll.

---

## 5. Checkout — payment within a thumb's reach

Desktop keeps its rich two-column layout. Phones get a purpose-built version:

- A **40 px command strip**: `← Back`, `🔒 Secure Stripe checkout`, live countdown —
  replacing the stacked banner + big header (~180 px reclaimed).
- One **compact order card**: three single-line rows (name, one clarifying clause,
  price, toggle), the total, and a `What's inside the add-ons?` disclosure. The
  verbose add-on cards remain on desktop.
- The Stripe form is now **immediately below the total**, so the "Continue to
  secure payment ↓" hop is gone.
- Under the form: payment badges plus "your download links unlock on the next
  screen, the second the payment clears."
- Add-on toggles emit a `checkout_addon_toggle` analytics event.

---

## 6. Surviving the in-app browser

- **Real history entries.** Stage changes `pushState`, and `popstate` restores the
  previous stage. A back swipe from checkout returns to the offer instead of
  ejecting the visitor from the site. `#/success` is detected and reloaded properly.
- **Delivery notice.** The success page detects the FB/IG webview (`FBAN`,
  `FBAV`, `FB_IAB`, `Instagram`) and explains the `•••` → *Open in browser* escape
  hatch, with a one-tap "copy this page's link" fallback — the failure mode where
  a paid customer thinks the product is broken.
- **Download buttons** are full width on phones.
- **ESP init is now fail-safe.** A missing `IntersectionObserver` in an exotic
  webview used to throw during init and blank the entire sales page; the adaptive
  copy layer now degrades to default copy instead of taking the offer down with it.

---

## 7. Measurement — so the ad account can actually learn

| Event | When | Why |
|---|---|---|
| `ViewContent` | Landing view, once per session, with value + `content_ids` | The signal between PageView and Purchase that lets a cold campaign optimize. |
| `AddToCart` | First tap on any buy CTA, tagged with which CTA | Mid-funnel volume while Purchase counts are thin. |
| `InitiateCheckout` | Checkout mount (existing) | Unchanged. |
| `Purchase` | Verified session, pixel + CAPI, deduped by Stripe session id (existing) | Unchanged. |

**Match quality:** `src/lib/traffic.ts` captures the landing context once
(`fbclid`, utm, referrer, platform, webview) and keeps it in `sessionStorage`,
because Stripe's return URL drops the original query string. `fbc` / `fbp` are read
from the pixel cookies — or synthesized as `fb.1.<ts>.<fbclid>` when the pixel
hasn't loaded yet — and travel into Stripe session metadata, which the webhook
replays into the **Conversions API `user_data`**. Purchases previously matched on
hashed email alone.

---

## 8. Deploy fix found along the way

`dist/_redirects` (the SPA fallback) was not in `public/`, so **every `npm run build`
deleted it**. It now lives in `public/_redirects` and is emitted on every build.

---

## 9. Deliberately not changed

1. **Momentum quiz** placement — a live, flagged experiment; moving it would
   invalidate its data. Still recommended (as in `UX-AUDIT.md`) to sit after the
   value stack.
2. **Evergreen countdown** that re-arms at zero — a pricing/ethics decision, not a
   layout one.
3. **Rigged wheel outcome** — core mechanic, left intact.
4. **Upsell (OTO) pages** — post-purchase; they follow the same CTA sizing rules
   but were not restructured in this pass. A sticky accept bar there is the next
   obvious AOV test.
5. **Unlayered custom CSS vs Tailwind utilities** — `.esp-slot` and friends sit
   outside Tailwind's layers and therefore out-rank utilities. Fixing that globally
   risks silent layout drift; the one place this pass needed a display switch on an
   ESP slot uses a wrapper element instead, with a comment explaining why.

---

## 10. Files touched

| File | Change |
|---|---|
| `index.html` | Inline first-paint CSS + boot skeleton, deferred pixel transport, preconnects, WebP hero preload, JPEG OG image |
| `src/index.css` | Condensed display fallback stack, skeletons, buy-bar scrim, chips, snap rails, thumb-zone rules |
| `src/lib/traffic.ts` | **New** — landing context capture, webview detection, `fbc`/`fbp` resolution |
| `src/lib/metaPixel.ts` | `trackOnce`, `trackViewContent`, `trackAddToCart` |
| `src/lib/api.ts` | `collectMeta()` — click ids into the checkout session payload |
| `src/App.tsx` | History-backed navigation, checkout prefetch, ViewContent/AddToCart, checkout-shaped skeleton, lazy wheel |
| `src/funnel/SalesPage.tsx` | Hero restructure, value chips, payment badges, proof rail, resource cluster moved below the close |
| `src/funnel/ui.tsx` | `InlineCountdown`, `PaymentBadges`, `ValueChips`, rebuilt sticky buy bar |
| `src/funnel/Checkout.tsx` | Mobile command strip, compact order card, payment-adjacent layout, add-on analytics |
| `src/funnel/EmbeddedStripeCheckout.tsx` | Form-shaped skeleton, mobile-lean header |
| `src/funnel/SuccessPage.tsx` | In-app-browser delivery notice, full-width downloads |
| `src/funnel/LuckyWheelButton.tsx` | **New** — light entry point so the modal can be lazy |
| `src/esp/copy.tsx` | `heroSubShort` slot (4 tone variants) |
| `src/esp/index.ts` | Fail-safe init |
| `functions/api/checkout/session.ts` | `fbc` / `fbp` / `fbclid` / platform in Stripe metadata |
| `functions/api/stripe/webhook.ts` | Replays click ids into CAPI |
| `functions/_lib/metaCapi.ts` | Accepts `fbc` / `fbp` in `user_data` |
| `public/_redirects` | **New** — SPA fallback survives builds |
| `public/images/*.webp`, `radioreach-share-v2.jpg` | Optimized media |

`tsc --noEmit` clean · `vite build` clean · headless DOM smoke test (render →
CTA → checkout → back gesture) passes with zero console errors.
