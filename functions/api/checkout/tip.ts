import { json } from "../../_lib/json";
import { getStripe } from "../../_lib/stripe";

const ALLOWED_TIPS = new Set([300, 500, 1000, 2000]);

// Tips may only redirect back to the buyer's verified success page (keeps
// download links one click away) or the site root. Nothing off-origin.
const RETURN_TO_PATTERN = /^\/#\/success\?session_id=cs_[A-Za-z0-9_]+$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      amount?: number;
      returnTo?: string;
    };

    const amount = Number(body.amount);

    if (!ALLOWED_TIPS.has(amount)) {
      return json(
        { error: "Invalid tip amount." },
        { status: 400 }
      );
    }

    const returnTo =
      typeof body.returnTo === "string" && RETURN_TO_PATTERN.test(body.returnTo)
        ? body.returnTo
        : null;

    const stripe = getStripe(env);
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: "RadioReach Tip",
              description: "Optional support for RadioReach",
            },
          },
          quantity: 1,
        },
      ],
      success_url: returnTo
        ? `${origin}${returnTo}&tip=thanks&tip_amount=${amount}&tip_session={CHECKOUT_SESSION_ID}`
        : `${origin}/?tip=thanks&tip_amount=${amount}&tip_session={CHECKOUT_SESSION_ID}`,
      cancel_url: returnTo ? `${origin}${returnTo}` : `${origin}/`,
      metadata: {
        payment_type: "tip",
      },
    });

    return json({ url: session.url });
  } catch (error) {
    console.error("[Tip Checkout Error]", error);

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start tip checkout.",
      },
      { status: 500 }
    );
  }
};
