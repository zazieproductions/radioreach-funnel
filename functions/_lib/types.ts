export interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_VAULT_CORE: string;
  STRIPE_PRICE_CONTRACT_BUNDLE: string;
  STRIPE_PRICE_AUSTRALIA_ADDON: string;
  STRIPE_PRICE_AIRPLAY_ACCELERATOR: string;
  STRIPE_PRICE_UPWORK_COURSE: string;
  STRIPE_PRICE_FONT_VAULT: string;
  STRIPE_PUBLISHABLE_KEY: string;
  PUBLIC_APP_URL: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_NAME: string;
  ORDER_STORE: KVNamespace;
  APP_SECRET: string;
}

declare global {
  type Env = import("./types").Env;
}
