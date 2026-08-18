import { useEffect, useMemo, useState } from "react";
import { FlipClock, InlineCountdown, PaymentBadges, Stars } from "./ui";
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
  /** Returns to the sales page without leaving the site. */
  onBack?: () => void;
};

const BASE = PRODUCTS.vault_core.price;
const CONTRACTS_PRICE = PRODUCTS.contract_bundle.price;
const AU_PRICE = PRODUCTS.australia_addon.price;

export default function Checkout({
  onComplete,
  luckyCoupon,
  onOpenWheel,
  onBack,
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

  const toggleAddon = (key: "contract_bundle" | "australia_addon", next: boolean) => {
    if (key === "contract_bundle") setContracts(next);
    else setAu(next);
    trackCustom("checkout_addon_toggle", { addon: key, selected: next });
  };

  return (
    <div className="min-h-screen bg-ink">
      {/* Mobile command strip: an escape hatch that stays on-site, the trust
          cue, and the live deadline — one 40px row instead of three blocks. */}
      <div className="mobile-solid sticky top-0 z-40 flex items-center gap-2 border-b border-white/10 bg-ink/95 px-2 py-1.5 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={onBack}
          className="pressable -ml-1 flex items-center gap-1 rounded-lg px-2 py-2 text-[12px] font-bold text-white/60"
          aria-label="Back to the offer"
        >
          <span aria-hidden>←</span> Back
        </button>
        <p className="mx-auto flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-white/70">
          <span aria-hidden>🔒</span> Secure Stripe checkout
        </p>
        <span className="tnum shrink-0 rounded-md border border-blood/40 bg-blood/10 px-2 py-1 font-display text-[13px] leading-none text-white">
          <InlineCountdown seconds={597} />
        </span>
      </div>

      <p className="hidden bg-blood py-2 text-center text-[11px] font-black uppercase tracking-[0.16em] lg:block">
        Secure checkout — payment handled by Stripe inside this page
      </p>

      {/* jackpot banner on checkout — makes the pre-selected upsells feel like a win */}
      {hasWinningCoupon && luckyCoupon && (
        <div className="bg-gradient-to-r from-acid via-yellow-200 to-acid px-3 py-2 text-center sm:py-2.5">
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

      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-8">
        {/* Desktop header. On mobile the sticky strip above already carries
            the same three signals without costing a screen of scroll. */}
        <div className="mb-6 hidden flex-col items-center gap-3 text-center lg:flex">
          <p className="font-display text-4xl">ALMOST YOURS — SECURE CHECKOUT</p>
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-bold uppercase tracking-widest text-blood">Founder pricing ends in</span>
            <FlipClock seconds={597} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr] lg:gap-6">
          {/* ───────── MOBILE: one compact, editable order card ───────── */}
          <section className="rounded-xl border border-white/10 bg-panel p-3 lg:hidden">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-lg uppercase leading-none">Your order</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-acid">
                You save ${saved.toFixed(2)}
              </p>
            </div>

            <ul className="mt-2.5 space-y-1.5">
              <li className="flex items-center gap-2.5 rounded-lg border border-acid/40 bg-acid/8 px-3 py-2.5">
                <span
                  aria-hidden
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-acid text-[12px] font-black text-ink"
                >
                  ✓
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold">
                    {PRODUCTS.vault_core.shortName}
                  </span>
                  <span className="block text-[11px] leading-tight text-white/50">
                    18,000+ contacts · instant download
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[10px] leading-none text-white/30 line-through">
                    ${PRODUCTS.vault_core.compareAt}
                  </span>
                  <span className="font-display text-[15px] leading-tight text-acid">
                    ${PRODUCTS.vault_core.price}
                  </span>
                </span>
              </li>

              <CompactAddonRow
                checked={contracts}
                onChange={(v) => toggleAddon("contract_bundle", v)}
                title={PRODUCTS.contract_bundle.shortName}
                sub="6 agreement templates + usage guide"
                was={PRODUCTS.contract_bundle.compareAt}
                now={PRODUCTS.contract_bundle.price}
                won={hasWinningCoupon}
              />

              <CompactAddonRow
                checked={au}
                onChange={(v) => toggleAddon("australia_addon", v)}
                title={PRODUCTS.australia_addon.shortName}
                sub="2,847 AU station contacts"
                was={PRODUCTS.australia_addon.compareAt}
                now={PRODUCTS.australia_addon.price}
                won={hasWinningCoupon}
              />
            </ul>

            <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5">
              <span className="font-display text-base uppercase leading-none">Total today</span>
              <span className="font-display text-[1.75rem] leading-none text-acid">
                ${total.toFixed(2)}
              </span>
            </div>

            {hasWinningCoupon && luckyCoupon && (
              <p className="mt-2 rounded-lg border border-acid/30 bg-acid/10 px-2.5 py-1.5 text-center text-[10.5px] font-black uppercase tracking-wider text-acid">
                🎉 {luckyCoupon.code} · ⏳ {remainingStr} · bundle saving applied
              </p>
            )}

            <details className="group mt-2">
              <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 py-1.5 text-[11.5px] font-bold text-white/45 [&::-webkit-details-marker]:hidden">
                What's inside the add-ons?
                <span aria-hidden className="inline-block transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <div className="space-y-2 pt-1 text-[12px] leading-snug text-white/55">
                <p>
                  <b className="text-white/80">{PRODUCTS.contract_bundle.shortName}:</b> composer,
                  artist/producer, mechanical licence, work-for-hire, session release and sync
                  agreements, plus a plain-English guide. An educational template kit, not legal advice.
                </p>
                <p>
                  <b className="text-white/80">{PRODUCTS.australia_addon.shortName}:</b> triple j /
                  Unearthed, community radio, commercial networks and regional stations —
                  1,612 verified emails.
                </p>
              </div>
            </details>
          </section>

          {/* ───────── DESKTOP: the full selector + summary column ───────── */}
          <aside className="hidden space-y-4 lg:block">
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
                    onChange={(e) => toggleAddon("contract_bundle", e.target.checked)}
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
                    onChange={(e) => toggleAddon("australia_addon", e.target.checked)}
                    className="mt-0.5 h-6 w-6 shrink-0 accent-yellow-400 sm:mt-1"
                  />
                  <span className="space-y-1 pr-2 w-full">
                    <span className="block font-display text-lg uppercase leading-none">{PRODUCTS.australia_addon.name}</span>
                    <span className="block text-sm font-bold text-acid">2,847 AU station contacts · 1,612 verified emails</span>
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
              <OrderSummaryRows contracts={contracts} au={au} saved={saved} total={total} coupon={luckyCoupon} remainingStr={remainingStr} hasWinningCoupon={hasWinningCoupon} />
            </section>

            <section className="rounded-xl border border-acid/40 bg-acid/5 p-5 text-[13px] leading-relaxed text-white/70">
              <p className="font-display text-lg text-acid">WHAT HAPPENS NEXT</p>
              Stripe processes the payment securely inside this page. After payment, your order is verified server-side and your private downloads unlock from protected storage.
            </section>
          </aside>

          {/* right column — Stripe collects delivery + payment details once */}
          <section id="payment" className="space-y-3">
            <EmbeddedStripeCheckout items={items} bundleId={bundleId} />

            <div className="lg:hidden">
              <PaymentBadges />
              <p className="mt-2 text-center text-[11px] leading-snug text-white/45">
                Your download links unlock on the next screen, the second the payment clears.
                30-day refund, no questions.
              </p>
            </div>
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

/**
 * One-line add-on row for phones: name, one clarifying clause, price, toggle.
 * The full description lives one tap away so the payment form stays within
 * a thumb's reach of the total.
 */
function CompactAddonRow({
  checked,
  onChange,
  title,
  sub,
  was,
  now,
  won,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  sub: string;
  was?: number;
  now: number;
  won?: boolean;
}) {
  return (
    <li>
      <label
        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
          checked ? "border-acid/40 bg-acid/8" : "border-white/10 bg-black/30"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-yellow-400"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold">
            {title}
            {won && (
              <span className="ml-1.5 rounded-full bg-[linear-gradient(90deg,#FACC15,#FB923C,#F472B6,#A78BFA)] px-1.5 py-0.5 align-middle text-[8px] font-black tracking-[0.06em] text-zinc-900">
                WON
              </span>
            )}
          </span>
          <span className="block text-[11px] leading-tight text-white/50">{sub}</span>
        </span>
        <span className="shrink-0 text-right">
          {was && (
            <span className="block text-[10px] leading-none text-white/30 line-through">${was}</span>
          )}
          <span className={`font-display text-[15px] leading-tight ${checked ? "text-acid" : "text-white/60"}`}>
            +${now}
          </span>
        </span>
      </label>
    </li>
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
