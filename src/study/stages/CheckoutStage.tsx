/* ─────────────────────────────────────────────────────────────
   STAGE 4 — CHECKOUT
   ─────────────────────────────────────────────────────────────
   A demo payment form with a pre-checked order bump.

   NOTHING IS CHARGED AND NOTHING IS TRANSMITTED. The card field
   accepts one value — the literal string 4242 — and the "charge"
   is a setTimeout. There is no payment provider imported here on
   purpose.

   The bump is pre-checked, framed as a risk warning, and its
   removal is deliberately quieter than its acceptance. That
   asymmetry is the entire mechanism (Johnson & Goldstein 2003).
───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { Annotated } from "../Annotate";
import { Countdown, ProgressBar, ScarcityRail } from "../chrome";
import {
  addToCart,
  cartTotal,
  pace,
  removeFromCart,
  setCart,
  trip,
  useStudy,
} from "../state";

const CORE = { id: "vault", label: "The Vault — 18,412 verified contacts", price: 29 };
const BUMP = {
  id: "bump",
  label: "Deliverability Layer — inbox placement audit + warm-up sequence",
  price: 9,
  preChecked: true,
};

export default function CheckoutStage({ onPaid }: { onPaid: () => void }) {
  const s = useStudy();
  const [bumpOn, setBumpOn] = useState(true);
  const [card, setCard] = useState("");
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState("");

  // Seed the cart with the bump already in it — the default IS the dark pattern.
  useEffect(() => {
    setCart([CORE, { ...BUMP }]);
    trip(
      "prechecked_bump",
      "A $9 add-on was already in your cart when the page loaded. You had to act to remove it, not to accept it."
    );
  }, []);

  const toggleBump = () => {
    const next = !bumpOn;
    setBumpOn(next);
    if (next) addToCart({ ...BUMP });
    else {
      removeFromCart(BUMP.id);
      trip(
        "prechecked_bump",
        "You noticed the pre-checked add-on and removed it. Most people do not — opt-out defaults hold at 60–90%."
      );
    }
  };

  const total = cartTotal();

  const pay = (e: React.FormEvent) => {
    e.preventDefault();
    if (card.replace(/\s/g, "") !== "4242") {
      return setErr("Demo mode: type 4242. No real card is accepted or stored.");
    }
    setErr("");
    setProcessing(true);
    window.setTimeout(() => onPaid(), pace(1600));
  };

  return (
    <div className="min-h-screen bg-ink pb-24">
      <p className="bg-blood py-2 text-center text-[11px] font-black uppercase tracking-[0.16em]">
        Simulated checkout · no payment processor is connected
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 border-b border-white/10 bg-black/50 px-4 py-2.5">
        <Countdown />
        <ScarcityRail />
      </div>

      <div className="mx-auto max-w-xl px-4 py-8">
        <ProgressBar pct={100} caption="Slot held" />

        <h1 className="mt-6 font-display text-[1.8rem] leading-[1.06] sm:text-4xl">
          {s.lead?.name ? `${s.lead.name.toUpperCase()}, ` : ""}YOUR SLOT IS HELD.
        </h1>

        {s.selfPrediction && (
          <Annotated pattern="self_prediction" className="mt-4">
            <p className="rounded-lg border border-acid/25 bg-acid/5 p-3 text-[13px] leading-relaxed text-white/75">
              Ninety seconds ago you answered{" "}
              <b className="text-acid">“{s.selfPrediction}”</b>. This is the door.
            </p>
          </Annotated>
        )}

        {/* ── order summary ── */}
        <div className="mt-6 rounded-xl border border-white/10 bg-panel p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            Your order
          </p>

          <div className="mt-4 flex items-start justify-between gap-3 border-b border-white/10 pb-4">
            <p className="text-[14px] font-semibold text-white/85">{CORE.label}</p>
            <p className="shrink-0 font-display text-xl text-acid">${CORE.price}</p>
          </div>

          {/* ── THE PRE-CHECKED BUMP ── */}
          <Annotated pattern="prechecked_bump" className="mt-4">
            <label className="flex cursor-pointer gap-3 rounded-lg border-2 border-dashed border-acid/50 bg-acid/5 p-4">
              <input
                type="checkbox"
                checked={bumpOn}
                onChange={toggleBump}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#ffe600]"
              />
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-blood">
                  Recommended · added for you
                </span>
                <span className="mt-1 block text-[14px] font-bold text-white">
                  {BUMP.label} — ${BUMP.price}
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed text-white/60">
                  The list is only as good as your inbox reputation. Most people
                  who skip this write in within 30 days asking why their sends went
                  to spam.
                </span>
              </span>
            </label>
          </Annotated>

          <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
            <p className="text-[11px] uppercase tracking-widest text-white/40">
              Total due
            </p>
            <p className="tnum font-display text-4xl text-acid">${total}</p>
          </div>
        </div>

        {/* ── demo payment ── */}
        <form onSubmit={pay} className="mt-6 rounded-xl border border-white/10 bg-panel p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            Payment
          </p>
          <div className="mt-4 space-y-3">
            <input
              value={s.lead?.email ?? ""}
              readOnly
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3.5 text-white/50"
            />
            <input
              value={card}
              onChange={(e) => setCard(e.target.value)}
              placeholder="Card number — type 4242"
              inputMode="numeric"
              className="w-full rounded-lg border border-white/12 bg-black/40 px-4 py-3.5 font-mono text-white placeholder:text-white/25"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="MM / YY"
                className="w-full rounded-lg border border-white/12 bg-black/40 px-4 py-3.5 font-mono text-white placeholder:text-white/25"
              />
              <input
                placeholder="CVC"
                className="w-full rounded-lg border border-white/12 bg-black/40 px-4 py-3.5 font-mono text-white placeholder:text-white/25"
              />
            </div>
          </div>
          {err && <p className="mt-3 text-[12px] font-bold text-blood">{err}</p>}

          <button
            type="submit"
            disabled={processing}
            className="cta mt-5 w-full rounded-lg bg-acid px-5 py-4 font-display text-lg uppercase leading-tight tracking-wide text-ink sm:text-xl"
          >
            {processing ? "Authorising…" : `Complete order — $${total}`}
          </button>
          <p className="mt-3 text-center text-[10px] leading-relaxed text-white/25">
            Simulation. No card is validated, transmitted, or stored. No money moves.
          </p>
        </form>
      </div>
    </div>
  );
}
