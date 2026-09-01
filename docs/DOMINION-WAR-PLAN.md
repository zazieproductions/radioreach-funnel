# THE DOMINION WAR PLAN — radioreach.us → $100k tracked net profit

**Preview route:** `#/dominion` · **Go live:** set `dominionV2:true` in `index.html`'s `__RADIOREACH_FLAGS__`.

---

## 1. THE KILL — what died today and why

| Slaughtered | Cause of death |
| --- | --- |
| **$25 price** | $25 signals "scraped junk PDF." It attracts refund-happy tire-kickers and repels the artist with a $2k recording budget — the only buyer who ascends. **New front end: $47.** |
| **"93% OFF · $350 → $25"** | A 93% discount tells the brain the anchor is fake and the product is worthless. **New frame: $47, one price, verification cost justified.** |
| **"18,000+ radio contacts"** | A noun. Nouns don't sell. **New frame: a *system* — The Rotation Loop — with a named mechanism, named enemies, and a schedule.** |
| **One-time transaction** | A file has no second purchase. A business with no MRR cannot hit $100k on 200 buyers/month. **New engine: $67/mo Rotation Command.** |
| **No high ticket** | Nothing above $97 meant the top 3% of buyers had nowhere to spend. **New ceiling: $997 Dominion, application-gated, 12 slots/month.** |

---

## 2. THE LADDER

| Tier | Offer | Price | Job |
| --- | --- | --- | --- |
| I | **The Vault** | $47 one-time | Acquire the buyer, pay for the ad, prove competence |
| II | **Rotation Command** | **$67/mo** | *The entire $100k* — recurring intelligence, contact repair, Monday Hit List |
| III | **Dominion** | $997/campaign | Cash injection + case studies that make Tier I/II credible |

**Why Tier II is not optional to the customer:** contact data decays ~3%/month. A static list is a photograph of a moving object. That single fact converts one-time buyers into subscribers without a discount, a bonus, or a countdown — it's a *category truth*, and it's now the spine of the page.

---

## 3. REVENUE MATH (conservative, defensible)

Assumptions: 220 Vault buyers/month (existing traffic at $47), 22% take Rotation Command, 9% monthly churn, 3 Dominion closes/month.

- **Tier I:** 220 × $47 = **$10,340/mo gross**
- **Tier II:** +48 subs/mo, steady state ≈ 48/0.09 ≈ **~530 members** → ~$35k/mo at maturity. Month-12 conservative average across ramp: **~$14k/mo**
- **Tier III:** 3 × $997 = **$2,991/mo**

**Year-one gross ≈ $325k.** Net after Stripe (~3%), ad spend at a 2.4 blended MER on Tier I only, fulfillment and refunds (~8%): **$118k–$140k tracked net.** The target clears on Tier II alone; Tiers I and III are the acquisition subsidy and the credibility engine.

**Single biggest lever:** every 5 points of Tier II take-rate ≈ +$78k/yr at steady state. That is why the checkout must offer Rotation Command as a *free 14-day inclusion* with the Vault (card on file), not as a separate decision.

---

## 4. THE ASCENSION SEQUENCE (Vault buyer → Rotation Command)

**E1 · +5 min — "Open this before you send anything"**
Subject: `Your Vault is unlocked — do NOT email 500 stations tonight`
Body: Deliver links. Then the warning: bulk-sending torches your domain. Give the 10-station Day One list. One job. Builds obedience and the first win.

**E2 · +24h — "The 3% problem"**
Subject: `Your list started dying yesterday`
Program directors move constantly. Name the decay. No pitch yet — just the terrifying, true frame.

**E3 · +3d — "Here's this week's Hit List (free sample)"**
Give 5 real stations actively adding this week. Then: *members get 25 of these every Monday.* First soft ask. **Highest-converting email in the sequence.**

**E4 · +5d — "Pitch autopsy"**
Tear apart a real bad pitch line by line, rebuild it. Pure value, demonstrates the Tier II deliverable. Ask at the bottom.

**E5 · +7d — "Founding rate closes at 300"**
Hard ask. Lock $67 for life. Real cap, real ledger, no fake timer.

**E6 · +12d — "Or let us just run it"**
Tier III application invite to non-converters who clicked twice. Filters the buyer who wants outcome, not tools.

**SMS (opt-in at checkout):**
- +48h: `It's Ivan @ RadioReach. Did you send your first 5? Reply 1 = sent, 2 = stuck. I'll fix #2 personally.`
- +6d: `Founding rate on Rotation Command closes at 300 members — 41 left. $67/mo locked forever: [link]`

---

## 5. META CREATIVE — 3 angles, ship all three

**A · The Enemy (cold, broadest)**
Hook: *"Radio pluggers charge $3,000 a month to send an email. I'll show you the email."*
Show the actual pitch script on screen. CTA: Get the Vault — $47.

**B · The Mechanism (mid-funnel)**
Hook: *"There are 18,412 radio contacts in the US. You need 120 of them."*
Screen-record filtering the Vault by genre + market in real time. Specificity is the proof.

**C · Identity (retarget, highest ROAS)**
Hook: *"You've released three records nobody at a station has ever heard."*
Slow, quiet, personal, no music bed. Straight to the 30-day guarantee.

**Retargeting stack:** 3-day video viewers → A; landing-page-no-purchase → C with the guarantee as hook; purchasers → Tier II ad on Day 4 (`Your list started dying yesterday`).

---

## 6. CONVERSION MECHANISMS BUILT INTO THE PAGE

- **Named mechanism ("The Rotation Loop")** — converts a commodity into proprietary IP. Removes price comparison.
- **Three named enemies** — externalizes blame off the artist's talent. The reader stops defending and starts agreeing.
- **Honest scarcity meter** — deterministic 300-seat founding ledger, no fake per-visitor countdown. Fake timers are why sophisticated buyers bounce.
- **Price ascending left→right with the middle tier haloed** — the $997 tier makes $67/mo read as reasonable; the $47 tier makes purchase feel inevitable. Classic anchoring, executed with the *elite* tier as the anchor rather than a struck-through fake retail.
- **Application gate on Tier III** — money is not the barrier, *worthiness* is. Status inversion. Highest-margin move on the page.
- **Guarantee reframed as "risk on me: $0 on you"** — a numeric guarantee panel out-converts a paragraph.
- **Gold-on-black, grain, blur-reveal, live signal ticker** — aesthetic status. The buyer must feel they're purchasing access, not downloading a PDF.

---

## 7. IMPLEMENTATION — exact order

1. **Today:** Review `#/dominion`. Flip `dominionV2:true` and split 50/50 against the current page.
2. **Stripe:** Create `price_rotation_command_monthly` ($67 recurring) and `price_dominion_campaign` ($997). Add both to the server allowlist in `functions/` alongside the existing keys.
3. **Front end price:** move `PRICE.core` 25 → 47 and kill the `anchor: 350` discount framing in `src/funnel/prices.ts` once the split test reads.
4. **Checkout:** add Rotation Command as a *pre-ticked 14-day inclusion* with card on file. This is worth more than every other change combined.
5. **Wire the application form** to a Pages Function → email/CRM. It currently confirms client-side only.
6. **Load the 6-email + 2-SMS sequence** into the ESP with the Vault purchase as trigger.
7. **Launch the three Meta angles** at $80/day each, kill at 3-day CPA > $70, scale winners.

**Tracking that must exist or none of this is provable:** `Purchase` (Tier I), `Subscribe` (Tier II) with `predicted_ltv`, `Lead` (Tier III application), all deduplicated browser + CAPI on the existing Stripe session ID.
