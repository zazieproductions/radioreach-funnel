/**
 * Email/password auth for the Frequency Dominion course app.
 *
 * - PBKDF2-SHA256 (210k iterations, WebCrypto — no native deps, runs on
 *   workerd and Node 22 alike).
 * - Server-side session rows in D1 (revocable) + random bearer token stored
 *   in an HttpOnly Secure SameSite=Lax cookie.
 * - CSRF: every mutating request must echo the fd_csrf cookie in an
 *   X-FD-CSRF header (double-submit). SameSite=Lax already blocks
 *   cross-site POST cookie sending; this is defense in depth.
 */
import { ApiError, now, uuid } from "./util";
import { normalizeEmail, sanitizePlain } from "../../../shared/fd-core.ts";

export const SESSION_COOKIE = "fd_session";
export const CSRF_COOKIE = "fd_csrf";
const SESSION_TTL_DAYS = 30;
const PBKDF2_ITERATIONS = 210_000;

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function pbkdf2(password: string, saltHex: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = Uint8Array.from(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
  return toHex(bits);
}

export function randomHex(bytes = 32): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string; iterations: number }> {
  const salt = randomHex(16);
  const hash = await pbkdf2(password, salt);
  return { hash, salt, iterations: PBKDF2_ITERATIONS };
}

export async function verifyPassword(password: string, stored: { hash: string; salt: string; iterations?: number }): Promise<boolean> {
  const hash = await pbkdf2(password, stored.salt, stored.iterations || PBKDF2_ITERATIONS);
  // constant-time-ish compare
  if (hash.length !== stored.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ stored.hash.charCodeAt(i);
  return diff === 0;
}

export async function sha256(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

/* ── cookies ──────────────────────────────────────────────────────────── */

function isSecure(req: Request): boolean {
  const host = new URL(req.url).hostname;
  return host !== "localhost" && !/^\d+\.\d+\.\d+\.\d+$/.test(host) && host !== "local.dev" && !host.endsWith(".local");
}

export function sessionCookie(token: string, maxAgeSec = SESSION_TTL_DAYS * 86400, secure = true): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure ? "; Secure" : ""}`;
}
export function csrfCookie(token: string, secure = true): string {
  return `${CSRF_COOKIE}=${token}; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_DAYS * 86400}${secure ? "; Secure" : ""}`;
}
/** Multiple Set-Cookie values must be appended individually — an array/object
 *  init collapses them with commas (both Workers runtime and Node undici). */
export function cookieHeaders(list: string[]): Headers {
  const h = new Headers();
  for (const c of list) h.append("set-cookie", c);
  return h;
}

export function clearCookies(): string[] {
  return [
    `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`,
    `${CSRF_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
  ];
}

export function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.get("cookie") || "").split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

/* ── sessions ─────────────────────────────────────────────────────────── */

export type SessionUser = {
  id: string;
  email: string;
  emailNormalized: string;
  displayName: string;
  role: "member" | "admin";
  csrf: string;
};

export async function createSession(
  env: Env,
  userId: string,
  req: Request,
  extraHeaders: string[] = []
): Promise<{ headers: string[] }> {
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const csrf = randomHex(16);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000).toISOString();
  await env.DB!.prepare(
    `INSERT INTO auth_sessions (id, user_id, token_hash, csrf_token, ip, user_agent, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(uuid(), userId, tokenHash, csrf, clientIpSafe(req), sanitizePlain(req.headers.get("user-agent") || "", 400), now(), expiresAt)
    .run();
  // Opportunistic cleanup of expired sessions.
  await env.DB!.prepare(`DELETE FROM auth_sessions WHERE expires_at < ?`).bind(now()).run();
  const secure = isSecure(req);
  return { headers: [...extraHeaders, sessionCookie(token, SESSION_TTL_DAYS * 86400, secure), csrfCookie(csrf, secure)] };
}

function clientIpSafe(req: Request): string {
  return sanitizePlain(req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "", 64);
}

export async function getSessionUser(env: Env, req: Request): Promise<SessionUser | null> {
  if (!env.DB) return null;
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const hash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT s.id AS session_id, s.csrf_token, s.expires_at, s.revoked_at,
            u.id, u.email, u.email_normalized, u.display_name, u.role, u.status
     FROM auth_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`
  )
    .bind(hash)
    .first<Record<string, string>>();
  if (!row) return null;
  if (row.revoked_at || row.expires_at < now() || row.status !== "active") return null;
  // sliding expiry (cheap: only bump when >1d elapsed)
  const expires = Date.parse(row.expires_at);
  if (expires - Date.now() < (SESSION_TTL_DAYS - 1) * 86400_000) {
    await env.DB.prepare(`UPDATE auth_sessions SET expires_at = ? WHERE id = ?`)
      .bind(new Date(Date.now() + SESSION_TTL_DAYS * 86400_000).toISOString(), row.session_id)
      .run();
  }
  return {
    id: row.id,
    email: row.email,
    emailNormalized: row.email_normalized,
    displayName: row.display_name,
    role: row.role as "member" | "admin",
    csrf: row.csrf_token,
  };
}

export async function requireUser(env: Env, req: Request): Promise<SessionUser> {
  const user = await getSessionUser(env, req);
  if (!user) throw new ApiError(401, "Sign in to continue.");
  return user;
}

export function requireCsrf(req: Request, user: SessionUser): void {
  const header = req.headers.get("x-fd-csrf");
  if (!header || header !== user.csrf) throw new ApiError(403, "CSRF validation failed. Reload the page and try again.");
}

export function requireAdmin(user: SessionUser): void {
  if (user.role !== "admin") throw new ApiError(403, "Administrator access required.");
}

export function isAdminEmail(env: Env, emailNormalized: string): boolean {
  const list = (env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter(Boolean);
  return list.includes(emailNormalized);
}
