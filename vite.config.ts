import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Allow any host header so the app can be served behind preview
  // proxies / tunnels (static site — no host-dependent behavior).
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
