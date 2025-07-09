import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../../config/vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

// Cache template in memory for development performance
let templateCache: string | null = null;

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Fixed: Development-only check to prevent running in serverless production
  if (process.env.NODE_ENV === 'production') {
    log('Skipping Vite setup in production - use serveStatic instead', 'vite');
    return;
  }

  // Fixed: Validate server object for HMR compatibility
  if (!server || typeof server.listen !== 'function') {
    throw new Error('Invalid server object provided to setupVite');
  }

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // Fixed: Graceful error handling instead of process.exit(1)
        log(`Vite error: ${msg}`, 'vite-error');
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "client",
        "public",
        "index.html",
      );

      // Fixed: Enhanced template caching and error handling
      let template = templateCache;
      if (!template) {
        try {
          template = await fs.promises.readFile(clientTemplate, "utf-8");
          templateCache = template; // Cache for subsequent requests
        } catch (fileError) {
          log(`Failed to read template file: ${clientTemplate}`, 'vite-error');
          return res.status(500).json({ 
            error: 'Template file not found',
            message: 'Unable to load index.html template'
          });
        }
      }

      // Fixed: Use build-time hash instead of random nanoid for cache consistency
      const buildHash = process.env.VITE_BUILD_HASH || Date.now().toString();
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${buildHash}"`,
      );

      // Fixed: Enhanced error handling for Vite transformation
      try {
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (transformError) {
        log(`Failed to transform HTML: ${transformError}`, 'vite-error');
        return res.status(500).json({
          error: 'Template transformation failed',
          message: 'Unable to process HTML template'
        });
      }
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      log(`Vite middleware error: ${e}`, 'vite-error');
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Fixed: Enhanced path resolution for Vercel serverless compatibility
  const distPath = path.resolve(import.meta.dirname, "public");
  const indexPath = path.resolve(distPath, "index.html");

  // Fixed: Improved error handling for missing build directory
  if (!fs.existsSync(distPath)) {
    const errorMsg = `Build directory not found: ${distPath}. Run 'npm run build' first.`;
    log(errorMsg, 'static-error');
    throw new Error(errorMsg);
  }

  // Fixed: Validate index.html exists for fallback routing
  if (!fs.existsSync(indexPath)) {
    const errorMsg = `Index file not found: ${indexPath}. Ensure build process creates index.html.`;
    log(errorMsg, 'static-error');
    throw new Error(errorMsg);
  }

  // Fixed: Enhanced static file serving with security headers
  app.use(express.static(distPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Set security headers for static assets
      if (filePath.endsWith('.html')) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
      }
    }
  }));

  // Fixed: Enhanced fallback with error handling for SPA routing
  app.use("*", (req, res, next) => {
    try {
      // Log requests for debugging in development
      if (process.env.NODE_ENV === 'development') {
        log(`Serving fallback for: ${req.originalUrl}`, 'static');
      }
      
      res.sendFile(indexPath, (err) => {
        if (err) {
          log(`Failed to serve index.html: ${err.message}`, 'static-error');
          next(err);
        }
      });
    } catch (error) {
      log(`Static fallback error: ${error}`, 'static-error');
      next(error);
    }
  });
}
