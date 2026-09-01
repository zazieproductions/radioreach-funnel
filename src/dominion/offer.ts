/**
 * THE DOMINION LADDER — the new economic engine of radioreach.us
 *
 * Old world: one $25 file. No recurrence. No ascension. No status.
 * New world: a $47 credential → a $67/mo intelligence subscription →
 * a $997 done-with-you campaign. Same traffic. 20–40× the LTV.
 *
 * Every number here is deliberate. Do not "round them nicer."
 */

export type LadderTier = {
  id: string;
  rank: string;
  name: string;
  promise: string;
  price: string;
  cadence: string;
  anchor?: string;
  bullets: string[];
  cta: string;
  tone: "entry" | "core" | "elite";
  scarcity?: string;
};

export const DOMINION = {
  brand: "RADIOREACH",
  system: "The Airplay Dominion System",
  /** The mechanism name. A named mechanism converts ~30% better than a feature list. */
  mechanism: "The Rotation Loop",
  /** Front-end price. $47 > $25 because $25 signals "junk PDF" to the exact buyer we want. */
  entry: 47,
  entryLabel: "$47",
  entryAnchor: "$350",
  /** The engine. Monthly recurring intelligence. This is the $100k. */
  sub: 67,
  subLabel: "$67",
  subAnnual: 597,
  subAnnualLabel: "$597",
  /** High ticket, application-gated, capacity-capped. */
  elite: 997,
  eliteLabel: "$997",
  eliteSlots: 12,
} as const;

export const LADDER: LadderTier[] = [
  {
    id: "vault",
    rank: "TIER I",
    name: "The Vault",
    promise: "You stop being invisible to radio.",
    price: DOMINION.entryLabel,
    cadence: "one time · yours forever",
    anchor: DOMINION.entryAnchor,
    tone: "entry",
    bullets: [
      "18,412 station contacts — program directors, music directors, and show hosts with names attached",
      "10,372 human-verified deliverable emails (not scraped, not guessed, not bounced)",
      "Sorted by genre, market size, format, and submission window",
      "The 9 pitch scripts that got indie records added to rotation — copy, paste, personalize, send",
      "The Rejection Decoder: what every station's silence actually means, and the exact follow-up that reverses it",
    ],
    cta: "Claim the Vault — $47",
  },
  {
    id: "command",
    rank: "TIER II",
    name: "Rotation Command",
    promise: "Radio stops being a lottery and becomes a schedule.",
    price: DOMINION.subLabel,
    cadence: "per month · cancel in one click",
    tone: "core",
    scarcity: "Founding rate. Locked for life at $67 — it becomes $97 after the first 300 members.",
    bullets: [
      "The Monday Hit List: 25 stations actively adding new music THIS WEEK, hand-verified, with the exact contact and the exact angle",
      "Live contact repair — dead emails are replaced inside 72 hours, so your list never rots",
      "Curator + playlist drops: 40 new Spotify, blog, and podcast placements every month",
      "Pitch Autopsy: submit one pitch a month, get it torn apart and rebuilt by someone who has actually gotten records added",
      "The Airplay Ledger: track every send, every open, every add — see your rotation build in real time",
      "Members-only war room. The artists in there trade station intel daily.",
    ],
    cta: "Take Command — $67/mo",
  },
  {
    id: "dominion",
    rank: "TIER III",
    name: "Dominion",
    promise: "We run the campaign. You just answer the phone.",
    price: DOMINION.eliteLabel,
    cadence: "per campaign · by application only",
    tone: "elite",
    scarcity: `Only ${DOMINION.eliteSlots} campaigns run per month. When they're gone, they're gone.`,
    bullets: [
      "We build your 90-day airplay campaign map: which 120 stations, which order, which week",
      "Your pitch, written by us, in your voice, tested against the formats you're targeting",
      "Done-for-you outreach infrastructure: warmed sending domain, sequenced follow-ups, reply routing",
      "Weekly 1:1 war-room call for 12 weeks",
      "Every add, spin, and interview logged into a press-ready airplay report you can send to labels, sync agents, and grant panels",
      "If you don't get a single confirmed add in 90 days, we work free until you do.",
    ],
    cta: "Apply for Dominion",
  },
];

/** The three enemies. Direct response lives or dies on a named villain. */
export const ENEMIES = [
  {
    title: "The Submission Portal",
    body: "You paid $12 a song to upload into a queue nobody reads. That's not promotion. That's a vending machine for hope.",
  },
  {
    title: "The $3,000 Radio Plugger",
    body: "Charges you a retainer, sends the same email he sends for forty other artists, and blames your record when nothing lands.",
  },
  {
    title: "The Dead List",
    body: "Somebody sold you 5,000 'radio emails' scraped in 2019. Half bounce. The other half go to interns who left. Your domain gets flagged. Now you can't reach anyone.",
  },
];

/** Objection → reframe. Every one of these is a revenue leak sealed. */
export const OBJECTIONS: [string, string][] = [
  [
    "Why is this $47 when everyone else sells lists for $9?",
    "Because a $9 list is scraped and dead, and you're the product. Verification costs money — 10,372 addresses individually confirmed against a live human. If the price offends you, buy the $9 one. You'll be back, minus a sender reputation.",
  ],
  [
    "Do I actually need the monthly?",
    "Radio contacts decay at roughly 3% a month. Program directors move stations constantly. In a year, a third of any static list is fiction. Rotation Command exists because a list is a photograph and radio is a moving object.",
  ],
  [
    "Will this guarantee airplay?",
    "Nothing guarantees airplay, and anyone who says otherwise is stealing from you. What this guarantees is access, accuracy, and a repeatable process. The Vault gets you into the room. Your record closes it.",
  ],
  [
    "What if my genre is niche?",
    "Niche is the advantage. Commercial Top 40 is a walled garden. College, community, specialty, and online radio are starving for exactly the record majors won't sign. 11,000+ of these contacts live in that world.",
  ],
  [
    "What if it doesn't work for me?",
    "30 days. Contact five relevant stations, keep a record, and if you want out, email your receipt and what happened. Refunded. No airplay required — just an honest attempt. I'm not interested in money from someone who didn't use the thing.",
  ],
];

export const PROOF = [
  { stat: "18,412", label: "station contacts in the Vault" },
  { stat: "10,372", label: "human-verified deliverable emails" },
  { stat: "72 hrs", label: "max age of a dead contact before replacement" },
  { stat: "1,900+", label: "independent artists holding the Vault" },
];

/**
 * The math the entire rebuild is engineered against.
 * Kept in code so nobody "forgets" what the funnel is for.
 */
export const REVENUE_MODEL = {
  monthlyVaultBuyers: 220,
  vaultPrice: DOMINION.entry,
  subTakeRate: 0.22,
  subChurnMonthly: 0.09,
  eliteClosesPerMonth: 3,
  elitePrice: DOMINION.elite,
} as const;
