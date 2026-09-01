/**
 * Vite dev middleware: runs the real Frequency Dominion Pages Functions
 * against node:sqlite + a KV shim so `npm run dev` has a fully working
 * backend (auth, entitlements, lessons, campaigns, stations, analytics).
 *
 * Dev-only (apply: "serve"). Production Cloudflare Pages serves the same
 * handler files as Pages Functions bound to real D1/KV/R2.
 *
 * Also exposes /api/fd-dev/* preview helpers (simulate a paid checkout so the
 * full buyer → account → course loop can be exercised without Stripe keys).
 * These do not exist in the production bundle.
 */
import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

export function fdDevApi(): Plugin {
  return {
    name: "fd-dev-api",
    apply: "serve",
    async configureServer(server) {
      const harness = await server.ssrLoadModule("/scripts/fd-test-harness.ts").catch(async () => {
        // Fallback for environments where the module graph differs: import directly.
        return import(path.join(HERE, "fd-test-harness.ts"));
      });
      const dbFile = path.join(ROOT, ".dev", "fd-local.db");
      fs.mkdirSync(path.dirname(dbFile), { recursive: true });
      const env = harness.makeEnv({ file: dbFile, seed: false });
      (env as Record<string, unknown>).FD_DEV_DISABLE_RATE_LIMITS = true;
      if (!harness.isSeeded(env.__db)) {
        harness.seedMigrations(env.__db);
        console.log("[fd-dev] seeded local D1 (schema + content)");
      }
      const router = await server.ssrLoadModule("/functions/_lib/fd/router.ts").catch(() => import(path.join(ROOT, "functions/_lib/fd/router.ts")));
      const webhookMod = await server.ssrLoadModule("/functions/api/stripe/webhook.ts").catch(() => import(path.join(ROOT, "functions/api/stripe/webhook.ts")));
      const ordersMod = await server.ssrLoadModule("/functions/_lib/orders.ts").catch(() => import(path.join(ROOT, "functions/_lib/orders.ts")));
      const verifyMod = await server.ssrLoadModule("/functions/api/checkout/verify.ts").catch(() => import(path.join(ROOT, "functions/api/checkout/verify.ts")));
      const downloadsMod = await server.ssrLoadModule("/functions/api/downloads/session.ts").catch(() => import(path.join(ROOT, "functions/api/downloads/session.ts")));
      const tokenMod = await server.ssrLoadModule("/functions/_lib/token.ts").catch(() => import(path.join(ROOT, "functions/_lib/token.ts")));

      async function readBody(req: NodeJS.ReadableStream): Promise<string> {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        return Buffer.concat(chunks).toString("utf8");
      }

      function requestFrom(req: { method?: string; headers: Record<string, string | string[] | undefined>; url?: string }, body?: string): Request {
        const host = String(req.headers.host || "localhost:8788");
        const url = new URL(req.url || "/", `http://${host}`);
        url.protocol = "http:";
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) if (v != null) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
        return new Request(url.toString(), {
          method: req.method || "GET",
          headers,
          body: req.method !== "GET" && req.method !== "HEAD" ? body ?? "" : undefined,
        });
      }

      async function sendResponse(res: import("node:http").ServerResponse, response: Response) {
        res.statusCode = response.status;
        const hdrs = response.headers;
        hdrs.forEach((v, k) => {
          if (k.toLowerCase() === "set-cookie") return;
          res.setHeader(k, v);
        });
        const cookies = typeof (hdrs as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function"
          ? (hdrs as unknown as { getSetCookie(): string[] }).getSetCookie()
          : [];
        if (cookies.length) res.setHeader("set-cookie", cookies);
        const body = await response.text();
        res.end(body);
      }

      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url || "", `http://${String(req.headers.host || "localhost:8788")}`);
          const pathname = url.pathname;

          if (pathname.startsWith("/api/fd/")) {
            const body = req.method !== "GET" && req.method !== "HEAD" ? await readBody(req) : undefined;
            const request = requestFrom(req, body);
            const fdPath = pathname.replace(/^\/api\/fd\/?/, "");
            const response = await router.dispatchFd(env, request, fdPath);
            return sendResponse(res, response);
          }
          // Real storefront endpoints so the post-checkout success page works end-to-end in the sandbox.
          if (pathname === "/api/checkout/verify" && req.method === "GET") {
            const sid = url.searchParams.get("session_id") || "";
            if (sid.startsWith("cs_test_dev_")) {
              // Dev-simulated session: answer from the order store with the same response shape
              // (Stripe's API has no record of it — this is exactly what a paid session looks like).
              const order = (await ordersMod.getOrder(env, sid)) as {
                paymentStatus?: string; amountTotal?: number; currency?: string; email?: string;
                items?: { key: string; name: string }[]; momentum?: Record<string, string> | null;
              } | null;
              if (!order) return sendResponse(res, Response.json({ error: "Order not found" }, { status: 404 }));
              const paid = order.paymentStatus === "paid";
              const token = paid ? await tokenMod.signToken(env.APP_SECRET || env.STRIPE_WEBHOOK_SECRET, { sessionId: sid, exp: Date.now() + 15 * 60 * 1000 }) : null;
              return sendResponse(res, Response.json({
                sessionId: sid,
                paymentStatus: order.paymentStatus || "paid",
                status: "complete",
                verified: paid,
                token,
                order: paid ? {
                  amountTotal: order.amountTotal ?? null,
                  currency: String(order.currency || "usd").toUpperCase(),
                  email: order.email || null,
                  productKeys: (order.items || []).map((i) => i.key),
                  productNames: (order.items || []).map((i) => i.name),
                  momentum: order.momentum || null,
                } : null,
              }));
            }
            const request = requestFrom(req);
            const response = await (verifyMod.onRequestGet as unknown as (ctx: { request: Request; env: unknown }) => Promise<Response>)({ request, env });
            return sendResponse(res, response);
          }
          if (pathname === "/api/downloads/session" && req.method === "POST") {
            const body = await readBody(req);
            const request = requestFrom(req, body);
            const response = await (downloadsMod.onRequestPost as unknown as (ctx: { request: Request; env: unknown }) => Promise<Response>)({ request, env });
            return sendResponse(res, response);
          }
          if (pathname === "/api/stripe/webhook" && req.method === "POST") {
            const body = await readBody(req);
            const request = requestFrom(req, body);
            const response = await (webhookMod.onRequestPost as unknown as (ctx: { request: Request; env: unknown }) => Promise<Response>)({ request, env });
            return sendResponse(res, response);
          }
          if (pathname.startsWith("/api/fd-dev/")) {
            const body = req.method !== "GET" ? await readBody(req) : "";
            const jsonBody = (() => { try { return JSON.parse(body || "{}"); } catch { return {}; } })();
            if (pathname === "/api/fd-dev/status") {
              const row = env.__db.prepare(`SELECT COUNT(*) c FROM users`).get() as { c: number };
              return sendResponse(res, Response.json({ ok: true, mode: "fd-dev-api", users: Number(row.c) }));
            }
            if (pathname === "/api/fd-dev/simulate-purchase" && req.method === "POST") {
              const email = String(jsonBody.email || "").trim().toLowerCase();
              if (!email || !email.includes("@")) return sendResponse(res, Response.json({ error: "email required" }, { headers: { "content-type": "application/json" } }));
              const sessionId = `cs_test_dev_${Date.now().toString(36)}`;
              const order = {
                orderId: crypto.randomUUID(),
                sessionId,
                paymentStatus: "paid",
                fulfillmentStatus: "ready",
                email,
                customerName: String(jsonBody.name || "Dev Buyer"),
                amountTotal: 9700,
                currency: "usd",
                bundleId: "frequency_dominion",
                utm: {},
                items: [{ key: "frequency_dominion", name: "Frequency Dominion (dev simulation)", bundleKey: "courses/frequency-dominion/frequency-dominion-course.zip" }],
                createdAt: new Date().toISOString(),
              };
              await ordersMod.putOrder(env, sessionId, order);
              const payload = {
                id: `evt_dev_${Date.now().toString(36)}`,
                type: "checkout.session.completed",
                created: Math.floor(Date.now() / 1000),
                data: {
                  object: {
                    id: sessionId, object: "checkout.session", object_request_id: null,
                    payment_status: "paid", status: "complete", amount_total: 9700, currency: "usd",
                    customer: `cus_dev_${Date.now().toString(36)}`, customer_details: { email, name: order.customerName },
                    customer_email: email, metadata: { product_keys: "frequency_dominion" }, payment_intent: `pi_dev_${Date.now().toString(36)}`,
                  },
                },
              };
              await webhookMod.onRequestPost({ request: await signedDevRequest(JSON.stringify(payload), env.STRIPE_WEBHOOK_SECRET), env });
              return sendResponse(res, Response.json({ ok: true, email, sessionId }, { headers: { "content-type": "application/json" } }));
            }
            return sendResponse(res, new Response("Not found", { status: 404 }));
          }
          next();
        } catch (e) {
          console.error("[fd-dev-api]", e);
          sendResponse(res, new Response(JSON.stringify({ error: "dev api error", detail: String((e as Error).message) }), { status: 500, headers: { "content-type": "application/json" } }));
        }
      });
    },
  };
}

async function signedDevRequest(payload: string, secret: string): Promise<Request> {
  const enc = new TextEncoder();
  const ts = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${ts}.${payload}`)));
  const hex = Array.from(sig).map((b) => b.toString(16).padStart(2, "0")).join("");
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": `t=${ts},v1=${hex}` },
    body: payload,
  });
}
