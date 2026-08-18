/* ─────────────────────────────────────────────────────────────
   Offer v2 test runner — bundles and runs the offer smoke tests.
   Usage:  node scripts/run-offer-tests.mjs   (or `npm run test:offer`)
───────────────────────────────────────────────────────────── */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Emit inside the repo so Node's ESM resolution can find `jsdom`
// (kept external) in the project's node_modules.
const arenaDir = join(root, ".arena");
mkdirSync(arenaDir, { recursive: true });
const tmp = mkdtempSync(join(arenaDir, "offer-tests-"));

const out = join(tmp, "offer-smoke.mjs");

try {
  await build({
    entryPoints: [join(root, "scripts", "offer-smoke.tsx")],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: out,
    external: ["jsdom"],
    // The suite re-imports config/offer with a cache-busting query to get a
    // fresh module graph per case; keep those dynamic imports unbundled.
    define: { "import.meta.env": "{}" },
    logLevel: "silent",
  });

  execFileSync(process.execPath, [out], { stdio: "inherit" });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
