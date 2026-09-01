/** Interactive builders: 90-word pitch, subject-line engine, cadence board,
 *  90-day audit. All persist as account drafts (private, server-stored). */
import { useEffect, useMemo, useState } from "react";
import { fdApi } from "./lib/api";
import { useFd } from "./lib/store";
import { Blocks, Card, EmptyState, Spinner } from "./lib/ui";

type Draft = { id: string; kind: string; title: string; content: Record<string, unknown>; updated_at: string };

function useAsset<T>(key: string): T | null {
  const [v, setV] = useState<T | null | undefined>(undefined);
  useEffect(() => { fdApi.get<{ value: T }>(`course/assets/${key}`).then((r) => setV(r.value)).catch(() => setV(null)); }, [key]);
  return v === undefined ? null : v;
}
function useDrafts(kind: string) {
  const { toast } = useFd();
  const [rows, setRows] = useState<Draft[] | null>(null);
  const load = () => fdApi.get<{ drafts: Draft[] }>("drafts", { kind }).then((r) => setRows(r.drafts)).catch(() => setRows([]));
  useEffect(() => { void load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);
  const save = async (title: string, content: Record<string, unknown>, id?: string) => {
    await fdApi.post("drafts", { kind, title, content, id });
    toast("Draft saved to your account.", "ok");
    void load();
  };
  const del = async (id: string) => { await fdApi.del(`drafts/${id}`); void load(); };
  return { rows, save, del, reload: load };
}

const wc = (s: string) => (s || "").trim().split(/\s+/).filter(Boolean).length;

/* ── 90-word pitch ───────────────────────────────────────────────────── */

const PITCH_LINES = [
  ["hook", "Line 1 — the hook: who + where + the one proof"],
  ["story", "Line 2 — the story: why a listener at THIS station cares"],
  ["receipts", "Lines 3–4 — receipts: numbers/dates that can be shown"],
  ["ask", "Line 5 — the ask: the exact, small, reversible favor"],
  ["timing", "Line 6 — timing: add date / show date / event anchor"],
  ["close", "Close — one clause; stream link + clean-edit availability"],
];

export function PitchLab() {
  const vault = useAsset<{ n: number; title: string; subject: string; body: string; wordNote?: string }[]>("pitchVault");
  const [lane, setLane] = useState(0);
  const [f, setF] = useState<Record<string, string>>({});
  const [subject, setSubject] = useState("");
  const drafts = useDrafts("pitch");
  const body = PITCH_LINES.map(([k]) => f[k] || "").filter(Boolean).join(" ");
  const words = wc(body);
  const template = vault?.[lane];
  const total = wc(subject) + words;

  useEffect(() => {
    if (template) setSubject(template.subject);
  }, [template]);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
      <Card title="The 90-word weapon" sub="Every line earns its place. Subject ≤ 9 words; body ≤ 90 words. If it needs a paragraph, it needs a cut.">
        <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Pitch template lanes">
          {(vault || []).map((t, i) => (
            <button key={t.n} type="button" role="tab" aria-selected={lane === i} className={`fd-chip !text-[0.68rem] ${lane === i ? "border-[#f4c21d] text-[#f4c21d]" : ""}`} onClick={() => setLane(i)}>{t.title}</button>
          ))}
        </div>
        {template && (
          <div className="mb-3 rounded-lg border border-white/10 bg-black/25 p-3">
            <p className="fd-label">Template body (edit into your facts)</p>
            <p className="text-xs leading-5 text-white/60">{template.body}</p>
          </div>
        )}
        <label className="block mb-3">
          <span className="fd-label">Subject line {wc(subject) > 9 ? <span className="text-[#f0564f]">— {wc(subject)} words (cap: 9)</span> : <span className="text-[#46c8ac]">— {wc(subject)} words ✓</span>}</span>
          <input className="fd-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="From the Subject-Line Engine…" />
        </label>
        {PITCH_LINES.map(([k, label]) => (
          <label key={k} className="mb-2 block">
            <span className="fd-label flex justify-between">{label}<span className="tnum text-white/40">{wc(f[k] || "")}w</span></span>
            <textarea className="fd-textarea !min-h-[54px]" rows={2} value={f[k] || ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </label>
        ))}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className={`fd-display text-2xl ${total > 100 ? "text-[#f0564f]" : total > 90 ? "text-[#f5a623]" : "text-[#46c8ac]"}`}>{total} / 90 words</p>
          <button type="button" className="fd-btn fd-btn--sm" onClick={() => navigator.clipboard?.writeText(`Subject: ${subject}\n\n${body}`)}>Copy pitch</button>
          <button type="button" className="fd-btn fd-btn--gold fd-btn--sm" disabled={!body} onClick={() => drafts.save(subject || "Untitled pitch", { subject, lines: f, lane: template?.title })}>Save draft</button>
        </div>
      </Card>
      <Card title="Your pitch drafts" sub="Private, synced, never auto-sent">
        {drafts.rows === null ? <Spinner label="Loading…" /> : !drafts.rows.length ? <p className="text-sm text-white/50">Nothing saved yet.</p> : (
          <ul className="grid gap-2">
            {drafts.rows.map((d) => (
              <li key={d.id} className="rounded-lg border border-white/10 bg-black/20 p-2.5 text-sm">
                <p className="font-bold">{d.title}</p>
                <p className="mt-0.5 line-clamp-3 text-xs text-white/55">{String((d.content as { subject?: string }).subject || "")} — {String((d.content as { lines?: Record<string, string> }).lines?.hook || "")}</p>
                <div className="mt-1 flex gap-2">
                  <button type="button" className="text-xs text-[#6ea8fe] underline" onClick={() => { setSubject(String((d.content as { subject?: string }).subject || "")); setF((d.content as { lines?: Record<string, string> }).lines || {}); }}>Load</button>
                  <button type="button" className="text-xs text-[#f0564f] underline" onClick={() => drafts.del(d.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ── Subject-line engine ──────────────────────────────────────────────── */

export function SubjectLineLab() {
  const asset = useAsset<{ engines: { n: number; title: string; formulas: string[] }[]; rules: string[] }>("subjectLines");
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [engine, setEngine] = useState(0);
  const drafts = useDrafts("subject");
  if (!asset) return <Spinner label="Loading formulas…" />;
  const fill = (s: string) =>
    s.replace(/\[([^\]]+)\]/g, (m, name: string) => tokens[name] || tokens[name.toLowerCase()] || m);
  const TOKENS = Array.from(new Set(asset.engines.flatMap((e) => e.formulas).flatMap((f) => [...f.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]))));
  const lines = asset.engines[engine]?.formulas.map((f) => ({ raw: f, filled: fill(f), words: wc(fill(f)) })) || [];
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[340px_1fr]">
      <Card title="Fill your tokens" sub="Blank tokens stay bracketed — nothing gets sent half-empty">
        <div className="grid gap-2">
          {TOKENS.map((t) => (
            <label key={t} className="grid grid-cols-[130px_1fr] items-center gap-2 text-xs">
              <span className="font-mono text-[#f4c21d] truncate" title={t}>[{t}]</span>
              <input className="fd-input !min-h-[36px] !py-1" value={tokens[t] || ""} onChange={(e) => setTokens({ ...tokens, [t]: e.target.value })} placeholder={t.toLowerCase()} />
            </label>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-[#f0564f]/30 bg-[#f0564f]/5 p-2 text-xs text-white/70">
          <p className="fd-label !mb-1 text-[#f0564f]">Hard rules</p>
          <ul className="list-inside list-disc">{asset.rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      </Card>
      <Card title="The 30 formulas" right={
        <div className="flex gap-1.5">{asset.engines.map((e, i) => <button key={e.n} type="button" className={`fd-chip !text-[0.66rem] ${engine === i ? "border-[#f4c21d] text-[#f4c21d]" : ""}`} onClick={() => setEngine(i)}>#{e.n}</button>)}</div>
      }>
        <p className="mb-2 text-sm font-bold text-[#f4c21d]">{asset.engines[engine]?.title}</p>
        <ul className="grid gap-2">
          {lines.map((l) => (
            <li key={l.raw} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
              <p className="font-bold">{l.filled}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.68rem] text-white/40">
                <span className={l.words > 9 ? "text-[#f0564f]" : "text-[#46c8ac]"}>{l.words} words {l.words > 9 ? "— over the 9-word cap" : "✓"}</span>
                {/\[[^\]]+\]/.test(l.filled) && <span className="text-[#f5a623]">unfilled tokens remain</span>}
                <button type="button" className="ml-auto underline" onClick={() => drafts.save(l.filled, { line: l.filled, engine: asset.engines[engine].title })}>Save</button>
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ── 3-touch cadence board ───────────────────────────────────────────── */

export function FollowUpCadence() {
  const asset = useAsset<{ cadence: { touch: number; day: string; job: string; asset: string }[]; silence: string; never: string[] }>("followUps");
  const [receipts, setReceipts] = useState<Record<number, string>>({});
  if (!asset) return <Spinner />;
  return (
    <div className="grid gap-4">
      <Card title="The ceiling is the point" sub="Three touches, then permanent silence. Every touch carries NEW value or it doesn't exist.">
        <div className="grid gap-2 sm:grid-cols-3">
          {asset.cadence.map((c) => (
            <div key={c.touch} className="rounded-lg border border-white/10 bg-black/25 p-3">
              <p className="fd-display text-lg text-[#f4c21d]">Touch {c.touch} <span className="text-sm text-white/50">· day {c.day}</span></p>
              <p className="mt-1 text-sm font-bold">{c.job}</p>
              <p className="text-xs text-white/55">{c.asset}</p>
              <label className="mt-2 block text-xs"><span className="fd-label !mb-1">Your {c.touch === 1 ? "pitch" : c.touch === 2 ? "new receipt" : "graceful close"} (one line)</span>
                <input className="fd-input !min-h-[34px] !py-1" value={receipts[c.touch] || ""} onChange={(e) => setReceipts({ ...receipts, [c.touch]: e.target.value })} placeholder={c.touch === 2 ? "e.g. 212 tickets sold Fri — video: …" : c.touch === 3 ? "e.g. door stays open; archive with respect" : "…"} />
              </label>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-lg border-l-2 border-[#f0564f] bg-black/25 px-3 py-2 text-sm">{asset.silence}</p>
        <ul className="mt-3 grid gap-1 text-sm">
          {asset.never.map((n, i) => <li key={i} className="flex gap-2"><span className="text-[#f0564f]">✕</span>{n}</li>)}
        </ul>
        <p className="mt-3 text-xs text-white/50">Live logging of actual sends happens in your campaign board → Outreach log: the server enforces the cap, schedules +4d/+8d follow-ups on Tue–Thu, and cancels the ladder on any stop signal.</p>
      </Card>
    </div>
  );
}

/* ── 90-day audit ─────────────────────────────────────────────────────── */

export function AuditChecklist() {
  const asset = useAsset<{ title: string; blocks: never[] }[]>("audit");
  const drafts = useDrafts("audit");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [verdict, setVerdict] = useState("");
  useEffect(() => {
    const d = drafts.rows?.[0];
    if (d?.content) { setChecks((d.content as { checks?: Record<string, boolean> }).checks || {}); setVerdict((d.content as { verdict?: string }).verdict || ""); }
  }, [drafts.rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const parts = asset || [];
  const done = Object.values(checks).filter(Boolean).length;
  const totalKeys = Math.max(1, Object.keys(checks).length);
  return (
    <Card title="The 90-day audit" sub="Five parts, one verdict, zero vibes. Run it after every campaign — the discipline IS the product." right={
      <button type="button" className="fd-btn fd-btn--gold fd-btn--sm" onClick={() => drafts.save("90-day audit", { checks, verdict })}>Save audit</button>
    }>
      <p className="mb-3 text-xs text-white/55">{done}/{totalKeys} boxes checked — save restores where you left off.</p>
      {parts.map((p, pi) => (
        <section key={pi} className="mb-4">
          <p className="fd-display text-lg text-[#f4c21d]">{p.title}</p>
          <Blocks blocks={p.blocks as never} headingAs="h4" />
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <input type="checkbox" className="fd-check" checked={!!checks[`p${pi}`]} onChange={(e) => setChecks({ ...checks, [`p${pi}`]: e.target.checked })} />
            Part {pi + 1} completed with numbers pulled, not remembered
          </label>
        </section>
      ))}
      <label className="block">
        <span className="fd-label">The verdict (re-baseline statement)</span>
        <textarea className="fd-textarea" value={verdict} onChange={(e) => setVerdict(e.target.value)} placeholder={"“Keep X, kill Y, test Z next cycle” — one sentence per lever…"} />
      </label>
    </Card>
  );
}

export function _toolsInternal() {
  return { wc };
}
