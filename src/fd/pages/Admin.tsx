/** Admin console: enrollments (audited grant/revoke), entitlement audit,
 *  lesson/asset management, station imports, aggregate stats, users. */
import { useCallback, useEffect, useState } from "react";
import { fdApi, ApiFailure } from "../lib/api";
import { useFd } from "../lib/store";
import { Card, Spinner } from "../lib/ui";

type Tab = "stats" | "enrollments" | "audit" | "content" | "assets" | "stations" | "users";
const TABS: [Tab, string][] = [["stats", "Overview"], ["enrollments", "Enrollments"], ["audit", "Entitlement audit"], ["content", "Lessons"], ["assets", "Assets"], ["stations", "Stations DB"], ["users", "Users"]];

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("stats");
  return (
    <div className="grid gap-4">
      <header>
        <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.28em] text-[#f4c21d]">Administrator</p>
        <h1 className="fd-display mt-1 text-3xl">FD control room</h1>
      </header>
      <nav aria-label="Admin sections" className="flex flex-wrap gap-1.5">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" aria-current={tab === id ? "true" : undefined} className={`fd-chip !text-[0.72rem] ${tab === id ? "border-[#f4c21d] text-[#f4c21d]" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
      {tab === "stats" && <StatsTab />}
      {tab === "enrollments" && <EnrollmentsTab />}
      {tab === "audit" && <AuditTab />}
      {tab === "content" && <ContentTab />}
      {tab === "assets" && <AssetsTab />}
      {tab === "stations" && <StationsTab />}
      {tab === "users" && <UsersTab />}
    </div>
  );
}

function useJson<T>(path: string, query?: Record<string, string | number | undefined>) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => fdApi.get<T>(path, query).then(setData).catch((e) => setErr(e instanceof ApiFailure ? e.message : "load failed")), [path, JSON.stringify(query)]);
  useEffect(() => { void load(); }, [load]);
  return { data, err, load };
}

function StatsTab() {
  const { data } = useJson<{ counters: { key: string; value: number }[]; totals: Record<string, number>; avgLessonsDonePerUser: number; privacy: string }>("admin/stats");
  if (!data) return <Spinner />;
  return (
    <div className="grid gap-4">
      <p className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/60">🔒 {data.privacy}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Object.entries(data.totals || {}).map(([k, v]) => (
          <div key={k} className="fd-card p-3"><p className="fd-label !mb-0">{k}</p><p className="fd-display text-2xl">{v}</p></div>
        ))}
      </div>
      <Card title="App counters" sub="Bumped by the API; never include personal content">
        <table className="fd-table"><tbody>{(data.counters || []).map((c) => <tr key={c.key}><td className="text-white/60">{c.key}</td><td className="tnum text-right font-bold">{c.value}</td></tr>)}</tbody></table>
        <p className="mt-2 text-xs text-white/50">Average lessons completed per user (of 24): <strong className="tnum">{data.avgLessonsDonePerUser}</strong></p>
      </Card>
    </div>
  );
}

function EnrollmentsTab() {
  const { toast } = useFd();
  const [q, setQ] = useState("");
  const { data, load } = useJson<{ total: number; rows: Record<string, unknown>[] }>("admin/enrollments", { q });
  const [email, setEmail] = useState("");
  const act = async (action: string) => {
    const reason = prompt(`${action}: reason (required, goes to the audit log):`);
    if (!reason) return toast("Reason is required for entitlement actions.", "err");
    try { await fdApi.post("admin/entitlement", { email, action, reason }); toast(`“${action}” applied.`, "ok"); load(); }
    catch (e) { toast(e instanceof ApiFailure ? e.message : "Failed", "err"); }
  };
  return (
    <div className="grid gap-4">
      <Card title="Manual entitlement actions" sub="Webhook authority wins: manual grants survive; manual revokes stick until re-granted. Every row writes to the audit log.">
        <div className="flex flex-wrap gap-2">
          <input className="fd-input flex-1" placeholder="user email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          <button type="button" className="fd-btn fd-btn--gold fd-btn--sm" disabled={!email} onClick={() => act("grant")}>Grant</button>
          <button type="button" className="fd-btn fd-btn--sm" disabled={!email} onClick={() => act("revoke")}>Revoke (kills sessions)</button>
          <button type="button" className="fd-btn fd-btn--sm" disabled={!email} onClick={() => act("restore")}>Restore</button>
        </div>
      </Card>
      <Card title={`Enrollments (${data?.total ?? "…"})`} right={<input className="fd-input !w-56 !min-h-[34px] !py-1 text-xs" placeholder="search email" value={q} onChange={(e) => setQ(e.target.value)} />}>
        {!data ? <Spinner /> : (
          <div className="scroll-x"><table className="fd-table min-w-[760px]">
            <thead><tr><th>email</th><th>role</th><th>account</th><th>entitlement</th><th>source</th><th>granted</th><th>revoked / notes</th><th>lessons</th></tr></thead>
            <tbody>{data.rows.map((r) => (
              <tr key={`${String(r.id)}-${String(r.stripe_session_id || "e")}`}>
                <td>{String(r.email)}</td>
                <td>{String(r.role)}</td>
                <td className={r.status === "active" ? "text-[#46c8ac]" : "text-[#f0564f]"}>{String(r.status)}</td>
                <td className={r.ent_status === "active" ? "text-[#46c8ac]" : "text-white/60"}>{String(r.ent_status || "none")}</td>
                <td>{String(r.source || "—")}</td>
                <td className="text-xs text-white/50">{String(r.granted_at || "").slice(0, 10) || "—"}</td>
                <td className="text-xs text-[#f0564f]">{r.revoked_at ? String(r.revoked_at).slice(0, 10) + (r.admin_notes ? ` · ${String(r.admin_notes).slice(0, 40)}` : "") : "—"}</td>
                <td className="tnum">{String(r.lessons_done)}/24</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  );
}

function AuditTab() {
  const { data } = useJson<{ audit: Record<string, unknown>[] }>("admin/entitlement-audit");
  return (
    <Card title="Entitlement audit log" sub="Newest 200 rows — every grant/revoke/refund/dispute/restore with actor + reason">
      {!data ? <Spinner /> : (
        <div className="scroll-x"><table className="fd-table min-w-[680px]">
          <thead><tr><th>when</th><th>actor</th><th>action</th><th>target</th><th>reason</th></tr></thead>
          <tbody>{data.audit.map((r, i) => (
            <tr key={i}><td className="whitespace-nowrap text-xs text-white/55">{String(r.created_at).slice(0, 16).replace("T", " ")}</td><td>{String(r.actor_email || r.actor_user_id || "system")}</td><td className="font-bold">{String(r.action)}</td><td>{String(r.target)}</td><td className="text-white/60">{String(r.reason || "")}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </Card>
  );
}

function ContentTab() {
  const { toast } = useFd();
  const { data, load } = useJson<{ modules: Record<string, unknown>[]; lessons: Record<string, unknown>[] }>("admin/lessons");
  const [open, setOpen] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ title: string; minutes: number; published: boolean; bodyJson: string } | null>(null);
  const patch = async (id: string, body: Record<string, unknown>) => {
    try { await fdApi.post(`admin/lesson/${id}`, body); toast("Saved — cache version bumped.", "ok"); await load(); }
    catch (e) { toast(e instanceof ApiFailure ? e.message : "Failed", "err"); }
  };
  if (!data) return <Spinner />;
  return (
    <div className="grid gap-4">
      <Card title="Modules & lessons" sub="Publish gates student visibility; admin sees everything. Block content edits accept the lesson JSON shape (masterclass, exercise, pass…).">
        <ul className="grid gap-2">
          {data.modules.map((m) => (
            <li key={String(m.id)}>
              <p className="fd-label mt-2">{String(m.id)} — {String(m.title)} (pos {String(m.position)})</p>
              <table className="fd-table"><tbody>
                {data.lessons.filter((l) => l.module_id === m.id).map((l) => (
                  <tr key={String(l.id)}>
                    <td className="font-bold whitespace-nowrap">{String(l.code)}</td>
                    <td className="max-w-[240px] truncate">{String(l.title)}</td>
                    <td className="tnum text-white/55">{String(l.minutes)}m</td>
                    <td><span className={`fd-chip !py-0 ${l.published ? "text-[#46c8ac]" : "text-[#f5a623]"}`}>{l.published ? "published" : "draft"}</span></td>
                    <td className="whitespace-nowrap">
                      <button type="button" className="fd-btn fd-btn--sm" onClick={() => patch(String(l.id), { published: !l.published })}>{l.published ? "Unpublish" : "Publish"}</button>
                      <button type="button" className="fd-btn fd-btn--sm fd-btn--ghost ml-1" onClick={() => { setOpen(String(l.id)); setEdit({ title: String(l.title), minutes: Number(l.minutes), published: Boolean(l.published), bodyJson: "" }); }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody></table>
            </li>
          ))}
        </ul>
      </Card>
      {open && edit && (
        <Card title={`Edit ${open}`} right={<button type="button" className="fd-btn fd-btn--sm fd-btn--ghost" onClick={() => setOpen(null)}>Close</button>}>
          <form className="grid gap-3" onSubmit={async (e) => {
            e.preventDefault();
            const body: Record<string, unknown> = { title: edit.title, minutes: edit.minutes, published: edit.published };
            if (edit.bodyJson.trim()) {
              try { JSON.parse(edit.bodyJson); } catch { return toast("Override JSON invalid — fix it first.", "err"); }
              Object.assign(body, JSON.parse(edit.bodyJson));
            }
            await patch(open, body);
            setOpen(null);
          }}>
            <label><span className="fd-label">Title</span><input className="fd-input" value={edit.title} onChange={(ev) => setEdit({ ...edit, title: ev.target.value })} /></label>
            <label><span className="fd-label">Read minutes</span><input type="number" className="fd-input !w-32" value={edit.minutes} onChange={(ev) => setEdit({ ...edit, minutes: Number(ev.target.value) })} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="fd-check" checked={edit.published} onChange={(ev) => setEdit({ ...edit, published: ev.target.checked })} />published</label>
            <label><span className="fd-label">Block override (optional JSON: keys like masterclass / fieldProtocol / warnings / decoderNotes / worksheets / community / exercise / pass / toolLinks — arrays/objects replace wholesale)</span>
              <textarea className="fd-textarea font-mono !text-xs" rows={7} value={edit.bodyJson} onChange={(ev) => setEdit({ ...edit, bodyJson: ev.target.value })} placeholder='{"pass": {"minWords": 50, "note": "custom"}}' /></label>
            <button type="submit" className="fd-btn fd-btn--gold fd-btn--sm justify-self-start">Save lesson</button>
          </form>
        </Card>
      )}
    </div>
  );
}

function AssetsTab() {
  const { toast } = useFd();
  const [key, setKey] = useState("heatMapRules");
  const [val, setVal] = useState("");
  const [meta, setMeta] = useState("");
  return (
    <Card title="Course assets" sub="task-templates · decoder · subjectLines · pitchVault · followUps · audioVault · audit · epk · compliance · playbooks · releaseCalendar · relationship · arsenal · courseOverview · heatMapRules — edits bump versions live">
      <div className="flex flex-wrap gap-2">
        <select className="fd-select !w-56" value={key} onChange={(e) => { setKey(e.target.value); void fdApi.get<{ value: unknown; updated: string }>(`admin/asset/${e.target.value}`).then((r) => { setVal(JSON.stringify(r.value, null, 1)); setMeta(r.updated); }).catch(() => { setVal(""); setMeta("missing"); }); }}>
          {["task-templates", "decoder", "subjectLines", "pitchVault", "followUps", "audioVault", "audit", "epk", "compliance", "playbooks", "releaseCalendar", "relationship", "arsenal", "courseOverview", "heatMapRules"].map((k) => <option key={k}>{k}</option>)}
        </select>
        <span className="self-center text-xs text-white/45">updated {meta}</span>
        <button type="button" className="fd-btn fd-btn--gold fd-btn--sm ml-auto" onClick={async () => {
          try { const value = JSON.parse(val); await fdApi.post(`admin/asset/${key}`, { value }); toast("Asset saved.", "ok"); }
          catch (e) { toast(e instanceof SyntaxError ? "Invalid JSON — nothing saved." : e instanceof ApiFailure ? e.message : "Failed", "err"); }
        }}>Save JSON</button>
      </div>
      <textarea className="fd-textarea mt-3 font-mono !text-[0.72rem]" rows={18} value={val} onChange={(e) => setVal(e.target.value)} aria-label={`Asset ${key} JSON`} spellCheck={false} />
    </Card>
  );
}

function StationsTab() {
  const { toast } = useFd();
  const { data, load } = useJson<{ stats: Record<string, string | number>; batches: { import_batch: string; c: number; last: string }[]; rows?: Record<string, unknown>[] }>("admin/stations");
  const [importText, setImportText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-4">
      <Card title="Database health" sub="staleness + data-risk counters drive the “verify before sending” flags learners see">
        {!data ? <Spinner /> : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(data.stats || {}).map(([k, v]) => <p key={k} className="rounded-lg bg-black/25 px-3 py-2 text-sm"><span className="text-white/55">{k}: </span><strong className="tnum">{String(v)}</strong></p>)}
            </div>
            <p className="mt-2 text-xs text-white/50">Batches: {data.batches?.map((b) => `${b.import_batch} (${b.c})`).join(" · ")}</p>
          </>
        )}
      </Card>
      <Card title="Import stations" sub="JSON array or CSV — ≤2000 rows/hour limit 6×; rows UPSERT by callsign+city; new rows default to data_risk 10 & verified_at today">
        <textarea className="fd-textarea font-mono !text-xs" rows={7} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='[{"callsign":"WXYZ","dial":"91.5 FM","name":"WXYZ 91.5","city":"Denver","state":"CO","lat":39.74,"lon":-104.99,"coord_basis":"city","ring":"Ring 1/2","format":"AAA / Indie","gatekeeper_role":"Music Director","source_url":"https://…"}]' aria-label="Station import payload" />
        <button type="button" className="fd-btn fd-btn--gold fd-btn--sm mt-2" disabled={busy} onClick={async () => {
          setBusy(true);
          try {
            const isJson = importText.trim().startsWith("[");
            const r = await fdApi.post<{ upserted: number; errors: string[] }>("admin/stations-import", { format: isJson ? "json" : "csv", data: isJson ? JSON.parse(importText) : importText });
            toast(`Imported ${r.upserted} rows${r.errors.length ? ` · ${r.errors.length} skipped (see console)` : ""}.`, "warn");
            setImportText(""); await load();
          } catch (e) { toast(e instanceof ApiFailure ? e.message : "Import failed", "err"); } finally { setBusy(false); }
        }}>Run import</button>
      </Card>
    </div>
  );
}

function UsersTab() {
  const { toast } = useFd();
  const { data, load } = useJson<{ users: Record<string, unknown>[] }>("admin/users");
  const act = async (action: string, u: Record<string, unknown>, extra?: Record<string, unknown>) => {
    const reason = prompt(`${action} ${u.email}: reason (audit-logged):`);
    if (!reason) return toast("Reason required.", "err");
    await fdApi.post("admin/users", { action, userId: u.id, email: u.email, reason, ...extra });
    toast("Done.", "ok"); load();
  };
  return (
    <Card title={`Users (${data?.users.length ?? "…"})`}>
      {!data ? <Spinner /> : (
        <div className="scroll-x"><table className="fd-table min-w-[640px]">
          <thead><tr><th>email</th><th>role</th><th>status</th><th>joined</th><th></th></tr></thead>
          <tbody>{data.users.map((u) => (
            <tr key={String(u.id)}>
              <td>{String(u.email)}</td><td>{String(u.role)}</td>
              <td className={u.status === "active" ? "text-[#46c8ac]" : "text-[#f0564f]"}>{String(u.status)}</td>
              <td className="text-xs text-white/50">{String(u.created_at).slice(0, 10)}</td>
              <td className="whitespace-nowrap text-right">
                <button type="button" className="fd-btn fd-btn--sm" onClick={() => act("set-role", u, { role: u.role === "admin" ? "member" : "admin" })}>{u.role === "admin" ? "Demote" : "Make admin"}</button>{" "}
                {u.status === "active"
                  ? <button type="button" className="fd-btn fd-btn--sm fd-btn--danger" onClick={() => act("disable", u)}>Disable</button>
                  : <button type="button" className="fd-btn fd-btn--sm" onClick={() => act("enable", u)}>Enable</button>}
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </Card>
  );
}
