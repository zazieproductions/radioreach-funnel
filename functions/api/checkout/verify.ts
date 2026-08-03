import { json } from "../../_lib/json";
import { getStripe } from "../../_lib/stripe";
import { getOrder } from "../../_lib/orders";
import { signToken } from "../../_lib/token";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) return json({ error: "Missing session_id" }, { status: 400 });

  const stripe = getStripe(env);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const order = await getOrder(env, sessionId);

  let token = null;
  if (order && session.payment_status === "paid") {
    token = await signToken(env.APP_SECRET || env.STRIPE_WEBHOOK_SECRET, { 
      sessionId: session.id, 
      exp: Date.now() + 15 * 60 * 1000 
    });
  }

  return json({
    sessionId: session.id,
    paymentStatus: session.payment_status,
    status: session.status,
    verified: Boolean(order && session.payment_status === "paid"),
    token,
  });
};