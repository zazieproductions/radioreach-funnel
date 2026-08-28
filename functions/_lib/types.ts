export interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_VAULT_CORE: string;
  STRIPE_PRICE_CONTRACT_BUNDLE: string;
  STRIPE_PRICE_AUSTRALIA_ADDON: string;
  STRIPE_PRICE_AIRPLAY_ACCELERATOR: string;
  STRIPE_PRICE_UPWORK_COURSE: string;
  STRIPE_PRICE_CONTRACT_GUIDE: string;
  STRIPE_PRICE_FREQUENCY_DOMINION: string;
  STRIPE_PRICE_FONT_VAULT: string;
  STRIPE_PUBLISHABLE_KEY: string;
  PUBLIC_APP_URL: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  ORDER_STORE: KVNamespace;
  APP_SECRET: string;
  /** Meta Conversions API (optional — CAPI sending is skipped if unset). */
  META_PIXEL_ID?: string;
  META_CAPI_ACCESS_TOKEN?: string;
  META_TEST_EVENT_CODE?: string;
}

declare global {
  type Env = import("./types").Env;
}
