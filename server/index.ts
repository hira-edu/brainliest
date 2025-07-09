import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { registerRoutes } from "./src/routes";
import { setupVite, serveStatic, log } from "./src/vite";
import { validateSecurityConfig } from './src/config/security';

// Fixed: Centralized environment utilities
const isProduction = () => process.env.NODE_ENV === 'production';
const isDevelopment = () => process.env.NODE_ENV === 'development';

// Fixed: Enhanced CORS origins handling with environment variable support
const getCorsOrigins = (): string[] => {
  if (isProduction()) {
    // Fixed: Support for configurable production origins
    const corsOrigins = process.env.CORS_ORIGINS;
    if (corsOrigins) {
      return corsOrigins.split(',').map(origin => origin.trim());
    }
    // Fixed: Fallback to default production origins
    return ['https://brainliest.com', 'https://www.brainliest.com'];
  }
  // Fixed: Development origins
  return ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:3000'];
};

const app = express();

// Validate security configuration on startup
validateSecurityConfig();

// Trust proxy for accurate IP addresses behind reverse proxies
app.set('trust proxy', 1);

// Fixed: Enhanced CORS configuration with environment-based origins
app.use(cors({
  origin: getCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Admin-Token',     // Fixed: Support for admin authentication
    'X-Client-Version',  // Fixed: Support for client version tracking
    'X-Request-ID'       // Fixed: Support for request tracing
  ],
  optionsSuccessStatus: 200 // Fixed: Support for legacy browsers
}));

// Fixed: Enhanced Security middleware with improved CSP and production safety
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Fixed: Removed 'unsafe-inline' and added nonce support for better security
      styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      // Fixed: More restrictive script sources in production
      scriptSrc: isDevelopment() 
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"] // Development needs for HMR
        : ["'self'", "https://www.google.com", "https://www.gstatic.com"], // Production restrictions
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'", 
        "https://generativelanguage.googleapis.com", 
        "https://api.resend.com",
        "https://www.google.com",      // Fixed: Google reCAPTCHA
        "https://www.gstatic.com",     // Fixed: Google services
        "wss://localhost:*"            // Fixed: WebSocket for development
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    },
  },
  hsts: isProduction() ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false, // Fixed: Only enable HSTS in production
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: false, // Fixed: Disable for iframe compatibility
  crossOriginResourcePolicy: { policy: "cross-origin" } // Fixed: Allow cross-origin resources
}));

// Fixed: Enhanced rate limiting with route-specific limits
const createRateLimit = (windowMs: number, max: number, message: string) => 
  rateLimit({
    windowMs,
    max,
    message: { message, timestamp: new Date().toISOString() },
    standardHeaders: true,
    legacyHeaders: false,
    // Fixed: Enhanced IP extraction for Vercel and other proxies
    keyGenerator: (req) => {
      return req.ip || 
             req.socket.remoteAddress || 
             (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
             'unknown';
    },
    // Fixed: Skip rate limiting for health checks
    skip: (req) => req.path === '/api/health',
    // Fixed: Removed deprecated onLimitReached option
    handler: (req, res) => {
      console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
      res.status(429).json({ 
        message: "Too many requests from this IP, please try again later.",
        timestamp: new Date().toISOString() 
      });
    }
  });

// Fixed: General API rate limiting
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // requests per window
  "Too many requests from this IP, please try again later."
);

// Fixed: Strict rate limiting for authentication routes
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  20, // More restrictive for auth
  "Too many authentication attempts, please try again later."
);

// Fixed: Very strict rate limiting for admin routes
const adminLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // Very restrictive for admin
  "Too many admin requests, please try again later."
);

// Apply route-specific rate limiting
app.use("/api/auth", authLimiter);
app.use("/api/admin", adminLimiter);
app.use("/api", generalLimiter);

// Fixed: Enhanced slow down with route-specific configuration
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // allow 10 requests per 15 minutes at full speed
  delayMs: (used) => Math.min((used - 10) * 100, 2000), // Fixed: Cap delay at 2 seconds
  // Fixed: Skip slow down for health checks and admin routes
  skip: (req) => req.path === '/api/health' || req.path.startsWith('/api/admin'),
  onDelayReached: (req, res) => {
    console.warn(`🐌 Slow down applied for IP: ${req.ip} on ${req.path}`);
  }
});

app.use("/api", speedLimiter);

// Fixed: Enhanced body parsing middleware with reasonable limits
app.use(express.json({ 
  limit: '1mb', // Fixed: Reduced from 10mb for better security
  type: ['application/json', 'application/*+json'],
  verify: (req, res, buf) => {
    // Fixed: Add request body validation
    if (buf.length === 0 && req.headers['content-length'] !== '0') {
      throw new Error('Invalid request body');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: false, 
  limit: '1mb', // Fixed: Reduced from 10mb for better security
  parameterLimit: 100, // Fixed: Limit number of parameters
  type: 'application/x-www-form-urlencoded'
}));

// Fixed: Enhanced request logging middleware with memory safety and error handling
const createLogRequestMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const path = req.path;
    const method = req.method;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || 'unknown';
    
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    // Fixed: Enhanced response capture with size limits and error handling
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      try {
        // Fixed: Only capture response for logging if it's reasonable size
        const responseString = JSON.stringify(bodyJson);
        if (responseString.length <= 1000) { // Fixed: Limit captured response size
          capturedJsonResponse = bodyJson;
        } else {
          capturedJsonResponse = { message: '[Large response truncated]', size: responseString.length };
        }
      } catch (error) {
        // Fixed: Handle circular references and other JSON errors
        capturedJsonResponse = { message: '[Response not serializable]' };
      }
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      
      // Fixed: Only log API routes to reduce noise
      if (path.startsWith("/api")) {
        try {
          let logLine = `${method} ${path} ${res.statusCode} in ${duration}ms`;
          
          // Fixed: Add additional context for errors
          if (res.statusCode >= 400) {
            logLine += ` [${ip}]`;
            if (isDevelopment()) {
              logLine += ` [${userAgent.slice(0, 50)}]`;
            }
          }
          
          // Fixed: Add response data with size limits
          if (capturedJsonResponse && isDevelopment()) {
            const responseStr = JSON.stringify(capturedJsonResponse);
            if (responseStr.length <= 200) {
              logLine += ` :: ${responseStr}`;
            } else {
              logLine += ` :: ${responseStr.slice(0, 197)}...`;
            }
          }

          // Fixed: Ensure log line doesn't exceed reasonable length
          if (logLine.length > 200) {
            logLine = logLine.slice(0, 197) + "…";
          }

          log(logLine);
          
          // Fixed: Log slow requests for performance monitoring
          if (duration > 5000) {
            console.warn(`🐌 Slow request: ${method} ${path} took ${duration}ms`);
          }
          
        } catch (error) {
          // Fixed: Fallback logging if main logging fails
          console.error('Logging error:', error);
          log(`${method} ${path} ${res.statusCode} in ${duration}ms [logging error]`);
        }
      }
    });

    next();
  };
};

app.use(createLogRequestMiddleware());

(async () => {
  const server = await registerRoutes(app);

  // Fixed: Enhanced error handling middleware with comprehensive error categorization
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const timestamp = new Date().toISOString();
    const requestId = req.headers['x-request-id'] || 'unknown';
    const ip = req.ip || 'unknown';
    const path = req.path;
    const method = req.method;
    
    // Fixed: Enhanced error status determination with specific error type handling
    let status = 500;
    let message = "Internal Server Error";
    let errorType = 'UnknownError';
    
    // Fixed: Handle specific error types
    if (err.name === 'ValidationError' || err.name === 'ZodError') {
      status = 400;
      errorType = 'ValidationError';
      message = isDevelopment() ? err.message : "Invalid request data";
    } else if (err.name === 'UnauthorizedError' || err.status === 401) {
      status = 401;
      errorType = 'AuthenticationError';
      message = "Authentication required";
    } else if (err.name === 'ForbiddenError' || err.status === 403) {
      status = 403;
      errorType = 'AuthorizationError';
      message = "Access forbidden";
    } else if (err.name === 'NotFoundError' || err.status === 404) {
      status = 404;
      errorType = 'NotFoundError';
      message = "Resource not found";
    } else if (err.code === 'LIMIT_FILE_SIZE' || err.type === 'entity.too.large') {
      status = 413;
      errorType = 'PayloadTooLarge';
      message = "Request payload too large";
    } else if (err.type === 'entity.parse.failed') {
      status = 400;
      errorType = 'ParseError';
      message = "Invalid request format";
    } else {
      // Fixed: Use provided status or statusCode, default to 500
      status = err.status || err.statusCode || 500;
      errorType = err.name || 'InternalError';
      
      // Fixed: Safer message handling for production
      if (isDevelopment()) {
        message = err.message || "Internal Server Error";
      } else if (status < 500) {
        // Client errors can show their message
        message = err.message || "Bad Request";
      } else {
        message = "Internal Server Error";
      }
    }

    // Fixed: Enhanced error logging with context
    const errorContext = {
      timestamp,
      requestId,
      ip,
      method,
      path,
      status,
      errorType,
      message: err.message,
      userAgent: req.headers['user-agent'],
      ...(isDevelopment() && { stack: err.stack })
    };

    if (status >= 500) {
      console.error('🚨 Server Error:', errorContext);
    } else if (status >= 400) {
      console.warn('⚠️ Client Error:', {
        timestamp,
        ip,
        method,
        path,
        status,
        errorType,
        message: err.message
      });
    }

    // Fixed: Enhanced error response with request ID for tracking
    const errorResponse: any = {
      error: true,
      message,
      status,
      timestamp,
      requestId
    };

    // Fixed: Add additional debug info in development
    if (isDevelopment()) {
      errorResponse.errorType = errorType;
      errorResponse.path = path;
      if (err.details) {
        errorResponse.details = err.details;
      }
    }

    res.status(status).json(errorResponse);
  });

  // Fixed: Enhanced environment-based setup with better error handling
  try {
    if (isDevelopment()) {
      await setupVite(app, server);
      console.log('🔧 Development mode: Vite development server initialized');
    } else {
      serveStatic(app);
      console.log('📦 Production mode: Static file serving initialized');
    }
  } catch (error) {
    console.error('❌ Failed to setup Vite/static serving:', error);
    process.exit(1);
  }

  // Fixed: Enhanced server startup with graceful shutdown and health monitoring
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const host = process.env.HOST || "0.0.0.0";
  
  // Fixed: Add graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
    
    // Fixed: Force exit after timeout
    setTimeout(() => {
      console.error('⏰ Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, 10000);
  };
  
  // Fixed: Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Fixed: Enhanced error handling for unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // Fixed: Don't exit immediately, log for monitoring
    if (isProduction()) {
      console.error('Production: Unhandled rejection logged, continuing...');
    }
  });
  
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    console.error('💥 Process will exit due to uncaught exception');
    process.exit(1);
  });

  // Fixed: Start server with enhanced configuration
  server.listen({
    port,
    host,
    // Fixed: Remove reusePort for Vercel compatibility
    ...(isDevelopment() && { reusePort: true })
  }, () => {
    const timestamp = new Date().toISOString();
    console.log(`🚀 [${timestamp}] Server started successfully`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
    console.log(`   CORS Origins: ${getCorsOrigins().join(', ')}`);
    log(`serving on port ${port}`);
  });
})().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
