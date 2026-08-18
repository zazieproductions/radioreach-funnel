import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { STORE_COPY } from "../config/storefront";
import { collectMeta, collectUtm, createEmbeddedCheckoutSession } from "../lib/api";
import type { ProductKey } from "../config/storefront";
import { getMomentumAttribution } from "../lib/momentumSequence";

const STRIPE_PUB_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

const isValidKey =
  STRIPE_PUB_KEY.startsWith("pk_test_") ||
  STRIPE_PUB_KEY.startsWith("pk_live_");

const stripePromise = isValidKey
  ? loadStripe(STRIPE_PUB_KEY)
  : null;

export default function EmbeddedStripeCheckout({
  items,
  bundleId,
}: {
  items: ProductKey[];
  bundleId: string;
}) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const checkoutSessionIdRef = useRef("");

  useEffect(() => {
    setError("");
    setIsLoading(true);
  }, [bundleId]);

  const options = useMemo(
    () => ({
      fetchClientSecret: async () => {
        try {
          setError("");
          setIsLoading(true);

          const { clientSecret, checkoutSessionId } =
            await createEmbeddedCheckoutSession({
              items,
              bundleId,
              utm: collectUtm(),
              momentum: getMomentumAttribution(),
              meta: collectMeta(),
            });

          checkoutSessionIdRef.current = checkoutSessionId;
          setIsLoading(false);
          return clientSecret;
        } catch (e) {
          const message =
            e instanceof Error
              ? e.message
              : "Unable to load secure checkout.";

          setError(message);
          setIsLoading(false);
          throw e;
        }
      },
      onComplete: () => {
        const sessionId = checkoutSessionIdRef.current;
        if (sessionId) {
          window.location.assign(
            `${window.location.origin}/#/success?session_id=${encodeURIComponent(sessionId)}`
          );
        }
      },
    }),
    [items, bundleId]
  );

  if (!isValidKey || !stripePromise) {
    return (
      <div className="rounded-xl border border-blood/40 bg-blood/5 p-5 text-sm text-white/70">
        <p className="mb-2 font-bold text-white">
          Checkout Error
        </p>
        <p>Stripe is not configured correctly.</p>
        <p className="mt-2">
          Please add a valid{" "}
          <code>VITE_STRIPE_PUBLISHABLE_KEY</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-panel p-2 sm:p-4" aria-busy={isLoading}>
      {/* The mobile command strip already says "secure Stripe checkout", so
          this header is desktop-only — one less thing between thumb and pay. */}
      <div className="mb-3 hidden rounded-lg border border-white/10 bg-black/30 px-4 py-3 lg:block">
        <p className="font-display text-xl uppercase">
          {STORE_COPY.checkoutTitle}
        </p>
        <p className="text-sm text-white/55">
          {STORE_COPY.checkoutSubtitle}
        </p>
      </div>

      {error && (
        <div
          className="mb-3 rounded-lg border border-blood/40 bg-blood/5 px-4 py-3 text-sm text-white/75"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="relative min-h-[620px] overflow-hidden rounded-lg border border-white/10 bg-white">
        {/* A form-shaped skeleton, not a spinner: the visitor sees where the
            email and card fields will be before Stripe has answered. */}
        {isLoading && (
          <div
            className="absolute inset-0 z-10 space-y-4 bg-white p-4"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Loading secure payment form…</span>
            <div className="h-3 w-24 rounded bg-zinc-200" />
            <div className="h-11 w-full rounded-md bg-zinc-100" />
            <div className="h-3 w-20 rounded bg-zinc-200" />
            <div className="h-11 w-full rounded-md bg-zinc-100" />
            <div className="flex gap-3">
              <div className="h-11 flex-1 rounded-md bg-zinc-100" />
              <div className="h-11 w-24 rounded-md bg-zinc-100" />
            </div>
            <div className="h-12 w-full rounded-md bg-zinc-200" />
            <p className="pt-1 text-center text-[11px] font-medium text-zinc-400">
              Connecting to Stripe…
            </p>
          </div>
        )}

        <EmbeddedCheckoutProvider
          key={bundleId}
          stripe={stripePromise}
          options={options}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
}
