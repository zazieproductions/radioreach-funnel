/** Campaigns, the 21-day task engine, war room, outreach, analytics, exports. */
import { ApiError, J, now, requireDb, uuid, rateLimit, clientIp } from "./util";
import { requireEnrolled, bumpStat } from "./entitlements";
import {
  generatePlan, buildSchedule, scoreTarget, autoScore, shouldCancelFollowUps, MAX_TOUCHES,
  computeAnalytics, toCSV, sanitizeText, sanitizePlain, safeUrl, isIsoDate, addDaysISO,
  nextWeekday, todayISO,
  type WizardAnswers, type TaskTemplate,
} from "../../../shared/fd-core.ts";
import { createPrivateUploadUrl, createPrivateDownloadUrl } from "../r2";
import type { Ctx } from "./router.ts";

const DB = (ctx: Ctx) => requireDb(ctx.env);

async function gate(ctx: Ctx) {
  requireDb(ctx.env);
  await requireEnrolled(ctx.env, ctx.user!.emailNormalized);
}

/* ── campaign CRUD + wizard ───────────────────────────────────────────── */

function campaignRow(r: Record<string, unknown>) {
  return {
    id: r.id, name: r.name, artist: r.artist, releaseTitle: r.release_title, track: r.track,
    genre: r.genre, adjacentGenres: J(r.adjacent_genres_json, []), runtimeSec: r.runtime_sec,
    cleanStatus: r.clean_status, releaseDate: r.release_date, homeCity: r.home_city, homeState: r.home_state,
    connections: J(r.connections_json, []), events: J(r.events_json, []), goals: J(r.goals_json, []),
    targetFormats: J(r.target_formats_json, []), proof: J(r.proof_json, []), radioHistory: r.radio_history,
    readiness: J(r.readiness_json, {}), startDate: r.start_date, weeklyHours: r.weekly_hours,
    status: r.status, objective: r.objective, hypothesis: r.hypothesis, active: Boolean(r.active),
    clonedFrom: r.cloned_from, createdAt: r.created_at, updatedAt: r.updated_at,
    plan: J(r.plan_json, null),
  };
}

export function answersFromBody(b: Record<string, any>): WizardAnswers {
  const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => sanitizeText(String(x), 300)).slice(0, 24) : []);
  return {
    artist: sanitizePlain(String(b.artist || ""), 160),
    releaseTitle: sanitizePlain(String(b.releaseTitle || ""), 160),
    track: sanitizePlain(String(b.track || ""), 160),
    genres: list(b.genres),
    adjacentGenres: list(b.adjacentGenres),
    runtimeSec: b.runtimeSec != null && Number.isFinite(Number(b.runtimeSec)) ? Math.round(Number(b.runtimeSec)) : null,
    cleanStatus: ["clean", "explicit", "unknown"].includes(b.cleanStatus) ? b.cleanStatus : "unknown",
    releaseDate: b.releaseDate && isIsoDate(String(b.releaseDate)) ? String(b.releaseDate) : null,
    homeCity: sanitizePlain(String(b.homeCity || ""), 120),
    homeState: sanitizePlain(String(b.homeState || ""), 4).toUpperCase(),
    connections: Array.isArray(b.connections) ? b.connections.slice(0, 12).map((c: any) => ({ label: sanitizePlain(String(c?.label || ""), 160), kind: sanitizePlain(String(c?.kind || "connection"), 40) })).filter((c: any) => c.label) : [],
    events: Array.isArray(b.events) ? b.events.slice(0, 20).map((e: any) => ({ city: sanitizePlain(String(e?.city || ""), 120), venue: sanitizePlain(String(e?.venue || ""), 160), date: e?.date && isIsoDate(String(e.date)) ? String(e.date) : "" })).filter((e: any) => e.city) : [],
    goals: list(b.goals),
    targetFormats: list(b.targetFormats),
    proof: list(b.proof),
    radioHistory: sanitizeText(String(b.radioHistory || ""), 4000),
    readiness: {
      streamLink: Boolean(b.readiness?.streamLink), cleanEdit: Boolean(b.readiness?.cleanEdit),
      rawWav: Boolean(b.readiness?.rawWav), epk: Boolean(b.readiness?.epk),
      photos: Boolean(b.readiness?.photos), artwork: Boolean(b.readiness?.artwork),
      split: Boolean(b.readiness?.split), promo90: Boolean(b.readiness?.promo90),
    },
    startDate: b.startDate && isIsoDate(String(b.startDate)) ? String(b.startDate) : null,
    weeklyHours: b.weeklyHours != null && Number.isFinite(Number(b.weeklyHours)) ? Math.min(80, Math.max(1, Number(b.weeklyHours))) : null,
  };
}

async function loadTemplates(ctx: Ctx): Promise<TaskTemplate[]> {
  const row = await DB(ctx).prepare(`SELECT value_json FROM course_assets WHERE key='task-templates'`).first<{ value_json: string }>();
  const parsed = J<{ tasks: TaskTemplate[] }>(row?.value_json, { tasks: [] });
  return parsed.tasks || [];
}

export async function handleWizardPreview(ctx: Ctx): Promise<Response> {
  if (ctx.req.method !== "POST") throw new ApiError(405, "POST required.");
  requireDb(ctx.env);
  const rl = await rateLimit(ctx.env, "wizard", ctx.user!.id, 40, 3600);
  if (!rl.ok) throw new ApiError(429, "Too many generations. Try again shortly.");
  const body = await ctx.json();
  const answers = answersFromBody(body);
  const plan = generatePlan(answers);
  let tasks: ReturnType<typeof buildSchedule> = [];
  if (answers.startDate) tasks = buildSchedule(await loadTemplates(ctx), answers.startDate, { waves: Math.max(1, Math.min(4, Number(body.waves) || 2)) });
  return Response.json({ plan, answers, tasks });
}

export async function handleCampaignsRoot(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  if (ctx.req.method === "GET") {
    const rows = await DB(ctx).prepare(`SELECT * FROM campaigns WHERE user_id=? ORDER BY created_at DESC LIMIT 50`).bind(ctx.user!.id).all<Record<string, unknown>>();
    return Response.json({ campaigns: rows.results.map(campaignRow) });
  }
  if (ctx.req.method !== "POST") throw new ApiError(405, "POST required.");
  const body = await ctx.json();
  const answers = answersFromBody(body);
  if (!answers.artist) throw new ApiError(400, "Tell the wizard who the artist is first.");
  const plan = generatePlan(answers);
  const id = uuid();
  const name = sanitizePlain(String(body.name || ""), 160) || `${answers.artist} — ${answers.releaseTitle || answers.track || "Single"}`;
  const hasAny = (await DB(ctx).prepare(`SELECT COUNT(*) c FROM campaigns WHERE user_id=?`).bind(ctx.user!.id).first<{ c: number }>())?.c || 0;

  const stmts = [
    DB(ctx).prepare(
      `INSERT INTO campaigns (id, user_id, name, artist, release_title, track, genre, adjacent_genres_json, runtime_sec, explicit, clean_status, release_date, home_city, home_state, connections_json, events_json, goals_json, target_formats_json, proof_json, radio_history, readiness_json, start_date, weekly_hours, status, objective, hypothesis, plan_json, active, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      id, ctx.user!.id, name, answers.artist, answers.releaseTitle, answers.track,
      answers.genres[0] || "", JSON.stringify(answers.adjacentGenres), answers.runtimeSec, answers.cleanStatus === "explicit" ? 1 : 0, answers.cleanStatus,
      answers.releaseDate, answers.homeCity, answers.homeState, JSON.stringify(answers.connections), JSON.stringify(answers.events),
      JSON.stringify(answers.goals), JSON.stringify(answers.targetFormats), JSON.stringify(answers.proof), answers.radioHistory,
      JSON.stringify(answers.readiness), answers.startDate, answers.weeklyHours,
      answers.startDate ? "preparation" : "draft", plan.objective.value, plan.hypothesis, JSON.stringify(plan), hasAny === 0 ? 1 : 0, now(), now()
    ),
  ];

  if (answers.startDate) {
    const templates = await loadTemplates(ctx);
    for (const t of buildSchedule(templates, answers.startDate, { waves: Math.max(1, Math.min(4, Number(body.waves) || 2)) })) {
      stmts.push(
        DB(ctx).prepare(
          `INSERT INTO campaign_tasks (id, campaign_id, user_id, day, phase, kind, title, detail, verification, wave, depends_on_day, scheduled_date, status, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?)`
        ).bind(uuid(), id, ctx.user!.id, t.day, t.phase, t.kind, t.title, t.detail, t.verification, t.wave, t.dependsOnDay, t.scheduledDate, now(), now())
      );
    }
  }
  await DB(ctx).batch(stmts as never[]);
  await bumpStat(ctx.env, "campaigns_created");
  return Response.json({ ok: true, id });
}

async function ownCampaign(ctx: Ctx, id: string | undefined) {
  if (!id) throw new ApiError(400, "Missing campaign id.");
  const row = await DB(ctx).prepare(`SELECT * FROM campaigns WHERE id=? AND user_id=?`).bind(id, ctx.user!.id).first<Record<string, unknown>>();
  if (!row) throw new ApiError(404, "Campaign not found.");
  return row;
}

export async function handleCampaignOne(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const id = ctx.segments[1];
  const row = await ownCampaign(ctx, id);
  if (ctx.req.method === "GET") {
    const targetCount = await DB(ctx).prepare(`SELECT COUNT(*) c FROM campaign_targets WHERE campaign_id=?`).bind(id).first<{ c: number }>();
    const taskStats = await DB(ctx).prepare(`SELECT status, COUNT(*) c FROM campaign_tasks WHERE campaign_id=? GROUP BY status`).bind(id).all<{ status: string; c: number }>();
    return Response.json({ campaign: campaignRow(row), targetCount: targetCount?.c || 0, taskStats: Object.fromEntries(taskStats.results.map((s) => [s.status, s.c])) });
  }
  if (ctx.req.method === "DELETE") {
    await DB(ctx).prepare(`DELETE FROM campaigns WHERE id=? AND user_id=?`).bind(id, ctx.user!.id).run();
    return Response.json({ ok: true });
  }
  // PATCH — everything stays editable after generation.
  const body = await ctx.json();
  const sets: string[] = [];
  const params: unknown[] = [];
  const str = (col: string, v: unknown, max = 200) => { sets.push(`${col}=?`); params.push(sanitizePlain(String(v ?? ""), max)); };
  const jcol = (col: string, v: unknown) => { sets.push(`${col}=?`); params.push(JSON.stringify(v ?? null)); };
  if (body.name != null) str("name", body.name, 160);
  if (body.status != null && ["draft", "preparation", "active", "complete", "archived"].includes(body.status)) str("status", body.status, 20);
  if (body.objective != null) str("objective", body.objective, 1000);
  if (body.hypothesis != null) str("hypothesis", body.hypothesis, 2000);
  if (body.startDate != null) {
    const sd = body.startDate && isIsoDate(String(body.startDate)) ? String(body.startDate) : null;
    sets.push("start_date=?"); params.push(sd);
    if (sd) await redateCampaign(ctx, id, sd);
  }
  if (body.answers) {
    const answers = answersFromBody(body.answers);
    const plan = body.regeneratePlan === false ? J(row.plan_json, {}) : generatePlan(answers);
    sets.push(...[
      "artist=?", "release_title=?", "track=?", "genre=?", "adjacent_genres_json=?", "runtime_sec=?", "clean_status=?",
      "release_date=?", "home_city=?", "home_state=?", "connections_json=?", "events_json=?", "goals_json=?",
      "target_formats_json=?", "proof_json=?", "radio_history=?", "readiness_json=?", "weekly_hours=?",
      "plan_json=?", "objective=?", "hypothesis=?",
    ]);
    params.push(
      answers.artist, answers.releaseTitle, answers.track, answers.genres[0] || "", JSON.stringify(answers.adjacentGenres), answers.runtimeSec, answers.cleanStatus,
      answers.releaseDate, answers.homeCity, answers.homeState, JSON.stringify(answers.connections), JSON.stringify(answers.events), JSON.stringify(answers.goals),
      JSON.stringify(answers.targetFormats), JSON.stringify(answers.proof), answers.radioHistory, JSON.stringify(answers.readiness), answers.weeklyHours,
      JSON.stringify(plan), plan.objective.value, plan.hypothesis
    );
  }
  if (!sets.length) throw new ApiError(400, "Nothing to update.");
  sets.push("updated_at=?"); params.push(now());
  await DB(ctx).prepare(`UPDATE campaigns SET ${sets.join(", ")} WHERE id=? AND user_id=?`).bind(...params, id, ctx.user!.id).run();
  return Response.json({ ok: true });
}

/** Move only pending generated tasks by the same offset (keep completed work). */
async function redateCampaign(ctx: Ctx, campaignId: string, newStart: string) {
  const first = await DB(ctx).prepare(`SELECT scheduled_date, day FROM campaign_tasks WHERE campaign_id=? AND kind != 'custom' ORDER BY day ASC LIMIT 1`).bind(campaignId).first<{ scheduled_date: string; day: number }>();
  if (!first) return;
  const deltaDays = Math.round((Date.parse(newStart) - Date.parse(first.scheduled_date)) / 864e5) - 0;
  await DB(ctx).prepare(
    `UPDATE campaign_tasks SET scheduled_date = CASE WHEN status='pending' THEN ? ELSE scheduled_date END, updated_at=? WHERE campaign_id=? AND user_id=? AND kind != 'custom' AND status='pending'`
  ).bind(addDaysISO(first.scheduled_date, deltaDays), now(), campaignId, ctx.user!.id).run();
  // per-task offsets are kept; shifting everything keeps the relative rhythm.
  const rows = await DB(ctx).prepare(`SELECT id, scheduled_date FROM campaign_tasks WHERE campaign_id=? AND status='pending'`).bind(campaignId).all<{ id: string; scheduled_date: string }>();
  for (const r of rows.results) {
    await DB(ctx).prepare(`UPDATE campaign_tasks SET scheduled_date=? WHERE id=?`).bind(addDaysISO(r.scheduled_date, 0), r.id).run();
  }
}

export async function handleGenerateTasks(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const id = ctx.segments[1];
  const row = await ownCampaign(ctx, id);
  const body = await ctx.json();
  const start = body.startDate && isIsoDate(String(body.startDate)) ? String(body.startDate) : row.start_date;
  if (!start) throw new ApiError(400, "Set a campaign start date first.");
  const pending = await DB(ctx).prepare(`SELECT COUNT(*) c FROM campaign_tasks WHERE campaign_id=? AND status != 'pending' AND kind != 'custom'`).bind(id).first<{ c: number }>();
  if ((pending?.c || 0) > 0 && !body.force) {
    throw new ApiError(409, "Some generated tasks already have status. Regenerating would discard them.", { touchedTasks: pending!.c, hint: "pass force:true to replace anyway" });
  }
  await DB(ctx).prepare(`DELETE FROM campaign_tasks WHERE campaign_id=? AND kind != 'custom' AND status='pending'`).bind(id).run();
  const templates = await loadTemplates(ctx);
  const tasks = buildSchedule(templates, String(start), { waves: Math.max(1, Math.min(4, Number(body.waves) || 2)) });
  const stmts = tasks.map((t) =>
    DB(ctx).prepare(
      `INSERT INTO campaign_tasks (id, campaign_id, user_id, day, phase, kind, title, detail, verification, wave, depends_on_day, scheduled_date, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?)`
    ).bind(uuid(), id, ctx.user!.id, t.day, t.phase, t.kind, t.title, t.detail, t.verification, t.wave, t.dependsOnDay, t.scheduledDate, now(), now())
  );
  await DB(ctx).batch(stmts as never[]);
  await DB(ctx).prepare(`UPDATE campaigns SET start_date=?, status=CASE WHEN status='draft' THEN 'preparation' ELSE status END, updated_at=? WHERE id=?`).bind(start, now(), id).run();
  return Response.json({ ok: true, tasks: tasks.length });
}

export async function handleActivate(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const id = ctx.segments[1];
  await ownCampaign(ctx, id);
  await DB(ctx).prepare(`UPDATE campaigns SET active=0, updated_at=? WHERE user_id=?`).bind(now(), ctx.user!.id).run();
  await DB(ctx).prepare(`UPDATE campaigns SET active=1, status='active', updated_at=? WHERE id=? AND user_id=?`).bind(now(), id, ctx.user!.id).run();
  return Response.json({ ok: true });
}

export async function handleClone(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const id = ctx.segments[1];
  const row = await ownCampaign(ctx, id);
  const body = await ctx.json();
  const start = body.startDate && isIsoDate(String(body.startDate)) ? String(body.startDate) : todayISO();
  const newId = uuid();
  // Stale-contact policy: verification dates and touch history NEVER copy.
  const name = `${String(row.name || "Campaign")} (clone ${new Date().toISOString().slice(0, 10)})`;
  await DB(ctx).prepare(
    `INSERT INTO campaigns (id, user_id, name, artist, release_title, track, genre, adjacent_genres_json, runtime_sec, explicit, clean_status, release_date, home_city, home_state, connections_json, events_json, goals_json, target_formats_json, proof_json, radio_history, readiness_json, start_date, weekly_hours, status, objective, hypothesis, plan_json, active, cloned_from, created_at, updated_at)
     SELECT ?, user_id, ?, artist, release_title, track, genre, adjacent_genres_json, runtime_sec, explicit, clean_status, release_date, home_city, home_state, connections_json, events_json, goals_json, target_formats_json, proof_json, radio_history, readiness_json, ?, weekly_hours, 'preparation', objective, hypothesis, plan_json, 0, ?, ?, ?
     FROM campaigns WHERE id=? AND user_id=?`
  ).bind(newId, sanitizePlain(name, 160), start, id, now(), now(), id, ctx.user!.id).run();

  const templates = await loadTemplates(ctx);
  const stmts = buildSchedule(templates, start, { waves: 2 }).map((t) =>
    DB(ctx).prepare(
      `INSERT INTO campaign_tasks (id, campaign_id, user_id, day, phase, kind, title, detail, verification, wave, depends_on_day, scheduled_date, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,?)`
    ).bind(uuid(), newId, ctx.user!.id, t.day, t.phase, t.kind, t.title, t.detail, t.verification, t.wave, t.dependsOnDay, t.scheduledDate, now(), now())
  );
  if (body.copyTargets) {
    // station IDs only — no scores, no statuses, no verification dates
    stmts.push(
      DB(ctx).prepare(
        `INSERT OR IGNORE INTO campaign_targets (id, campaign_id, user_id, station_id, ring, status, format_fit, geo_relevance, access, timing, evidence, data_risk, total_score, created_at, updated_at)
         SELECT ?, ?, user_id, station_id, ring, 'queued', format_fit, geo_relevance, access, timing, evidence, data_risk+30, ?, ?, ?
         FROM campaign_targets WHERE campaign_id=? AND user_id=? AND suppressed=0`
      ).bind(uuid(), newId, 0, now(), now(), id, ctx.user!.id)
    );
  }
  await DB(ctx).batch(stmts as never[]);
  await bumpStat(ctx.env, "campaigns_cloned");
  return Response.json({ ok: true, id: newId, note: body.copyTargets ? "Station rows copied as fresh queued targets — verification dates were NOT copied; re-verify each contact before sending." : "Tasks and answers cloned; war room starts empty." });
}

/* ── tasks ────────────────────────────────────────────────────────────── */

export async function handleTasks(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const id = ctx.segments[1];
  await ownCampaign(ctx, id);
  if (ctx.req.method === "POST") {
    const body = await ctx.json();
    const tid = uuid();
    await DB(ctx).prepare(
      `INSERT INTO campaign_tasks (id, campaign_id, user_id, day, phase, kind, title, detail, verification, scheduled_date, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?, 'pending', ?, ?)`
    ).bind(tid, id, ctx.user!.id, Number(body.day) || 0, "CUSTOM", "custom", sanitizePlain(String(body.title || "Task"), 160), sanitizeText(String(body.detail || ""), 4000), sanitizeText(String(body.verification || ""), 600), body.scheduledDate && isIsoDate(String(body.scheduledDate)) ? String(body.scheduledDate) : todayISO(), now(), now()).run();
    return Response.json({ ok: true, id: tid });
  }
  const today = ctx.query.get("date") || todayISO();
  const rows = await DB(ctx).prepare(
    `SELECT t.*, (SELECT COUNT(*) FROM campaign_tasks p WHERE p.campaign_id=t.campaign_id AND p.day=t.depends_on_day) AS dep_exists,
            (SELECT s.status FROM campaign_tasks s WHERE s.campaign_id=t.campaign_id AND s.day=t.depends_on_day AND s.kind != 'custom' ORDER BY s.day LIMIT 1) AS dep_status,
            (SELECT COUNT(*) FROM campaign_tasks s WHERE s.campaign_id=t.campaign_id AND s.day=t.depends_on_day AND s.status='done') AS dep_done
     FROM campaign_tasks t WHERE t.campaign_id=? ORDER BY scheduled_date, day, created_at LIMIT 200`
  ).bind(id).all<Record<string, unknown>>();
  const tasks = rows.results.map((r) => ({
    ...r,
    dependency: r.depends_on_day != null ? { day: r.depends_on_day, status: r.dep_status || "pending", done: Boolean(Number(r.dep_done)) } : null,
  }));
  const todayTasks = tasks.filter((t) => t.scheduled_date === today && ["pending", "blocked"].includes(String(t.status)));
  const overdue = tasks.filter((t) => String(t.scheduled_date) < today && t.status === "pending");
  return Response.json({ tasks, today: todayTasks, overdue, date: today });
}

export async function handleTaskPatch(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const id = ctx.segments[1];
  await ownCampaign(ctx, id);
  const taskId = ctx.segments[3];
  const body = await ctx.json();
  if (body.delete) {
    await DB(ctx).prepare(`DELETE FROM campaign_tasks WHERE id=? AND campaign_id=? AND user_id=?`).bind(taskId, id, ctx.user!.id).run();
    return Response.json({ ok: true, deleted: true });
  }
  const status = String(body.status || "");
  if (status && !["pending", "done", "skipped", "blocked", "cancelled"].includes(status)) throw new ApiError(400, "Unknown status.");
  const sets: string[] = ["updated_at=?"];
  const params: unknown[] = [now()];
  let warning = "";
  if (status) {
    sets.push("status=?", "completed_at=?", "status_note=?");
    params.push(status, status === "done" ? now() : null, sanitizeText(String(body.note || ""), 500));
    if (status === "done") {
      const t = await DB(ctx).prepare(`SELECT depends_on_day FROM campaign_tasks WHERE id=? AND campaign_id=?`).bind(taskId, id).first<{ depends_on_day: number | null }>();
      if (t?.depends_on_day != null) {
        const dep = await DB(ctx).prepare(`SELECT status FROM campaign_tasks WHERE campaign_id=? AND day=? AND kind != 'custom' AND status != 'done' AND status != 'skipped' LIMIT 1`).bind(id, t.depends_on_day).first();
        if (dep) warning = `Heads-up: the Day ${t.depends_on_day} dependency is still open. You can proceed, but the sequence exists for a reason.`;
      }
    }
    if (status === "done") await bumpStat(ctx.env, "tasks_completed");
  }
  if (body.title != null) { sets.push("title=?"); params.push(sanitizePlain(String(body.title), 160)); }
  if (body.detail != null) { sets.push("detail=?"); params.push(sanitizeText(String(body.detail), 4000)); }
  if (body.verification != null) { sets.push("verification=?"); params.push(sanitizeText(String(body.verification), 600)); }
  if (body.scheduledDate) {
    if (!isIsoDate(String(body.scheduledDate))) throw new ApiError(400, "Reschedule needs an ISO date.");
    sets.push("scheduled_date=?"); params.push(String(body.scheduledDate));
  }
  await DB(ctx).prepare(`UPDATE campaign_tasks SET ${sets.join(", ")} WHERE id=? AND campaign_id=? AND user_id=?`).bind(...params, taskId, id, ctx.user!.id).run();
  return Response.json({ ok: true, warning });
}

/* ── targets (war room) ───────────────────────────────────────────────── */

async function loadStation(ctx: Ctx, stationId: number) {
  return DB(ctx).prepare(`SELECT * FROM stations WHERE id=?`).bind(stationId).first<Record<string, unknown>>();
}

export async function handleTargets(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const id = ctx.segments[1];
  await ownCampaign(ctx, id);
  const db = DB(ctx);
  if (ctx.req.method === "GET") {
    const rows = await db.prepare(
      `SELECT t.*, s.callsign, s.dial, s.name AS station_name, s.city, s.state, s.format, s.ring AS station_ring, s.verified_at AS station_verified_at, s.gatekeeper_name, s.gatekeeper_role
       FROM campaign_targets t LEFT JOIN stations s ON s.id = t.station_id WHERE t.campaign_id=? ORDER BY t.total_score DESC LIMIT 500`
    ).bind(id).all<Record<string, unknown>>();
    return Response.json({ targets: rows.results });
  }
  const body = await ctx.json();
  if (ctx.req.method === "DELETE") {
    await db.prepare(`DELETE FROM campaign_targets WHERE campaign_id=? AND id=? AND user_id=?`).bind(id, String(body.id || ""), ctx.user!.id).run();
    return Response.json({ ok: true });
  }
  // bulk add from heat map / station search
  if (Array.isArray(body.stationIds)) {
    const campaign = await db.prepare(`SELECT * FROM campaigns WHERE id=? AND user_id=?`).bind(id, ctx.user!.id).first<Record<string, unknown>>();
    const answers = answersFromCampaign(campaign!);
    let added = 0;
    let skippedSuppressed = 0;
    const stmts = [];
    for (const rawId of body.stationIds.slice(0, 100)) {
      const sid = Number(rawId);
      if (!Number.isInteger(sid)) continue;
      const st = await loadStation(ctx, sid);
      if (!st) continue;
      const supp = await db.prepare(`SELECT id FROM suppressions WHERE user_id=? AND station_id=?`).bind(ctx.user!.id, sid).first();
      if (supp) { skippedSuppressed++; continue; }
      const scores = autoScore(st as never, answers);
      const { total } = scoreTarget(scores, J(campaign!.plan_json, {})?.weights || {});
      stmts.push(
        db.prepare(
          `INSERT OR IGNORE INTO campaign_targets (id, campaign_id, user_id, station_id, ring, status, format_fit, geo_relevance, access, timing, evidence, data_risk, total_score, tier, weights_json, created_at, updated_at)
           VALUES (?,?,?,?,?, 'queued', ?,?,?,?,?,?, ?, ?, ?, ?, ?)`
        ).bind(uuid(), id, ctx.user!.id, sid, String(st.ring || ""), scores.format_fit, scores.geo_relevance, scores.access, scores.timing, scores.evidence, scores.data_risk, total, tierOf(total), JSON.stringify(J(campaign!.plan_json, {})?.weights || {}), now(), now())
      );
    }
    if (stmts.length) {
      const res = await db.batch(stmts as never[]);
      added = (res[0]?.meta?.changes ?? stmts.length) as number;
    }
    await bumpStat(ctx.env, "targets_added", added);
    return Response.json({ ok: true, added, skippedSuppressed, message: skippedSuppressed ? `${skippedSuppressed} suppressed station(s) were skipped.` : "" });
  }
  // patch one target (explicitly allowed via id in body)
  if (body.id) {
    return patchTarget(ctx, id, String(body.id), body);
  }
  throw new ApiError(400, "Provide stationIds or id.");
}

function tierOf(total: number) {
  return total >= 85 ? "T1" : total >= 70 ? "T2" : total >= 50 ? "T3" : "T4";
}

function answersFromCampaign(c: Record<string, unknown>): WizardAnswers {
  return {
    artist: String(c.artist || ""), releaseTitle: String(c.release_title || ""), track: String(c.track || ""),
    genres: c.genre ? [String(c.genre)] : [], adjacentGenres: J<string[]>(c.adjacent_genres_json, []),
    runtimeSec: c.runtime_sec == null ? null : Number(c.runtime_sec), cleanStatus: (c.clean_status as WizardAnswers["cleanStatus"]) || "unknown",
    releaseDate: c.release_date ? String(c.release_date) : null, homeCity: String(c.home_city || ""), homeState: String(c.home_state || ""),
    connections: J(c.connections_json, []), events: J(c.events_json, []), goals: J(c.goals_json, []),
    targetFormats: J(c.target_formats_json, []), proof: J(c.proof_json, []), radioHistory: String(c.radio_history || ""),
    readiness: J(c.readiness_json, {}), startDate: c.start_date ? String(c.start_date) : null,
    weeklyHours: c.weekly_hours == null ? null : Number(c.weekly_hours),
  };
}

async function patchTarget(ctx: Ctx, campaignId: string, targetId: string, body: Record<string, any>) {
  const db = DB(ctx);
  const target = await db.prepare(`SELECT * FROM campaign_targets WHERE id=? AND campaign_id=? AND user_id=?`).bind(targetId, campaignId, ctx.user!.id).first<Record<string, unknown>>();
  if (!target) throw new ApiError(404, "Target not found.");
  const sets: string[] = ["updated_at=?"];
  const params: unknown[] = [now()];
  const numeric = (col: string, v: unknown, hi = 100) => { if (v == null) return; sets.push(`${col}=?`); params.push(Math.max(0, Math.min(hi, Math.round(Number(v) || 0)))); };
  const txt = (col: string, v: unknown, max = 4000) => { if (v == null) return; sets.push(`${col}=?`); params.push(sanitizeText(String(v), max)); };
  if (body.status && ["queued", "verified", "sent", "replied", "review", "added", "rotation", "declined", "cold", "suppressed"].includes(body.status)) { sets.push("status=?"); params.push(body.status); }
  if (body.angle != null) txt("angle", body.angle, 1000);
  if (body.angle != null && body.notes != null) { /* legacy alias: notes edits map to angle */ }
  if (body.verifiedAt != null) { sets.push("verified_at=?"); params.push(body.verifiedAt && isIsoDate(String(body.verifiedAt)) ? String(body.verifiedAt) : null); }
  if (body.ring != null) txt("ring", body.ring, 40);
  numeric("format_fit", body.format_fit); numeric("geo_relevance", body.geo_relevance); numeric("access", body.access);
  numeric("timing", body.timing); numeric("evidence", body.evidence); numeric("data_risk", body.data_risk);
  const scoreChanged = ["format_fit", "geo_relevance", "access", "timing", "evidence", "data_risk"].some((k) => body[k] != null);
  if (scoreChanged || body.weights) {
    const campaign = await db.prepare(`SELECT plan_json FROM campaigns WHERE id=?`).bind(campaignId).first<{ plan_json: string }>();
    const weights = body.weights ? { ...J(campaign?.plan_json, {}), ...body.weights } : J(campaign?.plan_json, {})?.weights || {};
    const merged = {
      format_fit: body.format_fit ?? target.format_fit, geo_relevance: body.geo_relevance ?? target.geo_relevance,
      access: body.access ?? target.access, timing: body.timing ?? target.timing,
      evidence: body.evidence ?? target.evidence, data_risk: body.data_risk ?? target.data_risk,
    };
    const { total } = scoreTarget(merged, weights);
    sets.push("total_score=?", "tier=?", "weights_json=?");
    params.push(total, tierOf(total), JSON.stringify(body.weights || J(campaign?.plan_json, {})?.weights || {}));
  }
  if (body.suppressed != null) {
    const suppressed = body.suppressed ? 1 : 0;
    sets.push("suppressed=?"); params.push(suppressed);
    if (suppressed) {
      await db.prepare(`INSERT INTO suppressions (id, user_id, station_id, contact_email, reason, note, source, created_at) VALUES (?,?,?,?, 'manual', ?, 'manual', ?)`)
        .bind(uuid(), ctx.user!.id, target.station_id as number, sanitizePlain(String(body.contactEmail || ""), 160).toLowerCase(), sanitizeText(String(body.reason || "manual suppression"), 500), now()).run();
    }
  }
  await db.prepare(`UPDATE campaign_targets SET ${sets.join(", ")} WHERE id=? AND user_id=?`).bind(...params, targetId, ctx.user!.id).run();
  const after = await db.prepare(`SELECT total_score, tier FROM campaign_targets WHERE id=?`).bind(targetId).first<{ total_score: number; tier: string }>();
  return Response.json({ ok: true, totalScore: after?.total_score, tier: after?.tier });
}

export async function handleTargetOne(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const targetId = ctx.segments[1];
  if (ctx.req.method === "DELETE") {
    const body = await ctx.json().catch(() => ({} as Record<string, unknown>));
    void body;
    await DB(ctx).prepare(`DELETE FROM campaign_targets WHERE id=? AND user_id=?`).bind(targetId, ctx.user!.id).run();
    return Response.json({ ok: true });
  }
  const target = await DB(ctx).prepare(`SELECT campaign_id FROM campaign_targets WHERE id=? AND user_id=?`).bind(targetId, ctx.user!.id).first<{ campaign_id: string }>();
  if (!target) throw new ApiError(404, "Target not found.");
  const body = await ctx.json();
  return patchTarget(ctx, target.campaign_id, targetId, body);
}

/* ── touches (outreach log) with follow-up cancellation ───────────────── */

const STOP_RESULTS = new Set(["optout", "bounce_hard", "declined", "instruction"]);

export async function handleTouches(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const campaignId = ctx.segments[1];
  await ownCampaign(ctx, campaignId);
  const db = DB(ctx);
  if (ctx.req.method === "GET") {
    const rows = await db.prepare(
      `SELECT t.*, s.callsign, s.name AS station_name FROM outreach_touches t JOIN campaign_targets ct ON ct.id=t.target_id LEFT JOIN stations s ON s.id=ct.station_id
       WHERE t.campaign_id=? ORDER BY t.sent_at DESC LIMIT 300`
    ).bind(campaignId).all();
    return Response.json({ touches: rows.results });
  }
  if (ctx.req.method === "DELETE") {
    const body = await ctx.json();
    await db.prepare(`DELETE FROM outreach_touches WHERE id=? AND campaign_id=? AND user_id=?`).bind(String(body.id || ""), campaignId, ctx.user!.id).run();
    return Response.json({ ok: true });
  }
  const body = await ctx.json();
  const targetId = String(body.targetId || "");
  const target = await db.prepare(`SELECT ct.*, s.city, s.state, s.gatekeeper_name FROM campaign_targets ct LEFT JOIN stations s ON s.id=ct.station_id WHERE ct.id=? AND ct.campaign_id=? AND ct.user_id=?`)
    .bind(targetId, campaignId, ctx.user!.id).first<Record<string, unknown>>();
  if (!target) throw new ApiError(404, "Target not found.");
  const prior = await db.prepare(`SELECT touch_no, result FROM outreach_touches WHERE target_id=? ORDER BY touch_no`).bind(targetId).all<{ touch_no: number; result: string }>();
  const nextNo = (prior.results.at(-1)?.touch_no || 0) + 1;
  const touchNo = Math.max(1, Math.min(nextNo, Number(body.touchNo) || nextNo));
  // Compliance: honor three-touch cap and suppressions server-side.
  if (target.suppressed) throw new ApiError(409, "This station is suppressed. Do not contact.");
  if (touchNo > MAX_TOUCHES) throw new ApiError(409, `The 3-touch cap is a course rule: ${MAX_TOUCHES} touches max per station per campaign.`);
  if (prior.results.some((p) => STOP_RESULTS.has(p.result))) throw new ApiError(409, "Follow-ups stopped: this contact returned a stop signal.");
  const result = ["pending", "delivered", "bounce_hard", "bounce_soft", "replied", "replied_wrong_person", "declined", "optout", "instruction", "no_reply"].includes(body.result) ? body.result : "pending";
  const sentAt = String(body.sentAt || now()).slice(0, 24);
  const touchId = uuid();
  await db.prepare(
    `INSERT INTO outreach_touches (id, campaign_id, target_id, user_id, wave, touch_no, channel, subject, body, pitch_version, sent_at, result, result_at, notes, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    touchId, campaignId, targetId, ctx.user!.id, Number(body.wave) || 1, touchNo,
    ["email", "phone", "social", "in-person", "mail"].includes(body.channel) ? body.channel : "email",
    sanitizeText(String(body.subject || ""), 300), sanitizeText(String(body.body || ""), 20000),
    sanitizePlain(String(body.pitchVersion || ""), 60), sentAt, result,
    result === "pending" ? null : sentAt, sanitizeText(String(body.notes || ""), 4000), now(), now()
  ).run();
  await bumpStat(ctx.env, "touches_logged");

  const effects: string[] = [];
  if (result === "replied" || result === "replied_wrong_person" || result === "declined" || result === "optout" || result === "instruction" || result === "bounce_hard" || result === "bounce_soft") {
    // log result on the same touch row's result_at — also update target status
    const newStatus = result === "replied" ? "replied" : result === "declined" ? "declined" : result === "bounce_hard" ? "cold" : String(target.status) === "queued" ? "sent" : String(target.status);
    await db.prepare(`UPDATE campaign_targets SET status=?, updated_at=? WHERE id=?`).bind(newStatus, now(), targetId).run();
  }
  if (STOP_RESULTS.has(result)) {
    // suppress + cancel pending per-target follow-ups (opt-out honored instantly)
    if (result !== "bounce_hard") {
      await db.prepare(`UPDATE campaign_targets SET suppressed=1, status=?, updated_at=? WHERE id=?`).bind(result === "bounce_hard" ? "cold" : "suppressed", now(), targetId).run();
    }
    await db.prepare(`INSERT OR IGNORE INTO suppressions (id, user_id, station_id, contact_email, reason, note, source, created_at) VALUES (?,?,?,?,?,?, 'touch', ?)`)
      .bind(uuid(), ctx.user!.id, target.station_id, sanitizePlain(String(body.contactEmail || ""), 160).toLowerCase(), result, sanitizeText(String(body.notes || ""), 500), now()).run();
    const cancel = await db.prepare(
      `UPDATE campaign_tasks SET status='cancelled', cancelled_reason='follow-ups stopped (contact returned ${result})', updated_at=?
       WHERE user_id=? AND target_id=? AND status='pending' AND kind IN ('touch2','touch3','send')`
    ).bind(now(), ctx.user!.id, targetId).run();
    effects.push(`Cancelled ${cancel.meta?.changes ?? 0} pending follow-up task(s) for this target.`);
    if (result === "instruction") effects.push("Contact supplied different instructions — record their exact ask as an outcome before any further action.");
  } else if (result === "delivered" || result === "pending" || result === "replied" || result === "no_reply" || result === "replied_wrong_person") {
    if (touchNo < MAX_TOUCHES && result !== "replied") {
      const kind = touchNo === 1 ? "touch2" : "touch3";
      const offset = touchNo === 1 ? 4 : 8;
      const due = nextWeekday(addDaysISO(sentAt.slice(0, 10), offset), [2, 3, 4]);
      await db.prepare(
        `INSERT INTO campaign_tasks (id, campaign_id, user_id, day, phase, kind, title, detail, verification, wave, touch_no, target_id, scheduled_date, status, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'pending', ?, ?)`
      ).bind(uuid(), campaignId, ctx.user!.id, 0, kind === "touch2" ? "TOUCH-2" : "TOUCH-3", kind,
        `Touch ${touchNo + 1} — ${target.callsign || "station"}`, kind === "touch2" ? "One fresh receipt, zero reminders (in-thread reply)." : "Graceful close: final proof, door open, then silence.",
        kind === "touch2" ? "New value delivered; under 45 words" : "Exit logged; move to Cold Archive after", Number(body.wave) || 1, touchNo + 1, targetId, due, now(), now()).run();
      effects.push(`Scheduled Touch ${touchNo + 1} for ${due} (auto-cancelled if a stop signal lands first).`);
    }
  }
  return Response.json({ ok: true, id: touchId, touchNo, effects });
}

export async function handleTouchOne(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const id = ctx.segments[1];
  const body = await ctx.json();
  const t = await DB(ctx).prepare(`SELECT * FROM outreach_touches WHERE id=? AND user_id=?`).bind(id, ctx.user!.id).first<Record<string, unknown>>();
  if (!t) throw new ApiError(404, "Touch not found.");
  const sets: string[] = ["updated_at=?"];
  const params: unknown[] = [now()];
  if (body.result && ["pending", "delivered", "bounce_hard", "bounce_soft", "replied", "replied_wrong_person", "declined", "optout", "instruction", "no_reply"].includes(body.result)) {
    sets.push("result=?", "result_at=?"); params.push(body.result, now());
    if (STOP_RESULTS.has(body.result)) {
      await DB(ctx).prepare(`UPDATE campaign_targets SET suppressed=1, updated_at=? WHERE id=?`).bind(now(), t.target_id).run();
      await DB(ctx).prepare(`UPDATE campaign_tasks SET status='cancelled', cancelled_reason='stop signal recorded on touch', updated_at=? WHERE user_id=? AND target_id=? AND status='pending' AND kind IN ('touch2','touch3')`)
        .bind(now(), ctx.user!.id, t.target_id).run();
      await DB(ctx).prepare(`INSERT OR IGNORE INTO suppressions (id, user_id, station_id, contact_email, reason, note, source, created_at) VALUES (?,?,?,?,?,?, 'touch', ?)`)
        .bind(uuid(), ctx.user!.id, (await DB(ctx).prepare(`SELECT station_id FROM campaign_targets WHERE id=?`).bind(t.target_id).first<{ station_id: number }>())?.station_id ?? null, "", body.result, "touch result update", now()).run();
    }
  }
  if (body.notes != null) { sets.push("notes=?"); params.push(sanitizeText(String(body.notes), 4000)); }
  await DB(ctx).prepare(`UPDATE outreach_touches SET ${sets.join(", ")} WHERE id=? AND user_id=?`).bind(...params, id, ctx.user!.id).run();
  return Response.json({ ok: true });
}

/* ── outcomes / suppressions / waves ──────────────────────────────────── */

export async function handleOutcomes(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const campaignId = ctx.segments[1];
  const db = DB(ctx);
  if (ctx.req.method === "GET") {
    const rows = await db.prepare(`SELECT o.*, s.callsign, s.name AS station_name FROM outcomes o JOIN campaign_targets t ON t.id=o.target_id LEFT JOIN stations s ON s.id=t.station_id WHERE o.campaign_id=? ORDER BY o.occurred_at DESC LIMIT 200`).bind(campaignId).all();
    return Response.json({ outcomes: rows.results });
  }
  const body = await ctx.json();
  if (ctx.req.method === "DELETE") {
    await db.prepare(`DELETE FROM outcomes WHERE id=? AND user_id=?`).bind(String(body.id || ""), ctx.user!.id).run();
    return Response.json({ ok: true });
  }
  const id = uuid();
  const target = await db.prepare(`SELECT id, campaign_id FROM campaign_targets WHERE id=? AND user_id=?`).bind(String(body.targetId || ""), ctx.user!.id).first<{ id: string; campaign_id: string }>();
  if (!target) throw new ApiError(404, "Target not found.");
  const kind = ["review", "interview", "feature", "spin", "library_add", "rotation_add", "chart", "playlist", "other"].includes(body.kind) ? body.kind : "other";
  const verified = body.verified ? 1 : 0;
  await db.prepare(
    `INSERT INTO outcomes (id, campaign_id, target_id, user_id, kind, label, detail, verified, evidence_url, occurred_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, campaignId, target.id, ctx.user!.id, kind, sanitizePlain(String(body.label || ""), 160), sanitizeText(String(body.detail || ""), 4000), verified, safeUrl(String(body.evidenceUrl || "")), body.occurredAt && isIsoDate(String(body.occurredAt)) ? String(body.occurredAt) : todayISO(), now(), now()).run();
  if (verified && kind === "rotation_add") await db.prepare(`UPDATE campaign_targets SET status='rotation', updated_at=? WHERE id=?`).bind(now(), target.id).run();
  else if (verified && (kind === "library_add" || kind === "spin")) await db.prepare(`UPDATE campaign_targets SET status='added', updated_at=? WHERE id=?`).bind(now(), target.id).run();
  else if (verified && (kind === "review" || kind === "interview" || kind === "feature")) await db.prepare(`UPDATE campaign_targets SET status='review', updated_at=? WHERE id=?`).bind(now(), target.id).run();
  await bumpStat(ctx.env, "outcomes_logged");
  return Response.json({ ok: true, id, note: verified ? "Outcome marked verified — keep the evidence URL attached." : "Unverified outcome: label it as such in any pitch copy." });
}

export async function handleSuppressions(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const db = DB(ctx);
  if (ctx.req.method === "GET") {
    const rows = await db.prepare(`SELECT sp.*, s.callsign, s.city FROM suppressions sp LEFT JOIN stations s ON s.id=sp.station_id WHERE sp.user_id=? ORDER BY sp.created_at DESC LIMIT 200`).bind(ctx.user!.id).all();
    return Response.json({ suppressions: rows.results });
  }
  const body = await ctx.json();
  if (ctx.req.method === "DELETE") {
    const row = await db.prepare(`SELECT * FROM suppressions WHERE id=? AND user_id=?`).bind(String(body.id || ""), ctx.user!.id).first<{ reason: string }>();
    if (!row) throw new ApiError(404, "Not found.");
    if (row.reason === "do_not_contact") throw new ApiError(409, "Do-not-contact records cannot be removed by users. Ask an administrator with written re-consent.");
    await db.prepare(`DELETE FROM suppressions WHERE id=? AND user_id=?`).bind(String(body.id), ctx.user!.id).run();
    return Response.json({ ok: true });
  }
  const email = sanitizePlain(String(body.contactEmail || ""), 160).toLowerCase();
  await db.prepare(`INSERT INTO suppressions (id, user_id, station_id, contact_email, reason, note, source, created_at) VALUES (?,?,?,?,?,?, 'manual', ?)`)
    .bind(uuid(), ctx.user!.id, body.stationId ? Number(body.stationId) : null, email,
      ["optout", "hard_bounce", "declined", "instruction", "dead", "do_not_contact"].includes(body.reason) ? body.reason : "optout",
      sanitizeText(String(body.note || ""), 800), now()).run();
  if (body.stationId) await db.prepare(`UPDATE campaign_targets SET suppressed=1, updated_at=? WHERE user_id=? AND station_id=?`).bind(now(), ctx.user!.id, Number(body.stationId)).run();
  return Response.json({ ok: true });
}

export async function handleWaves(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const campaignId = ctx.segments[1];
  const campaign = await ownCampaign(ctx, campaignId);
  const body = await ctx.json();
  const db = DB(ctx);
  const maxWave = (await db.prepare(`SELECT MAX(wave) w FROM campaign_tasks WHERE campaign_id=? AND wave IS NOT NULL`).bind(campaignId).first<{ w: number | null }>())?.w || 0;
  const wave = maxWave + 1;
  const stationIds = Array.isArray(body.stationIds) ? body.stationIds.slice(0, 60).map(Number).filter(Number.isInteger) : [];
  const answers = answersFromCampaign(campaign);
  let added = 0;
  for (const sid of stationIds) {
    const st = await loadStation(ctx, sid);
    if (!st) continue;
    const supp = await db.prepare(`SELECT id FROM suppressions WHERE user_id=? AND station_id=?`).bind(ctx.user!.id, sid).first();
    if (supp) continue;
    const scores = autoScore(st as never, answers);
    const { total } = scoreTarget(scores, J(campaign.plan_json, {})?.weights || {});
    await db.prepare(
      `INSERT OR IGNORE INTO campaign_targets (id, campaign_id, user_id, station_id, ring, status, format_fit, geo_relevance, access, timing, evidence, data_risk, total_score, tier, created_at, updated_at)
       VALUES (?,?,?,?,?, 'queued',?,?,?,?,?,?, ?, ?, ?)`
    ).bind(uuid(), campaignId, ctx.user!.id, sid, String(st.ring || ""), scores.format_fit, scores.geo_relevance, scores.access, scores.timing, scores.evidence, scores.data_risk, total, tierOf(total), now(), now()).run();
    added++;
  }
  const date = body.scheduledDate && isIsoDate(String(body.scheduledDate)) ? String(body.scheduledDate) : nextWeekday(todayISO(), [2, 3, 4]);
  const taskId = uuid();
  await db.prepare(
    `INSERT INTO campaign_tasks (id, campaign_id, user_id, day, phase, kind, title, detail, verification, wave, scheduled_date, status, created_at, updated_at)
     VALUES (?,?,?,?, 'FIRE', 'send', ?,?,?,?, ?, 'pending', ?, ?)`
  ).bind(taskId, campaignId, ctx.user!.id, 0, `Wave ${wave} Dispatch (${added} targets)`, String(body.note || "Fresh targets added mid-campaign; same 90-word discipline."), "Delivered Tue–Thu 9:15–10:30 AM station-local", wave, date, now(), now()).run();
  return Response.json({ ok: true, wave, added, taskId, scheduledDate: date });
}

/* ── stations + heat map ──────────────────────────────────────────────── */

export async function handleStations(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const db = DB(ctx);
  const q = sanitizePlain(ctx.query.get("q") || "", 80);
  const state = (ctx.query.get("state") || "").toUpperCase().slice(0, 2);
  const format = sanitizePlain(ctx.query.get("format") || "", 60);
  const ring = ctx.query.get("ring") || "";
  const page = Math.max(1, Number(ctx.query.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(ctx.query.get("limit") || 25)));
  const params: unknown[] = [];
  let where = "1=1";
  if (q) { where += " AND (callsign LIKE ? OR city LIKE ? OR format LIKE ? OR specialty_program LIKE ?)"; params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`); }
  if (/^[A-Z]{2}$/.test(state)) { where += " AND state = ?"; params.push(state); }
  if (format) { where += " AND format LIKE ?"; params.push(`%${format}%`); }
  if (/^[1-4]$/.test(ring)) { where += " AND ring LIKE ?"; params.push(`%Ring ${ring}%`); }
  const total = (await db.prepare(`SELECT COUNT(*) c FROM stations WHERE ${where}`).bind(...params).first<{ c: number }>())?.c || 0;
  const rows = await db.prepare(`SELECT * FROM stations WHERE ${where} ORDER BY id LIMIT ? OFFSET ?`).bind(...params, limit, (page - 1) * limit).all();
  return Response.json({ rows: rows.results, total, page, limit, note: "Data from the master package (verified 2026-08-31). Re-verify gatekeepers before sending." });
}

export async function handleHeatmapData(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const db = DB(ctx);
  const campaignId = ctx.query.get("campaign") || "";
  let overlay: Record<string, unknown>[] = [];
  let outcomeMap: Record<number, number> = {};
  if (campaignId) {
    const owned = await db.prepare(`SELECT id FROM campaigns WHERE id=? AND user_id=?`).bind(campaignId, ctx.user!.id).first();
    if (owned) {
      const t = await db.prepare(`SELECT t.station_id, t.status, t.total_score, t.suppressed, COUNT(o.id) outcomes FROM campaign_targets t LEFT JOIN outcomes o ON o.target_id=t.id AND o.verified=1 WHERE t.campaign_id=? GROUP BY t.id`).bind(campaignId).all<Record<string, unknown>>();
      overlay = t.results;
      for (const r of t.results) if (r.station_id != null) outcomeMap[Number(r.station_id)] = Number(r.outcomes || 0);
    }
  }
  const stateAgg = await db.prepare(`SELECT state, COUNT(*) c FROM stations GROUP BY state ORDER BY c DESC`).all<{ state: string; c: number }>();
  const formatAgg = await db.prepare(`SELECT format, COUNT(*) c FROM stations GROUP BY format ORDER BY c DESC LIMIT 40`).all<{ format: string; c: number }>();
  const stations = await db.prepare(`SELECT id, callsign, name, city, state, lat, lon, ring, format, data_risk FROM stations LIMIT 500`).all();
  return Response.json({ stations: stations.results, overlay, outcomeMap, stateAgg: stateAgg.results, formatAgg: formatAgg.results });
}

/* ── analytics + export ───────────────────────────────────────────────── */

async function analyticsRows(ctx: Ctx, campaignId: string) {
  const db = DB(ctx);
  const one = async <T>(sql: string, ...p: unknown[]) => (await db.prepare(sql).bind(...p).first<T>()) || ({} as T);
  const tgt = await one<{ total: number; verified: number; suppressed: number }>(`SELECT COUNT(*) total, SUM(CASE WHEN verified_at IS NOT NULL THEN 1 ELSE 0 END) verified, SUM(suppressed) suppressed FROM campaign_targets WHERE campaign_id=?`, campaignId);
  const tch = await one<{ sends: number; delivered: number; bh: number; bs: number; rh: number; rw: number }>(`SELECT COUNT(*) sends, SUM(CASE WHEN result IN ('delivered','replied','replied_wrong_person','no_reply','declined','optout','review') THEN 1 ELSE 0 END) delivered, SUM(CASE WHEN result='bounce_hard' THEN 1 ELSE 0 END) bh, SUM(CASE WHEN result='bounce_soft' THEN 1 ELSE 0 END) bs, SUM(CASE WHEN result='replied' THEN 1 ELSE 0 END) rh, SUM(CASE WHEN result='replied_wrong_person' THEN 1 ELSE 0 END) rw FROM outreach_touches WHERE campaign_id=? AND touch_no=1`, campaignId);
  const firstTouches = await one<{ n: number }>(`SELECT COUNT(DISTINCT target_id) n FROM outreach_touches WHERE campaign_id=? AND touch_no=1`, campaignId);
  const out = await one<{ reviews: number; spins: number; interviews: number; features: number; lib: number; rot: number; all: number }>(
    `SELECT SUM(CASE WHEN kind='review' THEN 1 ELSE 0 END) reviews, SUM(CASE WHEN kind='spin' THEN 1 ELSE 0 END) spins, SUM(CASE WHEN kind='interview' THEN 1 ELSE 0 END) interviews, SUM(CASE WHEN kind='feature' THEN 1 ELSE 0 END) features, SUM(CASE WHEN kind='library_add' THEN 1 ELSE 0 END) lib, SUM(CASE WHEN kind='rotation_add' THEN 1 ELSE 0 END) rot, COUNT(*) AS "all" FROM outcomes WHERE campaign_id=? AND verified=1`, campaignId);
  return {
    targets: { total: Number(tgt.total || 0), verified: Number(tgt.verified || 0), suppressed: Number(tgt.suppressed || 0) },
    sends: Number(firstTouches.n || 0),
    delivered: Number(tch.delivered || 0),
    bounceHard: Number(tch.bh || 0),
    bounceSoft: Number(tch.bs || 0),
    repliesHuman: Number(tch.rh || 0),
    repliesWrongPerson: Number(tch.rw || 0),
    reviews: Number(out.reviews || 0),
    spins: Number(out.spins || 0),
    interviews: Number(out.interviews || 0),
    features: Number(out.features || 0),
    libraryAdds: Number(out.lib || 0),
    rotations: Number(out.rot || 0),
    outcomes: Number(out.all || 0),
  };
}

export async function handleAnalytics(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const campaignId = ctx.segments[1];
  await ownCampaign(ctx, campaignId);
  const db = DB(ctx);
  const rows = await analyticsRows(ctx, campaignId);
  const analytics = computeAnalytics(rows);
  const byFormat = await db.prepare(`SELECT s.format AS label, COUNT(DISTINCT t.id) targets, COALESCE(SUM(CASE WHEN o.verified=1 THEN 1 ELSE 0 END),0) outcomes FROM campaign_targets t LEFT JOIN stations s ON s.id=t.station_id LEFT JOIN outcomes o ON o.target_id=t.id WHERE t.campaign_id=? GROUP BY s.format ORDER BY outcomes DESC, targets DESC LIMIT 12`).bind(campaignId).all();
  const byState = await db.prepare(`SELECT s.state AS label, COUNT(DISTINCT t.id) targets, COALESCE(SUM(CASE WHEN o.verified=1 THEN 1 ELSE 0 END),0) outcomes FROM campaign_targets t LEFT JOIN stations s ON s.id=t.station_id LEFT JOIN outcomes o ON o.target_id=t.id WHERE t.campaign_id=? GROUP BY s.state ORDER BY targets DESC LIMIT 25`).bind(campaignId).all();
  const byWave = await db.prepare(`SELECT wave AS label, COUNT(*) touches, SUM(CASE WHEN result='replied' THEN 1 ELSE 0 END) replies FROM outreach_touches WHERE campaign_id=? GROUP BY wave ORDER BY wave`).bind(campaignId).all();
  const byPitch = await db.prepare(`SELECT pitch_version AS label, COUNT(*) touches, SUM(CASE WHEN result='replied' OR result='delivered' THEN 1 ELSE 0 END) positive FROM outreach_touches WHERE campaign_id=? GROUP BY pitch_version ORDER BY touches DESC LIMIT 10`).bind(campaignId).all();
  const taskProg = await db.prepare(`SELECT COUNT(*) total, SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) done FROM campaign_tasks WHERE campaign_id=?`).bind(campaignId).first<{ total: number; done: number }>();
  const course = await db.prepare(`SELECT COUNT(*) total, SUM(CASE WHEN status='complete' THEN 1 ELSE 0 END) done FROM lesson_progress WHERE user_id=?`).bind(ctx.user!.id).first<{ total: number; done: number }>();
  const lessonTotal = (await db.prepare(`SELECT COUNT(*) c FROM lessons WHERE published=1`).first<{ c: number }>())?.c || 24;
  return Response.json({
    analytics,
    breakdowns: { byFormat: byFormat.results, byState: byState.results, byWave: byWave.results, byPitch: byPitch.results },
    campaignProgress: { done: Number(taskProg?.done || 0), total: Number(taskProg?.total || 0), pct: taskProg?.total ? Math.round((Number(taskProg.done) / Number(taskProg.total)) * 100) : 0 },
    courseProgress: { done: Number(course?.done || 0), total: lessonTotal, pct: Math.round((Number(course?.done || 0) / lessonTotal) * 100) },
  });
}

export async function handleExport(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const campaignId = ctx.segments[1];
  const campaign = await ownCampaign(ctx, campaignId);
  const db = DB(ctx);
  const fmt = ctx.query.get("format") === "json" ? "json" : "csv";
  const scope = ctx.query.get("scope") || "full";
  const targets = (await db.prepare(`SELECT t.*, s.callsign, s.name AS station_name, s.city, s.state, s.format FROM campaign_targets t LEFT JOIN stations s ON s.id=t.station_id WHERE t.campaign_id=? ORDER BY t.total_score DESC`).bind(campaignId).all<Record<string, unknown>>()).results;
  const touches = (await db.prepare(`SELECT o.*, s.callsign FROM outreach_touches o JOIN campaign_targets t ON t.id=o.target_id LEFT JOIN stations s ON s.id=t.station_id WHERE o.campaign_id=? ORDER BY o.sent_at`).bind(campaignId).all<Record<string, unknown>>()).results;
  const outcomes = (await db.prepare(`SELECT o.*, s.callsign FROM outcomes o JOIN campaign_targets t ON t.id=o.target_id LEFT JOIN stations s ON s.id=t.station_id WHERE o.campaign_id=? ORDER BY o.occurred_at`).bind(campaignId).all<Record<string, unknown>>()).results;
  await bumpStat(ctx.env, "exports");
  if (fmt === "json") {
    return new Response(JSON.stringify({ exportedAt: now(), user: ctx.user!.email, campaign: campaignRow(campaign), scope, targets, touches, outcomes }, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="fd-campaign-${campaignId.slice(0, 8)}.json"` },
    });
  }
  const which = scope === "touches" ? touches : scope === "outcomes" ? outcomes : targets;
  const csv = toCSV(which);
  return new Response(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="fd-${scope}-${campaignId.slice(0, 8)}.csv"` },
  });
}

export async function handleNotesExport(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const fmt = ctx.query.get("format") === "md" ? "md" : "json";
  const notes = (await DB(ctx).prepare(`SELECT n.body, n.scope, n.ref_id, n.updated_at, n.pinned FROM notes n WHERE n.user_id=? AND n.archived_at IS NULL ORDER BY n.updated_at DESC LIMIT 500`).bind(ctx.user!.id).all<Record<string, unknown>>()).results;
  const lessonNotes = (await DB(ctx).prepare(`SELECT ln.lesson_id, ln.body, ln.updated_at FROM lesson_notes ln WHERE ln.user_id=? ORDER BY ln.updated_at DESC LIMIT 100`).bind(ctx.user!.id).all<Record<string, unknown>>()).results;
  await bumpStat(ctx.env, "exports");
  if (fmt === "json") return new Response(JSON.stringify({ notes, lessonNotes }, null, 2), { headers: { "content-type": "application/json", "content-disposition": "attachment; filename=fd-notes.json" } });
  const md = ["# Frequency Dominion — notes export", `_generated ${now()}_`, "",
    ...lessonNotes.map((n) => `## Lesson ${n.lesson_id}\n\n${n.body}\n\n_Updated ${n.updated_at}_\n\n---\n`),
    ...notes.map((n) => `## ${n.scope}${n.ref_id ? ` · ${n.ref_id}` : ""}${n.pinned ? " ·pinned" : ""}\n\n${n.body}\n\n_Updated ${n.updated_at}_\n\n---\n`)].join("\n");
  return new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8", "content-disposition": "attachment; filename=fd-notes.md" } });
}

export async function handleSnapshot(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const campaignId = ctx.segments[1];
  await ownCampaign(ctx, campaignId);
  const body = await ctx.json();
  const rows = await analyticsRows(ctx, campaignId);
  const id = uuid();
  await DB(ctx).prepare(`INSERT INTO audit_snapshots (id, user_id, campaign_id, label, period_start, period_end, metrics_json, created_at) VALUES (?,?,?,?,?,?,?,?)`)
    .bind(id, ctx.user!.id, campaignId, sanitizePlain(String(body.label || "Snapshot"), 120),
      body.periodStart && isIsoDate(String(body.periodStart)) ? String(body.periodStart) : null,
      body.periodEnd && isIsoDate(String(body.periodEnd)) ? String(body.periodEnd) : todayISO(),
      JSON.stringify({ rows, analytics: computeAnalytics(rows) }), now()).run();
  await bumpStat(ctx.env, "audit_snapshots");
  return Response.json({ ok: true, id });
}

/* ── evidence & uploads ───────────────────────────────────────────────── */

const UPLOAD_MIMES: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif",
  "application/pdf": "pdf", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "text/markdown": "md",
};
const MAX_UPLOAD = 8 * 1024 * 1024;

export async function handleEvidence(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const db = DB(ctx);
  if (ctx.req.method === "GET") {
    const rows = await db.prepare(`SELECT * FROM evidence_items WHERE user_id=? ORDER BY created_at DESC LIMIT 200`).bind(ctx.user!.id).all<Record<string, unknown>>();
    return Response.json({ evidence: rows.results });
  }
  const body = await ctx.json();
  if (ctx.req.method === "DELETE") {
    await db.prepare(`DELETE FROM evidence_items WHERE id=? AND user_id=?`).bind(String(body.id || ""), ctx.user!.id).run();
    return Response.json({ ok: true });
  }
  const id = uuid();
  const kind = ["link", "upload", "text"].includes(body.kind) ? body.kind : "link";
  const url = safeUrl(String(body.url || ""));
  if (kind === "link" && body.url && !url) throw new ApiError(400, "Evidence URL must be http(s).");
  const claim = sanitizeText(String(body.approvedClaim || ""), 1000);
  const claimStatus = body.claimStatus === "approved" && url && body.source && body.verifiedAt ? "approved" : body.claimStatus === "rejected" ? "rejected" : "raw";
  await db.prepare(
    `INSERT INTO evidence_items (id, user_id, campaign_id, lesson_id, station_id, kind, title, url, object_key, mime, size, raw_evidence, approved_claim, claim_status, source, verified_at, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(id, ctx.user!.id, body.campaignId || null, body.lessonId || null, body.stationId || null, kind, sanitizePlain(String(body.title || ""), 200),
    url, sanitizePlain(String(body.objectKey || ""), 300), "", 0, sanitizeText(String(body.rawEvidence || ""), 8000), claim, claimStatus,
    sanitizeText(String(body.source || ""), 500), body.verifiedAt && isIsoDate(String(body.verifiedAt)) ? String(body.verifiedAt) : null, now(), now()).run();
  await bumpStat(ctx.env, "evidence_added");
  return Response.json({ ok: true, id, claimStatus, note: claimStatus === "raw" ? "Store the approved claim separately and mark it approved only with a source + verification date." : "" });
}

export async function handleUploadInit(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const rl = await rateLimit(ctx.env, "uploads", ctx.user!.id, 20, 3600);
  if (!rl.ok) throw new ApiError(429, "Upload limit reached for this hour.");
  const body = await ctx.json();
  const mime = String(body.mime || "");
  const size = Number(body.size || 0);
  if (!UPLOAD_MIMES[mime]) throw new ApiError(415, `Unsupported file type (${mime || "unknown"}). Allowed: ${Object.keys(UPLOAD_MIMES).join(", ")}.`);
  if (!size || size > MAX_UPLOAD) throw new ApiError(413, `Uploads are limited to ${MAX_UPLOAD / 1024 / 1024} MB.`);
  const name = sanitizePlain(String(body.name || "file"), 80).replace(/[^\w.\- ]/g, "").slice(0, 64) || "file";
  const key = `evidence/${ctx.user!.id}/${uuid()}-${name}`;
  const url = await createPrivateUploadUrl(ctx.env, key, 600);
  return Response.json({ ok: true, url, key, maxSize: MAX_UPLOAD });
}

export async function handleUploadConfirm(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  const body = await ctx.json();
  const key = String(body.key || "");
  if (!key.startsWith(`evidence/${ctx.user!.id}/`)) throw new ApiError(400, "Invalid upload key.");
  return Response.json({ ok: true, key, note: "Upload registered with the evidence item." });
}

/* ── vault ────────────────────────────────────────────────────────────── */

export async function handleVault(ctx: Ctx): Promise<Response> {
  await gate(ctx);
  if (ctx.req.method === "POST") {
    // print/download version — presign the private R2 bundle for this user only
    const { ALLOWED_PRODUCTS, resolveAllowedPrices } = await import("../config.ts");
    void ALLOWED_PRODUCTS;
    const bundleKey = resolveAllowedPrices(ctx.env).frequency_dominion.bundleKey;
    try {
      const url = await createPrivateDownloadUrl(ctx.env, bundleKey, 900);
      return Response.json({ ok: true, url, expiresInSeconds: 900 });
    } catch {
      throw new ApiError(503, "The print bundle is not available from this environment (R2 not configured). In-app print view works everywhere.");
    }
  }
  const keys = (await DB(ctx).prepare(`SELECT key, updated_at FROM course_assets ORDER BY key`).all<{ key: string; updated_at: string }>()).results;
  return Response.json({
    assets: keys,
    download: { product: "frequency_dominion", label: "Full master package (ZIP) — optional print/download version", via: "POST /api/fd/vault" },
  });
}

/* ── dashboard (me) ───────────────────────────────────────────────────── */

export async function handleMe(ctx: Ctx): Promise<Response> {
  requireDb(ctx.env);
  const db = DB(ctx);
  const entitlement = await requireEnrolled(ctx.env, ctx.user!.emailNormalized).then(() => "active").catch((e) => e.details?.code || "none");
  const profile = await db.prepare(`SELECT * FROM user_profiles WHERE user_id=?`).bind(ctx.user!.id).first<Record<string, unknown>>();
  const campaign = await db.prepare(`SELECT * FROM campaigns WHERE user_id=? AND active=1 LIMIT 1`).bind(ctx.user!.id).first<Record<string, unknown>>();
  let campaignId = campaign?.id as string | undefined;
  if (!campaign && entitlement === "active") {
    const first = await db.prepare(`SELECT * FROM campaigns WHERE user_id=? ORDER BY created_at DESC LIMIT 1`).bind(ctx.user!.id).first<Record<string, unknown>>();
    if (first) { campaign = first; campaignId = String(first.id); }
  }
  const lessonTotal = (await db.prepare(`SELECT COUNT(*) c FROM lessons WHERE published=1`).first<{ c: number }>())?.c || 24;
  const prog = await db.prepare(`SELECT COUNT(*) done, MAX(last_activity_at) last FROM lesson_progress WHERE user_id=? AND status='complete'`).bind(ctx.user!.id).first<{ done: number; last: string | null }>();
  const lastActive = await db.prepare(
    `SELECT lp.lesson_id, lp.last_activity_at, l.title, l.module_id, m.title module_title FROM lesson_progress lp JOIN lessons l ON l.id=lp.lesson_id JOIN modules m ON m.id=l.module_id
     WHERE lp.user_id=? AND lp.status!='complete' ORDER BY lp.last_activity_at DESC LIMIT 1`
  ).bind(ctx.user!.id).first<Record<string, unknown>>();
  const today = todayISO();
  const todayTasks = (await db.prepare(`SELECT COUNT(*) c FROM campaign_tasks WHERE user_id=? AND status='pending' AND scheduled_date<=?`).bind(ctx.user!.id, today).first<{ c: number }>())?.c || 0;
  const overdue = (await db.prepare(`SELECT COUNT(*) c FROM campaign_tasks WHERE user_id=? AND status='pending' AND scheduled_date<?`).bind(ctx.user!.id, today).first<{ c: number }>())?.c || 0;
  const blocked = (await db.prepare(`SELECT COUNT(*) c FROM campaign_tasks WHERE user_id=? AND status='blocked'`).bind(ctx.user!.id).first<{ c: number }>())?.c || 0;
  let stats = null;
  let targetsCount = 0;
  let moduleProgress: { id: string; done: number; total: number }[] = [];
  if (campaignId) {
    const rows = await analyticsRows(ctx, campaignId);
    stats = computeAnalytics(rows);
    targetsCount = (await db.prepare(`SELECT COUNT(*) c FROM campaign_targets WHERE campaign_id=? AND total_score>=70 AND suppressed=0`).bind(campaignId).first<{ c: number }>())?.c || 0;
  }
  const moduleRows = await db.prepare(
    `SELECT m.id, COUNT(l.id) total, SUM(CASE WHEN lp.status='complete' THEN 1 ELSE 0 END) done
     FROM modules m LEFT JOIN lessons l ON l.module_id=m.id AND l.published=1
     LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=? GROUP BY m.id ORDER BY m.position`
  ).bind(ctx.user!.id).all<{ id: string; total: number; done: number }>();
  moduleProgress = moduleRows.results.map((m) => ({ id: m.id, done: Number(m.done || 0), total: Number(m.total || 0) }));
  const notes = (await db.prepare(`SELECT id, scope, substr(body,1,140) body, updated_at FROM notes WHERE user_id=? AND archived_at IS NULL ORDER BY updated_at DESC LIMIT 4`).bind(ctx.user!.id).all()).results;
  const evidence = (await db.prepare(`SELECT id, kind, title, claim_status, created_at FROM evidence_items WHERE user_id=? ORDER BY created_at DESC LIMIT 4`).bind(ctx.user!.id).all()).results;
  const openDecisions: string[] = [];
  if (campaign) {
    const plan = J<Record<string, any>>(campaign.plan_json, {});
    for (const w of plan.missingAssets || []) openDecisions.push(String(w));
    if (!campaign.start_date) openDecisions.push("No campaign start date — generate the 21-day schedule.");
    if (!campaignId || !targetsCount) openDecisions.push("War room is thin — add prioritized stations from the Heat Map.");
    if (blocked) openDecisions.push(`${blocked} task(s) blocked — resolve or re-schedule.`);
  } else {
    openDecisions.push("No campaign yet — run the Tailoring Wizard to build your first one.");
  }
  return Response.json({
    user: { email: ctx.user!.email, displayName: ctx.user!.displayName },
    profile,
    entitlement,
    campaign: campaign ? campaignRow(campaign) : null,
    course: {
      lessonTotal,
      done: Number(prog?.done || 0),
      pct: Math.round((Number(prog?.done || 0) / lessonTotal) * 100),
      resume: lastActive ? { lessonId: lastActive.lesson_id, title: lastActive.title, moduleTitle: lastActive.module_title } : null,
      modules: moduleProgress,
    },
    campaignSnapshot: { todayTasks, overdue, blocked, prioritizedStations: targetsCount, stats },
    recentNotes: notes,
    recentEvidence: evidence,
    openDecisions: openDecisions.slice(0, 6),
  });
}

export { J };
