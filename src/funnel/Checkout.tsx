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

function SecretSecondSpinCard({ onOpenWheel }: { onOpenWheel?: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  useEffect(() => {
    try { setRevealed(localStorage.getItem("rr_secret_playlist_revealed") === "1"); } catch {}
    const id = window.setInterval(() => {
      try { if (localStorage.getItem("rr_secret_playlist_revealed") === "1") setRevealed(true); } catch {}
    }, 900);
    const onStorage = () => { try { setRevealed(localStorage.getItem("rr_secret_playlist_revealed") === "1"); } catch {} };
    window.addEventListener("storage", onStorage);
    return () => { clearInterval(id); window.removeEventListener("storage", onStorage); };
  }, []);
  if (revealed) {
    return (
      <div className="overflow-hidden rounded-xl border-2 border-cyan-400 bg-gradient-to-br from-cyan-500/10 via-[#7c5cff]/10 to-black/40 p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-[#7c5cff] text-white">🤫</span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">SHHH... INDUSTRY SECRET UNLOCKED</p>
            <p className="text-sm font-black text-white">Your second prize is ready</p>
          </div>
          <span className="ml-auto hidden rounded-full bg-cyan-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-ink sm:inline-flex">FR2AZEF</span>
        </div>
        <div className="mt-3 rounded-xl border-2 border-dashed border-cyan-400/40 bg-black/40 p-3">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.16em] text-white/40">PLAYLIST CAMPAIGN DISCOUNT — tap to copy</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="font-mono text-2xl font-black tracking-[0.12em] text-white">FR2AZEF</span>
            <button
              type="button"
              onClick={() => { navigator.clipboard?.writeText("FR2AZEF"); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 1800); }}
              className="rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-ink hover:bg-white"
            >
              {codeCopied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <a href="https://playlistpush.com/" target="_blank" rel="noreferrer" className="mx-auto mt-3 flex w-fit items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-ink hover:bg-cyan-50">Open PlaylistPush.com →</a>
          <p className="mt-2 text-center text-[11px] italic text-white/40">“Shh, don’t tell anyone I gave it to you…”</p>
        </div>
        <p className="mt-2 text-center text-[11px] text-white/50">Use at <a href="https://playlistpush.com/" target="_blank" rel="noreferrer" className="font-bold text-cyan-300 underline">PlaylistPush.com</a> checkout — genuine promo code from your second spin</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border-2 border-cyan-400 bg-gradient-to-br from-cyan-500/15 via-[#7c5cff]/10 to-[#ff3b82]/10 p-4 shadow-[0_8px_24px_rgba(6,182,212,0.18)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-[#7c5cff] text-white shadow-[0_4px_14px_rgba(6,182,212,0.4)] animate-pulse">🤫</span>
        <div className="flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300 animate-pulse">ONE MORE SPIN — SECRET INSIDE</p>
          <p className="text-sm font-black leading-none text-white">You have one more chance!</p>
          <p className="text-xs leading-none text-white/60">Hidden industry code — always wins on second spin</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-600">1 spin left</span>
      </div>
      <div className="mt-3 rounded-xl border-2 border-dashed border-white/15 bg-black/30 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">Locked</p>
            <p className="font-mono text-lg font-black tracking-[0.16em] text-white/20 blur-[4px] select-none">FR2AZEF</p>
          </div>
          <span className="rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-ink">SHHH...</span>
        </div>
        <p className="mt-1 text-[11px] font-bold text-cyan-200">PLAYLIST CAMPAIGN DISCOUNT • Reveals on second spin</p>
      </div>
      <button type="button" onClick={() => onOpenWheel?.()} className="cta mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-[#7c5cff] to-[#00d4ff] px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-[0_8px_24px_rgba(6,182,212,0.35)] hover:brightness-[1.08]">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-ink text-sm">🎡</span>
        Spin Again — Reveal Secret Code →
      </button>
      <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-widest text-white/30">Always lands on <span className="text-cyan-300">SHHH... INDUSTRY SECRET</span> • FR2AZEF</p>
    </div>
  );
}

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
              🎉 1 in 10,000 WINNER
            </span>
            <span className="font-mono">{luckyCoupon.code}</span>
            <span className="hidden sm:inline opacity-40">•</span>
            <span>Founder Bundle $21 <span className="line-through opacity-50">$54</span></span>
            <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 font-mono text-acid">
              ⏳ {remainingStr}
            </span>
            <span className="hidden sm:inline text-[10px] tracking-[0.12em] opacity-60">
              • both add-ons pre-selected below
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
          <LiveViewers />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          {/* left column — selector + summary */}
          <aside className="space-y-4">
            {/* winner celebration card */}
            {hasWinningCoupon && luckyCoupon && (
              <div className="overflow-hidden rounded-xl border-2 border-acid bg-gradient-to-br from-acid/15 via-acid/5 to-transparent p-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-acid to-yellow-300 text-ink">🎉</span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-acid">Jackpot active — you feel lucky for a reason</p>
                    <p className="text-sm font-bold leading-none text-white">
                      Only <b className="text-acid">1 in 10,000</b> get this celebration at checkout
                    </p>
                  </div>
                  <span className="ml-auto hidden shrink-0 rounded-full bg-acid px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-ink sm:inline-flex">
                    ⏳ {remainingStr}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-acid/30 bg-acid/10 px-2.5 py-1 font-mono text-xs font-bold tracking-[0.08em] text-white">
                    {luckyCoupon.code}
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(luckyCoupon.code)}
                      className="rounded bg-white px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-ink hover:bg-acid"
                    >
                      Copy
                    </button>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-acid border border-white/10 sm:hidden">
                    ⏳ {remainingStr} left
                  </span>
                  <span className="text-xs text-white/60">
                    Winner <b className="font-mono text-white">{luckyCoupon.winnerId}</b> • Save <b className="text-acid">$33</b> on bundle
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-acid via-[#ff6b9d] to-[#00d4ff] transition-all duration-1000"
                    style={{ width: `${Math.max(8, (Math.max(0, luckyCoupon.expiresAt - nowMs) / (15 * 60 * 1000)) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-widest text-white/35">
                  Both add-ons below are pre-ticked because you won — untick if you really want to
                </p>
              </div>
            )}

            {/* second spin — secret code nudge at checkout — always visible after jackpot */}
            {hasWinningCoupon && luckyCoupon && (
              <SecretSecondSpinCard onOpenWheel={onOpenWheel} />
            )}

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
                    <span className="pointer-events-none absolute right-0 top-0 rounded-bl-lg bg-emerald-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">
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
                      <b className={hasWinningCoupon ? "text-acid" : "text-acid"}>${PRODUCTS.contract_bundle.price.toFixed(2)}</b>{" "}
                      {hasWinningCoupon && (
                        <span className="ml-1 rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-green-400 border border-green-500/20">
                          Save $16 • Pre-selected for winners
                        </span>
                      )}
                    </span>
                    <span className="block text-[12px] text-white/45"><Stars /> "Saved me from a nightmare split deal." — Jordan Meacham</span>
                    {hasWinningCoupon && (
                      <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-acid/70">
                        🎉 Winner price — {luckyCoupon.code} • ⏳ {remainingStr}
                      </span>
                    )}
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
                    <span className="pointer-events-none absolute right-0 top-0 rounded-bl-lg bg-emerald-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">
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
                    <span className="block text-sm font-bold text-acid">2,847 AU station contacts · 1,612 verified emails</span>
                    <span className="block text-sm text-white/65">{PRODUCTS.australia_addon.description}</span>
                    <span className="block text-sm">
                      <span className="mr-2 text-white/35 line-through">${PRODUCTS.australia_addon.compareAt}</span>
                      <b className="text-acid">${PRODUCTS.australia_addon.price.toFixed(2)}</b>{" "}
                      {hasWinningCoupon && (
                        <span className="ml-1 rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-green-400 border border-green-500/20">
                          Save $17 • Pre-selected for winners
                        </span>
                      )}
                    </span>
                    <span className="block text-[12px] text-white/45"><Stars /> "Got Unearthed airplay in 6 weeks from Ohio." — Dee R.</span>
                    {hasWinningCoupon && (
                      <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-acid/70">
                        🎉 Winner price — {luckyCoupon.code} • ⏳ {remainingStr}
                      </span>
                    )}
                  </span>
                </label>

                {/* not winner — spin teaser inside selector */}
                {!hasWinningCoupon && !isCouponExpired && (
                  <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a22] to-black/40 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-acid">Feeling lucky?</p>
                    <p className="mt-1 text-sm font-bold text-white">
                      Spin the rainbow wheel — <b className="text-acid">1 in 10,000</b> get a jackpot celebration for this bundle
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      Both add-ons are already <b className="text-white">$9 + $12</b> <span className="line-through">($25 + $29)</span> — winning just makes it feel <b className="text-white">really special</b> at checkout with your code, countdown & confetti.
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenWheel?.()}
                      className="cta mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff3b82] via-[#7c5cff] to-[#00d4ff] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_6px_20px_rgba(124,92,255,0.35)]"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-ink text-sm">🎡</span>
                      Spin the wheel for a free discount
                    </button>
                    <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-white/25">
                      342 spinning now • 3 jackpots / hr • 5 sec • no email
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

            <section className="hidden rounded-xl border border-white/10 bg-panel p-5 lg:block">
              <StockBar />
            </section>

            {/* wheel teaser if not won - desktop */}
            {!hasWinningCoupon && !isCouponExpired && (
              <section className="hidden rounded-xl border border-white/10 bg-panel p-5 lg:block">
                <LuckyWheelButton onClick={() => onOpenWheel?.()} className="w-full justify-center" small />
                <p className="mt-2 text-center text-xs text-white/40">Only 1 in 10,000 wins the jackpot celebration — 5 sec spin</p>
              </section>
            )}

            <section className="hidden rounded-xl border border-acid/40 bg-acid/5 p-5 text-[13px] leading-relaxed text-white/70 lg:block">
              <p className="font-display text-lg text-acid">WHAT HAPPENS NEXT</p>
              Stripe processes the payment securely inside this page. After payment, your order is verified server-side and your private downloads unlock from protected storage.
              {hasWinningCoupon && (
                <span className="mt-2 block rounded-lg border border-acid/30 bg-acid/10 px-3 py-2 text-acid font-bold">
                  🎉 Jackpot {luckyCoupon.code} — your two add-ons are highlighted as winner picks below. Keep them checked to claim the $33 savings celebration!
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
                    Feeling lucky? Spin for a winner feeling
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">Unlock the jackpot celebration for both add-ons</p>
                  <p className="mt-1 text-xs text-white/40">Only 1 in 10,000 wins • Rainbow wheel • ⏳ 15 min</p>
                </button>
              </div>
            )}
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
        <div className="rounded-lg border border-acid/30 bg-acid/5 px-3 py-2 text-center -mx-1">
          <p className="text-xs font-black uppercase tracking-widest text-acid">
            🎉 Jackpot {coupon.code} • ⏳ {remainingStr} • Save $33 on bundle
          </p>
          <p className="text-[11px] text-white/50">Both add-ons pre-selected because you won — 1 in 10,000</p>
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
      {hasWinningCoupon && (
        <p className="text-center text-[11px] leading-snug text-acid/70 font-bold">
          Winner celebration active — keep both boxes checked to claim the feeling 💛
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, was, now, accent, badge }: { label: string; was?: string; now: string; accent?: boolean; badge?: string }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${accent ? "rounded-lg border border-acid/20 bg-acid/5 px-2 py-1 -mx-2" : ""}`}>
      <span className={`${accent ? "text-acid font-bold" : "text-white/75"} flex items-center gap-1.5`}>
        {label}
        {badge && <span className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 text-[8px] font-black tracking-[0.08em] text-emerald-300">{badge}</span>}
      </span>
      <span className="shrink-0 whitespace-nowrap">
        {was && <span className="mr-2 text-white/30 line-through">{was}</span>}
        <b className={accent ? "text-acid" : ""}>{now}</b>
      </span>
    </div>
  );
}
