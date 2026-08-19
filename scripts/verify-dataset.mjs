#!/usr/bin/env node
/**
 * verify-dataset.mjs — compute original evidence from the real product file.
 *
 * WHY THIS EXISTS
 * The site states "18,000+ contacts" and describes coverage, roles and email
 * availability. Right now those are seller-stated numbers: nothing in this
 * repository can confirm them, so they are carried as pendingOwnerVerification
 * items and the research pages are withheld from deployment.
 *
 * This script is the mechanism that turns them into measured facts. Point it
 * at the actual deliverable and it emits a reproducible evidence bundle:
 * denominators, exclusions, analysis date, and the exact command that produced
 * the numbers — the provenance a citing system needs.
 *
 * IT DOES NOT INVENT ANYTHING. If no dataset is present it exits non-zero and
 * says so. It must never be wired into `npm run build` in a way that lets
 * absent data silently become published statistics.
 *
 * USAGE
 *   node scripts/verify-dataset.mjs --input path/to/contacts.csv
 *   node scripts/verify-dataset.mjs --input data/vault.csv --write
 *
 *   --input <path>  CSV or TSV export of the contact file (required)
 *   --write         write evidence to src/data/dataset-evidence.json
 *   --json          print the evidence bundle as JSON only
 *
 * SUPPORTED INPUT
 * A delimited text export with a header row. Column names are matched loosely
 * (case/spacing/punctuation insensitive) against common variants, so
 * "Station Name", "station_name" and "STATION" all resolve.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const argv = process.argv.slice(2);
const arg = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const has = (flag) => argv.includes(flag);

const INPUT = arg("--input");
const WRITE = has("--write");
const JSON_ONLY = has("--json");

if (!INPUT) {
  console.error(
    `verify-dataset: no --input given.

This script computes published statistics from the real contact file. It
cannot run without one, and it will not estimate or fabricate figures.

  node scripts/verify-dataset.mjs --input path/to/contacts.csv

Until a dataset is supplied, every count on the site remains seller-stated
and the /research/ pages stay withheld from deployment.`
  );
  process.exit(2);
}

if (!fs.existsSync(INPUT)) {
  console.error(`verify-dataset: file not found: ${INPUT}`);
  process.exit(2);
}

// ---------------------------------------------------------------- parsing ---

/** Minimal RFC4180-ish parser: handles quoted fields, embedded commas/newlines. */
function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

const raw = fs.readFileSync(INPUT, "utf8");
const delimiter = (() => {
  const head = raw.slice(0, 5000);
  const tabs = (head.match(/\t/g) || []).length;
  const commas = (head.match(/,/g) || []).length;
  return tabs > commas ? "\t" : ",";
})();

const rows = parseDelimited(raw, delimiter);
if (rows.length < 2) {
  console.error("verify-dataset: file has no data rows after the header.");
  process.exit(2);
}

const header = rows[0].map((h) => h.trim());
const body = rows.slice(1);

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const findCol = (...candidates) => {
  for (const cand of candidates) {
    const idx = header.findIndex((h) => norm(h) === norm(cand));
    if (idx !== -1) return idx;
  }
  // fall back to substring match
  for (const cand of candidates) {
    const idx = header.findIndex((h) => norm(h).includes(norm(cand)));
    if (idx !== -1) return idx;
  }
  return -1;
};

const COL = {
  station: findCol("station", "stationname", "callsign", "call sign", "outlet"),
  city: findCol("city", "market", "town"),
  state: findCol("state", "province", "region", "st"),
  country: findCol("country", "nation"),
  role: findCol("role", "title", "position", "jobtitle", "contacttitle"),
  email: findCol("email", "emailaddress", "e-mail", "contactemail"),
  phone: findCol("phone", "telephone", "phonenumber", "tel"),
  type: findCol("type", "stationtype", "format", "category"),
  name: findCol("name", "contact", "contactname", "person"),
};

const cell = (r, idx) => (idx === -1 ? "" : (r[idx] ?? "").trim());

// ------------------------------------------------------------- exclusions ---

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const excluded = { blankRow: 0, noStation: 0, duplicateKey: 0 };
const seen = new Set();
const clean = [];

for (const r of body) {
  if (r.every((v) => !v || !v.trim())) {
    excluded.blankRow++;
    continue;
  }
  const station = cell(r, COL.station);
  if (!station) {
    excluded.noStation++;
    continue;
  }
  // Duplicate definition: same station + same email, or same station + same
  // person when no email exists. Recorded openly because the duplicate rule
  // materially changes the headline count.
  const key = [
    norm(station),
    norm(cell(r, COL.email) || cell(r, COL.name) || cell(r, COL.role)),
  ].join("|");
  if (seen.has(key)) {
    excluded.duplicateKey++;
    continue;
  }
  seen.add(key);
  clean.push(r);
}

// ------------------------------------------------------------- statistics ---

const tally = (fn) => {
  const m = new Map();
  for (const r of clean) {
    const v = fn(r);
    if (!v) continue;
    m.set(v, (m.get(v) || 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({
      value,
      count,
      pct: +((count / clean.length) * 100).toFixed(2),
    }));
};

const withEmail = clean.filter((r) => EMAIL_RE.test(cell(r, COL.email)));
const withPhone = clean.filter((r) => cell(r, COL.phone).replace(/\D/g, "").length >= 7);
const uniqueStations = new Set(clean.map((r) => norm(cell(r, COL.station)))).size;

// Role-normalisation: collapse obvious variants so the distribution is
// meaningful rather than a long tail of formatting differences.
const roleBucket = (rawRole) => {
  const v = rawRole.toLowerCase();
  if (!v) return "";
  if (/music\s*dir|^md$/.test(v)) return "Music Director";
  if (/program\s*dir|^pd$/.test(v)) return "Program Director";
  if (/general\s*manager|^gm$/.test(v)) return "General Manager";
  if (/station\s*manager/.test(v)) return "Station Manager";
  if (/host|dj|presenter/.test(v)) return "Host / DJ";
  if (/news/.test(v)) return "News";
  if (/promo|market/.test(v)) return "Promotions / Marketing";
  if (/produc/.test(v)) return "Producer";
  if (/general\s*(inbox|enquir|inquir)|^info$|^contact$/.test(v))
    return "General inbox (unattributed)";
  return rawRole.trim();
};

const evidence = {
  $schema: "radioreach/dataset-evidence@1",
  analysisDate: new Date().toISOString().slice(0, 10),
  source: {
    file: path.basename(INPUT),
    bytes: fs.statSync(INPUT).size,
    sha256: crypto.createHash("sha256").update(raw).digest("hex"),
    delimiter: delimiter === "\t" ? "tab" : "comma",
    columnsDetected: Object.fromEntries(
      Object.entries(COL)
        .filter(([, v]) => v !== -1)
        .map(([k, v]) => [k, header[v]])
    ),
    columnsMissing: Object.entries(COL)
      .filter(([, v]) => v === -1)
      .map(([k]) => k),
  },
  method: {
    script: "scripts/verify-dataset.mjs",
    command: `node scripts/verify-dataset.mjs --input ${path.basename(INPUT)}`,
    duplicateRule:
      "A row is a duplicate when the normalised station matches AND the normalised email matches; where no email exists, the contact name or role is used instead. Only the first occurrence is counted.",
    emailRule:
      "A row counts as having a direct email only when the email field matches a standard address pattern. Blank fields, web-form URLs and malformed values are not counted.",
    exclusionsApplied:
      "Blank rows, rows with no station, and duplicate rows as defined above.",
  },
  denominators: {
    rowsInFile: body.length,
    rowsAnalysed: clean.length,
    excluded,
  },
  headline: {
    contactRecords: clean.length,
    uniqueStations,
    contactsWithDirectEmail: withEmail.length,
    pctWithDirectEmail: +((withEmail.length / clean.length) * 100).toFixed(1),
    contactsWithPhone: withPhone.length,
    pctWithPhone: +((withPhone.length / clean.length) * 100).toFixed(1),
  },
  distributions: {
    byState: tally((r) => cell(r, COL.state)).slice(0, 60),
    byCountry: tally((r) => cell(r, COL.country)),
    byRole: tally((r) => roleBucket(cell(r, COL.role))).slice(0, 25),
    byStationType: tally((r) => cell(r, COL.type)).slice(0, 25),
    topCities: tally((r) => cell(r, COL.city)).slice(0, 30),
  },
  limitations: [
    "These figures describe the file as compiled, not the radio industry as a whole. The file is not a census of stations.",
    "Contact data decays: staff turnover, format changes and closures mean a share of rows will be stale on any given day.",
    "Presence of an email address is not evidence that the address was tested, monitored, or that a reply will follow.",
    "Counts depend on the duplicate rule stated above. A different rule yields a different total, which is why the rule is published with the number.",
  ],
};

// -------------------------------------------------------------- reporting ---

if (JSON_ONLY) {
  console.log(JSON.stringify(evidence, null, 2));
} else {
  const h = evidence.headline;
  const pct = (n) => `${n}%`;
  console.log(`
RadioReach dataset evidence — ${evidence.analysisDate}
${"=".repeat(60)}
Source file        ${evidence.source.file} (${evidence.source.bytes.toLocaleString()} bytes)
SHA-256            ${evidence.source.sha256.slice(0, 32)}…
Columns detected   ${Object.keys(evidence.source.columnsDetected).join(", ") || "none"}
Columns missing    ${evidence.source.columnsMissing.join(", ") || "none"}

DENOMINATORS
  Rows in file             ${evidence.denominators.rowsInFile.toLocaleString()}
  Rows analysed            ${evidence.denominators.rowsAnalysed.toLocaleString()}
  Excluded — blank         ${excluded.blankRow.toLocaleString()}
  Excluded — no station    ${excluded.noStation.toLocaleString()}
  Excluded — duplicate     ${excluded.duplicateKey.toLocaleString()}

HEADLINE
  Contact records          ${h.contactRecords.toLocaleString()}
  Unique stations          ${h.uniqueStations.toLocaleString()}
  With direct email        ${h.contactsWithDirectEmail.toLocaleString()} (${pct(h.pctWithDirectEmail)})
  With phone               ${h.contactsWithPhone.toLocaleString()} (${pct(h.pctWithPhone)})

TOP ROLES
${evidence.distributions.byRole
  .slice(0, 8)
  .map((r) => `  ${String(r.count).padStart(7)}  ${pct(r.pct).padStart(6)}  ${r.value}`)
  .join("\n") || "  (no role column detected)"}

TOP STATES
${evidence.distributions.byState
  .slice(0, 8)
  .map((r) => `  ${String(r.count).padStart(7)}  ${pct(r.pct).padStart(6)}  ${r.value}`)
  .join("\n") || "  (no state column detected)"}
`);

  // Cross-check the measured total against what the site currently claims.
  try {
    const entity = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/data/radioreach-entity.json"), "utf8")
    );
    const stated = entity?.deliverables?.core?.recordCountAsAdvertised ?? null;
    if (stated) {
      const statedNum = Number(String(stated).replace(/\D/g, ""));
      const delta = h.contactRecords - statedNum;
      const pctDelta = ((delta / statedNum) * 100).toFixed(1);
      console.log(`CROSS-CHECK AGAINST PUBLISHED CLAIM
  Site states              ${stated}
  Measured                 ${h.contactRecords.toLocaleString()}
  Difference               ${delta >= 0 ? "+" : ""}${delta.toLocaleString()} (${pctDelta}%)
  ${
    Math.abs(delta) / statedNum > 0.05
      ? "!! Measured count differs from the published claim by more than 5%.\n     Update the claim or explain the gap before publishing statistics."
      : "OK  Published claim is consistent with the measured file."
  }
`);
    }
  } catch {
    /* entity file optional for this cross-check */
  }
}

if (WRITE) {
  const out = path.join(ROOT, "src/data/dataset-evidence.json");
  fs.writeFileSync(out, JSON.stringify(evidence, null, 2) + "\n");
  console.log(`✓ Wrote ${path.relative(ROOT, out)}`);
  console.log(
    `  Research pages can now consume measured figures. Review them before publishing.`
  );

  // Fold the measured total back into the entity source of truth so every
  // generator, schema node and page reads one number. recordCountVerified
  // gates "verified" language sitewide and is only ever flipped here — by an
  // actual count of an actual file, never by hand.
  const entityPath = path.join(ROOT, "src/data/radioreach-entity.json");
  const entity = JSON.parse(fs.readFileSync(entityPath, "utf8"));
  entity.deliverables.core.recordCount = evidence.headline.contactRecords;
  entity.deliverables.core.recordCountVerified = true;
  entity.deliverables.core.recordCountMeasuredOn = evidence.analysisDate;
  entity.deliverables.core.recordCountMethod = evidence.method.command;
  entity.lastReviewed = evidence.analysisDate;
  fs.writeFileSync(entityPath, JSON.stringify(entity, null, 2) + "\n");
  console.log(`✓ Updated src/data/radioreach-entity.json`);
  console.log(
    `  recordCount=${evidence.headline.contactRecords}, recordCountVerified=true`
  );
  console.log(
    `  Re-run \`npm run build\` so pages and schema pick up the measured figure.`
  );
}
