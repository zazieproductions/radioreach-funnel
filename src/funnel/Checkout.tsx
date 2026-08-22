import { useEffect, useMemo, useState } from "react";
import { SaleTimer, Stars } from "./ui";
import EmbeddedStripeCheckout from "./EmbeddedStripeCheckout";
import { PRODUCTS } from "../config/storefront";
import { track, trackCustom } from "../lib/metaPixel";
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
  // Price-message match: a visitor who clicked a $20 offer lands on a $20 cart.
  // Even after a jackpot, optional products require an explicit opt-in.
  const [contracts, setContracts] = useState(false);
  const [au, setAu] = useState(false);
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

  useEffect(() => {
    if (hasWinningCoupon) return;
    setContracts(false);
    setAu(false);
  }, [hasWinningCoupon]);

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

  useEffect(() => {
    trackCustom("CheckoutCartConfigured", {
      value: total,
      currency: "USD",
      core_only: !contracts && !au,
      contract_bundle: contracts,
      australia_addon: au,
      num_items: items.length,
    });
  }, [au, contracts, items.length, total]);

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
        Secure checkout. Payment handled by Stripe inside this page
      </p>

      {/* jackpot banner on checkout; makes the pre-selected upsells feel like a win */}
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
              • unlocked below · nothing added automatically
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
            Spin again for free
          </button>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-5 text-center sm:mb-6">
          <p className="font-display text-[1.65rem] leading-[1.1] sm:text-4xl">COMPLETE YOUR SECURE ORDER</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-white/60">
            Your Vault is $20. Optional add-ons are off by default, so the price you saw is the price you start with.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
            <span>✓ Instant download</span><span>✓ No subscription</span><span>✓ 30-day guarantee</span>
          </div>
          <div className="mx-auto mt-4 max-w-md">
            <SaleTimer compact />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          {/* left column; selector + summary */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-white/10 bg-panel p-4 sm:p-6">
              <p className="font-display text-2xl">YOUR ORDER</p>
              <p className="mt-1 text-sm text-white/55">
                The Vault is included. Add either optional extra only if it fits your plans.
              </p>

              {hasWinningCoupon && luckyCoupon ? (
                <div className="mt-4 rounded-xl border border-acid/30 bg-gradient-to-r from-acid/10 via-orange-400/5 to-fuchsia-400/10 p-3 text-[12px] text-white/70">
                  <p className="font-black uppercase tracking-[0.12em] text-acid">🎉 Jackpot pricing unlocked</p>
                  <p className="mt-1">
                    Contract Kit <span className="line-through text-white/35">$25</span> <b className="text-white">$9</b> + AU List{" "}
                    <span className="line-through text-white/35">$29</span> <b className="text-white">$12</b>. Select either or both below. <b>Nothing was pre-added.</b>
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-white/45">{luckyCoupon.code} · held for {remainingStr}</p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-fuchsia-400/25 bg-gradient-to-r from-orange-400/10 via-fuchsia-400/10 to-cyan-400/10 p-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-300">Founder add-on prices are hidden</p>
                  <p className="mt-1 text-sm font-bold text-white">Spin once to reveal your preset checkout jackpot.</p>
                  <p className="mt-1 text-[11px] text-white/45">Free · no email · optional items stay unchecked</p>
                  <button
                    type="button"
                    onClick={() => onOpenWheel?.()}
                    className="cta mt-3 rounded-full bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-900"
                  >
                    🎡 Spin to reveal discount
                  </button>
                </div>
              )}

              <div className="mt-4 grid gap-3">
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

                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Optional add-ons</p>
                  <p className="text-[10px] text-white/35">Tap to add or remove</p>
                </div>

                {/* Contract Kit; jackpot styling when winner */}
                <label
                  className={`relative flex min-h-14 items-start gap-3 overflow-hidden rounded-xl border p-3.5 sm:p-4 ${
                    hasWinningCoupon
                      ? contracts
                        ? "cursor-pointer border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.09] via-emerald-500/[0.04] to-transparent shadow-[0_8px_24px_rgba(16,185,129,0.08)]"
                        : "cursor-pointer border-acid/30 bg-black/30"
                      : "cursor-not-allowed border-white/10 bg-black/20 opacity-60"
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
                    disabled={!hasWinningCoupon}
                    onChange={(e) => setContracts(e.target.checked)}
                    className="mt-0.5 h-6 w-6 shrink-0 accent-yellow-400 disabled:cursor-not-allowed sm:mt-1"
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
                      {hasWinningCoupon ? (
                        <><span className="mr-2 text-white/35 line-through">${PRODUCTS.contract_bundle.compareAt}</span><b className="text-acid">JACKPOT ${PRODUCTS.contract_bundle.price.toFixed(2)}</b></>
                      ) : (
                        <b className="text-white/45">🔒 Spin to reveal founder price</b>
                      )}
                    </span>
                    <span className="block text-[12px] text-white/45"><Stars /> "Saved me from a nightmare split deal." Jordan Meacham</span>
                  </div>
                </label>

                {/* AU addon; jackpot styling when winner */}
                <label
                  className={`relative flex min-h-14 items-start gap-3 overflow-hidden rounded-xl border p-3.5 sm:p-4 ${
                    hasWinningCoupon
                      ? au
                        ? "cursor-pointer border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.09] via-emerald-500/[0.04] to-transparent shadow-[0_8px_24px_rgba(16,185,129,0.08)]"
                        : "cursor-pointer border-acid/30 bg-black/30"
                      : "cursor-not-allowed border-white/10 bg-black/20 opacity-60"
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
                    disabled={!hasWinningCoupon}
                    onChange={(e) => setAu(e.target.checked)}
                    className="mt-0.5 h-6 w-6 shrink-0 accent-yellow-400 disabled:cursor-not-allowed sm:mt-1"
                  />
                  <span className="space-y-1 pr-2 w-full">
                    <span className="block font-display text-lg uppercase leading-none">{PRODUCTS.australia_addon.name}</span>
                    <span className="block text-sm font-bold text-acid">2,847 AU station contacts · 1,612 verified emails</span>
                    <span className="block text-sm text-white/65">{PRODUCTS.australia_addon.description}</span>
                    <span className="block text-sm">
                      {hasWinningCoupon ? (
                        <><span className="mr-2 text-white/35 line-through">${PRODUCTS.australia_addon.compareAt}</span><b className="text-acid">JACKPOT ${PRODUCTS.australia_addon.price.toFixed(2)}</b></>
                      ) : (
                        <b className="text-white/45">🔒 Spin to reveal founder price</b>
                      )}
                    </span>
                    <span className="block text-[12px] text-white/45"><Stars /> "Got Unearthed airplay in 6 weeks from Ohio." Dee R.</span>
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

          {/* right column; Stripe collects delivery + payment details once */}
          <section id="payment" className="space-y-3">
            <div className="rounded-lg border border-acid/25 bg-acid/5 px-4 py-3 text-[12px] leading-relaxed text-white/65">
              <p>
                <b className="text-acid">30-Day Action-Based Money-Back Guarantee.</b>{" "}
                Try RadioReach for 30 days. If you contact at least five relevant
                stations, document your outreach, and decide the product is not
                right for you, submit your request within 30 days for a refund.{" "}
                <a
                  href="/refund-policy/"
                  className="underline decoration-acid/40 underline-offset-4 hover:text-acid"
                >
                  See full terms
                </a>
                .
              </p>
            </div>
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

      <footer className="mt-6 border-t border-white/10 px-4 py-6 text-center text-[11px] leading-relaxed text-white/30">
        <nav
          aria-label="Site"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
        >
          <a href="/privacy-policy/" className="underline decoration-white/20 underline-offset-4 hover:text-white/60">
            Privacy policy
          </a>
          <a href="/terms/" className="underline decoration-white/20 underline-offset-4 hover:text-white/60">
            Terms of service
          </a>
          <a href="/refund-policy/" className="underline decoration-white/20 underline-offset-4 hover:text-white/60">
            Refund policy
          </a>
        </nav>
        <p className="mt-3">© {new Date().getFullYear()} Radio Reach Vault. All rights reserved.</p>
      </footer>
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
