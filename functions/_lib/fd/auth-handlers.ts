/** Auth endpoints: register / login / logout / session / purchase claim. */
import { ApiError, rateLimit, clientIp, now, uuid, J } from "./util";
import { hashPassword, verifyPassword, createSession, clearCookies, cookieHeaders, getSessionUser, requireCsrf, randomHex, sha256, isAdminEmail } from "./auth";
import { getEntitlement, grantFromStripe, linkUserEntitlements, audit, FD_PRODUCT, isEntitled } from "./entitlements";
import { normalizeEmail, isEmail, sanitizePlain } from "../../../shared/fd-core.ts";
import { getOrder } from "../orders";
import { getStripe } from "../stripe";
import type { Ctx } from "./router.ts";

const MIN_PASSWORD = 10;

function validatePassword(pw: string): string | null {
  if (typeof pw !== "string" || pw.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
  if (pw.length > 200) return "Password too long.";
  const lower = pw.toLowerCase();
  const weak = ["password", "123456", "qwerty", "letmein", "iloveyou", "radio"];
  if (weak.some((w) => lower === w || lower.includes(w + "123"))) return "Choose a stronger password.";
  return null;
}

async function readBody(ctx: Ctx) {
  const b = await ctx.json();
  return {
    email: normalizeEmail(String(b.email || "")),
    password: String(b.password || ""),
    name: sanitizePlain(String(b.name || ""), 120),
    sessionId: sanitizePlain(String(b.sessionId || ""), 240),
    orderId: sanitizePlain(String(b.orderId || ""), 64),
    mode: String((b as Record<string, unknown>).mode || "create"),
    raw: b,
  };
}

/** Server-side proof that a Stripe checkout session belongs to `email` and
 *  contains `productKey`. Stripe API first; KV order record (written by the
 *  verified webhook) as fallback for dev/preview without a secret key. */
async function verifyPurchase(env: Env, email: string, ref: { sessionId?: string; orderId?: string }): Promise<{ ok: boolean; productKeys: string[]; source: string }> {
  const db = env.DB;
  if (db && ref.sessionId) {
    const row = await db.prepare(`SELECT email_normalized, payment_status, product_keys FROM stripe_payments WHERE session_id = ?`).bind(ref.sessionId).first<{ email_normalized: string; payment_status: string; product_keys: string }>();
    if (row && row.payment_status === "paid") {
      if (row.email_normalized !== email) return { ok: false, productKeys: [], source: "db-email-mismatch" };
      return { ok: true, productKeys: J<string[]>(row.product_keys, []), source: "db" };
    }
  }
  if (env.STRIPE_SECRET_KEY && ref.sessionId) {
    try {
      const stripe = getStripe(env);
      const session = await stripe.checkout.sessions.retrieve(ref.sessionId);
      const sessionEmail = normalizeEmail(session.customer_details?.email || session.customer_email || "");
      if (session.payment_status === "paid" && sessionEmail === email) {
        return { ok: true, productKeys: (session.metadata?.product_keys || "").split(",").filter(Boolean), source: "stripe" };
      }
      return { ok: false, productKeys: [], source: "stripe-reject" };
    } catch (e) {
      // fall through to KV
    }
  }
  if (ref.sessionId || ref.orderId) {
    const order = ref.sessionId ? await getOrder(env, ref.sessionId) : null;
    if (order) {
      const orderEmail = normalizeEmail(order.email || "");
      if (order.paymentStatus === "paid" && orderEmail === email) {
        return { ok: true, productKeys: order.items.map((i) => i.key), source: "kv" };
      }
      return { ok: false, productKeys: [], source: "kv-reject" };
    }
  }
  return { ok: false, productKeys: [], source: "not-found" };
}

export async function handleRegister(ctx: Ctx): Promise<Response> {
  const { env, req } = ctx;
  if (!env.DB) throw new ApiError(503, "Course storage not configured.");
  const rl = await rateLimit(env, "register", clientIp(req), 8, 600);
  if (!rl.ok) throw new ApiError(429, "Too many sign-up attempts. Try again in ten minutes.");

  const b = await readBody(ctx);
  if (!isEmail(b.email)) throw new ApiError(400, "Enter a valid email address.");
  const pwErr = validatePassword(b.password);
  if (pwErr) throw new ApiError(400, pwErr);

  const db = env.DB;
  const dupe = await db.prepare(`SELECT id FROM users WHERE email_normalized = ?`).bind(b.email).first();
  if (dupe) throw new ApiError(409, "An account already exists for this email. Sign in instead.");

  const { hash, salt, iterations } = await hashPassword(b.password);
  const id = uuid();
  const role = isAdminEmail(env, b.email) ? "admin" : "member";
  await db.prepare(
    `INSERT INTO users (id, email, email_normalized, password_hash, password_salt, display_name, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
  ).bind(id, b.email, b.email, hash, salt, b.name || b.email.split("@")[0], role, now(), now()).run();
  await db.prepare(`INSERT INTO user_profiles (user_id, updated_at) VALUES (?, ?)`).bind(id, now()).run();

  // Auto-link an entitlement the webhook already recorded for this email,
  // and honour a purchase reference if supplied.
  await linkUserEntitlements(env, id, b.email);
  if (b.sessionId) {
    const v = await verifyPurchase(env, b.email, { sessionId: b.sessionId });
    if (v.ok && v.productKeys.includes(FD_PRODUCT)) {
      await grantFromStripe(env, { email: b.email, sessionId: b.sessionId, eventId: `register:${b.sessionId}` });
    }
  }

  const session = await createSession(env, id, req);
  const entitlement = await getEntitlement(env, b.email);
  return Response.json(
    { ok: true, user: { id, email: b.email, displayName: b.name || b.email.split("@")[0], role }, entitlement: publicEntitlement(entitlement) },
    { headers: cookieHeaders(session.headers) }
  );
}

export async function handleLogin(ctx: Ctx): Promise<Response> {
  const { env, req } = ctx;
  if (!env.DB) throw new ApiError(503, "Course storage not configured.");
  const b = await readBody(ctx);
  const rl = await rateLimit(env, "login", `${clientIp(req)}:${b.email}`, 10, 600);
  if (!rl.ok) throw new ApiError(429, "Too many sign-in attempts. Try again in ten minutes.");

  const user = await env.DB.prepare(`SELECT * FROM users WHERE email_normalized = ?`).bind(b.email).first<Record<string, string | number | null>>();
  if (!user) throw new ApiError(401, "Email or password is incorrect.");
  if (user.status !== "active") throw new ApiError(403, "This account is disabled. Contact support.");
  if (user.locked_until && user.locked_until > now()) throw new ApiError(423, "Account temporarily locked after repeated failures. Wait a few minutes.");

  const ok = await verifyPassword(b.password, { hash: String(user.password_hash), salt: String(user.password_salt) });
  if (!ok) {
    const fails = Number(user.failed_login_count || 0) + 1;
    await env.DB.prepare(`UPDATE users SET failed_login_count=?, locked_until=? WHERE id=?`)
      .bind(fails, fails >= 8 ? new Date(Date.now() + 15 * 60_000).toISOString() : null, user.id).run();
    throw new ApiError(401, "Email or password is incorrect.");
  }
  await env.DB.prepare(`UPDATE users SET failed_login_count=0, locked_until=NULL WHERE id=?`).bind(user.id).run();
  await linkUserEntitlements(env, String(user.id), b.email);
  const session = await createSession(env, String(user.id), req);
  const entitlement = await getEntitlement(env, b.email);
  return Response.json(
    { ok: true, user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role }, entitlement: publicEntitlement(entitlement) },
    { headers: cookieHeaders(session.headers) }
  );
}

export async function handleLogout(ctx: Ctx): Promise<Response> {
  const user = ctx.user;
  if (user && ctx.env.DB) {
    const token = (ctx.req.headers.get("cookie") || "").match(/fd_session=([^;]+)/)?.[1];
    if (token) {
      const hash = await sha256(token);
      await ctx.env.DB.prepare(`UPDATE auth_sessions SET revoked_at=? WHERE token_hash=?`).bind(now(), hash).run();
    }
  }
  return Response.json({ ok: true }, { headers: cookieHeaders(clearCookies()) });
}

export async function handleSession(ctx: Ctx): Promise<Response> {
  const user = await getSessionUser(ctx.env, ctx.req);
  if (!user) return Response.json({ user: null });
  const entitlement = ctx.env.DB ? await getEntitlement(ctx.env, user.emailNormalized) : null;
  return Response.json({
    user,
    entitlement: publicEntitlement(entitlement),
    csrf: user.csrf,
    profile: await ctx.env.DB!.prepare(`SELECT artist_name, market_city, market_state, goals, weekly_hours, onboarding_complete FROM user_profiles WHERE user_id=?`).bind(user.id).first(),
  });
}

export async function handleClaim(ctx: Ctx): Promise<Response> {
  const { env, req } = ctx;
  if (!env.DB) throw new ApiError(503, "Course storage not configured.");
  const rl = await rateLimit(env, "claim", clientIp(req), 10, 3600);
  if (!rl.ok) throw new ApiError(429, "Too many attempts. Try again in an hour.");
  const b = await readBody(ctx);
  if (!isEmail(b.email)) throw new ApiError(400, "Enter the email you paid with.");
  const v = await verifyPurchase(env, b.email, { sessionId: b.sessionId, orderId: b.orderId });
  if (!v.ok) throw new ApiError(403, "That purchase reference does not match this email. Check the receipt and try again.");
  if (!v.productKeys.includes(FD_PRODUCT)) throw new ApiError(403, "That order does not include Frequency Dominion.");

  const mode = b.mode;
  const pwErr = validatePassword(b.password);
  if (pwErr) throw new ApiError(400, pwErr);

  const existing = await env.DB.prepare(`SELECT id FROM users WHERE email_normalized = ?`).bind(b.email).first<{ id: string }>();
  if (mode === "reset") {
    if (!existing) throw new ApiError(404, "No account yet — create one first.");
    const { hash, salt } = await hashPassword(b.password);
    await env.DB.prepare(`UPDATE users SET password_hash=?, password_salt=?, failed_login_count=0, locked_until=NULL, updated_at=? WHERE id=?`)
      .bind(hash, salt, now(), existing.id).run();
    await env.DB.prepare(`UPDATE auth_sessions SET revoked_at=? WHERE user_id=?`).bind(now(), existing.id).run();
    await audit(env, { action: "password_reset_via_claim", target: b.email, product: FD_PRODUCT, reason: "verified purchase reference" });
  } else {
    if (existing) throw new ApiError(409, "An account exists for this email. Sign in, or choose 'reset password' and verify the purchase again.");
    const { hash, salt } = await hashPassword(b.password);
    const id = uuid();
    const role = isAdminEmail(env, b.email) ? "admin" : "member";
    await env.DB.prepare(
      `INSERT INTO users (id, email, email_normalized, password_hash, password_salt, display_name, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    ).bind(id, b.email, b.email, hash, salt, b.name || b.email.split("@")[0], role, now(), now()).run();
    await env.DB.prepare(`INSERT INTO user_profiles (user_id, updated_at) VALUES (?, ?)`).bind(id, now()).run();
  }
  await grantFromStripe(env, { email: b.email, sessionId: b.sessionId || `claim:${b.orderId}`, eventId: `claim:${b.sessionId || b.orderId}` });
  await linkUserEntitlements(env, existing?.id || "", b.email);
  const user = await env.DB.prepare(`SELECT id, display_name, role FROM users WHERE email_normalized=?`).bind(b.email).first<{ id: string; display_name: string; role: "member" | "admin" }>();
  const session = await createSession(env, user!.id, req);
  const entitlement = await getEntitlement(env, b.email);
  return Response.json(
    { ok: true, user: { id: user!.id, email: b.email, displayName: user!.display_name, role: user!.role }, entitlement: publicEntitlement(entitlement) },
    { headers: cookieHeaders(session.headers) }
  );
}

export async function handleEntitlement(ctx: Ctx): Promise<Response> {
  if (!ctx.env.DB) throw new ApiError(503, "Course storage not configured.");
  const user = ctx.user; // may be null for anonymous
  if (!user) return Response.json({ signedIn: false });
  const row = await getEntitlement(ctx.env, user.emailNormalized);
  return Response.json({ signedIn: true, entitlement: publicEntitlement(row) });
}

function publicEntitlement(row: Awaited<ReturnType<typeof getEntitlement>>) {
  if (!row) return { status: "none" as const, product: FD_PRODUCT };
  return {
    status: isEntitled(row) ? ("active" as const) : row.status,
    product: row.product_key,
    source: row.source,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at,
  };
}
