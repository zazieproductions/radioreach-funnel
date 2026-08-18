import { useEffect, useMemo, useState } from "react";
import { Stars } from "./ui";
import EmbeddedStripeCheckout from "./EmbeddedStripeCheckout";
import { PRODUCTS } from "../config/storefront";
import { track } from "../lib/metaPixel";
import { getMomentumAttribution } from "../lib/momentumSequence";

export type Addons = { contracts: boolean; au: boolean };

const BASE = PRODUCTS.vault_core.price;
const CONTRACTS_PRICE = PRODUCTS.contract_bundle.price;
const AU_PRICE = PRODUCTS.australia_addon.price;

export default function Checkout() {
  const [contracts, setContracts] = useState(true);
  const [au, setAu] = useState(true);
  const momentumAttribution = useMemo(() => getMomentumAttribution(), []);

  const total =
    BASE + (contracts ? CONTRACTS_PRICE : 0) + (au ? AU_PRICE : 0);
  const saved =
    29 + (contracts ? 16 : 0) + (au ? 17 : 0);

  const items = useMemo(
    () => [
      "vault_core" as const,
      ...(contracts ? (["contract_bundle"] as const) : []),
      ...(au ? (["australia_addon"] as const) : []),
    ],
    [contracts, au]
  );

  const bundleId = useMemo(() => items.join("+"), [items]);

  // InitiateCheckout: fires once when the checkout page mounts, with the
  // initial cart contents. Feeds Meta's optimization between PageView and
  // Purchase.
  useEffect(() => {
    track("InitiateCheckout", {
      value: total,
      currency: "USD",
      content_ids: items,
      content_type: "product",
      num_items: items.length,
      ...momentumAttribution,
    });
    // Intentionally mount-only: cart tweaks shouldn't re-fire the event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-ink pb-12">
      <p className="bg-blood py-2 text-center text-[11px] font-black uppercase tracking-[0.16em]">
        🔒 Secure checkout — payment handled by Stripe
      </p>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-5 text-center sm:mb-7">
          <p className="font-display text-[1.65rem] leading-[1.1] sm:text-4xl">
            ALMOST YOURS — <span className="text-acid">SECURE CHECKOUT</span>
          </p>
          <p className="mt-1.5 text-[13px] text-white/55 sm:text-sm">
            Review your order, pay below, and your download unlocks instantly.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:gap-6">
          {/* left column — order configuration + summary */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-white/10 bg-panel p-4 sm:p-6">
              <p className="font-display text-2xl">YOUR ORDER</p>
              <p className="mt-1 text-sm text-white/55">
                The Vault is included. Optional add-ons are pre-checked — uncheck anything you don't want.
              </p>

              <div className="mt-4 grid gap-3">
                {/* Core — always included, no decision needed */}
                <div className="flex min-h-14 items-start gap-3 rounded-xl border border-acid/40 bg-acid/8 p-3.5 sm:p-4">
                  <span aria-hidden className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-acid text-[13px] font-black text-ink">✓</span>
                  <span className="min-w-0 space-y-1">
                    <span className="block font-display text-lg uppercase leading-tight">{PRODUCTS.vault_core.shortName}</span>
                    <span className="block text-sm leading-snug text-white/65">{PRODUCTS.vault_core.description}</span>
                    <span className="block text-sm">
                      <span className="mr-2 text-white/35 line-through">${PRODUCTS.vault_core.compareAt}</span>
                      <b className="text-acid">${PRODUCTS.vault_core.price.toFixed(2)}</b>
                      <span className="ml-2 rounded bg-acid/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-acid">Included</span>
                    </span>
                  </span>
                </div>

                {/* Contract Kit — optional add-on */}
                <label
                  className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3.5 sm:p-4 ${
                    contracts ? "border-acid/40 bg-acid/8" : "border-white/10 bg-black/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={contracts}
                    onChange={(e) => setContracts(e.target.checked)}
                    className="mt-1 h-6 w-6 shrink-0 accent-yellow-400"
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-display text-lg uppercase leading-none">{PRODUCTS.contract_bundle.shortName}</span>
                      <span className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/45">Optional</span>
                    </span>
                    <span className="block text-sm leading-snug text-white/65">
                      6 agreement templates + a plain-English guide. Protects your splits, masters, and session work.
                    </span>
                    <span className="block text-sm">
                      <span className="mr-2 text-white/35 line-through">${PRODUCTS.contract_bundle.compareAt}</span>
                      <b className="text-acid">${PRODUCTS.contract_bundle.price.toFixed(2)}</b>
                    </span>
                    <span className="block text-[12px] text-white/45">
                      <Stars /> "Saved me from a nightmare split deal." — Jordan Meacham
                    </span>
                  </span>
                </label>

                {/* AU list — optional add-on */}
                <label
                  className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3.5 sm:p-4 ${
                    au ? "border-acid/40 bg-acid/8" : "border-white/10 bg-black/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={au}
                    onChange={(e) => setAu(e.target.checked)}
                    className="mt-1 h-6 w-6 shrink-0 accent-yellow-400"
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-display text-lg uppercase leading-none">{PRODUCTS.australia_addon.shortName}</span>
                      <span className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/45">Optional</span>
                    </span>
                    <span className="block text-sm leading-snug text-white/65">
                      2,847 AU station contacts · 1,612 verified emails · triple j, community, commercial &amp; regional.
                    </span>
                    <span className="block text-sm">
                      <span className="mr-2 text-white/35 line-through">${PRODUCTS.australia_addon.compareAt}</span>
                      <b className="text-acid">${PRODUCTS.australia_addon.price.toFixed(2)}</b>
                    </span>
                    <span className="block text-[12px] text-white/45">
                      <Stars /> "Got Unearthed airplay in 6 weeks from Ohio." — Dee R.
                    </span>
                  </span>
                </label>
              </div>
            </section>

            {/* Mobile order summary — one tap to expand */}
            <details className="group overflow-hidden rounded-xl border border-white/10 bg-panel lg:hidden" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-white/45">Order total</span>
                  <span className="tnum font-display text-2xl text-acid">${total.toFixed(2)}</span>
                </span>
                <span className="text-right text-[11px] font-bold uppercase tracking-wider text-white/55">
                  You save ${saved.toFixed(2)} <span aria-hidden className="ml-1 inline-block transition-transform group-open:rotate-180">⌄</span>
                </span>
              </summary>
              <div className="border-t border-white/10 p-4">
                <OrderSummaryRows contracts={contracts} au={au} saved={saved} total={total} />
              </div>
            </details>

            <a
              href="#payment"
              role="button"
              className="cta tap-target w-full rounded-lg bg-acid px-5 py-3 text-center font-display text-lg uppercase tracking-wide text-ink lg:hidden"
            >
              Continue to secure payment ↓
            </a>

            {/* Desktop order summary */}
            <section className="hidden rounded-xl border border-white/10 bg-panel p-5 lg:block">
              <p className="mb-4 font-display text-xl uppercase">Order summary</p>
              <OrderSummaryRows contracts={contracts} au={au} saved={saved} total={total} />
            </section>

            {/* What happens next — visible on every screen size */}
            <section className="rounded-xl border border-acid/40 bg-acid/5 p-4 text-[13px] leading-relaxed text-white/70 sm:p-5">
              <p className="font-display text-lg text-acid">WHAT HAPPENS NEXT</p>
              <ol className="mt-2.5 space-y-2">
                <li className="flex gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-acid/15 text-[11px] font-black text-acid">1</span>
                  <span><b className="text-white">Pay securely.</b> Stripe encrypts your details — we never see or store your card.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-acid/15 text-[11px] font-black text-acid">2</span>
                  <span><b className="text-white">Instant confirmation.</b> Your receipt is emailed and your private download links appear on screen immediately.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-acid/15 text-[11px] font-black text-acid">3</span>
                  <span><b className="text-white">Download &amp; start.</b> Open the Vault, pick your city, and send your first pitch tonight.</span>
                </li>
              </ol>
              <p className="mt-3 border-t border-white/10 pt-2.5 text-[12px] text-white/50">
                🛡 30-day refund guarantee · One-time payment — no subscription, ever
              </p>
            </section>
          </aside>

          {/* right column — Stripe collects delivery + payment details once */}
          <section id="payment" className="space-y-3">
            <div className="rounded-lg border border-acid/25 bg-acid/5 px-4 py-3 text-center text-[12px] text-white/60 lg:hidden">
              <b className="text-acid">Last step:</b> enter your email and payment details securely with Stripe.
            </div>
            <EmbeddedStripeCheckout items={items} bundleId={bundleId} />
            <p className="text-center text-[11px] leading-relaxed text-white/35">
              🔒 Payments are encrypted and processed by Stripe. By completing this purchase you agree
              to the <a href="/terms/" className="underline hover:text-white/60">terms</a> and{" "}
              <a href="/privacy-policy/" className="underline hover:text-white/60">privacy policy</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function OrderSummaryRows({
  contracts,
  au,
  saved,
  total,
}: {
  contracts: boolean;
  au: boolean;
  saved: number;
  total: number;
}) {
  return (
    <div className="space-y-3 text-[15px]">
      <SummaryRow
        label={PRODUCTS.vault_core.name}
        was={`$${PRODUCTS.vault_core.compareAt}`}
        now={`$${PRODUCTS.vault_core.price.toFixed(2)}`}
      />
      {contracts && (
        <SummaryRow
          label={PRODUCTS.contract_bundle.shortName}
          was={`$${PRODUCTS.contract_bundle.compareAt}`}
          now={`$${PRODUCTS.contract_bundle.price.toFixed(2)}`}
        />
      )}
      {au && (
        <SummaryRow
          label={PRODUCTS.australia_addon.shortName}
          was={`$${PRODUCTS.australia_addon.compareAt}`}
          now={`$${PRODUCTS.australia_addon.price.toFixed(2)}`}
        />
      )}
      <div className="flex justify-between border-t border-white/10 pt-3 text-white/50">
        <span>You save</span>
        <span className="font-bold text-acid">${saved.toFixed(2)}</span>
      </div>
      <div className="flex justify-between border-t border-white/10 pt-3 text-white/50">
        <span>Tax</span>
        <span className="font-bold text-white/40">$0.00</span>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <span className="font-display text-xl uppercase">Total</span>
        <span className="tnum font-display text-3xl text-acid">${total.toFixed(2)}</span>
      </div>
      <p className="text-center text-[11px] leading-snug text-white/40">
        One-time payment · instant delivery · 30-day refund
      </p>
    </div>
  );
}

function SummaryRow({ label, was, now }: { label: string; was?: string; now: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="flex items-center gap-1.5 text-white/75">
        {label}
      </span>
      <span className="shrink-0 whitespace-nowrap">
        {was && <span className="mr-2 text-white/30 line-through">{was}</span>}
        <b>{now}</b>
      </span>
    </div>
  );
}
