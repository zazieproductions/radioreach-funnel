import { json } from "../../_lib/json";
import { resolveAllowedPrices } from "../../_lib/config";
import { getStripe } from "../../_lib/stripe";

type MomentumInput = Record<string, unknown>;

function normalizeMomentum(input?: MomentumInput) {
  const status = String(input?.sequence_status || "");
  const steps = String(input?.sequence_steps || "0");
  const allowedStatus = new Set(["disabled", "not_seen", "viewed", "started", "completed"]);
  const allowedTargets = new Set(["college", "specialty", "local", "multiple"]);
  const allowedFrustrations = new Set(["no_replies", "wrong_contact", "generic_forms", "other"]);
  const allowedDoneWith = new Set(["forms", "guessing", "waiting", "all_of_it"]);
  const variant = String(input?.sequence_variant || "control");

  return {
    sequence_variant: /^(control|momentum_v[0-9]+)$/.test(variant) ? variant : "control",
    sequence_status: allowedStatus.has(status) ? status : "not_seen",
    sequence_steps: /^[0-3]$/.test(steps) ? steps : "0",
    sequence_target: allowedTargets.has(String(input?.sequence_target || ""))
      ? String(input?.sequence_target)
      : "",
    sequence_frustration: allowedFrustrations.has(String(input?.sequence_frustration || ""))
      ? String(input?.sequence_frustration)
      : "",
    sequence_done_with: allowedDoneWith.has(String(input?.sequence_done_with || ""))
      ? String(input?.sequence_done_with)
      : "",
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = (await request.json()) as {
      items?: unknown[];
      bundleId?: string;
      utm?: Record<string, string>;
      momentum?: MomentumInput;
    };

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!rawItems.length) return json({ error: "No products selected." }, { status: 400 });

    // The browser may only reference approved internal product keys. The
    // server maps each key to its permitted Stripe Price ID — arbitrary
    // price IDs sent from the client are never used.
    const allowed = resolveAllowedPrices(env) as Record<
      string,
      { priceId?: string } | undefined
    >;
    const line_items: { price: string; quantity: 1 }[] = [];
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const raw of rawItems) {
      if (typeof raw !== "string" || !raw) {
        return json({ error: "Invalid product selection." }, { status: 400 });
      }
      const item = allowed[raw];
      if (!item || !item.priceId) {
        return json({ error: `Invalid or unconfigured product key: ${raw}` }, { status: 400 });
      }
      // Each product can be purchased exactly once — ignore duplicate keys
      // so a tampered or buggy client can never add extra copies.
      if (seen.has(raw)) continue;
      seen.add(raw);
      keys.push(raw);
      line_items.push({ price: item.priceId, quantity: 1 });
    }

    const stripe = getStripe(env);
    const origin = new URL(request.url).origin || env.PUBLIC_APP_URL;
    const momentum = normalizeMomentum(body.momentum);
    const metadata = {
      bundle_id: body.bundleId || keys.join("+"),
      product_keys: keys.join(","),
      utm_source: body.utm?.utm_source || "",
      utm_medium: body.utm?.utm_medium || "",
      utm_campaign: body.utm?.utm_campaign || "",
      utm_term: body.utm?.utm_term || "",
      utm_content: body.utm?.utm_content || "",
      ...momentum,
    };
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      line_items,
      return_url: `${origin}/#/success?session_id={CHECKOUT_SESSION_ID}`,
      allow_promotion_codes: false,
      invoice_creation: {
        enabled: true,
      },
      payment_intent_data: { metadata },
      // Session metadata is available directly in the webhook. Mirroring it
      // onto the PaymentIntent also keeps attribution attached in Stripe.
      metadata,
    });

    return json({ clientSecret: session.client_secret, checkoutSessionId: session.id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to start checkout." }, { status: 400 });
  }
};
