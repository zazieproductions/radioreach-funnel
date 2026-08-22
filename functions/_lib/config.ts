export const ALLOWED_PRODUCTS = {
  vault_core: {
    envPriceVar: "STRIPE_PRICE_VAULT_CORE",
    bundleKey: "vault/radio-reach-vault.zip",
    name: "Radio Reach Vault",
  },
  contract_bundle: {
    envPriceVar: "STRIPE_PRICE_CONTRACT_BUNDLE",
    bundleKey: "products/contract-bundle/indie-music-contract-kit.zip",
    name: "The Indie Music Contract Kit",
  },
  australia_addon: {
    envPriceVar: "STRIPE_PRICE_AUSTRALIA_ADDON",
    bundleKey: "addons/australian-radio-contact-list.zip",
    name: "Australian Radio Stations Contact List",
  },
  airplay_accelerator: {
    envPriceVar: "STRIPE_PRICE_AIRPLAY_ACCELERATOR",
    bundleKey: "upsells/airplay-accelerator.zip",
    name: "Airplay Accelerator",
  },
  upwork_course: {
    envPriceVar: "STRIPE_PRICE_UPWORK_COURSE",
    bundleKey: "upsells/advanced-upwork-proposals-course.zip",
    name: "Advanced Upwork Proposals — Full Course",
  },
  contract_guide: {
    envPriceVar: "STRIPE_PRICE_CONTRACT_GUIDE",
    bundleKey: "products/contract-guide/radioreach-indie-artist-contract-info-guide.pdf",
    name: "RadioReach Indie Artist Contract Info Guide (PDF)",
  },

} as const;

export type AllowedProductKey = keyof typeof ALLOWED_PRODUCTS;

export function resolveAllowedPrices(env: Env) {
  const entries = Object.entries(ALLOWED_PRODUCTS).map(([key, value]) => {
    const priceId = env[value.envPriceVar as keyof Env] as unknown as string | undefined;
    return [key, { ...value, priceId }];
  });
  return Object.fromEntries(entries) as Record<AllowedProductKey, (typeof ALLOWED_PRODUCTS)[AllowedProductKey] & { priceId?: string }>;
}
