/* ─────────────────────────────────────────────────────────────
   STAGES 5 & 6 — THE OTO LADDER
   ─────────────────────────────────────────────────────────────
   Two steps, both fired after the money is already committed and
   before anything is delivered.

   OTO   — guilt-laden, "never shown again", card already on file,
           and the visitor's own self-prediction quoted back at
           them. Decline is a 10px first-person confession.
   DOWN  — door-in-the-face. The rejected big ask makes the small
           one read as a personal concession, which triggers
           reciprocity (Cialdini et al. 1975).

   Delivery is withheld across both. That is the toll structure.
───────────────────────────────────────────────────────────── */

import { Annotated } from "../Annotate";
import { Check, Countdown, GuiltDecline } from "../chrome";
import { addToCart, recordDecline, trip, useStudy } from "../state";

function Shell({ kicker, step, children }: { kicker: string; step: 2 | 3; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink pb-20">
      <p className="bg-acid py-2 text-center text-[11px] font-black uppercase tracking-[0.16em] text-ink">
        Order confirmed · one step before your download unlocks
      </p>
      <p className="bg-blood py-1.5 text-center text-[11px] font-black uppercase tracking-[0.16em]">
        {kicker}
      </p>
      <div className="mx-auto max-w-2xl px-4 py-7">
        <Annotated pattern="progress_fiction" as="div">
          <div className="mx-auto flex max-w-md items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-acid" />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-acid" : "bg-white/15"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? "bg-acid" : "bg-white/15"}`} />
          </div>
        </Annotated>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   OTO
═══════════════════════════════════════════════════════════ */

export function Oto({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  const s = useStudy();

  return (
    <Shell kicker="Step 2 of 3 · this page is never shown again" step={2}>
      <h1 className="mt-6 text-center font-display text-[1.9rem] leading-[1.04] sm:text-5xl">
        YOU HAVE THE LIST.{" "}
        <span className="text-blood">WHO WRITES THE PITCH?</span>
      </h1>

      <p className="mx-auto mt-4 max-w-xl text-center font-serif text-[1.02rem] leading-[1.62] text-white/75">
        18,412 contacts are worth nothing if the email gets deleted in 1.4 seconds.
        The <span className="hl font-semibold">Airplay Accelerator</span> is the
        scripts, the calendar, and the follow-up cadence.
      </p>

      {s.selfPrediction && (
        <Annotated pattern="self_prediction" className="mx-auto mt-5 max-w-xl">
          <p className="rounded-lg border border-blood/30 bg-blood/5 p-3 text-center text-[13px] leading-relaxed text-white/75">
            You told us: <b className="text-acid">“{s.selfPrediction}”</b>. This is
            the second door, and it is narrower than the first.
          </p>
        </Annotated>
      )}

      <div className="mt-6 flex justify-center">
        <Countdown />
      </div>

      <Annotated pattern="one_time_offer" className="mt-7">
        <div className="rounded-xl border-2 border-acid/50 bg-panel p-5 sm:p-6">
          <p className="font-display text-xl leading-tight sm:text-2xl">
            ADDED TO YOUR ORDER RIGHT NOW:
          </p>
          <ul className="mt-5 space-y-3 text-[15px]">
            <Check>
              <b>4,812 bonus curator contacts</b> — playlist curators, blogs, college
              hosts, podcast bookers. <span className="text-white/45">($297)</span>
            </Check>
            <Check>
              <b>The 6-week campaign calendar</b> — who to email on which day.{" "}
              <span className="text-white/45">($149)</span>
            </Check>
            <Check>
              <b>Subject-line swipe file</b> — 11 lines with open rates attached.{" "}
              <span className="text-white/45">($97)</span>
            </Check>
            <Check>
              <b>One personal pitch review</b> — capped at 25/month.{" "}
              <span className="text-white/45">($200)</span>
            </Check>
          </ul>

          <Annotated pattern="price_anchoring" className="mt-6">
            <div className="flex items-end justify-between border-t border-white/10 pt-5">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/40">
                  Stated value
                </p>
                <p className="font-display text-3xl text-white/40 line-through decoration-blood decoration-2">
                  $743
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-widest text-acid">
                  One-time, this page only
                </p>
                <p className="font-display text-5xl text-acid">$37</p>
              </div>
            </div>
          </Annotated>

          <button
            onClick={() => {
              addToCart({ id: "oto", label: "Airplay Accelerator", price: 37 });
              trip(
                "one_time_offer",
                "You accepted a $37 add-on that was charged one-click, after payment, before delivery, on a page that claimed it would never reappear."
              );
              onAccept();
            }}
            className="cta mt-6 w-full rounded-lg bg-acid px-4 py-4 font-display text-[1.05rem] uppercase leading-tight tracking-wide text-ink sm:py-5 sm:text-2xl"
          >
            Yes — add the Accelerator
            <span className="mt-1 block text-[10px] font-sans font-bold tracking-normal opacity-70">
              One click. Card already on file. No re-entry.
            </span>
          </button>

          <GuiltDecline
            onClick={() => {
              recordDecline("Airplay Accelerator");
              trip(
                "confirmshaming_decline",
                "To decline, you had to click a 10px sentence written in your own voice describing yourself as someone who wastes what they buy."
              );
              onDecline();
            }}
          >
            No thanks — I'll take the list and let it sit in my downloads folder
            like the last three things I bought
          </GuiltDecline>
        </div>
      </Annotated>
    </Shell>
  );
}

/* ═══════════════════════════════════════════════════════════
   DOWNSELL
═══════════════════════════════════════════════════════════ */

export function Downsell({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Shell kicker="Step 3 of 3 · last screen before your files" step={3}>
      <Annotated pattern="downsell_ladder" className="mt-6">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-acid">
          Understood — let me do something for you
        </p>
        <h1 className="mt-3 text-center font-display text-[1.8rem] leading-[1.05] sm:text-4xl">
          TAKE THE SCRIPTS ON THEIR OWN.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center font-serif text-[1.02rem] leading-[1.62] text-white/75">
          I can't give you the full Accelerator at that price — the pitch review
          alone costs me time I don't have. But I can unbundle the part that does
          most of the work and let you have it for the price of lunch.
        </p>
      </Annotated>

      <div className="mt-7 rounded-xl border-2 border-white/15 bg-panel p-5 sm:p-6">
        <ul className="space-y-3 text-[15px]">
          <Check>
            <b>The four-line pitch template</b> — the one the sources said they read.
          </Check>
          <Check>
            <b>Subject-line swipe file</b> — all 11 lines.
          </Check>
          <Check>
            <b>The 3-touch follow-up cadence</b> — without the calendar.
          </Check>
        </ul>

        <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-5">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/40">
              Was
            </p>
            <p className="font-display text-3xl text-white/40 line-through decoration-blood decoration-2">
              $37
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest text-acid">
              Because you got this far
            </p>
            <p className="font-display text-5xl text-acid">$11</p>
          </div>
        </div>

        <button
          onClick={() => {
            addToCart({ id: "downsell", label: "Pitch Scripts (unbundled)", price: 11 });
            trip(
              "downsell_ladder",
              "After you declined $37, an $11 version appeared framed as a personal concession. The sequence — not the price — is what moved you."
            );
            onAccept();
          }}
          className="cta mt-6 w-full rounded-lg bg-acid px-4 py-4 font-display text-[1.05rem] uppercase leading-tight tracking-wide text-ink sm:py-5 sm:text-2xl"
        >
          Fine — add the scripts for $11
        </button>

        <GuiltDecline
          onClick={() => {
            recordDecline("Pitch Scripts");
            onDecline();
          }}
        >
          No thanks — I'd rather write it myself at 1am and hope
        </GuiltDecline>
      </div>
    </Shell>
  );
}
