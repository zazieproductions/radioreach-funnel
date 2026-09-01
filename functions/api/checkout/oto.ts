import { json } from "../../_lib/json";
import { resolveAllowedPrices } from "../../_lib/config";
import { getStripe } from "../../_lib/stripe";
import { getOrder } from "../../_lib/orders";

/**
 * Post-purchase one-time offer (OTO) sessions.
 *
 * A second embedded Stripe Checkout created ONLY for verified paying
 * customers, keyed to their original (parent) checkout session. The buyer
 * accepts the offer on the delivery page; fulfillment then flows through the
 * exact same verified pipeline as the main order: signed webhook → KV order
 * record → HMAC token → private R2 link.
 *
 * Hard guarantees:
 *  - No parent order in KV, or parent unpaid → 403. The offer literally does
 *    not exist for non-buyers, which is what makes "this page only" true.
 *  - The parent order already contains the item → 409. Never bill twice.
 *  - Only keys in OTO_ITEMS can be sold here; prices always come from the
 *    server-side env allowlist, never the client.
 */
const OTO_ITEMS = new Set(["airplay_accelerator", "frequency_dominion"]);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      parentSessionId?: string;
      item?: string;
    };

    const parentSessionId = typeof body.parentSessionId === "string" ? body.parentSessionId : "";
    const item = typeof body.item === "string" ? body.item : "";

    if (!parentSessionId.startsWith("cs_")) {
      return json({ error: "Invalid parent session." }, { status: 400 });
    }
    if (!OTO_ITEMS.has(item)) {
      return json({ error: "Invalid offer." }, { status: 400 });
    }

    // Buyer-gated: the parent order must exist and be paid.
    const parentOrder = await getOrder(env, parentSessionId);
    if (!parentOrder || parentOrder.paymentStatus !== "paid") {
      return json(
        { error: "This offer is only available after a verified purchase." },
        { status: 403 }
      );
    }
    if (parentOrder.items.some((i) => i.key === item)) {
      return json({ error: "You already own this item." }, { status: 409 });
    }

    const allowed = resolveAllowedPrices(env) as Record<string, { priceId?: string } | undefined>;
    const priceId = allowed[item]?.priceId;
    if (!priceId) {
      return json({ error: "Offer is not configured." }, { status: 400 });
    }

    const stripe = getStripe(env);
    const origin = new URL(request.url).origin || env.PUBLIC_APP_URL;

    // Attribution carries over from the parent order so the OTO purchase is
    // credited to the same campaign in Stripe, KV, and Meta CAPI.
    const metadata = {
      payment_type: "oto",
      parent_session_id: parentSessionId,
      bundle_id: item,
      product_keys: item,
      utm_source: parentOrder.utm?.utm_source || "",
      utm_medium: parentOrder.utm?.utm_medium || "",
      utm_campaign: parentOrder.utm?.utm_campaign || "",
      utm_term: parentOrder.utm?.utm_term || "",
      utm_content: parentOrder.utm?.utm_content || "",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      line_items: [{ price: priceId, quantity: 1 }],
      // Pre-fill the buyer's email — one less field between them and "pay".
      customer_email: parentOrder.email || undefined,
      // Land back on the PARENT delivery page with the OTO session appended,
      // so the new download merges into the screen they already trust.
      return_url: `${origin}/#/success?session_id=${encodeURIComponent(parentSessionId)}&oto_done={CHECKOUT_SESSION_ID}`,
      allow_promotion_codes: false,
      invoice_creation: { enabled: true },
      payment_intent_data: { metadata },
      metadata,
    });

    return json({ clientSecret: session.client_secret, checkoutSessionId: session.id });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unable to start checkout." },
      { status: 400 }
    );
  }
};
