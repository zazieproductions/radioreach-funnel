// Single source of truth for every number the funnel shows.
// RULE: if a number appears on screen it must match what Stripe charges.
// Invented "was" prices and phantom discounts are banned — the ladder's
// economics are composition and real market context, not strikethrough.
export const PRICE = {
  core: 25,
  coreLabel: "$25",

  bump: 9,
  bumpLabel: "$9",

  protect: 3.95,
  protectLabel: "$3.95",

  oto: 37,
  otoLabel: "$37",

  downsellTotal: 18,
  downsellPerLabel: "$6",
  downsellTotalLabel: "$18",
};
