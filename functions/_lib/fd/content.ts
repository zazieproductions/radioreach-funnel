/** Course outline, lesson bodies (gated), progress, exercises, notes, drafts. */
import { ApiError, J, now, requireDb, uuid } from "./util";
import { requireEnrolled, bumpStat } from "./entitlements";
import { sanitizeText, validateExercise } from "../../../shared/fd-core.ts";
import type { Ctx } from "./router.ts";

const OUTLINE_CACHE = "fd:outline:v1";

export async function getCourseVersion(env: Env): Promise<string> {
  try {
    const row = await env.DB!.prepare(`SELECT updated_at FROM modules ORDER BY updated_at DESC LIMIT 1`).first<{ updated_at: string }>();
    return row?.updated_at || "0";
  } catch {
    return "0";
  }
}

function lessonRow(r: Record<string, string | number>, withBody: boolean) {
  const base = {
    id: r.id,
    moduleId: r.module_id,
    code: r.code,
    title: r.title,
    minutes: Number(r.minutes),
    exerciseMinutes: Number(r.exercise_minutes),
    truth: r.truth,
    published: Boolean(r.published),
  };
  if (!withBody) return base;
  return {
    ...base,
    masterclass: J(r.masterclass_json, []),
    fieldProtocol: J(r.field_protocol_json, []),
    warnings: J(r.warnings_json, []),
    decoderNotes: J(r.decoder_json, []),
    worksheets: J(r.worksheets_json, []),
    community: J(r.community_json, []),
    exercise: J(r.exercise_json, { items: [] }),
    pass: J(r.pass_json, {}),
    toolLinks: J(r.tool_links_json, []),
    printAsset: r.print_asset || "",
    version: Number(r.version),
  };
}

/** Public: module/lesson outline (titles + meta only — no lesson bodies). */
export async function handleOutline(ctx: Ctx): Promise<Response> {
  const db = requireDb(ctx.env);
  const includeDrafts = ctx.user?.role === "admin" && ctx.query.get("drafts") === "1";
  const modules = await db.prepare(`SELECT * FROM modules ORDER BY position`).all<{ id: string; title: string; promise: string; position: number; published: number }>();
  const lessons = await db.prepare(`SELECT * FROM lessons ${includeDrafts ? "" : "WHERE published = 1"} ORDER BY module_id, position`).all<Record<string, string | number>>();
  const modIds = new Set(modules.results.map((m) => m.id));
  return Response.json({
    product: "frequency_dominion",
    title: "Frequency Dominion",
    subtitle: "The 24-Lesson Independent Radio Campaign System",
    version: await getCourseVersion(ctx.env),
    modules: modules.results
      .filter((m) => m.published || includeDrafts)
      .map((m) => ({
        id: m.id,
        title: m.title,
        promise: m.promise,
        lessons: lessons.results
          .filter((l) => l.module_id === m.id && modIds.has(String(l.module_id)))
          .map((l) => lessonRow(l, false)),
      })),
  });
}

export async function handleLesson(ctx: Ctx): Promise<Response> {
  requireDb(ctx.env);
  await requireEnrolled(ctx.env, ctx.user!.emailNormalized);
  const id = ctx.segments[2];
  if (!/^m[1-6]l[1-4]$/.test(id || "")) throw new ApiError(400, "Unknown lesson.");
  const isAdmin = ctx.user!.role === "admin";
  const row = await ctx.env.DB!.prepare(`SELECT * FROM lessons WHERE id = ?${isAdmin ? "" : " AND published = 1"}`).bind(id).first<Record<string, string | number>>();
  if (!row) throw new ApiError(404, "Lesson not found.");
  const progress = await ctx.env.DB!.prepare(`SELECT status, completed_at, last_activity_at FROM lesson_progress WHERE user_id=? AND lesson_id=?`)
    .bind(ctx.user!.id, id).first<{ status: string; completed_at: string; last_activity_at: string }>();
  // Opening a lesson records activity but NEVER completion.
  await ctx.env.DB!.prepare(
    `INSERT INTO lesson_progress (user_id, lesson_id, status, started_at, last_activity_at)
     VALUES (?, ?, 'in_progress', ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET last_activity_at=excluded.last_activity_at`
  ).bind(ctx.user!.id, id, now(), now()).run();
  return Response.json({ lesson: lessonRow(row, true), progress: progress || null });
}

export async function handleCourseAsset(ctx: Ctx): Promise<Response> {
  await requireEnrolled(ctx.env, ctx.user!.emailNormalized);
  const key = ctx.segments[2] || "";
  if (!/^[A-Za-z0-9-]{1,40}$/.test(key)) throw new ApiError(400, "Unknown asset.");
  const row = await ctx.env.DB!.prepare(`SELECT value_json, updated_at FROM course_assets WHERE key = ?`).bind(key).first<{ value_json: string; updated_at: string }>();
  if (!row) throw new ApiError(404, "Asset not found.");
  return Response.json({ key, updated: row.updated_at, value: J(row.value_json, null) });
}

/* ── progress + exercise completion ───────────────────────────────────── */

export async function handleProgressList(ctx: Ctx): Promise<Response> {
  requireDb(ctx.env);
  const rows = await ctx.env.DB!.prepare(
    `SELECT lesson_id, status, started_at, last_activity_at, completed_at, pass_confirmed, exercise_json FROM lesson_progress WHERE user_id = ?`
  ).bind(ctx.user!.id).all();
  return Response.json({ progress: rows.results });
}

export async function handleProgressUpdate(ctx: Ctx): Promise<Response> {
  requireDb(ctx.env);
  await requireEnrolled(ctx.env, ctx.user!.emailNormalized);
  const id = ctx.segments[2];
  if (!/^m[1-6]l[1-4]$/.test(id || "")) throw new ApiError(400, "Unknown lesson.");
  const body = await ctx.json();
  const action = String(body.action || "activity");
  const lesson = await ctx.env.DB!.prepare(`SELECT * FROM lessons WHERE id = ?`).bind(id).first<Record<string, string | number>>();
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  const answers = {
    responses: sanitizeResponses(body.answers?.responses),
    worksheetCells: Array.isArray(body.answers?.worksheetCells) ? body.answers.worksheetCells.slice(0, 8).map((s: unknown) => Array.isArray(s) ? s.slice(0, 80).map((c) => sanitizeText(String(c ?? ""), 500)) : s && typeof s === "object" ? Object.fromEntries(Object.entries(s as Record<string, unknown>).slice(0, 400).map(([k, c]) => [sanitizeText(String(k), 40), sanitizeText(String(c ?? ""), 500)])) : []) : [],
    confirmations: Object.fromEntries(Object.entries(body.answers?.confirmations || {}).map(([k, v]) => [sanitizeText(k, 40), Boolean(v)])),
  };

  await ctx.env.DB!.prepare(
    `INSERT INTO lesson_progress (user_id, lesson_id, status, started_at, last_activity_at, exercise_json)
     VALUES (?, ?, 'in_progress', ?, ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET last_activity_at=excluded.last_activity_at, exercise_json=excluded.exercise_json`
  ).bind(ctx.user!.id, id, now(), now(), JSON.stringify(answers)).run();

  if (action === "complete") {
    const exercise = J(lesson.exercise_json, { items: [] });
    const pass = J(lesson.pass_json, {});
    const verdict = validateExercise(exercise, pass, answers);
    if (!verdict.ok) {
      throw new ApiError(422, "Pass standard not met yet.", { missing: verdict.missing });
    }
    await ctx.env.DB!.prepare(
      `UPDATE lesson_progress SET status='complete', pass_confirmed=1, completed_at=COALESCE(completed_at, ?) WHERE user_id=? AND lesson_id=?`
    ).bind(now(), ctx.user!.id, id).run();
    await bumpStat(ctx.env, "lessons_completed");
  }
  return Response.json({ ok: true, lessonId: id });
}

function sanitizeResponses(r: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (r && typeof r === "object") {
    for (const [k, v] of Object.entries(r).slice(0, 20)) {
      if (typeof v === "string") out[sanitizeText(k, 40)] = sanitizeText(v, 6000);
    }
  }
  return out;
}

/* ── notes: lesson autosave + general notes ───────────────────────────── */

export async function handleLessonNote(ctx: Ctx): Promise<Response> {
  requireDb(ctx.env);
  const id = ctx.segments[2];
  if (!/^m[1-6]l[1-4]$/.test(id || "")) throw new ApiError(400, "Unknown lesson.");
  const db = ctx.env.DB!;
  if (ctx.req.method === "GET") {
    const row = await db.prepare(`SELECT body, updated_at, created_at FROM lesson_notes WHERE user_id=? AND lesson_id=?`).bind(ctx.user!.id, id).first<{ body: string; updated_at: string; created_at: string }>();
    return Response.json({ lessonId: id, body: row?.body ?? "", updatedAt: row?.updated_at ?? null });
  }
  const body = await ctx.json();
  const text = sanitizeText(body.body ?? "", 50000);
  const prev = await db.prepare(`SELECT updated_at FROM lesson_notes WHERE user_id=? AND lesson_id=?`).bind(ctx.user!.id, id).first<{ updated_at: string }>();
  await db.prepare(
    `INSERT INTO lesson_notes (user_id, lesson_id, body, updated_at, created_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET body=excluded.body, updated_at=excluded.updated_at`
  ).bind(ctx.user!.id, id, text, now(), now()).run();
  // revision history: snapshot when >30min since last save or first save
  const stale = !prev || Date.now() - Date.parse(prev.updated_at) > 30 * 60_000;
  if (stale) {
    await db.prepare(`INSERT INTO note_revisions (id, user_id, note_kind, note_ref, body, saved_at) VALUES (?, ?, 'lesson', ?, ?, ?)`)
      .bind(uuid(), ctx.user!.id, id, prev ? text : "", now()).run();
    await db.prepare(`DELETE FROM note_revisions WHERE user_id=? AND note_kind='lesson' AND note_ref=? AND id NOT IN (SELECT id FROM note_revisions WHERE user_id=? AND note_kind='lesson' AND note_ref=? ORDER BY saved_at DESC LIMIT 25)`)
      .bind(ctx.user!.id, id, ctx.user!.id, id).run();
  }
  return Response.json({ ok: true, updatedAt: now() });
}

export async function handleNotesList(ctx: Ctx): Promise<Response> {
  requireDb(ctx.env);
  const q = (ctx.query.get("q") || "").slice(0, 120);
  const scope = ctx.query.get("scope") || "";
  const ref = ctx.query.get("ref") || "";
  const params: unknown[] = [ctx.user!.id];
  let where = "user_id = ? AND archived_at IS NULL";
  if (["general", "campaign", "station"].includes(scope)) { where += " AND scope = ?"; params.push(scope); }
  if (ref) { where += " AND ref_id = ?"; params.push(ref.slice(0, 64)); }
  let sql = `SELECT * FROM notes WHERE ${where}`;
  if (q) { sql += ` AND body LIKE ?`; params.push(`%${q}%`); }
  sql += ` ORDER BY pinned DESC, updated_at DESC LIMIT 200`;
  const rows = await ctx.env.DB!.prepare(sql).bind(...params).all<Record<string, string>>();
  return Response.json({ notes: rows.results.map((r) => ({ ...r, tags: J<string[]>(r.tags, []), pinned: Boolean(Number(r.pinned)) })) });
}

export async function handleNotesUpsert(ctx: Ctx): Promise<Response> {
  requireDb(ctx.env);
  const body = await ctx.json();
  const scope = ["general", "campaign", "station"].includes(body.scope) ? body.scope : "general";
  const ref = sanitizeText(String(body.refId ?? ""), 64);
  const text = sanitizeText(String(body.body ?? ""), 50000);
  const tags = Array.isArray(body.tags) ? body.tags.slice(0, 8).map((t: unknown) => sanitizeText(String(t), 32)).filter(Boolean) : [];
  const pinned = body.pinned ? 1 : 0;
  if (ctx.req.method === "DELETE") {
    const id = ctx.segments[1];
    await ctx.env.DB!.prepare(`UPDATE notes SET archived_at=?, updated_at=? WHERE id=? AND user_id=?`).bind(now(), now(), id, ctx.user!.id).run();
    return Response.json({ ok: true });
  }
  const id = body.id ? String(body.id) : uuid();
  const existing = await ctx.env.DB!.prepare(`SELECT id, created_at, updated_at FROM notes WHERE id=? AND user_id=?`).bind(id, ctx.user!.id).first<{ id: string; created_at: string; updated_at: string }>();
  if (body.id && !existing) throw new ApiError(404, "Note not found.");
  if (existing) {
    if (!existing.created_at || Date.now() - Date.parse(existing.updated_at) > 30 * 60_000) {
      await ctx.env.DB!.prepare(`INSERT INTO note_revisions (id, user_id, note_kind, note_ref, body, saved_at) VALUES (?, ?, 'note', ?, (SELECT body FROM notes WHERE id=?), ?)`)
        .bind(uuid(), ctx.user!.id, id, id, now()).run();
    }
    await ctx.env.DB!.prepare(`UPDATE notes SET body=?, tags=?, pinned=?, ref_id=?, scope=?, updated_at=? WHERE id=? AND user_id=?`)
      .bind(text, JSON.stringify(tags), pinned, ref, scope, now(), id, ctx.user!.id).run();
  } else {
    await ctx.env.DB!.prepare(`INSERT INTO notes (id, user_id, scope, ref_id, body, tags, pinned, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, ctx.user!.id, scope, ref, text, JSON.stringify(tags), pinned, now(), now()).run();
  }
  return Response.json({ ok: true, id, updatedAt: now() });
}

export async function handleNoteRevisions(ctx: Ctx): Promise<Response> {
  requireDb(ctx.env);
  const kind = ctx.segments[2] === "lesson" ? "lesson" : "note";
  const ref = ctx.segments[3] || "";
  const rows = await ctx.env.DB!.prepare(`SELECT id, saved_at, length(body) AS size FROM note_revisions WHERE user_id=? AND note_kind=? AND note_ref=? ORDER BY saved_at DESC LIMIT 25`)
    .bind(ctx.user!.id, kind, ref).all();
  return Response.json({ revisions: rows.results });
}

/* ── builder drafts (pitch lab, EPK, scripts…) ────────────────────────── */

const DRAFT_KINDS = new Set(["pitch", "subject", "epk", "audio", "followup", "rights", "proof", "audit"]);

export async function handleDrafts(ctx: Ctx): Promise<Response> {
  requireDb(ctx.env);
  const db = ctx.env.DB!;
  if (ctx.req.method === "GET") {
    const kind = ctx.query.get("kind") || "";
    const rows = kind
      ? await db.prepare(`SELECT * FROM drafts WHERE user_id=? AND kind=? ORDER BY updated_at DESC LIMIT 50`).bind(ctx.user!.id, kind).all()
      : await db.prepare(`SELECT * FROM drafts WHERE user_id=? ORDER BY updated_at DESC LIMIT 100`).bind(ctx.user!.id).all();
    return Response.json({ drafts: rows.results.map((r: Record<string, string>) => ({ ...r, content: J(r.content_json, {}) })) });
  }
  if (ctx.req.method === "DELETE") {
    const id = ctx.segments[1];
    await db.prepare(`DELETE FROM drafts WHERE id=? AND user_id=?`).bind(id, ctx.user!.id).run();
    return Response.json({ ok: true });
  }
  const body = await ctx.json();
  const kind = String(body.kind || "");
  if (!DRAFT_KINDS.has(kind)) throw new ApiError(400, "Unknown draft kind.");
  const title = sanitizeText(String(body.title || "Untitled"), 160);
  const content = JSON.stringify(body.content ?? {}).slice(0, 200000);
  const id = body.id ? String(body.id) : uuid();
  await db.prepare(
    `INSERT INTO drafts (id, user_id, kind, campaign_id, title, content_json, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title=excluded.title, content_json=excluded.content_json, updated_at=excluded.updated_at`
  ).bind(id, ctx.user!.id, kind, body.campaignId ? String(body.campaignId) : null, title, content, now(), now()).run();
  return Response.json({ ok: true, id });
}
