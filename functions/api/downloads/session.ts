import { json } from "../../_lib/json";
import { getOrder, putOrder } from "../../_lib/orders";
import { createPrivateDownloadUrl } from "../../_lib/r2";
import { verifyToken } from "../../_lib/token";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json().catch(() => ({})) as { token?: string };
  if (!body.token) return json({ error: "Missing fulfillment token" }, { status: 400 });

  const payload = await verifyToken(env.APP_SECRET || env.STRIPE_WEBHOOK_SECRET, body.token);
  if (!payload || !payload.sessionId || (payload.exp as number) < Date.now()) {
    return json({ error: "Invalid or expired fulfillment token" }, { status: 401 });
  }

  const sessionId = payload.sessionId as string;
  const order = await getOrder(env, sessionId);
  if (!order) return json({ error: "Order not found. Payment may not be verified yet." }, { status: 404 });
  if (order.paymentStatus !== "paid") return json({ error: "Payment incomplete." }, { status: 403 });

  const items = [];
  const errors = [];
  const DOWNLOAD_LINK_LIFETIME = 60 * 60 * 24 * 7; // 7 days

  for (const item of order.items) {
    try {
      const url = await createPrivateDownloadUrl(env, item.bundleKey, DOWNLOAD_LINK_LIFETIME);
      items.push({
        key: item.key,
        name: item.name,
        downloadUrl: url,
        expiresAt: new Date(Date.now() + DOWNLOAD_LINK_LIFETIME * 1000).toISOString(),
      });
    } catch (err: any) {
      errors.push({ name: item.name, error: "File is currently being prepared for download. Please contact support if this persists." });
    }
  }

  // Only mark as completely fulfilled if we generated at least one working link and have no errors.
  // Otherwise, leave it ready/pending so it can be retried.
  if (items.length > 0 && errors.length === 0) {
    order.fulfillmentStatus = "fulfilled";
    order.fulfilledAt = new Date().toISOString();
    await putOrder(env, sessionId, order);
  }

  return json({
    orderId: order.orderId,
    email: order.email,
    items,
    errors: errors.length > 0 ? errors : undefined,
  });
};