import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { fdDevApi } from "./scripts/fd-dev-api";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static marketing/legal pages that ship as public/<slug>/index.html (and the
// /resources/ guide cluster) and are served at those paths by Cloudflare Pages
// in production. Vite's dev server resolves these URLs to the SPA shell
// (history fallback) instead, which makes the links appear dead while
// developing. Serve them the way production does.
function serveStaticPublicPages(): Plugin {
  return {
    name: "serve-static-public-pages",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [pathname, query] = (req.url ?? "").split("?");
        const legal = pathname.match(
          /^\/(refund-policy|privacy-policy|terms)\/?$/,
        );
        const resources = pathname.match(/^\/resources\/?([a-z0-9-]+)?\/?$/);

        // Resolve to the public/ page production (Cloudflare Pages) serves.
        let file: string | null = null;
        if (legal) {
          file = path.join(__dirname, "public", legal[1], "index.html");
        } else if (resources) {
          file = resources[1]
            ? path.join(
                __dirname,
                "public",
                "resources",
                resources[1],
                "index.html",
              )
            : path.join(__dirname, "public", "resources", "index.html");
        }
        if (!file) return next();

        // Mirror static hosts: normalize /refund-policy → /refund-policy/.
        if (!pathname.endsWith("/")) {
          res.statusCode = 308;
          res.setHeader("location", `${pathname}/${query ? `?${query}` : ""}`);
          return res.end();
        }

        if (!fs.existsSync(file)) return next();
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(fs.readFileSync(file, "utf8"));
      });
    },
  };
}

// The FD web app is a second entry (fd.html) with SPA-ish routes under
// /frequency-dominion/{app,login,signup,admin}. In production Cloudflare
// Pages serves those via public/_redirects (200 rewrites to /fd.html); in dev
// Vite's history fallback would serve the funnel shell instead, so mirror it.
function serveFdAppShell(): Plugin {
  return {
    name: "serve-fd-app-shell",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url || "";
        if (/^\/frequency-dominion\/(app|login|signup|admin)([/?#]|$)/.test(url) || /^\/fd-app([/?#]|$)/.test(url)) {
          req.url = "/fd.html";
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), serveStaticPublicPages(), serveFdAppShell(), fdDevApi()],
  // Bind all interfaces and accept any host header so the app can be
  // served behind preview proxies / tunnels (static site — no
  // host-dependent behavior).
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  preview: { allowedHosts: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        fd: path.resolve(__dirname, "fd.html"),
      },
    },
  },
});
