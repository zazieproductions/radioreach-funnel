// Production SEO regression checks using only Node built-ins.
// Run after build-resources; exits non-zero for crawl/indexing defects.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const PUBLIC = path.join(ROOT, "public");
const SITE = "https://radioreach.us";
const errors = [];
const warnings = [];
const sitemap = fs.readFileSync(path.join(PUBLIC, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (new Set(urls).size !== urls.length) errors.push("sitemap contains duplicate URLs");
if (!urls.includes(`${SITE}/`)) errors.push("homepage missing from sitemap");
if (!urls.includes(`${SITE}/resources/`)) errors.push("resource hub missing from sitemap");

function localFile(url) {
  const pathname = new URL(url).pathname;
  if (pathname === "/") return path.join(ROOT, "index.html");
  return path.join(PUBLIC, pathname, "index.html");
}

for (const url of urls) {
  const file = localFile(url);
  if (!fs.existsSync(file)) {
    errors.push(`${url}: no matching source HTML (${path.relative(ROOT, file)})`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i)?.[1];

  if (!title) errors.push(`${url}: missing title`);
  if (!description) errors.push(`${url}: missing meta description`);
  if (description && (description.length < 110 || description.length > 175))
    errors.push(`${url}: description is ${description.length} characters`);
  if (canonical !== url) errors.push(`${url}: canonical is '${canonical ?? "missing"}'`);
  if (!robots?.includes("index") || !robots?.includes("follow"))
    errors.push(`${url}: missing index,follow directive`);
  if (title && title.length > 68) warnings.push(`${url}: long title (${title.length})`);

  // Generated resource documents are server-readable and must have one H1.
  if (url.includes("/resources/")) {
    const h1Count = (html.match(/<h1(?:\s|>)/gi) ?? []).length;
    if (h1Count !== 1) errors.push(`${url}: expected one H1, found ${h1Count}`);
  }

  for (const block of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(block[1]);
    } catch (error) {
      errors.push(`${url}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const match of html.matchAll(/href="(\/resources\/[^"]*)"/g)) {
    const pathname = match[1].split("#")[0].split("?")[0];
    const target = pathname === "/resources/"
      ? path.join(PUBLIC, "resources/index.html")
      : path.join(PUBLIC, pathname, "index.html");
    if (!fs.existsSync(target)) errors.push(`${url}: broken internal link ${match[1]}`);
  }
}

console.log(`SEO audit: ${urls.length} sitemap URLs checked`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
console.log(`SEO audit passed (${warnings.length} non-blocking title-length warnings)`);
