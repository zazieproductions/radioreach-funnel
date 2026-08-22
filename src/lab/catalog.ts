/* ─────────────────────────────────────────────────────────────
   CONVERSION LAB — experiment catalog
   ─────────────────────────────────────────────────────────────
   Nineteen falsifiable experiments, one per psychological
   principle, mapped onto RadioReach's funnel stages. Each card is
   the spec a developer needs to ship it: mechanism, hypothesis,
   prediction, primary metric, guardrail, variants, mount point.

   Lab rule (inherited from the ESP): experiments may change
   presentation, framing, sequencing, and reward *structure* —
   never the actual price, the product facts, or the offer terms.
───────────────────────────────────────────────────────────── */

import type { FunnelStage, LabExperiment, LabPrinciple } from "./types";

export const PRINCIPLE_LABELS: Record<LabPrinciple, string> = {
  variable_reward: "Variable reward",
  progression: "Progression",
  unlockable: "Unlockable content",
  achievement: "Achievements",
  collection: "Collection completion",
  streak: "Streaks",
  goal_gradient: "Goal gradient",
  curiosity: "Curiosity loop",
  anticipation: "Anticipation & reveal",
  choice_architecture: "Choice architecture",
  friction: "Friction reduction",
  momentum: "Perceived momentum",
  narrative: "Narrative framing",
  salience: "Visual salience",
  timing: "Micro-interaction timing",
  personalization: "Personalization",
  commitment: "Commitment & consistency",
  endowment: "Endowment effect",
  anchoring: "Anchoring",
};

export const STAGE_LABELS: Record<FunnelStage, string> = {
  attention: "Attention (hero)",
  engage: "Engage (scroll/proof)",
  configure: "Configure (checkout)",
  pay: "Pay",
  post_purchase: "Post-purchase",
};

export const EXPERIMENTS: readonly LabExperiment[] = [
  {
    id: "lab_variable_reward",
    title: "Jackpot schedule — variable vs fixed ratio",
    pitch: "Not every spin wins. The wins feel bigger.",
    principles: ["variable_reward", "anticipation"],
    stage: "engage",
    mechanism:
      "The production wheel is a fixed-ratio FR-1 schedule: every spin pays. Dopamine spikes on the *cue*, not the outcome, so the reward habituates. Variable-ratio schedules (VR-2…VR-8) move the spike to the resolution — the loss-free 'near win' keeps the loop alive and increases re-spin behavior, while rarer-but-bigger wins raise prize salience.",
    hypothesis:
      "If we move the wheel from FR-1 to a VR schedule with a mega tier, then spin→claim conversion and repeat spins will rise, because intermittent outcomes sustain engagement longer than a guaranteed prize.",
    prediction:
      "VR-3 lifts spin-to-claim by 8–15%; VR-8 lifts re-spins but risks coupon-abandonment — needs the countdown safety net.",
    primaryMetric: "Spin → claim rate (coupon applied at checkout)",
    guardrail: "Overall checkout start rate must not fall; complaint rate flat.",
    variants: ["control (FR-1)", "vr-2", "vr-3", "vr-8", "vi"],
    prototype: "VariableReward",
    dropIn: "LuckyWheel outcome generator (`src/funnel/LuckyWheel.tsx`)",
    risk: "medium",
    expectedLift: "+8–15% claim",
  },
  {
    id: "lab_progression_ladder",
    title: "Airplay ladder — XP for engagement",
    pitch: "Every scroll earns rank. Ranks unlock real bonuses.",
    principles: ["progression", "unlockable", "goal_gradient"],
    stage: "engage",
    mechanism:
      "A rank ladder (Listener → Curator → Program Director → Station Owner) converts passive page behavior into visible XP with named thresholds. Progress itself becomes the reward; unlocks at each rank (guides → templates → price lock) make further reading feel instrumental rather than effortful.",
    hypothesis:
      "If visitors earn visible XP and rank unlocks for engagement, then scroll depth and section completion will rise, because progression converts exploration into a scored activity with intermediate wins.",
    prediction:
      "Below-the-fold section completion up 10–20%; time-to-CTA flat (XP is earned, not waited for).",
    primaryMetric: "% of visitors reaching the final CTA section",
    guardrail: "Bounce rate; CTA click-through must not drop.",
    variants: ["control (no ladder)", "ladder", "ladder + unlock toasts"],
    prototype: "ProgressionLadder",
    dropIn: "StickyBar area or floating chip — non-intrusive, persistent",
    risk: "low",
    expectedLift: "+10–20% depth",
  },
  {
    id: "lab_unlockable_drawers",
    title: "Locked drawers in the vault",
    pitch: "Two drawers are open. Three are sealed.",
    principles: ["unlockable", "curiosity"],
    stage: "engage",
    mechanism:
      "The value stack is re-framed as a vault with sealed drawers. Each locked drawer opens after a micro-action (answer one question, open one FAQ, take the spin). Effort-begets-value (IKEA effect) plus the information gap makes the contents feel scarce and earned before purchase.",
    hypothesis:
      "If vault contents are gated behind micro-actions instead of listed flat, then perceived value and CTA rate rise, because self-earned access increases liking and curiosity about what's still sealed.",
    prediction: "Drawer-open rate >60%; CTA lift 5–12% for openers.",
    primaryMetric: "CTA click rate (stack section)",
    guardrail: "Micro-actions must stay <10s; rage-click/bounce signals watched.",
    variants: ["control (flat list)", "locked drawers"],
    prototype: "UnlockableContent",
    dropIn: "Replaces the 'WHAT'S INSIDE / STACK' list on SalesPage",
    risk: "medium",
    expectedLift: "+5–12% CTA",
  },
  {
    id: "lab_achievement_toasts",
    title: "Achievement toasts for micro-behaviors",
    pitch: "“Prove It — you checked the receipts.” Unlocked 3/6.",
    principles: ["achievement", "timing", "momentum"],
    stage: "engage",
    mechanism:
      "Small, rare, staggered toasts name what the visitor just did (dwelled on proof, revisited pricing, finished the page). Naming behavior makes it self-defining ('I'm the kind of artist who does the research'), and the 3/6 counter creates a visible collection that begs completion.",
    hypothesis:
      "If micro-behaviors are mirrored back as named achievements with a running counter, then visitors will complete more page sections, because acknowledgment converts browsing into a series of small wins.",
    prediction: "Toasted behaviors repeat 2–3× more often; section completion up.",
    primaryMetric: "% of visitors triggering ≥3 achievements",
    guardrail: "Toast frequency capped (max 1 per 20s); zero effect on load perf.",
    variants: ["control (no toasts)", "toasts", "toasts + counter"],
    prototype: "AchievementToasts",
    dropIn: "Toast host beside ESP DebugPanel mount; reused on checkout + success",
    risk: "low",
    expectedLift: "+2× repeat behavior",
  },
  {
    id: "lab_collection_kit",
    title: "Campaign kit — collect all 5 pieces",
    pitch: "You already own 1 of 5. The kit wants finishing.",
    principles: ["collection", "goal_gradient", "endowment"],
    stage: "configure",
    mechanism:
      "The core + add-ons are re-framed as a 5-piece Campaign Kit with the first slot pre-stamped. Pre-stamped progress (endowed progress) plus set-completion ('3 of 5') makes the remaining pieces feel like they finish something you already started — the classic coffee-card effect (Kivetz et al.).",
    hypothesis:
      "If checkout presents a partially-complete kit instead of independent add-ons, then add-on attach rate rises, because visitors treat missing slots as an open goal rather than optional purchases.",
    prediction: "Add-on attach +10–18%; AOV +$3–6.",
    primaryMetric: "Add-on attach rate (contracts + AU)",
    guardrail: "Cart abandonment at payment step must not rise.",
    variants: ["control (checkbox add-ons)", "kit grid, 1 pre-stamped", "kit + near-complete glow"],
    prototype: "CollectionKit",
    dropIn: "Checkout left column, replacing plain add-on labels",
    risk: "medium",
    expectedLift: "+10–18% attach",
  },
  {
    id: "lab_streak_calendar",
    title: "7-day outreach streak",
    pitch: "Don't break the chain. Day 3 of 7.",
    principles: ["streak", "commitment"],
    stage: "post_purchase",
    mechanism:
      "After delivery, buyers get a 7-day outreach calendar. A streak is a self-sustaining commitment device: the sunk cost of a 3-day chain raises the cost of skipping day 4. One freeze token softens the loss so a missed day doesn't kill the whole loop.",
    hypothesis:
      "If buyers are shown a streak calendar instead of a static 'start outreach' link, then 7-day activation rises, because the chain makes daily action the default and breaking it a visible loss.",
    prediction: "Day-7 activation +25–40%; refund requests flat or down (activated users extract value).",
    primaryMetric: "D7 outreach completion (self-reported / email-open proxy)",
    guardrail: "Support tickets must not rise; refund policy unchanged.",
    variants: ["control (static CTA)", "streak calendar", "streak + freeze token"],
    prototype: "StreakTracker",
    dropIn: "SuccessPage below download links",
    risk: "low",
    expectedLift: "+25–40% activation",
  },
  {
    id: "lab_goal_gradient",
    title: "Goal-gradient checkout bar",
    pitch: "You're 90% there. One step left.",
    principles: ["goal_gradient", "momentum"],
    stage: "pay",
    mechanism:
      "A 4-step progress bar ('Found ✔ · Price locked ✔ · Copy prepared ✔ · Pay') that opens 75% full and animates the final stretch with an eased, accelerating fill. Goal-gradient research shows effort accelerates near the finish — so the funnel should *feel* nearly finished the moment it's shown.",
    hypothesis:
      "If the payment step is framed as the last 25% of an already-running process, then checkout completion rises, because finishing feels cheaper than starting.",
    prediction: "Checkout completion +6–14%; time-in-checkout drops.",
    primaryMetric: "Payment-session completion rate",
    guardrail: "No change to refunds/chargebacks; form errors unchanged.",
    variants: ["control (no bar)", "bar 75% pre-filled", "bar + auto-completing steps"],
    prototype: "MomentumChecklist",
    dropIn: "Checkout header, above EmbeddedStripeCheckout",
    risk: "low",
    expectedLift: "+6–14% completion",
  },
  {
    id: "lab_curiosity_gap",
    title: "The open loop — mistakes artists make",
    pitch: "Mistake #2 is the one you're making right now.",
    principles: ["curiosity", "anticipation"],
    stage: "engage",
    mechanism:
      "Three cards tease the answers to high-stakes questions ('The #1 reason radio emails get deleted') and reveal on tap. Each reveal chains into the next gap ('Mistake #2 is worse — and it's the one you're making right now'). Open loops are aversive to leave unclosed; each closure feeds the next.",
    hypothesis:
      "If objections are presented as teased, tap-to-reveal gaps instead of visible FAQ text, then time-on-page and CTA rate rise, because the visitor keeps closing loops until the page's argument is fully read.",
    prediction: "≥2/3 gaps opened by engaged visitors; +5–10% CTA for openers.",
    primaryMetric: "Gap-open rate + downstream CTA rate",
    guardrail: "No dark patterns: each gap must stay openable in one tap, no fake buttons.",
    variants: ["control (visible answers)", "tap-to-reveal", "chained loops"],
    prototype: "CuriosityLoop",
    dropIn: "Between testimonials and the final CTA (replaces one FAQ row)",
    risk: "low",
    expectedLift: "+5–10% CTA",
  },
  {
    id: "lab_anticipation_reveal",
    title: "Staggered vault reveal",
    pitch: "Flip. Pause. Flip. The stack builds itself.",
    principles: ["anticipation", "narrative"],
    stage: "engage",
    mechanism:
      "The value stack is delivered as five face-down cards that flip one by one with a 250ms stagger. Anticipation — the gap between knowing a reveal is coming and seeing it — amplifies the perceived value of each item (savoring), and the sequence turns a list into a short story with rising stakes.",
    hypothesis:
      "If vault contents are revealed sequentially instead of simultaneously, then perceived value and CTA rate rise, because staggered payoff schedules make each item land as its own reward event.",
    prediction: "+4–9% CTA; +6% scroll-completion of the stack.",
    primaryMetric: "CTA click rate (stack section)",
    guardrail: "prefers-reduced-motion must collapse to the flat list; no layout shift.",
    variants: ["control (flat list)", "flip reveal", "flip + story captions"],
    prototype: "RevealSequence",
    dropIn: "Replaces the value-stack rows on SalesPage",
    risk: "low",
    expectedLift: "+4–9% CTA",
  },
  {
    id: "lab_choice_decoy",
    title: "Three-tier decoy pricing",
    pitch: "Three doors. One obvious answer.",
    principles: ["choice_architecture", "anchoring"],
    stage: "configure",
    mechanism:
      "Checkout is presented as three tiers: Starter ($55, list only), Vault ($20, everything), Pro ($97, Vault + done-for-you campaign). The $55 tier is a dominated decoy — worse than the Vault on every dimension — which makes the $20 option the obvious, dominant choice while the $97 tier re-anchors the ceiling.",
    hypothesis:
      "If a dominated decoy option frames the Vault as the obvious middle choice, then purchase conversion rises, because the Vault becomes the no-regret default instead of a yes/no gamble.",
    prediction: "+7–15% purchase conversion; some AOV lift via Pro tier.",
    primaryMetric: "Purchase conversion rate",
    guardrail: "Refund rate and support load flat; decoy must be a real, purchasable option.",
    variants: ["control (single offer)", "three tiers", "three tiers + 'most chosen' badge"],
    prototype: "PriceAnchoring",
    dropIn: "Checkout selector — requires the decoy SKU to be real and purchasable",
    risk: "high",
    expectedLift: "+7–15% conversion",
  },
  {
    id: "lab_friction",
    title: "One field. That's the whole form.",
    pitch: "Email. Pay. You're in.",
    principles: ["friction", "choice_architecture", "personalization"],
    stage: "pay",
    mechanism:
      "Every field added to a payment flow is a decision point that invites abandonment. The experiment collapses to a single email field (Stripe collects the rest anyway), pre-fills it when the visitor already typed it anywhere, and replaces required-field friction with 'why we ask' microcopy on the optional ones.",
    hypothesis:
      "If checkout asks for one field instead of three, then payment-start and completion rates rise, because each removed decision point removes an exit ramp.",
    prediction: "+10–20% payment starts; +4–8% completion.",
    primaryMetric: "Payment starts / completion",
    guardrail: "No increase in failed-charge or fraud rates (Stripe handles rest).",
    variants: ["control (multi-field)", "email-only", "email-only + prefill"],
    prototype: "FrictionLab",
    dropIn: "Above EmbeddedStripeCheckout when the offer doesn't need extra data",
    risk: "low",
    expectedLift: "+10–20% starts",
  },
  {
    id: "lab_perceived_momentum",
    title: "The checklist that's already 75% done",
    pitch: "Three steps are finished. You only see one button.",
    principles: ["momentum", "friction", "goal_gradient"],
    stage: "pay",
    mechanism:
      "A four-item checklist opens with three items visibly completed ('Found the contacts ✔', 'Price locked ✔', 'Copy prepared ✔') and the fourth as the only remaining action. Perceived progress is real progress: showing the finish line close by reduces the psychological distance to paying.",
    hypothesis:
      "If checkout opens on an almost-complete checklist, then completion rises, because the payment action is framed as closing a loop rather than starting a process.",
    prediction: "+6–12% checkout completion.",
    primaryMetric: "Checkout completion rate",
    guardrail: "Completed items must be true statements (founder price genuinely locked).",
    variants: ["control", "pre-completed checklist", "pre-completed + auto-advance"],
    prototype: "MomentumChecklist",
    dropIn: "Checkout header block",
    risk: "low",
    expectedLift: "+6–12% completion",
  },
  {
    id: "lab_narrative_frame",
    title: "Story first, list second",
    pitch: "2:47am, page 6 of Google. That's where this ends.",
    principles: ["narrative", "anticipation"],
    stage: "attention",
    mechanism:
      "The hero opens on a second-person scene — the 2am Google spiral, the info@ inbox, the Friday intern — before any feature appears. Stories transport: readers encode the product as the *resolution* of a scene they've lived, and narrative transportation suppresses counter-arguing while the list of features later lands on prepared ground.",
    hypothesis:
      "If the hero leads with a 3-line scene instead of a feature claim, then scroll depth and CTA rate rise, because transported readers process the value stack as plot resolution rather than marketing.",
    prediction: "+5–10% scroll depth; +4–8% hero CTA.",
    primaryMetric: "Hero CTA rate + scroll depth",
    guardrail: "LCP and hero clarity must not regress; the offer line stays above the fold.",
    variants: ["control (claim-led hero)", "scene-led hero", "scene + reveal"],
    prototype: "RevealSequence",
    dropIn: "Hero sub-headline + first fold on SalesPage",
    risk: "medium",
    expectedLift: "+4–8% CTA",
  },
  {
    id: "lab_visual_salience",
    title: "CTA salience treatments",
    pitch: "The same button, six ways louder.",
    principles: ["salience", "timing"],
    stage: "attention",
    mechanism:
      "Attention is a zero-sum budget: the CTA competes with the wheel, the clock, and the ticker. Six treatments re-weight that budget — soft pulse, glow ring, shimmer, contrast arrow, countdown chip — each stealing attention at a different frequency and cost. Salience drives the first click; timing (when the accent fires) drives the second.",
    hypothesis:
      "If the primary CTA owns a time-boxed visual accent (pulse/glow) distinct from every other animated element, then CTA click rate rises, because the page's single highest-contrast motion channel routes attention to the action.",
    prediction: "+3–7% CTA clicks; best treatment wins within 2 weeks at current traffic.",
    primaryMetric: "CTA click rate",
    guardrail: "prefers-reduced-motion users get the static button; no seizure-risk frequencies (≤3Hz, no strobe).",
    variants: ["baseline", "soft pulse", "glow ring", "shimmer", "countdown chip", "arrow slide"],
    prototype: "VisualSalience",
    dropIn: "`.cta` class treatments on the hero button",
    risk: "low",
    expectedLift: "+3–7% CTA",
  },
  {
    id: "lab_micro_timing",
    title: "Timing the acknowledgment",
    pitch: "Saved. Organizing your access around that…",
    principles: ["timing", "momentum"],
    stage: "engage",
    mechanism:
      "The momentum sequence already delays its acknowledgment 1450ms. This experiment varies that delay (400ms / 900ms / 1450ms / 2200ms) and the acknowledgment microcopy. The delay signals that work is happening *for the visitor* — perceived computation raises perceived value — but too long reads as lag.",
    hypothesis:
      "If the acknowledgment delay is tuned to ~900–1450ms with 'working for you' microcopy, then sequence completion rises, because the pause converts a click into a visible service moment without breaking flow.",
    prediction: "Completion +3–6% at 900–1450ms; 2200ms drops out (lag perception).",
    primaryMetric: "Momentum-sequence completion rate",
    guardrail: "No increase in sequence abandonment; total time-to-CTA capped.",
    variants: ["400ms", "900ms", "1450ms (current)", "2200ms"],
    prototype: "AchievementToasts",
    dropIn: "MomentumSequence `advanceTimer` constant + toast stagger",
    risk: "low",
    expectedLift: "+3–6% completion",
  },
  {
    id: "lab_personalization",
    title: "Your plan, by name",
    pitch: "We stamped your copy with your target market.",
    principles: ["personalization", "endowment"],
    stage: "configure",
    mechanism:
      "Answers already captured in the momentum sequence (target market, bottleneck) are echoed into checkout and the success page: 'Your college-radio plan', 'Built for your release cycle'. Self-referential copy exploits the cocktail-party effect — people notice their own data — and turns a generic file into a personal document.",
    hypothesis:
      "If checkout echoes the visitor's own answers into headings and summaries, then completion rises, because the product stops being a generic list and becomes the visitor's plan.",
    prediction: "+4–10% completion; higher post-purchase satisfaction scores.",
    primaryMetric: "Checkout completion (segmented by sequence completion)",
    guardrail: "Privacy line unchanged — answers stay client-side, no new data collected.",
    variants: ["control (generic copy)", "echo answers in checkout", "echo + success-page plan"],
    prototype: "EndowmentWidget",
    dropIn: "Checkout header + SuccessPage summary (uses MomentumAnswers)",
    risk: "low",
    expectedLift: "+4–10% completion",
  },
  {
    id: "lab_commitment_ladder",
    title: "Two small yesses before the big one",
    pitch: "Will you send 5 pitches if the contacts are in front of you?",
    principles: ["commitment", "friction"],
    stage: "engage",
    mechanism:
      "A foot-in-the-door ladder asks two low-cost self-commitments ('Do you have a release this year?' → 'Would you send 5 personal pitches?') before the $20 ask. Each yes is an act of identity: once a visitor says they'd do the outreach, declining the tool that enables it becomes self-inconsistent — consistency pressure does the closing.",
    hypothesis:
      "If visitors commit to two micro-yesses before the CTA, then purchase conversion rises among responders, because the yes-ladder makes the final ask consistent with their stated self.",
    prediction: "Responders convert +15–25% vs control; ~40% answer the ladder.",
    primaryMetric: "CTA conversion among ladder responders",
    guardrail: "Skip path must be one visible tap away; no nagging after skip.",
    variants: ["control (straight CTA)", "yes-ladder", "yes-ladder + echo-back"],
    prototype: "CommitmentLadder",
    dropIn: "Replaces one mid-page CTA block on SalesPage",
    risk: "medium",
    expectedLift: "+15–25% responder CVR",
  },
  {
    id: "lab_endowment",
    title: "Your vault is already reserved",
    pitch: "Copy #14,203 is holding for you. Expires in 9:59.",
    principles: ["endowment", "personalization"],
    stage: "attention",
    mechanism:
      "The offer is framed as an already-reserved personal copy with a release countdown: 'Vault #14,203 is holding for you — if you leave, it releases to the next artist.' Endowment makes the loss of a possession loom larger than the gain of acquiring it; the countdown makes the loss concrete and dated.",
    hypothesis:
      "If the vault is presented as a reserved personal copy that expires, then exit-intent return and CTA rate rise, because the visitor is defending something they already feel they own.",
    prediction: "+5–10% CTA; higher return-visit conversion via saved reservation.",
    primaryMetric: "CTA rate + return-visit conversion",
    guardrail: "The reservation must be honest (the SKU never actually sells out) — frame as 'price hold', not inventory lie.",
    variants: ["control", "reserved copy + countdown", "reserved + named stamp"],
    prototype: "EndowmentWidget",
    dropIn: "Hero CTA box or exit-intent modal",
    risk: "medium",
    expectedLift: "+5–10% CTA",
  },
  {
    id: "lab_anchoring",
    title: "Anchor the offer, not a fictional value stack",
    pitch: "A $55 offer for $20. Or 5¢ a day.",
    principles: ["anchoring", "choice_architecture"],
    stage: "configure",
    mechanism:
      "Anchoring works through the *order* numbers arrive. Three honest presentations hold the price at $20: (a) bare $20, (b) the complete Vault is usually worth $55 and is $20 today (current page), and (c) a per-day reframe ('less than 5¢/day'). The live page uses one flat $55 reference point rather than adding item-level values.",
    hypothesis:
      "If the anchor precedes the price and is self-generated (the stack the visitor just read), then perceived value and conversion rise, because $20 is judged against the last large number seen, not the visitor's own prior.",
    prediction: "A clear $55-to-$20 presentation should outperform a bare price by reducing uncertainty without adding checkout friction.",
    primaryMetric: "CTA rate per presentation",
    guardrail: "No fabricated anchor values — every anchor maps to real listed line items.",
    variants: ["bare $20", "$55→$20 simple anchor", "simple comparison", "per-day reframe"],
    prototype: "PriceAnchoring",
    dropIn: "Pricing box on SalesPage + checkout summary",
    risk: "low",
    expectedLift: "+8–20% CTA",
  },
];

export const EXPERIMENT_BY_ID = new Map(EXPERIMENTS.map((e) => [e.id, e]));
