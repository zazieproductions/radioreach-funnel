import Stripe from "stripe";
import { json } from "../../_lib/json";
import { getStripe } from "../../_lib/stripe";
import { eventSeen, getOrder, markEventSeen, putOrder, type OrderRecord } from "../../_lib/orders";
import { ALLOWED_PRODUCTS, resolveAllowedPrices, type AllowedProductKey } from "../../_lib/config";
import { sendCapiPurchase } from "../../_lib/metaCapi";
import { grantFromStripe, settleState, FD_PRODUCT } from "../../_lib/fd/entitlements";
import { now, uuid } from "../../_lib/fd/util";
import { normalizeEmail } from "../../../shared/fd-core";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ error: "Missing stripe-signature" }, { status: 400 });

  const payload = await request.text();
  const stripe = getStripe(env);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return json({ error: `Webhook verification failed: ${(error as Error).message}` }, { status: 400 });
  }

  // Idempotency: fast KV path + durable D1 path (D1 wins across 30 days).
  if (await eventSeen(env, event.id)) {
    return json({ ok: true, duplicate: true });
  }
  if (env.DB) {
    try {
      const seen = await env.DB.prepare(`SELECT id FROM webhook_events WHERE id = ?`).bind(event.id).first();
      if (seen) return json({ ok: true, duplicate: true });
    } catch {
      /* KV guard above still applies */
    }
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    let order = await getOrder(env, session.id);

    let paymentStatus = session.payment_status;
    let fulfillmentStatus: OrderRecord["fulfillmentStatus"] = order?.fulfillmentStatus || "pending";

    if (event.type === "checkout.session.async_payment_failed") {
      fulfillmentStatus = "payment_failed";
    } else if (paymentStatus === "paid" || event.type === "checkout.session.async_payment_succeeded") {
      paymentStatus = "paid";
      if (fulfillmentStatus !== "fulfilled") {
        fulfillmentStatus = "ready";
      }
    } else {
      if (fulfillmentStatus !== "fulfilled" && fulfillmentStatus !== "payment_failed") {
        fulfillmentStatus = "pending";
      }
    }

    if (!order && event.type === "checkout.session.completed") {
      const allowed = resolveAllowedPrices(env);
      const selected = ((session.metadata?.product_keys || "").split(",").filter(Boolean) as AllowedProductKey[]).map((key) => ({
        key,
        name: ALLOWED_PRODUCTS[key]?.name || key,
        bundleKey: ALLOWED_PRODUCTS[key]?.bundleKey || "",
        priceId: allowed[key]?.priceId,
      }));

      order = {
        orderId: crypto.randomUUID(),
        sessionId: session.id,
        paymentStatus,
        fulfillmentStatus,
        email: session.customer_details?.email || session.customer_email || null,
        customerName: session.customer_details?.name || null,
        amountTotal: session.amount_total,
        currency: session.currency,
        bundleId: session.metadata?.bundle_id || null,
        utm: {
          utm_source: session.metadata?.utm_source || "",
          utm_medium: session.metadata?.utm_medium || "",
          utm_campaign: session.metadata?.utm_campaign || "",
          utm_term: session.metadata?.utm_term || "",
          utm_content: session.metadata?.utm_content || "",
        },
        momentum: {
          sequence_variant: session.metadata?.sequence_variant || "control",
          sequence_status: session.metadata?.sequence_status || "not_seen",
          sequence_steps: session.metadata?.sequence_steps || "0",
          sequence_target: session.metadata?.sequence_target || "",
          sequence_frustration: session.metadata?.sequence_frustration || "",
          sequence_done_with: session.metadata?.sequence_done_with || "",
        },
        items: selected,
        createdAt: new Date().toISOString(),
      };
    } else if (order) {
      order.paymentStatus = paymentStatus;
      order.fulfillmentStatus = fulfillmentStatus;
    }

    if (order) {
      await putOrder(env, session.id, order);
    }

    // ── Course entitlements (server-side authority — nothing client-supplied
    //    can create access; this runs ONLY from a signature-verified event) ──
    if (env.DB && order && paymentStatus === "paid") {
      try {
        const email = normalizeEmail(order.email || "");
        const productKeys = (order.items || []).map((i) => i.key);
        await env.DB.prepare(
          `INSERT INTO stripe_payments (id, session_id, order_id, email_normalized, product_keys, amount_total, currency, payment_status, payment_intent, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(session_id) DO UPDATE SET payment_status=excluded.payment_status, updated_at=excluded.updated_at`
        )
          .bind(uuid(), session.id, order.orderId, email, JSON.stringify(productKeys), session.amount_total ?? 0, session.currency ?? "usd", "paid",
            typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
            now(), now())
          .run();
        // keep a Stripe customer mapping for admin inspection
        if (session.customer && typeof session.customer === "string" && email) {
          await env.DB.prepare(
            `INSERT INTO stripe_customers (id, email_normalized, stripe_customer_id, created_at) VALUES (?,?,?,?)
             ON CONFLICT(stripe_customer_id) DO UPDATE SET email_normalized=excluded.email_normalized`
          ).bind(uuid(), email, session.customer, now()).run();
        }
        if (productKeys.includes(FD_PRODUCT)) {
          await grantFromStripe(env, {
            email,
            product: FD_PRODUCT,
            sessionId: session.id,
            orderId: order.orderId,
            customerId: typeof session.customer === "string" ? session.customer : null,
            eventId: event.id,
          });
        }
      } catch (err2) {
        console.error("[fd-entitlement] unexpected error", err2);
        // Do not ack-deduplicate if entitlement writing failed → let Stripe retry.
        return json({ error: "entitlement processing deferred", retry: true }, { status: 500 });
      }
    }
    if (env.DB && order && event.type === "checkout.session.async_payment_failed") {
      try {
        await settleState(env, { email: normalizeEmail(order.email || ""), product: FD_PRODUCT, status: "revoked", reason: "async payment failed" });
      } catch (err2) { console.error("[fd-entitlement] revoke error", err2); }
    }

    // Server-side Meta CAPI Purchase — same event_id as the browser pixel
    // (the Stripe session id), so Meta deduplicates the pair. Guarded by
    // eventSeen above, so Stripe webhook retries can't double-send.
    // Tips use a separate flow and metadata.payment_type === "tip";
    // those are pixel-only for now.
    if (order && paymentStatus === "paid" && session.metadata?.payment_type !== "tip") {
      try {
        await sendCapiPurchase(env, {
          eventId: session.id,
          eventTime: Math.floor(event.created || Date.now() / 1000),
          email: order.email,
          amountTotalCents: order.amountTotal ?? session.amount_total ?? 0,
          currency: order.currency || session.currency || "usd",
          contentIds: order.items.map((i) => i.key),
          contentName: order.items.map((i) => i.name).join(" + ") || "Radio Reach Vault",
          attribution: order.momentum,
        });
      } catch (err) {
        console.error("[Meta CAPI] unexpected error", err);
      }
    }
  }

  // ── Refunds & disputes ──
  if (env.DB && (event.type === "charge.refunded" || event.type === "charge.dispute.created" || event.type === "charge.dispute.closed")) {
    try {
      const charge = event.data.object as Stripe.Charge | Stripe.Dispute;
      const paymentIntentId = (charge as Stripe.Charge).payment_intent || (charge as Stripe.Dispute).payment_intent || null;
      const emailRaw =
        (charge as Stripe.Charge).billing_details?.email || (charge as Stripe.Charge).receipt_email || (charge as Stripe.Dispute).evidence_details?.customer_communication || "";
      let email = normalizeEmail(String(emailRaw || ""));
      if (paymentIntentId) {
        const row = await env.DB.prepare(`SELECT email_normalized FROM stripe_payments WHERE payment_intent = ?`).bind(paymentIntentId).first<{ email_normalized: string }>();
        if (row?.email_normalized) email = row.email_normalized;
      }
      if (email && (await getEntitlementEmail(env, email))) {
        if (event.type === "charge.refunded") {
          await settleState(env, { email, product: FD_PRODUCT, status: "refunded", reason: `refund ${paymentIntentId || ""}` });
        } else if (event.type === "charge.dispute.created") {
          await settleState(env, { email, product: FD_PRODUCT, status: "disputed", reason: "payment dispute opened" });
        } else if (event.type === "charge.dispute.closed") {
          const dispute = event.data.object as Stripe.Dispute;
          if (dispute.status === "won") {
            await settleState(env, { email, product: FD_PRODUCT, status: "active", reason: "dispute won — access restored" });
          } else {
            await settleState(env, { email, product: FD_PRODUCT, status: "refunded", reason: "dispute lost" });
          }
        }
      }
    } catch (err3) {
      console.error("[fd-entitlement] charge event error", err3);
    }
  }

  await markEventSeen(env, event.id);
  if (env.DB) {
    try {
      await env.DB.prepare(`INSERT OR IGNORE INTO webhook_events (id, type, created_at) VALUES (?, ?, ?)`).bind(event.id, event.type, now()).run();
    } catch { /* best-effort durable marker */ }
  }
  return json({ ok: true });
};

async function getEntitlementEmail(env: Env, email: string): Promise<boolean> {
  try {
    const row = await env.DB!.prepare(`SELECT id FROM entitlements WHERE email_normalized = ? AND product_key = ?`).bind(email, FD_PRODUCT).first();
    return Boolean(row);
  } catch {
    return false;
  }
}
