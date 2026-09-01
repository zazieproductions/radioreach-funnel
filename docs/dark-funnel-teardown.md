# Anatomy of a tripwire funnel — a working replica, annotated

**Status: research artifact. Never deployed, never deployable.**
Nothing in it is for sale, no payment processor is reachable from any screen,
and it is excluded from `npm run build`. It exists so the persuasion mechanics
of a modern info-product funnel can be *run and measured* instead of described
from memory.

```bash
npm run dev:darkfunnel      # http://localhost:5180
npm run test:darkfunnel     # 41 tests: the mechanics, and the walkthrough
```

Press **`x`** anywhere in the replica (or hit **X-ray** in the disclosure
strip) to paint each pattern's name over the live element, and click a tag to
open its full annotation. `#/teardown` is the index.

---

## 1. Why build the thing instead of writing about it

Descriptions of dark patterns are easy to nod along to and impossible to feel.
Screenshots are worse — they freeze the one property that does the work, which
is *timing*. A pre-checked box in a screenshot is an obvious trick; a
pre-checked box that appears after you have spent six minutes writing an
argument for the purchase, under a rolling clock, with a chat agent standing
by, is a different object entirely.

So this replica runs the whole ladder for real:

| # | Screen | Route | Persuasion job |
|---|--------|-------|----------------|
| 1 | Hook | `#/hook` | Buy attention with a curiosity gap; convert reading posture into scrolling momentum |
| 2 | Reveal | `#/reveal` | Reframe a purchase as forbidden access; agitate, then supply authority and proof |
| 3 | Qualify | `#/qualify` | Make the visitor author the case for buying; manufacture selectivity |
| 4 | Checkout | `#/checkout` | Convert defaults into revenue; anchor the price; decorate with trust cues |
| 5 | Upsell | `#/oto` | Harvest the compliance state created by the first yes |
| 6 | Downsell | `#/downsell` | Rejection-then-retreat; shrink the salient number, not the price |
| 7 | Thank you | `#/thanks` | Deliver the receipt, then the reveal: the product was vapor, the patterns were the point |
| — | Teardown | `#/teardown` | The catalogue, the arithmetic, the citations |

The funnel never leaves the document. That is a persuasion decision, not an
engineering one: client-side routing means the countdown, the seat counter and
the viewer count never reset between "pages".

---

## 2. The three pieces of arithmetic

Everything else in the funnel is copy. These three are math, which makes them
falsifiable — and all three are in `src/darkfunnel/core.ts` as pure functions
with tests.

### 2.1 The progress bar is a completion hypnotic

```ts
quizProgressPct(step, total) = step / (total + 1) * 100
PHASE_PROGRESS.lead   = 85   // hard-set
PHASE_PROGRESS.result = 100  // hard-set
```

The inflated denominator means the bar **cannot** reach 100% while questions
remain. With six questions:

| Step | Bar shows | Honest | Understated by |
|------|-----------|--------|----------------|
| 0/6 | 0.0% | 0.0% | — |
| 1/6 | 14.3% | 16.7% | 2.4pt |
| 2/6 | 28.6% | 33.3% | 4.8pt |
| 3/6 | 42.9% | 50.0% | 7.1pt |
| 4/6 | 57.1% | 66.7% | 9.5pt |
| 5/6 | 71.4% | 83.3% | 11.9pt |
| 6/6 | 85.7% | 100.0% | 14.3pt |

Then lead capture *jumps* to a hard-set 85% — a number the formula can never
produce — and holds there through the fake analysis, before snapping to 100%
at the verdict. The bar is decoupled from progress in both directions.

Why 85%: the goal-gradient effect (Kivetz, Urminsky & Zheng 2006) says effort
accelerates as perceived distance-to-goal shrinks. 85% reads as *almost*
while leaving visible headroom; 95% reads as a rounding error and stops
motivating. The bar's job is not to inform, it is to keep the visitor in the
steep part of the gradient for as long as possible.

**Tell:** a progress indicator that never displays a step count you can verify
(`Question 4 of 6` next to `57%` is arithmetically impossible for an honest bar).

### 2.2 The scoring is real and gates nothing

Six questions, four weighted options each: 4⁶ = **4,096** possible answer
vectors. The weights are summed honestly and printed to two decimals so the
verdict looks forensic. The test suite enumerates all 4,096 and asserts the
outcome:

```
test("every one of the 4^6 answer vectors is approved")  ✓
```

There is no fail branch anywhere in the source. `Verdict.approved` is typed as
the literal `true` — the type system cannot express a rejection. The score's
only function is to select which compliment gets printed: a low score is told
"the people who need this most always score here", a high score is told
"priority clearance". Both are good news; only the flavour of specialness
changes.

The intimidation line — *"Answers are weighted. Inconsistent responses are
flagged automatically and lying only wastes your allocation window"* — has no
code behind it. Its function is to raise earnestness, because an earnest
answer is a self-disclosure, and self-disclosures make the verdict land
personally. Threat of detection substitutes entirely for detection.

**Tell:** a qualification step with no visible rejection path, and no way to
find anyone who was rejected.

### 2.3 The scarcity never resolves

| Widget | Function | Behaviour |
|--------|----------|-----------|
| Countdown | `rollingDeadline(startedAt, 9min, now)` | Anchored to *your* arrival; rolls forward on expiry. Every visitor gets the same window, forever. |
| Seats | `seatsLeft({start, floor: 3, intervalMs: 26_000}, elapsed)` | Decays on a timer with a floor. Perpetually nearly gone, never gone. |
| Viewers | `viewerCount({base: 63, spread: 14}, tick, rand)` | Bounded random walk: never low enough to look empty, never high enough to be checked. |
| Toasts | `toastSchedule(seed, 14)` | Two word lists and a seeded PRNG. Cadence widens (9s → ~22s) so it never reads as a loop. |

All four are pure functions of `(seed, elapsed)`, which is the finding rather
than a shortcut: **none of it polls anything, because there is nothing to
poll.** Same seed, same "live" crowd, every time — the tests assert exactly
that.

**Tell:** a deadline that survives a hard refresh in a new incognito window
with a full clock is a metronome, not a deadline.

---

## 3. The headline formula

> **outrage premise + withheld outcome**

*"Doctors are calling it psychological malpractice"* → *"11,482 people did it
anyway — none will talk about what happened next."*

Two clauses doing two different jobs:

1. **The premise** supplies moral arousal. The reader has a stake before they
   have a subject. Note it is always *attributed* ("doctors", "a psychologist",
   "three conglomerates") and never *sourced* — attribution carries the
   authority, sourcing would carry the liability.
2. **The withheld outcome** names a specific consequence and refuses to state
   it. Curiosity is an aversive state (Loewenstein 1994): the click is
   relief-seeking, not interest. The gap is manufactured by the refusal, not
   by the topic.

The corpus in `copy.ts` (`HEADLINES`) is four premise/outcome pairs written to
be recombined. Swap either half and click-through moves; remove either half
and the headline stops working:

| Outrage premise | Withheld outcome |
|---|---|
| Doctors are calling it psychological malpractice | 11,482 people did it anyway — none will talk about what happened next. |
| Three radio conglomerates tried to bury this memo | The 400 artists who read it first stopped answering their labels. |
| A programming director called it "ethically indefensible" | He has used it on every playlist he has built since. |
| Universities quietly pulled the study from their servers | The 19-minute protocol inside it is still circulating in six countries. |

**Supporting devices in the same page:**

- **False precision.** "11,482" outperforms "over 11,000" because unrounded
  numerals imply a counting process. No process exists. Precision is texture.
- **The refusal-to-publish move.** "I am not going to reproduce it here, and by
  the end you will understand why." Converts absence of evidence into evidence.
- **The hedged testimonial.** "I wouldn't do it again, and I would not undo
  it." Qualified praise reads as unscripted; unqualified praise reads as an ad.
- **"You were not meant to find this."** Specialness + paranoia in six words —
  and it makes the claim unfalsifiable, because any counter-evidence becomes
  part of the suppression.

---

## 4. Timing: what fires when

| Trigger | Element | Why there |
|---|---|---|
| Scroll depth **> 35%** | Sticky CTA appears | Below the threshold the visitor is a skimmer and the bar classifies as an ad; above it they are invested and it classifies as a shortcut. One boolean (`showCta`) decides which. |
| ~6s after load, cursor exits top edge | Exit-intent modal | Fires exactly at disengagement, reframing departure as forfeiting something already held (endowment + loss aversion). |
| 22s idle | Chat bubble nudges | Perceived human presence lowers scrutiny; keyword replies all terminate at the CTA. |
| 4.2s, then widening gaps | Social-proof toasts | Density first ("everyone is doing this"), spacing later (so it never reads as a script). |
| Immediately post-"charge" | OTO | Identity has just shifted prospect → buyer; consistency pressure peaks and price sensitivity bottoms out. |
| On decline | Downsell | Rejection-then-retreat: the concession obligates a concession in return. |

The downsell is worth its own line. Declining **$197** produces an offer of
**3 × $67 = $201** — *more money, fewer deliverables* (the file review is
removed) — while the salient number falls from 197 to 67. Partitioned pricing
(Morwitz, Greenleaf & Johnson 1998) works because people compare the number in
the largest type.

---

## 5. Pattern index

24 patterns are catalogued in `src/darkfunnel/annotations.ts`, each with
mechanism, what it extracts from the visitor, and a citation. Risk labels are
mine, and they are about *legal exposure*, not taste:

| Risk | Meaning | Count |
|---|---|---|
| **Gray area** | Legitimate technique used aggressively; defensible | 8 |
| **Deceptive** | Makes a false impression a reasonable consumer would rely on | 10 |
| **Unlawful in some markets** | Specific prohibitions exist somewhere it would be served | 6 |

Selected exposure map (not legal advice):

- **Pre-ticked box for a paid extra** — EU Consumer Rights Directive Art. 22
  prohibits it outright; UK equivalent in the Consumer Contracts Regulations.
- **Fake countdown / false limited availability** — UCPD Annex I ¶7 (the
  "blacklist"), and in the UK the DMCC Act 2024 brought false-urgency practices
  under direct CMA enforcement.
- **Reference-price anchoring** — the EU Omnibus Directive requires prior-price
  claims to reflect the lowest price actually charged in the preceding 30 days.
  A "was $349" that was never $349 is a straightforward breach.
- **Fabricated testimonials and activity notifications** — FTC 16 CFR 255 and
  the 2024 Rule on Consumer Reviews and Testimonials; the FTC has brought
  actions over fake "X just purchased" notices specifically.
- **Editorial costume** — FTC *Native Advertising: A Guide for Businesses*
  (2015); UK CAP Code 2.3–2.4 require ads to be obviously identifiable as ads.
- **Confirmshaming** — no standalone statute, but it appears by name in the
  OECD's *Dark Commercial Patterns* (2022) and in the EU's DSA Art. 25 as a
  prohibited interface practice for platforms.

---

## 6. The honest counterparts

Most of these techniques have a legitimate twin. The difference is almost
always whether the underlying fact is true, and whether the visitor could
verify it if they tried:

| Manipulative | Legitimate twin |
|---|---|
| Rolling countdown anchored to arrival | A real campaign end date, same for everyone, that actually ends |
| Decaying seat counter with a floor | Real inventory or cohort caps, which can reach zero |
| Fabricated activity toasts | Aggregate real sales ("1,240 sold this month"), reported accurately |
| Pre-checked paid bump | Unchecked bump with a clear, honest description of the value |
| Anchor price nothing sold at | A genuine former price, with the date it applied |
| Qualification quiz with no fail branch | A fit quiz that actually tells some people not to buy — and means it |
| Confirmshaming decline | A decline of equal visual weight to the accept |
| Manufactured labour terminal | Real processing, honestly represented (progress that reports work) |
| Curiosity-gap headline over vapor | A curiosity-gap headline whose payload is genuinely delivered |

The tell that separates them is the same in every row: **does the claim survive
someone checking it?** Everything in the replica is built to be uncheckable —
anonymous experts, deleted accounts, mirror-host download logs, participants
who "declined to comment".

---

## 7. If you wanted to study this properly

The replica logs an exposure ledger (`state.tsx`) — every pattern that
actually rendered, in order, with a repeat count. The thank-you screen prints
it back as an "attention receipt". That is the hook for real measurement:

- **Per-pattern lift** requires each pattern behind its own flag, randomised
  independently, with the funnel step as the outcome. The existing
  `src/lab/` harness (deterministic FNV-1a bucketing) is the right shape for
  this if you ever want to run *ethical* variants on the live storefront.
- **Guardrails matter more than lift here.** Refund rate, chargeback rate,
  complaint rate, and 30-day retention will catch the patterns that convert
  a sale and lose a customer. Every one of the "deceptive" rows above is
  known to trade short-term conversion against exactly those numbers.
- **Time-to-decision** is the variable most of these patterns actually move.
  Urgency props don't usually change *whether* someone buys; they change how
  much deliberation happens first, which is precisely why regulators treat
  them as a harm to the transactional decision rather than a fib about a
  product.

---

## 8. Isolation guarantees

This is the part that matters for a repo that also serves a real storefront:

- Separate Vite project (`experiments/darkfunnel/vite.config.ts`) with its own
  HTML entry. **`npm run build` never touches it.**
- No file in `src/App.tsx`, `src/funnel/`, `src/course/` or `functions/`
  imports anything from `src/darkfunnel/`. Nothing on radioreach.us routes here.
- Any build output goes to `.arena/darkfunnel-dist` — gitignored, and outside
  the Cloudflare Pages publish directory.
- `noindex,nofollow,noarchive,nosnippet` on the entry document, plus a
  standing disclosure strip on every screen, a console banner, and an explicit
  statement on the checkout and thank-you screens.
- No network code exists in the replica: no `fetch`, no Stripe, no form action,
  no endpoint. The card field is inert and pre-filled with the well-known test
  number so a real one cannot be typed into it.

---

## 9. Source map

```text
src/darkfunnel/
├── core.ts           # every mechanic as a pure function (progress, scoring, scarcity, ladder)
├── copy.ts           # the whole persuasion corpus in one file, diffable
├── annotations.ts    # 24 patterns: mechanism / cost / risk / citation
├── router.ts         # nav('/reveal') — hash routing, no page loads
├── state.tsx         # session + the exposure ledger
├── xray.tsx          # the annotation overlay
├── widgets.tsx       # countdown, seats, viewers, toasts, exit-intent, chat, progress, terminal
├── darkfunnel.css    # two registers: "paper" (content farm) and "pitch" (offer machine)
├── DarkFunnelApp.tsx # shell: disclosure strip, routes, pattern inspector
└── pages/            # Hook · Reveal · Qualify · Checkout · Oto · Downsell · ThankYou · Teardown

scripts/
├── test-darkfunnel.ts      # 30 tests — the mechanics are false in specific, reproducible ways
└── test-darkfunnel-ui.ts   # 11 tests — jsdom walkthrough of the full ladder
```

### Reading list

Loewenstein, *The psychology of curiosity* (1994) · Kivetz, Urminsky & Zheng,
*The goal-gradient hypothesis resurrected* (2006) · Buell & Norton, *The labor
illusion* (2011) · Johnson & Goldstein, *Do defaults save lives?* (2003) ·
Cialdini, *Influence* (rev. 2007), esp. ch. 3 and ch. 7 · Cialdini et al.,
*Reciprocal concessions procedure* (1975) · Freedman & Fraser,
*Foot-in-the-door* (1966) · Morwitz, Greenleaf & Johnson, *Divide and prosper*
(1998) · Tversky & Kahneman, *Judgment under uncertainty* (1974) · Brignull,
`deceptive.design` · OECD, *Dark Commercial Patterns* (2022) · FTC, *Bringing
Dark Patterns to Light* (2022).
