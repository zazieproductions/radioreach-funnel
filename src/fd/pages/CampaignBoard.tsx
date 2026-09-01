/** Campaign board: dated task list (complete/skip/block/reschedule/edit),
 *  war-room targets with scoring + touch logging (3-cap enforced by server),
 *  outreach log, outcomes, snapshot + exports. */
import { useCallback, useEffect, useState } from "react";
import { fdApi, ApiFailure } from "../lib/api";
import { FdLink } from "../lib/router";
import { useFd } from "../lib/store";
import type { CampaignRow } from "../lib/store";
import { Card, EmptyState, Spinner } from "../lib/ui";

export type BoardTask = {
  id: string; day: number; phase: string; kind: string; title: string; detail: string; verification: string;
  wave: number | null; depends_on_day: number | null; scheduled_date: string; status: string;
  dependency: { day: number; status: string; done: boolean } | null; cancelled_reason?: string;
};
export type BoardTarget = {
  id: string; campaign_id: string; station_id: number; ring: string; status: string;
  format_fit: number; geo_relevance: number; access: number; timing: number; evidence: number; data_risk: number;
  total_score: number; tier: string; angle: string; verified_at: string | null; suppressed: number;
  callsign?: string; dial?: string; station_name?: string; city?: string; state?: string; format?: string;
  station_ring?: string; station_verified_at?: string; gatekeeper_name?: string | null; gatekeeper_role?: string | null;
};
export type Touch = { id: string; target_id: string; touch_no: number; channel: string; subject: string; sent_at: string; result: string; result_at: string | null; notes: string; wave: number; callsign?: string; station_name?: string };
export type Outcome = { id: string; target_id: string; kind: string; label: string; detail: string; verified: number; evidence_url: string; occurred_at: string; callsign?: string };

const TARGET_STATUSES = ["queued", "verified", "sent", "replied", "review", "added", "rotation", "declined", "cold", "suppressed"];
const POSITIVE = new Set(["replied", "review", "added", "rotation"]);
const RESULT_LABEL: Record<string, string> = {
  pending: "sent — awaiting", delivered: "delivered", bounce_hard: "hard bounce", bounce_soft: "soft bounce",
  replied: "human reply", replied_wrong_person: "wrong person", declined: "declined", optout: "opt-out", instruction: "instructions given", no_reply: "no answer",
};

export function CampaignBoard({ campaignId }: { campaignId: string }) {
  const { toast } = useFd();
  const [campaign, setCampaign] = useState<CampaignRow | null>(null);
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [targets, setTargets] = useState<BoardTarget[]>([]);
  const [tab, setTab] = useState<"today" | "all" | "targets" | "outreach" | "outcomes" | "export">("today");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const [c, t, tg] = await Promise.all([
        fdApi.get<{ campaign: CampaignRow; targetCount: number; taskStats: Record<string, number> }>(`campaigns/${campaignId}`),
        fdApi.get<{ tasks: BoardTask[]; today: BoardTask[]; overdue: BoardTask[]; date: string }>(`campaigns/${campaignId}/tasks`),
        fdApi.get<{ targets: BoardTarget[] }>(`campaigns/${campaignId}/targets`),
      ]);
      setCampaign(c.campaign); setTasks(t.tasks); setTargets(tg.targets);
    } catch (e) { setErr(e instanceof ApiFailure ? e.message : "Failed to load"); }
  }, [campaignId]);
  useEffect(() => { void load(); }, [load]);
  if (err) return <Card title="Campaign unavailable"><p className="text-sm text-white/70">{err}</p><button className="fd-btn mt-3" onClick={() => { setErr(""); void load(); }}>Retry</button></Card>;
  if (!campaign) return <Spinner label="Loading campaign…" />;
  const today = new Date().toISOString().slice(0, 10);
  const open = tasks.filter((t) => t.status === "pending" || t.status === "blocked");
  const overdue = open.filter((t) => t.scheduled_date < today);
  const dueToday = open.filter((t) => t.scheduled_date >= today && t.scheduled_date <= today);
  const visible = tab === "today" ? [...overdue, ...dueToday] : tab === "all" ? [...open, ...tasks.filter((t) => t.status !== "pending" && t.status !== "blocked")] : [];
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.28em] text-[#f4c21d]">Campaign board</p>
          <h1 className="fd-display mt-1 text-3xl truncate">{campaign.name}</h1>
          <p className="text-xs text-white/55">{campaign.artist}{campaign.releaseTitle ? ` · ${campaign.releaseTitle}` : ""} · Day 1: {campaign.startDate || "unset"} · {tasks.length} tasks ({doneCount} done) · {targets.length} targets</p>
        </div>
        <div className="fd-no-print ml-auto flex flex-wrap gap-2">
          {!campaign.active && <button type="button" className="fd-btn fd-btn--gold" onClick={async () => { await fdApi.post(`campaigns/${campaignId}/activate`); toast("Campaign activated — now the Command Deck's default.", "ok"); await load(); }}>Set active</button>}
          {campaign.status === "draft" && !campaign.startDate && (
            <button type="button" className="fd-btn" onClick={async () => {
              const d = prompt("Campaign start date (Day 1), YYYY-MM-DD:");
              if (!d) return;
              await fdApi.patch(`campaigns/${campaignId}`, { startDate: d });
              toast("Start date set — generating the 21-day schedule.", "ok");
              await fdApi.post(`campaigns/${campaignId}/generate-tasks`, {}).catch(() => undefined);
              await load();
            }}>Set start date & generate schedule</button>
          )}
          <button type="button" className="fd-btn" onClick={async () => {
            try { const r = await fdApi.post<{ tasks: number }>(`campaigns/${campaignId}/generate-tasks`, {}); toast(`${r.tasks} tasks generated from the plan.`, "ok"); await load(); }
            catch (e) {
              if (e instanceof ApiFailure && e.status === 409) {
                if (confirm(`${e.message} Replace them anyway?`)) { await fdApi.post(`campaigns/${campaignId}/generate-tasks`, { force: true }); toast("Schedule rebuilt.", "warn"); await load(); }
              } else toast(e instanceof ApiFailure ? e.message : "Rebuild blocked", "err");
            }
          }}>Rebuild schedule</button>
          <button type="button" className="fd-btn" onClick={async () => {
            const copy = confirm("Clone: verification dates and touch history are NEVER copied. Copy the station list as fresh queued targets too?");
            const r = await fdApi.post<{ id: string; note: string }>(`campaigns/${campaignId}/clone`, { copyTargets: copy });
            toast(r.note, "ok");
            location.hash = "";
            window.history.pushState({}, "", `/frequency-dominion/app/campaign/${r.id}`);
            window.dispatchEvent(new Event("fd:navigate"));
            await load();
          }}>Clone for next release</button>
        </div>
      </header>

      <div role="tablist" aria-label="Board views" className="fd-no-print flex flex-wrap gap-1.5">
        {([["today", `Today (${overdue.length + dueToday.length})`], ["all", `All tasks (${tasks.length})`], ["targets", `War room (${targets.length})`], ["outreach", "Outreach log"], ["outcomes", "Outcomes"], ["export", "Snapshot & export"]] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`fd-chip !text-[0.72rem] ${tab === id ? "border-[#f4c21d] text-[#f4c21d]" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {(tab === "today" || tab === "all") && (
        <>
          {tab === "today" && visible.length === 0 ? (
            <EmptyState icon="✓" title="Deck is clear" body="Nothing due today, nothing overdue. Next sends land Tue–Thu 9:15–10:30 AM station-local." action={<button type="button" className="fd-btn" onClick={() => setTab("all")}>See all tasks</button>} />
          ) : (
            <ol className="grid gap-3">
              {visible.map((t) => <TaskRow key={t.id} t={t} today={today} campaignId={campaignId} onSaved={load} />)}
            </ol>
          )}
          {tab === "all" && (
            <AddTask campaignId={campaignId} onSaved={load} />
          )}
        </>
      )}
      {tab === "targets" && <TargetsPanel campaignId={campaignId} targets={targets} onSaved={load} />}
      {tab === "outreach" && <OutreachPanel campaignId={campaignId} targets={targets} onSaved={load} />}
      {tab === "outcomes" && <OutcomesPanel campaignId={campaignId} targets={targets} onSaved={load} />}
      {tab === "export" && <ExportPanel campaignId={campaignId} plan={campaign.plan} />}
    </div>
  );
}

/* ── tasks ─────────────────────────────────────────────────────────────── */

function TaskRow({ t, today, campaignId, onSaved }: { t: BoardTask; today: string; campaignId: string; onSaved: () => Promise<void> }) {
  const { toast } = useFd();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: t.title, detail: t.detail, verification: t.verification });
  const depBlocked = t.dependency && !t.dependency.done && t.status === "pending";
  const overdue = t.status === "pending" && t.scheduled_date < today;
  const statusCls = t.status === "done" ? "text-[#46c8ac]" : t.status === "blocked" || overdue ? "text-[#f0564f]" : t.status === "skipped" || t.status === "cancelled" ? "text-white/40" : "text-[#f4c21d]";
  const patch = async (body: Record<string, unknown>, quiet = false) => {
    try {
      const r = await fdApi.patch<{ warning?: string }>(`campaigns/${campaignId}/tasks/${t.id}`, body);
      if (r.warning) toast(r.warning, "warn"); else if (!quiet) toast("Task updated.", "ok");
      await onSaved();
    } catch (e) { toast(e instanceof ApiFailure ? e.message : "Update failed", "err"); }
  };
  return (
    <li className="fd-card p-4" data-status={t.status}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="fd-chip !py-0.5">Day {t.day}</span>
        <span className="fd-chip !py-0.5" title="Scheduled date">{t.scheduled_date}</span>
        {t.phase && <span className="fd-chip !py-0.5 text-white/50">{t.phase}</span>}
        {t.wave ? <span className="fd-chip !py-0.5 text-[#6ea8fe]">Wave {t.wave}</span> : null}
        <span className={`fd-chip !py-0.5 ${statusCls}`}>{t.status.toUpperCase()}{overdue ? " · OVERDUE" : ""}</span>
      </div>
      {editing ? (
        <div className="mt-3 grid gap-2">
          <label className="block"><span className="fd-label">Title</span><input className="fd-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="block"><span className="fd-label">Detail</span><textarea className="fd-textarea" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} /></label>
          <label className="block"><span className="fd-label">Verification (how you know it's done)</span><input className="fd-input" value={form.verification} onChange={(e) => setForm({ ...form, verification: e.target.value })} /></label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="fd-btn fd-btn--sm fd-btn--gold" onClick={async () => { await patch({ ...form }); setEditing(false); }}>Save</button>
            <button type="button" className="fd-btn fd-btn--sm" onClick={() => { setEditing(false); setForm({ title: t.title, detail: t.detail, verification: t.verification }); }}>Cancel</button>
            <button type="button" className="fd-btn fd-btn--sm fd-btn--danger" onClick={async () => { if (confirm("Delete this task?")) await patch({ delete: true }); }}>Delete task</button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-[0.95rem] font-bold leading-snug">{t.title}</p>
          {t.detail && <p className="mt-1 whitespace-pre-line text-sm leading-6 text-white/65">{t.detail}</p>}
          {t.verification && <p className="mt-1 text-xs text-white/45">Done-check: {t.verification}</p>}
          {t.dependency && (
            <p className="mt-2 text-xs">
              Depends on Day {t.dependency.day}{" "}
              {t.dependency.done ? <span className="text-[#46c8ac]">— cleared ✓</span> : <span className="text-[#f0564f]">— still open; the sequence exists for a reason (completing anyway is allowed)</span>}
            </p>
          )}
          {t.cancelled_reason ? <p className="mt-1 text-xs text-[#f5a623]">Auto-cancelled: {t.cancelled_reason}</p> : null}
        </>
      )}
      {!editing && (
        <div className="fd-no-print mt-3 flex flex-wrap gap-2">
          {t.status !== "done" && t.status !== "cancelled" && (
            <button type="button" className="fd-btn fd-btn--sm fd-btn--gold" title={depBlocked ? "The dependency is still open — but you may proceed" : undefined} onClick={() => patch({ status: "done" })}>✓ Complete</button>
          )}
          {t.status === "pending" && <button type="button" className="fd-btn fd-btn--sm" onClick={() => patch({ status: "skipped", note: prompt("Why skip? (optional)") || "" })}>Skip</button>}
          {t.status === "pending" && <button type="button" className="fd-btn fd-btn--sm" onClick={() => patch({ status: "blocked", note: prompt("What is blocking this?") || "blocked" })}>Block</button>}
          {(t.status === "blocked" || t.status === "skipped") && <button type="button" className="fd-btn fd-btn--sm" onClick={() => patch({ status: "pending" })}>Reopen</button>}
          <button type="button" className="fd-btn fd-btn--sm" onClick={() => { const d = prompt(`Reschedule "${t.title}" to (YYYY-MM-DD):`, t.scheduled_date); if (d) patch({ scheduledDate: d }, true); }}>Reschedule</button>
          <button type="button" className="fd-btn fd-btn--sm fd-btn--ghost" onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}
    </li>
  );
}

function AddTask({ campaignId, onSaved }: { campaignId: string; onSaved: () => Promise<void> }) {
  const { toast } = useFd();
  const [title, setTitle] = useState("");
  return (
    <form className="fd-card flex flex-wrap gap-2 p-3" onSubmit={async (e) => {
      e.preventDefault();
      if (!title.trim()) return;
      await fdApi.post(`campaigns/${campaignId}/tasks`, { title });
      setTitle(""); toast("Custom task added.", "ok"); await onSaved();
    }}>
      <label className="flex-1"><span className="sr-only">New custom task</span><input className="fd-input" placeholder="+ Custom task (e.g. “Call KCMU after Show A”)…" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <button type="submit" className="fd-btn fd-btn--sm fd-btn--gold" disabled={!title.trim()}>Add</button>
    </form>
  );
}

/* ── war-room targets ──────────────────────────────────────────────────── */

function TargetsPanel({ campaignId, targets, onSaved }: { campaignId: string; targets: BoardTarget[]; onSaved: () => Promise<void> }) {
  const { toast } = useFd();
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const patchTarget = async (id: string, body: Record<string, unknown>) => {
    try { await fdApi.patch(`targets/${id}`, body); await onSaved(); } catch (e) { toast(e instanceof ApiFailure ? e.message : "Update failed", "err"); }
  };
  return (
    <div className="grid gap-3">
      <div className="fd-no-print flex flex-wrap gap-2">
        <button type="button" className="fd-btn fd-btn--sm fd-btn--gold" onClick={() => setAdding(true)}>+ Add stations from database</button>
        <button type="button" className="fd-btn fd-btn--sm" onClick={async () => {
          try { const r = await fdApi.post<{ added: number; wave: number; scheduledDate: string }>(`campaigns/${campaignId}/waves`, { stationIds: [], note: "Empty wave marker — add fresh targets after." }); toast(`Wave ${r.wave} created.`, "ok"); await onSaved(); }
          catch (e) { toast(e instanceof ApiFailure ? e.message : "Failed", "err"); }
        }}>+ Open next wave</button>
        <span className="self-center text-xs text-white/45">{targets.filter((t) => POSITIVE.has(t.status)).length} positive · {targets.filter((t) => t.suppressed).length} suppressed (kept for analytics, never re-contacted)</span>
      </div>
      {adding && <TargetAdder campaignId={campaignId} onDone={async () => { setAdding(false); await onSaved(); }} />}
      {!targets.length && !adding && (
        <EmptyState icon="📻" title="War room is empty" body="Activate a scheduled campaign to auto-pull the 20 from the wizard composition, or add stations from the 300-row database / heat map." action={<FdLink className="fd-btn fd-btn--sm" to="/frequency-dominion/app/heatmap">Heat map → bulk-select</FdLink>} />
      )}
      <ul className="grid gap-2.5">
        {targets.map((t) => (
          <li key={t.id} className={`fd-card p-3.5 ${t.suppressed ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="fd-display text-left text-base hover:text-[#f4c21d]" aria-expanded={open === t.id} onClick={() => setOpen(open === t.id ? null : t.id)}>{t.callsign} <span className="text-sm font-normal text-white/55">{t.station_name}</span></button>
              <span className="text-xs text-white/50">{t.city}, {t.state} · {t.format} {t.ring ? `· ${t.ring}` : ""}</span>
              <span className="fd-chip !py-0 text-[#f4c21d]" title="Weighted priority score (server math, Lesson 2.3)">{t.total_score}</span>
              {Number(t.data_risk) >= 10 && <span className="fd-chip !py-0 text-[#f0564f]" title="Data-risk ≥10 — re-verify before sending">VERIFY</span>}
              <span className={`fd-chip !py-0 ml-auto ${POSITIVE.has(t.status) ? "text-[#46c8ac]" : t.suppressed ? "text-white/35" : ""}`}>{t.status.replace(/_/g, " ")}{t.suppressed ? " · suppressed" : ""}</span>
            </div>
            {open === t.id && (
              <div className="mt-3 grid gap-3 border-t border-white/10 pt-3 text-[0.82rem] sm:grid-cols-2">
                <div>
                  <p className="fd-label">Contact (from verified database row)</p>
                  <p>{t.gatekeeper_name || <span className="text-white/40">no gatekeeper on file</span>} {t.gatekeeper_role ? `· ${t.gatekeeper_role}` : ""}</p>
                  <p className="text-white/50">Verified {t.station_verified_at || "—"} · re-verify per campaign before sending (Lesson 3.2).</p>
                  <label className="mt-2 block">
                    <span className="fd-label">Angle / lane notes (private)</span>
                    <textarea className="fd-textarea !min-h-[70px]" defaultValue={t.angle} onBlur={(e) => e.target.value !== t.angle && patchTarget(t.id, { angle: e.target.value })} />
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {t.suppressed
                      ? <button type="button" className="fd-btn fd-btn--sm" onClick={() => patchTarget(t.id, { suppressed: false })}>Un-suppress (needs written re-consent)</button>
                      : <button type="button" className="fd-btn fd-btn--sm fd-btn--danger" onClick={() => patchTarget(t.id, { suppressed: true, contactEmail: prompt("Suppressed email (optional)?") || "", reason: "manual suppression" })}>Suppress — do not contact</button>}
                    <button type="button" className="fd-btn fd-btn--sm fd-btn--ghost" onClick={async () => { if (confirm("Remove this target from the campaign?")) { await fdApi.del(`targets/${t.id}`); await onSaved(); } }}>Remove</button>
                  </div>
                </div>
                <div>
                  <p className="fd-label">Six-factor scores (0–100) — edit & rescore</p>
                  {(["format_fit", "geo_relevance", "access", "timing", "evidence", "data_risk"] as const).map((k) => (
                    <label key={k} className="mb-1 grid grid-cols-[130px_1fr_44px] items-center gap-2 text-xs">
                      <span className="text-white/55">{k.replace(/_/g, " ")}</span>
                      <input type="range" min={0} max={100} defaultValue={Number(t[k] ?? 0)} aria-label={`${k} score`}
                        onMouseUp={(e) => patchTarget(t.id, { [k]: Number((e.target as HTMLInputElement).value) })}
                        onKeyDown={(e) => e.key === "Enter" && patchTarget(t.id, { [k]: Number((e.target as HTMLInputElement).value) })} />
                      <span className="tnum text-right text-white/70">{Number(t[k] ?? 0)}</span>
                    </label>
                  ))}
                  <p className="fd-label mt-2">Status</p>
                  <select className="fd-select" value={t.status} onChange={(e) => patchTarget(t.id, { status: e.target.value })}>
                    {TARGET_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                  <label className="mt-2 block text-xs text-white/60">
                    Verified contact at:
                    <input type="date" className="fd-input !inline-block !w-auto !min-h-[34px] ml-2" defaultValue={t.verified_at || ""} onBlur={(e) => e.target.value && patchTarget(t.id, { verifiedAt: e.target.value })} />
                  </label>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TargetAdder({ campaignId, onDone, presetIds, onPresetUsed }: { campaignId: string; onDone: () => void; presetIds?: number[]; onPresetUsed?: () => void }) {
  const { toast } = useFd();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [sel, setSel] = useState<Set<number>>(new Set(presetIds || []));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => fdApi.get<{ rows: Record<string, unknown>[] }>(`stations`, { q: q || undefined, limit: 25 }).then((r) => setRows(r.rows)).catch(() => undefined), 250);
    return () => window.clearTimeout(t);
  }, [q]);
  const add = async () => {
    setBusy(true);
    try {
      const r = await fdApi.post<{ added: number; skippedSuppressed: number; message: string }>(`campaigns/${campaignId}/targets`, { stationIds: [...sel] });
      toast(`${r.added} targets added${r.skippedSuppressed ? ` — ${r.message}` : " (auto-scored; verification dates left empty)"}.`, "ok");
      onDone(); onPresetUsed?.();
    } catch (e) { toast(e instanceof ApiFailure ? e.message : "Add failed", "err"); } finally { setBusy(false); }
  };
  useEffect(() => { if (presetIds?.length) void add(); /* bulk add from heat map */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="fd-card p-4">
      <p className="fd-label">Search the 300-station curated database</p>
      <input className="fd-input" placeholder="call sign, city, state, format, specialty show…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search stations" />
      <ul className="mt-3 grid max-h-72 gap-1 overflow-y-auto">
        {rows.map((r) => (
          <li key={String(r.id)}>
            <label className="flex items-center gap-2.5 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/25">
              <input type="checkbox" className="fd-check" checked={sel.has(Number(r.id))} onChange={(e) => { const n = new Set(sel); e.target.checked ? n.add(Number(r.id)) : n.delete(Number(r.id)); setSel(n); }} />
              <span className="font-bold">{String(r.callsign)}</span> {String(r.name)} · {String(r.city)}, {String(r.state)} · {String(r.format)}
              <span className={`fd-chip !py-0 ml-auto ${Number(r.data_risk) >= 10 ? "text-[#f0564f]" : "text-white/40"}`}>{Number(r.data_risk) >= 10 ? "VERIFY" : `risk ${Number(r.data_risk) || 0}`}</span>
            </label>
          </li>
        ))}
        {!rows.length && <li className="px-2 py-3 text-sm text-white/45">No matches in the curated set — adjust the query, or use the heat map to browse by rings/formats.</li>}
      </ul>
      <div className="mt-3 flex gap-2">
        <button type="button" className="fd-btn fd-btn--gold fd-btn--sm" disabled={!sel.size || busy} onClick={add}>Add {sel.size || ""} to war room</button>
        <button type="button" className="fd-btn fd-btn--sm" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}

/* ── outreach log (touches) ───────────────────────────────────────────── */

function OutreachPanel({ campaignId, targets, onSaved }: { campaignId: string; targets: BoardTarget[]; onSaved: () => Promise<void> }) {
  const { toast } = useFd();
  const [touches, setTouches] = useState<Touch[] | null>(null);
  const [logFor, setLogFor] = useState<string | null>(null);
  const load = useCallback(() => fdApi.get<{ touches: Touch[] }>(`campaigns/${campaignId}/touches`).then((r) => setTouches(r.touches)).catch(() => setTouches([])), [campaignId]);
  useEffect(() => { void load(); }, [load]);
  return (
    <div className="grid gap-3">
      <div className="fd-no-print flex flex-wrap items-center gap-2">
        <select className="fd-select !w-auto" aria-label="Log a touch for station" value={logFor || ""} onChange={(e) => setLogFor(e.target.value || null)}>
          <option value="">Log a touch…</option>
          {targets.filter((t) => !t.suppressed).map((t) => <option key={t.id} value={t.id}>{t.callsign} — {t.station_name}</option>)}
        </select>
        <span className="text-xs text-white/45">Server enforces the 3-touch ceiling and auto-schedules follow-ups (+4d, +8d Tue–Thu). Stop signals cancel pending follow-ups and suppress the row.</span>
      </div>
      {logFor && <TouchForm targetId={logFor} campaignId={campaignId} targets={targets} onDone={async () => { setLogFor(null); await load(); await onSaved(); }} />}
      {touches === null ? <Spinner /> : touches.length === 0 ? (
        <EmptyState icon="📮" title="No outreach logged yet" body="Every send — email, phone, social, in-person, physical mail — gets a row here. Outcomes follow from the Outcomes tab." />
      ) : (
        <ul className="grid gap-2">
          {touches.map((x) => (
            <li key={x.id} className="fd-card flex flex-wrap items-center gap-2 px-3.5 py-2.5 text-sm">
              <span className="fd-chip !py-0">T{x.touch_no}</span>
              {x.wave ? <span className="fd-chip !py-0 text-[#6ea8fe]">wave {x.wave}</span> : null}
              <span className="font-bold">{x.callsign}</span>
              <span className="text-white/55">{x.station_name}</span>
              <span className="fd-chip !py-0">{x.channel}</span>
              <span className="text-xs text-white/45">{String(x.sent_at).slice(0, 16).replace("T", " ")}</span>
              {x.subject && <span className="truncate text-xs text-white/55" title={x.subject}>“{x.subject}”</span>}
              <span className={`fd-chip !py-0 ml-auto ${x.result === "replied" ? "text-[#46c8ac]" : ["bounce_hard", "declined", "optout"].includes(x.result) ? "text-[#f0564f]" : ""}`} title={x.notes || undefined}>{RESULT_LABEL[x.result] || x.result}</span>
              {!["replied", "delivered", "optout", "bounce_hard"].includes(x.result) && x.touch_no < 3 && (
                <div className="flex w-full flex-wrap justify-end gap-1.5">
                  {["delivered", "replied", "replied_wrong_person", "declined", "optout", "bounce_hard", "no_reply"].map((r) => (
                    <button key={r} type="button" className="fd-btn fd-btn--sm !min-h-[28px] !text-[0.68rem]" onClick={async () => {
                      try { await fdApi.patch(`touches/${x.id}`, { result: r }); toast(`Marked ${RESULT_LABEL[r]}.`, r === "optout" || r === "declined" ? "warn" : "ok"); await load(); await onSaved(); }
                      catch (e) { toast(e instanceof ApiFailure ? e.message : "Failed", "err"); }
                    }}>{RESULT_LABEL[r] || r}</button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TouchForm({ targetId, campaignId, targets, onDone }: { targetId: string; campaignId: string; targets: BoardTarget[]; onDone: () => Promise<void> }) {
  const { toast } = useFd();
  const t = targets.find((x) => x.id === targetId)!;
  const [f, setF] = useState({ channel: "email", subject: "", body: "", pitchVersion: "", sentAt: new Date().toISOString().slice(0, 10), result: "pending", notes: "" });
  return (
    <form className="fd-card grid gap-3 p-4" onSubmit={async (e) => {
      e.preventDefault();
      try {
        const r = await fdApi.post<{ touchNo: number; effects: string[] }>(`campaigns/${campaignId}/touches`, { targetId, ...f });
        toast(`Touch ${r.touchNo} logged.${r.effects.length ? " " + r.effects.join(" ") : ""}`, "ok");
        await onDone();
      } catch (ex) { toast(ex instanceof ApiFailure ? ex.message : "Failed", "err"); }
    }}>
      <p className="text-sm font-bold">Log touch — {t.callsign} ({t.station_name})</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label><span className="fd-label">Channel</span>
          <select className="fd-select" value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>{["email", "phone", "social", "in-person", "mail"].map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label><span className="fd-label">Sent date</span><input type="date" className="fd-input" value={f.sentAt} onChange={(e) => setF({ ...f, sentAt: e.target.value })} /></label>
        <label><span className="fd-label">Result so far</span>
          <select className="fd-select" value={f.result} onChange={(e) => setF({ ...f, result: e.target.value })}>{Object.entries(RESULT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </label>
      </div>
      <label><span className="fd-label">Subject</span><input className="fd-input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></label>
      <label><span className="fd-label">Message / call summary</span><textarea className="fd-textarea" rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="fd-label">Pitch version (for split testing)</span><input className="fd-input" placeholder="A / B / receipt-1…" value={f.pitchVersion} onChange={(e) => setF({ ...f, pitchVersion: e.target.value })} /></label>
        <label><span className="fd-label">Notes</span><input className="fd-input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="fd-btn fd-btn--gold fd-btn--sm">Log touch</button>
        <button type="button" className="fd-btn fd-btn--sm" onClick={() => void onDone()}>Cancel</button>
      </div>
    </form>
  );
}

/* ── outcomes ─────────────────────────────────────────────────────────── */

function OutcomesPanel({ campaignId, targets, onSaved }: { campaignId: string; targets: BoardTarget[]; onSaved: () => Promise<void> }) {
  const { toast } = useFd();
  const [rows, setRows] = useState<Outcome[] | null>(null);
  const load = useCallback(() => fdApi.get<{ outcomes: Outcome[] }>(`campaigns/${campaignId}/outcomes`).then((r) => setRows(r.outcomes)).catch(() => setRows([])), [campaignId]);
  useEffect(() => { void load(); }, [load]);
  const [f, setF] = useState({ targetId: "", kind: "review", label: "", detail: "", verified: false, evidenceUrl: "", occurredAt: new Date().toISOString().slice(0, 10) });
  return (
    <div className="grid gap-3">
      <form className="fd-card grid gap-3 p-4" onSubmit={async (e) => {
        e.preventDefault();
        if (!f.targetId) { toast("Pick the station the outcome came from.", "err"); return; }
        try {
          const r = await fdApi.post<{ note: string }>(`campaigns/${campaignId}/outcomes`, f);
          toast(`Outcome logged. ${r.note}`, "ok");
          setF({ ...f, label: "", detail: "" });
          await load(); await onSaved();
        } catch (ex) { toast(ex instanceof ApiFailure ? ex.message : "Failed", "err"); }
      }}>
        <p className="fd-label">Log an outcome — attach evidence or keep it flagged UNVERIFIED</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label><span className="fd-label">Station</span>
            <select className="fd-select" value={f.targetId} onChange={(e) => setF({ ...f, targetId: e.target.value })}>
              <option value="">Select…</option>
              {targets.map((t) => <option key={t.id} value={t.id}>{t.callsign} — {t.station_name}</option>)}
            </select>
          </label>
          <label><span className="fd-label">Kind</span>
            <select className="fd-select" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{["review", "interview", "feature", "spin", "library_add", "rotation_add", "chart", "playlist", "other"].map((k) => <option key={k}>{k}</option>)}</select>
          </label>
          <label><span className="fd-label">Date</span><input type="date" className="fd-input" value={f.occurredAt} onChange={(e) => setF({ ...f, occurredAt: e.target.value })} /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className="fd-label">Label (e.g. “Heavy rotation week of 9/14”)</span><input className="fd-input" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></label>
          <label><span className="fd-label">Evidence URL (aircheck, link, screenshot)</span><input className="fd-input" placeholder="https://…" value={f.evidenceUrl} onChange={(e) => setF({ ...f, evidenceUrl: e.target.value })} /></label>
        </div>
        <label><span className="fd-label">Detail</span><textarea className="fd-textarea !min-h-[70px]" value={f.detail} onChange={(e) => setF({ ...f, detail: e.target.value })} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="fd-check" checked={f.verified} onChange={(e) => setF({ ...f, verified: e.target.checked })} /> I have evidence this actually happened (this moves the station to verified status — do not check it loosely)</label>
        <button type="submit" className="fd-btn fd-btn--gold fd-btn--sm justify-self-start">Log outcome</button>
      </form>
      {rows === null ? <Spinner /> : rows.length === 0 ? <EmptyState icon="🏆" title="No outcomes yet" body="Reviews, interviews, spins, adds — everything with a station name attached lands here and feeds the analytics denominators." /> : (
        <ul className="grid gap-2">
          {rows.map((o) => (
            <li key={o.id} className="fd-card flex flex-wrap items-center gap-2 px-3.5 py-2.5 text-sm">
              <span className="fd-chip !py-0">{o.kind}</span>
              <span className="font-bold">{o.callsign}</span>
              <span>{o.label || o.detail}</span>
              <span className="text-xs text-white/45">{o.occurred_at}</span>
              <span className={`fd-chip !py-0 ml-auto ${o.verified ? "text-[#46c8ac]" : "text-[#f5a623]"}`}>{o.verified ? "VERIFIED" : "UNVERIFIED"}</span>
              {o.evidence_url && <a className="fd-chip !py-0 text-[#6ea8fe] underline" href={o.evidence_url} target="_blank" rel="noreferrer nofollow">evidence</a>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── snapshot & export ─────────────────────────────────────────────────── */

function ExportPanel({ campaignId, plan }: { campaignId: string; plan: Record<string, any> | null }) {
  const { toast } = useFd();
  const [label, setLabel] = useState(`Snapshot ${new Date().toISOString().slice(0, 10)}`);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-4">
      <Card title="Objective & hypothesis" sub="The wizard output stays editable — regenerate from the campaign answers any time">
        <p className="text-sm leading-6 text-white/80">{String(plan?.objective?.value || campaignId && "—")}</p>
        <p className="mt-2 text-sm leading-6 text-white/65">{String(plan?.hypothesis || "")}</p>
        {plan && <p className="mt-3 text-xs text-white/40">Plan generated {plan.generatedAt ? String(plan.generatedAt).slice(0, 10) : "(pre-update format)"} · rings: {plan.rings?.length || 0} · lanes: {plan.formatLanes?.length || 0}</p>}
      </Card>
      <Card title="Audit snapshot" sub="Freezes current metrics server-side for later comparison (the 90-day audit artifact)">
        <div className="flex flex-wrap gap-2">
          <input className="fd-input flex-1" aria-label="Snapshot label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <button type="button" className="fd-btn fd-btn--gold fd-btn--sm" disabled={busy} onClick={async () => {
            setBusy(true);
            try { await fdApi.post(`campaigns/${campaignId}/snapshot`, { label }); toast("Snapshot saved.", "ok"); }
            catch (e) { toast(e instanceof ApiFailure ? e.message : "Failed", "err"); } finally { setBusy(false); }
          }}>Save snapshot</button>
        </div>
      </Card>
      <Card title="Export" sub="CSV/JSON include targets, touches, outcomes with every denominator column">
        <div className="flex flex-wrap gap-2">
          <a className="fd-btn fd-btn--sm" href={`/api/fd/campaigns/${campaignId}/export?format=csv`}>Targets CSV</a>
          <a className="fd-btn fd-btn--sm" href={`/api/fd/campaigns/${campaignId}/export?format=csv&scope=touches`}>Touches CSV</a>
          <a className="fd-btn fd-btn--sm" href={`/api/fd/campaigns/${campaignId}/export?format=csv&scope=outcomes`}>Outcomes CSV</a>
          <a className="fd-btn fd-btn--sm" href={`/api/fd/campaigns/${campaignId}/export?format=json`}>Full JSON</a>
          <a className="fd-btn fd-btn--sm" href={`/api/fd/notes/export?format=md`}>Notes as Markdown</a>
        </div>
      </Card>
    </div>
  );
}

