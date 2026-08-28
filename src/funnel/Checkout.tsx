import { useEffect, useMemo, useState } from "react";
import { SaleTimer, Stars } from "./ui";
import EmbeddedStripeCheckout from "./EmbeddedStripeCheckout";
import { PRODUCTS, type ProductKey } from "../config/storefront";
import { track, trackCustom } from "../lib/metaPixel";
import { getMomentumAttribution } from "../lib/momentumSequence";
import {
  formatRemainingMs,
  getLuckyCouponRemainingMs,
  type LuckyCoupon,
} from "../lib/luckyCoupon";

export type Addons = { contracts: boolean; au: boolean; contractGuide: boolean };

type Props = {
  onComplete?: (total: number, addons: Addons) => void;
  luckyCoupon?: LuckyCoupon | null;
  onOpenWheel?: () => void;
  /**
   * Ladder preselection from the sales page ("Vault + Pitch Kit", "Launch
   * Stack"). Explicit buyer opt-in on the sales page — never auto-added here.
   * Defaults to the Vault alone; every optional row stays removable.
   */
  initialItems?: ProductKey[];
};

const BASE = PRODUCTS.vault_core.price;
const CONTRACTS_PRICE = PRODUCTS.contract_bundle.price;
const AU_PRICE = PRODUCTS.australia_addon.price;
const CONTRACT_GUIDE_PRICE = PRODUCTS.contract_guide.price;
const AIRPLAY_PRICE = PRODUCTS.airplay_accelerator.price;

/** "$10" for whole-dollar prices, "$3.95" otherwise — matches Stripe totals. */
const usd = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

export default function Checkout({
  onComplete,
  luckyCoupon,
  onOpenWheel,
  initialItems = [],
}: Props) {
  // Price-message match: a visitor who clicked a $25 offer lands on a $25 cart.
  // Ladder buyers arrive with their kit preselected (their own click), and
  // every row stays toggleable — nothing is locked or hidden.
  const preset = useMemo(() => new Set(initialItems), [initialItems]);
  const [contracts, setContracts] = useState(() => preset.has("contract_bundle"));
  const [au, setAu] = useState(() => preset.has("australia_addon"));
  const [contractGuide, setContractGuide] = useState(() => preset.has("contract_guide"));
  const [airplay, setAirplay] = useState(() => preset.has("airplay_accelerator"));
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

  // Every price shown is the real Stripe price. The wheel jackpot holds the
  // two add-on rows together for the winner ($9 + $12 = $21) — it never
  // changes a price and never re-adds anything on its own.

  const total =
    BASE +
    (contracts ? CONTRACTS_PRICE : 0) +
    (au ? AU_PRICE : 0) +
    (contractGuide ? CONTRACT_GUIDE_PRICE : 0) +
    (airplay ? AIRPLAY_PRICE : 0);

  const items = useMemo(
    () => [
      "vault_core" as const,
      ...(contracts ? (["contract_bundle"] as const) : []),
      ...(au ? (["australia_addon"] as const) : []),
      ...(contractGuide ? (["contract_guide"] as const) : []),
      ...(airplay ? (["airplay_accelerator"] as const) : []),
    ],
    [contracts, au, contractGuide, airplay]
  );

  const bundleId = useMemo(() => items.join("+"), [items]);

  useEffect(() => {
    trackCustom("CheckoutCartConfigured", {
      value: total,
      currency: "USD",
      core_only: !contracts && !au && !contractGuide && !airplay,
      contract_bundle: contracts,
      australia_addon: au,
      contract_guide: contractGuide,
      airplay_accelerator: airplay,
      num_items: items.length,
      ladder_preset: initialItems.length > 1 ? initialItems.join("+") : "",
    });
  }, [au, contracts, contractGuide, airplay, items.length, total, initialItems]);

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

      {/* jackpot banner on checkout: the two add-on rows are held together
          for the winner at their real prices. No invented "was" pricing. */}
      {hasWinningCoupon && luckyCoupon && (
        <div className="bg-gradient-to-r from-acid via-yellow-200 to-acid px-3 py-2.5 text-center">
          <p className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-ink sm:gap-3 sm:text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[10px] tracking-[0.16em] text-acid">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              🎉 JACKPOT WINNER
            </span>
            <span className="font-mono">{luckyCoupon.code}</span>
            <span className="hidden sm:inline opacity-40">•</span>
            <span>Add-on bundle held: Contract Kit + AU List, $21 together</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-mono text-acid">
              ⏳ {remainingStr}
            </span>
            <span className="hidden sm:inline text-[10px] tracking-[0.12em] opacity-60">
              • both rows waiting below · nothing added automatically
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
            Your Vault is $25. Everything else on this page is optional and off unless you picked a kit — the price you saw is the price you start with.
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
                The Vault is included. Optional add-ons are off by default — add what fits your release plan.
              </p>

              {!hasWinningCoupon && (
                <div className="mt-4 rounded-xl border border-fuchsia-400/25 bg-gradient-to-r from-orange-400/10 via-fuchsia-400/10 to-cyan-400/10 p-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-300">Free spin, optional</p>
                  <p className="mt-1 text-sm font-bold text-white">Spin once to hold the add-on bundle together at checkout.</p>
                  <p className="mt-1 text-[11px] text-white/45">Free · no email · the prices on this page are the prices everyone gets</p>
                  <button
                    type="button"
                    onClick={() => onOpenWheel?.()}
                    className="cta mt-3 rounded-full bg-white px-5 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-900"
                  >
                    🎡 Spin for the bundle hold
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
                      <b className="text-acid">${PRODUCTS.vault_core.price.toFixed(2)}</b>
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-white/40">one-time</span>
                    </span>
                  </span>
                </label>

                {/* Airplay Accelerator — the campaign upgrade.
                    Previously unreachable ghost inventory (a dead stage machine);
                    now a real, priced, optional row on the live checkout. */}
                <label
                  className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 sm:p-4 ${
                    airplay
                      ? "border-acid/60 bg-acid/[0.07]"
                      : "border-acid/30 bg-black/30 hover:border-acid/50 hover:bg-black/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={airplay}
                    onChange={(e) => setAirplay(e.target.checked)}
                    aria-label="Add the Airplay Accelerator campaign upgrade"
                    className="mt-1 h-6 w-6 shrink-0 accent-yellow-400"
                  />
                  <span className="w-full space-y-1.5 pr-2">
                    <span className="inline-flex items-center rounded-full border border-acid/40 bg-acid/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-acid">
                      Campaign upgrade
                    </span>
                    <span className="block font-display text-lg uppercase leading-tight">Airplay Accelerator</span>
                    <span className="block text-sm font-bold text-white/80">
                      Curator contacts, campaign calendar, swipe file, follow-up sequence, and pitch review.
                    </span>
                    <span className="block pt-1">
                      <b className="text-base text-acid">Add for {usd(PRODUCTS.airplay_accelerator.price)}</b>
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                        one-time · instant download
                      </span>
                    </span>
                  </span>
                </label>

                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Optional add-ons</p>
                  <p className="text-[10px] text-white/35">Tap to add or remove</p>
                </div>

                {/* Contract Kit; celebratory styling when the wheel jackpot holds it */}
                <label
                  className={`relative flex min-h-14 cursor-pointer items-start gap-3 overflow-hidden rounded-xl border p-3.5 sm:p-4 ${
                    contracts
                      ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.09] via-emerald-500/[0.04] to-transparent"
                      : "border-white/15 bg-black/20 hover:border-acid/40 hover:bg-black/30"
                  }`}
                >
                  {hasWinningCoupon && (
                    <span className="pointer-events-none absolute right-0 top-0 rounded-bl-lg bg-[linear-gradient(90deg,#FACC15,#FB923C,#F472B6,#A78BFA)] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-900 shadow-[0_4px_12px_rgba(244,114,182,0.35)]">
                      HELD BY YOUR SPIN ✓
                    </span>
                  )}
                  <input
                    type="checkbox"
                    checked={contracts}
                    onChange={(e) => setContracts(e.target.checked)}
                    aria-label="Add the Indie Music Contract Kit"
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
                      <b className="text-acid">Add for {usd(PRODUCTS.contract_bundle.price)}</b>
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-white/40">one-time</span>
                    </span>
                    <span className="block text-[12px] text-white/45"><Stars /> "Saved me from a nightmare split deal." Jordan Meacham</span>
                  </div>
                </label>

                {/* AU addon; celebratory styling when the wheel jackpot holds it */}
                <label
                  className={`relative flex min-h-14 cursor-pointer items-start gap-3 overflow-hidden rounded-xl border p-3.5 sm:p-4 ${
                    au
                      ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.09] via-emerald-500/[0.04] to-transparent"
                      : "border-white/15 bg-black/20 hover:border-acid/40 hover:bg-black/30"
                  }`}
                >
                  {hasWinningCoupon && (
                    <span className="pointer-events-none absolute right-0 top-0 rounded-bl-lg bg-[linear-gradient(90deg,#FACC15,#FB923C,#F472B6,#A78BFA)] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-900 shadow-[0_4px_12px_rgba(244,114,182,0.35)]">
                      HELD BY YOUR SPIN ✓
                    </span>
                  )}
                  <input
                    type="checkbox"
                    checked={au}
                    onChange={(e) => setAu(e.target.checked)}
                    aria-label="Add the Australian Radio Stations contact list"
                    className="mt-0.5 h-6 w-6 shrink-0 accent-yellow-400 sm:mt-1"
                  />
                  <span className="space-y-1 pr-2 w-full">
                    <span className="block font-display text-lg uppercase leading-none">{PRODUCTS.australia_addon.name}</span>
                    <span className="block text-sm font-bold text-acid">2,847 AU station contacts · 1,612 verified emails</span>
                    <span className="block text-sm text-white/65">{PRODUCTS.australia_addon.description}</span>
                    <span className="block text-sm">
                      <b className="text-acid">Add for {usd(PRODUCTS.australia_addon.price)}</b>
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-white/40">one-time</span>
                    </span>
                    <span className="block text-[12px] text-white/45"><Stars /> "Got Unearthed airplay in 6 weeks from Ohio." Dee R.</span>
                  </span>
                </label>

                {/* Contract Info Guide — optional for everyone, one copy, off by default */}
                <label
                  className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3.5 sm:p-4 ${
                    contractGuide
                      ? "border-acid/50 bg-acid/[0.06]"
                      : "border-white/15 bg-black/20 hover:border-acid/40 hover:bg-black/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={contractGuide}
                    onChange={(e) => setContractGuide(e.target.checked)}
                    aria-label="Add the RadioReach Indie Artist Contract Info Guide"
                    className="mt-1 h-6 w-6 shrink-0 accent-yellow-400"
                  />
                  <span className="w-full space-y-1.5 pr-2">
                    <span className="inline-flex items-center rounded-full border border-acid/40 bg-acid/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-acid">
                      {PRODUCTS.contract_guide.checkoutBadge}
                    </span>
                    <span className="block font-display text-lg uppercase leading-tight text-white">
                      {PRODUCTS.contract_guide.checkoutHeadline}
                    </span>
                    <span className="block text-sm font-bold text-white/80">{PRODUCTS.contract_guide.name}</span>
                    <span className="block text-sm text-white/65">{PRODUCTS.contract_guide.description}</span>
                    <span className="block text-[12px] leading-relaxed text-white/45">
                      {PRODUCTS.contract_guide.checkoutValueLine}
                    </span>
                    <span className="block pt-1">
                      <b className="text-base text-acid">Add for {usd(PRODUCTS.contract_guide.price)}</b>
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                        one-time · no subscription
                      </span>
                    </span>
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
                  {items.length} item{items.length === 1 ? "" : "s"} <span aria-hidden className="ml-1 inline-block transition-transform group-open:rotate-180">⌄</span>
                </span>
              </summary>
              <div className="border-t border-white/10 p-4">
                <OrderSummaryRows contracts={contracts} au={au} contractGuide={contractGuide} airplay={airplay} total={total} coupon={luckyCoupon} remainingStr={remainingStr} hasWinningCoupon={hasWinningCoupon} />
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
              <OrderSummaryRows contracts={contracts} au={au} contractGuide={contractGuide} airplay={airplay} total={total} coupon={luckyCoupon} remainingStr={remainingStr} hasWinningCoupon={hasWinningCoupon} />
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
      <button type="button" onClick={() => onComplete?.(total, { contracts, au, contractGuide })} className="sr-only">
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
  contractGuide,
  airplay,
  total,
  coupon,
  remainingStr,
  hasWinningCoupon,
}: {
  contracts: boolean;
  au: boolean;
  contractGuide: boolean;
  airplay: boolean;
  total: number;
  coupon?: LuckyCoupon | null;
  remainingStr?: string;
  hasWinningCoupon?: boolean;
}) {
  return (
    <div className="space-y-3 text-[15px]">
      <SummaryRow
        label={PRODUCTS.vault_core.name}
        now={`$${PRODUCTS.vault_core.price.toFixed(2)}`}
      />
      {airplay && (
        <SummaryRow
          label={PRODUCTS.airplay_accelerator.shortName}
          now={`$${PRODUCTS.airplay_accelerator.price.toFixed(2)}`}
          accent
        />
      )}
      {contracts && (
        <SummaryRow
          label={PRODUCTS.contract_bundle.shortName}
          now={`$${PRODUCTS.contract_bundle.price.toFixed(2)}`}
          accent={hasWinningCoupon}
          badge={hasWinningCoupon ? "HELD BY YOUR SPIN" : undefined}
        />
      )}
      {au && (
        <SummaryRow
          label={PRODUCTS.australia_addon.shortName}
          now={`$${PRODUCTS.australia_addon.price.toFixed(2)}`}
          accent={hasWinningCoupon}
          badge={hasWinningCoupon ? "HELD BY YOUR SPIN" : undefined}
        />
      )}
      {contractGuide && (
        <SummaryRow
          label={PRODUCTS.contract_guide.shortName}
          now={`$${PRODUCTS.contract_guide.price.toFixed(2)}`}
        />
      )}
      {hasWinningCoupon && coupon && (
        <div className="rounded-lg border-transparent bg-[linear-gradient(90deg,#FACC15,#FB923C,#F472B6,#A78BFA)] p-[1px] text-center -mx-1">
        <div className="rounded-[7px] bg-[#0F0F12] px-3 py-2">
          <p className="text-xs font-black uppercase tracking-widest text-acid">
            🎉 Jackpot {coupon.code} • ⏳ {remainingStr} • add-on bundle held
          </p>
          <p className="text-[11px] text-white/50">Contract Kit + AU List: $21 together at their everyday prices</p>
        </div>
        </div>
      )}
      <div className="flex justify-between border-t border-white/10 pt-3 text-white/50">
        <span>One-time payment</span>
        <span className="font-bold text-white/40">No subscription</span>
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

function SummaryRow({ label, now, accent, badge }: { label: string; now: string; accent?: boolean; badge?: string }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${accent ? "rounded-lg border border-acid/20 bg-acid/5 px-2 py-1 -mx-2" : ""}`}>
      <span className={`${accent ? "text-acid font-bold" : "text-white/75"} flex items-center gap-1.5`}>
        {label}
        {badge && <span className="rounded-full bg-[linear-gradient(90deg,#FACC15,#FB923C,#F472B6,#A78BFA)] px-1.5 py-0.5 text-[8px] font-black tracking-[0.08em] text-zinc-900 shadow-[0_2px_8px_rgba(244,114,182,0.35)]">{badge}</span>}
      </span>
      <span className="shrink-0 whitespace-nowrap">
        <b className={accent ? "text-acid" : ""}>{now}</b>
      </span>
    </div>
  );
}
