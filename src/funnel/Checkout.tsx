import { useEffect, useMemo, useState } from "react";
import { FlipClock, Stars } from "./ui";
import EmbeddedStripeCheckout from "./EmbeddedStripeCheckout";
import { PRODUCTS } from "../config/storefront";
import { track } from "../lib/metaPixel";
import { getMomentumAttribution } from "../lib/momentumSequence";
import {
  formatRemainingMs,
  getLuckyCouponRemainingMs,
  type LuckyCoupon,
} from "../lib/luckyCoupon";

export type Addons = { contracts: boolean; au: boolean };

type Props = {
  onComplete: (total: number, addons: Addons) => void;
  luckyCoupon?: LuckyCoupon | null;
  onOpenWheel?: () => void;
};

const BASE = PRODUCTS.vault_core.price;
const CONTRACTS_PRICE = PRODUCTS.contract_bundle.price;
const AU_PRICE = PRODUCTS.australia_addon.price;

export default function Checkout({
  onComplete,
  luckyCoupon,
  onOpenWheel,
}: Props) {
  const [contracts, setContracts] = useState(true);
  const [au, setAu] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const momentumAttribution = useMemo(() => getMomentumAttribution(), []);

  const hasWinningCoupon =
    !!luckyCoupon && getLuckyCouponRemainingMs(luckyCoupon) > 0;
  const isCouponExpired =
    !!luckyCoupon && !hasWinningCoupon && luckyCoupon.expiresAt > 0;

  // live countdown for coupon
  useEffect(() => {
    if (!hasWinningCoupon) return;
    const t = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [hasWinningCoupon]);

  const remainingStr = luckyCoupon
    ? formatRemainingMs(Math.max(0, luckyCoupon.expiresAt - nowMs))
    : "";

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
    <div className="min-h-screen bg-ink">
      <p className="bg-blood py-2 text-center text-[11px] font-black uppercase tracking-[0.16em]">
        Secure checkout — payment handled by Stripe inside this page
      </p>

      {/* jackpot banner on checkout — makes the pre-selected upsells feel like a win */}
      {hasWinningCoupon && luckyCoupon && (
        <div className="bg-gradient-to-r from-acid via-yellow-200 to-acid px-3 py-2.5 text-center">
          <p className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-ink sm:gap-3 sm:text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[10px] tracking-[0.16em] text-acid">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              🎉 JACKPOT WINNER
            </span>
            <span className="font-mono">{luckyCoupon.code}</span>
            <span className="hidden sm:inline opacity-40">•</span>
            <span>Founder Bundle $21 <span className="line-through opacity-50">$54</span></span>
            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-mono text-acid">
              ⏳ {remainingStr}
            </span>
            <span className="hidden sm:inline text-[10px] tracking-[0.12em] opacity-60">
              • both add-ons waiting below
            </span>
          </p>
        </div>
      )}

      {isCouponExpired && luckyCoupon && (
        <div className="bg-blood px-3 py-2 text-center text-xs font-bold text-white">
          Your jackpot <span className="font-mono">{luckyCoupon.code}</span> expired after 15 minutes.{" "}
          <button
            type="button"
            onClick={() => onOpenWheel?.()}
            className="ml-2 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-widest text-blood hover:bg-acid"
          >
            Spin again — free
          </button>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-5 flex flex-col items-center gap-3 text-center sm:mb-6">
          <p className="font-display text-[1.65rem] leading-[1.1] sm:text-4xl">ALMOST YOURS — SECURE CHECKOUT</p>
          <div className="flex flex-col items-center gap-2 min-[400px]:flex-row min-[400px]:gap-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blood sm:text-[12px] sm:tracking-widest">Founder pricing ends in</span>
            <FlipClock seconds={597} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          {/* left column — selector + summary */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-white/10 bg-panel p-4 sm:p-6">
              <p className="font-display text-2xl">YOUR ORDER</p>
              <p className="mt-1 text-sm text-white/55">
                Select the bundles you want. Checkout updates instantly and stays on-page.
              </p>

              <div className="mt-5 grid gap-3">
                <label className="flex min-h-14 items-start gap-3 rounded-xl border border-acid/40 bg-acid/8 p-3.5 sm:p-4">
                  <input type="checkbox" checked readOnly aria-label="Radio Reach Vault included" className="mt-0.5 h-6 w-6 shrink-0 accent-yellow-400 sm:mt-1" />
                  <span className="space-y-1">
                    <span className="block font-display text-lg uppercase">{PRODUCTS.vault_core.shortName}</span>
                    <span className="block text-sm text-white/65">{PRODUCTS.vault_core.description}</span>
                    <span className="block text-sm">
                      <span className="mr-2 text-white/35 line-through">${PRODUCTS.vault_core.compareAt}</span>
                      <b className="text-acid">${PRODUCTS.vault_core.price.toFixed(2)}</b>
                    </span>
                  </span>
                </label>

                {/* Contract Kit — jackpot styling when winner */}
                <label
                  className={`relative flex min-h-14 cursor-pointer items-start gap-3 overflow-hidden rounded-xl border p-3.5 sm:p-4 ${
                    hasWinningCoupon
                      ? contracts
                        ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-emerald-500/[0.03] to-transparent shadow-[0_8px_24px_rgba(16,185,129,0.08)]"
                        : "border-acid/30 bg-black/30"
                      : contracts
                        ? "border-acid/40 bg-acid/8"
                        : "border-white/10 bg-black/30"
                  }`}
                >
                  {hasWinningCoupon && (
                    <span className="pointer-events-none absolute right-0 top-0 rounded-bl-lg bg-[linear-gradient(90deg,#FACC15,#FB923C,#F472B6,#A78BFA)] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-900 shadow-[0_4px_12px_rgba(244,114,182,0.35)]">
                      YOU WON THIS ✓
                    </span>
                  )}
                  <input
                    type="checkbox"
                    checked={contracts}
                    onChange={(e) => setContracts(e.target.checked)}
                    className="mt-0.5 h-6 w-6 shrink-0 accent-yellow-400 sm:mt-1"
                  />
                  <div className="space-y-1 pr-2 w-full">
                    <span className="block font-display text-lg uppercase leading-none">{PRODUCTS.contract_bundle.name}</span>
                    <span className="block text-sm font-bold text-acid">6 agreement templates plus a plain-English usage guide</span>
                    <ul className="mt-1 hidden gap-1 text-[13px] text-white/65 sm:grid">
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
                    <span className="block mt-1 text-[11px] text-white/40 italic">
                      This is an educational template kit, not legal advice.
                    </span>
                    <span className="block text-sm mt-2">
                      <span className="mr-2 text-white/35 line-through">${PRODUCTS.contract_bundle.compareAt}</span>
                      <b className="text-acid">${PRODUCTS.contract_bundle.price.toFixed(2)}</b>
                    </span>
                    <span className="block text-[12px] text-white/45"><Stars /> "Saved me from a nightmare split deal." — Jordan Meacham</span>
                  </div>
                </label>

                {/* AU addon — jackpot styling when winner */}
                <label
                  className={`relative flex min-h-14 cursor-pointer items-start gap-3 overflow-hidden rounded-xl border p-3.5 sm:p-4 ${
                    hasWinningCoupon
                      ? au
                        ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-emerald-500/[0.03] to-transparent shadow-[0_8px_24px_rgba(16,185,129,0.08)]"
                        : "border-acid/30 bg-black/30"
                      : au
                        ? "border-acid/40 bg-acid/8"
                        : "border-white/10 bg-black/30"
                  }`}
                >
                  {hasWinningCoupon && (
                    <span className="pointer-events-none absolute right-0 top-0 rounded-bl-lg bg-[linear-gradient(90deg,#FACC15,#FB923C,#F472B6,#A78BFA)] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-900 shadow-[0_4px_12px_rgba(244,114,182,0.35)]">
                      YOU WON THIS ✓
                    </span>
                  )}
                  <input
                    type="checkbox"
                    checked={au}
                    onChange={(e) => setAu(e.target.checked)}
                    className="mt-0.5 h-6 w-6 shrink-0 accent-yellow-400 sm:mt-1"
                  />
                  <span className="space-y-1 pr-2 w-full">
                    <span className="block font-display text-lg uppercase leading-none">{PRODUCTS.australia_addon.name}</span>
                    <span className="block text-sm font-bold text-acid">2,847 AU station contacts · direct emails where published</span>
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

            <details className="group overflow-hidden rounded-xl border border-white/10 bg-panel lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-white/45">Order total</span>
                  <span className="font-display text-2xl text-acid">${total.toFixed(2)}</span>
                </span>
                <span className="text-right text-[11px] font-bold uppercase tracking-wider text-white/55">
                  Save ${saved.toFixed(2)} <span aria-hidden className="ml-1 inline-block transition-transform group-open:rotate-180">⌄</span>
                </span>
              </summary>
              <div className="border-t border-white/10 p-4">
                <OrderSummaryRows contracts={contracts} au={au} saved={saved} total={total} coupon={luckyCoupon} remainingStr={remainingStr} hasWinningCoupon={hasWinningCoupon} />
              </div>
            </details>

            <a
              href="#payment"
              role="button"
              className="cta tap-target w-full rounded-lg bg-acid px-5 py-3 text-center font-display text-lg uppercase tracking-wide text-ink lg:hidden"
            >
              Continue to secure payment ↓
            </a>

            <section className="hidden rounded-xl border border-white/10 bg-panel p-5 lg:block">
              <p className="mb-4 font-display text-xl uppercase">Order summary</p>
              <OrderSummaryRows contracts={contracts} au={au} saved={saved} total={total} coupon={luckyCoupon} remainingStr={remainingStr} hasWinningCoupon={hasWinningCoupon} />
            </section>

            <section className="hidden rounded-xl border border-acid/40 bg-acid/5 p-5 text-[13px] leading-relaxed text-white/70 lg:block">
              <p className="font-display text-lg text-acid">WHAT HAPPENS NEXT</p>
              Stripe processes the payment securely inside this page. After payment, your order is verified server-side and your private downloads unlock from protected storage.
            </section>
          </aside>

          {/* right column — Stripe collects delivery + payment details once */}
          <section id="payment" className="space-y-3">
            <div className="rounded-lg border border-acid/25 bg-acid/5 px-4 py-3 text-center text-[12px] text-white/60 lg:hidden">
              <b className="text-acid">Next:</b> enter your email and payment details securely with Stripe.
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

function OrderSummaryRows({
  contracts,
  au,
  saved,
  total,
  coupon,
  remainingStr,
  hasWinningCoupon,
}: {
  contracts: boolean;
  au: boolean;
  saved: number;
  total: number;
  coupon?: LuckyCoupon | null;
  remainingStr?: string;
  hasWinningCoupon?: boolean;
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
          accent={hasWinningCoupon}
          badge={hasWinningCoupon ? "YOU WON THIS" : undefined}
        />
      )}
      {au && (
        <SummaryRow
          label={PRODUCTS.australia_addon.shortName}
          was={`$${PRODUCTS.australia_addon.compareAt}`}
          now={`$${PRODUCTS.australia_addon.price.toFixed(2)}`}
          accent={hasWinningCoupon}
          badge={hasWinningCoupon ? "YOU WON THIS" : undefined}
        />
      )}
      {hasWinningCoupon && coupon && (
        <div className="rounded-lg border-transparent bg-[linear-gradient(90deg,#FACC15,#FB923C,#F472B6,#A78BFA)] p-[1px] text-center -mx-1">
        <div className="rounded-[7px] bg-[#0F0F12] px-3 py-2">
          <p className="text-xs font-black uppercase tracking-widest text-acid">
            🎉 Jackpot {coupon.code} • ⏳ {remainingStr} • Save $33 on bundle
          </p>
          <p className="text-[11px] text-white/50">Both add-ons ready because you won</p>
        </div>
        </div>
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
        <span className="font-display text-3xl text-acid">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, was, now, accent, badge }: { label: string; was?: string; now: string; accent?: boolean; badge?: string }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${accent ? "rounded-lg border border-acid/20 bg-acid/5 px-2 py-1 -mx-2" : ""}`}>
      <span className={`${accent ? "text-acid font-bold" : "text-white/75"} flex items-center gap-1.5`}>
        {label}
        {badge && <span className="rounded-full bg-[linear-gradient(90deg,#FACC15,#FB923C,#F472B6,#A78BFA)] px-1.5 py-0.5 text-[8px] font-black tracking-[0.08em] text-zinc-900 shadow-[0_2px_8px_rgba(244,114,182,0.35)]">{badge}</span>}
      </span>
      <span className="shrink-0 whitespace-nowrap">
        {was && <span className="mr-2 text-white/30 line-through">{was}</span>}
        <b className={accent ? "text-acid" : ""}>{now}</b>
      </span>
    </div>
  );
}
