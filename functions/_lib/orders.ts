export type OrderRecord = {
  orderId: string;
  sessionId: string;
  paymentStatus: string;
  fulfillmentStatus: "pending" | "ready" | "payment_failed" | "fulfilled";
  email?: string | null;
  customerName?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  bundleId?: string | null;
  utm?: Record<string, string>;
  momentum?: Record<string, string>;
  items: Array<{ key: string; name: string; bundleKey: string; priceId?: string }>;
  createdAt: string;
  fulfilledAt?: string;
};

const ORDER_PREFIX = "order:";
const EVENT_PREFIX = "event:";

export async function getOrder(env: Env, sessionId: string) {
  const raw = await env.ORDER_STORE.get(`${ORDER_PREFIX}${sessionId}`);
  return raw ? (JSON.parse(raw) as OrderRecord) : null;
}

export async function putOrder(env: Env, sessionId: string, order: OrderRecord) {
  await env.ORDER_STORE.put(`${ORDER_PREFIX}${sessionId}`, JSON.stringify(order));
}

export async function eventSeen(env: Env, eventId: string) {
  return Boolean(await env.ORDER_STORE.get(`${EVENT_PREFIX}${eventId}`));
}

export async function markEventSeen(env: Env, eventId: string) {
  await env.ORDER_STORE.put(`${EVENT_PREFIX}${eventId}`, "1", { expirationTtl: 60 * 60 * 24 * 30 });
}
