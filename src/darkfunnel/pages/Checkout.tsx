/* ─────────────────────────────────────────────────────────────
   STAGE 4 — CHECKOUT (demo)
   ─────────────────────────────────────────────────────────────
   No processor, no token, no network. The card field is inert
   and pre-filled with the well-known test number so nobody can
   type a real one into it.

   The persuasion here is almost entirely in the defaults: the
   order bump arrives pre-checked, which converts it from a
   decision into a chore. Opt-out consistently beats opt-in by a
   multiple for the same offer at the same price, and pre-ticked
   boxes for paid extras are outright unlawful in the EU.
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { CHECKOUT } from "../copy";
import { OFFER, cartTotal, claimedSavings, money, orderId } from "../core";
import { nav } from "../router";
import { useFunnel } from "../state";
import { Countdown, ExitIntent, ScarcityRail, SocialToasts, SupportChat } from "../widgets";
import { Xray } from "../xray";

export default function Checkout() {
  const { cart, patch, lead, seed, teardown, verdict } = useFunnel();
  const [bump, setBump] = useState<boolean>(CHECKOUT.bump.defaultChecked);
  const [paying, setPaying] = useState(false);

  const preview = { ...cart, tripwire: true, bump };
  const total = cartTotal(preview);
  const saved = claimedSavings(preview);

  const pay = () => {
    if (paying) return;
    setPaying(true);
    window.setTimeout(() => {
      patch({
        cart: { ...cart, tripwire: true, bump },
        orderRef: orderId(seed),
      });
      nav("/oto");
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-ink pb-24">
      <ScarcityRail />

      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-400">
            {verdict ? `${verdict.headline} · file held 09:00` : "File held 09:00"}
          </p>
          <h1 className="mt-2 font-display text-3xl uppercase leading-[0.95] text-white sm:text-5xl">
            {CHECKOUT.title}
          </h1>
          <p className="mt-2 text-[14px] text-white/55">{CHECKOUT.sub}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          {/* ── the form ─────────────────────────────────── */}
          <div className="rounded-xl border border-white/10 bg-panel p-5">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-white/45">
                  Email
                </label>
                <input
                  readOnly
                  value={lead?.email ?? "you@example.com"}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-[15px] text-white/70"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-white/45">
                  Card number
                </label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-3">
                  <input
                    readOnly
                    value="4242 4242 4242 4242"
                    aria-label="Demo card number, inert"
                    className="tnum min-w-0 flex-1 bg-transparent text-[15px] text-white/70 focus:outline-none"
                  />
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/50">
                    demo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-white/45">
                    Expiry
                  </label>
                  <input
                    readOnly
                    value="12 / 34"
                    className="tnum mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-[15px] text-white/70"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-white/45">
                    CVC
                  </label>
                  <input
                    readOnly
                    value="•••"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-[15px] text-white/70"
                  />
                </div>
              </div>
            </div>

            {/* ── the pre-checked bump ───────────────────── */}
            <Xray id="pre-checked-bump" className="mt-5">
              <label
                className={`flex cursor-pointer gap-3 rounded-lg border-2 border-dashed p-4 transition ${
                  bump
                    ? "border-acid/70 bg-acid/[0.08]"
                    : "border-white/15 bg-white/[0.02]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={bump}
                  onChange={(e) => setBump(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#ffe600]"
                />
                <span>
                  <span className="block text-[14px] font-black uppercase tracking-wide text-acid">
                    {CHECKOUT.bump.title}
                  </span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-white/65">
                    {CHECKOUT.bump.body}
                  </span>
                </span>
              </label>
              {teardown && (
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-xray">
                  defaultChecked = true. Un-ticking is an action; buying is
                  inaction. EU CRD Art. 22 prohibits exactly this box.
                </p>
              )}
            </Xray>

            <button
              type="button"
              onClick={pay}
              disabled={paying}
              className="mt-5 w-full rounded-lg bg-acid px-6 py-4 text-base font-black uppercase tracking-wide text-ink transition hover:brightness-95 disabled:opacity-70"
            >
              {paying ? "Authorising…" : `${CHECKOUT.payCta} · ${money(total)}`}
            </button>

            <Xray id="trust-badges" className="mt-3">
              <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-wider text-white/40">
                {CHECKOUT.trust.map((t) => (
                  <li key={t}>🔒 {t}</li>
                ))}
              </ul>
            </Xray>

            <p className="mt-3 text-center font-mono text-[10px] leading-relaxed text-white/30">
              {CHECKOUT.legal}
            </p>
          </div>

          {/* ── order summary ────────────────────────────── */}
          <aside className="h-fit rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
              Your order
            </p>

            <div className="mt-3 space-y-2 text-[14px]">
              <div className="flex justify-between gap-3">
                <span className="text-white/70">The Protocol (screened)</span>
                <span className="tnum text-white">{money(OFFER.tripwire)}</span>
              </div>
              {bump && (
                <div className="flex justify-between gap-3">
                  <span className="text-white/70">Compliance Pack</span>
                  <span className="tnum text-white">{money(OFFER.bump)}</span>
                </div>
              )}
              <div className="flex justify-between gap-3 border-t border-white/10 pt-2">
                <span className="font-bold uppercase tracking-wide text-white">
                  Total
                </span>
                <span className="tnum font-display text-2xl leading-none text-acid">
                  {money(total)}
                </span>
              </div>
              <p className="text-right text-[11px] text-emerald-400">
                You “save” {money(saved)}
              </p>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                Price held for
              </p>
              <div className="mt-1">
                <Countdown />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {paying && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/85 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-acid" />
            <p className="mt-4 font-mono text-[13px] text-white/70">
              contacting nobody · charging nothing
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/35">
              this delay exists to make the next screen feel like a receipt
            </p>
          </div>
        </div>
      )}

      <SocialToasts />
      <SupportChat />
      <ExitIntent onStay={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
    </div>
  );
}
