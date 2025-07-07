import type { Request, Response, NextFunction } from "express";

/**
 * Enterprise Subdomain Manager
 * Handles routing and session isolation between main site and admin subdomain
 */

// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const MAIN_DOMAIN = isDevelopment ? 'localhost:5000' : 'brainliest.com';
const ADMIN_DOMAIN = isDevelopment ? 'admin.localhost:5000' : 'admin.brainliest.com';

export interface SubdomainContext {
  isAdmin: boolean;
  isMain: boolean;
  domain: string;
  subdomain?: string;
}

/**
 * Extract subdomain information from request
 */
export function getSubdomainContext(req: Request): SubdomainContext {
  const host = req.get('host') || '';
  const isLocal = host.includes('localhost');
  
  if (isLocal) {
    // Development: check for admin.localhost:5000
    const isAdmin = host.startsWith('admin.localhost');
    return {
      isAdmin,
      isMain: !isAdmin,
      domain: host,
      subdomain: isAdmin ? 'admin' : undefined
    };
  } else {
    // Production: check for admin.brainliest.com
    const parts = host.split('.');
    const isAdmin = parts[0] === 'admin' && host.includes('brainliest.com');
    return {
      isAdmin,
      isMain: !isAdmin,
      domain: host,
      subdomain: isAdmin ? 'admin' : undefined
    };
  }
}

/**
 * Middleware to enforce subdomain restrictions
 */
export function enforceSubdomainRestrictions(req: Request, res: Response, next: NextFunction) {
  const context = getSubdomainContext(req);
  req.subdomainContext = context;
  
  // Admin routes can only be accessed from admin subdomain
  if (req.path.startsWith('/admin') && !context.isAdmin) {
    const adminUrl = isDevelopment 
      ? `http://admin.localhost:5000${req.path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`
      : `https://admin.brainliest.com${req.path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
    // ELIMINATED: Subdomain redirect replaced with JSON response per war-tested specifications
    return res.status(400).json({ 
      error: "subdomain_required", 
      message: "Access admin panel via proper subdomain",
      adminUrl 
    });
  }
  
  // Admin API routes restricted to admin subdomain
  if (req.path.startsWith('/api/admin') && !context.isAdmin && !req.path.includes('/presence')) {
    return res.status(403).json({ 
      error: 'Admin API access restricted to admin subdomain',
      adminUrl: isDevelopment ? 'http://admin.localhost:5000' : 'https://admin.brainliest.com'
    });
  }
  
  next();
}

/**
 * Middleware to set secure cross-subdomain cookies for admin sessions
 */
export function configureAdminSessionCookies(req: Request, res: Response, next: NextFunction) {
  const context = getSubdomainContext(req);
  
  if (context.isAdmin) {
    // Configure cookie options for admin subdomain
    res.locals.cookieOptions = {
      domain: isDevelopment ? 'localhost' : '.brainliest.com', // Allow cross-subdomain
      secure: !isDevelopment, // HTTPS only in production
      httpOnly: true,
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    };
  }
  
  next();
}

/**
 * Generate secure admin session configuration
 */
export function getAdminSessionConfig() {
  return {
    name: 'admin_session',
    secret: process.env.ADMIN_SESSION_SECRET || 'dev-admin-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      domain: isDevelopment ? 'localhost' : '.brainliest.com',
      secure: !isDevelopment,
      httpOnly: true,
      sameSite: 'lax' as const,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours - persistent sessions
    },
    rolling: true // Extend session on activity
  };
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      subdomainContext?: SubdomainContext;
    }
  }
}