/* ─────────────────────────────────────────────────────────────
   DARK FUNNEL TEARDOWN — isolated dev entry
   ─────────────────────────────────────────────────────────────
   Deliberately a SEPARATE Vite project from the storefront.

   `npm run build` (the deploy path) builds the root config and
   the signal-rot config. It never builds this one, this HTML file
   is not referenced by the production bundle, and no route on
   radioreach.us can reach it. Run it locally with:

       npm run dev:darkfunnel

   Build output, if you ever produce one, goes to .arena/ which
   is gitignored and outside the Cloudflare Pages publish dir.
───────────────────────────────────────────────────────────── */

import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

export default defineConfig({
  root: here,
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(repoRoot, "src") },
  },
  server: {
    host: "0.0.0.0",
    port: 5180,
    strictPort: false,
    // served behind the preview proxy
    allowedHosts: true,
    fs: { allow: [repoRoot] },
  },
  preview: { allowedHosts: true },
  build: {
    // never inside dist/ — that directory is what gets published
    outDir: path.resolve(repoRoot, ".arena/darkfunnel-dist"),
    emptyOutDir: true,
  },
});
