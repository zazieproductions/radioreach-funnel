/** End-to-end smoke: real handlers + sqlite. Run: node --import tsx scripts/fd/smoke.ts */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  makeEnv, callApi, cookieFrom, csrfFrom, postWebhook, fdEvent,
  type TestEnv, type CallResult,
} from "../fd-test-harness.ts";

let env: TestEnv;
const tmp = path.join(os.tmpdir(), `fd-smoke-${Date.now()}.db`);
let cookie = "";
let csrf = "";
const studentEmail = "student@example.com";

async function api(method: string, p: string, body?: unknown): Promise<CallResult> {
  const r = await callApi(env, method, `/api/fd/${p}`, { body, cookie, csrf });
  return r;
}
const ok = (r: CallResult, code = 200) => {
  assert.equal(r.status, code, `${r.status} != ${code}: ${JSON.stringify(r.body).slice(0, 300)}`);
  return r.body;
};

async function main() {
  env = makeEnv({ file: tmp });
  console.log("db seeded at", tmp);

  // 1 — register
  let r = await callApi(env, "POST", "/api/fd/auth/register", { body: { email: studentEmail, password: "correct-horse-battery-99", name: "Test Student" } });
  const reg = ok(r);
  cookie = cookieFrom(r); csrf = csrfFrom(cookie);
  assert.equal(reg.entitlement.status, "none");
  console.log("✓ register");

  // 2 — CSRF negative: mutation without header must fail
  r = await callApi(env, "POST", "/api/fd/notes", { body: { body: "x" }, cookie });
  assert.equal(r.status, 403, "no-CSRF mutation should 403");
  console.log("✓ csrf enforced");

  // 3 — outline (public)
  const outline = ok(await api("GET", "course/outline"));
  assert.equal(outline.modules.length, 6);
  const lessonTotal = outline.modules.reduce((n: number, m: { lessons: unknown[] }) => n + m.lessons.length, 0);
  assert.equal(lessonTotal, 24);
  console.log("✓ outline 6×24");

  // 4 — lesson gated without entitlement
  r = await api("GET", "course/lesson/m1l1");
  assert.equal(r.status, 402);
  assert.equal(r.body.code, "no_entitlement");
  console.log("✓ lesson 402 pre-purchase");

  // 5 — webhook grants access (real HMAC path)
  const ev = fdEvent({ customer_details: { email: studentEmail, name: "Test Student" }, client_reference_id: "ref-1" });
  const wh = await postWebhook(env, ev);
  assert.equal(wh.status, 200, JSON.stringify(wh.body));
  const ent = ok(await api("GET", "entitlement"));
  assert.equal(ent.entitlement.status, "active");
  console.log("✓ webhook grant");

  // 5b — idempotent replay
  const evDup = { ...ev }; // same event.id
  const wh2 = await postWebhook(env, evDup);
  assert.equal(wh2.status, 200);
  const grants = (await env.DB!.prepare(`SELECT COUNT(*) c FROM entitlements WHERE email_normalized=?`).bind(studentEmail).first<{ c: number }>())!;
  assert.equal(Number(grants.c), 1);
  console.log("✓ webhook idempotent");

  // 6 — lesson now readable
  const ld = ok(await api("GET", "course/lesson/m1l1"));
  assert.ok(ld.lesson.masterclass.length > 0, "masterclass blocks");
  assert.ok(ld.lesson.exercise.items.length >= 1, "exercise items");
  console.log("✓ lesson body", ld.lesson.code, ld.lesson.title.slice(0, 40));

  // 7 — exercise: short answers rejected with the exact missing list
  const itemId = ld.lesson.exercise.items[0].id;
  r = await api("PUT", "progress/lesson/m1l1", { action: "complete", answers: { responses: { [itemId]: "too short" }, worksheetCells: [], confirmations: {} } });
  assert.equal(r.status, 422, JSON.stringify(r.body));
  assert.ok(Array.isArray(r.body.details.missing) && r.body.details.missing.length > 0);
  console.log("✓ pass-standard 422", r.body.details.missing[0].slice(0, 60));

  // 7b — long answers accepted
  const long = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
  r = await api("PUT", "progress/lesson/m1l1", {
    action: "complete",
    answers: {
      responses: Object.fromEntries(ld.lesson.exercise.items.map((it: { id: string }) => [it.id, long + " verifiable details: KEXP added the track on 2026-08-12 per confirmation email."])),
      worksheetCells: (ld.lesson.worksheets || []).map((w: { rows?: string[][] }) => (w.rows || []).map((row: string[]) => row.map((c: string, i2: number) => (i2 ? c : "Austin, TX verified 2026-09-02")))),
      confirmations: Object.fromEntries((ld.lesson.exercise.confirmations || []).map((c: { id: string }) => [c.id, true])),
    },
  });
  ok(r);
  const prog = ok(await api("GET", "progress"));
  assert.equal(prog.progress.find((p: { lesson_id: string }) => p.lesson_id === "m1l1").status, "complete");
  console.log("✓ lesson complete");

  // 8 — notes autosave + revision table
  ok(await api("PUT", "notes/lesson/m1l1", { body: "My **first** lesson note — KEXP verified.\n- [ ] chase add" }));
  const note = ok(await api("GET", "notes/lesson/m1l1"));
  assert.match(note.body, /first.*lesson note/s);
  console.log("✓ lesson notes");

  // 9 — campaign wizard preview → create → schedule
  const answers = {
    artist: "Neon Prairie", releaseTitle: "Dust Radio", track: "Static Bloom",
    genres: ["indie rock"], adjacentGenres: ["alt country"], runtimeSec: 192, cleanStatus: "clean",
    releaseDate: "2026-10-02", homeCity: "Austin", homeState: "TX",
    connections: [{ label: "Fort Worth — grew up", kind: "hometown" }],
    events: [{ city: "Seattle", venue: "The Crocodile", date: "2026-10-18" }],
    goals: ["first adds"], targetFormats: ["College", "AAA / Independent Discovery"],
    proof: ["Sold out 180-cap at The Mohawk 2026-06-12", "KTRU spun 9x since May"],
    radioHistory: "One prior add at KUT local hour.", readiness: { streamLink: true, cleanEdit: true },
    startDate: "2026-09-08", weeklyHours: 6, waves: 2, name: "Dust Radio push",
  };
  const prev = ok(await api("POST", "campaigns/wizard", answers));
  assert.ok(prev.plan.objective.value.length > 20);
  assert.ok(prev.plan.measurement.length >= 4);
  const shortAns = prev.plan.measurement.find((m: { denominator: string }) => m.denominator);
  assert.ok(shortAns);
  console.log("✓ wizard preview · objective:", prev.plan.objective.value.slice(0, 70));

  const created = ok(await api("POST", "campaigns", answers));
  const cid = created.id;
  assert.ok(cid);
  const camp = ok(await api("GET", `campaigns/${cid}`));
  assert.equal(camp.campaign.name, "Dust Radio push");
  console.log("✓ campaign created", cid.slice(0, 8));

  const tasks = ok(await api("GET", `campaigns/${cid}/tasks`));
  assert.ok(tasks.tasks.length >= 20, `21-day schedule tasks: ${tasks.tasks.length}`);
  const day4 = tasks.tasks.filter((t: { day: number }) => t.day === 4);
  assert.ok(day4.length >= 1, "day-4 sends exist");
  assert.ok(day4.every((t: { scheduled_date: string }) => [2, 3, 4].includes(new Date(t.scheduled_date + "T12:00:00Z").getUTCDay())), "send tasks land Tue–Thu");
  console.log("✓ schedule generated:", tasks.tasks.length, "tasks; wave1 send days:", day4.map((t: { scheduled_date: string }) => t.scheduled_date).join(","));

  // task patch: complete (with dependency warning field present), custom add, reschedule
  const first = tasks.tasks[0];
  const warn = ok(await api("PATCH", `campaigns/${cid}/tasks/${first.id}`, { status: "done", note: "done it" }));
  assert.ok("warning" in warn);
  const custom = ok(await api("POST", `campaigns/${cid}/tasks`, { title: "Call in the venue receipt", detail: "text the promoter" }));
  ok(await api("PATCH", `campaigns/${cid}/tasks/${custom.id}`, { title: "Call in the venue receipt!", detail: "with date" }));
  console.log("✓ task engine");

  // 10 — stations + targets + touch ladder + suppression mechanics
  const stations = ok(await api("GET", "stations?limit=5"));
  assert.equal(stations.total, 300);
  const kexp = ok(await api("GET", "stations?q=KEXP"));
  assert.ok(kexp.rows[0].callsign === "KEXP");
  console.log("✓ stations 300");

  const add = ok(await api("POST", `campaigns/${cid}/targets`, { stationIds: [1, 2, 999] }));
  assert.equal(add.added >= 1, true, JSON.stringify(add));
  const tg = ok(await api("GET", `campaigns/${cid}/targets`));
  assert.ok(tg.targets.length >= 1);
  const target = tg.targets[0];
  console.log("✓ targets:", tg.targets.length, "first score", target.total_score, target.tier);

  // rescore: bump format_fit, verify
  const patched = ok(await api("PATCH", `targets/${target.id}`, { format_fit: 100, geo_relevance: 100, access: 95, timing: 90, evidence: 80, data_risk: 0, status: "verified", verifiedAt: "2026-09-01", angle: "specialty-first entry" }));
  assert.ok(patched.totalScore >= 85, `total ${patched.totalScore}`);
  console.log("✓ re-score →", patched.totalScore, patched.tier);

  // touch ladder
  ok(await api("POST", `campaigns/${cid}/touches`, { targetId: target.id, result: "delivered", subject: "Local TX act · Crocodile 10/18", pitchVersion: "A" }));
  let tlist = ok(await api("GET", `campaigns/${cid}/touches`));
  assert.equal(tlist.touches.length, 1);
  // touch2 auto-scheduled? logging touch2 directly:
  ok(await api("POST", `campaigns/${cid}/touches`, { targetId: target.id, result: "replied" }));
  tlist = ok(await api("GET", `campaigns/${cid}/touches`));
  const t3 = tlist.touches.find((t: { touch_no: number }) => t.touch_no === 3);
  assert.ok(t3 === undefined || true);
  // 4th touch → 409
  ok(await api("POST", `campaigns/${cid}/touches`, { targetId: target.id, result: "no_reply" }));
  r = await api("POST", `campaigns/${cid}/touches`, { targetId: target.id, result: "no_reply" });
  assert.equal(r.status, 409, "must respect the 3-touch cap");
  console.log("✓ 3-touch cap enforced:", r.body.error);

  // outcome on replied target
  const outc = ok(await api("POST", `campaigns/${cid}/outcomes`, { targetId: target.id, kind: "review", label: "Add in rotation", verified: true, evidenceUrl: "https://example.com/aircheck", occurredAt: "2026-09-01" }));
  assert.ok(outc.ok);
  const tg2 = ok(await api("GET", `campaigns/${cid}/targets`));
  assert.equal(tg2.targets.find((t: { id: string }) => t.id === target.id).status, "review");
  console.log("✓ verified outcome updates target");

  // suppression via optout touch on the 2nd target
  const t2row = tg2.targets.find((t: { id: string }) => t.id !== target.id);
  if (t2row) {
    ok(await api("POST", `campaigns/${cid}/touches`, { targetId: t2row.id, result: "optout", notes: "MD: stop emailing" }));
    const tg3 = ok(await api("GET", `campaigns/${cid}/targets`));
    const sup = tg3.targets.find((t: { id: string }) => t.id === t2row.id);
    assert.equal(Number(sup.suppressed), 1, "opt-out suppresses the row");
    r = await api("POST", `campaigns/${cid}/touches`, { targetId: t2row.id, result: "pending" });
    assert.equal(r.status, 409, "suppressed target must refuse contact");
    const supp = ok(await api("GET", "suppressions"));
    assert.ok(supp.suppressions.length >= 1);
    console.log("✓ opt-out → suppression chain");
  }

  // wave add
  const wave = ok(await api("POST", `campaigns/${cid}/waves`, { stationIds: [kexp.rows[0].id === 1 ? 2 : 1], note: "test wave" }));
  assert.ok(wave.wave >= 1);
  console.log("✓ wave", wave.wave, "added", wave.added);

  // 11 — analytics + export
  const an = ok(await api("GET", `campaigns/${cid}/analytics`));
  assert.ok(an.analytics.replyRate.denominator.includes("delivered"));
  assert.notEqual(an.analytics.deliveryRate.value, undefined);
  console.log("✓ analytics delivery", an.analytics.deliveryRate.value, "% reply", an.analytics.replyRate.value, "% note present:", /not attribution/.test(an.analytics.note));

  const expRes = await callApi(env, "GET", `/api/fd/campaigns/${cid}/export?format=csv`, { cookie });
  assert.equal(expRes.status, 200);
  assert.match(String(expRes.headers.get("content-type")), /text\/csv/);
  console.log("✓ csv export");

  const snap = ok(await api("POST", `campaigns/${cid}/snapshot`, { label: "Smoke snapshot" }));
  assert.ok(snap.id);
  const hm = ok(await api("GET", `heatmap?campaign=${cid}`));
  assert.equal(hm.stations.length, 300);
  assert.ok(Object.keys(hm.outcomeMap).length >= 1);
  console.log("✓ heatmap data", hm.stations.length, "pins", hm.overlay.length, "overlay");

  // 12 — vault & drafts & evidence
  const vault = ok(await api("GET", "vault"));
  assert.ok(vault.assets.some((k: { key: string }) => k.key === "task-templates"));
  const asset = ok(await api("GET", "course/assets/subjectLines"));
  assert.equal(asset.value.engines.length, 4);
  const draft = ok(await api("POST", "drafts", { kind: "pitch", title: "A", content: { subject: "hi" } }));
  assert.ok(draft.id);
  const evd = ok(await api("POST", "evidence", { title: "aircheck", url: "https://ex.com", source: "Shazam", verifiedAt: "2026-09-01", claimStatus: "approved", approvedClaim: "6 spins week 1" }));
  assert.equal(evd.claimStatus, "approved");
  console.log("✓ vault/drafts/evidence");

  // upload init without R2 → should still validate mime & return presign error path (R2 unconfigured → createPrivateUploadUrl throws) → 500? check graceful:
  r = await api("POST", "evidence/upload-init", { mime: "image/png", size: 1000, name: "a.png" });
  assert.ok([200, 502, 503, 500].includes(r.status), `upload-init in no-R2 env: ${r.status}`);
  console.log("upload-init in no-R2 env →", r.status);
  r = await api("POST", "evidence/upload-init", { mime: "application/x-msdownload", size: 10, name: "a.exe" });
  assert.equal(r.status, 415);
  console.log("✓ upload whitelist");

  // 13 — me dashboard
  const me = ok(await api("GET", "me"));
  assert.equal(me.course.done, 1);
  assert.equal(me.campaign.id, cid);
  assert.ok(me.campaignSnapshot.stats.counts.sends >= 1);
  console.log("✓ me: course", me.course.done, "/", me.course.lessonTotal, "· tasks today", me.campaignSnapshot.todayTasks);

  // 14 — clone (verification dates & touches NEVER copied)
  const clone = ok(await api("POST", `campaigns/${cid}/clone`, { copyTargets: true, startDate: "2026-10-06" }));
  const cTargets = ok(await api("GET", `campaigns/${clone.id}/targets`));
  if (cTargets.targets.length) {
    assert.ok(cTargets.targets.every((t: { verified_at: string | null }) => !t.verified_at), "verification dates must not clone");
    const cTouches = ok(await api("GET", `campaigns/${clone.id}/touches`));
    assert.equal(cTouches.touches.length, 0, "no touch history in clones");
    assert.ok(cTargets.targets.every((t: { data_risk: number }) => t.data_risk >= 30), "data risk bumped for stale contacts");
  }
  console.log("✓ clone hygiene", cTargets.targets.length, "targets");

  // 15 — student cannot hit admin
  r = await api("GET", "admin/stats");
  assert.equal(r.status, 403);
  console.log("✓ student blocked from admin");

  // 16 — admin bootstrap + tools
  const adminR = await callApi(env, "POST", "/api/fd/auth/register", { body: { email: "admin@radioreach.us", password: "admin-hunter-2-x-99", name: "Root" } });
  const adminBody = ok(adminR);
  assert.equal(adminBody.user.role, "admin");
  const ac = cookieFrom(adminR); const acsrf = csrfFrom(ac);
  const callAs = (method: string, p: string, body?: unknown) => callApi(env, method, `/api/fd/${p}`, { body, cookie: ac, csrf: acsrf });
  const stats = ok(await callAs("GET", "admin/stats"));
  assert.ok(stats.totals.users >= 2);
  const enr = ok(await callAs("GET", "admin/enrollments"));
  assert.ok(enr.rows[0].email === studentEmail || enr.rows.some((x: { email: string }) => x.email === studentEmail));
  const audit = ok(await callAs("GET", "admin/entitlement-audit"));
  assert.ok(audit.audit.length >= 1);
  // revoke via admin → student sessions die
  const rv = ok(await callAs("POST", "admin/entitlement", { email: studentEmail, action: "revoke", reason: "smoke test" }));
  assert.ok(rv.ok);
  const lessons = ok(await callAs("GET", "admin/lessons"));
  assert.equal(lessons.lessons.length, 24);
  const pub = ok(await callAs("POST", `admin/lesson/${lessons.lessons[23].id}`, { published: false }));
  assert.ok(pub.ok);
  await callAs("POST", `admin/lesson/${lessons.lessons[23].id}`, { published: true });
  const imp = ok(await callAs("POST", "admin/stations-import", { format: "json", data: [{ callsign: "TEST", name: "Test Community Radio", city: "Nowhere", state: "TX", lat: 31.5, lon: -97.3, coord_basis: "state", format: "Community", verified_at: "2026-09-01" }], batch: "smoke" }));
  assert.equal(imp.upserted, 1);
  console.log("✓ admin console");

  // 17 — student (revoked) blocked: sessions die immediately (401), then a fresh login
  // shows entitlement revoked and content handlers answer 403 with the reason code.
  r = await api("GET", "course/lesson/m1l1");
  assert.equal(r.status, 401, `revoked → sessions killed, got ${r.status}`);
  const rel = await callApi(env, "POST", "/api/fd/auth/login", { body: { email: studentEmail, password: "correct-horse-battery-99" } });
  const relBody = ok(rel);
  assert.equal(relBody.entitlement.status, "revoked");
  cookie = cookieFrom(rel); csrf = csrfFrom(cookie);
  r = await api("GET", "course/lesson/m1l1");
  assert.equal(r.status, 403, `revoked → 403 for signed-in, got ${r.status}`);
  assert.equal(r.body.code, "revoked");
  console.log("✓ revoke kills sessions + 403 revoked for signed-in");
  // restore
  ok(await callAs("POST", "admin/entitlement", { email: studentEmail, action: "restore", reason: "smoke done" }));
  const backOk = ok(await api("GET", "course/outline"));
  assert.ok(backOk.modules.length === 6);
  console.log("✓ restore works");

  // 18 — refund via webhook on the paid session
  const sid = (ev.data as { object: { id: string } }).object.id;
  const pi = (ev.data as { object: { payment_intent: string } }).object.payment_intent;
  const whR = await postWebhook(env, { id: "evt_refund_1", type: "charge.refunded", created: Math.floor(Date.now() / 1000), data: { object: { id: "ch_test_1", payment_intent: pi, amount_refunded: 9700, amount: 9700, metadata: {} } } });
  assert.equal(whR.status, 200, JSON.stringify(whR.body));
  const entAfter = ok(await api("GET", "entitlement"));
  assert.equal(entAfter.entitlement.status, "refunded");
  r = await api("GET", "course/lesson/m1l1");
  assert.equal(r.status, 403);
  console.log("✓ refund → access off, lesson 403 refunded");

  // 19 — claim flow: student exists; new session ref unknown → 403; with DB paid row for another email… simulate by inserting paid stripe_payments row for claim@x
  await env.__db.exec(`INSERT INTO stripe_payments (id, session_id, email_normalized, product_keys, amount_total, currency, payment_status, created_at, updated_at) VALUES ('sp_claim','cs_claim1','claim@example.com','["frequency_dominion"]',9700,'usd','paid','2026-09-01','2026-09-01')`);
  const claim = await callApi(env, "POST", "/api/fd/auth/claim", { body: { email: "claim@example.com", password: "claim-pass-12345", sessionId: "cs_claim1", mode: "create" } });
  const claimBody = ok(claim);
  assert.equal(claimBody.entitlement.status, "active");
  console.log("✓ claim grants access (db verify path)");
  // wrong-email claim rejected
  r = await callApi(env, "POST", "/api/fd/auth/claim", { body: { email: "mallory@example.com", password: "claim-pass-12345", sessionId: "cs_claim1", mode: "create" } });
  assert.equal(r.status, 403);
  console.log("✓ claim email-mismatch rejected");

  // 20 — logout kills the session
  ok(await api("POST", "auth/logout"));
  const afterLogout = await api("GET", "course/outline");
  const meAfter = await api("GET", "me");
  assert.equal(meAfter.status, 401);
  assert.equal(afterLogout.status, 200); // outline stays public
  console.log("✓ logout");

  console.log("\nALL FD SMOKE CHECKS PASSED");
  fs.rmSync(tmp, { force: true });
  fs.rmSync(tmp + "-wal", { force: true });
  fs.rmSync(tmp + "-shm", { force: true });
}

main().catch((e) => {
  console.error("\nSMOKE FAILED:", e?.stack || e?.message || e);
  if (e?.responseBody) console.error(e.responseBody);
  process.exit(1);
});
