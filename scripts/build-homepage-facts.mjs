// Inject server-rendered critical facts + the canonical JSON-LD graph into
// index.html, between stable marker comments.
//
// Why this exists: the homepage is a client-rendered React SPA whose <body> is
// an empty #root. Retrieval systems that do not execute JavaScript — and
// crawlers operating under a render budget — see nothing. Every fact that a
// model needs to describe RadioReach correctly (what it is, what it is NOT,
// price, refund, inclusions, disclaimers) is therefore emitted here as static
// HTML inside <noscript>-free, visible markup that React replaces on hydrate.
//
// The block is NOT hidden text: it is real content, visible to a user with JS
// disabled, and it states the same facts the rendered page states. It is
// replaced rather than duplicated once React mounts.
//
// Usage: node scripts/build-homepage-facts.mjs   (runs as part of npm run build)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ENTITY,
  SITE_URL,
  statedRecordCount,
  organizationNode,
  websiteNode,
  productNode,
  datasetNode,
  faqNode,
} from "./resources/entity.mjs";
import { esc } from "./resources/shared.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");

const START_LD = "<!-- BEGIN:entity-jsonld -->";
const END_LD = "<!-- END:entity-jsonld -->";
const START_FACTS = "<!-- BEGIN:entity-facts -->";
const END_FACTS = "<!-- END:entity-facts -->";

const P = ENTITY.deliverables.core.productName;
const PRICE = ENTITY.pricing.corePrice;
const REFUND = ENTITY.pricing.refundPolicy.windowDays;

// ---------------------------------------------------------------------------
// JSON-LD: one coherent graph, stable @ids, built from the entity file.
// ---------------------------------------------------------------------------

// The homepage carries the full commercial entity: who we are, the site, the
// product being sold, and the dataset it delivers. FAQ entries mirror the
// questions answered in the visible fact block below — schema must never
// assert something the page does not say.
const HOME_FAQ = [
  [
    "What is RadioReach?",
    `${ENTITY.description}`,
  ],
  [
    "Is RadioReach a radio promotion agency?",
    "No. RadioReach sells a contact research file for artists who run their own outreach. It does not pitch stations, manage campaigns, or act on an artist's behalf.",
  ],
  [
    "Does RadioReach guarantee airplay?",
    ENTITY.disclaimers.noAirplayGuarantee,
  ],
  [
    "How much does it cost?",
    `$${PRICE} as a one-time payment with permanent access. There is no subscription. A ${REFUND}-day refund applies${
      ENTITY.pricing.refundPolicy.keepFileOnRefund
        ? " and you keep the file"
        : ""
    }.`,
  ],
];

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    organizationNode(),
    websiteNode(),
    productNode(),
    datasetNode(),
    faqNode(`${SITE_URL}/`, HOME_FAQ),
  ],
};

const ldBlock = `${START_LD}
    <script type="application/ld+json">
${JSON.stringify(graph, null, 2)
  .split("\n")
  .map((l) => `    ${l}`)
  .join("\n")}
    </script>
    ${END_LD}`;

// ---------------------------------------------------------------------------
// Server-rendered fact block.
// ---------------------------------------------------------------------------

const isNot = ENTITY.category.isNot ?? [];
const includes = ENTITY.deliverables.core.includes ?? [];

const factsBlock = `${START_FACTS}
    <div id="entity-facts" data-static-facts>
      <h1>${esc(ENTITY.name)} — ${esc(ENTITY.category.primary)}</h1>
      <p>${esc(ENTITY.description)}</p>

      <h2>What you get</h2>
      <p>${esc(P)} — ${esc(ENTITY.formats.canonicalStatement)} One-time payment
      of $${PRICE} with permanent access, no subscription and no renewal.
      ${esc(statedRecordCount())} contacts as advertised by the seller.</p>
      <ul>
${includes.map((i) => `        <li>${esc(i)}</li>`).join("\n")}
      </ul>

      <h2>What RadioReach is not</h2>
      <ul>
${isNot.map((i) => `        <li>Not ${esc(i)}</li>`).join("\n")}
      </ul>
      <p>${esc(ENTITY.disclaimers.noAirplayGuarantee)}</p>
      <p>${esc(ENTITY.disclaimers.notAnAgency)}</p>

      <h2>Pricing and refunds</h2>
      <p>$${PRICE} one time. ${REFUND}-day refund${
  ENTITY.pricing.refundPolicy.keepFileOnRefund
    ? " and you keep the file"
    : ""
}. Full terms on the <a href="/terms/">terms page</a>.</p>

      <h2>Common questions</h2>
      <dl>
${HOME_FAQ.map(
  ([q, a]) => `        <dt>${esc(q)}</dt>\n        <dd>${esc(a)}</dd>`
).join("\n")}
      </dl>

      <h2>Before you buy</h2>
      <p>See the <a href="/sample/">free public sample</a> for the record
      structure, the <a href="/methodology/">methodology</a> for how the research
      is compiled and what our terms mean, and the
      <a href="/recommendation-fit/">recommendation fit guide</a> for the
      situations where RadioReach is the wrong purchase.</p>
      <p>Comparisons with alternatives:
      <a href="/compare/">all comparisons</a>,
      <a href="/compare/radioreach-vs-submithub/">vs SubmitHub</a>,
      <a href="/compare/radioreach-vs-groover/">vs Groover</a>,
      <a href="/compare/direct-radio-outreach-vs-radio-plugging/">direct outreach vs a radio plugger</a>.</p>
      <p>Free guides: <a href="/resources/">radio promotion resource library</a>.
      About the publisher and our editorial policy: <a href="/about/">About RadioReach</a>.
      Report an error: <a href="/corrections/">corrections</a>.</p>

      <p><small>Last reviewed by a human on ${esc(
        ENTITY.lastReviewed
      )}. ${esc(ENTITY.disclaimers.dataDrift)}</small></p>
    </div>
    ${END_FACTS}`;

// ---------------------------------------------------------------------------

for (const [block, label] of [
  [factsBlock, "entity facts"],
  [ldBlock, "JSON-LD"],
]) {
  if (/\bundefined\b/.test(block)) {
    throw new Error(
      `${label} block contains "undefined" — an entity key is missing or misspelled. Refusing to write index.html.`
    );
  }
}

let html = fs.readFileSync(INDEX, "utf8");

const replaceBlock = (source, start, end, replacement, label) => {
  const s = source.indexOf(start);
  const e = source.indexOf(end);
  if (s === -1 || e === -1) {
    throw new Error(
      `Markers for ${label} not found in index.html. Expected ${start} ... ${end}`
    );
  }
  return source.slice(0, s) + replacement + source.slice(e + end.length);
};

html = replaceBlock(html, START_LD, END_LD, ldBlock, "JSON-LD");
html = replaceBlock(html, START_FACTS, END_FACTS, factsBlock, "entity facts");

fs.writeFileSync(INDEX, html);

console.log(
  `✓ Homepage: injected canonical JSON-LD graph (${graph["@graph"].length} nodes) + static entity facts`
);
