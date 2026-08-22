/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — PriceAnchoring (anchoring + choice architecture)
   ─────────────────────────────────────────────────────────────
   The price never moves: $20 in every variant. Only the
   *reference points* change — anchoring is about the order numbers
   arrive in, not the number itself.

   • bare $20            — no anchor; the visitor supplies their own
   • $55→$20 simple anchor  — today's page; the stack the visitor just
                           read becomes the anchor
   • simple comparison  — regular $55 beside today's $20, with no
                           extra tiers or decisions
   • per-day reframe     — "5¢ a day" reframes the same $20 against
                           daily coffee money instead of one-time cost

   Guardrail note: the anchor and sale price describe the same complete
   Vault; no item-level values or invented tiers are shown.
───────────────────────────────────────────────────────────── */

import { LabFrame } from "./shared";
import { labLogConversion } from "../log";

export default function PriceAnchoring() {
  return (
    <LabFrame
      experiment="lab_anchoring"
      title="Anchor the stack, not just the price"
      principles={["anchoring", "choice_architecture"]}
      variants={["bare $20", "$55→$20 simple anchor", "simple comparison", "per-day reframe"]}
      footer="Same product, same $20, four reference frames. The demo button logs a conversion probe per presentation so the winning anchor can be picked by the same metric the live test would use."
    >
      {(variant) => <Offer variant={variant} />}
    </LabFrame>
  );
}

function Offer({ variant }: { variant: string }) {
  function pick(label: string) {
    labLogConversion("lab_anchoring", variant, "offer_click", { offer: label });
  }

  if (variant === "bare $20") {
    return (
      <div className="mx-auto max-w-sm text-center">
        <p className="font-display text-2xl uppercase text-white">Radio Reach Vault</p>
        <p className="mt-1 text-sm text-white/55">18,000+ radio contacts for independent artists.</p>
        <button
          type="button"
          onClick={() => pick("bare")}
          className="cta mt-4 w-full rounded-lg bg-acid px-4 py-4 font-display text-2xl text-ink"
        >
          $20
        </button>
        <p className="mt-2 text-[11px] text-white/40">No anchor. The visitor's own prior sets the reference.</p>
      </div>
    );
  }

  if (variant === "$55→$20 simple anchor") {
    const stack = [
      "18,000+ entries",
      "Verified deliverable emails",
      "400+ page organized document",
      "City-by-city organization",
      "Lifetime access",
    ];
    return (
      <div className="mx-auto max-w-sm">
        <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
          Everything you get today
        </p>
        <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/40">
          {stack.map((t) => (
            <div key={t} className="px-3.5 py-2 text-[13px] font-bold text-white/85">✓ {t}</div>
          ))}
          <div className="flex items-center justify-between bg-acid/10 px-3.5 py-2">
            <span className="font-display text-sm uppercase text-white/80">Usually worth</span>
            <span className="font-display text-lg text-white/50 line-through decoration-2 decoration-blood">$55</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => pick("stack")}
          className="cta mt-3 w-full rounded-lg bg-acid px-4 py-4 font-display text-xl uppercase text-ink"
        >
          Claim it — <span className="line-through opacity-50">$55</span> $20
        </button>
        <p className="mt-2 text-center text-[11px] text-white/40">
          The complete Vault is usually worth $55; today it is $20.
        </p>
      </div>
    );
  }

  if (variant === "simple comparison") {
    return (
      <div className="mx-auto grid max-w-md gap-2.5">
        {[
          { id: "regular", name: "Regular price", price: "$55", badge: null, popular: false, body: "The complete Radio Reach Vault" },
          { id: "vault", name: "Today", price: "$20", badge: "SAVE $35", popular: true, body: "The same complete Radio Reach Vault · one-time payment" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pick(t.id)}
            className={`pressable relative rounded-xl border p-4 text-left transition ${
              t.popular
                ? "border-acid bg-acid/10 shadow-[0_0_30px_rgba(255,230,0,0.15)]"
                : "border-white/10 bg-black/30 hover:border-white/25"
            }`}
          >
            {t.badge && (
              <span className="absolute -top-2.5 right-3 rounded-full bg-acid px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-ink">
                {t.badge}
              </span>
            )}
            <span className="flex items-baseline justify-between gap-3">
              <span className={`font-display text-lg uppercase ${t.popular ? "text-acid" : "text-white/85"}`}>{t.name}</span>
              <span className={`font-display text-2xl ${t.popular ? "text-acid" : "text-white"}`}>{t.price}</span>
            </span>
            <span className="mt-1 block text-[12px] leading-snug text-white/55">{t.body}</span>
          </button>
        ))}
        <p className="text-center text-[11px] text-white/40">
          The complete Vault is usually worth $55; today it is $20. No tiers, subscriptions, or extra decisions.
        </p>
      </div>
    );
  }

  // per-day reframe
  return (
    <div className="mx-auto max-w-sm text-center">
      <p className="font-display text-2xl uppercase text-white">
        Less than <span className="text-acid">5¢ a day</span>
      </p>
      <p className="mt-1 font-serif text-sm leading-relaxed text-white/60">
        A year of radio contacts for less than the cost of one coffee — $20 once, lifetime access.
      </p>
      <div className="mx-auto mt-4 flex max-w-xs items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
        <span className="text-[11px] text-white/45">One-time</span>
        <span className="font-display text-3xl text-acid">$20</span>
        <span className="text-[11px] text-white/45">≈ 5.5¢/day over a year</span>
      </div>
      <button
        type="button"
        onClick={() => pick("per_day")}
        className="cta mt-4 w-full rounded-lg bg-acid px-4 py-4 font-display text-xl uppercase text-ink"
      >
        Start for 5¢ a day
      </button>
      <p className="mt-2 text-[11px] text-white/40">Same $20 — anchored to coffee money instead of cost.</p>
    </div>
  );
}
