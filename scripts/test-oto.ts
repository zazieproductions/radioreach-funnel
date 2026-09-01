/**
 * Server-side tests for the post-purchase one-time offer endpoint
 * (/api/checkout/oto).
 *
 * The OTO is the funnel's highest-leverage money path, so every gate is
 * pinned: buyer verification, already-owned rejection, allowlist pricing,
 * attribution carry-over, and the return_url that merges delivery back
 * onto the parent success page.
 *
 * Run with:
 *   node --experimental-test-module-mocks --import tsx --test scripts/test-oto.ts
 */
import { test, mock } from "node:test";
import assert from "node:assert/strict";

/* ── Fake Stripe ────────────────────────────────────────────────────────── */

type CreateArgs = Record<string, unknown>;

const stripeState: { lastCreate: CreateArgs | null } = { lastCreate: null };

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
          return { id: "cs_test_oto456", client_secret: "cs_test_oto456|secret" };
        },
      },
    };
  }
}

mock.module("stripe", { defaultExport: FakeStripe });

/* ── Fake KV (ORDER_STORE) ──────────────────────────────────────────────── */

class FakeKV {
  store = new Map<string, string>();
  async get(key: string) {
    return this.store.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.store.set(key, value);
  }
  async delete(key: string) {
    this.store.delete(key);
  }
}

function makeEnv(kv = new FakeKV()) {
  return {
    env: {
      STRIPE_SECRET_KEY: "sk_test_fake",
      STRIPE_WEBHOOK_SECRET: "whsec_fake",
      STRIPE_PRICE_VAULT_CORE: "price_vault_core",
      STRIPE_PRICE_CONTRACT_BUNDLE: "price_contract_bundle",
      STRIPE_PRICE_AUSTRALIA_ADDON: "price_australia_addon",
      STRIPE_PRICE_AIRPLAY_ACCELERATOR: "price_airplay_accelerator",
      STRIPE_PRICE_UPWORK_COURSE: "price_upwork_course",
      STRIPE_PRICE_CONTRACT_GUIDE: "price_contract_guide",
      STRIPE_PRICE_FREQUENCY_DOMINION: "price_frequency_dominion",
      STRIPE_PRICE_FONT_VAULT: "price_font_vault",
      STRIPE_PUBLISHABLE_KEY: "pk_test_fake",
      PUBLIC_APP_URL: "http://localhost:8788",
      R2_ACCOUNT_ID: "acct",
      R2_ACCESS_KEY_ID: "ak",
      R2_SECRET_ACCESS_KEY: "sk",
      R2_BUCKET_NAME: "radioreach-downloads",
      ORDER_STORE: kv as unknown as import("../functions/_lib/types").Env["ORDER_STORE"],
      APP_SECRET: "test-app-secret",
    } as unknown as import("../functions/_lib/types").Env,
    kv,
  };
}

const PARENT = "cs_test_parent123";

function paidParentOrder(overrides: Record<string, unknown> = {}) {
  return {
    orderId: "order-1",
    sessionId: PARENT,
    paymentStatus: "paid",
    fulfillmentStatus: "fulfilled",
    email: "artist@example.com",
    amountTotal: 2500,
    currency: "usd",
    utm: {
      utm_source: "meta",
      utm_medium: "paid_social",
      utm_campaign: "vault_launch",
      utm_term: "",
      utm_content: "",
    },
    items: [{ key: "vault_core", name: "Radio Reach Vault", bundleKey: "vault/radio-reach-vault.zip" }],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

async function postOto(env: ReturnType<typeof makeEnv>["env"], body: unknown) {
  const { onRequestPost } = await import("../functions/api/checkout/oto");
  const request = new Request("http://localhost:8788/api/checkout/oto", {
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

/* ── Tests ──────────────────────────────────────────────────────────────── */

test("a verified paid buyer can open an accelerator OTO session", async () => {
  const { env, kv } = makeEnv();
  await kv.put(`order:${PARENT}`, JSON.stringify(paidParentOrder()));
  stripeState.lastCreate = null;

  const { response, data } = await postOto(env, {
    parentSessionId: PARENT,
    item: "airplay_accelerator",
  });

  assert.equal(response.status, 200);
  assert.equal(data.clientSecret, "cs_test_oto456|secret");

  const create = stripeState.lastCreate as CreateArgs;
  assert.equal(create.mode, "payment");
  assert.equal(create.ui_mode, "embedded_page");
  assert.deepEqual(create.line_items, [{ price: "price_airplay_accelerator", quantity: 1 }]);
  // Email pre-filled from the parent order.
  assert.equal(create.customer_email, "artist@example.com");
  // Returns to the PARENT delivery page with the OTO session appended.
  assert.match(
    String(create.return_url),
    /#\/success\?session_id=cs_test_parent123&oto_done=\{CHECKOUT_SESSION_ID\}$/
  );
  // Attribution carried over from the parent order.
  const meta = create.metadata as Record<string, string>;
  assert.equal(meta.payment_type, "oto");
  assert.equal(meta.parent_session_id, PARENT);
  assert.equal(meta.product_keys, "airplay_accelerator");
  assert.equal(meta.utm_source, "meta");
  assert.equal(meta.utm_campaign, "vault_launch");
});

test("no parent order in KV → 403, no session created", async () => {
  const { env } = makeEnv();
  stripeState.lastCreate = null;

  const { response } = await postOto(env, {
    parentSessionId: "cs_test_ghost",
    item: "airplay_accelerator",
  });

  assert.equal(response.status, 403);
  assert.equal(stripeState.lastCreate, null);
});

test("unpaid parent order → 403", async () => {
  const { env, kv } = makeEnv();
  await kv.put(`order:${PARENT}`, JSON.stringify(paidParentOrder({ paymentStatus: "unpaid" })));
  stripeState.lastCreate = null;

  const { response } = await postOto(env, {
    parentSessionId: PARENT,
    item: "airplay_accelerator",
  });

  assert.equal(response.status, 403);
  assert.equal(stripeState.lastCreate, null);
});

test("buyer who already owns the item → 409, never billed twice", async () => {
  const { env, kv } = makeEnv();
  await kv.put(
    `order:${PARENT}`,
    JSON.stringify(
      paidParentOrder({
        items: [
          { key: "vault_core", name: "Radio Reach Vault", bundleKey: "vault/radio-reach-vault.zip" },
          { key: "airplay_accelerator", name: "Airplay Accelerator", bundleKey: "upsells/airplay-accelerator.zip" },
        ],
      })
    )
  );
  stripeState.lastCreate = null;

  const { response } = await postOto(env, {
    parentSessionId: PARENT,
    item: "airplay_accelerator",
  });

  assert.equal(response.status, 409);
  assert.equal(stripeState.lastCreate, null);
});

test("items outside the OTO allowlist are rejected", async () => {
  const { env, kv } = makeEnv();
  await kv.put(`order:${PARENT}`, JSON.stringify(paidParentOrder()));
  stripeState.lastCreate = null;

  for (const item of ["vault_core", "upwork_course", "font_vault", "price_evil", ""]) {
    const { response } = await postOto(env, { parentSessionId: PARENT, item });
    assert.equal(response.status, 400, `expected 400 for ${JSON.stringify(item)}`);
  }
  assert.equal(stripeState.lastCreate, null);
});

test("malformed parent session ids are rejected before any KV read", async () => {
  const { env } = makeEnv();
  stripeState.lastCreate = null;

  for (const parentSessionId of ["", "not-a-session", "order:cs_x", 42, null]) {
    const { response } = await postOto(env, {
      parentSessionId,
      item: "airplay_accelerator",
    });
    assert.equal(response.status, 400, `expected 400 for ${JSON.stringify(parentSessionId)}`);
  }
  assert.equal(stripeState.lastCreate, null);
});

test("frequency dominion is offerable as an OTO with its allowlisted price", async () => {
  const { env, kv } = makeEnv();
  await kv.put(`order:${PARENT}`, JSON.stringify(paidParentOrder()));
  stripeState.lastCreate = null;

  const { response } = await postOto(env, {
    parentSessionId: PARENT,
    item: "frequency_dominion",
  });

  assert.equal(response.status, 200);
  const create = stripeState.lastCreate as CreateArgs;
  assert.deepEqual(create.line_items, [{ price: "price_frequency_dominion", quantity: 1 }]);
});
