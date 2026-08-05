import { json } from "../../_lib/json";
import { resolveAllowedPrices, type AllowedProductKey } from "../../_lib/config";
import { getStripe } from "../../_lib/stripe";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = (await request.json()) as {
      items?: AllowedProductKey[];
      bundleId?: string;
      utm?: Record<string, string>;
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
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      line_items,
      return_url: `${origin}/#/success?session_id={CHECKOUT_SESSION_ID}`,
      allow_promotion_codes: false,
      payment_intent_data: {
        metadata: {
          bundle_id: body.bundleId || items.join("+"),
          product_keys: items.join(","),
          utm_source: body.utm?.utm_source || "",
          utm_medium: body.utm?.utm_medium || "",
          utm_campaign: body.utm?.utm_campaign || "",
          utm_term: body.utm?.utm_term || "",
          utm_content: body.utm?.utm_content || "",
        },
      },
      metadata: {
        bundle_id: body.bundleId || items.join("+"),
        product_keys: items.join(","),
      },
    });

    return json({ clientSecret: session.client_secret, checkoutSessionId: session.id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to start checkout." }, { status: 400 });
  }
};