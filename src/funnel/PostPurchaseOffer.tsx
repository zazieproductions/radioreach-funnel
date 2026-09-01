import { useMemo, useState } from "react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PRODUCTS } from "../config/storefront";
import { createOtoCheckoutSession } from "../lib/api";
import { track, trackCustom } from "../lib/metaPixel";

const STRIPE_PUB_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const isValidKey =
  STRIPE_PUB_KEY.startsWith("pk_test_") || STRIPE_PUB_KEY.startsWith("pk_live_");
const stripePromise = isValidKey ? loadStripe(STRIPE_PUB_KEY) : null;

const ACCEL = PRODUCTS.airplay_accelerator;

const DISMISS_PREFIX = "radioreach:oto-dismissed:";

export function wasOtoDismissed(parentSessionId: string) {
  try {
    return localStorage.getItem(`${DISMISS_PREFIX}${parentSessionId}`) === "1";
  } catch {
    return false;
  }
}

export function markOtoDismissed(parentSessionId: string) {
  try {
    localStorage.setItem(`${DISMISS_PREFIX}${parentSessionId}`, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Post-purchase one-time offer for the Airplay Accelerator, shown on the
 * delivery page immediately after the parent order is verified.
 *
 * Honest by construction:
 *  - Downloads are never gated behind it — they render above this card.
 *  - Declining is one click and permanent for the order.
 *  - The server only issues the offer session to verified paying customers
 *    who don't already own the item, so "customers only" is literally true.
 */
export default function PostPurchaseOffer({
  parentSessionId,
  onDecline,
}: {
  parentSessionId: string;
  onDecline: () => void;
}) {
  const [phase, setPhase] = useState<"pitch" | "paying">("pitch");
  const [error, setError] = useState("");

  const options = useMemo(
    () => ({
      fetchClientSecret: async () => {
        const { clientSecret } = await createOtoCheckoutSession({
          parentSessionId,
          item: "airplay_accelerator",
        });
        return clientSecret;
      },
    }),
    [parentSessionId]
  );

  if (!isValidKey || !stripePromise) return null;

  const accept = () => {
    setError("");
    setPhase("paying");
    trackCustom("OtoAcceptClicked", { item: "airplay_accelerator", value: ACCEL.price, currency: "USD" });
    track("InitiateCheckout", {
      value: ACCEL.price,
      currency: "USD",
      content_ids: ["airplay_accelerator"],
      content_type: "product",
      num_items: 1,
    });
  };

  const decline = () => {
    trackCustom("OtoDeclined", { item: "airplay_accelerator" });
    markOtoDismissed(parentSessionId);
    onDecline();
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border-2 border-acid/60 bg-panel">
      <p className="bg-acid px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.18em] text-ink">
        Customers only · this offer appears once, on this page
      </p>

      <div className="p-5 sm:p-7">
        {phase === "pitch" && (
          <>
            <h2 className="font-display text-2xl uppercase leading-tight sm:text-3xl">
              You have the list.{" "}
              <span className="text-blood">Now win the inbox.</span>
            </h2>
            <p className="mt-3 max-w-2xl font-serif text-[15px] leading-relaxed text-white/75 sm:text-base">
              The Vault gets you the right doors. The{" "}
              <b className="text-white">Airplay Accelerator</b> is what you say
              when they open: the pitch scripts, the 6-week campaign calendar,
              the follow-up cadence that doubled replies, plus 4,812 bonus
              curator, blog, and college-radio contacts — and one personal
              pitch review.
            </p>

            <ul className="mt-4 grid gap-2 text-sm text-white/70 sm:grid-cols-2">
              <li className="rounded-lg bg-white/5 p-3">✓ 4,812 bonus curator &amp; blog contacts</li>
              <li className="rounded-lg bg-white/5 p-3">✓ 6-Week Airplay Campaign Calendar</li>
              <li className="rounded-lg bg-white/5 p-3">✓ 11 subject lines + swipe file with open rates</li>
              <li className="rounded-lg bg-white/5 p-3">✓ 3-touch follow-up sequence + 1 personal pitch review</li>
            </ul>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/40">Regular value</p>
                <p className="font-display text-2xl text-white/40 line-through decoration-blood decoration-2">
                  ${ACCEL.compareAt}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-widest text-acid">Customer price · one time</p>
                <p className="font-display text-4xl text-acid">${ACCEL.price}</p>
              </div>
            </div>

            <button
              onClick={accept}
              className="cta mt-5 w-full rounded-lg bg-acid px-5 py-4 font-display text-lg uppercase leading-tight tracking-wide text-ink sm:text-xl"
            >
              Yes — add the Accelerator to my order
              <span className="mt-1 block text-[11px] font-sans font-bold tracking-normal">
                Secure Stripe payment · delivered instantly on this page
              </span>
            </button>
            <button
              onClick={decline}
              className="mt-3 block w-full text-center text-[13px] text-white/45 underline underline-offset-4 hover:text-white/75"
            >
              No thanks — my downloads above are all I need
            </button>
          </>
        )}

        {phase === "paying" && (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-display text-xl uppercase">
                Airplay Accelerator — ${ACCEL.price}
              </p>
              <button
                onClick={() => setPhase("pitch")}
                className="text-[12px] text-white/45 underline underline-offset-4 hover:text-white/75"
              >
                ← Back
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-lg border border-blood/40 bg-blood/5 px-4 py-3 text-sm text-white/75" role="alert">
                {error}
              </div>
            )}

            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
              <div className="min-h-[540px] overflow-hidden rounded-lg border border-white/10 bg-white">
                <EmbeddedCheckout />
              </div>
            </EmbeddedCheckoutProvider>

            <p className="mt-3 text-center text-[11px] text-white/35">
              Payment processed securely by Stripe. Your new download unlocks on this page automatically.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
