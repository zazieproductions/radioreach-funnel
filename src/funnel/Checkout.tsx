import { useEffect, useMemo, useState } from "react";
import { FlipClock, LiveViewers, Stars, StockBar } from "./ui";
import EmbeddedStripeCheckout from "./EmbeddedStripeCheckout";
import { PRODUCTS } from "../config/storefront";
import { track } from "../lib/metaPixel";
import { getMomentumAttribution } from "../lib/momentumSequence";
import {
  formatRemainingMs,
  getLuckyCouponRemainingMs,
  type LuckyCoupon,
} from "../lib/luckyCoupon";
import { LuckyWheelButton } from "./LuckyWheel";

export type Addons = { contracts: boolean; au: boolean; dj?: boolean };

type Props = {
  onComplete: (total: number, addons: Addons) => void;
  luckyCoupon?: LuckyCoupon | null;
  onOpenWheel?: () => void;
  djAutoAdd?: boolean;
  onDjAutoAddConsumed?: () => void;
};

const BASE = PRODUCTS.vault_core.price;
const CONTRACTS_PRICE = PRODUCTS.contract_bundle.price;
const AU_PRICE = PRODUCTS.australia_addon.price;
const DJ_PRICE = PRODUCTS.dj_pack_50.price;
const DJ_COMPARE = PRODUCTS.dj_pack_50.compareAt || 8.99;

export default function Checkout({
  onComplete,
  luckyCoupon,
  onOpenWheel,
  djAutoAdd,
  onDjAutoAddConsumed,
}: Props) {
  const [contracts, setContracts] = useState(true);
  const [au, setAu] = useState(true);
  const [dj, setDj] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const momentumAttribution = useMemo(() => getMomentumAttribution(), []);

  const hasWinningCoupon =
    !!luckyCoupon && getLuckyCouponRemainingMs(luckyCoupon) > 0;
  const isCouponExpired =
    !!luckyCoupon && !hasWinningCoupon && luckyCoupon.expiresAt > 0;

  // auto-add DJ pack when they just won and land on checkout
  useEffect(() => {
    if (djAutoAdd && hasWinningCoupon && !dj) {
      setDj(true);
      onDjAutoAddConsumed?.();
    }
  }, [djAutoAdd, hasWinningCoupon, dj, onDjAutoAddConsumed]);

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
    BASE +
    (contracts ? CONTRACTS_PRICE : 0) +
    (au ? AU_PRICE : 0) +
    (dj && hasWinningCoupon ? DJ_PRICE : 0);
  const saved =
    29 +
    (contracts ? 16 : 0) +
    (au ? 17 : 0) +
    (dj && hasWinningCoupon ? DJ_COMPARE - DJ_PRICE : 0);

  const items = useMemo(
    () => [
      "vault_core" as const,
      ...(contracts ? (["contract_bundle"] as const) : []),
      ...(au ? (["australia_addon"] as const) : []),
      ...(dj && hasWinningCoupon ? (["dj_pack_50"] as const) : []),
    ],
    [contracts, au, dj, hasWinningCoupon]
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

      {/* jackpot banner on checkout */}
      {hasWinningCoupon && luckyCoupon && (
        <div className="bg-gradient-to-r from-acid via-yellow-200 to-acid px-3 py-2 text-center">
          <p className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-ink sm:text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[10px] tracking-[0.16em] text-acid">
              🎉 1 in 10,000 WINNER
            </span>
            <span>
              Coupon <span className="font-mono">{luckyCoupon.code}</span> active
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-mono text-acid">
              ⏳ {remainingStr} left
            </span>
            <span className="hidden sm:inline text-[10px] tracking-[0.12em] opacity-60">
              • auto-added below — remove anytime
            </span>
          </p>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-5 flex flex-col items-center gap-3 text-center sm:mb-6">
          <p className="font-display text-[1.65rem] leading-[1.1] sm:text-4xl">ALMOST YOURS — SECURE CHECKOUT</p>
          <div className="flex flex-col items-center gap-2 min-[400px]:flex-row min-[400px]:gap-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blood sm:text-[12px] sm:tracking-widest">Founder pricing ends in</span>
            <FlipClock seconds={597} />
          </div>
          <LiveViewers />
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

                <label className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3.5 sm:p-4 ${contracts ? "border-acid/40 bg-acid/8" : "border-white/10 bg-black/30"}`}>
                  <input
                    type="checkbox"
                    checked={contracts}
                    onChange={(e) => setContracts(e.target.checked)}
                    className="mt-0.5 h-6 w-6 shrink-0 accent-yellow-400 sm:mt-1"
                  />
                  <div className="space-y-1">
                    <span className="block font-display text-lg uppercase">{PRODUCTS.contract_bundle.name}</span>
                    <span className="block text-sm text-acid">6 agreement templates plus a plain-English usage guide</span>
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

                <label className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3.5 sm:p-4 ${au ? "border-acid/40 bg-acid/8" : "border-white/10 bg-black/30"}`}>
                  <input
                    type="checkbox"
                    checked={au}
                    onChange={(e) => setAu(e.target.checked)}
                    className="mt-0.5 h-6 w-6 shrink-0 accent-yellow-400 sm:mt-1"
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

                {/* DJ PACK - Temu lucky wheel prize */}
                {hasWinningCoupon && luckyCoupon ? (
                  <label
                    className={`relative flex min-h-14 cursor-pointer items-start gap-3 overflow-hidden rounded-xl border p-3.5 sm:p-4 ${
                      dj ? "border-acid/60 bg-gradient-to-br from-acid/15 via-acid/8 to-transparent shadow-[0_0_20px_rgba(255,230,0,0.18)]" : "border-acid/30 bg-black/30"
                    }`}
                  >
                    {/* jackpot ribbon */}
                    <span className="pointer-events-none absolute right-0 top-0 rounded-bl-lg bg-gradient-to-r from-acid to-yellow-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-ink">
                      44% OFF • 1 in 10,000
                    </span>
                    <input
                      type="checkbox"
                      checked={dj}
                      onChange={(e) => setDj(e.target.checked)}
                      className="mt-0.5 h-6 w-6 shrink-0 accent-yellow-400 sm:mt-1"
                    />
                    <div className="w-full space-y-1 pr-2">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="block font-display text-lg uppercase leading-none">🎧 50 Verified DJ Contacts</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-acid px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-ink">
                          Jackpot
                        </span>
                      </span>
                      <span className="block text-sm font-bold text-acid">Club + mix-show + radio DJs — direct emails • city & genre sorted</span>
                      <span className="block text-[13px] leading-snug text-white/60">
                        The add-on that usually costs <span className="line-through">${DJ_COMPARE.toFixed(2)}</span> — yours for{" "}
                        <b className="text-acid">${DJ_PRICE.toFixed(2)}</b> with jackpot coupon.
                      </span>
                      {/* coupon code + timer */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-acid/30 bg-acid/10 px-2.5 py-1 font-mono text-xs font-bold tracking-[0.08em] text-white">
                          {luckyCoupon.code}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard?.writeText(luckyCoupon.code);
                            }}
                            className="rounded bg-white px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-ink hover:bg-acid"
                          >
                            Copy
                          </button>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-xs font-bold tabular-nums text-acid border border-white/10">
                          ⏳ {remainingStr} left
                        </span>
                      </div>
                      <span className="block text-sm mt-2">
                        <span className="mr-2 text-white/35 line-through">${DJ_COMPARE.toFixed(2)}</span>
                        <b className="text-acid">${DJ_PRICE.toFixed(2)}</b>{" "}
                        <span className="ml-1 rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-green-400 border border-green-500/20">
                          Save ${(DJ_COMPARE - DJ_PRICE).toFixed(2)}
                        </span>
                      </span>
                      <span className="block text-[11px] leading-snug text-white/40">
                        Winner ID: <b className="font-mono text-white/70">{luckyCoupon.winnerId}</b> • Verified live draw • Auto-applied at checkout • Digital delivery with Vault
                      </span>
                    </div>
                  </label>
                ) : isCouponExpired ? (
                  <div className="rounded-xl border border-blood/30 bg-blood/5 p-4">
                    <p className="font-display text-base uppercase text-blood">Your jackpot expired</p>
                    <p className="mt-1 text-sm leading-snug text-white/60">
                      Coupon <b className="font-mono text-white">{luckyCoupon?.code}</b> expired after 15 minutes. It returned to{" "}
                      <span className="line-through">${DJ_COMPARE.toFixed(2)}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenWheel?.()}
                      className="cta mt-3 w-full rounded-full bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-ink hover:bg-acid"
                    >
                      🎡 Spin again — free
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a22] to-black/40 p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ff3b82] to-[#7c5cff] text-lg">
                        🎧
                      </span>
                      <div className="flex-1">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-acid">Locked — spin to unlock 44% OFF</p>
                        <p className="mt-1 font-display text-[15px] leading-none">50 VERIFIED DJ CONTACTS — CLUB & RADIO</p>
                        <p className="mt-1 text-[12px] leading-snug text-white/50">
                          Direct emails for club, mix-show + radio DJs. City & genre sorted. Usually{" "}
                          <span className="line-through">${DJ_COMPARE.toFixed(2)}</span> — <b className="text-white">try to win it for $5</b>
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
                          🔒 Only 1 in 10,000 wins this price
                        </p>
                      </div>
                      <span className="hidden shrink-0 text-right sm:block">
                        <span className="block text-xs text-white/30 line-through">${DJ_COMPARE.toFixed(2)}</span>
                        <span className="block font-display text-xl leading-none text-white/60">$5</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenWheel?.()}
                      className="cta mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff3b82] via-[#7c5cff] to-[#00d4ff] px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-[0_6px_20px_rgba(124,92,255,0.35)]"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-ink text-sm">🎡</span>
                      Spin the wheel for a free discount
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">1 in 10,000</span>
                    </button>
                    <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-white/25">
                      Takes 5 seconds • No email needed • 342 spinning now
                    </p>
                  </div>
                )}
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
                <OrderSummaryRows contracts={contracts} au={au} dj={dj && hasWinningCoupon} saved={saved} total={total} coupon={luckyCoupon} remainingStr={remainingStr} />
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
              <OrderSummaryRows contracts={contracts} au={au} dj={dj && hasWinningCoupon} saved={saved} total={total} coupon={luckyCoupon} remainingStr={remainingStr} />
            </section>

            <section className="hidden rounded-xl border border-white/10 bg-panel p-5 lg:block">
              <StockBar />
            </section>

            {/* wheel teaser if not won - desktop */}
            {!hasWinningCoupon && !isCouponExpired && (
              <section className="hidden rounded-xl border border-white/10 bg-panel p-5 lg:block">
                <LuckyWheelButton onClick={() => onOpenWheel?.()} className="w-full justify-center" small />
                <p className="mt-2 text-center text-xs text-white/40">Only 1 in 10,000 wins the $5 DJ pack • 5 sec spin</p>
              </section>
            )}

            <section className="hidden rounded-xl border border-acid/40 bg-acid/5 p-5 text-[13px] leading-relaxed text-white/70 lg:block">
              <p className="font-display text-lg text-acid">WHAT HAPPENS NEXT</p>
              Stripe processes the payment securely inside this page. After payment, your order is verified server-side and your private downloads unlock from protected storage.
              {hasWinningCoupon && dj && (
                <span className="mt-2 block rounded-lg border border-acid/30 bg-acid/10 px-3 py-2 text-acid">
                  + Your jackpot DJ pack will be included as a separate download alongside the Vault.
                </span>
              )}
            </section>
          </aside>

          {/* right column — Stripe collects delivery + payment details once */}
          <section id="payment" className="space-y-3">
            <div className="rounded-lg border border-acid/25 bg-acid/5 px-4 py-3 text-center text-[12px] text-white/60 lg:hidden">
              <b className="text-acid">Next:</b> enter your email and payment details securely with Stripe.
            </div>
            <EmbeddedStripeCheckout items={items} bundleId={bundleId} />
            {/* mobile wheel button */}
            {!hasWinningCoupon && !isCouponExpired && (
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => onOpenWheel?.()}
                  className="w-full rounded-xl border border-white/10 bg-panel p-4 text-left"
                >
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-acid">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[#ff3b82] to-[#7c5cff] text-white text-xs">🎡</span>
                    Feeling lucky? Spin for 44% OFF
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">Try for 50 DJ contacts at $5 <span className="font-normal text-white/40 line-through">$8.99</span></p>
                  <p className="mt-1 text-xs text-white/40">Only 1 in 10,000 wins • Tap to spin rainbow wheel</p>
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* callback for demo flow compatibility */}
      <button type="button" onClick={() => onComplete(total, { contracts, au, dj: dj && hasWinningCoupon })} className="sr-only">
        sync
      </button>
    </div>
  );
}

function OrderSummaryRows({
  contracts,
  au,
  dj,
  saved,
  total,
  coupon,
  remainingStr,
}: {
  contracts: boolean;
  au: boolean;
  dj: boolean;
  saved: number;
  total: number;
  coupon?: LuckyCoupon | null;
  remainingStr?: string;
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
          accent
        />
      )}
      {au && (
        <SummaryRow
          label={PRODUCTS.australia_addon.shortName}
          was={`$${PRODUCTS.australia_addon.compareAt}`}
          now={`$${PRODUCTS.australia_addon.price.toFixed(2)}`}
          accent
        />
      )}
      {dj && coupon && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-acid/30 bg-acid/5 px-3 py-2 -mx-1">
          <span className="text-acid flex flex-col">
            <span className="flex items-center gap-1.5 font-bold">
              50 DJ Pack <span className="rounded-full bg-acid px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-ink">Jackpot</span>
            </span>
            <span className="text-[11px] font-mono text-white/50">{coupon.code} • ⏳ {remainingStr}</span>
          </span>
          <span className="shrink-0 whitespace-nowrap text-right">
            <span className="mr-2 text-white/30 line-through">${DJ_COMPARE.toFixed(2)}</span>
            <b className="text-acid">${DJ_PRICE.toFixed(2)}</b>
          </span>
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
      {dj && (
        <p className="text-center text-[11px] leading-snug text-white/30">
          Jackpot add-on included • Digital delivery • One-time use
        </p>
      )}
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
