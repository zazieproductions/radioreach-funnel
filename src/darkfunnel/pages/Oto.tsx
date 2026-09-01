/* ─────────────────────────────────────────────────────────────
   STAGE 5 — THE OTO
   ─────────────────────────────────────────────────────────────
   Fired the instant the "charge" clears, before the receipt.
   The visitor's self-concept has just changed from prospect to
   buyer, and consistency pressure peaks in that window: the
   cheapest yes a funnel ever gets is the one immediately after
   the first yes.

   The decline is a link, lowercase, written as a confession.
   That asymmetry — button vs. self-accusation — is the pattern
   Brignull named confirmshaming.
───────────────────────────────────────────────────────────── */

import { OTO } from "../copy";
import { OFFER, money } from "../core";
import { nav } from "../router";
import { useFunnel } from "../state";
import { Countdown, SocialToasts } from "../widgets";
import { Xray } from "../xray";

export default function Oto() {
  const { cart, patch, lead, teardown } = useFunnel();

  const accept = () => {
    patch({ cart: { ...cart, oto: true } });
    nav("/thanks");
  };

  const decline = () => {
    patch({ declinedOto: true });
    nav("/downsell");
  };

  return (
    <div className="min-h-screen bg-ink pb-20">
      <div className="border-b border-emerald-400/25 bg-emerald-400/[0.07]">
        <p className="mx-auto max-w-3xl px-4 py-2.5 text-center text-[12px] text-emerald-400">
          ✓ Order confirmed{lead?.firstName ? `, ${lead.firstName}` : ""} — do
          not close this page, your order is not finished
        </p>
      </div>

      <Xray id="post-purchase-oto" className="mx-auto max-w-3xl px-4 pt-8">
        <section>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.24em] text-blood df-pulse">
            {OTO.eyebrow}
          </p>
          <h1 className="mt-3 text-center font-display text-[2rem] uppercase leading-[0.92] text-white sm:text-5xl">
            {OTO.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[15px] leading-relaxed text-white/65">
            {OTO.body}
          </p>

          <ul className="mx-auto mt-7 max-w-xl space-y-2.5">
            {OTO.bullets.map((b) => (
              <li
                key={b}
                className="flex gap-3 rounded-lg border border-white/10 bg-panel p-3.5 text-[14px] leading-snug text-white/80"
              >
                <span className="text-acid">✓</span>
                {b}
              </li>
            ))}
          </ul>

          <div className="mx-auto mt-8 max-w-xl rounded-xl border border-acid/25 bg-gradient-to-b from-acid/[0.08] to-transparent p-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
              Tier II · one-time price
            </p>
            <p className="mt-2 flex items-baseline justify-center gap-3">
              <span className="font-display text-xl text-white/30 line-through decoration-blood decoration-2">
                {money(OFFER.otoAnchor)}
              </span>
              <span className="font-display text-5xl leading-none text-acid">
                {money(OFFER.oto)}
              </span>
            </p>

            <button
              type="button"
              onClick={accept}
              className="mt-5 w-full rounded-lg bg-acid px-6 py-4 text-[15px] font-black uppercase leading-tight tracking-wide text-ink transition hover:brightness-95"
            >
              {OTO.acceptCta}
            </button>

            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-white/45">
              <span>This screen expires in</span>
              <Countdown size="sm" />
            </div>

            {/* ── the guilt decline ────────────────────── */}
            <Xray id="guilt-decline" className="mt-5">
              <button
                type="button"
                onClick={decline}
                className="mx-auto block max-w-xs text-[11px] lowercase leading-relaxed text-white/28 underline underline-offset-2 transition hover:text-white/45"
              >
                {OTO.declineCta}
              </button>
            </Xray>
          </div>

          <p className="mx-auto mt-5 max-w-xl text-center text-[12px] italic text-blood/80">
            {OTO.pressure}
          </p>

          {teardown && (
            <p className="mx-auto mt-5 max-w-xl rounded border border-dashed border-xray/60 p-3 font-mono text-[11px] leading-relaxed text-xray">
              accept: 18px black uppercase on full-width acid · decline: 11px
              lowercase 28%-opacity grey, phrased in the first person as an
              admission of failure. Same page, two hierarchies. The visitor
              must insult themselves to exercise a legitimate option.
            </p>
          )}
        </section>
      </Xray>

      <SocialToasts />
    </div>
  );
}
