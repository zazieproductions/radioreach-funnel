import { COURSE, MODULES, WORKBOOKS } from "./curriculum";
import { Check, SectionLabel, Stars } from "../funnel/ui";

type Props = { onCta: () => void; onClassroom: () => void; onVault: () => void };

export default function CourseSalesPage({ onCta, onClassroom, onVault }: Props) {
  return (
    <div className="min-h-screen bg-ink pb-24 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a href="#top" className="font-display text-lg">
            RADIO REACH <span className="text-acid">VAULT</span>
          </a>
          <button type="button" onClick={onCta} className="cta rounded-lg bg-acid px-4 py-2 text-xs font-black uppercase text-ink">
            Enroll ${COURSE.price}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-acid">High-ticket backend · 6 modules · 24 lessons</p>
        <h1 className="mt-4 font-display text-4xl leading-[0.95] sm:text-6xl">
          FREQUENCY <span className="text-blood">DOMINION</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-white/75">{COURSE.tagline}</p>
        <p className="mt-3 text-sm text-white/45">
          The Vault is the list. This is the operating system that turns the list into adds, interviews, and a career you can actually run.
        </p>
        <div className="mx-auto mt-8 max-w-md rounded-xl border-2 border-acid/50 bg-black/70 p-5 text-left">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/45">{COURSE.shortName}</p>
              <p className="font-display text-2xl">21-day campaign OS</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/35 line-through">${COURSE.compareAt}</p>
              <p className="font-display text-4xl text-acid">${COURSE.price}</p>
            </div>
          </div>
          <button type="button" onClick={onCta} className="cta mt-5 w-full rounded-lg bg-acid py-4 font-display text-xl uppercase text-ink">
            Add to checkout for ${COURSE.price}
          </button>
          <button type="button" onClick={onClassroom} className="mt-3 w-full text-sm font-bold text-acid underline">
            Preview the classroom (all 24 lessons) →
          </button>
        </div>
        <p className="mt-3 text-[12px] text-white/40">
          <Stars /> Stacks with the $25 Vault · 30-day action guarantee
        </p>
      </section>

      <section className="border-y border-white/10 bg-panel">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <SectionLabel>The gap after the download</SectionLabel>
          <h2 className="font-display text-3xl sm:text-5xl">
            A LIST WITHOUT A CAMPAIGN IS <span className="text-blood">A GRAVEYARD.</span>
          </h2>
          <p className="mt-4 font-serif text-lg text-white/70">
            Most buyers open the PDF, feel powerful for eleven minutes, then freeze. Frequency Dominion is the brutal, modular system that makes freeze expensive and sending inevitable: identity, targeting, pitch weapons, a 21-day calendar, human follow-through, and the loop that turns one add into the next market.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <SectionLabel>Curriculum</SectionLabel>
        <h2 className="font-display text-3xl sm:text-4xl">SIX MODULES. TWENTY-FOUR LESSONS. ZERO THEORY THEATER.</h2>
        <div className="mt-8 space-y-4">
          {MODULES.map((m) => (
            <div key={m.id} className="rounded-xl border border-white/10 bg-panel p-5">
              <p className="font-mono text-[11px] text-acid">MODULE {m.n}</p>
              <p className="font-display text-2xl">{m.title}</p>
              <p className="mt-1 text-sm text-white/55">{m.promise}</p>
              <ol className="mt-3 grid gap-1 sm:grid-cols-2">
                {m.lessons.map((l, i) => (
                  <li key={l.id} className="text-[13px] text-white/70">
                    <span className="font-mono text-acid/60">{String(i + 1).padStart(2, "0")}</span> {l.title}{" "}
                    <span className="text-white/30">({l.minutes}m)</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-panel">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <SectionLabel>Stack</SectionLabel>
          <ul className="space-y-3 text-[15px]">
            <Check>
              <b>24 video-ready lesson scripts</b> with drills you complete the same day
            </Check>
            <Check>
              <b>5 workbooks</b> — {WORKBOOKS.map((w) => w.title).join(" · ")}
            </Check>
            <Check>
              <b>Swipe file:</b> subject lines, 90-word pitch, 3-touch follow-up, interview answers
            </Check>
            <Check>
              <b>War-room classroom</b> with progress, notes, and community prompts
            </Check>
            <Check>
              <b>Designed to sit on top of the RadioReach Vault</b> — the list plus the machine
            </Check>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={onCta} className="cta rounded-lg bg-acid px-6 py-4 font-display uppercase text-ink">
              Enroll — ${COURSE.price}
            </button>
            <button type="button" onClick={onVault} className="rounded-lg border border-white/20 px-6 py-4 text-sm font-bold uppercase text-white/70">
              Start with the $25 Vault
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
