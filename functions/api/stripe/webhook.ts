import Stripe from "stripe";
import { json } from "../../_lib/json";
import { getStripe } from "../../_lib/stripe";
import { eventSeen, getOrder, markEventSeen, putOrder, type OrderRecord } from "../../_lib/orders";
import { ALLOWED_PRODUCTS, resolveAllowedPrices, type AllowedProductKey } from "../../_lib/config";
import { sendCapiPurchase } from "../../_lib/metaCapi";

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

  if (await eventSeen(env, event.id)) {
    return json({ ok: true, duplicate: true });
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
        });
      } catch (err) {
        console.error("[Meta CAPI] unexpected error", err);
      }
    }
  }

  await markEventSeen(env, event.id);
  return json({ ok: true });
};