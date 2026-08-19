// Automated claim-consistency checks.
//
//   node scripts/check-claims.mjs          # report, exit 1 on ERROR
//   node scripts/check-claims.mjs --warn   # report, always exit 0
//
// Scans source and generated output for claims that contradict each other or
// contradict the entity source of truth. This is a guardrail, not a linter:
// every rule here maps to something a retrieval system could quote back at a
// customer, or to a claim that would be indefensible in an FTC complaint.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENTITY } from "./resources/entity.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const WARN_ONLY = process.argv.includes("--warn");

const errors = [];
const warnings = [];
const notes = [];

const err = (rule, file, msg) => errors.push({ rule, file, msg });
const warn = (rule, file, msg) => warnings.push({ rule, file, msg });
const note = (rule, file, msg) => notes.push({ rule, file, msg });

// ---------------------------------------------------------------------------
// Collect files.
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", ".wrangler", ".arena", "coverage", "build",
]);

function walk(dir, exts, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(path.join(dir, e.name), exts, out);
    } else if (exts.some((x) => e.name.endsWith(x))) {
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

const sourceFiles = [
  ...walk(path.join(ROOT, "src"), [".ts", ".tsx"]),
  ...walk(path.join(ROOT, "scripts"), [".mjs"]),
  path.join(ROOT, "index.html"),
].filter((f) => fs.existsSync(f));

const publicFiles = fs.existsSync(path.join(ROOT, "public"))
  ? walk(path.join(ROOT, "public"), [".html", ".txt", ".json", ".xml", ".md"])
  : [];

const allFiles = [...sourceFiles, ...publicFiles];
const rel = (f) => path.relative(ROOT, f);
const read = (f) => fs.readFileSync(f, "utf8");

// Content files only — the entity JSON and this checker legitimately contain
// the strings they police.
const SELF = new Set([
  "src/data/radioreach-entity.json",
  "scripts/check-claims.mjs",
  "scripts/resources/entity.mjs",
  "docs/claim-register.md",
]);
const contentFiles = allFiles.filter((f) => !SELF.has(rel(f)));

// ---------------------------------------------------------------------------
// 1. Conflicting contact counts.
// ---------------------------------------------------------------------------

const stated = ENTITY.deliverables.core.recordCountAsAdvertised.replace(/[^\d]/g, "");
const countRe = /\b(\d{1,3},\d{3}|\d{4,6})\s*\+?\s*(?=(?:radio[- ])?(?:station[- ])?(?:contacts?|entries|rows|records|listings))/gi;

// Counts that belong to a *different* declared product (e.g. the Australian
// add-on) are legitimate and must not be compared against the core count.
const otherProductCounts = new Set(
  (ENTITY.deliverables.addOns ?? [])
    .map((a) => a.recordCountAsAdvertised)
    .filter(Boolean)
    .map((s) => String(s).replace(/[^\d]/g, ""))
);

const seenCounts = new Map();
for (const f of contentFiles) {
  const text = read(f);
  for (const m of text.matchAll(countRe)) {
    const n = m[1].replace(/,/g, "");
    // Subset counts ("1,900 of the 4,812 curator contacts") describe a slice,
    // not the whole product.
    const ctx = text.slice(Math.max(0, m.index - 40), m.index + 60);
    if (/\bof (?:the )?[\d,]+\b/i.test(ctx)) continue;
    if (!seenCounts.has(n)) seenCounts.set(n, new Set());
    seenCounts.get(n).add(rel(f));
  }
}
// The font bundle upsell legitimately says "20,000 fonts" — only flag numbers
// attached to contact nouns, which the regex already scopes.
for (const [n, files] of seenCounts) {
  if (otherProductCounts.has(n)) continue;
  if (n !== stated) {
    err(
      "contact-count",
      [...files].join(", "),
      `Contact count "${Number(n).toLocaleString()}" conflicts with the entity source of truth (${ENTITY.deliverables.core.recordCountAsAdvertised}).`
    );
  }
}
if (seenCounts.size === 0) {
  note("contact-count", "-", "No contact-count claims found in content files.");
}

// ---------------------------------------------------------------------------
// 2. Conflicting prices for the core product.
// ---------------------------------------------------------------------------

const corePrice = ENTITY.pricing.corePrice;
const compareAt = ENTITY.pricing.coreCompareAt;
const knownPrices = new Set(
  [
    corePrice,
    compareAt,
    ...ENTITY.pricing.addOnPrices.flatMap((a) => [a.price, a.compareAt].filter(Boolean)),
  ].map(Number)
);
// Prices that appear in funnel copy for bundles/tips are allowed via prices.ts.
const allowedExtra = new Set([3.95, 18, 50, 2000, 822, 54, 21, 25, 29, 37, 12, 9, 0]);

for (const f of contentFiles) {
  if (!/\.(tsx?|html)$/.test(f)) continue;
  const text = read(f);
  for (const m of text.matchAll(/\$(\d+(?:\.\d{2})?)\b/g)) {
    const v = Number(m[1]);
    if (knownPrices.has(v) || allowedExtra.has(v)) continue;
    // Value-stack line items and "$300–$500/year" comparisons are separately
    // flagged as unverified claims below; don't double-report them here.
    if ([297, 149, 97, 79, 120, 742, 300, 500].includes(v)) continue;
    warn(
      "price-drift",
      rel(f),
      `Price "$${m[1]}" is not in the entity pricing block. Confirm it is intentional.`
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Product / organisation naming.
// ---------------------------------------------------------------------------

for (const f of contentFiles) {
  const text = read(f);
  if (/©\s*\{?[^}]*\}?\s*Radio Reach Vault/.test(text) || /Radio Reach Vault\.\s*All rights reserved/.test(text)) {
    err(
      "org-vs-product-name",
      rel(f),
      `Copyright line uses the product name "Radio Reach Vault" as the organisation name. The organisation is "${ENTITY.name}".`
    );
  }
  for (const m of text.matchAll(/\bRadioReach Vault\b|\bRadio-Reach\b/g)) {
    warn(
      "product-name",
      rel(f),
      `Product-name variant "${m[0]}" — canonical is "${ENTITY.deliverables.core.productName}" (org is "${ENTITY.name}").`
    );
  }
}

// ---------------------------------------------------------------------------
// 4. Unsupported verification language.
// ---------------------------------------------------------------------------

const verificationAllowed = ENTITY.deliverables.core.recordCountVerified === true;
const VERIFY_RE = /\b(individually verified|verified deliverable|verified emails?|verified buyer|verified \d+ of \d+|fully verified|hand[- ]verified|\d[\d,]*\+?\s*verified)\b/gi;

// A claim checker has to tell an *assertion* apart from a *disclosure*. Our
// corrections log and methodology page quote banned phrasing precisely in order
// to say "we used to claim this and it was wrong" — flagging those would
// punish the transparency we want. Treat a match as disclosure when the
// surrounding text is retracting, defining, or prohibiting the phrase.
const DISCLOSURE_RE =
  /\b(removed?|remov(?:ing|al)|no longer|used to|previously|was wrong|corrected?|correction|retract\w*|we do not|we don't|never use|not a synonym|reserved for|prohibited|banned|avoid(?:ed)?|instead of|replaced? with|rather than|claimed?|implied)\b/i;

// Quoting the phrase is itself a signal of mention-not-use, but only in
// combination with disclosure language — quotes alone are how marketing copy
// emphasises a claim.
const isDisclosure = (text, index, matchLength) => {
  const ctx = text.slice(
    Math.max(0, index - 260),
    index + matchLength + 260
  );
  return DISCLOSURE_RE.test(ctx);
};

for (const f of contentFiles) {
  const text = read(f);
  for (const m of text.matchAll(VERIFY_RE)) {
    if (verificationAllowed) {
      note("verification-language", rel(f), `"${m[0].trim()}" — permitted (recordCountVerified is true).`);
      continue;
    }
    if (isDisclosure(text, m.index, m[0].length)) {
      note(
        "verification-language",
        rel(f),
        `"${m[0].trim()}" — allowed: appears in a retraction/definition context, not as a claim.`
      );
      continue;
    }
    err(
      "verification-language",
      rel(f),
      `"${m[0].trim()}" claims verification, but no verification methodology exists (entity recordCountVerified=false). Remove, or document the method and set the flag.`
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Contradictory refund language.
// ---------------------------------------------------------------------------

const refundWindow = ENTITY.pricing.refundPolicy.windowDays;
const refundClaims = [];
for (const f of contentFiles) {
  const text = read(f);
  for (const m of text.matchAll(/\b(\d{1,3})[- ]day (?:money[- ]back )?(?:refund|guarantee)\b/gi)) {
    refundClaims.push({ file: rel(f), days: Number(m[1]) });
  }
  if (/all sales are (?:generally )?final/i.test(text)) {
    refundClaims.push({ file: rel(f), days: 0, final: true });
  }
}
const distinctWindows = new Set(refundClaims.map((c) => c.days));
if (distinctWindows.size > 1) {
  err(
    "refund-contradiction",
    [...new Set(refundClaims.map((c) => c.file))].join(", "),
    `Conflicting refund terms across the site: ${refundClaims
      .map((c) => (c.final ? `${c.file}="all sales final"` : `${c.file}=${c.days}-day`))
      .join("; ")}. The entity source of truth says ${refundWindow} days.`
  );
}
if (ENTITY.pricing.refundPolicy.termsPageAligned === false) {
  err(
    "refund-contradiction",
    "public/terms/index.html",
    `entity.pricing.refundPolicy.termsPageAligned is false: /terms/ does not yet state the ${refundWindow}-day refund promised in the funnel copy.`
  );
}

// ---------------------------------------------------------------------------
// 6. Guaranteed-airplay claims.
// ---------------------------------------------------------------------------

const AIRPLAY_RE = /\b(guarantee[ds]?\s+(?:you\s+)?(?:radio\s+)?(?:airplay|spins|adds|rotation|exposure)|guaranteed\s+(?:airplay|spins|placement|exposure)|instant\s+airplay|we\s+guarantee\s+(?:you'?ll|you\s+will)\s+(?:get\s+)?play)/gi;
for (const f of contentFiles) {
  const text = read(f);
  for (const m of text.matchAll(AIRPLAY_RE)) {
    // Widen the window: an interrogative ("Does RadioReach guarantee
    // airplay?") is answered by a denial that can sit beyond 120 chars,
    // especially in JSON-LD where the answer is a separate property.
    const ctx = text.slice(Math.max(0, m.index - 200), m.index + 320);
    // Negations and disclaimers are the correct usage.
    if (
      /\b(no|not|never|cannot|can't|doesn't|does not|nothing|won't|will not|suspicion|red flag|beware|wary|distrust|cannot deliver|impossible|any service|snake oil|claims to)\b/i.test(
        ctx
      )
    ) {
      continue;
    }
    err("guaranteed-airplay", rel(f), `Possible airplay guarantee: "${m[0].trim()}"`);
  }
}

// ---------------------------------------------------------------------------
// 7. Superlative / hype language.
// ---------------------------------------------------------------------------

const HYPE_RE = /\b(revolutionary|industry secret|the number[- ]one|#1 (?:radio|promotion|music)|world'?s best|guaranteed radio exposure|instant airplay)\b/gi;
for (const f of contentFiles) {
  for (const m of read(f).matchAll(HYPE_RE)) {
    warn("hype-language", rel(f), `Vague marketing language: "${m[0].trim()}"`);
  }
}

// ---------------------------------------------------------------------------
// 8. Auto-current dates in user-visible "updated" positions.
// ---------------------------------------------------------------------------

for (const f of contentFiles) {
  const text = read(f);
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (!/new Date\(\)|Date\.now\(\)|toLocaleDateString|toISOString/.test(line)) return;
    if (/getFullYear\(\)/.test(line)) return; // copyright year is fine
    if (/updated|reviewed|lastmod|published|as of/i.test(line)) {
      err(
        "auto-date",
        `${rel(f)}:${i + 1}`,
        `Freshness date appears to be generated at build/run time: ${line.trim().slice(0, 110)}`
      );
    }
  });
}

// ---------------------------------------------------------------------------
// 9. Old / wrong URLs and dead internal links.
// ---------------------------------------------------------------------------

const publicDir = path.join(ROOT, "public");
function routeExists(href) {
  const clean = href.split("#")[0].split("?")[0];
  if (clean === "/" || clean === "") return true;
  const p = clean.replace(/^\//, "").replace(/\/$/, "");
  return (
    fs.existsSync(path.join(publicDir, p)) ||
    fs.existsSync(path.join(publicDir, `${p}.html`)) ||
    fs.existsSync(path.join(publicDir, p, "index.html"))
  );
}

for (const f of publicFiles.filter((x) => x.endsWith(".html"))) {
  const text = read(f);
  for (const m of text.matchAll(/href="(\/[^"#][^"]*)"/g)) {
    const href = m[1];
    if (href.startsWith("/api/") || href.startsWith("//")) continue;
    if (/\.(jpg|png|svg|ico|webp|css|js|xml|txt|json|pdf)$/.test(href)) continue;
    if (!routeExists(href)) {
      err("broken-internal-link", rel(f), `Link to "${href}" has no matching file in public/.`);
    }
  }
}

for (const f of contentFiles) {
  const text = read(f);
  for (const m of text.matchAll(/https?:\/\/(?:www\.)?radioreach\.(?!us)[a-z.]+/gi)) {
    err("old-url", rel(f), `Non-canonical domain reference: ${m[0]}`);
  }
  for (const m of text.matchAll(/http:\/\/radioreach\.us/gi)) {
    err("old-url", rel(f), `Insecure http:// reference to the canonical domain: ${m[0]}`);
  }
}

// ---------------------------------------------------------------------------
// 10. Schema vs visible content.
// ---------------------------------------------------------------------------

for (const f of publicFiles.filter((x) => x.endsWith(".html"))) {
  const text = read(f);
  const blocks = [...text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const visible = text
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ");

  for (const b of blocks) {
    let data;
    try {
      data = JSON.parse(b[1]);
    } catch {
      err("schema-invalid", rel(f), "JSON-LD block does not parse.");
      continue;
    }
    const json = JSON.stringify(data);

    if (/"aggregateRating"|"reviewCount"|"ratingValue"/.test(json)) {
      err("schema-rating", rel(f), "aggregateRating/Review markup present — prohibited (no first-party review record set).");
    }
    if (/"award"/.test(json)) {
      err("schema-award", rel(f), "Award markup present — prohibited.");
    }
    // FAQ answers must exist in the visible text.
    const walkNode = (n) => {
      if (Array.isArray(n)) return n.forEach(walkNode);
      if (!n || typeof n !== "object") return;
      if (n["@type"] === "Question" && n.acceptedAnswer?.text) {
        const probe = String(n.acceptedAnswer.text)
          .replace(/<[^>]+>/g, "")
          .split(/\s+/)
          .slice(0, 6)
          .join(" ");
        if (probe.length > 12 && !visible.includes(probe)) {
          err(
            "schema-mismatch",
            rel(f),
            `FAQ answer in schema is not present in visible text: "${probe}…"`
          );
        }
      }
      if (n["@type"] === "Offer" && n.price != null) {
        const p = String(n.price).replace(/\.00$/, "");
        if (!visible.includes(`$${p}`)) {
          err("schema-mismatch", rel(f), `Offer price $${p} in schema is not visible on the page.`);
        }
      }
      Object.values(n).forEach(walkNode);
    };
    walkNode(data);
  }
}

// ---------------------------------------------------------------------------
// 11. Pending owner verification — surface as warnings so they stay visible.
// ---------------------------------------------------------------------------

for (const item of ENTITY.pendingOwnerVerification ?? []) {
  if (item.status === "verified") continue;
  warn(
    `pending:${item.id}`,
    item.appearsIn.slice(0, 3).join(", ") + (item.appearsIn.length > 3 ? ", …" : ""),
    `${item.status.toUpperCase()}: ${item.claim} — needs: ${item.evidenceNeeded}`
  );
}

// ---------------------------------------------------------------------------
// 12. Entity completeness.
// ---------------------------------------------------------------------------

if (!ENTITY.support?.email) {
  warn("entity-gap", "src/data/radioreach-entity.json", "No support email. Refund and correction policies promise a contact route that does not exist publicly.");
}
if (!ENTITY.founder?.name) {
  warn("entity-gap", "src/data/radioreach-entity.json", "No named founder/editorial owner. /about/ ships with org-level attribution only and no Person node.");
}
if (!ENTITY.socialProfiles?.length) {
  note("entity-gap", "src/data/radioreach-entity.json", "socialProfiles is empty, so no sameAs is emitted. Correct until real profiles exist.");
}
{
  const d = new Date(ENTITY.lastReviewed);
  const ageDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (ageDays > 120) {
    warn("stale-review", "src/data/radioreach-entity.json", `lastReviewed is ${ageDays} days old.`);
  }
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------

const fmt = (list, label, sym) => {
  if (!list.length) return "";
  const byRule = new Map();
  for (const it of list) {
    if (!byRule.has(it.rule)) byRule.set(it.rule, []);
    byRule.get(it.rule).push(it);
  }
  let out = `\n${sym} ${label} (${list.length})\n`;
  for (const [rule, items] of byRule) {
    out += `\n  [${rule}]\n`;
    for (const it of items.slice(0, 12)) {
      out += `    ${it.file}\n      ${it.msg}\n`;
    }
    if (items.length > 12) out += `    … and ${items.length - 12} more\n`;
  }
  return out;
};

console.log("RadioReach claim consistency check");
console.log("=".repeat(60));
console.log(`Scanned ${contentFiles.length} files against src/data/radioreach-entity.json`);
process.stdout.write(fmt(errors, "ERRORS", "✗"));
process.stdout.write(fmt(warnings, "WARNINGS", "!"));
if (process.env.CLAIMS_VERBOSE) process.stdout.write(fmt(notes, "NOTES", "·"));
console.log(
  `\n${"=".repeat(60)}\n${errors.length} error(s), ${warnings.length} warning(s), ${notes.length} note(s)`
);

if (errors.length && !WARN_ONLY) {
  console.log("\nFailing: resolve the errors above or run with --warn to bypass.");
  process.exit(1);
}
