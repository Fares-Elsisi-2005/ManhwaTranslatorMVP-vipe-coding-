import { build } from "esbuild";
import { copyFile, mkdir } from "fs/promises";
import { join } from "path";

const apiBaseUrl = process.env["API_BASE_URL"] ?? "http://localhost:5000/api";

async function buildScripts() {
  try {
    await mkdir("dist", { recursive: true });

    await Promise.all([
      build({
        entryPoints: ["src/content/index.ts"],
        outfile: "dist/content.js",
        platform: "browser",
        bundle: true,
        minify: true,
        define: { __API_BASE_URL__: JSON.stringify(apiBaseUrl) },
        format: "iife", // Ensure IIFE for content scripts
      }),
      build({
        entryPoints: ["src/background/index.ts"],
        outfile: "dist/background.js",
        platform: "browser",
        bundle: true,
        minify: true,
        define: { __API_BASE_URL__: JSON.stringify(apiBaseUrl) },
        format: "iife", // Ensure IIFE for background scripts
      }),
    ]);

    console.log("✓ Content and Background scripts built successfully.");
  } catch (err) {
    console.error("✗ Build failed:", err);
    process.exit(1);
  }
}

buildScripts();
