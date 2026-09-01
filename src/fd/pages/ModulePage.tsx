/** Module view: promise, lessons with progress + completion markers. */
import { useFd } from "../lib/store";
import { FdLink } from "../lib/router";
import { clientOutline } from "./content-util";
import { Card, Spinner } from "../lib/ui";
import { useEffect, useState } from "react";
import { fdApi } from "../lib/api";

export function ModulePage({ moduleId }: { moduleId: string }) {
  const { loading } = useFd();
  const mod = clientOutline().modules.find((m) => m.id === moduleId);
  const [progress, setProgress] = useState<Record<string, { status: string }>>({});
  useEffect(() => {
    fdApi.get<{ progress: { lesson_id: string; status: string }[] }>("progress")
      .then((r) => setProgress(Object.fromEntries(r.progress.map((p) => [p.lesson_id, { status: p.status }]))))
      .catch(() => undefined);
  }, []);
  if (loading) return <Spinner />;
  if (!mod) return <Card title="Unknown module">Check the URL — modules are m1 through m6.</Card>;
  const done = mod.lessons.filter((l) => progress[l.id]?.status === "complete").length;
  const pct = Math.round((done / mod.lessons.length) * 100);
  return (
    <div className="grid gap-5">
      <header>
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.28em] text-[#f4c21d]">Module {mod.n} · {pct}% complete</p>
        <h1 className="fd-display mt-1 text-3xl leading-tight sm:text-4xl">{mod.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">{mod.promise}</p>
      </header>
      <span className="fd-progress block" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
      <ol className="grid gap-3">
        {mod.lessons.map((l, i) => {
          const st = progress[l.id]?.status;
          return (
            <li key={l.id}>
              <FdLink to={`/frequency-dominion/app/lesson/${l.id}`} className="fd-card block p-4 transition hover:border-[#f4c21d]/50 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span aria-hidden="true" className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-black ${st === "complete" ? "border-[#46c8ac] bg-[#46c8ac]/15 text-[#46c8ac]" : "border-white/20 text-white/50"}`}>
                    {st === "complete" ? "✓" : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="fd-display text-lg leading-snug">{l.code} · {l.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[0.82rem] text-white/55">{l.truth}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="fd-chip">{l.minutes} min read</span>
                    {st === "complete" ? <span className="fd-chip text-[#46c8ac]">PASSED</span> : st ? <span className="fd-chip text-[#f4c21d]">IN PROGRESS</span> : <span className="fd-chip text-white/40">NOT STARTED</span>}
                  </div>
                </div>
              </FdLink>
            </li>
          );
        })}
      </ol>
      {mod.tools?.length > 0 && (
        <nav aria-label="Module tools" className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-bold uppercase tracking-widest text-white/45">Companion tools:</span>
          {mod.tools.map((t) => <FdLink key={t.to} to={t.to} className="fd-btn fd-btn--sm">{t.label}</FdLink>)}
        </nav>
      )}
    </div>
  );
}
