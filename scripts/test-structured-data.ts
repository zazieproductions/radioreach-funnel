import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PRODUCTS, STORE_COPY } from "../src/config/storefront.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
// Also check the deployed artifact with RADIOREACH_HTML_PATH=dist/index.html.
const htmlPath = path.resolve(root, process.env.RADIOREACH_HTML_PATH ?? "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
const documents = blocks.map((match) => JSON.parse(match[1]));
const nodes = documents.flatMap((document) => document["@graph"] ?? [document]);
const products = nodes.filter((node) => node["@type"] === "Product");
const canonical = `https://${STORE_COPY.domain}/`;

function product() {
  assert.equal(products.length, 1, "The homepage should describe one primary Product");
  return products[0];
}

test("homepage contains parseable schema.org JSON-LD", () => {
  assert.ok(documents.length > 0, "Missing JSON-LD in initial HTML");
  for (const document of documents) {
    assert.equal(document["@context"], "https://schema.org");
  }
});

test("Product has a name and a qualifying offer without requiring optional reviews", () => {
  const vault = product();
  assert.equal(vault.name, PRODUCTS.vault_core.shortName);
  assert.equal(vault.offers["@type"], "Offer");
  // Google accepts offers OR review OR aggregateRating. An offer-only Product
  // can receive non-critical warnings; don't invent ratings to suppress them.
  assert.ok(vault.offers, "Product snippet eligibility requires an offer or rating/review");
});

test("structured offer and social price agree with the storefront", () => {
  const offer = product().offers;
  assert.equal(Number(offer.price), PRODUCTS.vault_core.price);
  assert.equal(offer.priceCurrency, STORE_COPY.currency);
  assert.equal(offer.availability, "https://schema.org/InStock");
  assert.match(html, new RegExp(`<meta\\s+property="product:price:amount"\\s+content="${PRODUCTS.vault_core.price.toFixed(2).replace(".", "\\.")}"\\s*/?>`));
  assert.match(html, new RegExp(`<meta\\s+property="product:price:currency"\\s+content="${STORE_COPY.currency}"\\s*/?>`));
});

test("Product and offer URLs use the canonical production homepage", () => {
  const vault = product();
  assert.equal(vault.url, canonical);
  assert.equal(vault.offers.url, canonical);
  assert.match(html, /<link\s+rel="canonical"\s+href="https:\/\/radioreach\.us\/"\s*\/?>/);
  const image = new URL(vault.image);
  assert.equal(image.origin, new URL(canonical).origin);
  assert.ok(fs.existsSync(path.join(root, "public", image.pathname)), "Product image must exist");
});

test("brand, seller and publisher references resolve to the Organization", () => {
  const organization = nodes.find((node) => node["@type"] === "Organization");
  const website = nodes.find((node) => node["@type"] === "WebSite");
  assert.ok(organization);
  assert.ok(website);
  assert.equal(organization.url, canonical);
  assert.equal(product().brand["@id"], organization["@id"]);
  assert.equal(product().offers.seller["@id"], organization["@id"]);
  assert.equal(website.publisher["@id"], organization["@id"]);
});
