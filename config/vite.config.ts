import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer()
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "..", "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "..", "shared"),
      "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "..", "client"),
  publicDir: path.resolve(import.meta.dirname, "..", "client", "public"),
  build: {
    target: "es2022",
    minify: "esbuild",
    sourcemap: process.env.NODE_ENV === "development",
    rollupOptions: {
      external: [
        "crypto",
        "buffer",
        "stream",
        "util",
        "bcryptjs",
        "jsonwebtoken",
        "node:crypto",
        "node:buffer",
        "node:stream",
        "node:util",
      ],
      output: {
        chunkFileNames: "js/[name]-[hash].js",
        entryFileNames: "js/[name]-[hash].js",
        assetFileNames: "[ext]/[name]-[hash].[ext]",
      },
      treeshake: {
        moduleSideEffects: false,
      },
    },
    chunkSizeWarningLimit: 1000,
    outDir: path.resolve(import.meta.dirname, "..", "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
