/**
 * Frequency Dominion — shared domain core.
 *
 * Single source of truth for the algorithms that must agree on the server
 * (Pages Functions) and in the browser (React app), and that unit tests pin:
 * station scoring, the campaign Tailoring Wizard, the 21-day task engine,
 * follow-up cancellation rules, analytics denominators, exercise pass
 * validation, sanitization and export helpers.
 *
 * Pure functions only — no platform APIs.
 */

/* ── Types ────────────────────────────────────────────────────────────── */

export type Basis = "fact" | "estimate" | "recommendation";
export type Tagged<T> = { value: T; basis: Basis; note?: string };

export type Block =
  | { b: "h"; level: number; spans: Span[] }
  | { b: "p"; spans: Span[] }
  | { b: "quote"; spans: Span[] }
  | { b: "list"; ordered: boolean; items: { spans: Span[] }[] }
  | { b: "table"; headers: string[]; rows: Span[][][] }
  | { b: "hr" };

export type Span =
  | { t: "text" | "b" | "i" | "code"; v: string }
  | { t: "a"; v: string; href: string };

export type DrillItem = {
  id: string;
  label: string;
  description: string;
  minutes: number | null;
  type: "response";
  passStandard: string | null;
};

export type WorksheetTable = {
  kind: "table";
  title: string;
  headers: string[];
  rows: string[][];
};

export type ExerciseDef = {
  kind: "field-exercise";
  prompt: string;
  items: DrillItem[];
  worksheets: WorksheetTable[];
  confirmations: { id: string; text: string; required?: boolean }[];
};

export type PassPolicy = {
  policy: "all-responses-min-words";
  minWords: number;
  requireAllDrills: boolean;
  requireWorksheetCells: number;
  note: string;
};

export type ExerciseAnswers = {
  responses: Record<string, string>;
  worksheetCells: unknown[];
  confirmations: Record<string, boolean>;
};

export type TargetScores = {
  format_fit: number;
  geo_relevance: number;
  access: number;
  timing: number;
  evidence: number;
  data_risk: number;
};

export type ScoreWeights = TargetScores; // same keys; data_risk acts as a deduction

export const DEFAULT_WEIGHTS: ScoreWeights = {
  format_fit: 30,
  geo_relevance: 20,
  access: 15,
  timing: 10,
  evidence: 15,
  data_risk: 10,
};

/* ── Dates ────────────────────────────────────────────────────────────── */

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dayOfWeekISO(iso: string): number {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).getUTCDay(); // 0 Sun … 6 Sat
}

/** Next date on/after `from` whose weekday is included in `weekdays` (UTC). */
export function nextWeekday(from: string, weekdays: number[]): string {
  let cur = from;
  for (let i = 0; i < 8; i++) {
    if (weekdays.includes(dayOfWeekISO(cur))) return cur;
    cur = addDaysISO(cur, 1);
  }
  return cur;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ── Emails / validation ──────────────────────────────────────────────── */

export function normalizeEmail(raw: string): string {
  const e = String(raw || "").trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at <= 0) return e;
  let local = e.slice(0, at);
  const domain = e.slice(at + 1);
  // plus-tags are aliases for every provider we care about; strip them so
  // bcc/receipt aliases map to one buyer identity.
  const plus = local.indexOf("+");
  if (plus > 0) local = local.slice(0, plus);
  return `${local}@${domain}`;
}

export function isEmail(raw: string): boolean {
  return /^[^\s@,;]{1,64}@[^\s@,;]{1,253}$/.test(String(raw || "").trim());
}

export function isIsoDate(raw: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(raw || "")) && !Number.isNaN(Date.parse(raw));
}

export function safeUrl(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";
    return u.toString().slice(0, 2000);
  } catch {
    return "";
  }
}

/** Strip control chars, collapse exotic unicode, cap length. User-authored
 *  text is stored as plain markdown and rendered by the safe block renderer
 *  (HTML is escaped) — never injected. */
export function sanitizeText(raw: string, maxLen = 20000): string {
  return String(raw ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/<(script|style|iframe|object|embed|form|link|meta)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/</g, "&lt;")
    .slice(0, maxLen);
}

export function sanitizePlain(raw: string, maxLen = 2000): string {
  return String(raw ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/g, "").trim().slice(0, maxLen);
}

export function wordCount(text: string): number {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

/* ── Station scoring (Lesson 2.3 math, 100-point scale) ───────────────── */

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function scoreTarget(scores: Partial<TargetScores>, weights: Partial<ScoreWeights> = {}): { total: number; tier: string } {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const sumWeights = w.format_fit + w.geo_relevance + w.access + w.timing + w.evidence;
  const f = (v: number | undefined) => clamp(Number(v) || 0, 0, 100);
  const raw =
    (f(scores.format_fit) * w.format_fit +
      f(scores.geo_relevance) * w.geo_relevance +
      f(scores.access) * w.access +
      f(scores.timing) * w.timing +
      f(scores.evidence) * w.evidence) /
    Math.max(1, sumWeights);
  const riskDeduction = (f(scores.data_risk) / 100) * w.data_risk;
  const total = Math.round(clamp(raw - riskDeduction, 0, 100));
  return { total, tier: tierFor(total) };
}

export function tierFor(total: number): string {
  if (total >= 85) return "Tier 1 — Priority Firing Squad";
  if (total >= 70) return "Tier 2 — Secondary Wave";
  if (total >= 50) return "Tier 3 — Nurture / Hold";
  return "Tier 4 — Dead Zone (do not contact)";
}

/** Auto-score a heat-map station against campaign answers (recommended,
 *  basis=estimate — the learner must confirm). Never infers audience. */
export function autoScore(station: { ring?: string; format?: string; gatekeeperName?: string; gatekeeper_name?: string; data_risk?: number | null; state?: string; city?: string }, campaign: WizardAnswers): TargetScores {
  const ring = /1\s*\/|ring\s*1/i.test(station.ring || "") ? 1 : /ring\s*2/i.test(station.ring || "") ? 2 : /ring\s*3/i.test(station.ring || "") ? 3 : 4;
  const geoByRing = [100, 78, 48, 12][ring - 1] ?? 12;
  const tourHit = (campaign.events || []).some((e) => String(e?.city || "").toLowerCase().includes(String(station.city || "").toLowerCase()));
  const geo = tourHit ? Math.max(geoByRing, 85) : geoByRing;
  const fmt = (station.format || "").toLowerCase();
  const want = [...(campaign.genres || []), ...(campaign.adjacentGenres || [])].map((g) => g.toLowerCase());
  const overlap = want.filter((g) => fmt.includes(g.split(" ")[0])).length;
  const format = want.length === 0 ? 50 : clamp(35 + overlap * 30, 0, 100);
  const access = station.gatekeeperName || (station as { gatekeeper_name?: string }).gatekeeper_name ? 90 : 35;
  const rel = campaign.releaseDate && campaign.startDate ? 70 : 55;
  const timing = clamp(rel + (tourHit ? 20 : 0), 0, 100);
  const evidence = (campaign.proof || []).length > 2 ? 70 : (campaign.proof || []).length > 0 ? 45 : 20;
  return {
    format_fit: Math.round(format),
    geo_relevance: Math.round(geo),
    access,
    timing: Math.round(timing),
    evidence,
    data_risk: station.data_risk != null ? clamp(Number(station.data_risk) || 0, 0, 100) : 10, // source rows dated 2026-08-31
  };
}

/* ── Campaign Tailoring Wizard ────────────────────────────────────────── */

export type WizardAnswers = {
  artist: string;
  releaseTitle: string;
  track: string;
  genres: string[];
  adjacentGenres: string[];
  runtimeSec: number | null;
  cleanStatus: "clean" | "explicit" | "unknown";
  releaseDate: string | null;
  homeCity: string;
  homeState: string;
  connections: { label: string; kind: string }[]; // hometown, college town, prior gigs…
  events: { city: string; venue: string; date: string }[]; // confirmed only
  goals: string[];
  targetFormats: string[];
  proof: string[]; // verified receipts (facts), each a one-line claim
  radioHistory: string;
  readiness: { streamLink: boolean; cleanEdit: boolean; rawWav: boolean; epk: boolean; photos: boolean; artwork: boolean; split: boolean; promo90: boolean };
  startDate: string | null;
  weeklyHours: number | null;
};

export type CampaignPlan = {
  objective: Tagged<string>;
  hypothesis: string;
  preparation: { label: string; basis: Basis }[];
  rings: { ring: string; scope: string; stationsTarget: number; rationale: string }[];
  formatLanes: { lane: string; why: string }[];
  weights: ScoreWeights;
  weightsWhy: string;
  composition: { segment: string; count: number; basis: Basis }[];
  scheduleHints: string[];
  pitchStarters: { lane: string; subject: string; body: string }[];
  missingAssets: string[];
  lessonRecommendations: { id: string; why: string }[];
  measurement: { metric: string; denominator: string; target: string }[];
};

const GENRE_LANES: Record<string, { lane: string; why: string }[]> = {
  rock: [{ lane: "College / AAA", why: "Format family where the record can sit in a specialty block before chart pressure." }],
  alternative: [{ lane: "College / AAA", why: "Specialty-first entry ramp; commercial alt only after receipts." }],
  hip: [{ lane: "Hip-hop R&B (community + college)", why: "Commercial R&B is callout-gated; build from community/college proof." }],
  country: [{ lane: "Americana / no-border + community country", why: "Commercial country needs a radio rep; the indie lane is Americana charts." }],
  electronic: [{ lane: "College specialty + NCM blocks", why: "DJ mixes and night blocks on college/classic-alt are the entry, not CHR." }],
  folk: [{ lane: "Community / folk & roots shows", why: "Show-host autonomy beats tight commercial clocks for long-form songs." }],
  jazz: [{ lane: "NPR-style jazz + college jazz shows", why: "Host-selected programming is where independents actually get spun." }],
  pop: [{ lane: "College dance/indie pop + community CHR-adjacent", why: "Commercial CHR is a major-label lane; prove locally first." }],
  metal: [{ lane: "College metal shows + community AAA", why: "Specialty metal hours are the add engine for independents." }],
};

export function generatePlan(a: WizardAnswers): CampaignPlan {
  const hasEvents = (a.events || []).length > 0;
  const hasTourDates = hasEvents && a.events.every((e) => isIsoDate(e.date));
  const weeksToRelease = a.releaseDate && a.startDate ? Math.max(0, Math.round((Date.parse(a.releaseDate) - Date.parse(a.startDate)) / (7 * 864e5))) : null;

  const objective =
    (a.goals || []).includes("interviews") && !hasTourDates
      ? "Objective: collect interview/feature proof in the home region, then use it to unlock adjacent-market adds."
      : hasTourDates
        ? "Objective: convert confirmed dates into market-specific radio stories, and radio into packed rooms (adds + event mentions)."
        : "Objective: land 3–5 verified first adds in Ring 1/2 with clean, dated proof you can cascade.";
  const recommendationBasis: Basis = "recommendation";

  const hypothesis = a.artist
    ? `${a.artist}${a.track ? `’s “${a.track}”` : ""} is a ${a.genres[0] || "genre-defined"} record with ${a.homeCity ? `${a.homeCity}-area` : "local"} legitimacy${a.proof.length ? ` and ${a.proof.length} verified proof point${a.proof.length > 1 ? "s" : ""}` : ", currently light on third-party proof"}. ${hasTourDates ? `Confirmed dates (${a.events.map((e) => e.city).join(", ")}) give stations a story with a deadline, ` : ""}${a.proof.length < 2 ? "so the campaign opens in Ring 1/2 college/community where independent adds are procedurally normal, and only then expands." : "which supports a 20-target Ring 1/2 first wave with a specialty-first lane strategy."}`
    : "";

  const preparation: CampaignPlan["preparation"] = [
    { label: "Master stream link (DSP page) is live on every platform", basis: a.readiness.streamLink ? "fact" : "recommendation" },
    { label: "Clean radio edit exists and is named ARTIST-TRACK-RADIO", basis: a.readiness.cleanEdit ? "fact" : "recommendation" },
    { label: "Broadcast WAV staged (not expiring links)", basis: a.readiness.rawWav ? "fact" : "recommendation" },
    { label: "One-page EPK with 80-word bio and per-market proof shelf", basis: a.readiness.epk ? "fact" : "recommendation" },
    { label: "90-second promo recorded to the 5-act structure", basis: a.readiness.promo90 ? "fact" : "recommendation" },
    { label: "Metadata verified: artist, title, featuring, explicit flag, ISRC", basis: "recommendation" },
    { label: "Gatekeeper names re-verified within 30 days for every target", basis: "recommendation" },
    { label: `Runtime ${a.runtimeSec ? `${Math.floor(a.runtimeSec / 60)}:${String(a.runtimeSec % 60).padStart(2, "0")}` : "not stated"} — under 3:35 avoids most format clocks being a blocker`, basis: a.runtimeSec ? "fact" : "estimate" },
  ];

  const rings = [
    { ring: "Ring 1 — Hometown metro", scope: a.homeCity || "home market", stationsTarget: 8, rationale: "The only market where you are a known quantity; fastest proof." },
    { ring: "Ring 2 — Commuter corridor", scope: `~30–90 min out from ${a.homeCity || "home"}`, stationsTarget: 6, rationale: "Regional narrative still reads as local." },
    { ring: "Ring 3 — Tour corridor / connection towns", scope: a.connections.map((c) => c.label).concat(a.events.map((e) => e.city)).join(", ") || "connection towns & confirmed dates", stationsTarget: hasEvents ? 4 : 3, rationale: hasEvents ? "Dates give the pitch a deadline and a story." : "Connection towns still justify a targeted angle." },
    { ring: "Ring 4 — Remote discovery", scope: "format-first (no geography)", stationsTarget: hasTourDates ? 2 : 3, rationale: "Only with proof from Rings 1–3 in hand; late-campaign wave." },
  ];

  const lanes = new Map<string, { lane: string; why: string }>();
  for (const g of a.genres.concat(a.adjacentGenres)) {
    const key = Object.keys(GENRE_LANES).find((k) => g.toLowerCase().includes(k));
    if (key) for (const l of GENRE_LANES[key]) lanes.set(l.lane, l);
  }
  if (lanes.size === 0) {
    lanes.set("College / Community", { lane: "College / Community", why: "Open-format lanes accept independent submissions without rep gatekeeping — the default first wave for any genre." });
  }
  for (const t of a.targetFormats || []) {
    if (!lanes.has(t)) lanes.set(t, { lane: t, why: "Requested by you in the wizard; validate fit with the station scoring pass before sending." });
  }

  const weights: ScoreWeights = hasEvents
    ? { format_fit: 25, geo_relevance: 25, access: 15, timing: 20, evidence: 10, data_risk: 5 }
    : a.proof.length >= 3
      ? { format_fit: 30, geo_relevance: 15, access: 15, timing: 10, evidence: 15, data_risk: 10 }
      : { ...DEFAULT_WEIGHTS };
  const weightsWhy = hasEvents
    ? "Confirmed dates raised timing and geography weights: your story is time-bound, so stations near shows score higher."
    : a.proof.length >= 3
      ? "Existing receipts let you lean on format fit rather than geography; evidence weight stays at 15."
      : "Starting posture: format fit dominates; geography compensates for thin proof.";

  const composition = [
    { segment: "College (music directors + specialty hosts)", count: 8, basis: recommendationBasis as Basis },
    { segment: "Community / non-commercial", count: 5, basis: recommendationBasis as Basis },
    { segment: "Commercial AAA / local-specialty slots", count: 3, basis: recommendationBasis as Basis },
    { segment: hasEvents ? "Press/sponsor adjacent to tour dates (optional)" : "Format discovery outside the rings (post-proof)", count: 2, basis: recommendationBasis as Basis },
    { segment: "Online / specialty satellite (chart-reporting)", count: 2, basis: recommendationBasis as Basis },
  ];

  const scheduleHints: string[] = [];
  if (a.startDate) {
    scheduleHints.push(`Day 1 = ${a.startDate}. Load phase: days 1–3 (verification + arming audit).`);
    const wave1 = nextWeekday(addDaysISO(a.startDate, 3), [2]); // Tuesday
    const wave2 = nextWeekday(addDaysISO(a.startDate, 6), [4]); // Thursday
    scheduleHints.push(`Wave 1 dispatch Tuesday ${wave1} (9:15–10:30 AM station-local), Wave 2 Thursday ${wave2}.`);
    if (weeksToRelease != null) {
      if (weeksToRelease < 3) scheduleHints.push(`⚠ Only ${weeksToRelease} week(s) between campaign start and release — shift Wave 1 earlier or move the release expectation: programmers need a 2–3 week runway.`);
      else if (weeksToRelease > 8) scheduleHints.push(`Release is ${weeksToRelease} weeks out — consider a specialty-first “soft add” pitch now, and hold the dated adds push for W-4.`);
    }
  } else {
    scheduleHints.push("Pick a campaign start date with at least 21 clean days before release.");
  }
  if (a.weeklyHours != null && a.weeklyHours < 5) {
    scheduleHints.push(`At ${a.weeklyHours}h/week, cap the war room at 20 targets and run one wave at a time (do not expand to Ring 4 this cycle).`);
  }

  const missingAssets: string[] = [];
  if (!a.readiness.streamLink) missingAssets.push("No master stream link — programmers will not chase your music.");
  if (!a.readiness.cleanEdit) missingAssets.push("No clean radio edit — every 'clean?' reply stalls the add.");
  if (!a.readiness.epk) missingAssets.push("No one-page EPK — build it with the EPK deck before Touch 1.");
  if (!a.readiness.promo90) missingAssets.push("No 90-second promo — the audio-script builder can produce it in one sitting.");
  if (!a.releaseDate) missingAssets.push("No release date — pitch angles need a 'why this week'; run the campaign as a soft-add cycle instead.");
  if (!a.events.length) missingAssets.push("No confirmed dates — geo relevance leans on hometown/connection proof alone.");
  if (a.cleanStatus === "unknown") missingAssets.push("Clean/explicit status unconfirmed — programmers need the flag before touching the track.");

  const lessonRecommendations = [
    { id: "m2l1", why: "Lock the hometown heat map before choosing targets." },
    { id: "m2l3", why: "Apply the 100-point scoring weights this wizard generated." },
    { id: "m3l2", why: "Draft the 90-word pitch from the starters below." },
    ...(hasEvents ? [{ id: "m2l2", why: "Tour pre-roll: time each corridor pitch 21 days before the date." }] : []),
    ...(a.proof.length === 0 ? [{ id: "m1l3", why: "Zero verified receipts — build the proof stack first." }] : []),
    { id: "m4l1", why: "Run the load sequence before the first send." },
  ];

  const pitchStarters = Array.from(lanes.values()).slice(0, 3).map((l, i) => ({
    lane: l.lane,
    subject: i === 0 ? `Local artist · ${a.homeCity || "[city]"} · [date]` : `${a.track || "[song]"} fits your ${l.lane.split(" ")[0].toLowerCase()} block${a.runtimeSec ? ` · ${Math.floor(a.runtimeSec / 60)}:${String(a.runtimeSec % 60).padStart(2, "0")}` : ""}`,
    body:
      `I'm ${a.artist || "[ARTIST]"}${a.homeCity ? ` from ${a.homeCity}` : ""}; ${a.track || "[SONG]"} is a ${a.genres[0] || "[genre]"} record${a.proof[0] ? ` — proof: ${a.proof[0].toLowerCase()}` : ""}.` +
      (hasEvents ? ` We play [venue] on [date].` : "") +
      ` ${a.readiness.cleanEdit ? "Clean radio edit and 90-sec promo are ready." : "Radio edit is being prepared; I'll send it the moment it's cut."} Would it fit ${l.lane}?`,
  }));

  const measurement = [
    { metric: "Reply rate", denominator: "delivered first-touch sends", target: "≥ 15% for Ring 1/2 with named contacts" },
    { metric: "Review rate", denominator: "delivered first-touch sends", target: "≥ 10%" },
    { metric: "Positive-outcome rate", denominator: "verified targets contacted", target: "≥ 2 of 20 in the first cycle is a pass; log everything" },
    { metric: "Data-defect rate", denominator: "all logged touches", target: "< 10% (bounce + wrong-person replies)" },
    { metric: "Verification coverage", denominator: "war-room rows", target: "100% verified within 30 days of send" },
  ];

  return {
    objective: { value: objective, basis: "recommendation" },
    hypothesis,
    preparation,
    rings,
    formatLanes: Array.from(lanes.values()),
    weights,
    weightsWhy,
    composition,
    scheduleHints,
    pitchStarters,
    missingAssets,
    lessonRecommendations,
    measurement,
  };
}

/* ── 21-day task engine ───────────────────────────────────────────────── */

export type TaskTemplate = {
  day: number;
  phase: string;
  title: string;
  detail: string;
  verification: string;
  kind: "general" | "send" | "touch2" | "touch3";
  touch: number | null;
  wave: number | null;
};

export type GeneratedTask = {
  day: number;
  phase: string;
  kind: string;
  title: string;
  detail: string;
  verification: string;
  wave: number | null;
  dependsOnDay: number | null;
  scheduledDate: string;
};

/** Expand templates into dated tasks. FIRE/TOUCH tasks move to the next
 *  station-friendly weekday (Tue–Thu) so sends land in music-meeting windows. */
export function buildSchedule(templates: TaskTemplate[], startDate: string, opts: { waves?: number } = {}): GeneratedTask[] {
  const waves = Math.max(1, Math.min(4, opts.waves ?? 2));
  const out: GeneratedTask[] = [];
  for (const t of templates) {
    let date = addDaysISO(startDate, t.day - 1);
    if (t.kind === "send" || t.kind === "touch2" || t.kind === "touch3") date = nextWeekday(date, [2, 3, 4]);
    const dependsOnDay =
      t.kind === "touch2" ? Math.max(1, t.day - (t.wave === 2 ? 1 : 5)) : t.kind === "touch3" ? Math.max(1, t.day - 3) : t.day > 1 ? t.day - 1 : null;
    out.push({
      day: t.day,
      phase: t.phase,
      kind: t.kind,
      title: t.title,
      detail: t.detail,
      verification: t.verification,
      wave: t.wave,
      dependsOnDay,
      scheduledDate: date,
    });
    // Extra waves beyond the calendar's built-in two: repeat the last touch
    // cadence on +4/+8 day intervals so multi-wave campaigns stay honest.
    if (t.kind === "send" && t.wave === 2 && waves > 2) {
      for (let w = 3; w <= waves; w++) {
        const d = t.day + (w - 2) * 3;
        let date2 = addDaysISO(startDate, d - 1);
        date2 = nextWeekday(date2, [2, 3, 4]);
        out.push({ day: d, phase: "FIRE", kind: "send", title: `Wave ${w} Dispatch: Deliver 90-word pitch`, detail: `Wave ${w} targets: fresh value, same discipline as Waves 1–2.`, verification: "Delivered Tue–Thu morning; logged per target", wave: w, dependsOnDay: t.day, scheduledDate: date2 });
        const t2 = d + 4;
        out.push({ day: t2, phase: "TOUCH-2", kind: "touch2", title: `Touch 2 Dispatch to Wave ${w}: New proof, zero reminders`, detail: "One receipt, one link, 45 words max.", verification: "In-thread reply; fresh asset", wave: w, dependsOnDay: d, scheduledDate: nextWeekday(addDaysISO(startDate, t2 - 1), [2, 3, 4]) });
        const t3 = d + 8;
        out.push({ day: t3, phase: "TOUCH-3", kind: "touch3", title: `Touch 3 Graceful Exit to Wave ${w}`, detail: "Final proof update + dignified exit.", verification: "Door open, no guilt", wave: w, dependsOnDay: t2, scheduledDate: nextWeekday(addDaysISO(startDate, t3 - 1), [2, 3, 4]) });
      }
    }
  }
  return out;
}

/** Follow-up cancellation rules. Returns true when any further touch to this
 *  target must stop — enforced identically on server and client. */
export function shouldCancelFollowUps(t: {
  suppressed?: number;
  touchResults: { touch_no: number; result: string }[];
}): boolean {
  const stopResults = new Set(["optout", "bounce_hard", "declined", "instruction"]);
  if (t.suppressed) return true;
  if (t.touchResults.some((r) => stopResults.has(r.result))) return true;
  if (t.touchResults.filter((r) => ["pending", "delivered", "replied", "no_reply", "bounce_soft"].includes(r.result)).length >= 3) return true;
  return false;
}

export const MAX_TOUCHES = 3;

/* ── Exercise pass validation ─────────────────────────────────────────── */

export function validateExercise(exercise: ExerciseDef, pass: PassPolicy, answers: ExerciseAnswers): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const item of exercise.items || []) {
    const text = answers?.responses?.[item.id] || "";
    const min = item.passStandard ? Math.max(pass.minWords, 30) : pass.minWords;
    if (wordCount(text) < min) missing.push(`“${item.label}” needs at least ${min} words of real, verifiable detail`);
    if (item.passStandard && !missing.length && wordCount(text) >= min) {
      // pass standards with explicit thresholds are advisory here; the
      // confirmation checkbox below carries the attestation.
    }
  }
  if (pass.requireAllDrills && (answers?.responses == null || Object.keys(answers.responses).length < (exercise.items || []).length)) {
    missing.push("Every drill must have an entry");
  }
  const needed = pass.requireWorksheetCells || 0;
  if (needed > 0) {
    let filled = 0;
    for (const sheet of answers?.worksheetCells || []) {
      const cells = Array.isArray(sheet) ? sheet : sheet && typeof sheet === "object" ? Object.values(sheet as Record<string, unknown>) : [sheet];
      for (const row of cells) { const vs = Array.isArray(row) ? row : [row]; for (const v of vs) if (String(v || "").trim()) filled++; }
    }
    if (filled < needed) missing.push(`At least ${needed} worksheet cells should be filled from your real campaign data`);
  }
  for (const c of exercise.confirmations || []) {
    if (c.required !== false && !answers?.confirmations?.[c.id]) missing.push(`Confirmation required: ${c.text}`);
  }
  return { ok: missing.length === 0, missing };
}

/* ── Analytics (explicit denominators, no invented attribution) ───────── */

export type AnalyticsRow = {
  targets: { total: number; verified: number; suppressed: number };
  sends: number;
  delivered: number;
  bounceHard: number;
  bounceSoft: number;
  repliesHuman: number;
  repliesWrongPerson: number;
  reviews: number;
  spins: number;
  interviews: number;
  features: number;
  libraryAdds: number;
  rotations: number;
  outcomes: number;
};

export function computeAnalytics(rows: AnalyticsRow) {
  const r = rows;
  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : null);
  return {
    counts: r,
    deliveryRate: { value: pct(r.delivered, r.sends), denominator: `${r.sends} original sends` },
    replyRate: { value: pct(r.repliesHuman, r.delivered), denominator: `${r.delivered} delivered first touches` },
    wrongPersonRate: { value: pct(r.repliesWrongPerson, r.repliesHuman + r.repliesWrongPerson), denominator: "all replies" },
    reviewRate: { value: pct(r.reviews, r.delivered), denominator: `${r.delivered} delivered first touches` },
    positiveOutcomeRate: { value: pct(r.outcomes, r.targets.verified - r.targets.suppressed), denominator: `${Math.max(0, r.targets.verified - r.targets.suppressed)} verified contacted targets` },
    dataDefectRate: { value: pct(r.bounceHard + r.bounceSoft + r.repliesWrongPerson, r.sends), denominator: `${r.sends} sends` },
    verificationCoverage: { value: pct(r.targets.verified, r.targets.total), denominator: `${r.targets.total} selected targets` },
    suppressionRate: { value: pct(r.targets.suppressed, r.targets.total), denominator: `${r.targets.total} selected targets` },
    note: "Rates are campaign arithmetic, not attribution: an outcome following a touch is a sequence, not a proven cause. Airplay counts are not income or reach estimates.",
  };
}

/* ── CSV export ───────────────────────────────────────────────────────── */

export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown) => {
    const s = v == null ? "" : Array.isArray(v) || typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\r\n") + "\r\n";
}

/* ── Projection for the heat map (Albers-lite conic; shared so the server
      can pre-aggregate identically if ever needed) ────────────────────── */

export function projectAlbers(lon: number, lat: number, width: number, height: number): [number, number] {
  const phi0 = (37.5 * Math.PI) / 180;
  const lam0 = (-96 * Math.PI) / 180;
  const p1 = (29.5 * Math.PI) / 180;
  const p2 = (45.5 * Math.PI) / 180;
  const n = (Math.sin(p1) + Math.sin(p2)) / 2;
  const C = Math.cos(p1) ** 2 + 2 * n * Math.sin(p1);
  const rho = (Math.sqrt(C - 2 * n * Math.sin((lat * Math.PI) / 180)) / n);
  const rho0 = (Math.sqrt(C - 2 * n * Math.sin(phi0)) / n);
  const th = n * (((lon * Math.PI) / 180) - lam0);
  const x = rho * Math.sin(th);
  const y = rho0 - rho * Math.cos(th);
  // fit continental bounds into the viewBox
  const K = width / 2.45;
  return [width / 2 + x * K, height * 0.52 - y * K];
}
