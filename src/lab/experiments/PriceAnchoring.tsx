/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — PriceAnchoring (anchoring + choice architecture)
   ─────────────────────────────────────────────────────────────
   The price never moves: $20 in every variant. Only the
   *reference points* change — anchoring is about the order numbers
   arrive in, not the number itself.

   • bare $20            — no anchor; the visitor supplies their own
   • $742→$49→$20 stack  — today's page; the stack the visitor just
                           read becomes the anchor
   • decoy tiers         — a dominated $49 tier makes $20 the obvious
                           no-regret choice while $97 re-anchors the
                           ceiling (decoy effect)
   • per-day reframe     — "5¢ a day" reframes the same $20 against
                           daily coffee money instead of one-time cost

   Guardrail note: every anchor maps to real line items; the decoy
   tier must exist as a real, purchasable SKU if shipped.
───────────────────────────────────────────────────────────── */

import { LabFrame } from "./shared";
import { labLogConversion } from "../log";

export default function PriceAnchoring() {
  return (
    <LabFrame
      experiment="lab_anchoring"
      title="Anchor the stack, not just the price"
      principles={["anchoring", "choice_architecture"]}
      variants={["bare $20", "$742→$49→$20 stack", "decoy tiers", "per-day reframe"]}
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

  if (variant === "$742→$49→$20 stack") {
    const stack = [
      ["18,000+ entries", "$297"],
      ["Direct emails tied to named contacts", "$149"],
      ["400+ page organized document", "$97"],
      ["City-by-city organization", "$79"],
      ["Lifetime access", "$120"],
    ];
    return (
      <div className="mx-auto max-w-sm">
        <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
          Everything you get today
        </p>
        <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/40">
          {stack.map(([t, v]) => (
            <div key={t} className="flex items-center justify-between gap-3 px-3.5 py-2">
              <span className="text-[13px] font-bold text-white/85">✓ {t}</span>
              <span className="font-display text-sm text-white/40 line-through decoration-blood">{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between bg-acid/10 px-3.5 py-2">
            <span className="font-display text-sm uppercase text-white/80">Real value</span>
            <span className="font-display text-lg text-white/50 line-through decoration-2 decoration-blood">$742</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => pick("stack")}
          className="cta mt-3 w-full rounded-lg bg-acid px-4 py-4 font-display text-xl uppercase text-ink"
        >
          Claim it — <span className="line-through opacity-50">$49</span> $20
        </button>
        <p className="mt-2 text-center text-[11px] text-white/40">
          The stack you just read becomes the anchor for $20.
        </p>
      </div>
    );
  }

  if (variant === "decoy tiers") {
    return (
      <div className="mx-auto grid max-w-md gap-2.5">
        {[
          { id: "list", name: "Contact tables only", price: "$49", badge: null, popular: false, body: "City-sorted contact tables · no formatted PDF" },
          { id: "vault", name: "Vault", price: "$20", badge: "MOST CHOSEN", popular: true, body: "Full PDF + city-sorted tables + contracts + AU list + permanent access" },
          { id: "addons", name: "Vault + add-ons", price: "$97", badge: null, popular: false, body: "Vault plus every regional add-on and template pack" },
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
          $49 is dominated by $20 on every dimension — the decoy that makes the middle door obvious.
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
