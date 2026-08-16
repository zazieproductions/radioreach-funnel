/* ─────────────────────────────────────────────────────────────
   ESP test runner — bundles and runs the ESP tests.
   Usage:  node scripts/run-esp-tests.mjs   (or `npm run test:esp`)
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
const tmp = mkdtempSync(join(arenaDir, "esp-tests-"));

const run = async (entry, env, label) => {
  const out = join(tmp, `${entry.replace(/[^a-z0-9]/gi, "_")}.mjs`);
  await build({
    entryPoints: [join(root, "scripts", entry)],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: out,
    external: ["jsdom"],
    logLevel: "silent",
  });
  console.log(`\n── ${label} ──`);
  execFileSync(process.execPath, [out], {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
};

try {
  await run("esp-smoke.ts", {}, "Brain logic (pure + integration)");
  await run("esp-integration.tsx", { SCENARIO: "A" }, "Sales page — default → urgency (zone revisits)");
  await run("esp-integration.tsx", { SCENARIO: "B" }, "Sales page — default → calm (rage clicks + fast scroll)");
  await run("esp-integration.tsx", { SCENARIO: "C" }, "Sales page — flag: forced modes + esp=off");
  console.log("\n✔ All ESP tests passed.");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
