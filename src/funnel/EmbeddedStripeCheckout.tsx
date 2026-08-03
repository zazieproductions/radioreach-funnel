import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMemo, useState } from "react";
import { STORE_COPY } from "../config/storefront";
import { collectUtm, createEmbeddedCheckoutSession } from "../lib/api";
import type { ProductKey } from "../config/storefront";

const STRIPE_PUB_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const isValidKey = STRIPE_PUB_KEY.startsWith("pk_test_") || STRIPE_PUB_KEY.startsWith("pk_live_");

// Load Stripe once, outside of the React component tree.
// We only invoke loadStripe if the key has a valid prefix format.
const stripePromise = isValidKey ? loadStripe(STRIPE_PUB_KEY) : null;

export default function EmbeddedStripeCheckout({
  items,
  bundleId,
}: {
  items: ProductKey[];
  bundleId: string;
}) {
  const [error, setError] = useState("");

  const options = useMemo(
    () => ({
      fetchClientSecret: async () => {
        try {
          setError("");
          const { clientSecret } = await createEmbeddedCheckoutSession({
            items,
            bundleId,
            utm: collectUtm(),
          });
          return clientSecret;
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unable to load secure checkout.";
          setError(message);
          throw e;
        }
      },
    }),
    [items, bundleId]
  );

  if (!isValidKey || !stripePromise) {
    return (
      <div className="rounded-xl border border-blood/40 bg-blood/5 p-5 text-sm text-white/70">
        <p className="font-bold text-white mb-2">Checkout Error</p>
        <p>Stripe is not configured correctly.</p>
        <p className="mt-2">
          Please add a valid <code>VITE_STRIPE_PUBLISHABLE_KEY</code> (starting with <code>pk_test_</code> or <code>pk_live_</code>) to your environment variables or <code>.env.local</code> file.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-panel p-3 sm:p-4">
      <div className="mb-3 rounded-lg border border-white/10 bg-black/30 px-4 py-3">
        <p className="font-display text-xl uppercase">{STORE_COPY.checkoutTitle}</p>
        <p className="text-sm text-white/55">{STORE_COPY.checkoutSubtitle}</p>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-blood/40 bg-blood/5 px-4 py-3 text-sm text-white/75" role="alert">
          {error}
        </div>
      )}

      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <div className="min-h-[620px] overflow-hidden rounded-lg border border-white/10 bg-white">
          <EmbeddedCheckout />
        </div>
      </EmbeddedCheckoutProvider>
    </div>
  );
}
