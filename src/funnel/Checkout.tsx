import { useEffect, useMemo, useState } from "react";
import { FlipClock, LiveViewers, Stars, StockBar } from "./ui";
import EmbeddedStripeCheckout from "./EmbeddedStripeCheckout";
import { PRODUCTS } from "../config/storefront";
import { setAdvancedMatching, track } from "../lib/metaPixel";
import { getMomentumAttribution } from "../lib/momentumSequence";

export type Addons = { contracts: boolean; au: boolean };

type Props = { onComplete: (total: number, addons: Addons) => void };

const BASE = PRODUCTS.vault_core.price;
const CONTRACTS_PRICE = PRODUCTS.contract_bundle.price;
const AU_PRICE = PRODUCTS.australia_addon.price;

export default function Checkout({ onComplete }: Props) {
  const [contracts, setContracts] = useState(true);
  const [au, setAu] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const momentumAttribution = useMemo(() => getMomentumAttribution(), []);

  const total = BASE + (contracts ? CONTRACTS_PRICE : 0) + (au ? AU_PRICE : 0);
  const saved = 29 + (contracts ? 16 : 0) + (au ? 17 : 0);
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

  // Advanced Matching: when the visitor types their receipt email, hash it
  // (SHA-256, client-side) and attach it to the pixel so later events —
  // including the Purchase on the success page — match better (EMQ).
  useEffect(() => {
    if (!email.includes("@") || !email.includes(".")) return;
    const timer = setTimeout(() => {
      setAdvancedMatching({ email }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [email]);

  return (
    <div className="min-h-screen bg-ink">
      <p className="bg-blood py-2 text-center text-[11px] font-black uppercase tracking-[0.16em]">
        Secure checkout — payment handled by Stripe inside this page
      </p>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <p className="font-display text-3xl sm:text-4xl">ALMOST YOURS — SECURE CHECKOUT</p>
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-bold uppercase tracking-widest text-blood">Founder pricing ends in</span>
            <FlipClock seconds={597} />
          </div>
          <LiveViewers />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          {/* left column — selector + summary */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-white/10 bg-panel p-5 sm:p-6">
              <p className="font-display text-2xl">YOUR ORDER</p>
              <p className="mt-1 text-sm text-white/55">
                Select the bundles you want. Checkout updates instantly and stays on-page.
              </p>

              <div className="mt-5 grid gap-3">
                <label className="flex items-start gap-3 rounded-xl border border-acid/40 bg-acid/8 p-4">
                  <input type="checkbox" checked readOnly className="mt-1 h-5 w-5 accent-yellow-400" />
                  <span className="space-y-1">
                    <span className="block font-display text-lg uppercase">{PRODUCTS.vault_core.shortName}</span>
                    <span className="block text-sm text-white/65">{PRODUCTS.vault_core.description}</span>
                    <span className="block text-sm">
                      <span className="mr-2 text-white/35 line-through">${PRODUCTS.vault_core.compareAt}</span>
                      <b className="text-acid">${PRODUCTS.vault_core.price.toFixed(2)}</b>
                    </span>
                  </span>
                </label>

                <label className={`flex items-start gap-3 rounded-xl border p-4 ${contracts ? "border-acid/40 bg-acid/8" : "border-white/10 bg-black/30"}`}>
                  <input
                    type="checkbox"
                    checked={contracts}
                    onChange={(e) => setContracts(e.target.checked)}
                    className="mt-1 h-5 w-5 accent-yellow-400"
                  />
                  <span className="space-y-1">
                    <span className="block font-display text-lg uppercase">{PRODUCTS.contract_bundle.name}</span>
                    <span className="block text-sm text-acid">6 agreement templates plus a plain-English usage guide</span>
                    <span className="block text-sm text-white/65">
                      <ul className="mt-1 grid gap-1 text-[13px] text-white/65">
                        {[
                          "Composer Agreement",
                          "Artist/Producer Agreement",
                          "Mechanical License Agreement",
                          "Musician/Vocalist Work-for-Hire Agreement",
                          "Session Player Release",
                          "Synchronization License Agreement",
                          "Indie Music Contract Kit Usage Guide"
                        ].map((t) => (
                          <li key={t} className="flex items-center gap-2">
                            <span className="text-acid">✓</span> {t}
                          </li>
                        ))}
                      </ul>
                    </span>
                    <span className="block mt-1 text-[11px] text-white/40 italic">
                      This is an educational template kit, not legal advice.
                    </span>
                    <span className="block text-sm mt-2">
                      <span className="mr-2 text-white/35 line-through">${PRODUCTS.contract_bundle.compareAt}</span>
                      <b className="text-acid">${PRODUCTS.contract_bundle.price.toFixed(2)}</b>
                    </span>
                    <span className="block text-[12px] text-white/45"><Stars /> "Saved me from a nightmare split deal." — Jordan Meacham</span>
                  </span>
                </label>

                <label className={`flex items-start gap-3 rounded-xl border p-4 ${au ? "border-acid/40 bg-acid/8" : "border-white/10 bg-black/30"}`}>
                  <input
                    type="checkbox"
                    checked={au}
                    onChange={(e) => setAu(e.target.checked)}
                    className="mt-1 h-5 w-5 accent-yellow-400"
                  />
                  <span className="space-y-1">
                    <span className="block font-display text-lg uppercase">{PRODUCTS.australia_addon.name}</span>
                    <span className="block text-sm text-acid">2,847 AU station contacts · 1,612 verified emails</span>
                    <span className="block text-sm text-white/65">{PRODUCTS.australia_addon.description}</span>
                    <span className="block text-sm">
                      <span className="mr-2 text-white/35 line-through">${PRODUCTS.australia_addon.compareAt}</span>
                      <b className="text-acid">${PRODUCTS.australia_addon.price.toFixed(2)}</b>
                    </span>
                    <span className="block text-[12px] text-white/45"><Stars /> "Got Unearthed airplay in 6 weeks from Ohio." — Dee R.</span>
                  </span>
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-panel p-5">
              <p className="mb-4 font-display text-xl uppercase">Order summary</p>
              <div className="space-y-3 text-[15px]">
                <SummaryRow label={PRODUCTS.vault_core.name} was={`$${PRODUCTS.vault_core.compareAt}`} now={`$${PRODUCTS.vault_core.price.toFixed(2)}`} />
                {contracts && <SummaryRow label={PRODUCTS.contract_bundle.shortName} was={`$${PRODUCTS.contract_bundle.compareAt}`} now={`$${PRODUCTS.contract_bundle.price.toFixed(2)}`} accent />}
                {au && <SummaryRow label={PRODUCTS.australia_addon.shortName} was={`$${PRODUCTS.australia_addon.compareAt}`} now={`$${PRODUCTS.australia_addon.price.toFixed(2)}`} accent />}
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
                  <span className="font-display text-3xl text-acid">${total.toFixed(2)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-panel p-5">
              <StockBar />
            </section>

            <section className="rounded-xl border border-acid/40 bg-acid/5 p-5 text-[13px] leading-relaxed text-white/70">
              <p className="font-display text-lg text-acid">WHAT HAPPENS NEXT</p>
              Stripe processes the payment securely inside this page. After payment, your order is verified server-side and your private downloads unlock from protected storage.
            </section>
          </aside>

          {/* right column — embed */}
          <section className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-panel p-5 sm:p-6">
              <p className="font-display text-2xl">DELIVERY DETAILS</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="co-name" className="mb-1 block text-[12px] font-semibold text-white/60">Name (optional)</label>
                  <input id="co-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="w-full rounded-lg border border-white/15 bg-black/60 px-4 py-3 outline-none placeholder:text-white/30 focus:border-acid" />
                </div>
                <div>
                  <label htmlFor="co-email" className="mb-1 block text-[12px] font-semibold text-white/60">Receipt email (optional)</label>
                  <input id="co-email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" className="w-full rounded-lg border border-white/15 bg-black/60 px-4 py-3 outline-none placeholder:text-white/30 focus:border-acid" />
                </div>
              </div>
              <p className="mt-3 text-[12px] text-white/45">
                Payment fields are rendered by Stripe below. Card details never touch this frontend.
              </p>
            </div>

            <EmbeddedStripeCheckout items={items} bundleId={bundleId} />
          </section>
        </div>
      </div>

      {/* callback for demo flow compatibility */}
      <button type="button" onClick={() => onComplete(total, { contracts, au })} className="sr-only">
        sync
      </button>
    </div>
  );
}

function SummaryRow({ label, was, now, accent }: { label: string; was?: string; now: string; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className={accent ? "text-acid" : "text-white/75"}>{label}</span>
      <span className="shrink-0 whitespace-nowrap">
        {was && <span className="mr-2 text-white/30 line-through">{was}</span>}
        <b>{now}</b>
      </span>
    </div>
  );
}
