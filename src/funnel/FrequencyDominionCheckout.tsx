import { useEffect } from "react";
import EmbeddedStripeCheckout from "./EmbeddedStripeCheckout";
import { PRODUCTS } from "../config/storefront";
import { track, trackCustom } from "../lib/metaPixel";

const FD = PRODUCTS.frequency_dominion;
const FD_ANCHOR = FD.compareAt ?? FD.price;

/** Standalone $97 checkout for the Frequency Dominion backend course.
 *  Reached from the /frequency-dominion/ sales page via /#/fd-checkout.
 *  Only the frequency_dominion key is offered — the server allowlist
 *  resolves the Stripe price, so no browser-supplied value is trusted. */
export default function FrequencyDominionCheckout() {
  const items = ["frequency_dominion" as const];
  const bundleId = "frequency_dominion";

  useEffect(() => {
    trackCustom("FrequencyDominionCheckoutViewed", { value: FD.price, currency: "USD" });
    track("InitiateCheckout", {
      value: FD.price,
      currency: "USD",
      content_ids: items,
      content_type: "product",
      num_items: 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-ink">
      <p className="bg-blood py-2 text-center text-[11px] font-black uppercase tracking-[0.16em]">
        Secure checkout. Payment handled by Stripe inside this page
      </p>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-5 text-center sm:mb-6">
          <p className="font-display text-[1.65rem] leading-[1.1] sm:text-4xl">CLAIM YOUR FREQUENCY</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-white/60">
            Founders' dip pricing. The offer expires the moment the timer hits zero — then it returns to $997.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
            <span>✓ Instant access</span>
            <span>✓ Lifetime updates</span>
            <span>✓ 30-day risk reversal</span>
          </div>
          <p className="mt-3 text-sm">
            <span className="mr-2 text-white/35 line-through">${FD_ANCHOR}</span>
            <b className="text-2xl text-acid">${FD.price.toFixed(2)}</b>
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          {/* left column; order recap */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-white/10 bg-panel p-4 sm:p-6">
              <p className="font-display text-2xl">YOUR ORDER</p>
              <p className="mt-1 text-sm text-white/55">
                One product. One payment. Everything below unlocks instantly after purchase.
              </p>

              <div className="mt-4 rounded-xl border border-acid/40 bg-acid/8 p-3.5 sm:p-4">
                <span className="inline-flex items-center rounded-full border border-acid/40 bg-acid/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-acid">
                  {FD.checkoutBadge}
                </span>
                <span className="mt-3 block font-display text-lg uppercase leading-tight text-white">
                  {FD.checkoutHeadline}
                </span>
                <span className="mt-1 block text-sm font-bold text-white/80">{FD.name}</span>
                <span className="mt-1 block text-sm text-white/65">{FD.description}</span>
                <ul className="mt-3 space-y-1">
                  {FD.includes?.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-[13px] text-white/65">
                      <span className="text-acid">✓</span> {line}
                    </li>
                  ))}
                </ul>
                <span className="mt-3 block text-sm">
                  <span className="mr-2 text-white/35 line-through">${FD_ANCHOR}</span>
                  <b className="text-acid">${FD.price.toFixed(2)}</b>{" "}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    one-time · save ${FD_ANCHOR - FD.price}
                  </span>
                </span>
              </div>
            </section>

            <section className="hidden rounded-xl border border-white/10 bg-panel p-5 lg:block">
              <p className="mb-4 font-display text-xl uppercase">Order summary</p>
              <div className="flex items-start justify-between gap-4 text-[15px]">
                <span className="text-white/75">{FD.name}</span>
                <span className="shrink-0 whitespace-nowrap">
                  <span className="mr-2 text-white/30 line-through">${FD_ANCHOR}</span>
                  <b className="text-acid">${FD.price.toFixed(2)}</b>
                </span>
              </div>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-white/50">
                <span>You save</span>
                <span className="font-bold text-acid">${FD_ANCHOR - FD.price}.00</span>
              </div>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-white/50">
                <span>Tax</span>
                <span className="font-bold text-white/40">$0.00</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="font-display text-xl uppercase">Total</span>
                <span className="font-display text-3xl text-acid">${FD.price.toFixed(2)}</span>
              </div>
            </section>

            <section className="hidden rounded-xl border border-acid/40 bg-acid/5 p-5 text-[13px] leading-relaxed text-white/70 lg:block">
              <p className="font-display text-lg text-acid">WHAT HAPPENS NEXT</p>
              Stripe processes the payment securely inside this page. After payment, your order is verified
              server-side and your private download links unlock from protected storage — the full
              Frequency-Dominion-Upsell package, zipped and ready.
            </section>
          </aside>

          {/* right column; Stripe embedded checkout */}
          <section id="payment" className="space-y-3">
            <div className="rounded-lg border border-acid/25 bg-acid/5 px-4 py-3 text-[12px] leading-relaxed text-white/65">
              <p>
                <b className="text-acid">30-Day Risk Reversal.</b> Run the 21-day campaign — 20 stations, 3
                touches, logged. If you get zero station replies and zero adds, email us your campaign log
                within 30 days for a full refund. <b className="text-white">You keep the bonuses.</b>
              </p>
            </div>
            <EmbeddedStripeCheckout items={items} bundleId={bundleId} />
          </section>
        </div>
      </div>

      <footer className="mt-6 border-t border-white/10 px-4 py-6 text-center text-[11px] leading-relaxed text-white/30">
        <nav aria-label="Site" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <a href="/privacy-policy/" className="underline decoration-white/20 underline-offset-4 hover:text-white/60">
            Privacy policy
          </a>
          <a href="/terms/" className="underline decoration-white/20 underline-offset-4 hover:text-white/60">
            Terms of service
          </a>
          <a href="/refund-policy/" className="underline decoration-white/20 underline-offset-4 hover:text-white/60">
            Refund policy
          </a>
          <a href="/frequency-dominion/" className="underline decoration-white/20 underline-offset-4 hover:text-white/60">
            Back to the offer
          </a>
        </nav>
        <p className="mt-3">© {new Date().getFullYear()} Radio Reach. All rights reserved.</p>
      </footer>
    </div>
  );
}
