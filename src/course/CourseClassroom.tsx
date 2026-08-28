import { useMemo, useState } from "react";
import { CAMPAIGN_DAY_PLAN, COURSE, MODULES, WORKBOOKS, allLessons } from "./curriculum";
import { ARTIST, EXAMPLE_DISCLAIMER, LOG, exampleFor } from "./workedExample";
import { FD_FILES, fdFile, fdMime, type FdFile } from "./assets";

type Props = { onBack: () => void; onBuy: () => void };

const START = "start";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

function downloadFile(file: FdFile) {
  const blob = new Blob([file.content], { type: `${fdMime(file.kind)};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.path.split("/").pop() || "frequency-dominion.md";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function printHtml(title: string, bodyHtml: string) {
  const w = window.open("", "_blank", "width=880,height=1000");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#111;max-width:760px;margin:24px auto;padding:0 20px;}
  h1{font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:.02em;font-size:26px;border-bottom:3px solid #08080a;padding-bottom:6px;}
  h2{font-family:Arial,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;border-bottom:2px solid #ffe600;background:#08080a;color:#ffe600;display:inline-block;padding:3px 8px;margin:22px 0 8px;}
  p{line-height:1.65;margin:0 0 12px;font-size:15px;}
  .meta{font-family:Arial,sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#666;}
  .foot{margin-top:26px;border-top:1px solid #ccc;padding-top:8px;font-family:Arial,sans-serif;font-size:9px;color:#777;}
  @media print{ body{margin:0} .no-print{display:none} }
</style></head><body>${bodyHtml}<p class="foot">FREQUENCY DOMINION — RadioReach · radioreach.us · purchaser copy · no spam, no purchased play, no guaranteed airplay.</p>
<script>window.onload=function(){setTimeout(function(){window.print()},150)}</script></body></html>`);
  w.document.close();
}

function printLessonMd(id: string) {
  const l = allLessons().find((x) => x.id === id);
  if (!l) return;
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const bodyHtml = `
    <p class="meta">${esc(l.moduleTitle)} · ${l.minutes} min · ${esc(l.dayOf ?? "foundations")}</p>
    <h1>${esc(l.title)}</h1>
    <p><b>Outcome:</b> ${esc(l.outcome)}</p>
    <h2>Voiceover script</h2>
    ${l.script.split("\n").map((p) => `<p>${esc(p)}</p>`).join("")}
    ${l.beats.length ? `<h2>On screen</h2><ul>${l.beats.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
    ${l.template ? `<h2>Template</h2><pre style="white-space:pre-wrap;font-size:13px;background:#f4f4f0;padding:12px;border-left:4px solid #ffe600">${esc(l.template)}</pre>` : ""}
    <h2>Drill — done when</h2>
    <p>${esc(l.drill)}</p><p><b>Done when:</b> ${esc(l.doneWhen)}</p>
    <h2>Common failure → fix</h2>
    <p><b>Fails:</b> ${esc(l.failure.fail)}</p><p><b>Fix:</b> ${esc(l.failure.fix)}</p>`;
  printHtml(`${l.id.toUpperCase()} — ${l.title}`, bodyHtml);
}

export default function CourseClassroom({ onBack, onBuy }: Props) {
  const lessons = useMemo(() => allLessons(), []);
  const [activeId, setActiveId] = useState<string>(START);
  const [done, setDone] = useState<Record<string, boolean>>(() => load("rr:fd:done", {}));
  const [reviewMode, setReviewMode] = useState<boolean>(() => load("rr:fd:review", false));
  const [campaignDay, setCampaignDay] = useState<number | "">(() => load<number | "">("rr:fd:day", ""));
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem("rr:fd:notes") || "";
    } catch {
      return "";
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const active = lessons.find((l) => l.id === activeId);
  const doneCount = Object.values(done).filter(Boolean).length;
  const pct = Math.round((doneCount / lessons.length) * 100);

  const moduleDrillsDone = MODULES.map((m) => m.lessons.every((l) => done[l.id]));
  const moduleUnlocked = MODULES.map((_, i) => i === 0 || reviewMode || moduleDrillsDone[i - 1]);

  const plan = campaignDay === "" ? null : CAMPAIGN_DAY_PLAN.find((p) => p.day === campaignDay) ?? null;

  function toggleDone(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      save("rr:fd:done", next);
      return next;
    });
  }

  function setReview(v: boolean) {
    setReviewMode(v);
    save("rr:fd:review", v);
  }

  function pickDay(v: string) {
    const day = v === "" ? "" : Number(v);
    setCampaignDay(day);
    save("rr:fd:day", day);
  }

  function saveNotes(v: string) {
    setNotes(v);
    try {
      localStorage.setItem("rr:fd:notes", v);
    } catch {
      /* ignore */
    }
  }

  const idx = active ? lessons.findIndex((l) => l.id === active.id) : -1;
  const example = active ? exampleFor(active.id) : null;

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-3">
          <button type="button" onClick={onBack} className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-acid">
            ← Sales
          </button>
          <p className="font-display text-lg tracking-wide">
            {COURSE.name} <span className="text-acid">CLASSROOM</span>
          </p>
          <span className="rounded-full border border-acid/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-acid">
            {doneCount}/{lessons.length} drills · {pct}%
          </span>
          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-3 py-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Campaign day</span>
              <select
                value={campaignDay}
                onChange={(e) => pickDay(e.target.value)}
                className="bg-transparent text-sm font-bold text-acid outline-none [&>option]:text-ink"
                aria-label="If today is campaign day N, open this"
              >
                <option value="">—</option>
                {CAMPAIGN_DAY_PLAN.map((p) => (
                  <option key={p.day} value={p.day}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setReview(!reviewMode)}
              className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                reviewMode ? "border-acid bg-acid text-ink" : "border-white/20 text-white/60 hover:text-white"
              }`}
              title="Unlocks every module — for reviewing before your drills are done"
            >
              I'm reviewing
            </button>
          </div>
        </div>
        <div className="h-1 bg-white/10">
          <div className="h-full bg-acid transition-all" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-acid/30 bg-panel p-3">
            <button
              type="button"
              onClick={() => {
                setActiveId(START);
                setDrawerOpen(false);
              }}
              className={`w-full rounded-md px-3 py-2 text-left font-display text-sm uppercase tracking-wide ${
                activeId === START ? "bg-acid text-ink" : "text-acid hover:bg-acid/10"
              }`}
            >
              ▶ Start here
            </button>
          </div>

          {MODULES.map((m, i) => {
            const unlocked = moduleUnlocked[i];
            const mDone = m.lessons.filter((l) => done[l.id]).length;
            return (
              <div key={m.id} className={`rounded-xl border bg-panel p-3 ${unlocked ? "border-white/10" : "border-white/5 opacity-60"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-acid">Module {m.n}</p>
                  <span className="text-[10px] font-bold text-white/40">{unlocked ? `${mDone}/4 drills` : "🔒 locked"}</span>
                </div>
                <p className="mt-1 font-display text-base leading-tight">{m.title}</p>
                <ul className="mt-2 space-y-1">
                  {m.lessons.map((l) => {
                    const clickable = unlocked;
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          disabled={!clickable}
                          onClick={() => {
                            setActiveId(l.id);
                            setDrawerOpen(false);
                          }}
                          className={`w-full rounded-md px-2 py-1.5 text-left text-[13px] ${
                            active?.id === l.id ? "bg-acid font-bold text-ink" : clickable ? "text-white/70 hover:bg-white/5" : "text-white/35"
                          }`}
                        >
                          {done[l.id] ? "✓ " : ""}
                          {l.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {!unlocked && (
                  <p className="mt-2 border-t border-white/10 pt-2 text-[11px] leading-snug text-white/40">
                    Finish Module {MODULES[i - 1]?.n}'s 4 drills to unlock — or flip <b className="text-white/60">I'm reviewing</b>.
                  </p>
                )}
              </div>
            );
          })}

          <div className="rounded-xl border border-white/10 bg-panel p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-acid">Workbooks — print / download</p>
            <ul className="mt-2 space-y-2 text-[13px]">
              {WORKBOOKS.map((w) => {
                const f = fdFile(w.file);
                return (
                  <li key={w.id}>
                    <b className="text-white">{w.title}</b>
                    <span className="block text-[12px] text-white/45">{w.blurb}</span>
                    {f && (
                      <span className="mt-1 flex gap-2">
                        <button type="button" onClick={() => downloadFile(f)} className="rounded border border-acid/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-acid hover:bg-acid/10">
                          .md
                        </button>
                        <button
                          type="button"
                          onClick={() => printHtml(f.title, `<pre style="white-space:pre-wrap;font-size:12px;font-family:Arial,sans-serif">${f.content.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`)}
                          className="rounded border border-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white"
                        >
                          Print
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-panel p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-acid">All files ({FD_FILES.length})</p>
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1 text-[12px]">
              {FD_FILES.map((f) => (
                <li key={f.path}>
                  <button type="button" onClick={() => downloadFile(f)} className="w-full text-left text-white/55 hover:text-acid" title={f.blurb}>
                    ↓ {f.path}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="space-y-6">
          {plan && (
            <div className="rounded-2xl border border-acid bg-acid/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-acid">Day-of-campaign mode</p>
                <button type="button" onClick={() => pickDay("")} className="text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white">
                  Clear ×
                </button>
              </div>
              <h2 className="mt-1 font-display text-2xl">{plan.headline}</h2>
              <ul className="mt-3 space-y-1 text-[14px] text-white/80">
                {plan.actions.map((a) => (
                  <li key={a} className="border-l-2 border-acid/60 pl-3">
                    {a}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {plan.lessonIds.map((id) => {
                  const l = lessons.find((x) => x.id === id);
                  return l ? (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveId(id)}
                      className="rounded-lg border border-acid/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-acid hover:bg-acid/10"
                    >
                      Open {l.id} · {l.title}
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {activeId === START || !active ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-acid/40 bg-panel p-6 sm:p-8">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-acid">Module 00 · Before m1l1</p>
                <h1 className="mt-2 font-display text-4xl leading-tight">START HERE</h1>
                <p className="mt-4 font-serif text-lg leading-relaxed text-white/75">
                  This is a 21-day campaign operating system, not a playlist of videos. Four moves and it's running:
                </p>
                <ol className="mt-4 space-y-3">
                  {[
                    ["1", "Print the war room", "WB02 → 20 stations, scored, on your wall. If today is campaign day N, set the day selector in the header and the classroom tells you exactly what to open."],
                    ["2", "Finish Module 01", "Identity sentence, clock fit, proof stack, the oath. Four drills. Module 02 unlocks when they're done — or flip 'I'm reviewing' to read everything first."],
                    ["3", "20 stations, not 2,000", "Extract from the Vault, score 0–5, load the final 20. Week 0 loads; Days 1–21 run."],
                    ["4", "Run the 21 days", "Day 1: ten sends. Day 8: the 30-second hook. Day 14: new info only. Day 21: close, audit, clone market two."],
                  ].map(([n, t, d]) => (
                    <li key={n} className="flex gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
                      <span className="font-display text-2xl text-acid">{n}</span>
                      <span>
                        <b className="font-display uppercase tracking-wide">{t}</b>
                        <span className="mt-1 block text-[14px] leading-snug text-white/65">{d}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  onClick={() => setActiveId(lessons[0]?.id ?? "")}
                  className="cta mt-6 rounded-lg bg-acid px-6 py-3 font-display text-sm uppercase tracking-wide text-ink"
                >
                  Open m1l1 — The unheard tax →
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-panel p-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-acid">The worked example — one artist, end to end</p>
                <p className="mt-2 font-serif text-lg text-white/75">
                  Meet <b className="text-white">{ARTIST.name}</b> — {ARTIST.tag}, {ARTIST.city}. One song ({ARTIST.song}, {ARTIST.runtime.split(" · ")[0]}), one hometown date ({ARTIST.showDate}), one 20-station war room, one honest 21-day log: 20 sends, 1 add, 1 interview, 1 clean no, 14 silences. Every lesson in this classroom carries her file as a worked-example drawer — the course never asks you to imagine an example it hasn't built.
                </p>
                <p className="mt-3 rounded-lg border border-blood/40 bg-blood/10 p-3 text-[12px] leading-snug text-white/60">{EXAMPLE_DISCLAIMER}</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId("m2l4");
                    setDrawerOpen(true);
                  }}
                  className="mt-4 rounded-lg border border-acid/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-acid hover:bg-acid/10"
                >
                  See the full war room →
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-panel p-5">
                <p className="text-[11px] font-black uppercase tracking-widest text-acid">21-day log at a glance (example)</p>
                <ul className="mt-3 space-y-1 text-[13px] text-white/70">
                  {LOG.filter((l) => ["add", "interview", "no", "reply"].includes(l.kind)).map((l) => (
                    <li key={l.day} className="border-l-2 border-acid/40 pl-3">
                      <b>Day {l.day}</b> — {l.outcome}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-acid/30 bg-panel p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-acid">
                  {active.moduleTitle} · {active.minutes} min
                </p>
                {active.dayOf && (
                  <span className="rounded-full border border-blood/50 bg-blood/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-blood">
                    {active.dayOf}
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{active.title}</h1>
              <p className="mt-3 font-serif text-lg text-white/75">{active.outcome}</p>

              {example && (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="mt-4 flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-acid/40 bg-acid/5 px-4 py-3 text-left hover:bg-acid/10"
                >
                  <span>
                    <span className="text-[11px] font-black uppercase tracking-widest text-acid">Worked example — {ARTIST.name}</span>
                    <span className="block text-[13px] text-white/70">{example.title}</span>
                  </span>
                  <span className="rounded border border-acid/40 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-acid">
                    {drawerOpen ? "Close" : "Open"}
                  </span>
                </button>
              )}

              <div className="mt-6 space-y-4 font-serif text-[1.05rem] leading-[1.7] text-white/80">
                {active.script.split("\n").map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-acid">On screen</p>
                  <ul className="mt-2 space-y-1.5 text-[13px] text-white/65">
                    {active.beats.map((b) => (
                      <li key={b.slice(0, 24)} className="border-l-2 border-white/15 pl-2">
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                {active.template && (
                  <div className="rounded-xl border border-white/10 bg-black/50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-acid">Template — copy/paste</p>
                    <pre className="mt-2 overflow-x-auto font-mono text-[12px] leading-relaxed text-acid/80">{active.template}</pre>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-xl border border-acid/20 bg-acid/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-acid">Implementation drill</p>
                <p className="mt-2 text-[15px] text-white/80">{active.drill}</p>
                <p className="mt-2 text-[13px] text-white/55">
                  <b className="text-acid/80">Done when:</b> {active.doneWhen}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-blood/30 bg-blood/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-blood">Common failure → fix</p>
                <p className="mt-2 text-[14px] text-white/75">
                  <b>Fail:</b> {active.failure.fail}
                </p>
                <p className="mt-1 text-[14px] text-white/75">
                  <b>Fix:</b> {active.failure.fix}
                </p>
              </div>

              {(active.files?.length ?? 0) > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">This lesson's files:</span>
                  {active.files?.map((p) => {
                    const f = fdFile(p);
                    if (!f) return null;
                    return (
                      <span key={p} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => downloadFile(f)}
                          className="rounded border border-acid/40 px-2.5 py-1 text-[11px] font-bold text-acid hover:bg-acid/10"
                          title={f.blurb}
                        >
                          ↓ {f.title}
                        </button>
                        {f.kind === "html" && (
                          <button
                            type="button"
                            onClick={() => printHtml(f.title, f.content)}
                            className="rounded border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/60 hover:text-white"
                          >
                            Print
                          </button>
                        )}
                      </span>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => printLessonMd(active.id)}
                    className="rounded border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/60 hover:text-white"
                  >
                    Print lesson
                  </button>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => toggleDone(active.id)}
                  className="cta rounded-lg bg-acid px-5 py-3 font-display text-sm uppercase tracking-wide text-ink"
                >
                  {done[active.id] ? "✓ Drill complete — undo" : "Mark drill complete"}
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
          )}

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
              {[
                "Drop your identity sentence. If it could fit any artist, rewrite it.",
                "Post a redacted 90-word pitch. We roast length, not your soul.",
                "Share one hometown A-list station and why it scored 4+.",
                "Week 2: paste Touch 2. Did you add new information or just bump?",
                "Win thread: one add, one quote, one thank-you. Proof or it did not happen.",
              ].map((p) => (
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

      {example && active && drawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Worked example">
          <button type="button" aria-label="Close worked example" className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l-2 border-acid bg-ink p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-acid">Worked example — {ARTIST.name}</p>
                <h3 className="mt-1 font-display text-xl leading-tight">{example.title}</h3>
              </div>
              <button type="button" onClick={() => setDrawerOpen(false)} className="rounded border border-white/20 px-2 py-1 text-xs font-bold text-white/60 hover:text-white">
                ✕
              </button>
            </div>
            <p className="mt-3 rounded-lg border border-blood/40 bg-blood/10 p-2.5 text-[11px] leading-snug text-white/55">{EXAMPLE_DISCLAIMER}</p>
            <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-white/80">
              {example.body.map((line, i) =>
                line.startsWith("|") ? (
                  <pre key={i} className="overflow-x-auto whitespace-pre font-mono text-[10.5px] leading-snug text-white/70">
                    {line}
                  </pre>
                ) : (
                  <p key={i} className={line === "" ? "h-1" : ""}>
                    {line}
                  </p>
                )
              )}
            </div>
            {example.note && <p className="mt-3 border-l-2 border-acid/50 pl-3 text-[13px] text-white/60">{example.note}</p>}
            <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Example files in the zip</p>
              <ul className="mt-2 space-y-1 text-[12px]">
                {["worked-example/00-artist-file.md", "worked-example/01-war-room.md", "worked-example/02-pitch-pack.md", "worked-example/03-21-day-log.md"].map((p) => {
                  const f = fdFile(p);
                  return (
                    <li key={p}>
                      {f ? (
                        <button type="button" onClick={() => downloadFile(f)} className="text-acid/80 hover:text-acid">
                          ↓ {p}
                        </button>
                      ) : (
                        <span className="text-white/40">{p} (in the fulfillment zip)</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
