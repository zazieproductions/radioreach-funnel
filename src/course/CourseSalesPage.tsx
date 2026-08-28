import { COURSE, MODULES, courseStats } from "./curriculum";
import { FD_FILES } from "./assets";
import { Check, SectionLabel, Stars } from "../funnel/ui";

type Props = { onCta: () => void; onClassroom: () => void; onVault: () => void };

export default function CourseSalesPage({ onCta, onClassroom, onVault }: Props) {
  const stats = courseStats();
  const blankWorkbooks = FD_FILES.filter((f) => f.path.startsWith("workbooks/") && !f.path.includes("examples/"));
  const exampleWorkbooks = FD_FILES.filter((f) => f.path.includes("workbooks/examples/"));
  const swipes = FD_FILES.filter((f) => f.path.startsWith("swipe-file/"));

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
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-acid">
          High-ticket backend · {stats.moduleCount} modules · {stats.lessonCount} lessons
        </p>
        <h1 className="mt-4 font-display text-4xl leading-[0.95] sm:text-6xl">
          FREQUENCY <span className="text-blood">DOMINION</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-serif text-lg text-white/75">{COURSE.tagline}</p>
        <p className="mt-3 text-sm text-white/45">
          The Vault is the list. This is the operating system that turns the list into adds, interviews, and a career you can actually run.
        </p>
        <img
          src="/images/frequency-dominion-cover.jpg"
          alt="Frequency Dominion course cover — the 21-day radio campaign OS"
          width={900}
          height={473}
          className="mx-auto mt-8 w-full max-w-xl rounded-xl border border-white/10 shadow-2xl"
        />
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
            Preview the classroom (all {stats.lessonCount} lessons + the worked example) →
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
        <h2 className="font-display text-3xl sm:text-4xl">SIX MODULES. {stats.lessonCount} LESSONS. ZERO THEORY THEATER.</h2>
        <p className="mt-3 text-sm text-white/50">
          Every lesson ships a teleprompter-ready voiceover script ({stats.scriptWords.toLocaleString("en-US")} words ≈ {Math.floor(stats.spokenMinutes / 60)}h{String(stats.spokenMinutes % 60).padStart(2, "0")}m spoken), on-screen beats, a same-day drill with a done-definition, and a common failure → fix.
        </p>
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
          <SectionLabel>What's actually in the download</SectionLabel>
          <h2 className="font-display text-3xl sm:text-4xl">COUNTED FROM THE REAL FILES. NOTHING PADDED.</h2>
          <ul className="mt-6 space-y-3 text-[15px]">
            <Check>
              <b>{stats.lessonCount} spoken lesson scripts</b> — {stats.scriptWords.toLocaleString("en-US")} words of teleprompter-ready VO, each with on-screen beats, a same-day drill + "done when" definition, and a failure→fix
            </Check>
            <Check>
              <b>1 complete worked example</b> — one fictional indie artist run end-to-end: filled 20-station war room, 88-word pitch, 11 subject lines, Touch 2/3, thank-yous, and an honest 21-day log (1 add, 1 interview, 1 clean no, 14 silences)
            </Check>
            <Check>
              <b>{blankWorkbooks.length + exampleWorkbooks.length} workbooks</b> — WB01–WB05 blank templates <i>plus the filled example version of each</i>
            </Check>
            <Check>
              <b>{swipes.length}-piece swipe file</b> — subject lines, 90-word pitch, 3-touch follow-up, 20-second call, interview answers, thank-you, burned-well apology, venue email, client email — every one templated <i>and</i> filled
            </Check>
            <Check>
              <b>Print pack:</b> 21-day calendar (markdown + printable HTML one-pager), EPK one-sheet HTML template + example (print to PDF), send-log CSV starter + a 22-row worked example
            </Check>
            <Check>
              <b>The classroom</b> — day-of-campaign mode ("if today is day 8, open this"), worked-example drawer in every lesson, print/download for each template, and drill-gated module unlocking
            </Check>
            <Check>
              <b>Instant zip + in-browser classroom</b> — {FD_FILES.length + 24 + 4 + 2}-file fulfillment download, rebuilt from tracked source so it's never a mystery binary
            </Check>
          </ul>
          <p className="mt-6 text-[13px] leading-relaxed text-white/45">
            Same rules as the Vault: no spam tactics, no purchased play, no guaranteed spins. The example campaign's numbers are honest on purpose — silence is data, and the system works anyway.
          </p>
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
