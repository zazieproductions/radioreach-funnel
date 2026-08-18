export type ProductKey =
  | "vault_core"
  | "contract_bundle"
  | "australia_addon"
  | "airplay_accelerator"
  | "upwork_course"
  | "dj_contacts";
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
    name: "Radio Reach Vault — 18,000+ radio contacts",
    shortName: "Radio Reach Vault",
    price: 20,
    compareAt: 49,
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
  },
  upwork_course: {
    key: "upwork_course",
    name: "Advanced Upwork Proposals — Full Course",
    shortName: "Upwork Course",
    price: 50,
    compareAt: 2000,
    stripePriceIdEnv: "STRIPE_PRICE_UPWORK_COURSE",
    r2BundleKey: "upsells/advanced-upwork-proposals-course.zip",
    description: "4-part, 30-lesson series for any niche to 10× client responses faster.",
  },
  dj_contacts: {
    key: "dj_contacts",
    name: "50 DJs Contact List",
    shortName: "50 DJs List",
    price: 5,
    compareAt: 8.99,
    stripePriceIdEnv: "STRIPE_PRICE_DJ_CONTACTS",
    r2BundleKey: "addons/50-djs-contact-list.zip",
    description: "50 DJ names, emails, and station affiliations you can pitch directly.",
    includes: [
      "50 DJ contacts",
      "Names, emails, and station affiliations",
      "Instant digital delivery",
    ],
    checkoutBadge: "Wheel win — $5",
  },
};

export const CHECKOUT_DEFAULTS = {
  core: "vault_core" as ProductKey,
  addons: ["contract_bundle", "australia_addon"] as ProductKey[],
  upsells: ["airplay_accelerator", "upwork_course"] as ProductKey[],
};

export const DOWNLOAD_TTL_SECONDS = 60 * 15;
