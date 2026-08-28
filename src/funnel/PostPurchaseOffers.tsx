import { useEffect, useMemo, useState } from "react";
import EmbeddedStripeCheckout from "./EmbeddedStripeCheckout";
import { PRODUCTS, type ProductKey } from "../config/storefront";
import { trackCustom } from "../lib/metaPixel";

/**
 * POST-PURCHASE OFFER STACK — where ghost inventory goes to live again.
 *
 * The Accelerator ($37) and the Upwork Course ($50) used to sit in an OTO
 * stage machine no paying customer could ever reach: real payment redirects
 * straight to the success page. This component sells them on the ONE page
 * every buyer provably visits, through the exact same embedded-checkout
 * rail — zero server changes.
 *
 * Honesty rules, same as the rest of the store:
 *  - real prices, real descriptions, no countdown, no "was $822".
 *  - offers only what this order does NOT already contain.
 *  - declining is one tap and moves on.
 */

const OFFER_ORDER: ProductKey[] = ["airplay_accelerator", "upwork_course"];

type Offer = {
  key: ProductKey;
  eyebrow: string;
  headline: string;
  body: string;
  bullets: string[];
  cta: string;
};

function offerFor(key: ProductKey): Offer {
  if (key === "airplay_accelerator") {
    return {
      key,
      eyebrow: "For buyers of the Vault",
      headline: "Your next 30 days of outreach, pre-built",
      body: "You now have the contacts. The Airplay Accelerator is the campaign layer that goes on top: who to email first, when to follow up, and the exact pitch lines that get answered. It is the difference between owning a phone book and running a campaign.",
      bullets: [
        "Curator contacts beyond station directories",
        "A day-by-day campaign calendar",
        "Swipe-file pitches and follow-up sequences",
        "A pitch review of your first email",
      ],
      cta: "Add the Accelerator for $37",
    };
  }
  return {
    key: "upwork_course",
    eyebrow: "Fund your music with skills, not advances",
    headline: "Turn proposals into clients on demand",
    body: "Every artist on this page needs money for the next release. Advanced Upwork Proposals is the 4-part, 30-lesson system for landing paid client work in any niche — the same research-first discipline that built the Vault, applied to winning contracts.",
    bullets: [
      "4 parts, 30 lessons, any niche",
      "Proposal frameworks that get replies",
      "Pricing and positioning for independent freelancers",
    ],
    cta: "Add the Full Course for $50",
  };
}

export default function PostPurchaseOffers({ ownedKeys }: { ownedKeys: string[] }) {
  const owned = useMemo(() => new Set(ownedKeys), [ownedKeys]);
  const queue = useMemo(
    () => OFFER_ORDER.filter((k) => !owned.has(k)),
    [owned]
  );
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);

  const current = queue[index];

  useEffect(() => {
    setStarted(false);
  }, [index]);

  useEffect(() => {
    if (!current) return;
    trackCustom("PostPurchaseOfferView", {
      product_key: current,
      value: PRODUCTS[current].price,
      currency: "USD",
      offer_position: index + 1,
      queue_length: queue.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  if (!current) return null;

  const offer = offerFor(current);
  const product = PRODUCTS[current];

  return (
    <section
      aria-label="Upgrade your order"
      className="mobile-solid mt-6 overflow-hidden rounded-[20px] border-2 border-acid/40 bg-panel/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur sm:rounded-[28px]"
    >
      <div className="border-b border-white/10 bg-acid/[0.06] px-5 py-4 sm:px-8">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-acid">
          {offer.eyebrow}
        </p>
        <h2 className="mt-1 font-display text-xl uppercase leading-tight text-white sm:text-3xl">
          {offer.headline}
        </h2>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-white/10 px-5 py-6 sm:px-8 lg:border-b-0 lg:border-r">
          <p className="text-sm leading-6 text-white/75">{offer.body}</p>
          <ul className="mt-4 space-y-2.5">
            {offer.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-white/80">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-acid text-[11px] font-black text-ink">
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[11px] leading-relaxed text-white/40">
            One-time payment. Instant download, same as your order. Covered by the same
            30-day action-based guarantee.
          </p>
        </div>

        <div className="px-5 py-6 sm:px-8">
          {!started ? (
            <div className="flex h-full flex-col justify-center">
              <p className="font-display text-lg uppercase text-white/60">{product.name}</p>
              <p className="mt-2 font-display text-5xl text-acid">
                ${product.price}
                <span className="ml-2 align-middle font-sans text-xs font-bold uppercase tracking-wider text-white/40">
                  one-time
                </span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setStarted(true);
                  trackCustom("PostPurchaseOfferStart", {
                    product_key: current,
                    value: product.price,
                    currency: "USD",
                  });
                }}
                className="cta tap-target mt-5 w-full rounded-lg bg-acid px-5 py-4 font-display text-lg uppercase tracking-wide text-ink"
              >
                {offer.cta}
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => i + 1)}
                className="tap-target mt-3 w-full rounded-lg border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/55 transition hover:border-white/30 hover:text-white/80"
              >
                No thanks — just my downloads
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-acid">
                Add to your order — secure Stripe checkout
              </p>
              <EmbeddedStripeCheckout
                items={[current]}
                bundleId={`postpurchase:${current}`}
              />
              <button
                type="button"
                onClick={() => setStarted(false)}
                className="tap-target mt-3 w-full rounded-lg border border-white/15 px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white/55 transition hover:border-white/30 hover:text-white/80"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
