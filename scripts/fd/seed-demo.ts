/** Seeds (idempotently) a paid demo account against the running dev server so
 *  the preview shows the course area with progress, notes, a live campaign,
 *  targets, touches and a half-run task list.
 *  Run: node --import tsx scripts/fd/seed-demo.ts   (dev server must be up) */
const BASE = process.env.FD_BASE || "http://127.0.0.1:5173";
const EMAIL = "demo@radioreach.us";
const PASSWORD = "dominion-demo-2026";

let jar = "";
let csrf = "";
function absorb(res: Response) {
  const sc = typeof (res.headers as any).getSetCookie === "function" ? (res.headers as any).getSetCookie() as string[] : [];
  for (const c of sc) {
    const kv = c.split(";")[0];
    if (kv.startsWith("fd_session=") || kv.startsWith("fd_csrf=")) {
      const prev = jar.split("; ").filter((p) => !p.startsWith(kv.split("=")[0] + "="));
      jar = [...prev, kv].join("; ");
      if (kv.startsWith("fd_csrf=")) csrf = kv.slice("fd_csrf=".length);
    }
  }
}
async function api(method: string, path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${BASE}/api/fd/${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      origin: BASE,
      ...(jar ? { cookie: jar } : {}),
      ...(method === "GET" ? {} : { "x-fd-csrf": csrf }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  absorb(res);
  const json = await res.json().catch(() => ({}));
  if (!res.ok && !(res.status === 409 && /exists/i.test(String(json.error)))) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(json).slice(0, 160)}`);
  return json;
}

const LONG = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");

async function completeLesson(id: string) {
  const ld = await api("GET", `course/lesson/${id}`);
  await api("PUT", `progress/lesson/${id}`, {
    action: "complete",
    answers: {
      responses: Object.fromEntries(ld.lesson.exercise.items.map((it: { id: string }) => [it.id, LONG + " verifiable details: KEXP added the track on 2026-08-12 per confirmation email."])),
      worksheetCells: (ld.lesson.worksheets || []).map((w: { rows?: string[][] }) => (w.rows || []).map((row: string[]) => row.map((c: string, i: number) => (i ? c : "Austin, TX verified 2026-09-02")))),
      confirmations: Object.fromEntries((ld.lesson.exercise.confirmations || []).map((c: { id: string }) => [c.id, true])),
    },
  });
  console.log("✓ completed", id);
}

async function main() {
  // auth: login, else register; then always make sure the purchase exists
  let auth = await fetch(`${BASE}/api/fd/auth/login`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  absorb(auth);
  if (auth.status !== 200) {
    auth = await fetch(`${BASE}/api/fd/auth/register`, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: "Demo Artist" }) });
    absorb(auth);
    console.log("registered", EMAIL, auth.status);
  } else console.log("logged in", EMAIL);

  await fetch(`${BASE}/api/fd-dev/simulate-purchase`, { method: "POST", headers: { "content-type": "application/json", origin: BASE, cookie: jar }, body: JSON.stringify({ email: EMAIL }) });
  console.log("✓ entitlement granted");

  await completeLesson("m1l1");
  await completeLesson("m1l2");
  await completeLesson("m1l3");
  await completeLesson("m1l4");
  await completeLesson("m2l1");
  await api("PUT", "progress/lesson/m2l2", { action: "activity" });
  await api("PUT", "progress/lesson/m2l3", { action: "activity" });
  console.log("✓ progress: 5 complete, 2 in progress");

  await api("PUT", "notes/lesson/m1l3", { body: "Proof stack **v2** — swapped in the Mohawk sellout line and the KTRU spin count.\n- [ ] re-shoot the EPK hero still\n- [ ] ask Jenna for the venue receipt" });
  await api("PUT", "notes/lesson/m2l1", { body: "Heat map pass: Austin community stations are the soft target. KUT local hour first, then KVRX. Skip commercial — no shot without a tracker." });
  console.log("✓ lesson notes");

  // campaign: started a week ago so the board has due/past-due texture (idempotent: reuse if present)
  const NAME = "Dust Radio — first add push";
  const list = await api("GET", "campaigns");
  const existing = (list.campaigns || []).find((c: { name: string }) => c.name === NAME);
  const created = existing || await api("POST", "campaigns", {
    artist: "Neon Prairie", releaseTitle: "Dust Radio", track: "Static Bloom",
    genres: ["indie rock"], adjacentGenres: ["alt country"], runtimeSec: 192, cleanStatus: "clean",
    releaseDate: "2026-10-02", homeCity: "Austin", homeState: "TX",
    connections: [{ label: "Austin — based here 4 years", kind: "hometown" }],
    events: [{ city: "Seattle", venue: "The Crocodile", date: "2026-10-18" }],
    goals: ["first adds"], targetFormats: ["College", "AAA / Independent Discovery"],
    proof: ["Sold out 180-cap at The Mohawk 2026-06-12", "KTRU spun 9x since May"],
    radioHistory: "One prior add at KUT local hour.", readiness: { streamLink: true, cleanEdit: true },
    startDate: "2026-08-25", weeklyHours: 6, waves: 2, name: NAME,
  });
  const cid = created.id;
  console.log("✓ campaign", cid?.slice(0, 8));

  const stationRows = (await api("GET", "stations?limit=300")).rows as { id: number; callsign: string }[];
  const pick = ["KEXP", "KTRU", "KVRX", "KUT", "GHQ", "KALX", "WFMU"]
    .map((cs) => stationRows.find((x) => x.callsign === cs)?.id)
    .filter((x): x is number => x != null);
  const chosen = (pick.length >= 5 ? pick : stationRows.slice(0, 7).map((x) => x.id));
  const targets = await api("POST", `campaigns/${cid}/targets`, { stationIds: chosen });
  console.log("✓ targets added:", targets.added);
  const tg = await api("GET", `campaigns/${cid}/targets`);
  const t0 = tg.targets[0];
  await api("PATCH", `targets/${t0.id}`, { format_fit: 100, geo_relevance: 100, access: 95, timing: 90, evidence: 80, data_risk: 0, status: "verified", verifiedAt: "2026-08-26", angle: "hometown specialty-first entry" });
  const t1 = tg.targets[1];
  if (t1) await api("PATCH", `targets/${t1.id}`, { status: "verified", verifiedAt: "2026-08-26" });

  const safeTouch = (targetId: string, body: Record<string, unknown>) =>
    api("POST", `campaigns/${cid}/touches`, { targetId, ...body }).catch((e) => { if (!/409/.test(String(e.message))) throw e; });
  await safeTouch(t0.id, { result: "delivered", subject: "Austin's own · new single out 10/2", pitchVersion: "A" });
  await safeTouch(t0.id, { result: "replied" });
  if (t1) await safeTouch(t1.id, { result: "delivered", subject: "Austin's own · new single out 10/2", pitchVersion: "A" });
  console.log("   targets now:", (await api("GET", `campaigns/${cid}/targets`)).targets.length);
  console.log("✓ touches logged");

  const tasks = await api("GET", `campaigns/${cid}/tasks`);
  for (const t of tasks.tasks.slice(0, 6)) {
    if (t.status !== "done") await api("PATCH", `campaigns/${cid}/tasks/${t.id}`, { status: "done", note: "logged in the demo seed" });
  }
  console.log(`✓ board: ${tasks.tasks.length} tasks, first 6 completed`);

  const me = await api("GET", "me");
  console.log("── snapshot:", JSON.stringify({ entitlement: me.entitlement?.status, progress: me.progress, campaign: me.campaign?.name }));
  console.log(`\nPreview is ready:\n  ${BASE}/frequency-dominion/   (sales page)\n  ${BASE}/frequency-dominion/app   (sign in: ${EMAIL} / ${PASSWORD})`);
}
main().catch((e) => { console.error("SEED FAILED:", e); process.exit(1); });
