import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

/**
 * Vite config for Chrome Extension (Manifest V3).
 * Builds multiple entry points: popup, content script, background SW.
 * Copies manifest.json and static assets to dist/ after build.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Copy static files to dist after build
    {
      name: "copy-extension-assets",
      closeBundle() {
        // Copy manifest.json
        copyFileSync(
          resolve(__dirname, "manifest.json"),
          resolve(__dirname, "dist/manifest.json")
        );
        // Copy content CSS
        if (existsSync(resolve(__dirname, "src/content/content.css"))) {
          copyFileSync(
            resolve(__dirname, "src/content/content.css"),
            resolve(__dirname, "dist/content.css")
          );
        }
        // Create icons dir with placeholder
        if (!existsSync(resolve(__dirname, "dist/icons"))) {
          mkdirSync(resolve(__dirname, "dist/icons"), { recursive: true });
        }
        console.log("✓ Extension assets copied to dist/");
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // No code splitting — Chrome extensions need specific files
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        content: resolve(__dirname, "src/content/index.ts"),
        background: resolve(__dirname, "src/background/index.ts"),
      },
      output: {
        // Keep entry file names predictable for manifest.json
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});
