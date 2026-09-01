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
  /** D1 database holding course content, entitlements and learner data. */
  DB?: D1Database;
  /** Comma-separated admin emails — register/login with these grants role=admin. */
  ADMIN_EMAILS?: string;
  /** Meta Conversions API (optional — CAPI sending is skipped if unset). */
  META_PIXEL_ID?: string;
  META_CAPI_ACCESS_TOKEN?: string;
  META_TEST_EVENT_CODE?: string;
}

/** Minimal structural typing for the D1 binding so Functions + tests + the
 *  local node:sqlite harness share one surface. */
export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  meta: { changes?: number; last_row_id?: number };
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<{ count: number }>;
}

declare global {
  type Env = import("./types").Env;
  type D1Database = import("./types").D1Database;
  type D1PreparedStatement = import("./types").D1PreparedStatement;
  type D1Result<T = Record<string, unknown>> = import("./types").D1Result<T>;
}
