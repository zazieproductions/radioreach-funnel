/** Web-native lesson: mission brief, content, field protocol, worked example,
 *  boundaries, decoder notes, interactive exercise, pass standard, notes,
 *  prev/next, print. Completion is gated by the server-side pass check. */
import { useCallback, useEffect, useRef, useState } from "react";
import { fdApi, ApiFailure } from "../lib/api";
import { FdLink, navigate } from "../lib/router";
import { useFd } from "../lib/store";
import { Blocks, Card, SafeNotes, Spinner } from "../lib/ui";
import { clientOutline, flatLessons, useDebouncedSave } from "./content-util";

type LessonData = {
  lesson: {
    id: string; code: string; title: string; minutes: number; exerciseMinutes: number; truth: string;
    masterclass: never[]; fieldProtocol: never[]; warnings: string[]; decoderNotes: string[];
    worksheets: { kind: string; title: string; headers: string[]; rows: string[][] }[];
    community: string[]; exercise: { prompt: string; items: { id: string; label: string; description: string; minutes: number | null; passStandard: string | null }[] };
    pass: { minWords: number; note: string };
    toolLinks: { to: string; label: string }[];
  };
  progress: { status: string; completed_at: string; last_activity_at: string } | null;
};

type Answers = {
  responses: Record<string, string>;
  /** one keyed cell-map per worksheet: {"row:col": value} */
  worksheetCells: Record<string, string>[];
  confirmations: Record<string, boolean>;
};

const EMPTY: Answers = { responses: {}, worksheetCells: [], confirmations: {} };

export function LessonPage({ lessonId }: { lessonId: string }) {
  const { toast, refreshMe } = useFd();
  const [data, setData] = useState<LessonData | null>(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(true);
  const [decoderOpen, setDecoderOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const startedRef = useRef(performance.now());
  const [viewedMin, setViewedMin] = useState(0);

  const all = flatLessons();
  const idx = all.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  useEffect(() => {
    let cancel = false;
    setData(null); setError(""); setAnswers(EMPTY); setNotes(""); setDecoderOpen(false);
    (async () => {
      try {
        const r = await fdApi.get<LessonData>(`course/lesson/${lessonId}`);
        if (cancel) return;
        setData(r);
        setNotes(r.lesson.id ? "" : "");
        void fdApi.get<{ body: string }>(`notes/lesson/${lessonId}`).then((n) => !cancel && setNotes(n.body || "")).catch(() => undefined);
        // rehydrate in-flight exercise answers
        void fdApi.get<{ progress: { lesson_id: string; exercise?: string }[] }>("progress").then((p) => {
          const row = p.progress.find((x) => x.lesson_id === lessonId);
          if (row) {
            try {
              const ex = (row as { exercise?: string }).exercise ? JSON.parse((row as { exercise: string }).exercise) : null;
              if (ex && !cancel) setAnswers({ ...EMPTY, ...ex });
            } catch { /* ignore */ }
          }
        }).catch(() => undefined);
      } catch (e) {
        if (!cancel) setError(e instanceof ApiFailure ? e.message : "Failed to load lesson.");
      }
    })();
    return () => { cancel = true; };
  }, [lessonId]);

  useEffect(() => {
    const t = window.setInterval(() => setViewedMin(Math.floor((performance.now() - startedRef.current) / 60000)), 30000);
    return () => window.clearInterval(t);
  }, [lessonId]);

  const saveExercise = useCallback(async (a: Answers) => {
    await fdApi.put(`progress/lesson/${lessonId}`, { action: "activity", answers: a }).catch(() => undefined);
  }, [lessonId]);
  const { status: exStatus } = useDebouncedSave(answers, saveExercise, 1400);

  const saveNotesFn = useCallback((b: string) => fdApi.put(`notes/lesson/${lessonId}`, { body: b }), [lessonId]);
  const { status: notesStatus } = useDebouncedSave(notes, saveNotesFn, 1100);

  const complete = async () => {
    if (!data) return;
    setBusy(true);
    try {
      await fdApi.put(`progress/lesson/${lessonId}`, { action: "complete", answers });
      toast("Lesson passed — progress saved to your account.", "ok");
      setData({ ...data, progress: { status: "complete", completed_at: new Date().toISOString(), last_activity_at: "" } });
      void refreshMe();
      if (next) {
        const go = window.confirm("Lesson passed. Continue to the next lesson?");
        if (go) navigate(`/frequency-dominion/app/lesson/${next.id}`);
      }
    } catch (e) {
      if (e instanceof ApiFailure && e.status === 422) {
        const missing = (e.details as { missing?: string[] })?.missing || [];
        toast(`Pass standard not met: ${missing.join(" · ")}`, "err");
      } else toast("Could not save completion — retry.", "err");
    } finally { setBusy(false); }
  };

  if (error) {
    return (
      <Card title="Lesson unavailable">
        <p className="text-sm text-white/70">{error}</p>
        <p className="mt-3 text-sm text-white/50">If your access was interrupted (refund/dispute), see the account panel. Otherwise reload — the API gates lesson bodies server-side.</p>
      </Card>
    );
  }
  if (!data) return <Spinner label="Loading lesson…" />;
  const l = data.lesson;
  const done = data.progress?.status === "complete";
  const mod = clientOutline().modules.find((m) => m.lessons.some((x) => x.id === l.id));
  const setResp = (id: string, v: string) => setAnswers((a) => ({ ...a, responses: { ...a.responses, [id]: v } }));
  const wordCount = (s: string) => (s || "").trim().split(/\s+/).filter(Boolean).length;

  return (
    <article className="grid gap-5">
      <header className="fd-no-print">
        <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.28em] text-[#f4c21d]">
          {mod ? `Module ${mod.n} · ${mod.title}` : ""} · Lesson {l.code}
        </p>
        <h1 className="fd-display mt-1 text-3xl leading-tight sm:text-4xl">{l.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="fd-chip">{l.minutes} min read</span>
          <span className="fd-chip">+{l.exerciseMinutes} min field work</span>
          {done ? <span className="fd-chip text-[#46c8ac]" style={{ borderColor: "currentColor" }}>✓ PASSED {data.progress?.completed_at?.slice(0, 10)}</span> : <span className="fd-chip text-[#f4c21d]">NOT PASSED</span>}
          {viewedMin >= 1 && !done && <span className="fd-chip text-white/40">{viewedMin} min open</span>}
          <button type="button" className="fd-btn fd-btn--sm ml-auto" onClick={() => window.print()}>Print / save PDF</button>
        </div>
      </header>
      <p className="fd-display text-xl !normal-case leading-snug text-white/90 [text-transform:none] font-serif" style={{ fontFamily: "Domine, Georgia, serif" }}>
        “{l.truth}”
      </p>

      <Card title="Mission brief" sub="Why this lesson exists and what “done” looks like">
        <ul className="grid gap-1.5 text-sm text-white/80">
          <li>▸ Finish every field exercise below with real, verifiable answers.</li>
          <li>▸ Mark complete only after the pass standard is met — the server checks it.</li>
          <li>▸ Notes are private to your account and autosave as you type.</li>
        </ul>
      </Card>

      <section aria-labelledby="masterclass-h" className="fd-card p-4 sm:p-6">
        <h2 id="masterclass-h" className="fd-display text-2xl">Masterclass directive</h2>
        <Blocks blocks={l.masterclass as never} />
      </section>

      {l.worksheets?.length > 0 && (
        <Card title="Worked example — operational worksheet" sub="Editable protocol document: fill it with YOUR campaign's numbers; the example rows stay as reference" >
          {l.worksheets.map((w, wi) => (
            <WorksheetEditor key={wi} index={wi} worksheet={w} answers={answers} onChange={(cells) => setAnswers((a) => {
              const ws = [...(a.worksheetCells || [])];
              while (ws.length < wi + 1) ws.push({});
              ws[wi] = cells as never;
              return { ...a, worksheetCells: ws };
            })} />
          ))}
        </Card>
      )}

      {l.fieldProtocol?.length > 0 && (
        <Card title="Field protocol — war-room directives" sub="The operator layer: rules of engagement for this lesson in the field">
          <Blocks blocks={l.fieldProtocol as never} />
        </Card>
      )}

      <Card title="Industry decoder notes" right={
        <button type="button" className="fd-btn fd-btn--sm" aria-expanded={decoderOpen} onClick={() => setDecoderOpen((v) => !v)}>{decoderOpen ? "Collapse" : "Expand"}</button>
      }>
        {l.decoderNotes?.length ? (
          <div hidden={!decoderOpen}>
            <ul className="grid gap-2 text-sm">
              {l.decoderNotes.map((d, i) => (
                <li key={i} className="rounded-lg border-l-2 border-[#f4c21d] bg-black/25 px-3 py-2"><SafeNotes text={d} /></li>
              ))}
            </ul>
          </div>
        ) : <p className="text-sm text-white/55">No decoder edge for this lesson.</p>}
        {!decoderOpen && l.decoderNotes?.length > 0 && <p className="text-sm text-white/50">Collapse-safe: expand to read the mechanic, the missing piece, and the operator move.</p>}
      </Card>

      {l.warnings?.length > 0 && (
        <Card title="Warnings & ethical boundaries" as="section">
          <ul className="grid gap-2 text-sm">
            {l.warnings.map((wtext, i) => (
              <li key={i} className="flex gap-2 rounded-lg border border-[#f0564f]/35 bg-[#f0564f]/8 px-3 py-2">
                <span aria-hidden="true" className="text-[#f0564f]">⚠</span><span className="text-white/85">{wtext}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-white/50">
            Course-wide compliance: three-touch ceiling, verified contacts only, honor stops permanently, no invented numbers, no payola.
            Full rules live in the <FdLink className="underline" to="/frequency-dominion/app/vault">Tool Vault → Outreach Compliance</FdLink>.
          </p>
        </Card>
      )}

      <section aria-labelledby="exercise-h" className="fd-card p-4 sm:p-6" id="exercise">
        <h2 id="exercise-h" className="fd-display text-2xl">Field exercise</h2>
        <p className="mt-1 text-sm text-white/65">{l.exercise?.prompt}</p>
        <div className="mt-4 grid gap-4">
          {(l.exercise?.items || []).map((d) => (
            <div key={d.id}>
              <label className="fd-label" htmlFor={`ex-${d.id}`}>
                Drill — {d.label}{d.minutes ? ` (${d.minutes} min)` : ""}
              </label>
              <p className="mb-1.5 text-[0.82rem] leading-5 text-white/60">{d.description}</p>
              <textarea id={`ex-${d.id}`} className="fd-textarea" rows={4} value={answers.responses[d.id] || ""} onChange={(e) => setResp(d.id, e.target.value)} placeholder="Real, verifiable answers only…" />
              <p className="fd-fieldnote">
                {d.passStandard ? <span className="text-[#f4c21d]">Pass standard: </span> : null}{d.passStandard || `Minimum ${l.pass?.minWords || 40} words.`} · {wordCount(answers.responses[d.id] || "")} words
              </p>
            </div>
          ))}
        </div>
        {l.community?.length > 0 && (
          <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-3 text-sm">
            <p className="fd-label !mb-1">Community prompts (optional calibration)</p>
            <ul className="list-inside list-disc text-white/70">{l.community.slice(0, 3).map((pr, i) => <li key={i}>{pr}</li>)}</ul>
          </div>
        )}
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="fd-label">Pass standard</p>
          <p className="text-sm text-white/70">{l.pass?.note || "Every drill answered with verifiable detail."} <span className="text-white/45">(Auto-checked: ≥{l.pass?.minWords || 40} words per drill.)</span></p>
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" className="fd-check mt-0.5" checked={!!answers.confirmations.attest} onChange={(e) => setAnswers((a) => ({ ...a, confirmations: { ...a.confirmations, attest: e.target.checked } }))} />
            <span>I completed the work with real numbers — no invented proof, no fabricated receipts — and I understand a lesson counts as complete only when the pass standard is met.</span>
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" className="fd-btn fd-btn--gold" disabled={busy || !answers.confirmations.attest} onClick={complete}>
              {done ? "Re-confirm pass (already complete)" : "Mark complete"}
            </button>
            <span className="text-xs text-white/50" aria-live="polite">
              {exStatus === "saving" ? "Saving answers…" : exStatus === "saved" ? "Exercise answers saved." : exStatus === "dirty" ? "Unsaved edits autosave in a moment." : done ? "" : "Progress cannot be lost on refresh — answers autosave."}
            </span>
          </div>
        </div>
      </section>

      <Card
        title="Private lesson notes"
        sub="Yours only — server-stored, synced across devices"
        right={
          <div className="flex items-center gap-2">
            <span className="text-[0.68rem] uppercase tracking-wider text-white/45" aria-live="polite">
              {notesStatus === "saving" ? "saving…" : notesStatus === "saved" ? "saved" : notesStatus === "error" ? "retrying…" : notes ? "saved" : ""}
            </span>
            <button type="button" className="fd-btn fd-btn--sm" aria-expanded={notesOpen} onClick={() => setNotesOpen((v) => !v)}>{notesOpen ? "Hide" : "Show"}</button>
          </div>
        }
      >
        <div hidden={!notesOpen} className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="sr-only" htmlFor="lesson-notes">Lesson notes (markdown supported)</label>
            <textarea id="lesson-notes" className="fd-textarea min-h-[160px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What you'll do differently on this campaign… #tags" />
            <p className="fd-fieldnote">Markdown-lite supported: **bold**, *italic*, `code`, - lists, [links](https://…). HTML is never rendered.</p>
          </div>
          <div aria-label="Notes preview" className="rounded-lg border border-white/10 bg-black/25 p-3">
            {notes.trim() ? <SafeNotes text={notes} /> : <p className="text-sm text-white/40">Live preview appears here.</p>}
          </div>
        </div>
      </Card>

      {l.toolLinks?.length > 0 && (
        <nav aria-label="Lesson tools" className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-white/45">Apply it now:</span>
          {l.toolLinks.map((t) => <FdLink key={t.to} to={t.to} className="fd-btn fd-btn--sm">{t.label}</FdLink>)}
        </nav>
      )}

      <nav aria-label="Lesson navigation" className="fd-no-print flex flex-wrap items-stretch justify-between gap-3 pb-4">
        {prev ? (
          <button type="button" className="fd-btn max-w-[48%] text-left" onClick={() => navigate(`/frequency-dominion/app/lesson/${prev.id}`)}>
            ← <span className="truncate">{prev.code} · {prev.title}</span>
          </button>
        ) : <span className="fd-btn invisible" aria-hidden="true">←</span>}
        {next ? (
          <button type="button" className="fd-btn max-w-[48%] text-right" onClick={() => navigate(`/frequency-dominion/app/lesson/${next.id}`)}>
            <span className="truncate">{next.code} · {next.title}</span> →
          </button>
        ) : <span className="text-sm text-white/45 self-center">Final lesson — run the 90-day audit in the Vault.</span>}
      </nav>
      <p className="fd-no-print text-[0.7rem] text-white/35">Print version: use “Print / save PDF” — the layout switches to a black-on-white print sheet. The master ZIP (PDF dossier set) stays downloadable from the Tool Vault.</p>
    </article>
  );
}

function WorksheetEditor({ index, worksheet, answers, onChange }: {
  index: number;
  worksheet: { kind?: string; title?: string; headers?: string[]; rows?: string[][]; blocks?: never[] };
  answers: Answers;
  onChange: (cells: Record<string, string>) => void;
}) {
  if (worksheet.kind === "note" || !worksheet.headers?.length) {
    return (
      <div className="mb-4">
        {worksheet.title ? <p className="fd-label">{worksheet.title}</p> : null}
        {worksheet.blocks ? <Blocks blocks={worksheet.blocks as never} /> : null}
      </div>
    );
  }
  const dataRows = worksheet.rows || [];
  const cells = (answers.worksheetCells || [])[index] || {};
  const set = (r: number, c: number, v: string) => onChange({ ...cells, [`${r}:${c}`]: v });
  const value = (r: number, c: number) => cells[`${r}:${c}`] ?? dataRows[r]?.[c] ?? "";
  const extraRows = Math.max(0, Object.keys(cells).filter((k) => Number(k.split(":")[0]) >= dataRows.length).length ? Math.max(...Object.keys(cells).map((k) => Number(k.split(":")[0]) + 1)) - dataRows.length : 0);
  const totalRows = dataRows.length + extraRows;
  return (
    <div className="mb-4">
      <p className="fd-label">{worksheet.title || `Worksheet ${index + 1}`}</p>
      <div className="scroll-x rounded-lg border border-white/10">
        <table className="fd-table min-w-[640px]">
          <thead><tr>{worksheet.headers!.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: totalRows }).map((_, r) => (
              <tr key={r}>
                {(worksheet.headers || []).map((h, c) => (
                  <td key={c}>
                    {c === 0 && r < dataRows.length ? (
                      <span className="text-white/70">{dataRows[r][c]}</span>
                    ) : (
                      <input
                        className="fd-input !min-h-[34px] !py-1 !px-2 text-xs"
                        aria-label={`${h} — row ${r + 1}`}
                        value={value(r, c)}
                        onChange={(e) => set(r, c, e.target.value)}
                        placeholder={r >= dataRows.length ? "add your row" : ""}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="fd-btn fd-btn--sm mt-2" onClick={() => onChange({ ...cells, [`${totalRows}:0`]: " " })}>+ Add row</button>
    </div>
  );
}
