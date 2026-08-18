import { json } from "../../_lib/json";
import { resolveAllowedPrices, type AllowedProductKey } from "../../_lib/config";
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
      items?: AllowedProductKey[];
      bundleId?: string;
      utm?: Record<string, string>;
      momentum?: MomentumInput;
      wheelCoupon?: string;
    };

    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return json({ error: "No products selected." }, { status: 400 });

    const allowed = resolveAllowedPrices(env);
    const line_items = [];
    for (const key of items) {
      const item = allowed[key as AllowedProductKey];
      if (!item || !item.priceId) {
        return json({ error: `Invalid or unconfigured product key: ${String(key)}` }, { status: 400 });
      }
      line_items.push({ price: item.priceId, quantity: 1 });
    }

    const stripe = getStripe(env);
    const origin = new URL(request.url).origin || env.PUBLIC_APP_URL;
    const momentum = normalizeMomentum(body.momentum);
    const wheelCoupon = String(body.wheelCoupon || "").trim();
    const metadata = {
      bundle_id: body.bundleId || items.join("+"),
      product_keys: items.join(","),
      utm_source: body.utm?.utm_source || "",
      utm_medium: body.utm?.utm_medium || "",
      utm_campaign: body.utm?.utm_campaign || "",
      utm_term: body.utm?.utm_term || "",
      utm_content: body.utm?.utm_content || "",
      wheel_coupon: /^DJ5-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(wheelCoupon) ? wheelCoupon : "",
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