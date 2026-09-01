/** Private notes hub: general/campaign/station notes with tags, pins, search,
 *  revision history — plus the evidence ledger with approved-claim discipline. */
import { useCallback, useEffect, useState } from "react";
import { fdApi, ApiFailure } from "../lib/api";
import { useFd } from "../lib/store";
import { Card, SafeNotes, Spinner } from "../lib/ui";

type Note = { id: string; scope: string; ref_id: string; body: string; tags: string[]; pinned: boolean; updated_at: string; created_at: string };
type Evidence = { id: string; kind: string; title: string; url: string; object_key: string; raw_evidence: string; approved_claim: string; claim_status: string; source: string; verified_at: string | null; created_at: string; lesson_id?: string | null; station_id?: number | null };

export function NotesPage() {
  const { toast } = useFd();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [q, setQ] = useState("");
  const [scope, setScope] = useState("");
  const [editing, setEditing] = useState<Partial<Note> | null>(null);
  const [revisions, setRevisions] = useState<{ id: string; saved_at: string; size: number }[] | null>(null);
  const [evidence, setEvidence] = useState<Evidence[] | null>(null);
  const [evForm, setEvForm] = useState<null | Partial<Evidence>>(null);
  const [fileBusy, setFileBusy] = useState(false);

  const loadNotes = useCallback(() => {
    fdApi.get<{ notes: Note[] }>("notes", { q, scope }).then((r) => setNotes(r.notes)).catch(() => setNotes([]));
  }, [q, scope]);
  useEffect(() => { const t = setTimeout(loadNotes, 250); return () => clearTimeout(t); }, [loadNotes]);
  useEffect(() => { fdApi.get<{ evidence: Evidence[] }>("evidence").then((r) => setEvidence(r.evidence)).catch(() => setEvidence([])); }, []);

  const save = async (n: Partial<Note>) => {
    try {
      await fdApi.post("notes", { ...n, body: n.body ?? "" });
      setEditing(null);
      toast("Note saved.", "ok");
      loadNotes();
    } catch (e) { toast(e instanceof ApiFailure ? e.message : "Save failed", "err"); }
  };
  const remove = async (id: string) => {
    await fdApi.del(`notes/${id}`);
    loadNotes();
  };

  const addEvidence = async (form: Partial<Evidence> & { file?: File | null }) => {
    const { file, ...rest } = form;
    try {
      let objectKey = "";
      if (file) {
        setFileBusy(true);
        const init = await fdApi.post<{ url: string; key: string }>("evidence/upload-init", { name: file.name, type: file.type, size: file.size });
        const put = await fetch(init.url, { method: "PUT", headers: { "content-type": file.type || "application/octet-stream" }, body: file });
        if (!put.ok) throw new ApiErrorish(`Upload rejected (${put.status}) — storage misconfigured?`);
        await fdApi.post("evidence/upload-confirm", { key: init.key, name: file.name, type: file.type, size: file.size }).catch(() => undefined);
        objectKey = init.key;
        setFileBusy(false);
      }
      await fdApi.post("evidence", { ...rest, objectKey, kind: file ? "upload" : rest.url ? "link" : "text" });
      setEvForm(null);
      toast("Evidence stored. Keep claims 'raw' until source + date exist.", "ok");
      fdApi.get<{ evidence: Evidence[] }>("evidence").then((r) => setEvidence(r.evidence));
    } catch (e) { setFileBusy(false); toast(e instanceof ApiFailure ? e.message : "Evidence failed", "err"); }
  };

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.28em] text-[#f4c21d]">Notes & evidence</p>
        <h1 className="fd-display mt-1 text-3xl">Your private operational memory</h1>
        <p className="mt-1 max-w-2xl text-xs text-white/50">Server-stored, autosaved from lessons, yours only. Markdown-lite renders here; raw HTML never does. Evidence keeps the receipt next to the claim it supports.</p>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_440px]">
        <div className="grid gap-3">
          <div className="fd-no-print flex flex-wrap gap-2">
            <input className="fd-input flex-1" placeholder="Search your notes…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search notes" />
            <select className="fd-select !w-auto" value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Filter by scope">
              <option value="">all scopes</option><option value="general">general</option><option value="campaign">campaign</option><option value="station">station</option>
            </select>
            <button type="button" className="fd-btn fd-btn--gold" onClick={() => setEditing({ body: "", tags: [], scope: "general", pinned: false })}>+ New note</button>
          </div>

          {editing && (
            <NoteEditor initial={editing} onSave={save} onCancel={() => setEditing(null)} />
          )}

          {notes === null ? <Spinner /> : notes.length === 0 ? (
            <Card><p className="text-sm text-white/55">No notes yet. Lesson notes autosave here too — tag with #firstadds, #bounce, whatever you'll search for later.</p></Card>
          ) : (
            <ul className="grid gap-2">
              {notes.map((n) => (
                <li key={n.id} className="fd-card p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[0.68rem]">
                    <span className="fd-chip !py-0">{n.scope}{n.ref_id ? ` · ${n.ref_id.slice(0, 8)}` : ""}</span>
                    {n.pinned && <span className="fd-chip !py-0 text-[#f4c21d]">PINNED</span>}
                    {n.tags.map((t) => <span key={t} className="text-[#6ea8fe]">#{t}</span>)}
                    <span className="ml-auto text-white/40">{n.updated_at?.slice(0, 16).replace("T", " ")}</span>
                  </div>
                  <div className="mt-2"><SafeNotes text={n.body} /></div>
                  <div className="fd-no-print mt-2 flex flex-wrap gap-1.5 text-xs">
                    <button type="button" className="fd-btn fd-btn--sm" onClick={() => setEditing(n)}>Edit</button>
                    <button type="button" className="fd-btn fd-btn--sm" onClick={async () => { await fdApi.post("notes", { ...n, pinned: !n.pinned }); loadNotes(); }}>{n.pinned ? "Unpin" : "Pin"}</button>
                    <button type="button" className="fd-btn fd-btn--sm fd-btn--ghost" onClick={async () => { setRevisions([]); const r = await fdApi.get<{ revisions: { id: string; saved_at: string; size: number }[] }>(`notes/revisions/note/${n.id}`).catch(() => ({ revisions: [] })); setRevisions(r.revisions); }}>History ({revisions?.length ?? "…"})</button>
                    <button type="button" className="fd-btn fd-btn--sm fd-btn--danger" onClick={() => confirm("Archive this note? (recoverable via admin only)") && remove(n.id)}>Archive</button>
                  </div>
                  {editing?.id === n.id && revisions && (
                    <div className="mt-2 border-t border-white/10 pt-2 text-xs text-white/50">
                      {revisions.length ? revisions.map((r) => <span key={r.id} className="mr-3">{r.saved_at?.slice(0, 16).replace("T", " ")} · {r.size}B</span>) : <span>No snapshots yet — one is kept per 30-minute edit window (last 25).</span>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Card title="Evidence ledger" sub="Receipts for every claim you'll repeat in a pitch" right={
          <button type="button" className="fd-btn fd-btn--sm fd-btn--gold" onClick={() => setEvForm({ title: "", url: "", source: "", approvedClaim: "", rawEvidence: "", verifiedAt: "" })}>+ Add</button>
        }>
          {evForm != null && (
            <form className="mb-3 grid gap-2 rounded-lg border border-white/10 bg-black/25 p-3" onSubmit={async (e) => {
              e.preventDefault();
              const fd = (e.target as HTMLFormElement);
              const file = (fd.elements.namedItem("file") as HTMLInputElement)?.files?.[0] || null;
              await addEvidence({
                title: (fd.elements.namedItem("title") as HTMLInputElement).value,
                url: (fd.elements.namedItem("url") as HTMLInputElement).value,
                source: (fd.elements.namedItem("source") as HTMLInputElement).value,
                approvedClaim: (fd.elements.namedItem("claim") as HTMLTextAreaElement).value,
                rawEvidence: (fd.elements.namedItem("raw") as HTMLTextAreaElement).value,
                verifiedAt: (fd.elements.namedItem("vdate") as HTMLInputElement).value,
                claimStatus: (fd.elements.namedItem("status") as HTMLSelectElement).value,
                file,
              });
            }}>
              <input name="title" className="fd-input" placeholder="Title — e.g. “KCMU add email 9/12”" required />
              <div className="grid grid-cols-2 gap-2">
                <input name="url" className="fd-input" type="url" placeholder="Evidence URL (http[s])" />
                <input name="source" className="fd-input" placeholder="Source (who/where from)" />
              </div>
              <textarea name="raw" className="fd-textarea !min-h-[60px]" placeholder="Raw fact exactly as received (quote, numbers, date)…" />
              <textarea name="claim" className="fd-textarea !min-h-[60px]" placeholder="Approved claim — how you're allowed to state it" />
              <div className="grid grid-cols-2 gap-2">
                <input name="vdate" type="date" className="fd-input" aria-label="Verified on" />
                <select name="status" className="fd-select" aria-label="Claim status"><option value="raw">raw — not pitch-ready</option><option value="approved">approved</option><option value="rejected">rejected</option></select>
              </div>
              <label className="text-xs text-white/60">Attach a file (png/jpg/pdf/mp3/wav, ≤8MB — stored private in R2)
                <input name="file" type="file" className="mt-1 block w-full text-xs" disabled={fileBusy} />
              </label>
              <div className="flex gap-2">
                <button type="submit" className="fd-btn fd-btn--sm fd-btn--gold" disabled={fileBusy}>{fileBusy ? "Uploading…" : "Store evidence"}</button>
                <button type="button" className="fd-btn fd-btn--sm" onClick={() => setEvForm(null)}>Cancel</button>
              </div>
              <p className="text-[0.65rem] text-white/40">“Approved” requires a URL + source + verified date server-side, or it's stored as raw.</p>
            </form>
          )}
          {evidence === null ? <Spinner /> : evidence.length === 0 ? (
            <p className="text-sm text-white/55">Empty. Screenshots, spin counts (PMS/aircheck), playlist adds — one item per claim you repeat out loud.</p>
          ) : (
            <ul className="grid gap-2">
              {evidence.map((ev) => (
                <li key={ev.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                  <p className="font-bold">{ev.title || "Evidence"} <span className={`fd-chip !py-0 ml-1 ${ev.claim_status === "approved" ? "text-[#46c8ac]" : ev.claim_status === "rejected" ? "text-[#f0564f]" : "text-[#f5a623]"}`}>{ev.claim_status.toUpperCase()}</span></p>
                  {ev.approved_claim && <p className="mt-1 text-white/80">“{ev.approved_claim}”</p>}
                  {ev.raw_evidence && <p className="mt-1 whitespace-pre-line text-xs text-white/50">{ev.raw_evidence}</p>}
                  <p className="mt-1 text-xs text-white/50">
                    {ev.url && <a className="mr-3 text-[#6ea8fe] underline" href={ev.url} target="_blank" rel="noreferrer nofollow">open source</a>}
                    {ev.source && <>via {ev.source}</>}
                    {ev.verified_at && <> · verified {ev.verified_at}</>}
                    {ev.kind === "upload" && <span className="ml-2 text-white/40">[file in private vault]</span>}
                  </p>
                  <button type="button" className="fd-btn fd-btn--sm fd-btn--ghost mt-1" onClick={async () => { await fdApi.del("evidence", { id: ev.id }); fdApi.get<{ evidence: Evidence[] }>("evidence").then((r) => setEvidence(r.evidence)); }}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

class ApiErrorish extends Error {}

function NoteEditor({ initial, onSave, onCancel }: { initial: Partial<Note>; onSave: (n: Partial<Note>) => Promise<void>; onCancel: () => void }) {
  const [n, setN] = useState<Partial<Note>>({ tags: [], ...initial });
  const [tagInput, setTagInput] = useState("");
  return (
    <form className="fd-card grid gap-2 p-4" onSubmit={(e) => { e.preventDefault(); onSave({ ...n, tags: [...new Set([...(n.tags || []), ...tagInput.split(/[, ]+/).filter(Boolean)])] }); }}>
      <div className="flex flex-wrap gap-2">
        <select className="fd-select !w-auto" value={n.scope || "general"} onChange={(e) => setN({ ...n, scope: e.target.value })} aria-label="Note scope">
          <option value="general">general</option><option value="campaign">campaign</option><option value="station">station</option>
        </select>
        <input className="fd-input flex-1" placeholder="ref id (campaign/station — optional)" value={n.ref_id || ""} onChange={(e) => setN({ ...n, ref_id: e.target.value })} aria-label="Reference id" />
      </div>
      <textarea className="fd-textarea min-h-[140px]" value={n.body || ""} onChange={(e) => setN({ ...n, body: e.target.value })} placeholder={"Markdown-lite: **bold**, `code`, - lists, - [ ] tasks, #heading, [link](https://…)"} aria-label="Note body" autoFocus />
      <div className="flex flex-wrap items-center gap-2">
        {(n.tags || []).map((t) => <span key={t} className="fd-chip !py-0 text-[#6ea8fe]">#{t} <button type="button" aria-label={`Remove tag ${t}`} onClick={() => setN({ ...n, tags: (n.tags || []).filter((x) => x !== t) })}>✕</button></span>)}
        <input className="fd-input !w-40 !min-h-[32px] text-xs" placeholder="+ tags, comma sep" value={tagInput} onChange={(e) => setTagInput(e.target.value)} aria-label="Add tags" />
        <label className="ml-auto flex items-center gap-2 text-xs"><input type="checkbox" className="fd-check" checked={!!n.pinned} onChange={(e) => setN({ ...n, pinned: e.target.checked })} /> pinned</label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><p className="fd-label">Write</p><SafeNotes text={""} /></div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="fd-btn fd-btn--gold fd-btn--sm">Save</button>
        <button type="button" className="fd-btn fd-btn--sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
