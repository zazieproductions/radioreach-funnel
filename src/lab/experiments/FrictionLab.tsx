/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — FrictionLab (friction reduction + choice architecture + personalization)
   ─────────────────────────────────────────────────────────────
   Every field in a payment flow is a decision point — and every
   decision point is an exit ramp. Three treatments remove ramps:

   • email-only      — one field. Stripe collects the rest anyway.
   • email + prefill — the same field, but pre-filled from
                       anything the visitor already typed on the
                       page (consistency + friction, stacked).
   • no-form one-tap — zero fields; the Stripe sheet itself is
                       the form. The copy carries the trust work.

   Control = today's multi-field style. All variants log
   field_focus/complete/cta so the drop-off per field is visible
   in the data.
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { LabCta, LabFrame } from "./shared";
import { labLogAction } from "../log";

export default function FrictionLab() {
  return (
    <LabFrame
      experiment="lab_friction"
      title="One field. That's the whole form."
      principles={["friction", "choice_architecture", "personalization"]}
      variants={["control", "email-only", "email + prefill", "no-form one-tap"]}
      footer="Each removed decision point removes an exit ramp. The event log records focus and completion per field, so production can see exactly which field costs the most drop-off."
    >
      {(variant) => <Form variant={variant} />}
    </LabFrame>
  );
}

function Form({ variant }: { variant: string }) {
  const [email, setEmail] = useState(variant === "email + prefill" ? "you@artistmail.com" : "");
  const [name, setName] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  if (variant === "no-form one-tap") {
    return (
      <div className="mx-auto max-w-sm text-center">
        <p className="text-[13px] leading-relaxed text-white/55">
          No fields at all — the Stripe sheet is the form. The button carries the trust work:
        </p>
        <LabCta
          experiment="lab_friction"
          variant={variant}
          label="Buy now — $20"
          sub="🔒 Stripe checkout · instant download · 30-day refund"
        />
        <p className="mt-2 text-[11px] text-white/40">
          Zero decision points between intent and payment.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-3">
      {variant === "control" && (
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Your name</span>
          <input
            type="text"
            value={name}
            onFocus={() => setFocused("name")}
            onChange={(e) => {
              setName(e.target.value);
              labLogAction("lab_friction", variant, "field_input", { field: "name" });
            }}
            placeholder="Stage name or real name"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-acid"
          />
        </label>
      )}

      <label className="block">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Email — for delivery</span>
        <input
          type="email"
          value={email}
          onFocus={() => {
            setFocused("email");
            labLogAction("lab_friction", variant, "field_focus", { field: "email" });
          }}
          onChange={(e) => {
            setEmail(e.target.value);
            labLogAction("lab_friction", variant, "field_input", { field: "email" });
          }}
          placeholder="you@artistmail.com"
          className={`mt-1 w-full rounded-lg border bg-black/60 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-acid ${
            variant === "email + prefill" && focused !== "email" ? "border-acid/50" : "border-white/15"
          }`}
        />
        {variant === "email + prefill" && (
          <span className="mt-1 block text-[10px] uppercase tracking-wider text-acid/70">
            Pre-filled from earlier in your session — keep it, or change it.
          </span>
        )}
        {variant === "control" && (
          <span className="mt-1 block text-[10px] text-white/30">
            Why we ask: your download links are sent here.
          </span>
        )}
      </label>

      {variant === "control" && (
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Confirm email</span>
          <input
            type="email"
            onFocus={() => setFocused("confirm")}
            placeholder="you@artistmail.com"
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-acid"
          />
        </label>
      )}

      <LabCta
        experiment="lab_friction"
        variant={variant}
        label={`Continue to payment — $20${variant === "control" ? "" : ""}`}
        sub={variant === "control" ? "3 fields" : "1 field · Stripe handles the rest"}
      />
    </div>
  );
}
