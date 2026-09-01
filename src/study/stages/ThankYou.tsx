/* ─────────────────────────────────────────────────────────────
   STAGE 7 — RECEIPT, THEN THE REVEAL
   ─────────────────────────────────────────────────────────────
   The receipt renders first, in full sincerity, because the drop
   only lands if the frame is intact when it goes.

   Then: the product is vapor. There is no vault, no 18,412 rows,
   no program director on background. The patterns were the
   product, and the visitor's own session is the dataset — every
   trip logged in state.ts is replayed back as timestamped
   evidence of what worked on them specifically.
───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import {
  FAMILY_LABELS,
  PATTERNS,
  PATTERNS_BY_ID,
  STAGE_LABELS,
  type PatternStage,
} from "../annotations";
import { FAMILY_COLOR, PatternBody, SeverityDots, useXray } from "../Annotate";
import { cartTotal, resetStudy, trip, useStudy } from "../state";

function orderId() {
  return `RR-${Math.random().toString(36).slice(2, 7).toUpperCase()}-${new Date()
    .getFullYear()
    .toString()
    .slice(2)}`;
}

export default function ThankYou({ onRestart }: { onRestart: () => void }) {
  const s = useStudy();
  const { on: xray, toggle } = useXray();
  const [revealed, setRevealed] = useState(false);
  const [id] = useState(orderId);
  const [openPattern, setOpenPattern] = useState<string | null>(null);

  useEffect(() => {
    trip(
      "receipt_theater",
      "You were issued a formatted receipt — order id, masked card, delivery block — for a product that does not exist."
    );
  }, []);

  const total = cartTotal();
  const tripped = [...new Set(s.trips.map((t) => t.pattern))];
  const missed = PATTERNS.filter((p) => !tripped.includes(p.id));
  const minutes = Math.max(1, Math.round((Date.now() - s.startedAt) / 60000));

  /* ── phase 1: the receipt, played straight ── */
  if (!revealed) {
    return (
      <div className="min-h-screen bg-ink pb-20">
        <p className="bg-green-500 py-2 text-center text-[11px] font-black uppercase tracking-[0.16em] text-ink">
          Payment complete · access granted
        </p>

        <div className="mx-auto max-w-xl px-4 py-10">
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-500/15 text-2xl">
              ✓
            </div>
            <h1 className="mt-4 font-display text-[2rem] leading-[1.05] sm:text-4xl">
              {s.lead?.name ? `${s.lead.name.toUpperCase()}, ` : ""}YOU'RE IN.
            </h1>
            <p className="mt-3 font-serif text-[15px] leading-relaxed text-white/70">
              Your cohort slot is confirmed. Files are being prepared for delivery.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-white/10 bg-panel p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Receipt
              </p>
              <p className="font-mono text-[11px] text-white/50">{id}</p>
            </div>

            <ul className="mt-4 space-y-2.5">
              {s.cart.map((c) => (
                <li key={c.id} className="flex justify-between gap-3 text-[14px]">
                  <span className="text-white/75">{c.label}</span>
                  <span className="shrink-0 font-mono text-white">${c.price}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex justify-between border-t border-white/10 pt-4">
              <span className="text-[11px] uppercase tracking-widest text-white/40">
                Charged
              </span>
              <span className="tnum font-display text-3xl text-acid">${total}</span>
            </div>

            <div className="mt-4 space-y-1 border-t border-white/10 pt-4 text-[11px] text-white/40">
              <p>Card •••• 4242 · {new Date().toLocaleString()}</p>
              <p>Receipt sent to {s.lead?.email ?? "your email"}</p>
              <p>Delivery: vault_master.csv · preparing…</p>
            </div>
          </div>

          <button
            onClick={() => setRevealed(true)}
            className="cta mt-6 w-full rounded-lg bg-acid px-5 py-4 font-display text-lg uppercase tracking-wide text-ink"
          >
            Download the Vault
          </button>
          <p className="mt-3 text-center text-[10px] text-white/25">
            Nothing was charged. This has always been a simulation.
          </p>
        </div>
      </div>
    );
  }

  /* ── phase 2: the reveal ── */
  return (
    <div className="min-h-screen bg-ink pb-24">
      <p className="bg-white py-2 text-center text-[11px] font-black uppercase tracking-[0.16em] text-ink">
        There is no vault
      </p>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-[2.1rem] leading-[1.02] sm:text-6xl sm:leading-[0.96]">
          THE PRODUCT WAS NEVER THE POINT.
          <br />
          <span className="text-acid">YOU WERE.</span>
        </h1>

        <div className="mt-6 space-y-4 font-serif text-[1.05rem] leading-[1.68] text-white/78">
          <p>
            There are no 18,412 verified rows. There is no former promotions
            coordinator, no program director speaking on background, no cohort and
            no slot. No card was validated, no email was transmitted, no money
            moved. The countdown restarted{" "}
            <b className="text-acid">
              {s.deadlineResets} {s.deadlineResets === 1 ? "time" : "times"}
            </b>{" "}
            while you were here.
          </p>
          <p>
            What was real: the arithmetic on your quiz, the{" "}
            <b>{s.trips.length} mechanics</b> that actually fired on you, and the{" "}
            <b>{minutes} {minutes === 1 ? "minute" : "minutes"}</b> the sequence held
            your attention. Everything below is drawn from your own session.
          </p>
        </div>

        {/* ── what the seller now knows about you ── */}
        {s.quiz.length > 0 && (
          <section className="mt-9 rounded-xl border border-blood/30 bg-blood/5 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blood">
              The profile you built for them, voluntarily
            </p>
            <ul className="mt-4 space-y-3">
              {s.quiz.map((a) => (
                <li key={a.question} className="text-[13px] leading-relaxed">
                  <p className="text-white/45">{a.question}</p>
                  <p className="mt-0.5 font-semibold text-white/90">“{a.choice}”</p>
                  <p className="mt-0.5 text-white/60">→ {a.reads}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-white/10 pt-3 text-[12px] leading-relaxed text-white/55">
              Score: <b className="text-acid">{s.score}</b> against a threshold of 40
              — a number nobody could fail, because the minimum achievable score is
              42. The gate was theatre. The profile was the yield.
            </p>
          </section>
        )}

        {/* ── the trip log: your session as evidence ── */}
        <section className="mt-9">
          <h2 className="font-display text-2xl leading-tight sm:text-3xl">
            WHAT ACTUALLY FIRED ON YOU
          </h2>
          <p className="mt-2 text-[13px] text-white/50">
            {s.trips.length} of {PATTERNS.length} catalogued mechanics were
            exercised in this session. Tap any row for the research card.
          </p>

          <ol className="mt-5 space-y-2">
            {s.trips.map((t, i) => {
              const meta = PATTERNS_BY_ID[t.pattern];
              const color = meta ? FAMILY_COLOR[meta.family] : "#888";
              const open = openPattern === `${t.pattern}-${i}`;
              return (
                <li key={`${t.pattern}-${i}`}>
                  <button
                    onClick={() => setOpenPattern(open ? null : `${t.pattern}-${i}`)}
                    className="w-full rounded-lg border border-white/10 bg-panel p-4 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                        style={{ background: color, color: "#08080a" }}
                      >
                        {meta?.label ?? t.pattern}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-white/30">
                        {STAGE_LABELS[t.stage as PatternStage] ?? t.stage}
                      </span>
                      {meta && <SeverityDots n={meta.severity} />}
                    </div>
                    <p className="mt-2 font-serif text-[14px] leading-relaxed text-white/80">
                      {t.note}
                    </p>
                  </button>
                  {open && meta && (
                    <div className="mt-1 rounded-lg border border-white/10 bg-black/40 p-4">
                      <PatternBody meta={meta} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {/* ── what you dodged ── */}
        {missed.length > 0 && (
          <section className="mt-9 rounded-xl border border-white/10 bg-panel p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              Loaded but never triggered on you ({missed.length})
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {missed.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setOpenPattern(openPattern === p.id ? null : p.id)}
                  className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50"
                >
                  {p.label}
                </button>
              ))}
            </div>
            {missed.some((p) => p.id === openPattern) && (
              <div className="mt-3 rounded-lg border border-white/10 bg-black/40 p-4">
                <PatternBody meta={PATTERNS_BY_ID[openPattern!]} />
              </div>
            )}
          </section>
        )}

        {/* ── the full ledger ── */}
        <section className="mt-9">
          <h2 className="font-display text-2xl leading-tight sm:text-3xl">
            THE FULL LEDGER
          </h2>
          <p className="mt-2 text-[13px] text-white/50">
            All {PATTERNS.length} mechanics, grouped by family, each with the
            citation and the honest rewrite.
          </p>

          <div className="mt-5 space-y-6">
            {Object.entries(FAMILY_LABELS).map(([fam, label]) => {
              const items = PATTERNS.filter((p) => p.family === fam);
              if (!items.length) return null;
              return (
                <div key={fam}>
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{ color: FAMILY_COLOR[fam as keyof typeof FAMILY_COLOR] }}
                  >
                    {label}
                  </p>
                  <div className="mt-2 space-y-2">
                    {items.map((p) => (
                      <details
                        key={p.id}
                        className="rounded-lg border border-white/10 bg-panel px-4 py-3"
                      >
                        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 marker:hidden">
                          <span className="text-[14px] font-bold text-white/85">
                            {p.label}
                          </span>
                          <SeverityDots n={p.severity} />
                          {tripped.includes(p.id) && (
                            <span className="rounded-full bg-blood/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-blood">
                              hit you
                            </span>
                          )}
                        </summary>
                        <div className="mt-3">
                          <PatternBody meta={p} />
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── the takeaway ── */}
        <section className="mt-10 rounded-xl border-2 border-acid/40 bg-panel p-5 sm:p-7">
          <h2 className="font-display text-2xl leading-tight sm:text-3xl">
            THE UNCOMFORTABLE FINDING
          </h2>
          <div className="mt-4 space-y-3 font-serif text-[15px] leading-relaxed text-white/78">
            <p>
              Almost none of these mechanics require a lie about the product. They
              are lies about <b>context</b> — how many seats, how long you have, who
              else is here, whether you were screened, whether the page will return.
            </p>
            <p>
              That is why the honest column exists on every card. Nearly every
              pattern here has a version that keeps the psychological structure and
              drops the deception: real deadlines, real inventory, unchecked boxes,
              neutral decline copy, disclosed automation. The structure is what
              converts. The lie is what creates the liability.
            </p>
            <p className="text-white/90">
              The one exception is the self-prediction question. There is no honest
              version of arming somebody's own words against them ninety seconds
              later — you can only decline to do it.
            </p>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => {
              resetStudy();
              onRestart();
            }}
            className="cta flex-1 rounded-lg bg-acid px-5 py-4 font-display text-base uppercase tracking-wide text-ink"
          >
            Run it again
          </button>
          {!xray && (
            <button
              onClick={toggle}
              className="cta flex-1 rounded-lg border border-white/20 bg-white/5 px-5 py-4 font-display text-base uppercase tracking-wide text-white"
            >
              Replay with X-ray on
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
