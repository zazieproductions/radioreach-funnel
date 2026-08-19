/* ─────────────────────────────────────────────────────────────
   Secret Slots test runner — bundles and runs the slot logic
   tests and the jsdom integration scenario with esbuild so the
   pure module's Node imports resolve.
   Usage:  node scripts/run-slots-tests.mjs   (or `npm run test:slots`)
───────────────────────────────────────────────────────────── */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arenaDir = join(root, ".arena");
mkdirSync(arenaDir, { recursive: true });
const tmp = mkdtempSync(join(arenaDir, "slots-tests-"));

const run = async (entry, label) => {
  const out = join(tmp, `${entry.replace(/[^a-z0-9]/gi, "_")}.mjs`);
  await build({
    entryPoints: [join(root, "scripts", entry)],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: out,
    external: ["jsdom"],
    define: { "import.meta.env": "{}" },
    logLevel: "silent",
  });
  console.log(`\n── ${label} ──`);
  execFileSync(process.execPath, [out], { stdio: "inherit" });
};

try {
  await run("test-slots.ts", "Geometry (payline alignment, near-miss nudge, rewind)");
  await run("slots-integration.tsx", "Machine (render, spin choreography, hidden-until-spin reveal)");
  console.log("\n✔ All Secret Slots tests passed.");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
