/* ─────────────────────────────────────────────────────────────
   DARK FUNNEL TEARDOWN — annotation layer
   ─────────────────────────────────────────────────────────────
   The research payload. Every manipulative element on the replica
   carries a data-pattern id; toggling the teardown (the "X-RAY"
   button, or the `x` key) paints these labels over the live page.

   Each entry answers four questions:
     what it is · why it works · what it costs the visitor ·
     where it sits legally

   Citations are to the primary literature and to published
   regulatory guidance. They are intentionally short — this file
   is a map into the reading, not a substitute for it.
───────────────────────────────────────────────────────────── */

export type PatternRisk = "gray" | "deceptive" | "unlawful-in-some-markets";

export type Pattern = {
  id: string;
  /** short label painted on the page */
  label: string;
  /** the academic / industry name */
  principle: string;
  stage: "hook" | "reveal" | "qualify" | "checkout" | "oto" | "downsell" | "thanks" | "ambient";
  mechanism: string;
  /** what it actually extracts from the visitor */
  cost: string;
  risk: PatternRisk;
  citation: string;
};

export const PATTERNS: readonly Pattern[] = [
  /* ── HOOK ─────────────────────────────────────────────── */
  {
    id: "curiosity-gap",
    label: "Curiosity gap headline",
    principle: "Information-gap theory · outrage premise + withheld outcome",
    stage: "hook",
    mechanism:
      "The premise supplies moral arousal (someone is angry, something is forbidden). The second clause names a specific outcome and then refuses to state it. Curiosity is an aversive state, not a pleasant one — the click is relief-seeking, not interest.",
    cost: "Attention is committed before any claim has been evaluated.",
    risk: "gray",
    citation: "Loewenstein (1994), 'The psychology of curiosity', Psych. Bulletin 116(1).",
  },
  {
    id: "specificity-illusion",
    label: "False precision",
    principle: "Numeric specificity → perceived verifiability",
    stage: "hook",
    mechanism:
      "'11,482' is more believable than 'over 11,000' because odd, unrounded figures imply a counting process. No counting process exists. Precision is a rhetorical texture here, not evidence.",
    cost: "Raises credibility of an unfalsifiable claim.",
    risk: "deceptive",
    citation: "Schindler & Yalch (2006) on precise vs round numerals in persuasion.",
  },
  {
    id: "scroll-trap",
    label: "Scroll trap",
    principle: "Zeigarnik effect · narrative debt",
    stage: "hook",
    mechanism:
      "Each paragraph opens a loop and closes the previous one late. The reader is never at a natural exit point. The 'rest of the piece' is then moved off-page — the debt is transferred to the funnel.",
    cost: "Sunk attention becomes the reason to continue.",
    risk: "gray",
    citation: "Zeigarnik (1927); modern treatment in Baumeister & Masicampo (2011).",
  },
  {
    id: "scroll-gated-cta",
    label: "Scroll-gated sticky CTA (>35%)",
    principle: "Warm-lead targeting via engagement threshold",
    stage: "hook",
    mechanism:
      "The bar is suppressed until scroll depth exceeds 35%. Below that the visitor is a skimmer and the bar reads as an ad; above it, the visitor has invested and the bar reads as a service. Same element, different classification, decided by a single float.",
    cost: "Persuasion pressure is applied precisely when resistance is lowest.",
    risk: "gray",
    citation: "Consistency & escalation of commitment — Cialdini (2007), ch. 3.",
  },
  {
    id: "decoy-links",
    label: "Decoy related-links",
    principle: "Depth illusion / institutional camouflage",
    stage: "hook",
    mechanism:
      "Non-functional headlines at low opacity imply a back catalogue, an editorial staff and a history. One page pretending to be a publication. Low opacity is deliberate: legible enough to register, faint enough not to invite a click that would expose them.",
    cost: "Borrowed institutional trust the site has not earned.",
    risk: "deceptive",
    citation: "FTC Endorsement Guides, 16 CFR 255 — on formats implying editorial independence.",
  },
  {
    id: "native-ad-costume",
    label: "Editorial costume",
    principle: "Format transfer / advertorial",
    stage: "hook",
    mechanism:
      "Serif body type, a byline, a dateline, a 'MOST READ' rail. The visitor applies news-reading heuristics (skepticism low, trust in sequencing high) to a sales page.",
    cost: "The wrong evaluative frame is loaded before the pitch.",
    risk: "unlawful-in-some-markets",
    citation: "FTC 'Native Advertising: A Guide for Businesses' (2015); UK CAP Code 2.3–2.4.",
  },

  /* ── REVEAL ───────────────────────────────────────────── */
  {
    id: "forbidden-knowledge",
    label: "“You were not meant to find this”",
    principle: "Specialness + paranoia · reactance harnessing",
    stage: "reveal",
    mechanism:
      "Two payloads in one line. Specialness flatters (you are among the few); paranoia supplies urgency without a deadline (it could be removed). Crucially it converts suppression into evidence of value — the absence of proof becomes proof.",
    cost: "Claims become unfalsifiable: any counter-evidence reads as part of the suppression.",
    risk: "deceptive",
    citation: "Brehm's reactance theory (1966); scarcity-of-information effects, Cialdini ch. 7.",
  },
  {
    id: "agitation",
    label: "Problem agitation",
    principle: "PAS — problem / agitate / solution",
    stage: "reveal",
    mechanism:
      "Describe the reader's failure back to them in their own private wording, then attribute it to an external, fixable cause. Relief becomes attributable to the seller before the product has been named.",
    cost: "Emotional state is deliberately worsened as a precondition to the offer.",
    risk: "gray",
    citation: "Classic direct-response structure; see Sugarman, 'Adweek Copywriting Handbook'.",
  },
  {
    id: "borrowed-authority",
    label: "Unnamed-expert authority",
    principle: "Authority transfer via unverifiable source",
    stage: "reveal",
    mechanism:
      "'A clinical psychologist, who asked not to be named' carries the weight of credentials with none of the accountability. The anonymity is framed as evidence of risk, which is itself a second persuasive claim.",
    cost: "Trust is extended to a source that cannot be checked.",
    risk: "deceptive",
    citation: "Milgram (1963) on authority compliance; FTC substantiation doctrine.",
  },
  {
    id: "testimonial-theatre",
    label: "Manufactured testimonials",
    principle: "Social proof · similarity matching",
    stage: "reveal",
    mechanism:
      "Named, geo-tagged, hedged ('wouldn't do it again, wouldn't undo it'). The hedge is the craft: qualified praise reads as authentic where unqualified praise reads as an ad.",
    cost: "Peer evidence for a product with no users.",
    risk: "unlawful-in-some-markets",
    citation: "16 CFR 255.2 — consumer endorsements must reflect honest experience.",
  },

  /* ── QUALIFY ──────────────────────────────────────────── */
  {
    id: "qualification-ritual",
    label: "Compliance quiz",
    principle: "Commitment & consistency · effort justification",
    stage: "qualify",
    mechanism:
      "Six self-descriptive answers about your own failure. By the final screen the visitor has authored the case for the product. The seller never had to make the argument — the buyer made it, in the first person.",
    cost: "Self-generated arguments resist counter-argument far better than received ones.",
    risk: "gray",
    citation: "Festinger (1957); Aronson & Mills (1959) on severity of initiation.",
  },
  {
    id: "weighted-intimidation",
    label: "“Answers are weighted”",
    principle: "Surveillance framing with no enforcement",
    stage: "qualify",
    mechanism:
      "There is no consistency check in the codebase. The sentence exists to raise earnestness, which raises how personally the (predetermined) verdict lands. Threat of detection substitutes for detection.",
    cost: "Truthful self-disclosure given to a system that never evaluates it.",
    risk: "deceptive",
    citation: "Observation/accountability effects — Haley & Fessler (2005).",
  },
  {
    id: "progress-fiction",
    label: "Progress-bar fiction",
    principle: "Goal gradient · endowed progress",
    stage: "qualify",
    mechanism:
      "step/(total+1) guarantees the bar can never read 100% while questions remain; the lead step then hard-sets 85% and the result 100%. The bar is decoupled from progress in both directions — it is a completion hypnotic.",
    cost: "Effort is extracted by a display that is not reporting anything.",
    risk: "deceptive",
    citation: "Kivetz, Urminsky & Zheng (2006), 'The goal-gradient hypothesis resurrected', JMR 43(1).",
  },
  {
    id: "no-fail-branch",
    label: "Approval with no fail branch",
    principle: "Manufactured selectivity",
    stage: "qualify",
    mechanism:
      "Every answer vector clears. The gate exists to make acceptance feel earned and rejection feel possible. Scarcity of *eligibility* is cheaper to fake than scarcity of stock and harder to disprove.",
    cost: "A purchase decision is reframed as an achievement.",
    risk: "deceptive",
    citation: "Cialdini ch. 7 (scarcity); FTC guidance on false 'qualification' claims.",
  },
  {
    id: "labour-illusion",
    label: "Fake analysis terminal",
    principle: "Labour illusion · operational transparency",
    stage: "qualify",
    mechanism:
      "The verdict is computed before the first line prints. The 4-second scroll of monospace exists so the output feels produced rather than asserted. Visible work raises perceived value even when the work is decorative.",
    cost: "Perceived rigour with zero rigour behind it.",
    risk: "deceptive",
    citation: "Buell & Norton (2011), 'The labor illusion', Management Science 57(9).",
  },
  {
    id: "lead-capture",
    label: "Lead capture as ceremony",
    principle: "Micro-commitment escalation",
    stage: "qualify",
    mechanism:
      "The field is not called 'sign up' — it is 'confirm my file'. The visitor is completing a process they are already inside rather than starting a relationship they could decline.",
    cost: "Contact data given under a framing that hides the transaction.",
    risk: "gray",
    citation: "Freedman & Fraser (1966), foot-in-the-door.",
  },

  /* ── CHECKOUT ─────────────────────────────────────────── */
  {
    id: "pre-checked-bump",
    label: "Pre-checked order bump",
    principle: "Default effect · status-quo bias",
    stage: "checkout",
    mechanism:
      "Opt-out defaults convert at multiples of opt-in for identical offers. The visitor must act to *not* buy, and inaction is read by the system as consent.",
    cost: "Money moved by inattention rather than decision.",
    risk: "unlawful-in-some-markets",
    citation: "Johnson & Goldstein (2003), Science 302; EU Consumer Rights Directive Art. 22 bans pre-ticked boxes for extra payments.",
  },
  {
    id: "price-anchor",
    label: "Anchor pricing",
    principle: "Anchoring & adjustment",
    stage: "checkout",
    mechanism:
      "$349 struck through beside $27. The anchor is never a price anything sold at — it exists only to make the second number relational instead of absolute.",
    cost: "Value judgement is made against a fabricated reference.",
    risk: "unlawful-in-some-markets",
    citation: "Tversky & Kahneman (1974); EU Omnibus Directive on prior-price claims.",
  },
  {
    id: "trust-badges",
    label: "Trust badge theatre",
    principle: "Peripheral cue processing",
    stage: "checkout",
    mechanism:
      "Lock glyphs and security phrasing near the pay button. Under low elaboration, the cue is processed instead of the claim — badges raise conversion even when they certify nothing.",
    cost: "Security confidence untethered from security.",
    risk: "deceptive",
    citation: "Petty & Cacioppo ELM (1986).",
  },

  /* ── OTO / DOWNSELL ───────────────────────────────────── */
  {
    id: "post-purchase-oto",
    label: "One-time offer",
    principle: "Foot-in-the-door · state of compliance",
    stage: "oto",
    mechanism:
      "Presented after the card is 'charged', when identity has shifted from prospect to buyer. Consistency pressure is at its maximum and price sensitivity at its minimum.",
    cost: "The largest ask arrives at the moment of least resistance.",
    risk: "gray",
    citation: "Freedman & Fraser (1966); Cialdini ch. 3.",
  },
  {
    id: "guilt-decline",
    label: "Confirmshaming decline link",
    principle: "Confirmshaming (Brignull's dark-pattern taxonomy)",
    stage: "oto",
    mechanism:
      "The accept button is large and affirmative; the decline is small, lowercase, and written in the visitor's voice as a confession of failure. Choosing 'no' requires agreeing with an insult about yourself.",
    cost: "Emotional toll levied for exercising a legitimate option.",
    risk: "deceptive",
    citation: "Brignull, deceptive.design; OECD 'Dark Commercial Patterns' (2022).",
  },
  {
    id: "downsell-ladder",
    label: "Downsell / price-split",
    principle: "Rejection-then-retreat (door-in-the-face) + partitioned pricing",
    stage: "downsell",
    mechanism:
      "The retreat from $197 to '3 × $67' creates a reciprocity obligation and shrinks the salient number, even though the ladder totals more than the original ask.",
    cost: "A concession that isn't one, priced above the offer it replaced.",
    risk: "deceptive",
    citation: "Cialdini et al. (1975) door-in-the-face; Morwitz et al. (1998) on partitioned pricing.",
  },

  /* ── AMBIENT ──────────────────────────────────────────── */
  {
    id: "rolling-countdown",
    label: "Rolling countdown",
    principle: "False urgency",
    stage: "ambient",
    mechanism:
      "The deadline is anchored to your arrival and rolls forward on expiry. Scarcity that regenerates per visitor is not scarcity — it is a metronome for decision speed.",
    cost: "Deliberation time removed under a false premise.",
    risk: "unlawful-in-some-markets",
    citation: "FTC Act §5 deception; UK DMCC Act 2024 Sch. 20 (false urgency).",
  },
  {
    id: "seat-decay",
    label: "Decaying seat counter",
    principle: "Manufactured inventory scarcity",
    stage: "ambient",
    mechanism:
      "Seats tick down on a timer with a floor, so the offer is perpetually 'nearly gone' but never gone. A real inventory reaches zero; a prop asymptotes.",
    cost: "Purchase timing forced by fictional depletion.",
    risk: "unlawful-in-some-markets",
    citation: "EU UCPD Annex I ¶7 (false limited availability).",
  },
  {
    id: "live-viewers",
    label: "Live viewer count",
    principle: "Bandwagon / competitive scarcity",
    stage: "ambient",
    mechanism:
      "A bounded random walk. It never drops low enough to imply an empty room, never spikes high enough to be checked. The number's job is to imply competitors for the same seat.",
    cost: "Competitive anxiety over an uncontested purchase.",
    risk: "deceptive",
    citation: "OECD 'Dark Commercial Patterns' (2022), §3.2 activity notifications.",
  },
  {
    id: "social-toasts",
    label: "Social-proof toasts",
    principle: "Descriptive-norm injection",
    stage: "ambient",
    mechanism:
      "'Marcus just unlocked access' — generated from two word lists and a seeded PRNG. Cadence is tuned to feel incidental: dense at first, then widening so it never reads as a loop.",
    cost: "Norm evidence for behaviour nobody performed.",
    risk: "unlawful-in-some-markets",
    citation: "Goldstein, Cialdini & Griskevicius (2008); FTC action re: fake activity notices.",
  },
  {
    id: "exit-intent",
    label: "Exit-intent shame modal",
    principle: "Loss aversion at the abandonment boundary",
    stage: "ambient",
    mechanism:
      "Cursor velocity toward the tab bar triggers a modal reframing departure as forfeiting something already owned. Endowment plus confirmshaming, fired at the precise moment of disengagement.",
    cost: "Exit is taxed.",
    risk: "gray",
    citation: "Kahneman & Tversky (1979) prospect theory; Brignull on confirmshaming.",
  },
  {
    id: "support-chat",
    label: "Simulated support chat",
    principle: "Parasocial reassurance / liking",
    stage: "ambient",
    mechanism:
      "A named agent with a face and a typing indicator. Keyword-matched canned replies always terminate at the CTA. Perceived human presence lowers scrutiny and raises obligation to respond.",
    cost: "A relationship cue where no person exists.",
    risk: "deceptive",
    citation: "Reeves & Nass, 'The Media Equation' (1996).",
  },
  {
    id: "sticky-mobile-cta",
    label: "Sticky mobile CTA",
    principle: "Persistent salience · thumb-zone placement",
    stage: "ambient",
    mechanism:
      "Fixed to the bottom safe area where the thumb already rests. Combined with the countdown it converts a passive reading session into a timed decision that is always one accidental tap away.",
    cost: "Accidental conversion; no rest state on the page.",
    risk: "gray",
    citation: "Fitts's law applied to mobile CTA placement; NN/g mobile UX guidance.",
  },
] as const;

export const PATTERNS_BY_ID: Record<string, Pattern> = Object.fromEntries(
  PATTERNS.map((p) => [p.id, p]),
);

export const RISK_LABEL: Record<PatternRisk, string> = {
  gray: "Gray area",
  deceptive: "Deceptive",
  "unlawful-in-some-markets": "Unlawful in some markets",
};

export const RISK_COLOR: Record<PatternRisk, string> = {
  gray: "#facc15",
  deceptive: "#fb923c",
  "unlawful-in-some-markets": "#f43f5e",
};

export function patternsForStage(stage: Pattern["stage"]): Pattern[] {
  return PATTERNS.filter((p) => p.stage === stage);
}
