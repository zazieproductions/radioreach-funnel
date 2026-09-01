/**
 * Shared local harness for FD development + tests.
 *
 * Boots the real Pages Function handlers against:
 *   - node:sqlite (same SQLite engine semantics as D1) with the repo's
 *     migrations applied verbatim,
 *   - an in-memory KV shim (ORDER_STORE),
 *   - no network: Stripe signature verification runs locally (pure HMAC);
 *     anything needing the Stripe API is stubbed by tests via mock.module.
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// side effect: registers global Env / D1 types
import "../functions/_lib/types.ts";
import { createD1, createKV } from "../functions/_lib/fd/d1-shim.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export type TestEnv = Env & { __db: DatabaseSync; __reset?: () => void };

export function makeEnv(opts: { file?: string | null; seed?: boolean } = {}): TestEnv {
  const db = new DatabaseSync(opts.file ?? ":memory:");
  db.exec("PRAGMA journal_mode = WAL;");
  const env = {
    DB: createD1(db),
    ORDER_STORE: createKV(),
    APP_SECRET: "dev-app-secret-not-a-real-key",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "sk_test_harness_dummy_key",
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "whsec_devtest1234567890",
    STRIPE_PRICE_FREQUENCY_DOMINION: "price_fd_test_123",
    STRIPE_PRICE_VAULT_CORE: "price_vault_test_123",
    ADMIN_EMAILS: "admin@radioreach.us",
    PUBLIC_APP_URL: "http://localhost:8788",
    R2_ACCOUNT_ID: "",
    R2_ACCESS_KEY_ID: "",
    R2_SECRET_ACCESS_KEY: "",
    R2_BUCKET_NAME: "",
  } as unknown as TestEnv;
  (env as TestEnv).__db = db;
  if (opts.seed !== false) seedMigrations(db);
  return env;
}

export function seedMigrations(db: DatabaseSync) {
  for (const file of ["0001_fd_schema.sql", "0002_fd_content.sql"]) {
    const p = path.join(ROOT, "migrations", file);
    if (!fs.existsSync(p)) throw new Error(`missing ${p} — run node scripts/fd/gen-seed-sql.mjs`);
    db.exec(fs.readFileSync(p, "utf8"));
  }
}

/** Count rows to decide whether seeding already happened. */
export function isSeeded(db: DatabaseSync): boolean {
  try {
    const r = db.prepare(`SELECT COUNT(*) c FROM lessons`).get() as { c: number };
    return Number(r.c) > 0;
  } catch {
    return false;
  }
}

/* ── fetch-style helpers (Node 22 has global Request/Response) ─────────── */

export type CallResult = { status: number; body: any; headers: Headers; setCookies: string[] };

export async function callApi(
  env: TestEnv,
  method: string,
  pathname: string,
  opts: { body?: unknown; cookie?: string; csrf?: string; json?: boolean } = {}
): Promise<CallResult> {
  const { dispatchFd } = await import("../functions/_lib/fd/router.ts");
  const url = `http://localhost:8788${pathname}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (opts.cookie) headers.cookie = opts.cookie;
  if (opts.csrf) headers["x-fd-csrf"] = opts.csrf;
  let body: string | undefined;
  if (opts.body !== undefined && method !== "GET" && method !== "HEAD") {
    body = JSON.stringify(opts.body);
    headers["content-type"] = "application/json";
  }
  const req = new Request(url, { method, headers, body });
  const fdPath = pathname.replace(/^\/api\/fd\/?/, "").split("?")[0];
  const res = await dispatchFd(env as Env, req, fdPath);
  const text = await res.text();
  let parsed: any = text;
  try { parsed = JSON.parse(text); } catch { /* keep text */ }
  const setCookies = typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function"
    ? (res.headers as unknown as { getSetCookie(): string[] }).getSetCookie()
    : [];
  return { status: res.status, body: parsed, headers: res.headers, setCookies };
}

/** Extract the fd_session token from Set-Cookie headers → cookie string. */
export function cookieFrom(res: CallResult): string {
  const parts: string[] = [];
  for (const c of res.setCookies) {
    const kv = c.split(";")[0];
    if (kv.startsWith("fd_session=") || kv.startsWith("fd_csrf=")) parts.push(kv);
  }
  return parts.join("; ");
}

export function csrfFrom(cookie: string): string {
  const m = cookie.match(/fd_csrf=([^;]+)/);
  return m ? m[1] : "";
}

/* ── Stripe webhook signing (pure, offline) ───────────────────────────── */

export async function signWebhookPayload(secret: string, payload: string, timestamp = Math.floor(Date.now() / 1000)): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${payload}`));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}

/** Deliver a webhook event through the REAL handler (signature included). */
export async function postWebhook(env: TestEnv, event: Record<string, unknown>, opts: { badSignature?: boolean } = {}): Promise<{ status: number; body: any }> {
  const { onRequestPost } = await import("../functions/api/stripe/webhook.ts");
  const payload = JSON.stringify(event);
  const signature = opts.badSignature
    ? "t=1,v1=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
    : await signWebhookPayload(env.STRIPE_WEBHOOK_SECRET, payload);
  const req = new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": signature },
    body: payload,
  });
  const res = await (onRequestPost as unknown as (ctx: { request: Request; env: Env }) => Promise<Response>)({ request: req, env: env as Env });
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch { /* raw */ }
  return { status: res.status, body };
}

export function fdEvent(sessionOverrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: `evt_${Math.random().toString(36).slice(2, 10)}`,
    type: "checkout.session.completed",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `cs_test_${Math.random().toString(36).slice(2, 10)}`,
        object: "checkout.session",
        object_request_id: null,
        payment_status: "paid",
        status: "complete",
        amount_total: 9700,
        currency: "usd",
        customer: `cus_test_${Math.random().toString(36).slice(2, 8)}`,
        customer_details: { email: null, name: "Test Buyer" },
        customer_email: null,
        metadata: { product_keys: "frequency_dominion", bundle_id: "frequency_dominion" },
        payment_intent: `pi_test_${Math.random().toString(36).slice(2, 10)}`,
        ...sessionOverrides,
      },
    },
  };
}
