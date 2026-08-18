import { SectionLabel } from "./ui";

/* ─────────────────────────────────────────────────────────────
   VAULT OFFER UPGRADE — the Hormozi value-equation rewrite.

   Value = (Dream Outcome × Likelihood) ÷ (Time Delay × Effort).

   This block is the "make saying no irrational" layer that sits
   right under the hero CTA. It is a NEW element and is fully
   feature-flaggable: it only mounts when
   `isVaultOfferUpgradeEnabled()` is true (see config/features.ts
   and the `vaultOfferUpgrade` runtime flag in index.html).

   It deliberately does NOT add data-esp-zone="pricing"/"scarcity"
   attributes — the ESP zone map and its tests expect exactly two
   pricing zones and one scarcity zone, and this block must not
   disturb the adaptive-copy engine.
───────────────────────────────────────────────────────────── */

const PROOF_POINTS: [string, string][] = [
  ["10,372", "emails individually verified deliverable — each tied to a named person"],
  ["4.9★", "from 1,940+ independent artists who bought at founder price"],
  ["0 forms", "direct phone + email to program directors and music directors"],
];

export default function VaultOffer({ onCta }: { onCta: () => void }) {
  return (
    <section id="offer" aria-labelledby="offer-title" className="border-y border-white/10 bg-panel">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        {/* ── DREAM OUTCOME ─────────────────────────────── */}
        <SectionLabel>What this actually does for you</SectionLabel>
        <h2
          id="offer-title"
          className="font-display text-[1.7rem] leading-[1.1] sm:text-5xl sm:leading-tight"
        >
          REAL REPLIES FROM <span className="text-acid">REAL PEOPLE</span> WHO PLAY THE SONGS
        </h2>
        <p className="mt-4 font-serif text-[1.05rem] leading-[1.65] text-white/75 sm:mt-5 sm:text-lg sm:leading-relaxed">
          Skip the faceless upload box. In the next 90 seconds you get the direct email and phone of the{" "}
          <b className="text-white">music director who programs your city's station</b> — the exact human who
          decides what gets played. Send one short, personal pitch tonight. Wake up tomorrow to a reply from a
          decision-maker, not another “we'll be in touch” auto-message.
        </p>

        {/* ── LIKELIHOOD: concrete proof, not adjectives ── */}
        <div className="mt-6 grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          {PROOF_POINTS.map(([stat, label]) => (
            <div key={stat} className="rounded-lg border border-white/10 bg-black/40 p-3.5 sm:p-4">
              <p className="font-display text-2xl leading-none text-acid sm:text-3xl">{stat}</p>
              <p className="mt-1.5 text-[12px] leading-snug text-white/60 sm:text-[13px]">{label}</p>
            </div>
          ))}
        </div>

        {/* ── TIME DELAY + EFFORT crushed to zero ──────── */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/70 sm:text-[12px]">
          <span className="rounded-full border border-acid/40 bg-acid/10 px-3 py-1.5 text-acid">⚡ Instant download</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">No account</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">No software</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Pre-sorted by role &amp; city</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Copy · paste · send</span>
        </div>

        {/* ── RISK REVERSAL / GUARANTEE ───────────────── */}
        <div className="mt-8 rounded-2xl border-2 border-acid/40 bg-gradient-to-b from-acid/10 to-transparent p-5 text-center sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-acid sm:text-[11px] sm:tracking-[0.22em]">
            The risk is 100% on us
          </p>
          <h3 className="mt-2 font-display text-[1.45rem] leading-[1.1] sm:text-3xl">
            THE “BEAT-THE-FORM” GUARANTEE
          </h3>
          <p className="mx-auto mt-3 max-w-xl font-serif text-[1.02rem] leading-[1.65] text-white/75 sm:text-[1.05rem]">
            Download the Vault. Send a few pitches. If within <b className="text-white">30 days</b> you don't find
            it <b className="text-white">significantly more useful than generic submission forms</b> — more replies,
            real names, direct emails — just email us and we'll refund every cent.{" "}
            <b className="text-white">You keep the file either way.</b>
          </p>
          <button
            onClick={onCta}
            className="cta mt-5 w-full rounded-lg bg-acid px-5 py-4 font-display text-xl uppercase tracking-wide text-ink sm:text-2xl"
          >
            Get The Contacts — <span className="line-through opacity-60">$49</span> $20
          </button>
          <p className="mt-2.5 text-[11px] text-white/45 sm:text-[12px]">
            Instant download · No account · 30-day refund · Keep the file
          </p>
        </div>
      </div>
    </section>
  );
}
