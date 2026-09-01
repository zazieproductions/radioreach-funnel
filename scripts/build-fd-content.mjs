/**
 * Frequency Dominion content pipeline.
 *
 * Reads the authoritative master package (`Frequency-Dominion-Upsell/`) and emits:
 *   data/fd/outline.json        — public curriculum outline (titles/meta only)
 *   data/fd/lesson-bodies.json  — full web-native lesson content (gated via API/D1)
 *   data/fd/stations.json       — the 300-station heat-map database (server-side only)
 *   data/fd/task-templates.json — 21-day campaign task engine templates
 *   data/fd/tools.json          — pitch vault, subject lines, follow-up, EPK, audit,
 *                                 audio scripts, decoder, playbooks, resources
 *   src/fd/data/outline.json    — client copy of the public outline
 *
 * Re-runnable and deterministic. Seeding SQL is generated separately by
 * scripts/fd/gen-seed-sql.mjs from these files so lesson content updates never
 * touch progress/notes tables.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "Frequency-Dominion-Upsell");
const OUT = path.join(ROOT, "data", "fd");
fs.mkdirSync(OUT, { recursive: true });

const read = (p) => fs.readFileSync(path.join(SRC, p), "utf8").replace(/\r\n/g, "\n");
const exists = (p) => fs.existsSync(path.join(SRC, p));
const strip = (s) => s.replace(/\u00a0/g, " ").trim();

/* ── Markdown → structured blocks (safe subset; the client renders these with
      escaping — raw HTML is stripped so stored content can never execute) ── */

function inlineTokens(line) {
  // Split into inline spans: bold, italic, code, links. Kept token-based (no
  // HTML) so both React and seed SQL store plain data.
  const out = [];
  let rest = line;
  const patterns = [
    { re: /^\*\*([^*]+)\*\*/, kind: "b" },
    { re: /^\[([^\]]+)\]\((https?:[^)\s]+)\)/, kind: "a" },
    { re: /^`([^`]+)`/, kind: "code" },
    { re: /^\*([^*\s][^*]*)\*/, kind: "i" },
  ];
  let plain = "";
  while (rest.length) {
    let matched = false;
    for (const p of patterns) {
      const m = rest.match(p.re);
      if (m) {
        if (plain) { out.push({ t: "text", v: plain }); plain = ""; }
        if (p.kind === "a") out.push({ t: "a", v: m[1], href: m[2] });
        else if (p.kind === "b") out.push({ t: "b", v: flattenMd(m[1]) });
        else out.push({ t: p.kind, v: m[1] });
        rest = rest.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) { plain += rest[0]; rest = rest.slice(1); }
  }
  if (plain) out.push({ t: "text", v: plain });
  return out.length ? out : [{ t: "text", v: line }];
}
function flattenMd(s) {
  return s.replace(/\*\*|__|`/g, "").replace(/\*([^*]+)\*/g, "$1");
}

function parseBlocks(md) {
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = strip(line);
    if (!t) { i++; continue; }
    if (t.startsWith("<!--")) { i++; continue; }
    const h = t.match(/^(#{1,6})\s+(.*)$/);
    if (h) { blocks.push({ b: "h", level: h[1].length, spans: inlineTokens(strip(h[2])) }); i++; continue; }
    if (/^(-{3,}|\*{3,})$/.test(t)) { blocks.push({ b: "hr" }); i++; continue; }
    if (t.startsWith(">")) {
      const buf = [];
      while (i < lines.length && strip(lines[i]).startsWith(">")) {
        buf.push(strip(lines[i]).replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ b: "quote", spans: inlineTokens(buf.join(" ")) });
      continue;
    }
    if (t.startsWith("|")) {
      const rows = [];
      while (i < lines.length && strip(lines[i]).startsWith("|")) {
        const raw = strip(lines[i]).replace(/^\|/, "").replace(/\|$/, "");
        const cells = raw.split("|").map((c) => strip(c));
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      if (rows.length) {
        const [headers, ...body] = rows;
        blocks.push({ b: "table", headers, rows: body.map((r) => r.map((c) => inlineTokens(c))) });
      }
      continue;
    }
    if (/^([*+-]|\d+[.)])\s+/.test(t)) {
      const items = [];
      let ordered = /^\d+[.)]\s+/.test(t);
      while (i < lines.length) {
        const cur = strip(lines[i]);
        const m = cur.match(/^([*+-]|\d+[.)])\s+(.*)$/);
        if (!m) {
          if (cur && items.length && !/^#|^\||^>/.test(cur)) {
            items[items.length - 1].spans = inlineTokens(
              flattenMd(spansToText(items[items.length - 1].spans)) + " " + cur
            );
            i++;
            continue;
          }
          break;
        }
        ordered = /^\d+[.)]\s+/.test(cur);
        let content = m[2];
        i++;
        while (i < lines.length) {
          const nx = strip(lines[i]);
          if (!nx || /^([*+-]|\d+[.)])\s+/.test(nx) || /^#|^\||^>/.test(nx)) break;
          content += " " + nx;
          i++;
        }
        items.push({ spans: inlineTokens(content) });
      }
      blocks.push({ b: "list", ordered, items });
      continue;
    }
    // paragraph — gather until blank line or block boundary
    const buf = [t];
    i++;
    while (i < lines.length) {
      const nx = strip(lines[i]);
      if (!nx || /^#|^\||^>|^([-*+]|\d+[.)])\s|^<!--/.test(nx)) break;
      buf.push(nx);
      i++;
    }
    blocks.push({ b: "p", spans: inlineTokens(buf.join(" ")) });
  }
  return blocks;
}

function spansToText(spans) {
  return (spans || []).map((s) => s.v || "").join("");
}

/* ── Lesson parsing ─────────────────────────────────────────────────────── */

const MODULES = [
  { id: "m1", n: 1, folder: "Module-1-Command-Identity", title: "Command Identity",
    promise: "Reframe the job: you are a solutions supplier for a programmer's clock, not a supplicant. Quantify the cost of silence and lock the No-Spam Oath." },
  { id: "m2", n: 2, folder: "Module-2-Target-Architecture", title: "Target Architecture",
    promise: "Turn geography, tour dates, and format math into a 20-station war room with a defensible priority score for every row." },
  { id: "m3", n: 3, folder: "Module-3-The-Pitch-Weapon", title: "The Pitch System",
    promise: "Build the 4-7 word subject line, the 90-word pitch, the one-page EPK, and radio-ready audio — one weapon, one ask." },
  { id: "m4", n: 4, folder: "Module-4-21-Day-Campaign", title: "The 21-Day Campaign",
    promise: "Run the dated 21-day loop: load, fire, watch, follow up with value, exit with grace, log every result." },
  { id: "m5", n: 5, folder: "Module-5-Human-Frequency", title: "Human Frequency",
    promise: "Convert replies into relationships: high-value calls, gratitude protocols, burned-well repair, and the ally engine." },
  { id: "m6", n: 6, folder: "Module-6-Empire-Loop", title: "The Compounding Loop",
    promise: "Cascade proof into the next market, price your revenue lanes honestly, calendar the next release, and audit every 90 days." },
];
const MODULE_TOOLS = {
  m1: [{ to: "/frequency-dominion/app/campaign", label: "Campaign Builder" }, { to: "/frequency-dominion/app/vault", label: "Proof-stack organizer" }],
  m2: [{ to: "/frequency-dominion/app/heatmap", label: "Heat Map workspace" }, { to: "/frequency-dominion/app/stations", label: "Station War Room" }],
  m3: [{ to: "/frequency-dominion/app/vault", label: "Pitch & subject-line tools" }],
  m4: [{ to: "/frequency-dominion/app/campaign", label: "21-Day Campaign board" }],
  m5: [{ to: "/frequency-dominion/app/stations", label: "Station records & touch log" }],
  m6: [{ to: "/frequency-dominion/app/analytics", label: "Campaign Analytics" }, { to: "/frequency-dominion/app/vault", label: "90-day audit engine" }],
};

function section(blocks, title) {
  const start = blocks.findIndex((b) => b.b === "h" && spansToText(b.spans).toUpperCase().includes(title));
  if (start === -1) return [];
  const out = [];
  for (let i = start + 1; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.b === "h" && b.level <= 2) break;
    out.push(b);
  }
  return out;
}

function parseLesson(file, code) {
  const raw = read(file);
  const blocks = parseBlocks(raw);
  const h1 = blocks.find((b) => b.b === "h" && b.level === 1) || blocks.find((b) => b.b === "p");
  const title = h1 ? flattenMd(spansToText(h1.spans)) : code;
  // drop raw-H1 paragraph when it was consumed as title (avoid duplicate block)
  if (h1 && h1.b === "p") blocks.splice(blocks.indexOf(h1), 1);
  const truth = blocks.find((b) => b.b === "quote");
  const master = section(blocks, "MASTERCLASS");
  const drillsSec = section(blocks, "IMPLEMENTATION DRILLS");
  const worksheetSec = section(blocks, "ACTION WORKSHEET");
  const warroomSec = section(blocks, "WAR-ROOM");
  const communitySec = section(blocks, "COMMUNITY");
  // drop leading h2 of a section if it duplicated the section title
  const trimLead = (arr) => (arr[0] && arr[0].b === "h" && arr[0].level === 2 ? arr.slice(1) : arr);

  // drills: "- **Drill 1 — Title (20 min, non-negotiable).** body **Pass standard:** X"
  const drillItems = [];
  for (const b of trimLead(drillsSec)) {
    if (b.b === "list") for (const it of b.items) {
      const text = spansToText(it.spans).replace(/\s+/g, " ").trim();
      const m = text.match(/^Drill\s*(\d+)\s*[—-]\s*(.+)$/i);
      if (!m) continue;
      let rest = m[2];
      let minutes = null;
      const mm = rest.match(/\((\d+)\s*min[^)]*\)/);
      if (mm) minutes = Number(mm[1]);
      let pass = null;
      const pm = rest.match(/\*\*Pass standard:\*\*\s*(.+)$/i) || rest.match(/Pass standard:\s*(.+)$/i);
      if (pm) pass = flattenMd(pm[1]).trim();
      let head = pm ? rest.slice(0, pm.index).trim() : rest;
      head = flattenMd(head).replace(/^(.+?)\s*\(\d+\s*min[^)]*\)\.?\s*/, "$1|").split("|")[0].trim();
      const body = flattenMd(rest)
        .replace(/\*\*Pass standard:\*\*\s*.+$/i, "")
        .replace(/Pass standard:.+$/i, "")
        .replace(/\((\d+)\s*min[^)]*\)/, "")
        .replace(/^\s*[—-]\s*/, "")
        .trim();
      drillItems.push({ n: Number(m[1]), title: head, minutes, prompt: body, passStandard: pass });
    }
  }
  // worksheet tables become interactive, editable records
  const worksheets = [];
  let protocol = null;
  for (const b of trimLead(worksheetSec)) {
    if (b.b === "p") {
      const t = spansToText(b.spans);
      const m = t.match(/Protocol Document:?\s*`?([^`]+)`?/i);
      if (m) protocol = flattenMd(m[1]);
      else worksheets.push({ kind: "note", blocks: [b] });
    } else if (b.b === "table") {
      worksheets.push({ kind: "table", title: protocol || `Worksheet ${worksheets.length + 1}`, headers: b.headers, rows: b.rows.map((r) => r.map((c) => flattenMd(spansToText(c)))) });
    } else if (b.b === "list") {
      worksheets.push({ kind: "list", items: b.items.map((it) => flattenMd(spansToText(it.spans))) });
    }
  }

  const community = [];
  for (const b of trimLead(communitySec)) if (b.b === "list") for (const it of b.items) community.push(flattenMd(spansToText(it.spans)));

  const exerciseMinutes = drillItems.reduce((a, d) => a + (d.minutes || 10), 0);
  const readChars = master.reduce((a, b) => a + spansToText(b.spans || (b.items || []).flatMap((x) => x.spans)).length, 0);
  const minutes = Math.max(8, Math.min(30, 6 + Math.round(readChars / 2200)));
  // boundary warnings: pull the explicit prohibitions from the lesson body
  const bodyText = flattenMd(raw);
  const warnings = [];
  for (const sent of bodyText.split(/(?<=[.!?])\s+(?=[A-Z*])/)) {
    const s2 = sent.replace(/\*/g, "").replace(/\s+/g, " ").trim();
    if (/(never|do not|don't|zero tolerance|prohibit|without asking|illegal)/i.test(s2) && s2.length > 30 && s2.length < 220 && !/\|/.test(s2)) warnings.push(s2);
    if (warnings.length >= 3) break;
  }
  return {
    code,
    title: title.replace(/^\d+\.\d+\s*[—-]?\s*/, "").replace(/^Lesson\s*\d\.\d\s*[—-]?\s*/i, "").trim() || code,
    fullTitle: title,
    truth: truth ? flattenMd(spansToText(truth.spans)).replace(/^\s*THE ONE-LINE TRUTH:?\s*/, "").trim() : "",
    minutes,
    exerciseMinutes,
    masterclass: trimLead(master),
    drills: drillItems,
    worksheets,
    warroom: trimLead(warroomSec),
    community,
    warnings,
  };
}

/* ── Insider edge (per-lesson decoder notes) ──────────────────────────── */

function parseInsiderEdge() {
  const raw = read("Resources/Insider/Per-Lesson-Insider-Edge.md");
  const map = {};
  let cur = null;
  for (const line of raw.split("\n")) {
    const t = strip(line);
    const h = t.match(/^\*\*(\d\.\d)\s*[·•]\s*(.+?)\*\*\s*$/);
    if (h) { cur = h[1]; map[cur] = []; continue; }
    if (cur && t.startsWith("- ")) {
      const item = flattenMd(t.slice(2)).replace(/\*\*\s*$/, "").trim();
      map[cur].push(item);
    }
  }
  return map;
}

/* ── Decoder ──────────────────────────────────────────────────────────── */

function parseDecoder() {
  const raw = read("Resources/Insider/Radio-Industry-Insider-Decoder.md");
  const blocks = parseBlocks(raw);
  const out = [];
  let cur = null;
  for (const b of blocks) {
    if (b.b === "h" && b.level === 2) {
      const t = flattenMd(spansToText(b.spans));
      const m = t.match(/^(\d+)\.\s*(.+)$/);
      cur = { n: m ? Number(m[1]) : out.length + 1, title: m ? m[2] : t, blocks: [] };
      out.push(cur);
      continue;
    }
    if (b.b === "h" && b.level === 1) continue;
    if (cur) cur.blocks.push(b);
  }
  // split glossary section (## 6) into term list if present
  return out;
}

/* ── Playbooks ────────────────────────────────────────────────────────── */

function parsePlaybooks() {
  const out = {};
  for (const mod of MODULES) {
    const f = `Resources/Insider/Module-${mod.n}-Insider-Playbook.md`;
    if (!exists(f)) continue;
    out[mod.id] = parseBlocks(read(f)).filter((b) => !(b.b === "h" && b.level === 1));
  }
  return out;
}

/* ── 21-day calendar → task templates ─────────────────────────────────── */

function parseCalendar() {
  const raw = read("Resources/Calendars/21-Day-Campaign-Calendar.md");
  const templates = [];
  let day = 0;
  for (const line of raw.split("\n")) {
    const t = strip(line);
    const m = t.match(/^\|\s*\*\*Day\s*(\d+)\*\*\s*\|\s*\*\*([A-Z0-9-]+)\*\*\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/);
    if (!m) continue;
    day = Number(m[1]);
    let mission = flattenMd(m[3]).replace(/\*\*/g, "").trim();
    let touch = null;
    const tm = mission.match(/Touch\s*(\d)/i);
    if (tm) touch = Number(tm[1]);
    let wave = null;
    const wm = m[3].match(/Wave\s*(\d)/i);
    if (wm) wave = Number(wm[1]);
    templates.push({
      day,
      phase: m[2],
      title: mission.split(":")[0].length < 58 ? mission : mission.split(":")[0],
      detail: mission,
      verification: flattenMd(m[4]).replace(/\*\*/g, "").trim(),
      kind: m[2] === "TOUCH-2" ? "touch2" : m[2] === "TOUCH-3" ? "touch3" : m[2] === "FIRE" ? "send" : "general",
      touch, wave,
    });
  }
  return { tasks: templates, source: "Resources/Calendars/21-Day-Campaign-Calendar.md" };
}

/* ── Stations (300-row curated heat-map DB) ───────────────────────────── */

const CITY_COORDS = {
  "Akron, OH": [41.08, -81.52], "Albany, NY": [42.65, -73.75], "Albuquerque, NM": [35.08, -106.65],
  "Ames, IA": [42.03, -93.62], "Amherst, MA": [42.37, -72.52], "Anchorage, AK": [61.22, -149.9],
  "Ann Arbor, MI": [42.28, -83.74], "Appleton, WI": [44.26, -88.41], "Ashland, OR": [42.19, -122.71],
  "Athens, GA": [33.96, -83.37], "Athens, OH": [39.33, -82.1], "Atlanta, GA": [33.75, -84.39],
  "Austin, TX": [30.27, -97.74], "Baltimore, MD": [39.29, -76.61], "Bellingham, WA": [48.75, -122.48],
  "Berkeley, CA": [37.87, -122.27], "Birmingham, AL": [33.52, -86.8], "Bloomington, IN": [39.17, -86.53],
  "Boise, ID": [43.62, -116.2], "Boone, NC": [36.22, -81.68], "Boston, MA": [42.36, -71.06],
  "Boulder, CO": [40.01, -105.27], "Bowling Green, KY": [36.99, -86.44], "Bozeman, MT": [45.68, -111.04],
  "Bridgeport, CT": [41.18, -73.19], "Bronx, NY": [40.84, -73.87], "Brunswick, ME": [43.91, -69.94],
  "Buffalo, NY": [42.89, -78.88], "Burlington, VT": [44.48, -73.21], "Cambridge, MA": [42.37, -71.11],
  "Camden, NJ": [39.93, -75.12], "Cedar Falls, IA": [42.53, -92.44], "Champaign, IL": [40.11, -88.24],
  "Charlottesville, VA": [38.03, -78.48], "Chattanooga, TN": [35.05, -85.31], "Chicago, IL": [41.88, -87.63],
  "Clemson, SC": [34.68, -82.84], "Cleveland, OH": [41.5, -81.69], "Colorado Springs, CO": [38.83, -104.82],
  "Columbia, MO": [38.95, -92.33], "Columbia, SC": [34.0, -81.03], "Corvallis, OR": [44.56, -123.26],
  "Dallas, TX": [32.78, -96.8], "Davis, CA": [38.55, -121.74], "DeKalb, IL": [41.93, -88.75],
  "Denton, TX": [33.21, -97.13], "Denver, CO": [39.74, -104.99], "Detroit, MI": [42.33, -83.05],
  "Duluth, MN": [46.79, -92.1], "Durango, CO": [37.28, -107.88], "Durham, NC": [36.0, -78.9],
  "Durham, NH": [43.13, -70.9], "Eau Claire, WI": [44.81, -91.5], "El Paso, TX": [31.76, -106.49],
  "Erie, PA": [42.13, -80.09], "Eugene, OR": [44.05, -123.09], "Evanston, IL": [42.05, -87.69],
  "Fayetteville, AR": [36.06, -94.16], "Fresno, CA": [36.74, -119.79], "Gainesville, FL": [29.65, -82.32],
  "Grand Forks, ND": [47.93, -97.13], "Grand Rapids, MI": [42.96, -85.66], "Green Bay, WI": [44.51, -88.01],
  "Greensboro, NC": [36.07, -79.79], "Greenville, SC": [34.85, -82.4], "Hanover, NH": [43.7, -72.29],
  "Harrisonburg, VA": [38.45, -78.87], "Hartford, CT": [41.76, -72.67], "Hattiesburg, MS": [31.33, -89.29],
  "Helena, MT": [46.59, -112.04], "Honolulu, HI": [21.31, -157.86], "Houston, TX": [29.76, -95.37],
  "Huntsville, AL": [34.73, -86.59], "Indianapolis, IN": [39.77, -86.16], "Iowa City, IA": [41.66, -91.53],
  "Irvine, CA": [33.68, -117.83], "Ithaca, NY": [42.44, -76.5], "Jackson, MS": [32.3, -90.18],
  "Jackson, WY": [43.48, -110.76], "Jacksonville, FL": [30.33, -81.66], "Jersey City, NJ": [40.73, -74.07],
  "Jonesboro, AR": [35.84, -90.65], "Kalamazoo, MI": [42.29, -85.59], "Kansas City, MO": [39.1, -94.58],
  "Keene, NH": [42.93, -72.29], "Knoxville, TN": [35.96, -83.92], "Lafayette, IN": [40.42, -86.89],
  "Lafayette, LA": [30.22, -92.02], "Lansing, MI": [42.73, -84.56], "Laramie, WY": [41.31, -105.59],
  "Las Cruces, NM": [32.32, -106.75], "Las Vegas, NV": [36.17, -115.14], "Lawrence, KS": [38.97, -95.24],
  "Lexington, KY": [38.04, -84.5], "Lincoln, NE": [40.81, -96.7], "Little Rock, AR": [34.75, -92.29],
  "Logan, UT": [41.74, -111.82], "Los Angeles, CA": [34.05, -118.24], "Louisville, KY": [38.25, -85.76],
  "Lowell, MA": [42.64, -71.32], "Macon, GA": [32.84, -83.65], "Madison, WI": [43.07, -89.4],
  "Manhattan, KS": [39.18, -96.57], "Mankato, MN": [44.16, -94.02], "Memphis, TN": [35.15, -90.05],
  "Miami, FL": [25.76, -80.19], "Middlebury, VT": [44.02, -73.16], "Middletown, CT": [41.56, -72.65],
  "Milwaukee, WI": [43.04, -87.91], "Minneapolis, MN": [44.98, -93.27], "Montclair, NJ": [40.83, -74.23],
  "Morgantown, WV": [39.63, -79.96], "Moscow, ID": [46.73, -117.0], "Nashville, TN": [36.16, -86.78],
  "New Brunswick, NJ": [40.49, -74.44], "New Haven, CT": [41.31, -72.92], "New Orleans, LA": [29.95, -90.07],
  "New York, NY": [40.71, -74.0], "Northampton, MA": [42.32, -72.63], "Northridge, CA": [34.2, -118.53],
  "Oakland, CA": [37.8, -122.27], "Ogden, UT": [41.22, -111.97], "Olympia, WA": [47.04, -122.9],
  "Omaha, NE": [41.26, -95.93], "Orlando, FL": [28.54, -81.38], "Oxford, MS": [34.37, -89.53],
  "Palo Alto, CA": [37.44, -122.14], "Philadelphia, PA": [39.95, -75.17], "Phoenix, AZ": [33.45, -112.07],
  "Pittsburgh, PA": [40.44, -79.98], "Portland, ME": [43.66, -70.26], "Portland, OR": [45.52, -122.68],
  "Providence, RI": [41.82, -71.41], "Pullman, WA": [46.73, -117.16], "Raleigh, NC": [35.78, -78.64],
  "Recife": null, "Richmond, VA": [37.54, -77.44], "Rochester, MN": [44.02, -92.47], "Rochester, NY": [43.16, -77.61],
  "Sacramento, CA": [38.58, -121.49], "Salt Lake City, UT": [40.76, -111.89], "San Antonio, TX": [29.42, -98.49],
  "San Diego, CA": [32.72, -117.16], "San Francisco, CA": [37.77, -122.42], "Santa Barbara, CA": [34.42, -119.7],
  "Santa Cruz, CA": [36.97, -122.03], "Santa Monica, CA": [34.02, -118.49], "Savannah, GA": [32.08, -81.09],
  "Seattle, WA": [47.61, -122.33], "Sioux Falls, SD": [43.55, -96.73], "South Bend, IN": [41.68, -86.25],
  "Spokane, WA": [47.66, -117.43], "Springfield, MA": [42.1, -72.59], "St. Louis, MO": [38.63, -90.2],
  "State College, PA": [40.79, -77.86], "Stillwater, OK": [36.12, -97.06], "Syracuse, NY": [43.05, -76.15],
  "Tacoma, WA": [47.25, -122.44], "Tallahassee, FL": [30.44, -84.28], "Tampa, FL": [27.95, -82.46],
  "Tempe, AZ": [33.4, -111.93], "Toledo, OH": [41.66, -83.55], "Tucson, AZ": [32.22, -110.97],
  "Tulsa, OK": [36.15, -95.99], "Urbana, IL": [40.11, -88.2], "Salt Palace": null,
  "Waco, TX": [31.55, -97.15], "Washington, DC": [38.9, -77.04], "Waterbury, CT": [41.56, -73.04],
  "Wichita, KS": [37.69, -97.34], "Williamsburg, VA": [37.27, -76.71], "Winston-Salem, NC": [36.1, -80.24],
};
const STATE_CAPITOLS = {
  AL: [32.38, -86.3], AK: [61.22, -149.9], AZ: [33.45, -112.07], AR: [34.75, -92.29], CA: [38.58, -121.49],
  CO: [39.74, -104.99], CT: [41.76, -72.67], DE: [39.16, -75.52], DC: [38.9, -77.04], FL: [30.44, -84.28],
  GA: [33.75, -84.39], HI: [21.31, -157.86], ID: [43.62, -116.2], IL: [39.8, -89.65], IN: [39.77, -86.16],
  IA: [41.66, -91.53], KS: [39.05, -95.68], KY: [38.2, -84.87], LA: [30.45, -91.19], ME: [44.32, -69.78],
  MD: [39.29, -76.61], MA: [42.36, -71.06], MI: [42.73, -84.56], MN: [44.98, -93.27], MS: [32.3, -90.18],
  MO: [38.58, -92.19], MT: [46.59, -112.04], NE: [40.81, -96.7], NV: [39.16, -119.75], NH: [43.2, -71.55],
  NJ: [40.22, -74.76], NM: [35.08, -106.65], NY: [42.65, -73.75], NC: [35.78, -78.64], ND: [47.0, -100.45],
  OH: [39.96, -83.0], OK: [35.47, -97.52], OR: [44.93, -123.03], PA: [40.27, -76.88], RI: [41.82, -71.41],
  SC: [34.0, -81.03], SD: [44.37, -100.35], TN: [36.16, -86.78], TX: [30.27, -97.74], UT: [40.76, -111.89],
  VT: [44.26, -72.58], VA: [37.54, -77.44], WA: [47.04, -122.9], WV: [38.35, -81.63], WI: [43.07, -89.4],
  WY: [42.76, -106.3],
};

function cityCoords(label, state) {
  const first = label.split("/")[0].trim().replace(/\s+(Southside|Towson|Sac|Pasquo|Coral Gables|Fort Worth|St Paul|NYC|Denver)$/i, "").trim();
  const key = `${first}, ${state}`;
  if (CITY_COORDS[key]) return { lat: CITY_COORDS[key][0], lon: CITY_COORDS[key][1], basis: "city" };
  // try state-only match on full label
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (v && k.startsWith(first + ",") && k.endsWith(state)) return { lat: v[0], lon: v[1], basis: "city" };
  }
  const cap = STATE_CAPITOLS[state];
  if (cap) return { lat: cap[0], lon: cap[1], basis: "state" };
  return { lat: 39.5, lon: -98.35, basis: "center" };
}

function parseStations() {
  const raw = read("Bonuses/Bonus-1-Hometown-Heat-Map-Database/Hometown-Heat-Map-300-Database.md");
  const stations = [];
  for (const line of raw.split("\n")) {
    const t = strip(line);
    if (!t.startsWith("|")) continue;
    const cells = t.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => strip(c));
    if (cells.length < 9 || !/^\d+$/.test(cells[0])) continue;
    const [id, dial, city, state, ring, format, gatekeeper, program, angle] = cells;
    const call = dial.split(/\s+/)[0];
    const freq = dial.replace(call, "").trim();
    const gk = gatekeeper.match(/^(.*?)\s*\(([^)]+)\)/);
    const coord = cityCoords(city, state);
    stations.push({
      id: Number(id),
      callsign: call.toUpperCase(),
      dial: freq,
      city: city.split("/")[0].trim(),
      cityLabel: city,
      state: state.toUpperCase(),
      ring: ring.replace(/\s/g, ""),
      format,
      gatekeeperRole: gk ? gk[1].trim() : gatekeeper,
      gatekeeperName: gk ? gk[2].trim() : "",
      program,
      angle,
      lat: coord.lat,
      lon: coord.lon,
      coordBasis: coord.basis,
    });
  }
  return stations;
}

/* ── Tools parsing ────────────────────────────────────────────────────── */

function parseSubjectLines() {
  const raw = read("Resources/Pitch-Weapons/30-Subject-Line-Formulas.md");
  const engines = [];
  let cur = null;
  for (const line of raw.split("\n")) {
    const t = strip(line);
    const h = t.match(/^##\s*ENGINE\s*(\d+)\s*[—-]\s*(.+)$/);
    if (h) { cur = { n: Number(h[1]), title: flattenMd(h[2]), formulas: [] }; engines.push(cur); continue; }
    const m = t.match(/^\d+\.\s+`(.+)`$/);
    if (m && cur) cur.formulas.push(strip(m[1]));
  }
  const rules = (raw.match(/Never[^\n.]*\.|never[^\n.]*\./gi) || []).slice(0, 6);
  return { engines, rules: [flattenMd(rules[0] || "Four engines. 4–7 words. One formula per send.")] };
}

function parsePitchVault() {
  const raw = read("Resources/Pitch-Weapons/90-Word-Pitch-Vault.md");
  const pitches = [];
  const parts = raw.split(/^## /m).slice(1);
  for (const p of parts) {
    const [head, ...rest] = p.split("\n");
    const body = rest.join("\n");
    const m = head.match(/^PITCH\s*(\d+)\s*[—-]\s*(.+)$/i);
    if (!m) continue;
    const subject = (body.match(/\*\*Subject:\*\*\s*`([^`]+)`/) || [])[1] || "";
    const wordNote = (body.match(/\*\((\d+)\s*words[^)]*\)/) || [])[1] || "";
    const text = body
      .replace(/\*\*Subject:\*\*[^\n]*/, "")
      .replace(/\*\(\d+\s*words[^)]*\)\.?\*?/g, "")
      .split(/^---$/m)[0]
      .trim();
    pitches.push({ n: Number(m[1]), title: flattenMd(m[2]).replace(/\s*\(.*\)\s*$/, "").trim(), subject, wordNote, body: text });
  }
  return pitches;
}

function parseFollowUps() {
  const raw = read("Resources/Follow-Up/3-Touch-Follow-Up-Sequences-and-Templates.md");
  const blocks = parseBlocks(raw);
  const cadence = [];
  for (const b of blocks) if (b.b === "table" && b.headers.some((h) => /Touch/i.test(h))) {
    for (const r of b.rows) cadence.push({ touch: Number(stripCells(r)[0]) || null, day: stripCells(r)[1], job: stripCells(r)[2], asset: stripCells(r)[3] });
  }
  const templates = [];
  const parts = raw.split(/^## /m).slice(1);
  for (const p of parts) {
    const [head, ...rest] = p.split("\n");
    const title = flattenMd(head).trim();
    const body = rest.join("\n").trim();
    if (/TOUCH/.test(title)) {
      const subject = (body.match(/\*\*Subject:\*\*\s*`([^`]+)`/) || [])[1] || "";
      templates.push({ title, subject, body: body.replace(/\*\*Subject:\*\*[^\n]*\n*/, "") });
    }
  }
  const replies = [];
  const rp = raw.split(/^### /m).slice(1);
  for (const p of rp) {
    const [head, ...rest] = p.split("\n");
    if (!/REPLY/i.test(head)) continue;
    replies.push({ title: flattenMd(head).replace(/\s*\(.*\)\s*$/, "").trim(), body: rest.join("\n").trim() });
  }
  return { cadence, templates, replies };
}
function stripCells(arr) {
  return arr.map((c) => (Array.isArray(c) ? spansToText(c) : String(c))).map((c) => flattenMd(c).replace(/\*\*/g, "").trim());
}

function parseAudioVault() {
  const raw = read("Bonuses/Bonus-2-90-Second-Audio-Script-Vault/90-Second-Radio-Ready-Audio-Script-Vault.md");
  const acts = [];
  const scripts = [];
  const parts = raw.split(/^## /m).slice(1);
  for (const p of parts) {
    const [head, ...rest] = p.split("\n");
    const title = flattenMd(head).trim();
    const body = rest.join("\n").trim();
    if (/5-ACT/.test(title)) acts.push(...(body.match(/^\d+\.\s+\*\*[^*]+\*\*[^\n]*/gm) || []).map((x) => flattenMd(x)));
    const m = title.match(/^SCRIPT\s*(\d+)\s*[—-]\s*(.+)$/i);
    if (m) {
      const when = (body.match(/\*\*Use when:\*\*\s*([^\n]+)/) || [])[1] || "";
      scripts.push({ n: Number(m[1]), title: flattenMd(m[2]).trim(), useWhen: flattenMd(when), script: body });
    }
  }
  return { acts: acts.slice(0, 8), scripts };
}

function parseAudit() {
  const raw = read("Resources/Audit/90-Day-Audit-Checklist.md");
  const parts = raw.split(/^## /m).slice(1);
  const out = [];
  for (const p of parts) {
    const [head, ...rest] = p.split("\n");
    const title = flattenMd(head).trim();
    const blocks = parseBlocks(rest.join("\n"));
    out.push({ title, blocks });
  }
  return out;
}

function parseEpk() {
  const raw = read("Bonuses/Bonus-3-EPK-Command-Deck/One-Page-EPK-Command-Deck.md");
  const blocks = parseBlocks(raw).filter((b) => !(b.b === "h" && b.level === 1));
  return { blocks };
}

function parseToolDoc(file) {
  return parseBlocks(read(file)).filter((b) => !(b.b === "h" && b.level === 1));
}

/* ── Ethics / compliance — distilled from the source package (Lesson 1.4
      oath, heat-map usage rules, follow-up exit rules) ─────────────────── */
const COMPLIANCE = {
  source: "Derived from Lesson 1.4 (No-Spam Oath), Heat-Map Directory Usage Rules, and the 3-Touch Follow-Up guide",
  principles: [
    "Three touches maximum per station per campaign. After touch three: silence, not a fourth email.",
    "Never BCC a market. Every send is addressed to a named human at one station.",
    "Verify the contact before sending; never invent a name, role, or claim of familiarity.",
    "A stop is permanent: honor opt-outs, 'remove me' replies, and different-instruction replies by suppressing the contact for this release cycle onward.",
    "Never attach heavy files cold; offer links and send assets only on request (keeps you off blacklist triggers).",
    "Numbers in pitches must be your own verifiable metrics — no invented streams, sold-out claims, or 'everyone is talking about' language.",
    "One play is a spin, not rotation. Report outcomes exactly as verified; never imply ongoing support from a single add.",
    "No payola, no disguised sponsorship, no undisclosed consideration for airplay — federal law (US 47 U.S.C. § 317) and basic respect.",
    "Give the station a story it can tell its own listeners; local context is the service you provide.",
    "Thank-you protocol is non-transactional: gratitude for adds/ints carries no ask attached.",
  ],
};

/* ── Assemble ─────────────────────────────────────────────────────────── */

const insider = parseInsiderEdge();
const decoder = parseDecoder();
const lessonsOut = {};
const outline = [];
for (const mod of MODULES) {
  const files = fs
    .readdirSync(path.join(SRC, mod.folder, "Lessons"))
    .filter((f) => f.endsWith(".md"))
    .sort();
  const outlineLessons = [];
  for (const f of files) {
    const codeM = f.match(/Lesson-(\d\.\d)/);
    if (!codeM) continue;
    const code = codeM[1];
    const [mnum, lnum] = code.split(".").map(Number);
    const id = `m${mnum}l${lnum}`;
    const parsed = parseLesson(`${mod.folder}/Lessons/${f}`, code);
    parsed.id = id;
    parsed.moduleId = mod.id;
    parsed.decoderNotes = insider[code] || [];
    parsed.toolLinks = MODULE_TOOLS[mod.id] || [];
    lessonsOut[id] = parsed;
    outlineLessons.push({ id, code: parsed.code, title: parsed.title, minutes: parsed.minutes, truth: parsed.truth });
  }
  outline.push({ id: mod.id, n: mod.n, title: mod.title, promise: mod.promise, tools: MODULE_TOOLS[mod.id] || [], lessons: outlineLessons });
}

const tools = {
  subjectLines: parseSubjectLines(),
  pitchVault: parsePitchVault(),
  followUps: parseFollowUps(),
  audioVault: parseAudioVault(),
  audit: parseAudit(),
  epk: parseEpk(),
  compliance: COMPLIANCE,
  decoder: decoder.map((d) => ({ n: d.n, title: d.title, blocks: d.blocks })),
  playbooks: parsePlaybooks(),
  releaseCalendar: parseToolDoc("Resources/Calendars/Quarterly-Release-Calendar.md"),
  relationship: parseToolDoc("Resources/Relationships/Relationship-Compounding-Playbook.md"),
  arsenal: parseToolDoc("Bonuses/Bonus-5-Resources/Master-Resource-Arsenal.md"),
  courseOverview: parseToolDoc("Course-Overview.md"),
  heatMapRules: (() => {
    const raw = read("Bonuses/Bonus-1-Hometown-Heat-Map-Database/Hometown-Heat-Map-300-Database.md");
    const idx = raw.indexOf("### Directory Usage Rules:");
    return raw
      .slice(idx, raw.indexOf("---", idx))
      .split("\n")
      .map((l) => flattenMd(strip(l).replace(/^\d+\.\s*/, "").replace(/^\*\*|\*\*$/g, "")))
      .filter((l) => l && !l.startsWith("#") && !l.includes("Directory Usage Rules"));
  })(),
};

const stations = parseStations();
const calendar = parseCalendar();

fs.writeFileSync(path.join(OUT, "outline.json"), JSON.stringify({ product: "frequency_dominion", title: "Frequency Dominion", subtitle: "The 24-Lesson Independent Radio Campaign System", modules: outline }, null, 1));
fs.copyFileSync(path.join(OUT, "outline.json"), path.join(ROOT, "src", "fd", "data", "outline.json"));
fs.writeFileSync(path.join(OUT, "lesson-bodies.json"), JSON.stringify(lessonsOut, null, 1));
fs.writeFileSync(path.join(OUT, "stations.json"), JSON.stringify(stations));
fs.writeFileSync(path.join(OUT, "task-templates.json"), JSON.stringify(calendar));
fs.writeFileSync(path.join(OUT, "tools.json"), JSON.stringify(tools, null, 1));

console.log(`FD content build: ${Object.keys(lessonsOut).length} lessons, ${stations.length} stations, ${calendar.tasks.length} day-tasks`);
