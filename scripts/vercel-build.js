#!/usr/bin/env node
/**
 * Vercel Build Script
 * Builds both React frontend and Node.js backend for Vercel deployment
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create dist directory
const rootDir = path.join(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(distDir, "public");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Build React frontend with Vite
console.log("Building React frontend with Vite...");
try {
  // Use the same vite build command as package.json
  execSync("npx vite build", {
    stdio: "inherit",
    cwd: rootDir,
    env: { ...process.env, NODE_ENV: "production" },
  });
  console.log("✅ Frontend build completed successfully");
} catch (error) {
  console.error("❌ Frontend build failed:", error.message);
  process.exit(1);
}

// Build backend with esbuild
console.log("Building backend with esbuild...");
try {
  execSync(
    "npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.mjs",
    {
      stdio: "inherit",
      cwd: rootDir,
    }
  );
  console.log("✅ Backend build completed successfully");
} catch (error) {
  console.error("❌ Backend build failed:", error.message);
  process.exit(1);
}

console.log("🚀 Vercel build completed successfully");
