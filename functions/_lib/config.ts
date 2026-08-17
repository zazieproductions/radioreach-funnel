export const ALLOWED_PRODUCTS = {
  vault_core: {
    envPriceVar: "STRIPE_PRICE_VAULT_CORE",
    bundleKey: "vault/radio-reach-vault.pdf",
    name: "Radio Reach Vault",
    downloadFilename: "RadioReach Vault - 18,000+ Radio Station Contacts.pdf",
  },
  contract_bundle: {
    envPriceVar: "STRIPE_PRICE_CONTRACT_BUNDLE",
    bundleKey: "products/contract-bundle/indie-music-contract-kit.zip",
    name: "The Indie Music Contract Kit",
    downloadFilename: "The Indie Music Contract Kit.zip",
  },
  australia_addon: {
    envPriceVar: "STRIPE_PRICE_AUSTRALIA_ADDON",
    bundleKey: "addons/australian-radio-contact-list.zip",
    name: "Australian Radio Stations Contact List",
    downloadFilename: "Australian Radio Stations Contact List.zip",
  },
  airplay_accelerator: {
    envPriceVar: "STRIPE_PRICE_AIRPLAY_ACCELERATOR",
    bundleKey: "upsells/airplay-accelerator.zip",
    name: "Airplay Accelerator",
    downloadFilename: "Airplay Accelerator.zip",
  },
  upwork_course: {
    envPriceVar: "STRIPE_PRICE_UPWORK_COURSE",
    bundleKey: "upsells/advanced-upwork-proposals-course.zip",
    name: "Advanced Upwork Proposals — Full Course",
    downloadFilename: "Advanced Upwork Proposals - Full Course.zip",
  },

} as const;

export type AllowedProductKey = keyof typeof ALLOWED_PRODUCTS;

/**
 * Object keys that used to back a product and may still be referenced by
 * orders already recorded in KV. Past customers revisiting their success page
 * must keep working after a bundle is re-keyed (e.g. the vault moving from a
 * ZIP wrapper to a direct PDF), so old keys are remapped at download time.
 */
export const LEGACY_BUNDLE_KEYS: Record<string, string> = {
  "vault/radio-reach-vault.zip": "vault/radio-reach-vault.pdf",
  "addons/indie-music-contract-bundle.zip": "products/contract-bundle/indie-music-contract-kit.zip",
};

export function resolveBundleKey(bundleKey: string) {
  return LEGACY_BUNDLE_KEYS[bundleKey] || bundleKey;
}

/** Buyer-facing filename for a bundle key, independent of the storage key. */
export function resolveDownloadFilename(bundleKey: string) {
  const resolved = resolveBundleKey(bundleKey);
  const match = Object.values(ALLOWED_PRODUCTS).find((p) => p.bundleKey === resolved);
  return match?.downloadFilename || resolved.split("/").pop() || "download";
}

export function resolveAllowedPrices(env: Env) {
  const entries = Object.entries(ALLOWED_PRODUCTS).map(([key, value]) => {
    const priceId = env[value.envPriceVar as keyof Env] as unknown as string | undefined;
    return [key, { ...value, priceId }];
  });
  return Object.fromEntries(entries) as Record<AllowedProductKey, (typeof ALLOWED_PRODUCTS)[AllowedProductKey] & { priceId?: string }>;
}
