/* ─────────────────────────────────────────────────────────────
   STAGE 6 — THE DOWNSELL
   ─────────────────────────────────────────────────────────────
   Rejection-then-retreat. The seller "concedes" and the visitor
   feels the pull of reciprocity — a concession is supposed to be
   met with a concession.

   Two things are hidden inside the retreat:
     · the offer shrinks (file review removed) while the price
       does not — 3 × $67 = $201 against the $197 just declined,
     · the *salient* number falls from 197 to 67, and salience is
       what the decision is actually made on (partitioned
       pricing, Morwitz et al. 1998).
───────────────────────────────────────────────────────────── */

import { DOWNSELL } from "../copy";
import { OFFER, money } from "../core";
import { nav } from "../router";
import { useFunnel } from "../state";
import { Xray } from "../xray";

export default function Downsell() {
  const { cart, patch, teardown } = useFunnel();

  const accept = () => {
    patch({ cart: { ...cart, downsell: true } });
    nav("/thanks");
  };

  const decline = () => {
    patch({ declinedDownsell: true });
    nav("/thanks");
  };

  const ladderTotal = OFFER.downsellPerMonth * OFFER.downsellMonths;

  return (
    <div className="min-h-screen bg-ink pb-20">
      <div className="border-b border-white/10 bg-white/[0.03]">
        <p className="mx-auto max-w-3xl px-4 py-2.5 text-center text-[12px] text-white/50">
          Your order is still open — one adjustment before the receipt
        </p>
      </div>

      <Xray id="downsell-ladder" className="mx-auto max-w-2xl px-4 pt-10">
        <section className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-400">
            {DOWNSELL.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-[1.9rem] uppercase leading-[0.94] text-white sm:text-4xl">
            {DOWNSELL.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/65">
            {DOWNSELL.body}
          </p>

          <div className="mt-8 rounded-xl border border-white/12 bg-panel p-6">
            <div className="flex items-end justify-center gap-2">
              <span className="font-display text-6xl leading-none text-acid">
                {money(OFFER.downsellPerMonth)}
              </span>
              <span className="pb-1.5 text-[13px] text-white/50">
                today, then ×{OFFER.downsellMonths - 1}
              </span>
            </div>
            <p className="mt-2 text-[11px] uppercase tracking-wider text-white/35">
              {OFFER.downsellMonths} payments · {money(ladderTotal)} total
            </p>

            <button
              type="button"
              onClick={accept}
              className="mt-6 w-full rounded-lg bg-acid px-6 py-4 text-base font-black uppercase tracking-wide text-ink transition hover:brightness-95"
            >
              {DOWNSELL.acceptCta}
            </button>

            <button
              type="button"
              onClick={decline}
              className="mx-auto mt-4 block text-[11px] lowercase text-white/28 underline underline-offset-2 hover:text-white/45"
            >
              {DOWNSELL.declineCta}
            </button>
          </div>

          <p className="mt-4 text-[12px] italic text-white/40">
            {DOWNSELL.pressure}
          </p>

          {teardown && (
            <div className="mt-6 rounded border border-dashed border-xray/60 p-3 text-left font-mono text-[11px] leading-relaxed text-xray">
              <p>
                declined: {money(OFFER.oto)} · offered instead:{" "}
                {OFFER.downsellMonths} × {money(OFFER.downsellPerMonth)} ={" "}
                {money(ladderTotal)} — the “discount” costs{" "}
                {money(ladderTotal - OFFER.oto)} more.
              </p>
              <p className="mt-1.5">
                Deliverables also *decrease* (file review removed). The
                concession is entirely presentational: 197 → 67 in the visual
                hierarchy, which is the only number most people compare.
              </p>
            </div>
          )}
        </section>
      </Xray>
    </div>
  );
}
