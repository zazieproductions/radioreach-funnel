/* ─────────────────────────────────────────────────────────────
   Conversion Lab test runner — bundles and runs the lab tests.
   Usage:  node scripts/run-lab-tests.mjs   (or `npm run test:lab`)
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
const tmp = mkdtempSync(join(arenaDir, "lab-tests-"));

const run = async (entry, env, label) => {
  const out = join(tmp, `${entry.replace(/[^a-z0-9]/gi, "_")}.mjs`);
  await build({
    entryPoints: [join(root, "scripts", entry)],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: out,
    external: ["jsdom"],
    // Vite provides import.meta.env in the browser build; provide an
    // empty object here so env-flag modules behave like production
    // defaults under the node test bundle.
    define: { "import.meta.env": "{}" },
    logLevel: "silent",
  });
  console.log(`\n── ${label} ──`);
  execFileSync(process.execPath, [out], {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
};

try {
  await run("lab-smoke.ts", {}, "Mechanics (bucketing, schedules, streaks, easing)");
  await run("lab-integration.tsx", { SCENARIO: "A" }, "Gallery — render, QA switch, conversion logging");
  await run("lab-integration.tsx", { SCENARIO: "B" }, "Gallery — URL variant override");
  await run("lab-integration.tsx", { SCENARIO: "C" }, "Gallery — lab=off kill switch");
  console.log("\n✔ All Conversion Lab tests passed.");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
