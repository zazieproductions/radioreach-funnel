#!/usr/bin/env node
/**
 * preview-server.mjs — dependency-free static server for the built site.
 *
 * Exists because `npx serve` needs to resolve a package at startup, which
 * makes it fragile in this sandbox. This uses only node:http and node:fs, so
 * there is nothing to download and nothing to fail.
 *
 * Serves dist/ the way Cloudflare Pages does: /about/ -> dist/about/index.html,
 * with 404.html for misses. Binds 0.0.0.0 so the preview proxy can reach it.
 *
 *   node scripts/preview-server.mjs [--port 3000] [--dir dist]
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const argv = process.argv.slice(2);
const arg = (f, d) => {
  const i = argv.indexOf(f);
  return i === -1 ? d : argv[i + 1];
};

const PORT = Number(arg("--port", 3000));
const DIR = path.resolve(ROOT, arg("--dir", "dist"));

if (!fs.existsSync(DIR)) {
  console.error(`No build found at ${DIR}. Run \`npm run build\` first.`);
  process.exit(1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

/** Resolve a URL path to a file on disk, mirroring Pages' directory-index rule. */
function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  // Contain traversal: normalise, then require the result stay under DIR.
  const target = path.normalize(path.join(DIR, clean));
  if (!target.startsWith(DIR)) return null;

  if (fs.existsSync(target) && fs.statSync(target).isFile()) return target;

  const asIndex = path.join(target, "index.html");
  if (fs.existsSync(asIndex)) return asIndex;

  const asHtml = `${target}.html`;
  if (fs.existsSync(asHtml)) return asHtml;

  return null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || "/");

  if (!file) {
    const notFound = path.join(DIR, "404.html");
    const body = fs.existsSync(notFound)
      ? fs.readFileSync(notFound)
      : "404 Not Found";
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    console.log(`404 ${req.url}`);
    return res.end(body);
  }

  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    "Content-Type": TYPES[ext] || "application/octet-stream",
    // No caching: this is a preview, stale assets are pure confusion.
    "Cache-Control": "no-store",
  });
  console.log(`200 ${req.url}`);
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serving ${path.relative(ROOT, DIR)}/ on http://0.0.0.0:${PORT}`);
});

// Keep the process alive and loud if it ever does fall over.
process.on("uncaughtException", (e) => console.error("uncaught:", e));
