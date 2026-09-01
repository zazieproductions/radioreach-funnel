# Persuasion Study — a simulated tripwire funnel

A complete, working **dark-pattern funnel** built as a research artifact. It sells
nothing, charges nothing, stores nothing, and transmits nothing. Every
manipulative mechanic in it is registered, cited, severity-rated, and paired with
an honest alternative.

**Route:** `#/study` · **Never deploys:** off by default in production builds.

---

## Why it exists

Reading about manipulative funnels doesn't teach you much. The mechanics only
become legible when they're operating on you — which is why the annotation layer
starts **off**. You walk the funnel as a mark first, then flip X-ray on and see
what happened.

The closing debrief replays *your own session*: which of the 26 patterns actually
fired on you, in what order, with what you told them.

---

## The seven stages

| # | Stage | File | The move |
|---|---|---|---|
| 1 | **Hook** | `stages/Hook.tsx` | Advertorial with outrage premise + curiosity gap, scroll trap, decoy archive, 35%-gated sticky CTA |
| 2 | **Reveal** | `stages/Reveal.tsx` | Long-form offer: agitation stack, authority, testimonials, value stack, FAQ |
| 3 | **Qualify** | `stages/Qualify.tsx` | Weighted quiz → lead gate → fake analysis terminal |
| 4 | **Checkout** | `stages/CheckoutStage.tsx` | Demo payment + pre-checked order bump |
| 5 | **Upsell** | `stages/Upsell.tsx` | Guilt-laden OTO, card "on file", delivery withheld |
| 6 | **Downsell** | `stages/Upsell.tsx` | Door-in-the-face concession after decline |
| 7 | **Thank you** | `stages/ThankYou.tsx` | Receipt played straight, then the reveal |

Persistent across all of them: resetting countdown, decaying seats, fake viewer
count, social-proof toasts, exit-intent shame modal, sticky CTA, support-chat
theater.

---

## Three findings worth citing

### 1. The progress bar is a completion hypnotic, not a progress indicator

```ts
quiz   → (step / (QUESTIONS.length + 1)) * 100   // phantom +1 step
lead   → 85                                       // hard-set
result → 100
```

The `+1` is a step that does not exist. It guarantees the bar can never read 100%
while questions remain, so the visitor is permanently "almost done." Then the
email request hard-sets **85%** — which reframes handing over an address from a
*cost* into *the last 15% of something already nearly finished*.

Measured sequence: `0 → 20 → 40 → 60 → 80 → 85 → 100`. It never reports true
completion at any point.

> Nunes & Drèze (2006) — endowed progress raised completion from 19% to 34% by
> granting progress that was never earned.

### 2. The scoring is real arithmetic performing meaningless gating

The weights are genuine, the sum is honest, the score is displayed. And it cannot
fail:

```
minimum achievable score:  42
approval threshold:        40
```

The lowest score anyone can possibly get already clears the bar. There is no
rejection branch anywhere in the component — `scripts/test-study.ts` asserts this
by stripping comments and string literals from the source and confirming exactly
three phase transitions exist, none of them a failure.

"Answers are weighted; inaccurate answers waste your window" is **intimidation
copy with no enforcement behind it**. Its actual function is to induce honest
self-disclosure, which yields a truthful psychographic profile. What each
question harvests is documented inline in the `reads` field of every choice.

### 3. The self-prediction question is the landmine

Question 4 asks the visitor to predict their own future behavior. Once they click
*"Yes. Immediately."*, that string is stored and quoted back at them on the
checkout, the upsell, and the exit-intent modal. Declining later doesn't mean
disagreeing with the seller — it means contradicting themselves.

> Sherman (1980): merely asking people to predict whether they'd volunteer raised
> actual volunteering from 4% to 31%.

This is the one pattern in the ledger with **no honest version**. Every other
mechanic here has a variant that keeps the psychological structure and drops the
deception. You can only decline to do this one.

---

## The X-ray layer

- **Alt + X** anywhere, or the header toggle.
- Off: transparent passthrough — the funnel behaves exactly like a real one.
- On: every mechanic gets a dashed outline and a family-colored tag; tap for the
  full research card (mechanic → psychology → citation → legal exposure → honest
  rewrite).
- **Ledger** button opens the full catalogue, filterable by family and severity,
  marking which patterns have already fired on you.

## The ledger

26 patterns in `annotations.ts`, each with:

| Field | Contents |
|---|---|
| `mechanic` | How you'd build it |
| `psychology` | The lever it pulls |
| `evidence` | The citation |
| `exposure` | FTC / GDPR / UCPD / ROSCA / WCAG risk |
| `honestVersion` | Same structure, no deception |
| `severity` | 1 (ordinary marketing) → 5 (actionable deception) |

Severity 5 items — the ones that are straightforwardly unlawful if shipped:
resetting countdown, fake seat inventory, synthetic purchase toasts, pre-checked
bump, advertorial camouflage, self-prediction, receipt theater.

**The through-line:** almost none of these require lying about the *product*.
They lie about **context** — how many seats, how long you have, who else is here,
whether you were screened. That's why the honest column is nearly always
populated: the structure is what converts, the lie is what creates the liability.

---

## Safety

| Guard | Status |
|---|---|
| Production build | **Off** unless `VITE_STUDY_ENABLED=true` |
| Dev / preview | On |
| Payment provider | None imported — card field accepts only `4242`, "charge" is a `setTimeout` |
| Network | Zero `fetch` / `sendBeacon` / analytics calls (asserted in tests) |
| Persistence | `sessionStorage` only; dies with the tab |
| Disclosure | Non-dismissible "Simulation" banner on every stage |

`scripts/test-study.ts` enforces all of the above:

```bash
npm run test:study
```

## QA params

| Param | Effect |
|---|---|
| `#/study?study=fast` | Collapse artificial delays to ~0 |
| `#/study?study=ledger` | Open the ledger drawer on load |

---

## SEO / content notes

The ledger entries are written to be quotable. Each pattern's
`mechanic`/`psychology`/`evidence` triple is a self-contained explainer, and the
family taxonomy (attention · commitment · scarcity · social · friction ·
checkout · post-purchase) maps cleanly onto article sections or a pillar-page
cluster. The honest-version column is the natural CTA for an ethical-marketing
angle.
