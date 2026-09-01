/** Administrator tools: enrollments, entitlement grants/revokes (audited),
 *  content management, station data import, aggregate product metrics. */
import { ApiError, J, now, requireDb, uuid, rateLimit, clientIp } from "./util";
import { requireAdmin } from "./auth";
import { getEntitlement, audit, FD_PRODUCT } from "./entitlements";
import { normalizeEmail, isEmail, sanitizePlain, sanitizeText, toCSV } from "../../../shared/fd-core.ts";
import type { Ctx } from "./router.ts";

type AdminCtx = Ctx & { user: NonNullable<Ctx["user"]> };

export async function handleAdmin(segments: string[]): Promise<(ctx: Ctx) => Promise<Response>> {
  // Guard is applied inside each handler so ctx.user is resolved first.
  const guard = async (ctx: Ctx) => {
    requireDb(ctx.env);
    if (!ctx.user) throw new ApiError(401, "Sign in to continue.");
    requireAdmin(ctx.user as never);
    return ctx as AdminCtx;
  };
  const wrap = (h: (a: AdminCtx) => Promise<Response>) => async (ctx: Ctx) => h(await guard(ctx));
  const name = segments[0] || "";
  switch (name) {
    case "enrollments": return wrap(handleEnrollments);
    case "entitlement": return wrap(handleEntitlementAction);
    case "entitlement-audit": return wrap(handleAudit);
    case "lessons": return wrap(handleLessons);
    case "lesson": return wrap(handleLessonEdit);
    case "reorder": return wrap(handleReorder);
    case "asset": return wrap(handleAssetEdit);
    case "stations": return wrap(handleStationsAdmin);
    case "stations-import": return wrap(handleStationsImport);
    case "stats": return wrap(handleStats);
    case "users": return wrap(handleUsers);
    default: throw new ApiError(404, "Unknown admin route.");
  }
}

/* ── enrollments ──────────────────────────────────────────────────────── */

async function handleEnrollments(ctx: AdminCtx): Promise<Response> {
  const q = sanitizePlain(ctx.query.get("q") || "", 80);
  const page = Math.max(1, Number(ctx.query.get("page") || 1));
  const limit = Math.min(100, Number(ctx.query.get("limit") || 25));
  const params: unknown[] = [];
  let where = "1=1";
  if (q) { where += " AND (u.email LIKE ? OR u.display_name LIKE ?)"; params.push(`%${q}%`, `%${q}%`); }
  const total = (await ctx.env.DB!.prepare(`SELECT COUNT(*) c FROM users u WHERE ${where}`).bind(...params).first<{ c: number }>())?.c || 0;
  const rows = await ctx.env.DB!.prepare(
    `SELECT u.id, u.email, u.display_name, u.role, u.status, u.created_at,
            e.product_key, e.status AS ent_status, e.source, e.granted_at, e.revoked_at, e.stripe_session_id, e.stripe_customer_id, e.admin_notes,
            (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id=u.id AND p.status='complete') lessons_done
     FROM users u LEFT JOIN entitlements e ON e.user_id=u.id OR (e.user_id IS NULL AND e.email_normalized=u.email_normalized)
     WHERE ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, (page - 1) * limit).all();
  return Response.json({ total, page, limit, rows: rows.results });
}

async function handleEntitlementAction(ctx: AdminCtx): Promise<Response> {
  if (ctx.req.method !== "POST") throw new ApiError(405, "POST required.");
  const rl = await rateLimit(ctx.env, "admin-ent", ctx.user.id, 60, 600);
  if (!rl.ok) throw new ApiError(429, "Slow down — too many admin entitlement actions.");
  const body = await ctx.json();
  const email = normalizeEmail(String(body.email || ""));
  const action = String(body.action || "");
  const product = FD_PRODUCT;
  if (!isEmail(email)) throw new ApiError(400, "Valid email required.");
  const reason = sanitizeText(String(body.reason || ""), 500);
  if (!reason) throw new ApiError(400, "A reason is required for the audit trail.");
  const db = ctx.env.DB!;
  const user = await db.prepare(`SELECT id FROM users WHERE email_normalized=?`).bind(email).first<{ id: string }>();
  const existing = await getEntitlement(ctx.env, email, product);
  const id = uuid();
  switch (action) {
    case "grant": {
      if (existing) {
        await db.prepare(`UPDATE entitlements SET status='active', source='admin', user_id=COALESCE(?, user_id), revoked_at=NULL, expires_at=NULL, admin_notes=?, updated_at=? WHERE id=?`)
          .bind(user?.id ?? null, reason, now(), existing.id).run();
      } else {
        await db.prepare(
          `INSERT INTO entitlements (id, user_id, email_normalized, product_key, status, source, granted_at, expires_at, admin_notes, created_at, updated_at)
           VALUES (?,?,?,?, 'active', 'admin', ?, NULL, ?, ?, ?)`
        ).bind(id, user?.id ?? null, email, product, now(), reason, now(), now()).run();
      }
      await audit(ctx.env, { actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "admin_grant", entitlementId: existing?.id ?? id, target: email, product, reason });
      await bumpCount(db, "admin_grants");
      return Response.json({ ok: true });
    }
    case "revoke": {
      if (!existing) throw new ApiError(404, "No entitlement for that email.");
      await db.prepare(`UPDATE entitlements SET status='revoked', revoked_at=?, admin_notes=?, updated_at=? WHERE id=?`).bind(now(), reason, now(), existing.id).run();
      await db.prepare(`UPDATE auth_sessions SET revoked_at=? WHERE user_id IN (SELECT id FROM users WHERE email_normalized=?)`).bind(now(), email).run();
      await audit(ctx.env, { actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "admin_revoke", entitlementId: existing.id, target: email, product, reason });
      return Response.json({ ok: true });
    }
    case "restore": {
      if (!existing) throw new ApiError(404, "No entitlement for that email.");
      if (existing.status === "active") return Response.json({ ok: true, note: "Already active." });
      await db.prepare(`UPDATE entitlements SET status='active', revoked_at=NULL, admin_notes=?, updated_at=? WHERE id=?`).bind(reason, now(), existing.id).run();
      await audit(ctx.env, { actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "admin_restore", entitlementId: existing.id, target: email, product, reason });
      return Response.json({ ok: true });
    }
    default:
      throw new ApiError(400, "action must be grant | revoke | restore.");
  }
}

async function handleAudit(ctx: AdminCtx): Promise<Response> {
  const rows = await ctx.env.DB!.prepare(`SELECT * FROM entitlement_audit ORDER BY created_at DESC LIMIT 200`).all();
  return Response.json({ audit: rows.results });
}

/* ── content management ───────────────────────────────────────────────── */

async function handleLessons(ctx: AdminCtx): Promise<Response> {
  const mods = await ctx.env.DB!.prepare(`SELECT * FROM modules ORDER BY position`).all();
  const lessons = await ctx.env.DB!.prepare(`SELECT id, module_id, code, title, minutes, exercise_minutes, position, published, version, updated_at FROM lessons ORDER BY module_id, position`).all();
  return Response.json({ modules: mods.results, lessons: lessons.results });
}

async function handleLessonEdit(ctx: AdminCtx): Promise<Response> {
  if (ctx.req.method !== "PUT" && ctx.req.method !== "POST") throw new ApiError(405, "PUT required.");
  const id = ctx.segments[0] === "admin" ? ctx.segments[2] : ctx.segments[1];
  if (!/^m[1-6]l[1-4]$/.test(id || "")) throw new ApiError(400, "Unknown lesson id.");
  const body = await ctx.json();
  const sets: string[] = ["updated_at=?", "version=version+1"];
  const params: unknown[] = [now()];
  if (body.title != null) { sets.push("title=?"); params.push(sanitizePlain(String(body.title), 200)); }
  if (body.minutes != null) { sets.push("minutes=?"); params.push(Math.max(1, Math.min(240, Number(body.minutes) || 10))); }
  if (body.published != null) { sets.push("published=?"); params.push(body.published ? 1 : 0); }
  if (body.position != null) { sets.push("position=?"); params.push(Math.max(0, Number(body.position) || 0)); }
  for (const key of ["masterclass_json", "field_protocol_json", "warnings_json", "decoder_json", "worksheets_json", "community_json", "exercise_json", "pass_json", "tool_links_json"] as const) {
    const incoming = (body as Record<string, unknown>)[key.replace("_json", "")] ?? (body as Record<string, unknown>)[key];
    if (incoming !== undefined) {
      const json = typeof incoming === "string" ? incoming : JSON.stringify(incoming);
      if (json.length > 400_000) throw new ApiError(413, "Content block too large.");
      try { JSON.parse(json === incoming ? json : JSON.stringify(JSON.parse(json))); } catch { throw new ApiError(400, `${key} is not valid JSON.`); }
      sets.push(`${key}=?`); params.push(json.length > 400_000 || typeof incoming === "string" ? json.slice(0, 400_000) : json);
    }
  }
  const res = await ctx.env.DB!.prepare(`UPDATE lessons SET ${sets.join(", ")} WHERE id=?`).bind(...params, id).run();
  if (!res.meta?.changes) throw new ApiError(404, "Lesson not found.");
  return Response.json({ ok: true });
}

async function handleReorder(ctx: AdminCtx): Promise<Response> {
  if (ctx.req.method !== "POST") throw new ApiError(405, "POST required.");
  const body = await ctx.json();
  const db = ctx.env.DB!;
  const stmts = [];
  if (Array.isArray(body.modules)) {
    body.modules.slice(0, 12).forEach((id: string, i: number) => {
      if (/^m[1-6]$/.test(id)) stmts.push(db.prepare(`UPDATE modules SET position=? WHERE id=?`).bind(i, id));
    });
  }
  if (Array.isArray(body.lessons)) {
    body.lessons.slice(0, 60).forEach((id: string, i: number) => {
      if (/^m[1-6]l[1-4]$/.test(id)) stmts.push(db.prepare(`UPDATE lessons SET position=? WHERE id=?`).bind(i, id));
    });
  }
  if (Array.isArray(body.move)) {
    // move lessons between modules: {id, module, position}
    for (const mv of body.move.slice(0, 60)) {
      if (mv?.id && /^m[1-6]$/.test(String(mv.module))) stmts.push(db.prepare(`UPDATE lessons SET module_id=?, position=?, updated_at=? WHERE id=?`).bind(String(mv.module), Number(mv.position) || 0, now(), String(mv.id)));
    }
  }
  if (!stmts.length) throw new ApiError(400, "Provide modules and/or lessons order arrays.");
  await db.batch(stmts as never[]);
  return Response.json({ ok: true, applied: stmts.length });
}

async function handleAssetEdit(ctx: AdminCtx): Promise<Response> {
  const key = (ctx.segments[0] === "admin" ? ctx.segments[2] : ctx.segments[1]) || "";
  if (!/^[A-Za-z0-9-]{1,40}$/.test(key)) throw new ApiError(400, "Unknown asset key.");
  if (ctx.req.method === "GET") {
    const row = await ctx.env.DB!.prepare(`SELECT value_json, updated_at FROM course_assets WHERE key=?`).bind(key).first<{ value_json: string; updated_at: string }>();
    if (!row) throw new ApiError(404, "Not found.");
    return Response.json({ key, updated: row.updated_at, value: J(row.value_json, null) });
  }
  const body = await ctx.json();
  const json = JSON.stringify(body.value ?? null);
  if (json.length > 1_000_000) throw new ApiError(413, "Asset too large.");
  await ctx.env.DB!.prepare(`INSERT INTO course_assets (key, value_json, updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json, updated_at=excluded.updated_at`)
    .bind(key, json, now()).run();
  return Response.json({ ok: true });
}

/* ── stations administration ──────────────────────────────────────────── */

async function handleStationsAdmin(ctx: AdminCtx): Promise<Response> {
  const db = ctx.env.DB!;
  const q = sanitizePlain(ctx.query.get("q") || "", 60);
  if (q) {
    const rows = await db.prepare(`SELECT * FROM stations WHERE callsign LIKE ? OR city LIKE ? ORDER BY id LIMIT 50`).bind(`%${q}%`, `%${q}%`).all();
    return Response.json({ rows: rows.results });
  }
  const stats = await db.prepare(
    `SELECT COUNT(*) total, MIN(verified_at) oldest_verified, SUM(CASE WHEN verified_at < date('now','-90 days') THEN 1 ELSE 0 END) stale90, SUM(CASE WHEN source_url='' THEN 1 ELSE 0 END) missing_source, COUNT(DISTINCT state) states FROM stations`
  ).first<Record<string, number | string>>();
  const batches = await db.prepare(`SELECT import_batch, COUNT(*) c, MAX(updated_at) last FROM stations GROUP BY import_batch ORDER BY last DESC LIMIT 10`).all();
  return Response.json({ stats, batches: batches.results });
}

async function handleStationsImport(ctx: AdminCtx): Promise<Response> {
  if (ctx.req.method !== "POST") throw new ApiError(405, "POST required.");
  const rl = await rateLimit(ctx.env, "stations-import", ctx.user.id, 6, 3600);
  if (!rl.ok) throw new ApiError(429, "Import rate limit reached (6/hour).");
  const body = await ctx.json();
  const format = String(body.format || "json");
  let rows: Record<string, unknown>[] = [];
  if (format === "csv") {
    rows = parseCSV(String(body.data || "").slice(0, 4_000_000));
  } else if (Array.isArray(body.data)) {
    rows = body.data.slice(0, 2000);
  } else throw new ApiError(400, "Provide data as a JSON array or CSV text.");
  if (!rows.length) throw new ApiError(400, "No rows parsed.");
  const db = ctx.env.DB!;
  const batchId = sanitizePlain(String(body.batch || `import-${new Date().toISOString().slice(0, 10)}`), 60);
  let upserted = 0;
  const errors: string[] = [];
  const stmts = [];
  const maxRow = await db.prepare(`SELECT COALESCE(MAX(id), 0) m FROM stations`).first<{ m: number }>();
  const synthBase = Number(maxRow?.m || 0);
  for (const [i, r] of rows.entries()) {
    const callsign = sanitizePlain(String(r.callsign ?? r.calls ?? ""), 16).toUpperCase();
    const city = sanitizePlain(String(r.city ?? ""), 80);
    const state = sanitizePlain(String(r.state ?? ""), 2).toUpperCase();
    if (!callsign || !state) { errors.push(`row ${i + 1}: callsign/state required`); continue; }
    const id = Number(r.id);
    const lat = Number(r.lat), lon = Number(r.lon);
    stmts.push(db.prepare(
      `INSERT INTO stations (id, callsign, dial, name, city, city_label, state, lat, lon, coord_basis, ring, format, specialty_program, gatekeeper_role, gatekeeper_name, contact_route, source_url, verified_at, data_risk, angle, import_batch, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET callsign=excluded.callsign, dial=excluded.dial, name=excluded.name, city=excluded.city, city_label=excluded.city_label, state=excluded.state,
         lat=excluded.lat, lon=excluded.lon, ring=excluded.ring, format=excluded.format, specialty_program=excluded.specialty_program, gatekeeper_role=excluded.gatekeeper_role,
         gatekeeper_name=excluded.gatekeeper_name, contact_route=excluded.contact_route, source_url=excluded.source_url, verified_at=excluded.verified_at, data_risk=excluded.data_risk, angle=excluded.angle, import_batch=excluded.import_batch, updated_at=excluded.updated_at`
    ).bind(
      Number.isInteger(id) ? id : synthBase + i + 1, callsign, sanitizePlain(String(r.dial ?? ""), 20),
      sanitizePlain(String(r.name ?? `${callsign}`), 120), city, sanitizePlain(String(r.cityLabel ?? city), 100), state,
      Number.isFinite(lat) && lat !== 0 ? lat : 0, Number.isFinite(lon) && lon !== 0 ? lon : 0, sanitizePlain(String(r.coordBasis ?? "imported"), 20),
      sanitizePlain(String(r.ring ?? ""), 30), sanitizePlain(String(r.format ?? ""), 120),
      sanitizeText(String(r.program ?? r.specialty_program ?? ""), 200), sanitizePlain(String(r.gatekeeperRole ?? r.role ?? ""), 80),
      sanitizePlain(String(r.gatekeeperName ?? r.gatekeeper ?? ""), 80), sanitizePlain(String(r.contactRoute ?? ""), 200),
      sanitizePlain(String(r.sourceUrl ?? r.source_url ?? ""), 240), sanitizePlain(String(r.verifiedAt ?? r.verified_at ?? ""), 12),
      Math.max(0, Math.min(100, Number(r.dataRisk ?? r.data_risk ?? 10) || 0)),
      sanitizeText(String(r.angle ?? ""), 300), batchId, now()
    ));
    upserted++;
  }
  if (stmts.length) await db.batch(stmts as never[]);
  await audit(ctx.env, { actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "stations_import", target: "", product: "stations", reason: `${upserted} rows (${batchId})` });
  return Response.json({ ok: true, upserted, errors: errors.slice(0, 20) });
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim());
  if (!lines.length) return [];
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((c) => c.trim());
  };
  const headers = split(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((l) => {
    const cells = split(l);
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ""; });
    return row;
  });
}

/* ── aggregate product metrics (privacy-conscious: no user content) ───── */

async function handleStats(ctx: AdminCtx): Promise<Response> {
  const db = ctx.env.DB!;
  const stats = await db.prepare(`SELECT key, value FROM app_stats ORDER BY key`).all<{ key: string; value: number }>();
  const counts = await db.prepare(
    `SELECT (SELECT COUNT(*) FROM users) users,
            (SELECT COUNT(*) FROM entitlements WHERE status='active' AND product_key='${FD_PRODUCT}') active,
            (SELECT COUNT(*) FROM entitlements WHERE status='refunded') refunded,
            (SELECT COUNT(*) FROM entitlements WHERE status='disputed') disputed,
            (SELECT COUNT(*) FROM campaigns) campaigns,
            (SELECT COUNT(*) FROM lesson_progress WHERE status='complete') lesson_completions,
            (SELECT COUNT(*) FROM campaign_targets) targets,
            (SELECT COUNT(*) FROM outreach_touches) touches,
            (SELECT COUNT(*) FROM outcomes) outcomes,
            (SELECT COUNT(*) FROM stations) stations`
  ).first<Record<string, number>>();
  const funnel = await db.prepare(
    `SELECT ROUND(AVG(done * 1.0 / 24), 2) avg_done FROM (SELECT (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id=u.id AND p.status='complete') done FROM users u LIMIT 500)`
  ).first<{ avg_done: number }>();
  return Response.json({ counters: stats.results, totals: counts, avgLessonsDonePerUser: funnel?.avg_done ?? 0, privacy: "Aggregate counters only — no emails, notes, or campaign content in this view." });
}

async function bumpCount(db: D1Database, key: string) {
  await db.prepare(`INSERT INTO app_stats (key, value, updated_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET value=value+1, updated_at=?`).bind(key, now(), now()).run();
}

async function handleUsers(ctx: AdminCtx): Promise<Response> {
  if (ctx.req.method === "GET") {
    const rows = await ctx.env.DB!.prepare(`SELECT id, email, display_name, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 200`).all();
    return Response.json({ users: rows.results });
  }
  const body = await ctx.json();
  const action = String(body.action || "");
  const id = String(body.userId || "");
  if (action === "set-role") {
    const role = body.role === "admin" ? "admin" : "member";
    await ctx.env.DB!.prepare(`UPDATE users SET role=?, updated_at=? WHERE id=?`).bind(role, now(), id).run();
    await audit(ctx.env, { actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: `role_${role}`, target: String(body.email || id), product: "account", reason: sanitizeText(String(body.reason || ""), 300) });
    return Response.json({ ok: true });
  }
  if (action === "disable") {
    await ctx.env.DB!.prepare(`UPDATE users SET status='disabled', updated_at=? WHERE id=?`).bind(now(), id).run();
    await ctx.env.DB!.prepare(`UPDATE auth_sessions SET revoked_at=? WHERE user_id=?`).bind(now(), id).run();
    await audit(ctx.env, { actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "user_disable", target: String(body.email || id), product: "account", reason: sanitizeText(String(body.reason || ""), 300) });
    return Response.json({ ok: true });
  }
  if (action === "enable") {
    await ctx.env.DB!.prepare(`UPDATE users SET status='active', updated_at=? WHERE id=?`).bind(now(), id).run();
    await audit(ctx.env, { actorUserId: ctx.user.id, actorEmail: ctx.user.email, action: "user_enable", target: String(body.email || id), product: "account", reason: sanitizeText(String(body.reason || ""), 300) });
    return Response.json({ ok: true });
  }
  throw new ApiError(400, "action must be set-role | disable | enable.");
}

export { toCSV };
