export type ProductKey =
  | "vault_core"
  | "contract_bundle"
  | "australia_addon"
  | "airplay_accelerator"
  | "upwork_course"
  | "contract_guide";
  // | "font_vault";

export type StorefrontProduct = {
  key: ProductKey;
  name: string;
  shortName: string;
  price: number;
  stripePriceIdEnv: string;
  r2BundleKey: string;
  description: string;
  includes?: string[];
  checkoutBadge?: string;
  /** Optional headline shown above the product name on the checkout card. */
  checkoutHeadline?: string;
  /** Optional restrained value line under the description on the checkout card. */
  checkoutValueLine?: string;
};

export const STORE_COPY = {
  brand: "Radio Reach Vault",
  domain: "radioreach.us",
  currency: "USD",
  checkoutTitle: "Secure checkout",
  checkoutSubtitle: "Payment is processed securely by Stripe.",
  successTitle: "Your files are ready",
  successSubtitle: "Payment verified. Your private download links are unlocked below.",
};

export const PRODUCTS: Record<ProductKey, StorefrontProduct> = {
  vault_core: {
    key: "vault_core",
    name: "Radio Reach Vault: 18,000+ radio contacts",
    shortName: "Radio Reach Vault",
    price: 25,
    stripePriceIdEnv: "STRIPE_PRICE_VAULT_CORE",
    r2BundleKey: "vault/radio-reach-vault.zip",
    description: "18,000+ radio station contacts organized by station, location, role, phone, and email.",
    includes: ["18,000+ contacts", "Organized by station, location, role, phone, and email", "Instant digital delivery"],
  },
  contract_bundle: {
    key: "contract_bundle",
    name: "The Indie Music Contract Kit",
    shortName: "Contract Kit",
    price: 9,
    stripePriceIdEnv: "STRIPE_PRICE_CONTRACT_BUNDLE",
    r2BundleKey: "products/contract-bundle/indie-music-contract-kit.zip",
    description: "An educational template kit and not legal advice. 6 agreement templates plus a plain-English usage guide.",
    includes: ["Composer Agreement", "Artist/Producer Agreement", "Mechanical License Agreement", "Musician/Vocalist Work-for-Hire Agreement", "Session Player Release", "Synchronization License Agreement", "Indie Music Contract Kit Usage Guide"],
    checkoutBadge: "Checkout add-on",
  },
  australia_addon: {
    key: "australia_addon",
    name: "Australian Radio Stations Contact List",
    shortName: "AU Radio List",
    price: 12,
    stripePriceIdEnv: "STRIPE_PRICE_AUSTRALIA_ADDON",
    r2BundleKey: "addons/australian-radio-contact-list.zip",
    description: "A curated list of major national and regional Australian radio contacts.",
    includes: ["triple j / Unearthed", "Community radio", "Commercial networks", "Regional stations"],
    checkoutBadge: "Checkout add-on",
  },
  airplay_accelerator: {
    key: "airplay_accelerator",
    name: "Airplay Accelerator",
    shortName: "Accelerator",
    price: 37,
    stripePriceIdEnv: "STRIPE_PRICE_AIRPLAY_ACCELERATOR",
    r2BundleKey: "upsells/airplay-accelerator.zip",
    description: "Curator contacts, campaign calendar, swipe file, follow-up sequence, and pitch review.",
  },
  upwork_course: {
    key: "upwork_course",
    name: "Advanced Upwork Proposals: Full Course",
    shortName: "Upwork Course",
    price: 50,
    stripePriceIdEnv: "STRIPE_PRICE_UPWORK_COURSE",
    r2BundleKey: "upsells/advanced-upwork-proposals-course.zip",
    description: "4-part, 30-lesson series for any niche to 10× client responses faster.",
  },
  contract_guide: {
    key: "contract_guide",
    name: "RadioReach Indie Artist Contract Info Guide (PDF)",
    shortName: "Contract Info Guide",
    price: 10,
    stripePriceIdEnv: "STRIPE_PRICE_CONTRACT_GUIDE",
    r2BundleKey: "products/contract-guide/radioreach-indie-artist-contract-info-guide.pdf",
    description: "Understand contracts, catch red flags, protect your rights, and negotiate with confidence.",
    checkoutBadge: "Instant PDF Access",
    checkoutHeadline: "Protect Your Music Before You Sign",
    checkoutValueLine:
      "Learn how to review label, producer, publishing, management, distribution, and collaboration agreements in plain English.",
  },
};

export const CHECKOUT_DEFAULTS = {
  core: "vault_core" as ProductKey,
  addons: ["contract_bundle", "australia_addon", "contract_guide"] as ProductKey[],
  upsells: ["airplay_accelerator", "upwork_course"] as ProductKey[],
};

export const DOWNLOAD_TTL_SECONDS = 60 * 15;

/* ───────────────────────────────────────────────────────────────────────────
   BUNDLE LADDER — the AOV engine.

   Rules of this structure (non-negotiable):
   1. A bundle's displayed total is ALWAYS the exact sum of its parts at the
      real prices Stripe charges. No invented "was" prices, no phantom
      discounts. The economic argument is composition, not strikethrough.
   2. The only external anchor used anywhere is a real market comparison
      (a promoter-run campaign costs four figures per track) and it is always
      framed as context, never as our former price.
   3. Every item in a bundle must be a configured Stripe product so checkout
      works with zero server changes.
─────────────────────────────────────────────────────────────────────────── */

export type BundleKey = "vault" | "pitch_kit" | "launch_stack";

export type StorefrontBundle = {
  key: BundleKey;
  name: string;
  tagline: string;
  items: ProductKey[];
  badge?: string;
  /** Short outcome-framed bullets shown on the ladder card. */
  bullets: string[];
  /** Ladder framing: who this is for. */
  forWhom: string;
};

export const BUNDLES: Record<BundleKey, StorefrontBundle> = {
  vault: {
    key: "vault",
    name: "The Vault",
    tagline: "The contacts. Nothing else.",
    items: ["vault_core"],
    bullets: [
      "18,000+ radio contacts, city-by-city",
      "Program/music directors and decision-makers",
      "400+ page organized directory",
    ],
    forWhom: "You already know how to pitch and just need the right doors to knock on.",
  },
  pitch_kit: {
    key: "pitch_kit",
    name: "Vault + Pitch Kit",
    tagline: "The contacts plus the paperwork.",
    items: ["vault_core", "contract_bundle", "contract_guide"],
    badge: "Most picked",
    bullets: [
      "Everything in The Vault",
      "6 contract templates + plain-English guide",
      "Contract red-flag guide (PDF) — protect your splits before you send",
    ],
    forWhom: "You want your first campaign out the door tonight with paperwork that doesn't burn you later.",
  },
  launch_stack: {
    key: "launch_stack",
    name: "The Launch Stack",
    tagline: "The complete campaign in one box.",
    items: ["vault_core", "contract_bundle", "contract_guide", "australia_addon", "airplay_accelerator"],
    badge: "Complete campaign",
    bullets: [
      "Everything in Vault + Pitch Kit",
      "Australian radio list — 2,847 more contacts",
      "Airplay Accelerator: curator contacts, campaign calendar, swipe file, follow-up sequence, pitch review",
    ],
    forWhom: "You're releasing in the next 90 days and want the full outreach machine, not just the phone book.",
  },
};

export const LADDER_ORDER: BundleKey[] = ["vault", "pitch_kit", "launch_stack"];

/** Exact sum of real part prices — this number always matches Stripe. */
export function bundleTotal(bundle: StorefrontBundle): number {
  return bundle.items.reduce((sum, key) => sum + PRODUCTS[key].price, 0);
}

/** Market context anchor — a real, verifiable external comparison. */
export const PROMOTER_ANCHOR = {
  low: 1000,
  high: 2500,
  line: "A single promoter-run radio campaign typically runs $1,000–$2,500 per track.",
};
