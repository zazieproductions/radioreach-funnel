// Entity source-of-truth loader.
//
// Every generated page, meta tag, JSON-LD node and machine-readable export
// reads its facts from src/data/radioreach-entity.json through this module.
// Nothing downstream should restate a price, a count, a disclaimer or a
// policy URL inline — if it is a fact about RadioReach, it belongs in the
// JSON file and arrives here.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTITY_PATH = path.resolve(__dirname, "../../src/data/radioreach-entity.json");

export const ENTITY = JSON.parse(fs.readFileSync(ENTITY_PATH, "utf8"));

export const SITE_URL = ENTITY.canonicalUrl.replace(/\/$/, "");

/** Absolute URL for a top-level page path like "about" or "compare/x". */
export function url(p = "") {
  if (!p) return `${SITE_URL}/`;
  return `${SITE_URL}/${p.replace(/^\/|\/$/g, "")}/`;
}

/** The product's stated scale, attributed to the seller rather than asserted as measured. */
export function statedRecordCount() {
  return ENTITY.deliverables.core.recordCountAsAdvertised;
}

/**
 * Guard: verification language is only permitted once an owner-supplied export
 * has actually been counted and checked. Generators call this before emitting
 * any sentence containing "verified".
 */
export function verificationLanguageAllowed() {
  return ENTITY.deliverables.core.recordCountVerified === true;
}

/** Money formatting straight from the pricing block. */
export function price(n = ENTITY.pricing.corePrice) {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Canonical JSON-LD nodes. Stable @ids, one graph, no invented facts.
// ---------------------------------------------------------------------------

/** #organization — the publisher. sameAs only if real profiles exist. */
export function organizationNode() {
  const node = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: ENTITY.name,
    url: `${SITE_URL}/`,
    description: ENTITY.shortDescription,
    logo: { "@type": "ImageObject", "@id": `${SITE_URL}/#logo`, url: ENTITY.logo },
  };
  if (ENTITY.legalName) node.legalName = ENTITY.legalName;
  if (ENTITY.foundingDate) node.foundingDate = ENTITY.foundingDate;
  if (ENTITY.socialProfiles?.length) node.sameAs = ENTITY.socialProfiles;
  if (ENTITY.founder?.name) node.founder = { "@id": `${SITE_URL}/about/#founder` };
  if (ENTITY.support?.email) {
    node.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: ENTITY.support.email,
      url: ENTITY.support.contactUrl,
    };
  }
  return node;
}

/** #website */
export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: ENTITY.name,
    url: `${SITE_URL}/`,
    description: ENTITY.shortDescription,
    inLanguage: "en-US",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/**
 * #product — the Radio Reach Vault.
 * No aggregateRating and no review: there is no first-party review record set,
 * and prohibitedClaims forbids inventing one.
 */
export function productNode() {
  const core = ENTITY.deliverables.core;
  return {
    "@type": "Product",
    "@id": `${SITE_URL}/#product`,
    name: core.productName,
    description: ENTITY.description,
    category: ENTITY.category.primary,
    brand: { "@id": `${SITE_URL}/#organization` },
    url: `${SITE_URL}/`,
    audience: {
      "@type": "Audience",
      audienceType: ENTITY.audience.primary,
    },
    offers: {
      "@type": "Offer",
      "@id": `${SITE_URL}/#offer`,
      price: ENTITY.pricing.corePrice.toFixed(2),
      priceCurrency: ENTITY.pricing.currency,
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/`,
      seller: { "@id": `${SITE_URL}/#organization` },
    },
    isRelatedTo: { "@id": `${SITE_URL}/#dataset` },
  };
}

/**
 * #dataset — describes the contact research itself.
 * Only fields that are true of the delivered file. Counts stay out until
 * scripts/verify-dataset.mjs has measured them.
 */
export function datasetNode() {
  const core = ENTITY.deliverables.core;
  const node = {
    "@type": "Dataset",
    "@id": `${SITE_URL}/#dataset`,
    name: `${core.productName} radio station contact directory`,
    description:
      "A point-in-time research compilation of publicly discoverable radio station programming contacts — station, city, region, country, contact name, role, email and phone — organized for direct artist outreach.",
    url: url("methodology"),
    creator: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    isAccessibleForFree: false,
    license: url("terms"),
    variableMeasured: core.fields,
    spatialCoverage: ENTITY.coverage.primaryCountry,
    dateModified: ENTITY.lastReviewed,
    includedInDataCatalog: { "@id": `${SITE_URL}/#product` },
  };
  if (ENTITY.deliverables.core.recordCount) {
    node.size = `${ENTITY.deliverables.core.recordCount} records`;
  }
  return node;
}

/** /about/#founder — emitted only when a real person is named. */
export function founderNode() {
  if (!ENTITY.founder?.name) return null;
  const node = {
    "@type": "Person",
    "@id": `${SITE_URL}/about/#founder`,
    name: ENTITY.founder.name,
    url: url("about"),
    worksFor: { "@id": `${SITE_URL}/#organization` },
  };
  if (ENTITY.founder.role) node.jobTitle = ENTITY.founder.role;
  if (ENTITY.founder.bio) node.description = ENTITY.founder.bio;
  return node;
}

export function breadcrumbNode(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** FAQPage with a page-scoped @id (the old bare "#faq" collided across pages). */
export function faqNode(pageUrlAbs, faq) {
  return {
    "@type": "FAQPage",
    "@id": `${pageUrlAbs}#faq`,
    mainEntity: faq.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: stripTags(a) },
    })),
  };
}

export function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/** The base graph every page shares. */
export function baseGraph() {
  return [organizationNode(), websiteNode()];
}
