/**
 * Server-side checkout tests for the RadioReach funnel.
 *
 * Covers the Contract Info Guide add-on (contract_guide) and the existing
 * catalog: session creation, allowlist enforcement, duplicate prevention,
 * webhook order records (fulfillment metadata), and verification.
 *
 * Run with:
 *   node --experimental-test-module-mocks --import tsx --test scripts/test-checkout.ts
 */
import { test, mock } from "node:test";
import assert from "node:assert/strict";

/* ── Fake Stripe ────────────────────────────────────────────────────────── */

type CreateArgs = Record<string, unknown>;

const stripeState: {
  lastCreate: CreateArgs | null;
  retrieve: (id: string) => Record<string, unknown> | null;
  webhookEvent: Record<string, unknown> | null;
} = { lastCreate: null, retrieve: () => null, webhookEvent: null };

class FakeStripe {
  key: string;
  constructor(key: string) {
    this.key = key;
  }
  get checkout() {
    return {
      sessions: {
        create: async (args: CreateArgs) => {
          stripeState.lastCreate = args;
          return { id: "cs_test_fake123", client_secret: "cs_test_fake123|secret" };
        },
        retrieve: async (id: string) => {
          const session = stripeState.retrieve(id);
          if (!session) throw new Error(`No such checkout session: ${id}`);
          return session as never;
        },
      },
    };
  }
  get webhooks() {
    return {
      constructEventAsync: async () => {
        if (!stripeState.webhookEvent) throw new Error("No event primed");
        return stripeState.webhookEvent as never;
      },
    };
  }
}

mock.module("stripe", { defaultExport: FakeStripe });

/* ── Fake KV namespace (ORDER_STORE) ────────────────────────────────────── */

class FakeKV {
  store = new Map<string, string>();
  putCalls: string[] = [];
  async get(key: string) {
    return this.store.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.putCalls.push(key);
    this.store.set(key, value);
  }
  async delete(key: string) {
    this.store.delete(key);
  }
}

/* ── Env fixtures ───────────────────────────────────────────────────────── */

// The contract guide fixture uses the real live price ID so the test pins
// the exact Stripe Price the server must send for `contract_guide`.
const CONTRACT_GUIDE_PRICE = "price_1U7Iph3IYVlqS8V7hVqL70AH";

function makeEnv(overrides: Record<string, string | undefined> = {}, kv = new FakeKV()) {
  return {
    STRIPE_SECRET_KEY: "sk_test_fake",
    STRIPE_WEBHOOK_SECRET: "whsec_fake",
    STRIPE_PRICE_VAULT_CORE: "price_vault_core",
    STRIPE_PRICE_CONTRACT_BUNDLE: "price_contract_bundle",
    STRIPE_PRICE_AUSTRALIA_ADDON: "price_australia_addon",
    STRIPE_PRICE_AIRPLAY_ACCELERATOR: "price_airplay_accelerator",
    STRIPE_PRICE_UPWORK_COURSE: "price_upwork_course",
    STRIPE_PRICE_CONTRACT_GUIDE: CONTRACT_GUIDE_PRICE,
    STRIPE_PRICE_FONT_VAULT: "price_font_vault",
    STRIPE_PUBLISHABLE_KEY: "pk_test_fake",
    PUBLIC_APP_URL: "http://localhost:8788",
    R2_ACCOUNT_ID: "acct",
    R2_ACCESS_KEY_ID: "ak",
    R2_SECRET_ACCESS_KEY: "sk",
    R2_BUCKET_NAME: "radioreach-downloads",
    ORDER_STORE: kv as unknown as import("../functions/_lib/types").Env["ORDER_STORE"],
    APP_SECRET: "test-app-secret",
    ...overrides,
  } as unknown as import("../functions/_lib/types").Env & { ORDER_STORE: FakeKV };
}

const SESSION_URL = "http://localhost:8788/api/checkout/session";

async function postSession(env: ReturnType<typeof makeEnv>, body: unknown) {
  const { onRequestPost } = await import("../functions/api/checkout/session");
  const request = new Request(SESSION_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const response = await onRequestPost({
    request,
    env: env as never,
    ctx: { waitUntil: () => {} },
    next: async () => new Response("nope"),
  } as never);
  return { response, data: (await response.json()) as Record<string, unknown> };
}

/* ── Session creation ───────────────────────────────────────────────────── */

test("main product without the add-on creates a session with only the vault", async () => {
  const kv = new FakeKV();
  const env = makeEnv({}, kv);
  stripeState.lastCreate = null;

  const { response, data } = await postSession(env, { items: ["vault_core"] });

  assert.equal(response.status, 200);
  assert.equal(data.clientSecret, "cs_test_fake123|secret");
  assert.equal(data.checkoutSessionId, "cs_test_fake123");

  const create = stripeState.lastCreate as CreateArgs;
  assert.equal(create.mode, "payment");
  assert.deepEqual(create.line_items, [{ price: "price_vault_core", quantity: 1 }]);
  assert.equal(create.metadata?.product_keys, "vault_core");
  assert.equal(create.metadata?.bundle_id, "vault_core");
  assert.equal(create.payment_intent_data?.metadata?.product_keys, "vault_core");
  assert.match(String(create.return_url), /#\/success\?session_id=\{CHECKOUT_SESSION_ID\}$/);
  assert.equal(create.invoice_creation?.enabled, true);
});

test("main product with the contract guide adds exactly one $10 line item", async () => {
  const kv = new FakeKV();
  const env = makeEnv({}, kv);
  stripeState.lastCreate = null;

  const { response, data } = await postSession(env, {
    items: ["vault_core", "contract_guide"],
  });

  assert.equal(response.status, 200);
  assert.equal(data.clientSecret, "cs_test_fake123|secret");

  const create = stripeState.lastCreate as CreateArgs;
  assert.deepEqual(create.line_items, [
    { price: "price_vault_core", quantity: 1 },
    { price: CONTRACT_GUIDE_PRICE, quantity: 1 },
  ]);
  // Fulfillment / success-page metadata carried on both the session and the
  // PaymentIntent so the webhook can record the purchased items.
  assert.equal(create.metadata?.product_keys, "vault_core,contract_guide");
  assert.equal(create.metadata?.bundle_id, "vault_core+contract_guide");
  assert.equal(create.payment_intent_data?.metadata?.product_keys, "vault_core,contract_guide");
  assert.equal(create.payment_intent_data?.metadata?.bundle_id, "vault_core+contract_guide");
});

test("all optional add-ons can be combined in one session", async () => {
  const kv = new FakeKV();
  const env = makeEnv({}, kv);
  stripeState.lastCreate = null;

  const { response } = await postSession(env, {
    items: ["vault_core", "contract_bundle", "australia_addon", "contract_guide"],
  });

  assert.equal(response.status, 200);
  const create = stripeState.lastCreate as CreateArgs;
  assert.deepEqual(create.line_items, [
    { price: "price_vault_core", quantity: 1 },
    { price: "price_contract_bundle", quantity: 1 },
    { price: "price_australia_addon", quantity: 1 },
    { price: CONTRACT_GUIDE_PRICE, quantity: 1 },
  ]);
  assert.equal(create.metadata?.product_keys, "vault_core,contract_bundle,australia_addon,contract_guide");
});

/* ── Allowlist enforcement ──────────────────────────────────────────────── */

test("unapproved product keys are rejected", async () => {
  const env = makeEnv();
  stripeState.lastCreate = null;
  for (const key of ["font_vault", "not_a_product", "VAULT_CORE"]) {
    const { response, data } = await postSession(env, { items: ["vault_core", key] });
    assert.equal(response.status, 400, `expected 400 for ${key}`);
    assert.match(String(data.error), /Invalid or unconfigured product key/);
  }
  assert.equal(stripeState.lastCreate, null, "no session must be created for rejected keys");
});

test("arbitrary Stripe price IDs from the browser are never used", async () => {
  const env = makeEnv();
  stripeState.lastCreate = null;
  // A client that tries to send price IDs directly (as array entries or as
  // objects) must be rejected — the server only maps internal product keys.
  for (const body of [
    { items: [CONTRACT_GUIDE_PRICE] },
    { items: ["vault_core", "price_evil123"] },
    { items: [{ price: "price_evil123", quantity: 1 }] },
    { items: CONTRACT_GUIDE_PRICE },
  ]) {
    const { response, data } = await postSession(env, body);
    assert.equal(response.status, 400, `expected 400 for ${JSON.stringify(body)}`);
    assert.ok(data.error, `expected an error for ${JSON.stringify(body)}`);
  }
  assert.equal(stripeState.lastCreate, null, "no session may be created from client price IDs");
});

test("duplicate keys can never add a second copy of the guide", async () => {
  const env = makeEnv();
  stripeState.lastCreate = null;

  const { response } = await postSession(env, {
    items: ["vault_core", "contract_guide", "contract_guide", "contract_guide"],
  });

  assert.equal(response.status, 200);
  const create = stripeState.lastCreate as CreateArgs;
  const guideLines = (create.line_items as { price: string }[]).filter(
    (line) => line.price === CONTRACT_GUIDE_PRICE
  );
  assert.equal(guideLines.length, 1, "exactly one copy of the contract guide");
  assert.equal((guideLines[0] as { quantity: number }).quantity, 1);
  assert.equal(create.metadata?.product_keys, "vault_core,contract_guide");
});

test("a product whose price env var is unset is rejected", async () => {
  const env = makeEnv({ STRIPE_PRICE_CONTRACT_GUIDE: "" });
  const { response, data } = await postSession(env, { items: ["contract_guide"] });
  assert.equal(response.status, 400);
  assert.match(String(data.error), /Invalid or unconfigured product key/);
});

test("empty or malformed selections are rejected", async () => {
  const env = makeEnv();
  for (const body of [{}, { items: [] }, { items: [42] }, { items: [null] }]) {
    const { response } = await postSession(env, body);
    assert.equal(response.status, 400, `expected 400 for ${JSON.stringify(body)}`);
  }
});

/* ── Webhook: order records drive fulfillment ───────────────────────────── */

function completedEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: `evt_${Math.random().toString(36).slice(2)}`,
    type: "checkout.session.completed",
    created: 1700000000,
    data: {
      object: {
        id: "cs_test_fake123",
        payment_status: "paid",
        status: "complete",
        amount_total: 3000,
        currency: "usd",
        customer_details: { email: "buyer@example.com", name: "Test Buyer" },
        metadata: {
          bundle_id: "vault_core+contract_guide",
          product_keys: "vault_core,contract_guide",
          utm_source: "",
          utm_medium: "",
          utm_campaign: "",
          utm_term: "",
          utm_content: "",
          sequence_variant: "control",
          sequence_status: "not_seen",
          sequence_steps: "0",
          sequence_target: "",
          sequence_frustration: "",
          sequence_done_with: "",
        },
        ...overrides,
      },
    },
  };
}

async function postWebhook(env: ReturnType<typeof makeEnv>) {
  const { onRequestPost } = await import("../functions/api/stripe/webhook");
  const request = new Request("http://localhost:8788/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": "t=1,v1=fake" },
    body: "{}",
  });
  const response = await onRequestPost({
    request,
    env: env as never,
    ctx: { waitUntil: () => {} },
    next: async () => new Response("nope"),
  } as never);
  return { response, data: (await response.json()) as Record<string, unknown> };
}

test("webhook records the contract guide with its R2 bundle key for fulfillment", async () => {
  const kv = new FakeKV();
  const env = makeEnv({}, kv);
  stripeState.webhookEvent = completedEvent();

  const { response, data } = await postWebhook(env);
  assert.equal(response.status, 200);
  assert.equal(data.ok, true);

  const raw = kv.store.get("order:cs_test_fake123");
  assert.ok(raw, "order record persisted");
  const order = JSON.parse(raw!) as {
    paymentStatus: string;
    fulfillmentStatus: string;
    email: string | null;
    amountTotal: number;
    currency: string;
    bundleId: string | null;
    items: Array<{ key: string; name: string; bundleKey: string; priceId?: string }>;
  };

  assert.equal(order.paymentStatus, "paid");
  assert.equal(order.fulfillmentStatus, "ready");
  assert.equal(order.email, "buyer@example.com");
  assert.equal(order.amountTotal, 3000);
  assert.equal(order.currency, "usd");
  assert.equal(order.bundleId, "vault_core+contract_guide");
  assert.equal(order.items.length, 2);

  const guide = order.items.find((i) => i.key === "contract_guide");
  assert.ok(guide, "guide recorded in the order");
  assert.equal(guide.name, "RadioReach Indie Artist Contract Info Guide (PDF)");
  assert.equal(
    guide.bundleKey,
    "products/contract-guide/radioreach-indie-artist-contract-info-guide.pdf"
  );
  assert.equal(guide.priceId, CONTRACT_GUIDE_PRICE);

  const vault = order.items.find((i) => i.key === "vault_core");
  assert.equal(vault?.bundleKey, "vault/radio-reach-vault.zip");
});

test("webhook deduplicates retried events", async () => {
  const kv = new FakeKV();
  const env = makeEnv({}, kv);
  stripeState.webhookEvent = completedEvent();

  const first = await postWebhook(env);
  assert.equal(first.data.ok, true);
  assert.notEqual(first.data.duplicate, true);
  const putsBefore = kv.putCalls.length;

  const second = await postWebhook(env);
  assert.equal(second.data.ok, true);
  assert.equal(second.data.duplicate, true);
  assert.equal(kv.putCalls.length, putsBefore, "no order re-write on duplicate event");
});

test("async payment failure marks the order payment_failed", async () => {
  const kv = new FakeKV();
  const env = makeEnv({}, kv);

  // Seed a paid order first.
  stripeState.webhookEvent = completedEvent();
  await postWebhook(env);

  stripeState.webhookEvent = completedEvent({ payment_status: "unpaid" });
  (stripeState.webhookEvent as { type: string }).type = "checkout.session.async_payment_failed";
  const { response, data } = await postWebhook(env);
  assert.equal(response.status, 200);
  assert.equal(data.ok, true);

  const order = JSON.parse(kv.store.get("order:cs_test_fake123")!) as {
    fulfillmentStatus: string;
  };
  assert.equal(order.fulfillmentStatus, "payment_failed");
});

/* ── Verify: success page metadata ──────────────────────────────────────── */

test("verify returns success-page metadata including the contract guide", async () => {
  const kv = new FakeKV();
  const env = makeEnv({}, kv);

  // Persist an order like the webhook would.
  stripeState.webhookEvent = completedEvent();
  await postWebhook(env);

  stripeState.retrieve = (id) =>
    id === "cs_test_fake123"
      ? {
          id,
          payment_status: "paid",
          status: "complete",
          amount_total: 3000,
          currency: "usd",
          customer_details: { email: "buyer@example.com" },
        }
      : null;

  const { onRequestGet } = await import("../functions/api/checkout/verify");
  const request = new Request(
    "http://localhost:8788/api/checkout/verify?session_id=cs_test_fake123"
  );
  const response = await onRequestGet({
    request,
    env: env as never,
    ctx: { waitUntil: () => {} },
    next: async () => new Response("nope"),
  } as never);
  const data = (await response.json()) as {
    verified: boolean;
    token?: string | null;
    order?: { productKeys: string[]; productNames: string[]; amountTotal: number; currency: string };
  };

  assert.equal(response.status, 200);
  assert.equal(data.verified, true);
  assert.ok(data.token, "fulfillment token issued");
  assert.deepEqual(data.order?.productKeys, ["vault_core", "contract_guide"]);
  assert.ok(
    data.order?.productNames.includes("RadioReach Indie Artist Contract Info Guide (PDF)")
  );
  assert.equal(data.order?.amountTotal, 3000);
  assert.equal(data.order?.currency, "USD");
});

test("verify rejects unknown sessions", async () => {
  const env = makeEnv();
  const { onRequestGet } = await import("../functions/api/checkout/verify");
  const request = new Request(
    "http://localhost:8788/api/checkout/verify?session_id=cs_test_missing"
  );
  let status = 0;
  let message = "";
  try {
    await onRequestGet({
      request,
      env: env as never,
      ctx: { waitUntil: () => {} },
      next: async () => new Response("nope"),
    } as never);
  } catch (error) {
    status = 500;
    message = error instanceof Error ? error.message : String(error);
  }
  assert.equal(status, 500, "missing Stripe session must not verify");
  assert.match(message, /No such checkout session/);
});
