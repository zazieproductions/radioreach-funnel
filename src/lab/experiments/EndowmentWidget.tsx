/* ─────────────────────────────────────────────────────────────
   PROTOTYPE — EndowmentWidget (endowment + personalization)
   ─────────────────────────────────────────────────────────────
   The offer becomes a reserved, personal copy:

   • endowment — "Vault #14,203 is holding for you" makes leaving
     the page a *loss* (giving up a possession) rather than a
     non-purchase. Losses loom roughly twice as large as gains.
   • personalization — an optional name stamps the copy; the
     cocktail-party effect makes self-referential text the most
     attention-grabbing text on the page.
   • countdown — makes the loss concrete and dated.

   Guardrail: the reservation is framed as a price hold, never an
   inventory lie (the SKU never sells out).
───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { Countdown, LabCta, LabFrame } from "./shared";
import { labLogAction } from "../log";

// Demo scale — production would use the 15-minute founder-price hold
// (same duration constant the lucky wheel already ships with).
const RESERVATION_SECONDS = 60;

export default function EndowmentWidget() {
  return (
    <LabFrame
      experiment="lab_endowment"
      title="Your vault is already reserved"
      principles={["endowment", "personalization"]}
      variants={["control", "reserved copy + countdown", "reserved + named stamp"]}
      footer="Control = generic CTA. Treatments frame the same $20 offer as a reserved personal copy with a release countdown — leaving becomes a loss, and named copies feel pre-owned."
    >
      {(variant) => <Reserved variant={variant} />}
    </LabFrame>
  );
}

function Reserved({ variant }: { variant: string }) {
  const [name, setName] = useState("");
  const [stamped, setStamped] = useState(false);
  const [expired, setExpired] = useState(false);

  if (variant === "control") {
    return (
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-white/55">
          Control — a standard CTA box. Nothing is reserved; leaving costs nothing.
        </p>
        <LabCta experiment="lab_endowment" variant={variant} label="Get the contacts — $20" sub="Standard offer" />
      </div>
    );
  }

  const stamp = variant === "reserved + named stamp" && name.trim();
  const holder = stamp ? `for ${name.trim()}` : "for you";

  return (
    <div className="mx-auto max-w-sm">
      <div className={`rounded-xl border-2 p-4 text-center transition ${expired ? "border-blood/60 bg-blood/10" : "border-acid/50 bg-black/60"}`}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-acid">
          {expired ? "Reservation released" : "Reservation active"}
        </p>
        <p className="mt-2 font-display text-xl uppercase leading-tight text-white">
          Vault <span className="tnum font-mono text-acid">#14,203</span>
          <br />
          <span className="text-white/70">is holding {holder}</span>
        </p>

        {!expired && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Price hold ends in</span>
            <Countdown
              seconds={RESERVATION_SECONDS}
              onDone={() => {
                setExpired(true);
                labLogAction("lab_endowment", variant, "reservation_expired", {});
              }}
            />
          </div>
        )}
        {expired && (
          <p className="fade-in mt-3 font-serif text-[13px] leading-relaxed text-white/70">
            The $20 founder hold on your copy has been released to the next artist in line.
          </p>
        )}

        {variant === "reserved + named stamp" && !stamped && !expired && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Stamp your name on it…"
              aria-label="Name to stamp on your copy"
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-acid"
            />
            <button
              type="button"
              onClick={() => {
                setStamped(true);
                labLogAction("lab_endowment", variant, "stamped_name", {});
              }}
              className="pressable rounded-lg bg-acid px-3 py-2 text-[11px] font-black uppercase tracking-wider text-ink"
            >
              Stamp
            </button>
          </div>
        )}
        {stamped && (
          <p className="fade-in mt-2 text-[11px] font-bold uppercase tracking-widest text-acid">
            ✓ Copy stamped “{name.trim()}”
          </p>
        )}
      </div>

      <p className="mt-2 text-center text-[11px] leading-relaxed text-white/40">
        {expired
          ? "Loss framing: what was yours is now someone else's."
          : "It's already yours in every way that matters except one."}
      </p>

      <div className="mt-3">
        <LabCta
          experiment="lab_endowment"
          variant={variant}
          label={expired ? "Reclaim the founder hold — $20" : "Keep my copy — $20"}
          sub={stamp ? `Vault #14,203 · ${name.trim()}` : "One-time · lifetime access"}
        />
      </div>
    </div>
  );
}
