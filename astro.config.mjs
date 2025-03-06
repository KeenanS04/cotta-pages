import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  base: "/cotta-pages/",  // Set base path for GitHub Pages
  build: {
    outDir: "docs",  // GitHub Pages expects 'docs' for deployment
  },
  vite: {
    plugins: [tailwindcss()],
  },
});