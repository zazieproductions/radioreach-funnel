/** D1 + misc helpers for the Frequency Dominion API. */

export const now = () => new Date().toISOString();
export const uuid = () => crypto.randomUUID();
export const J = <T,>(v: unknown, fallback: T): T => {
  try {
    const p = typeof v === "string" ? JSON.parse(v) : v;
    return p == null ? fallback : (p as T);
  } catch {
    return fallback;
  }
};

export function requireDb(env: Env) {
  if (!env.DB) {
    throw new ApiError(503, "Course storage is not configured (D1 binding DB).");
  }
  return env.DB;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function err(status: number, message: string, details?: unknown) {
  const d = (details ?? undefined) as { code?: string } | undefined;
  return json({ error: message, ...(d?.code ? { code: d.code } : {}), ...(details ? { details } : {}) }, { status });
}

/* ── Rate limiting (KV fixed window; in-memory fallback for single-isolate dev) ── */

const memWindow = new Map<string, { n: number; reset: number }>();

export async function rateLimit(
  env: Env,
  scope: string,
  key: string,
  limit: number,
  windowSec: number
): Promise<{ ok: boolean; retryAfter: number }> {
  const rk = `rl:${scope}:${key}`;
  const window = Math.floor(Date.now() / (windowSec * 1000));
  if (env.ORDER_STORE) {
    try {
      const raw = await env.ORDER_STORE.get(rk);
      const cur = raw ? (JSON.parse(raw) as { n: number; w: number }) : { n: 0, w: window };
      const next = cur.w === window ? { n: cur.n + 1, w: window } : { n: 1, w: window };
      if (next.n > limit) return { ok: false, retryAfter: windowSec };
      await env.ORDER_STORE.put(rk, JSON.stringify(next), { expirationTtl: windowSec * 2 });
      return { ok: true, retryAfter: 0 };
    } catch {
      /* fall through to memory */
    }
  }
  const mkey = `${rk}:${window}`;
  const n = (memWindow.get(mkey)?.n || 0) + 1;
  memWindow.set(mkey, { n, reset: window });
  if (memWindow.size > 5000) memWindow.clear();
  return n > limit ? { ok: false, retryAfter: windowSec } : { ok: true, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
