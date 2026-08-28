import { useMemo, useState } from "react";
import { COMMUNITY_PROMPTS, COURSE, MODULES, WORKBOOKS, allLessons } from "./curriculum";

type Props = { onBack: () => void; onBuy: () => void };

export default function CourseClassroom({ onBack, onBuy }: Props) {
  const lessons = useMemo(() => allLessons(), []);
  const [activeId, setActiveId] = useState(lessons[0]?.id ?? "");
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("rr:fd:done") || "{}");
    } catch {
      return {};
    }
  });
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem("rr:fd:notes") || "";
    } catch {
      return "";
    }
  });

  const active = lessons.find((l) => l.id === activeId) ?? lessons[0];
  const doneCount = Object.values(done).filter(Boolean).length;
  const pct = Math.round((doneCount / lessons.length) * 100);

  function toggleDone(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("rr:fd:done", JSON.stringify(next));
      return next;
    });
  }

  function saveNotes(v: string) {
    setNotes(v);
    localStorage.setItem("rr:fd:notes", v);
  }

  const idx = lessons.findIndex((l) => l.id === active.id);

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button type="button" onClick={onBack} className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-acid">
            ← Sales
          </button>
          <p className="font-display text-lg tracking-wide">
            {COURSE.name} <span className="text-acid">CLASSROOM</span>
          </p>
          <span className="ml-auto rounded-full border border-acid/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-acid">
            {doneCount}/{lessons.length} · {pct}%
          </span>
        </div>
        <div className="h-1 bg-white/10">
          <div className="h-full bg-acid" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          {MODULES.map((m) => (
            <div key={m.id} className="rounded-xl border border-white/10 bg-panel p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-acid">
                Module {m.n}
              </p>
              <p className="mt-1 font-display text-base leading-tight">{m.title}</p>
              <ul className="mt-2 space-y-1">
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(l.id)}
                      className={`w-full rounded-md px-2 py-1.5 text-left text-[13px] ${
                        active.id === l.id ? "bg-acid text-ink font-bold" : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      {done[l.id] ? "✓ " : ""}
                      {l.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="rounded-xl border border-white/10 bg-panel p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-acid">Workbooks</p>
            <ul className="mt-2 space-y-2 text-[13px] text-white/70">
              {WORKBOOKS.map((w) => (
                <li key={w.id}>
                  <b className="text-white">{w.title}</b>
                  <span className="block text-[12px] text-white/45">{w.blurb}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-2xl border border-acid/30 bg-panel p-6 sm:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-acid">
              {active.moduleTitle} · {active.minutes} min
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{active.title}</h1>
            <p className="mt-3 font-serif text-lg text-white/75">{active.outcome}</p>
            <div className="mt-6 space-y-4 font-serif text-[1.05rem] leading-[1.7] text-white/80">
              {active.script.split("\n").map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            {active.template && (
              <pre className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-[12px] text-acid/80">
                {active.template}
              </pre>
            )}
            <div className="mt-6 rounded-xl border border-acid/20 bg-acid/5 p-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-acid">Implementation drill</p>
              <p className="mt-2 text-[15px] text-white/80">{active.drill}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => toggleDone(active.id)}
                className="cta rounded-lg bg-acid px-5 py-3 font-display text-sm uppercase tracking-wide text-ink"
              >
                {done[active.id] ? "Mark incomplete" : "Mark complete"}
              </button>
              <button
                type="button"
                disabled={idx <= 0}
                onClick={() => setActiveId(lessons[idx - 1].id)}
                className="rounded-lg border border-white/20 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white/70 disabled:opacity-30"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={idx >= lessons.length - 1}
                onClick={() => setActiveId(lessons[idx + 1].id)}
                className="rounded-lg border border-white/20 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white/70 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-panel p-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-acid">War-room notes</p>
            <textarea
              value={notes}
              onChange={(e) => saveNotes(e.target.value)}
              rows={6}
              placeholder="Station · contact · status · next touch…"
              className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-acid"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-panel p-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-acid">Community prompts</p>
            <ul className="mt-3 space-y-2 text-[14px] text-white/70">
              {COMMUNITY_PROMPTS.map((p) => (
                <li key={p} className="border-l-2 border-acid/40 pl-3">
                  {p}
                </li>
              ))}
            </ul>
            <a href="#/community" className="mt-4 inline-block text-sm font-bold text-acid underline">
              Open the community archive →
            </a>
          </div>

          <div className="rounded-2xl border border-blood/40 bg-blood/10 p-5 text-center">
            <p className="font-display text-xl">Want the files + Vault stacked?</p>
            <p className="mt-2 text-sm text-white/60">
              Classroom is open as a preview. Full fulfillment unlocks with the ${COURSE.price} course add-on at checkout.
            </p>
            <button type="button" onClick={onBuy} className="cta mt-4 rounded-lg bg-acid px-6 py-3 font-display uppercase text-ink">
              Add Frequency Dominion — ${COURSE.price}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
