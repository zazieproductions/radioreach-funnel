/** Typed fetch client for /api/fd/* with CSRF echo + normalized errors. */

export class ApiFailure extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function csrfToken(): string {
  const m = document.cookie.match(/(?:^|;\s*)fd_csrf=([^;]+)/);
  return m ? m[1] : "";
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/fd/${path}`, {
    method,
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(method !== "GET" && method !== "HEAD" ? { "x-fd-csrf": csrfToken() } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown = text;
  try { data = JSON.parse(text); } catch { /* non-JSON */ }
  if (!res.ok) {
    const d = (data ?? {}) as { error?: string; code?: string; details?: unknown };
    throw new ApiFailure(res.status, d.error || `Request failed (${res.status})`, d.code, d.details);
  }
  return data as T;
}

export const fdApi = {
  get: <T,>(path: string, query?: Record<string, string | number | undefined>) => {
    const qs = query
      ? "?" + new URLSearchParams(Object.entries(query).filter(([, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)]))
      : "";
    return call<T>("GET", path + qs);
  },
  post: <T,>(path: string, body?: unknown) => call<T>("POST", path, body ?? {}),
  put: <T,>(path: string, body?: unknown) => call<T>("PUT", path, body ?? {}),
  patch: <T,>(path: string, body?: unknown) => call<T>("PATCH", path, body ?? {}),
  del: <T,>(path: string, body?: unknown) => call<T>("DELETE", path, body ?? {}),
};

export const devPurchase = {
  available: (import.meta as any).env?.DEV === true,
  simulate: (email: string) =>
    fetch("/api/fd-dev/simulate-purchase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    }).then((r) => r.json()),
};
