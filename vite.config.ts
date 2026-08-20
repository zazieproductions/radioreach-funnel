import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static marketing/legal pages that ship as public/<slug>/index.html and are
// served at /<slug>/ by Cloudflare Pages in production. Vite's dev server
// resolves those URLs to the SPA shell (history fallback) instead, which makes
// the footer links appear to "not open a page" while developing. Serve them
// the way production does.
function serveStaticPublicPages(): Plugin {
  return {
    name: "serve-static-public-pages",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [pathname, query] = (req.url ?? "").split("?");
        const match = pathname.match(
          /^\/(refund-policy|privacy-policy|terms)\/?$/,
        );
        if (!match) return next();

        // Mirror static hosts: normalize /refund-policy → /refund-policy/.
        if (!pathname.endsWith("/")) {
          res.statusCode = 308;
          res.setHeader("location", `${pathname}/${query ? `?${query}` : ""}`);
          return res.end();
        }

        const file = path.join(__dirname, "public", match[1], "index.html");
        if (!fs.existsSync(file)) return next();
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(fs.readFileSync(file, "utf8"));
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), serveStaticPublicPages()],
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
    },
  },
});
