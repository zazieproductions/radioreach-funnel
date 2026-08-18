# RadioReach Funnel — UX & Interface Audit

**Date:** 2026-08-18 · **Branch:** `arena/01a012ea-radioreach-funnel`
**Scope:** Sales page → Checkout → Upsells (OTO 1/2/3, Downsell) → Success/Thank-you, plus the shared UI kit, Lucky Wheel, Momentum sequence, and ESP copy slots.

**Mandate:** Make every screen feel cleaner, more intentional, and more premium for a product launch — *without* redesigning the funnel, changing the brand, or touching the offer/pricing structure.

---

## 1. Executive summary

The funnel has a strong, cohesive visual identity (Anton display + Domine serif + Inter, acid `#ffe600` / blood `#e01b24` on near-black) and a well-structured long-form sales flow. The core problems were not the brand — they were **over-stacking**: too many simultaneous urgency/proof mechanisms, the same wheel/jackpot message repeated across ~12 touchpoints, fake "social proof" widgets, and inconsistent product numbers.

Changes made fall into four buckets:

1. **Removed fake social proof** (live-viewer counter, "Alex P. won 2m ago" avatar strip, "342 spinning now" counters) and the fake stock bar.
2. **Consolidated the wheel/jackpot** from ~12 placements down to a coherent handful, and removed the entire off-brand **PlaylistPush "secret second spin"** affiliate detour that sent buyers *away* from checkout.
3. **Unified inconsistent numbers** (`18,000+` everywhere; `4,812` curator contacts) and removed duplicated trust/microcopy lines.
4. **Decluttered checkout** (removed redundant winner cards, wheel nudges, stock bar, live viewers) and fixed low-contrast decline links + wheel-dialog focus for accessibility.

Everything type-checks (`tsc --noEmit`) and builds clean (`vite build`).

---

## 2. Gamification audit — verdicts

| Element | Verdict | Action |
|---|---|---|
| **Spin wheel** (8-slice carnival) | Keep, simplified. It drives the "founder bundle" upsell and is on-brand. Still rigged to always land the jackpot after a near-miss — kept as the core mechanic, but see §6. | Reduced to a **single spin**. Removed second spin + "secret code". |
| **"Secret second spin" → PlaylistPush code** | **Remove.** Off-brand third-party affiliate detour that leaked buyers *out of* the funnel mid-checkout. | Deleted (`LuckyWheel.tsx`, `Checkout.tsx` `SecretSecondSpinCard`). |
| **Countdown timer** | Keep, but consolidate. One shared deadline (`sessionStorage`) is good; it was repeated in too many places. | Removed the 4th instance (final-CTA clock); kept hero + sticky bar + exit intent. |
| **Stock bar** ("37 / 250 licenses left") | **Remove.** Fake, self-decrementing, and redundant with the countdown. | Deleted from hero + checkout. |
| **Live viewers** ("214 artists viewing") | **Remove.** Classic spammy widget, fake. | Deleted. |
| **"Won Xm ago" avatar strip** | **Remove.** Fake pravatar social proof. | Deleted entire strip. |
| **"342 spinning now"** | **Remove.** Fake + inconsistent (appeared in 3 spots). | Deleted all instances. |
| **Progress bar** (Momentum quiz) | Keep (feature-flagged A/B test). Flagged in §6. | Untouched. |
| **Confetti / audio / vibration** | Keep (celebration is the "win" moment) — already `prefers-reduced-motion` aware. | Untouched. |

---

## 3. Information hierarchy

The page already answers the visitor's questions in roughly the right order. Verified against the target sequence:

| Priority | Question | Section | Status |
|---|---|---|---|
| 1 | What is this? | Hero + eyebrow + terminal sample | ✅ |
| 2 | Why should I care? | "The gap isn't talent" agitation + WITHOUT/WITH list | ✅ |
| 3 | Why is it different? | Mechanism (city-by-city) | ✅ |
| 4 | What exactly do I receive? | "The Radio Reach Vault" value stack + founder bundle | ✅ |
| 5 | Can I trust this? | Receipts (testimonials) + guarantee + FAQ | ✅ |
| 6 | Why buy now? | Founder pricing / countdown / sticky bar | ✅ |
| 7 | How do I purchase? | Every CTA → checkout → Stripe | ✅ |

Two sections interrupt this flow and are flagged in §6: the **Momentum quiz** (between "problem" and "mechanism") and the **SEO resource cluster** (between "guarantee" and "FAQ").

---

## 4. Issues found and fixed

### 4.1 Sales page (`SalesPage.tsx`, `ui.tsx`, `esp/copy.tsx`)

- **Removed** the top blood-red alert bar — its message ("founder pricing ends when the timer hits zero") was duplicated by the hero CTA label, the sticky bar, and the final CTA. The value/urgency ticker below it now stands alone. (Also removed the now-unused `alertBar` ESP slot.)
- **Removed** the `LiveViewers` fake counter and the `StockBar` fake stock widget from the hero CTA box.
- **Consolidated** the two trust lines under the hero CTA into one concrete line (`🔒 Stripe checkout · Instant download · 30-day refund`, adaptive via `ctaTrust`).
- **Removed** the "lucky teaser strip" (pravatar "won 2m ago" avatars) entirely.
- **Reduced** the hero wheel block to a single entry point (`Spin the wheel` + "Free spin · no email · unlock the founder bundle"), shown only before a win.
- **Removed** the duplicate "You won the jackpot" card from the hero (the top jackpot banner now covers it).
- **Removed** the final-section wheel box ("Psst — want to feel lucky?" / "Jackpot winner — don't leave it behind") and the final-section countdown, so "TWO ROADS. PICK ONE." closes with a single, uncluttered CTA.
- **Removed** the redundant right-hand price column in the founder-bundle teaser (the info was duplicated on the left).
- **Added** the missing `SectionLabel` to "THIS IS FOR YOU IF…" for consistent section rhythm.
- **Fixed numbers:** `18,020` → `18,000+` (hero caption, terminal preview, testimonials context, upsell copy). Terminal footer simplified to "showing 7 / 18,000+ · rest locked".

### 4.2 Checkout (`Checkout.tsx`)

- **Removed** the `LiveViewers` counter, the `StockBar` card, and all three wheel nudges ("Feeling lucky?" card, desktop wheel teaser, mobile wheel button).
- **Removed** the `SecretSecondSpinCard` (PlaylistPush affiliate) and the `onOpenWheelForSecret` plumbing.
- **Removed** the redundant "winner celebration card" in the left column (the top jackpot banner + row badges already communicate the win).
- **Removed** per-addon duplicate chips ("Save $16/$17 • Winner pick", "🎉 Winner price — code · time") and the redundant "Winner celebration active" summary line. Kept the "YOU WON THIS ✓" corner badge and order-summary badges.
- **Removed** the wheel teaser from the left column so the order selector reads top-to-bottom without distractions.

### 4.3 Lucky Wheel (`LuckyWheel.tsx`, `App.tsx`)

- Reduced to a **single spin**: removed the second-wheel/second-won phases, the `SECRET` segment, `SECRET_INDEX`, and the PlaylistPush code/URL.
- Removed fake counters; added **focus management** (focus moves into the dialog on open, Escape closes).
- Removed the dead `LuckyUpsellInline` component.

### 4.4 Upsells (`Upsells.tsx`)

- Unified `4,800` → `4,812` curator contacts; `18,020` → `18,000+`.
- Raised the near-invisible "No thanks" decline links from `text-white/25` to `text-white/45` (with a stronger hover) for readability/contrast.

---

## 5. Before → after (highlights)

- **Wheel/jackpot touchpoints:** ~12 → **4** (top banner, hero button, stack teaser, checkout banner).
- **Countdown clocks on the sales page:** 4 → **3** (hero, sticky bar, exit-intent modal).
- **Fake "social proof" widgets:** 3 (live viewers, avatar strip, spinning-count) → **0**.
- **Checkout sidebar cards:** winner card, secret-spin card, feeling-lucky card, wheel teaser, stock bar, live viewers → **0** of those; a clean order selector + summary remain.

---

## 6. Recommended next steps (deliberately not changed)

These were flagged but left in place because they're offer/testing decisions, not polish — worth a decision from the funnel owner:

1. **Momentum quiz** (`MomentumSequence.tsx`) — a 3-step "Build your starting plan" quiz with a progress bar sits between the problem and mechanism sections. It interrupts the purchase flow and adds cognitive load before the visitor sees *what they get*. It is feature-flagged and feeds attribution (Meta/Stripe metadata), so it's clearly an active experiment. **Recommendation:** gate it *after* the value stack (post-"What's inside") or kill it if the data doesn't lift conversion.
2. **SEO resource cluster** — the "Free Radio Promotion Guides" block links to three resource pages *before* the FAQ and final CTA, giving visitors an exit path mid-flow. It's an SEO play. **Recommendation:** move it below the final CTA (pre-footer) so organic traffic still finds it but it no longer interrupts the close.
3. **Evergreen countdown** (`useCountdown` in `ui.tsx`) — when the timer reaches zero it silently resets and re-arms forever. This is a fake-deadline pattern; for a genuine launch, tie it to a real drop-dead time (or remove it) so the "price returns to $49" claim is defensible.
4. **Wheel outcome is always a win** — the near-miss → jackpot rig guarantees every spin lands "AU + KIT". Fine as a dopamine mechanic, but every user "winning" dilutes the word *jackpot* for returning visitors.
5. **Dead code** — `FunnelNav.tsx` (the "Demo steps" floating navigator) is no longer rendered anywhere; only its `Stage` type is imported. Safe to delete.
6. **Low-contrast legal/footer text** — FTC disclaimer (`text-white/40`) and footer (`text-white/30`) are intentionally de-emphasized but sit at the accessibility floor. Consider bumping to `/50`–`/55` at the same size.
7. **Hotlinked testimonial avatars** (`images.pexels.com`) — external dependency that can break or change; consider self-hosting.

---

## 7. Files changed

| File | Change |
|---|---|
| `src/funnel/ui.tsx` | Removed `LiveViewers`, `StockBar`, `useFakeStock` |
| `src/funnel/SalesPage.tsx` | Removed alert bar, fake-proof strip, stock bar, live viewers, final wheel box + clock; consolidated hero/stack wheel; number & label fixes |
| `src/funnel/Checkout.tsx` | Removed winner card, secret-spin card, wheel nudges, stock bar, live viewers; simplified addon rows + summary |
| `src/funnel/LuckyWheel.tsx` | Single-spin wheel; removed PlaylistPush second spin + dead component; added dialog focus |
| `src/funnel/TerminalPreview.tsx` | `18,000+` consistency; simplified locked-count line |
| `src/funnel/Upsells.tsx` | Number consistency; decline-link contrast |
| `src/App.tsx` | Removed second-spin mode plumbing |
| `src/esp/copy.tsx` | Removed `alertBar` slot; made `ctaTrust` concrete |
