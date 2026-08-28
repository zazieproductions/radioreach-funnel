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
  compareAt?: number;
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
    compareAt: 350,
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
    compareAt: 25,
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
    compareAt: 29,
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
    compareAt: 822,
    stripePriceIdEnv: "STRIPE_PRICE_AIRPLAY_ACCELERATOR",
    r2BundleKey: "upsells/airplay-accelerator.zip",
    description: "Curator contacts, campaign calendar, swipe file, follow-up sequence, and pitch review.",
    checkoutBadge: "Campaign kit",
    checkoutHeadline: "You have the list. Now who writes the pitch?",
    checkoutValueLine:
      "4,812 curator contacts, the 6-week campaign calendar, 11 subject lines with real open rates, and the 3-touch follow-up sequence that doubled replies.",
  },
  upwork_course: {
    key: "upwork_course",
    name: "Advanced Upwork Proposals: Full Course",
    shortName: "Upwork Course",
    price: 50,
    compareAt: 2000,
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
