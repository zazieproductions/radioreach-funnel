/**
 * Entitlement lifecycle for course products.
 *
 * Rows live in D1 `entitlements`, keyed by (normalized email, product). The
 * Stripe webhook is the authority for grants/revokes; users only ever LINK a
 * paid purchase to an account (verified server-side against Stripe/KV order
 * records) — they can never create or extend an entitlement from the client.
 */
import { ApiError, J, now, uuid } from "./util";
import { normalizeEmail, sanitizePlain } from "../../../shared/fd-core.ts";

export const FD_PRODUCT = "frequency_dominion";

export type EntitlementRow = {
  id: string;
  user_id: string | null;
  email_normalized: string;
  product_key: string;
  status: "pending_link" | "active" | "revoked" | "refunded" | "disputed";
  source: "stripe" | "claim" | "admin";
  stripe_session_id: string | null;
  order_id: string | null;
  granted_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  admin_notes: string;
  created_at: string;
  updated_at: string;
};

export function isEntitled(row: EntitlementRow | null): boolean {
  if (!row || row.status !== "active") return false;
  if (row.expires_at && row.expires_at < now()) return false;
  return true;
}

export async function getEntitlement(env: Env, emailNormalized: string, product = FD_PRODUCT): Promise<EntitlementRow | null> {
  return (await env.DB!.prepare(`SELECT * FROM entitlements WHERE email_normalized = ? AND product_key = ?`)
    .bind(emailNormalized, product)
    .first<EntitlementRow>());
}

/** Upsert a paid grant from the webhook (idempotent — re-delivery refreshes
 *  timestamps only, never re-grants a revoked/refunded row unless payment is
 *  genuinely paid again). */
export async function grantFromStripe(
  env: Env,
  opts: { email: string; product?: string; sessionId: string; orderId?: string | null; customerId?: string | null; eventId?: string }
): Promise<{ granted: boolean; reason?: string }> {
  const email = normalizeEmail(opts.email);
  if (!email || !email.includes("@")) return { granted: false, reason: "missing email" };
  const product = opts.product || FD_PRODUCT;
  const db = env.DB!;
  const existing = await getEntitlement(env, email, product);
  // Link to an account if the buyer registered after purchase.
  const account = await db.prepare(`SELECT id FROM users WHERE email_normalized = ?`).bind(email).first<{ id: string }>();
  if (existing) {
    if (existing.status === "revoked") {
      return { granted: false, reason: "revoked by admin — manual restore required" };
    }
    await db.prepare(
      `UPDATE entitlements SET status='active', user_id=COALESCE(?, user_id), stripe_session_id=?, order_id=COALESCE(?, order_id),
       granted_at=COALESCE(granted_at, ?), revoked_at=NULL, last_event_id=?, updated_at=? WHERE id=?`
    )
      .bind(account?.id ?? null, opts.sessionId, opts.orderId ?? null, now(), opts.eventId ?? "", now(), existing.id)
      .run();
    if (existing.status !== "active") await audit(env, { action: "stripe_reactivate", target: email, product, reason: "paid session replay" });
    return { granted: true };
  }
  await db.prepare(
    `INSERT INTO entitlements (id, user_id, email_normalized, product_key, status, source, stripe_customer_id, stripe_session_id, order_id, granted_at, expires_at, last_event_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'stripe', ?, ?, ?, ?, NULL, ?, ?, ?)`
  )
    .bind(uuid(), account?.id ?? null, email, product, "active", opts.customerId ?? null, opts.sessionId, opts.orderId ?? null, now(), opts.eventId ?? "", now(), now())
    .run();
  await audit(env, { action: "stripe_grant", target: email, product, reason: "checkout.session.completed" });
  await bumpStat(env, "enrollments_granted");
  return { granted: true };
}

export type SettleInput = { email: string; product?: string; status: "revoked" | "refunded" | "disputed" | "active"; reason: string };

export async function settleState(env: Env, input: SettleInput): Promise<boolean> {
  const email = normalizeEmail(input.email);
  const product = input.product || FD_PRODUCT;
  const existing = await getEntitlement(env, email, product);
  if (!existing) return false;
  const revokeStamp = input.status === "active" ? null : now();
  await env.DB!.prepare(
    `UPDATE entitlements SET status=?, revoked_at=?, admin_notes=?, updated_at=? WHERE id=?`
  )
    .bind(input.status, revokeStamp, sanitizePlain(input.reason, 500), now(), existing.id)
    .run();
  await audit(env, { action: `stripe_${input.status}`, target: email, product, reason: input.reason });
  return true;
}

/** When a user registers or logs in, link any paid entitlement that was
 *  created for their email before they had an account. */
export async function linkUserEntitlements(env: Env, userId: string, emailNormalized: string): Promise<void> {
  await env.DB!.prepare(
    `UPDATE entitlements SET user_id=?, updated_at=? WHERE email_normalized=? AND user_id IS NULL`
  )
    .bind(userId, now(), emailNormalized)
    .run();
}

export async function audit(
  env: Env,
  entry: { actorUserId?: string | null; actorEmail?: string; action: string; entitlementId?: string | null; target: string; product: string; reason: string }
): Promise<void> {
  await env.DB!.prepare(
    `INSERT INTO entitlement_audit (id, actor_user_id, actor_email, action, entitlement_id, target_email, product_key, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(uuid(), entry.actorUserId ?? null, sanitizePlain(entry.actorEmail || "", 320), entry.action, entry.entitlementId ?? null, entry.target, entry.product, sanitizePlain(entry.reason, 500), now())
    .run();
}

export async function requireEnrolled(env: Env, emailNormalized: string): Promise<EntitlementRow> {
  const row = await getEntitlement(env, emailNormalized);
  if (!row) throw new ApiError(402, "This course requires a Frequency Dominion purchase.", { code: "no_entitlement" });
  if (row.status === "refunded") throw new ApiError(403, "This purchase was refunded, so access ended.", { code: "refunded" });
  if (row.status === "disputed") throw new ApiError(403, "Access is on hold while the payment dispute is resolved.", { code: "disputed" });
  if (row.status === "revoked") throw new ApiError(403, "Access was revoked by an administrator.", { code: "revoked" });
  if (!isEntitled(row)) throw new ApiError(402, "We could not verify an active purchase on this account.", { code: "unverified" });
  return row;
}

export async function bumpStat(env: Env, key: string, delta = 1): Promise<void> {
  try {
    await env.DB!.prepare(
      `INSERT INTO app_stats (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = app_stats.value + ?, updated_at = excluded.updated_at`
    )
      .bind(key, delta, now(), delta)
      .run();
  } catch {
    /* stats are best-effort */
  }
}

export function sessionProducts(keysCsv: string | null | undefined): string[] {
  return String(keysCsv || "")
    .split(",")
    .map((k) => sanitizePlain(k, 40))
    .filter(Boolean);
}

export { J };
