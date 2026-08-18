# Conversion Lab

A parallel system to the [ESP](../esp/README.md). Where the ESP adapts copy
*tone* from behavioral signals, the Conversion Lab hosts **conversion
experiments**: flag-gated prototypes built from game-design loops,
reinforcement-learning reward schedules, and consumer-psychology effects.

Everything lives under `src/lab/` and renders in an isolated review surface —
open the dev server and visit **`#/lab`** (e.g. `http://localhost:5173/#/lab`).

```
src/lab/
├── catalog.ts            # 19 hypothesis cards (mechanism → metric → guardrail)
├── core.ts               # pure mechanics: bucketing, schedules, streaks, easing
├── flag.ts               # kill switches + per-experiment variant overrides
├── log.ts                # event ring + attribution snapshots (mirrors esp/log.ts)
├── types.ts              # shared types
├── LabGallery.tsx        # the #/lab review surface (event feed, variant QA)
├── experiments/          # 14 working prototypes
│   ├── VariableReward.tsx        # variable-ratio vs fixed-ratio jackpot
│   ├── ProgressionLadder.tsx     # XP ranks + goal-gradient bar + unlocks
│   ├── UnlockableContent.tsx     # sealed drawers behind micro-actions
│   ├── CollectionKit.tsx         # pre-stamped 5-piece kit (set completion)
│   ├── StreakTracker.tsx         # 7-day outreach chain + freeze token
│   ├── AchievementToasts.tsx     # named micro-behavior rewards
│   ├── CuriosityLoop.tsx         # teased answers, chained open loops
│   ├── RevealSequence.tsx        # staggered flip reveal + story framing
│   ├── PriceAnchoring.tsx        # same $20, four reference frames + decoy
│   ├── EndowmentWidget.tsx       # reserved personal copy + countdown
│   ├── CommitmentLadder.tsx      # foot-in-the-door micro-yesses
│   ├── VisualSalience.tsx        # six CTA attention budgets + dwell timing
│   ├── MomentumChecklist.tsx     # checklist that opens 75% complete
│   └── FrictionLab.tsx           # one-field / prefill / no-form checkout
```

## The 19 experiments

Each entry in `catalog.ts` is a full spec: psychological mechanism, falsifiable
hypothesis, prediction, primary metric, guardrail, variants, mount point, risk,
and expected lift. Open **Show hypothesis cards** in the gallery to read them
next to their prototypes.

| Principle | Experiment | Stage | Working prototype |
| --- | --- | --- | --- |
| Variable reward | Jackpot schedule FR-1 → VR-2/3/8/VI | engage | `VariableReward` |
| Progression | Airplay ladder XP + rank unlocks | engage | `ProgressionLadder` |
| Unlockable content | Locked drawers in the vault | engage | `UnlockableContent` |
| Achievements | Toasts for micro-behaviors | engage | `AchievementToasts` |
| Collection completion | Pre-stamped 5-piece kit | configure | `CollectionKit` |
| Streaks | 7-day outreach chain | post-purchase | `StreakTracker` |
| Goal gradient | Checkout bar 75% pre-filled | pay | `MomentumChecklist` |
| Curiosity loop | Teased answers, chained gaps | engage | `CuriosityLoop` |
| Anticipation & reveal | Staggered flip reveal | engage | `RevealSequence` |
| Choice architecture | Decoy pricing tiers | configure | `PriceAnchoring` |
| Friction reduction | One-field checkout | pay | `FrictionLab` |
| Perceived momentum | Auto-completing checklist | pay | `MomentumChecklist` |
| Narrative framing | Scene-led hero ("2:47am") | attention | `RevealSequence` |
| Visual salience | Six CTA attention budgets | attention | `VisualSalience` |
| Micro-interaction timing | Acknowledgment delay + dwell | engage | `AchievementToasts` |
| Personalization | Echo answers into checkout | configure | `EndowmentWidget` |
| Commitment & consistency | Foot-in-the-door yes-ladder | engage | `CommitmentLadder` |
| Endowment | Reserved personal copy | attention | `EndowmentWidget` |
| Anchoring | $742→$49→$20 stack, per-day reframe | configure | `PriceAnchoring` |

## Flag & QA

Same four-way kill switch contract as the ESP:

1. **URL** — `?lab=off` (per visit)
2. **localStorage** — `lab.disabled=1` (this browser)
3. **Env** — build with `VITE_LAB_ENABLED=false` (per deploy)
4. **Source** — remove the `#/lab` route / prototype usages

QA helpers (URL params):

- `?lab=debug` — open the live event feed by default
- `?lab=lab_anchoring:decoy tiers,lab_friction:email-only` — force variants
  (comma-separated `experiment:variant` pairs)
- The variant switchers on each card persist per session
  (`sessionStorage["lab.qa.variants.v1"]`)

## Assignment & attribution

Bucketing is **deterministic**: `FNV-1a(experimentId + visitorId) → bucket →
variant`. A visitor keeps the same variant across sessions, so a purchase can
always be attributed to the variant that produced it.

- `getVisitorId()` — stable id in `localStorage["lab.visitor.v1"]`
- `getLabSnapshot()` — `{ visitorId, assignments }` attached to every
  conversion event
- `getLabAttribution()` — low-cardinality `lab_<experiment>: <variant>` map,
  built to ride along in checkout analytics and Stripe metadata exactly like
  `getMomentumAttribution()`

Events persist in `sessionStorage["lab.events.v1"]` (capped ring). To ship them
to Cloudflare Analytics or any backend, swap the body of `sink()` in `log.ts`
for a `sendBeacon`/`fetch` — call sites don't change.

## Shipping an experiment

1. Pick a card from the catalog; confirm the guardrail is measurable.
2. Wire the prototype into the production mount point:

   ```tsx
   import { useLabVariant } from "./lab";
   const [variant] = useLabVariant("lab_anchoring", ["control", "treatment"]);
   if (variant === "treatment") return <Treatment />;
   return <Control />;
   ```

3. Add `labLogConversion` at the CTA so the conversion event carries the
   variant + full assignment snapshot.
4. Attach `getLabAttribution()` to checkout/purchase analytics (and Stripe
   metadata in `functions/api/checkout/session.ts`).
5. Ship at 50/50, monitor the primary metric **and the guardrail**; kill via
   `?lab=<experiment>:control` or `lab.disabled=1` — no deploy needed.

## Guardrails (non-negotiable)

- **Price, product facts, and offer terms never change.** Experiments vary
  presentation, framing, sequence, and reward structure only. The anchoring and
  decoy prototypes keep $20 = $20 in every variant; anchors map to real line
  items, and a decoy tier only ships if the SKU is real and purchasable.
- **No dark patterns.** Curiosity gaps close in one tap and never re-lock;
  commitment ladders keep a visible skip path; the endowment countdown frames a
  real founder-price hold, never an inventory lie.
- **Motion stays safe.** ≤ ~2Hz animations, no strobe, and everything collapses
  to static content under `prefers-reduced-motion` (the global rule already
  handles this).
- **Privacy stays flat.** The lab collects no new personal data — only
  low-cardinality behavior + a random visitor id, same posture as the ESP.

## Measurement plan

Primary funnel metrics per stage (already instrumented in production):

- **attention** — hero CTA rate, scroll depth
- **engage** — section completion, spin→claim, momentum-sequence completion
- **configure** — add-on attach, AOV
- **pay** — payment starts, completion, cart abandonment
- **post-purchase** — D7 activation, refund rate

Every prototype logs `assignment → exposure → action* → milestone* →
conversion` with the variant attached, so any downstream tool that reads
`lab.events.v1` (or the future backend sink) can compute lift per variant.
For significance planning: the catalog lists an expected lift per experiment —
run the highest-expected-lift, lowest-risk cards first (see the risk tags in
the gallery).

## Suggested first three to ship

1. **`lab_perceived_momentum`** (risk: low, +6–12% expected) — a pure
   presentation change at the payment step; easiest to measure, hardest to
   break.
2. **`lab_anchoring`** (risk: low, +8–20% expected) — the pricing box already
   anchors; this only tunes the reference points.
3. **`lab_collection_kit`** (risk: medium, +10–18% attach) — pre-stamped
   progress on the add-ons; pairs naturally with the existing jackpot framing.

## Tests

```bash
npm run test:lab
```

Runs the pure-mechanics suite (`scripts/lab-smoke.ts` — bucketing determinism,
reward-schedule distributions, streak/freeze rules, goal-gradient easing,
collection math) plus jsdom integration scenarios (`scripts/lab-integration.tsx`
— gallery renders all 14 prototypes, variant overrides, and the `lab=off` kill
switch).
