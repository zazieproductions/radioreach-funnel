/* ─────────────────────────────────────────────────────────────
   PERSUASION STUDY — the pattern ledger
   ─────────────────────────────────────────────────────────────
   Every manipulative mechanic in this simulated funnel is
   registered here with (a) what it does mechanically, (b) the
   psychology it exploits and the literature it comes from,
   (c) the compliance exposure it carries in the US/EU, and
   (d) the honest version of the same move.

   The funnel pages import these ids and tag their own DOM, so
   the annotated overlay and the closing debrief are generated
   from one source of truth — the copy can never drift from the
   research notes.
───────────────────────────────────────────────────────────── */

export type PatternFamily =
  | "attention"
  | "commitment"
  | "scarcity"
  | "social"
  | "friction"
  | "checkout"
  | "post_purchase";

export type PatternStage =
  | "hook"
  | "reveal"
  | "qualify"
  | "checkout"
  | "oto"
  | "downsell"
  | "thanks"
  | "global";

export type Pattern = {
  id: string;
  label: string;
  family: PatternFamily;
  stages: PatternStage[];
  /** The mechanic, described the way a developer would build it. */
  mechanic: string;
  /** The cognitive lever it pulls. */
  psychology: string;
  /** Where the effect comes from in the literature. */
  evidence: string;
  /** Regulatory / platform exposure if shipped for real. */
  exposure: string;
  /** The version that gets the same lift without the deception. */
  honestVersion: string;
  /** How dark it is: 1 = ordinary marketing, 5 = actionable deception. */
  severity: 1 | 2 | 3 | 4 | 5;
};

export const FAMILY_LABELS: Record<PatternFamily, string> = {
  attention: "Attention capture",
  commitment: "Commitment & consistency",
  scarcity: "Manufactured scarcity",
  social: "Social proof",
  friction: "Friction engineering",
  checkout: "Checkout architecture",
  post_purchase: "Post-purchase extraction",
};

export const STAGE_LABELS: Record<PatternStage, string> = {
  hook: "1 · Hook (advertorial)",
  reveal: "2 · Reveal (offer page)",
  qualify: "3 · Qualify (quiz + lead)",
  checkout: "4 · Checkout",
  oto: "5 · Upsell (OTO)",
  downsell: "6 · Downsell",
  thanks: "7 · Thank you",
  global: "Persistent (all stages)",
};

export const PATTERNS: readonly Pattern[] = [
  /* ── ATTENTION ─────────────────────────────────────────── */
  {
    id: "outrage_premise",
    label: "Outrage premise headline",
    family: "attention",
    stages: ["hook"],
    mechanic:
      "Headline opens with an authority condemning the practice ('program directors are calling it career suicide'). The condemnation is never sourced, never quoted in full, and never revisited in the body.",
    psychology:
      "Moral outrage is the highest-arousal emotion in shareable content, and high-arousal affect — of either valence — is what predicts virality, not positivity. Condemnation also implies the thing works, or nobody would object.",
    evidence:
      "Berger & Milkman (2012), 'What Makes Online Content Viral' (JMR): arousal, not sentiment, drives sharing. Brady et al. (2017, PNAS): moral-emotional language increases diffusion ~20% per word.",
    exposure:
      "Fabricated expert condemnation is a deceptive representation under FTC Act §5 and the FTC Endorsement Guides (16 CFR 255) if it implies a real professional consensus.",
    honestVersion:
      "Lead with the real, specific objection people actually raise and answer it: 'Most cold radio pitches get deleted. Here's what changes that.'",
    severity: 4,
  },
  {
    id: "curiosity_gap",
    label: "Curiosity gap / withheld outcome",
    family: "attention",
    stages: ["hook", "reveal"],
    mechanic:
      "Second clause names a precise count of people and withholds what happened to them ('11,482 did it anyway — none will talk about what happened next'). The article then defers the answer three more times.",
    psychology:
      "An information gap between what you know and what you want to know is experienced as an aversive state — like an itch. Reading is the scratch. Specific numbers make the gap feel factual and therefore fillable.",
    evidence:
      "Loewenstein (1994), 'The Psychology of Curiosity' (Psych. Bulletin) — information-gap theory. Zeigarnik (1927): interrupted tasks are recalled and pursued more than completed ones.",
    exposure:
      "Not illegal on its own; becomes deceptive when the withheld payoff does not exist, which is the case here.",
    honestVersion:
      "Open loops are fine when you actually close them. State the outcome in the headline and use the body to prove it.",
    severity: 2,
  },
  {
    id: "advertorial_camouflage",
    label: "Advertorial camouflage",
    family: "attention",
    stages: ["hook"],
    mechanic:
      "Sales page dressed as editorial: byline, dateline, read-time, 'investigation' kicker, pull quotes, a comments section. No ad disclosure above the fold.",
    psychology:
      "Editorial framing suppresses persuasion knowledge. Readers who do not classify a message as advertising do not deploy the counter-arguing they otherwise would.",
    evidence:
      "Friestad & Wright (1994), Persuasion Knowledge Model. Wojdynski & Evans (2016) on native-ad disclosure: only ~8% of readers recognized sponsored content without prominent labeling.",
    exposure:
      "FTC Native Advertising Enforcement Policy Statement (2015) requires clear, prominent disclosure before the click. This is the single most enforced item in the file.",
    honestVersion:
      "Label it. A well-written 'Why we built this' page converts nearly as well and survives review.",
    severity: 5,
  },
  {
    id: "scroll_trap",
    label: "Scroll trap / infinite deferral",
    family: "attention",
    stages: ["hook"],
    mechanic:
      "Body copy is chunked into short one-line paragraphs, each ending on a forward reference. A false 'continue reading' expansion appears mid-article. The payoff is always one section away.",
    psychology:
      "Sunk-cost plus goal gradient: the further you have scrolled, the more expensive quitting feels and the closer the (unmarked) end appears. Short lines lower cognitive load so momentum never breaks.",
    evidence:
      "Arkes & Blumer (1985) on sunk cost. Kivetz, Urminsky & Zheng (2006) on the goal-gradient effect in consumer reward programs.",
    exposure: "Low regulatory risk; high annoyance and bounce-quality risk.",
    honestVersion:
      "Front-load the answer, then let depth serve the people who want it. Inverted pyramid beats deferral for qualified traffic.",
    severity: 2,
  },
  {
    id: "scroll_gated_cta",
    label: "Scroll-depth-gated sticky CTA",
    family: "attention",
    stages: ["hook"],
    mechanic:
      "The sticky bar is suppressed until scroll depth exceeds 35%, then locks visible for the rest of the session.",
    psychology:
      "Depth is a behavioral proxy for intent. Withholding the ask until the reader has self-selected raises click-through per impression and avoids poisoning the first impression with an ask.",
    evidence:
      "Standard engagement-triggered CTA practice; consistent with Krugman's low-involvement processing and with mere-exposure timing effects (Zajonc, 1968).",
    exposure: "None. This one is legitimate targeting.",
    honestVersion:
      "This is already the honest version — the deception is in the destination, not the trigger.",
    severity: 1,
  },
  {
    id: "decoy_links",
    label: "Decoy 'related coverage' links",
    family: "attention",
    stages: ["hook"],
    mechanic:
      "A sidebar of plausible article titles rendered at ~35% opacity, non-functional. Pure ambient set-dressing to imply an archive that does not exist.",
    psychology:
      "Perceived institutional depth. A site with a back catalogue reads as an outlet; an outlet reads as trustworthy. Nobody clicks them — they only need to be seen.",
    evidence:
      "Fogg et al. (2003, Stanford Web Credibility): visual/structural cues dominate credibility judgments over source verification for ~46% of users.",
    exposure:
      "Deceptive site architecture; contributes to an overall 'net impression' claim under FTC §5.",
    honestVersion:
      "Link to three real things you've published. Three real links beat twelve fake ones.",
    severity: 3,
  },

  /* ── SCARCITY ──────────────────────────────────────────── */
  {
    id: "persistent_countdown",
    label: "Persistent resetting countdown",
    family: "scarcity",
    stages: ["global"],
    mechanic:
      "A session-scoped deadline stored in sessionStorage. It follows the visitor across every stage and silently re-arms when it hits zero, so the offer never actually expires.",
    psychology:
      "Time scarcity converts deliberation into reflex. A visible clock narrows the decision window and suppresses comparison shopping.",
    evidence:
      "Cialdini (1984), scarcity principle. Brehm (1966), reactance: threatened freedom of access increases the desire for the option.",
    exposure:
      "A countdown that resets is an express false claim. The EU Omnibus/UCPD explicitly names false countdown timers; the FTC has pursued them as deceptive urgency. California ADPA-adjacent dark-pattern rules also reach it.",
    honestVersion:
      "Use a real deadline — a cohort start date, a genuine price change with a published date. It works, and it survives a screenshot.",
    severity: 5,
  },
  {
    id: "seat_decay",
    label: "Decaying 'seats remaining' widget",
    family: "scarcity",
    stages: ["global"],
    mechanic:
      "Seats start near 40 and tick down on a randomized interval with a floor of 6, so it always looks nearly-gone but never sells out. Decay is client-side; the number is not tied to any inventory.",
    psychology:
      "Quantity scarcity plus a fabricated goal gradient. A number that falls while you watch converts abstract scarcity into a live event you are losing in real time.",
    evidence:
      "Worchel, Lee & Adewole (1975), the 'cookie jar' scarcity study: identical cookies rated more desirable when supply was low or falling. Aggarwal et al. (2011) on limited-quantity vs limited-time framing.",
    exposure:
      "False inventory claims for a digital product with unlimited supply. Squarely deceptive under FTC §5 and UCPD Annex I.",
    honestVersion:
      "Cap the cohort for real and show the true remaining count. If nothing is scarce, sell on outcome instead.",
    severity: 5,
  },
  {
    id: "live_viewer_count",
    label: "Fabricated live viewer count",
    family: "social",
    stages: ["global"],
    mechanic:
      "A random walk between roughly 120 and 260, nudged upward whenever the visitor advances a stage so the room appears to fill as they commit.",
    psychology:
      "Descriptive social norms plus competition. Other people looking at the same finite thing implies both validation and rivalry.",
    evidence:
      "Cialdini, Reno & Kallgren (1990) on descriptive norms. Goldstein, Cialdini & Griskevicius (2008): descriptive-norm messaging outperformed all other appeals in field trials.",
    exposure: "Fabricated metric; deceptive representation.",
    honestVersion:
      "Show real concurrent readers if you have the traffic, or show nothing. Zero is not a conversion problem; lying is.",
    severity: 4,
  },
  {
    id: "social_proof_toasts",
    label: "Synthetic purchase toasts",
    family: "social",
    stages: ["global"],
    mechanic:
      "Rotating notifications built from a fixed name/city list on a randomized 9–20 second cadence ('Marcus just unlocked access · Detroit, MI'). No purchases exist.",
    psychology:
      "Recency-weighted social proof. Each toast is a micro-injection of 'people like me are deciding yes, right now', and the irregular interval keeps it attention-grabbing.",
    evidence:
      "Cialdini (1984), social proof. Variable-interval reinforcement schedules (Ferster & Skinner, 1957) sustain attention better than fixed intervals.",
    exposure:
      "Fake testimonials/endorsements. The FTC's Rule on Consumer Reviews and Testimonials (2024) makes fabricated consumer endorsements subject to civil penalties per violation.",
    honestVersion:
      "Wire the toast to your real order stream, with consent, and let it be quiet on slow days.",
    severity: 5,
  },

  /* ── COMMITMENT ────────────────────────────────────────── */
  {
    id: "qualification_ritual",
    label: "Qualification ritual (inverted gatekeeping)",
    family: "commitment",
    stages: ["qualify"],
    mechanic:
      "A four-question 'compliance assessment' the buyer must pass before being allowed to pay. Every branch approves. There is no fail state anywhere in the code.",
    psychology:
      "Inverting the power relationship. When the seller appears to be screening the buyer, price resistance is reframed as unworthiness, and acceptance becomes a prize rather than a transaction.",
    evidence:
      "Aronson & Mills (1959): severity of initiation increases liking for the group. Cialdini's commitment/consistency principle; effort justification (Festinger, 1957).",
    exposure:
      "Deceptive if the screening is represented as real and it is not. Also an accessibility trap: real friction excludes real customers.",
    honestVersion:
      "A genuine fit quiz that actually disqualifies people. It costs you volume and buys you refund rate and referrals.",
    severity: 4,
  },
  {
    id: "weighted_scoring_theater",
    label: "Weighted scoring theater",
    family: "commitment",
    stages: ["qualify"],
    mechanic:
      "The arithmetic is real — answers carry weights, the total is computed and displayed. The gate is fake: the threshold is unreachable from below and 'answers are weighted, lying wastes your time' is intimidation copy with no enforcement behind it.",
    psychology:
      "Precision is a credibility heuristic. A displayed score of 78/100 feels measured; a warning about lying triggers honest self-disclosure, which produces a truthful psychographic profile for the seller.",
    evidence:
      "Numeric-precision credibility effects (Janiszewski & Uy, 2008). Self-disclosure escalation: Moon (2000) on reciprocal disclosure to machines.",
    exposure:
      "Low direct legal risk; high consent risk — profiling data collected under a false pretense is a GDPR Art. 5(1)(a) fairness/transparency problem.",
    honestVersion:
      "Score honestly and show your rubric. If a score cannot fail, don't show a score.",
    severity: 3,
  },
  {
    id: "progress_fiction",
    label: "Progress-bar fiction",
    family: "commitment",
    stages: ["qualify"],
    mechanic:
      "The bar is deliberately not a measure of progress. During the quiz it reads step/(total+1) so it can never hit 100% mid-quiz; the lead-capture step hard-sets 85%; the result screen sets 100%. A phantom step exists solely to keep the bar under 100.",
    psychology:
      "The goal-gradient effect: effort accelerates as the perceived end nears. A bar pinned at 85% while asking for an email converts the email into 'the last 15%' rather than a cost. This is a completion hypnotic, not a status indicator.",
    evidence:
      "Kivetz, Urminsky & Zheng (2006). Nunes & Drèze (2006), 'endowed progress': artificially granting progress toward a goal raised completion from 19% to 34%.",
    exposure:
      "Misleading interface element; catalogued as a deceptive pattern in Mathur et al. (2019), 'Dark Patterns at Scale'.",
    honestVersion:
      "Show step 3 of 4. Discrete, countable, true — and it captures most of the goal-gradient lift anyway.",
    severity: 3,
  },
  {
    id: "self_prediction",
    label: "Self-prediction landmine",
    family: "commitment",
    stages: ["qualify"],
    mechanic:
      "The final quiz question asks the visitor to predict their own future behavior: 'If a door opened tonight, would you walk through it?' The answer is stored and quoted back verbatim on the checkout, the upsell, and the downsell decline link.",
    psychology:
      "Once a public-ish, effortful, voluntary prediction is made, declining later costs consistency. The seller does not have to argue — the buyer argues with themselves.",
    evidence:
      "Sherman (1980), the 'mere measurement' / self-erasing error of prediction: being asked to predict volunteering raised actual volunteering from 4% to 31%. Freedman & Fraser (1966), foot-in-the-door. Festinger (1957), cognitive dissonance.",
    exposure:
      "No specific statute; this is the most psychologically coercive item in the funnel and the hardest to detect from the outside.",
    honestVersion:
      "Ask about the present, not the future: 'what have you already tried?' It informs the pitch without arming a guilt trip.",
    severity: 5,
  },
  {
    id: "specialness_paranoia",
    label: "Specialness + paranoia framing",
    family: "commitment",
    stages: ["hook", "reveal", "qualify"],
    mechanic:
      "Repeated 'you were not meant to find this' / 'this link was not supposed to be indexed' copy, plus a fake referral-source line naming how they supposedly arrived.",
    psychology:
      "Two levers at once: chosen-status flattery (identity), and an in-group/out-group secret (paranoia). Secrets create obligation and discourage the outside verification that would break the spell.",
    evidence:
      "Brock (1968) on commodity theory — information is valued more when restricted. Tajfel & Turner (1979), social identity theory.",
    exposure:
      "Deceptive if it implies a real restriction that does not exist; strongly correlated with fraud-adjacent complaint language.",
    honestVersion:
      "Real exclusivity: an actual invite list, an actual closed cohort, an actual unlisted URL.",
    severity: 4,
  },
  {
    id: "fake_analysis_terminal",
    label: "Fake analysis terminal",
    family: "commitment",
    stages: ["qualify"],
    mechanic:
      "A scripted console prints twelve lines of pseudo-processing ('cross-referencing 18,412 airplay records… matching your market…') on timers. No computation occurs; the output is identical for every visitor except for interpolated quiz answers.",
    psychology:
      "Labor illusion: users value outcomes more, and trust them more, when they can see work being performed — even fabricated work. The wait also builds anticipation and makes the result feel bespoke.",
    evidence:
      "Buell & Norton (2011), 'The Labor Illusion': travel sites showing search progress were preferred even when results were delivered slower.",
    exposure:
      "Deceptive if it represents personalized analysis that isn't happening — an emerging AI-washing enforcement theme at the FTC ('Operation AI Comply', 2024).",
    honestVersion:
      "Do the computation and show the real inputs, or skip the theater and give the answer instantly.",
    severity: 4,
  },
  {
    id: "lead_gate_before_price",
    label: "Lead gate before price",
    family: "friction",
    stages: ["qualify"],
    mechanic:
      "Every CTA on the article and the offer page routes to /qualify, never to payment. Email and first name are required to see the result and the price.",
    psychology:
      "Two returns: the quiz creates consistency pressure before money is discussed, and the seller owns a retargetable lead even on cart abandonment — the abandoning visitor becomes the email list.",
    evidence:
      "Foot-in-the-door (Freedman & Fraser, 1966): small prior compliance raises large-request compliance. Standard two-step lead-gen economics.",
    exposure:
      "Legitimate if disclosed. Becomes a problem when the data is used beyond the stated purpose, or when consent is bundled (GDPR Art. 7(4)).",
    honestVersion:
      "Gate the personalized output, not the price. Publish the price and let the email be optional.",
    severity: 2,
  },

  /* ── CHECKOUT ──────────────────────────────────────────── */
  {
    id: "prechecked_bump",
    label: "Pre-checked order bump",
    family: "checkout",
    stages: ["checkout"],
    mechanic:
      "A secondary product is added to the cart by default, checkbox already ticked, framed as a warning ('most people who skip this come back within 30 days'). Unchecking requires a deliberate act.",
    psychology:
      "Default bias plus loss aversion. Opting out feels like discarding something already owned (endowment) and like accepting a stated risk.",
    evidence:
      "Johnson & Goldstein (2003), 'Do Defaults Save Lives?': opt-out organ-donation defaults produced 80–99% consent vs 4–28% for opt-in. Kahneman & Tversky (1979) on loss aversion.",
    exposure:
      "Negative-option marketing. ROSCA and the FTC's Negative Option Rule require express informed consent; pre-checked boxes are explicitly invalid consent under GDPR (Planet49, CJEU C-673/17) and are named in the EU Omnibus Directive.",
    honestVersion:
      "Unchecked, priced clearly, with a one-line reason to add it. Attach rate drops; chargebacks and refunds drop further.",
    severity: 5,
  },
  {
    id: "price_anchoring",
    label: "Phantom anchor pricing",
    family: "checkout",
    stages: ["reveal", "checkout", "oto", "downsell"],
    mechanic:
      "A struck-through 'value' number that was never charged, plus an itemized value stack summing to a total far above the price.",
    psychology:
      "The first number seen sets the reference point for every number after it. Itemization makes the inflated anchor feel audited rather than asserted.",
    evidence:
      "Tversky & Kahneman (1974), anchoring and adjustment. Urbany, Bearden & Weilbaker (1988) on the effect of implausible reference prices on perceived value.",
    exposure:
      "Reference-price claims must be bona fide former or prevailing prices — 16 CFR 233 (FTC Guides Against Deceptive Pricing).",
    honestVersion:
      "Anchor against the real alternative the buyer would otherwise pay for. That comparison is usually strong enough.",
    severity: 3,
  },
  {
    id: "exit_intent_shame",
    label: "Exit-intent modal with shame CTA",
    family: "friction",
    stages: ["global"],
    mechanic:
      "Pointer leaving the viewport toward the browser chrome (or a mobile back gesture) fires a full-screen interstitial whose decline button is written in the first person: 'No thanks, I'll keep doing what hasn't worked.'",
    psychology:
      "Confirmshaming. Forcing the user to voice a self-critical sentence to escape creates a small identity cost, and identity costs are paid in clicks.",
    evidence:
      "Brignull's deceptive-design taxonomy (confirmshaming). Gray et al. (2018), 'The Dark (Patterns) Side of UX Design' — CHI: emotional-manipulation strand.",
    exposure:
      "Named as a deceptive pattern in the EDPB 2023 guidelines and in the FTC's 'Bringing Dark Patterns to Light' (2022) staff report.",
    honestVersion:
      "Neutral labels: 'Not now' / 'Continue'. If the offer needs shame to land, the offer is the problem.",
    severity: 4,
  },
  {
    id: "sticky_mobile_cta",
    label: "Sticky mobile CTA bar",
    family: "checkout",
    stages: ["global"],
    mechanic:
      "A thumb-zone bar pinned above the safe-area inset carrying the price, the countdown, and the primary action. Never dismissible.",
    psychology:
      "Removes the search cost of finding the button. Persistent salience means the impulse and the affordance are never more than a thumb apart.",
    evidence:
      "Fitts's Law (1954) applied to thumb-reach zones; standard mobile-commerce practice.",
    exposure: "None, provided it does not obscure required disclosures.",
    honestVersion:
      "This is the honest version. Keep it, make it dismissible, and don't put a fake timer in it.",
    severity: 1,
  },
  {
    id: "support_chat_theater",
    label: "Support-chat theater",
    family: "social",
    stages: ["global"],
    mechanic:
      "A widget with an unread badge, a typing indicator, and a photographed 'agent'. Replies are keyword-matched canned strings on a delay; every path ends by pushing back into the funnel.",
    psychology:
      "Perceived human availability lowers risk perception at the exact moment doubt spikes. The typing indicator is the cheapest trust signal in existence.",
    evidence:
      "Nass & Moon (2000) on mindless anthropomorphism toward computers. Buell & Norton's labor illusion applies to the typing delay too.",
    exposure:
      "Impersonating a human agent triggers disclosure duties (e.g. California B.O.T. Act, BPC §17940 et seq.) and the EU AI Act's transparency obligations.",
    honestVersion:
      "Say it's a bot, answer the three real questions people ask, and offer a real inbox.",
    severity: 3,
  },

  /* ── POST-PURCHASE ─────────────────────────────────────── */
  {
    id: "one_time_offer",
    label: "One-time-only upsell (guilt framing)",
    family: "post_purchase",
    stages: ["oto"],
    mechanic:
      "Immediately post-purchase, before delivery, a single-page offer that claims it will never be shown again, with the card 'already on file' and the buyer's own quiz answer quoted back at them.",
    psychology:
      "The moment after a purchase is the peak of consistency pressure and the trough of scrutiny. Withholding delivery until the decision is made converts the offer into a toll.",
    evidence:
      "Post-decision dissonance reduction (Brehm, 1956): people re-rate a chosen option more favorably right after choosing. Sequential-request compliance (Cialdini).",
    exposure:
      "'Never shown again' is a false statement if it is shown again. One-click charging without re-authorization implicates ROSCA's express-consent requirements.",
    honestVersion:
      "Deliver first, offer second, and let the offer stay available. Same revenue over 30 days, far fewer disputes.",
    severity: 4,
  },
  {
    id: "confirmshaming_decline",
    label: "Micro-guilt decline links",
    family: "post_purchase",
    stages: ["oto", "downsell", "checkout"],
    mechanic:
      "The decline is a 10px, low-contrast, underlined sentence in the first person, positioned below the fold of the card and phrased as self-sabotage.",
    psychology:
      "Visual hierarchy encodes the recommended choice; first-person phrasing makes refusal an admission. Contrast asymmetry is doing more work than the copy is.",
    evidence:
      "Mathur et al. (2019) classify this as 'interface interference'. WCAG 1.4.3 contrast minimums are being deliberately violated as a persuasion device.",
    exposure:
      "Accessibility non-compliance (WCAG/ADA exposure) on top of the deceptive-pattern classification.",
    honestVersion:
      "Equal weight, equal contrast, plain language: 'No thanks'. Measure the delta — it is usually smaller than people fear.",
    severity: 4,
  },
  {
    id: "downsell_ladder",
    label: "Downsell ladder after decline",
    family: "post_purchase",
    stages: ["downsell"],
    mechanic:
      "Declining the OTO routes to a softer, cheaper version of the same thing, reframed as a concession the seller is making personally.",
    psychology:
      "Door-in-the-face: a rejected large request makes the following smaller one feel like a reciprocal concession, and reciprocity pressure does the rest.",
    evidence:
      "Cialdini et al. (1975), the door-in-the-face technique: compliance rose from 17% to 50% when a large request preceded the small one.",
    exposure:
      "Legitimate as a sequence; deceptive only in the fake 'personal exception' framing used here.",
    honestVersion:
      "Offer the tiers side by side, up front. Ladders exist to defeat comparison — a price table invites it.",
    severity: 3,
  },
  {
    id: "receipt_theater",
    label: "Receipt theater",
    family: "post_purchase",
    stages: ["thanks"],
    mechanic:
      "An official-looking receipt with an order id, a masked card, timestamps, and a 'delivery' block — for a product that does not exist.",
    psychology:
      "Documentation is a trust artifact. A formatted receipt closes the loop and suppresses immediate refund-seeking by making the transaction feel administratively complete.",
    evidence:
      "Transaction-closure and mental-accounting effects: Thaler (1985), 'Mental Accounting and Consumer Choice'.",
    exposure:
      "Charging for undelivered goods is fraud, full stop. In this build nothing is charged and nothing is real.",
    honestVersion:
      "A receipt for a real thing, with a real support path and a refund link that works.",
    severity: 5,
  },
];

export const PATTERNS_BY_ID: Record<string, Pattern> = Object.fromEntries(
  PATTERNS.map((p) => [p.id, p])
);

export function patternsForStage(stage: PatternStage): Pattern[] {
  return PATTERNS.filter((p) => p.stages.includes(stage));
}

/** Severity rollup used by the debrief on the thank-you page. */
export function severityTally(): { level: number; count: number }[] {
  const map = new Map<number, number>();
  for (const p of PATTERNS) map.set(p.severity, (map.get(p.severity) ?? 0) + 1);
  return [...map.entries()]
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => b.level - a.level);
}
