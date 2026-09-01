/* ─────────────────────────────────────────────────────────────
   STAGE 7 — THANK YOU / THE META REVEAL
   ─────────────────────────────────────────────────────────────
   First the receipt, rendered exactly as a real funnel would
   render it — because the swap is the point. Then the reveal:
   the product is vapor, and the itemised list underneath is the
   real transaction. Every pattern that actually rendered in
   front of this visitor is printed back at them, in order,
   with the time it appeared.
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { PATTERNS_BY_ID, RISK_COLOR, RISK_LABEL } from "../annotations";
import { BRAND, REVEAL_META } from "../copy";
import { cartTotal, money, OFFER } from "../core";
import { nav } from "../router";
import { useFunnel } from "../state";
import { inspectPattern } from "../xray";

export default function ThankYou() {
  const {
    cart,
    lead,
    orderRef,
    exposures,
    verdict,
    declinedOto,
    declinedDownsell,
    elapsed,
    setTeardown,
    reset,
  } = useFunnel();
  const [revealed, setRevealed] = useState(false);

  const total = cartTotal(cart);
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  const lines = [
    cart.tripwire && { label: "The Protocol (screened release)", amount: OFFER.tripwire },
    cart.bump && { label: "Compliance Pack — pre-selected", amount: OFFER.bump },
    cart.oto && { label: "Tier II campaign layer", amount: OFFER.oto },
    cart.downsell && {
      label: `Tier II split — ${OFFER.downsellMonths} × ${money(OFFER.downsellPerMonth)}`,
      amount: OFFER.downsellPerMonth * OFFER.downsellMonths,
    },
  ].filter(Boolean) as { label: string; amount: number }[];

  return (
    <div className="min-h-screen bg-ink pb-20">
      <div className="mx-auto max-w-2xl px-4 pt-10">
        {/* ── the receipt ─────────────────────────────────── */}
        <section className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.05] p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-emerald-400/50 bg-emerald-400/10 text-2xl text-emerald-400">
            ✓
          </div>
          <h1 className="mt-4 font-display text-3xl uppercase leading-none text-white sm:text-4xl">
            Order complete
          </h1>
          <p className="mt-2 text-[13px] text-white/55">
            Receipt {orderRef ?? "RR-0000-0000"} ·{" "}
            {lead?.email ?? "you@example.com"}
          </p>

          <div className="mt-6 space-y-2 text-left text-[14px]">
            {lines.map((l) => (
              <div key={l.label} className="flex justify-between gap-3">
                <span className="text-white/70">{l.label}</span>
                <span className="tnum text-white">{money(l.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-white/10 pt-2">
              <span className="font-bold uppercase tracking-wide text-white">
                Charged
              </span>
              <span className="tnum font-display text-2xl leading-none text-acid">
                {money(0)}
              </span>
            </div>
            <p className="text-right text-[11px] text-white/40">
              cart value {money(total)} · amount actually taken $0.00
            </p>
          </div>
        </section>

        {/* ── the meta reveal ─────────────────────────────── */}
        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-6 w-full rounded-lg border border-white/15 bg-panel px-6 py-4 text-[14px] font-bold uppercase tracking-wide text-white/80 transition hover:border-white/35 hover:text-white"
          >
            Where is my download? →
          </button>
        ) : (
          <section className="df-rise mt-8">
            <h2 className="font-display text-[2rem] uppercase leading-[0.92] text-blood sm:text-5xl">
              {REVEAL_META.title}
            </h2>
            {REVEAL_META.body.map((p, i) => (
              <p
                key={i}
                className="mt-3 text-[15px] leading-relaxed text-white/70"
              >
                {p}
              </p>
            ))}

            {/* ── the real receipt ───────────────────────── */}
            <div className="mt-7 rounded-xl border border-xray/30 bg-panel p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-xray">
                  Attention receipt
                </p>
                <p className="tnum font-mono text-[11px] text-white/45">
                  {minutes}m {String(seconds).padStart(2, "0")}s in funnel ·{" "}
                  {exposures.length} patterns
                </p>
              </div>

              <ul className="mt-3 space-y-1.5">
                {exposures.map((e, i) => {
                  const p = PATTERNS_BY_ID[e.id];
                  if (!p) return null;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => inspectPattern(e.id)}
                        className="flex w-full items-baseline gap-2 rounded px-1.5 py-1 text-left transition hover:bg-white/5"
                      >
                        <span className="tnum font-mono text-[10px] text-white/25">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-[13px] text-white/80">
                          {p.label}
                          {e.count > 1 && (
                            <span className="ml-1.5 font-mono text-[10px] text-white/35">
                              ×{e.count}
                            </span>
                          )}
                        </span>
                        <span
                          className="shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-ink"
                          style={{ background: RISK_COLOR[p.risk] }}
                        >
                          {RISK_LABEL[p.risk]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
                <Stat
                  k="Quiz score"
                  v={verdict ? verdict.score.toFixed(2) : "—"}
                  sub="gated nothing"
                />
                <Stat
                  k="Bump"
                  v={cart.bump ? "kept" : "removed"}
                  sub={cart.bump ? "default won" : "you noticed"}
                />
                <Stat
                  k="Ladder"
                  v={
                    cart.oto
                      ? "accepted"
                      : cart.downsell
                        ? "downsold"
                        : declinedOto && declinedDownsell
                          ? "declined ×2"
                          : "declined"
                  }
                  sub="post-purchase"
                />
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setTeardown(true);
                  reset();
                  nav("/hook");
                }}
                className="rounded-lg bg-acid px-5 py-3.5 text-[13px] font-black uppercase tracking-wide text-ink transition hover:brightness-95"
              >
                Run it again with x-ray on
              </button>
              <button
                type="button"
                onClick={() => nav("/teardown")}
                className="rounded-lg border border-white/15 bg-panel px-5 py-3.5 text-[13px] font-bold uppercase tracking-wide text-white/80 transition hover:border-white/35 hover:text-white"
              >
                Read the full teardown
              </button>
            </div>

            <p className="mt-8 border-t border-white/10 pt-4 font-mono text-[10px] leading-relaxed text-white/30">
              {BRAND.product} does not exist. No payment processor was
              contacted, no email was stored or transmitted, and every
              statistic on every screen was generated from a seeded PRNG. This
              build is a research replica and is excluded from the production
              bundle.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
      <p className="font-display text-lg uppercase leading-none text-acid">{v}</p>
      <p className="mt-1 text-[9px] uppercase tracking-wider text-white/45">{k}</p>
      <p className="mt-0.5 font-mono text-[9px] text-white/25">{sub}</p>
    </div>
  );
}
