import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({root:import.meta.dirname,plugins:[react()],server:{host:"0.0.0.0",allowedHosts:true},preview:{allowedHosts:true},build:{outDir:"dist",emptyOutDir:true}});
