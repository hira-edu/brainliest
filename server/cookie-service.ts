/**
 * Server-side cookie management service
 * Handles secure cookie operations for authentication and session management
 */

import { Request, Response } from 'express';

export interface ServerCookieOptions {
  maxAge?: number; // milliseconds
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: boolean | 'strict' | 'lax' | 'none';
  path?: string;
  domain?: string;
  signed?: boolean;
}

export class ServerCookieService {
  /**
   * Set a secure cookie with best practice defaults
   */
  static setCookie(
    res: Response, 
    name: string, 
    value: string, 
    options: ServerCookieOptions = {}
  ): void {
    const defaultOptions: ServerCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours default
    };

    const finalOptions = { ...defaultOptions, ...options };
    res.cookie(name, value, finalOptions);
  }

  /**
   * Set an authentication token cookie with maximum security
   */
  static setAuthCookie(
    res: Response, 
    name: string, 
    token: string, 
    maxAge: number = 24 * 60 * 60 * 1000
  ): void {
    this.setCookie(res, name, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge,
    });
  }

  /**
   * Set a refresh token cookie with extended expiry
   */
  static setRefreshTokenCookie(
    res: Response, 
    token: string, 
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): void {
    this.setCookie(res, 'auth_refresh', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth', // Restrict to auth endpoints only
      maxAge,
    });
  }

  /**
   * Get a cookie value from request
   */
  static getCookie(req: Request, name: string): string | undefined {
    return req.cookies?.[name];
  }

  /**
   * Get a signed cookie value from request
   */
  static getSignedCookie(req: Request, name: string): string | undefined {
    return req.signedCookies?.[name];
  }

  /**
   * Clear a cookie by setting it to expire immediately
   */
  static clearCookie(res: Response, name: string, options: Partial<ServerCookieOptions> = {}): void {
    const clearOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      ...options
    };

    res.clearCookie(name, clearOptions);
  }

  /**
   * Clear all authentication cookies
   */
  static clearAuthCookies(res: Response): void {
    this.clearCookie(res, 'session_token', { sameSite: 'strict' });
    this.clearCookie(res, 'auth_refresh', { 
      path: '/api/auth',
      sameSite: 'strict' 
    });
  }

  /**
   * Set user preference cookies (client-accessible)
   */
  static setPreferenceCookie(
    res: Response, 
    name: string, 
    value: string, 
    maxAge: number = 365 * 24 * 60 * 60 * 1000
  ): void {
    this.setCookie(res, name, value, {
      httpOnly: false, // Allow client access for preferences
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
  }

  /**
   * Validate cookie security settings for production
   */
  static validateCookieConfig(): {
    isSecure: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      if (!process.env.COOKIE_SECRET) {
        warnings.push('COOKIE_SECRET environment variable not set');
      }
      
      // In production, all auth cookies should be secure
      if (!process.env.HTTPS) {
        warnings.push('HTTPS not detected in production environment');
      }
    }

    return {
      isSecure: warnings.length === 0,
      warnings
    };
  }

  /**
   * Create CSRF token and set as cookie
   */
  static setCSRFToken(res: Response): string {
    const token = this.generateSecureToken();
    this.setCookie(res, 'csrf_token', token, {
      httpOnly: false, // Needs to be accessible to client for CSRF protection
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });
    return token;
  }

  /**
   * Verify CSRF token from cookie and header
   */
  static verifyCSRFToken(req: Request): boolean {
    const cookieToken = this.getCookie(req, 'csrf_token');
    const headerToken = req.get('X-CSRF-Token') || req.get('X-Requested-With');
    
    if (!cookieToken || !headerToken) {
      return false;
    }
    
    return cookieToken === headerToken;
  }

  /**
   * Generate a secure random token
   */
  private static generateSecureToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Set cookie consent tracking
   */
  static setCookieConsent(
    res: Response, 
    preferences: Record<string, boolean>
  ): void {
    this.setPreferenceCookie(res, 'cookies_accepted', 'true');
    this.setPreferenceCookie(res, 'cookie_preferences', JSON.stringify(preferences));
  }

  /**
   * Get cookie consent status from request
   */
  static getCookieConsent(req: Request): {
    hasConsented: boolean;
    preferences: Record<string, boolean>;
  } {
    const accepted = this.getCookie(req, 'cookies_accepted') === 'true';
    const preferencesString = this.getCookie(req, 'cookie_preferences');
    
    let preferences: Record<string, boolean> = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    };

    if (preferencesString) {
      try {
        preferences = { ...preferences, ...JSON.parse(preferencesString) };
      } catch (error) {
        console.warn('Failed to parse cookie preferences:', error);
      }
    }

    return { hasConsented: accepted, preferences };
  }

  /**
   * Check if a specific cookie category is enabled
   */
  static isCookieCategoryEnabled(req: Request, category: string): boolean {
    const { preferences } = this.getCookieConsent(req);
    return preferences[category] || false;
  }

  /**
   * Security middleware to validate cookie settings
   */
  static securityMiddleware() {
    return (req: Request, res: Response, next: Function) => {
      // Add security headers for cookie protection
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Validate cookie configuration in production
      if (process.env.NODE_ENV === 'production') {
        const { warnings } = ServerCookieService.validateCookieConfig();
        if (warnings.length > 0) {
          console.warn('Cookie security warnings:', warnings);
        }
      }
      
      next();
    };
  }

  /**
   * Extract all cookies from request for debugging/audit
   */
  static getAllCookies(req: Request): {
    regular: Record<string, string>;
    signed: Record<string, string>;
  } {
    return {
      regular: req.cookies || {},
      signed: req.signedCookies || {}
    };
  }

  /**
   * Log cookie operations for audit trail
   */
  static logCookieOperation(
    operation: 'set' | 'get' | 'clear',
    name: string,
    req: Request,
    additionalInfo?: any
  ): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Cookie ${operation}:`, {
        name,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        ...additionalInfo
      });
    }
  }
}

/**
 * Express middleware for cookie consent checking
 */
export function requireCookieConsent(category: string) {
  return (req: Request, res: Response, next: Function) => {
    if (category === 'essential') {
      // Essential cookies are always allowed
      return next();
    }

    const isEnabled = ServerCookieService.isCookieCategoryEnabled(req, category);
    
    if (!isEnabled) {
      return res.status(403).json({
        error: 'Cookie consent required',
        message: `This operation requires consent for ${category} cookies`,
        category
      });
    }

    next();
  };
}

/**
 * Utility functions for common cookie operations
 */
export const CookieUtils = {
  // Helper to check if request has valid session
  hasValidSession: (req: Request): boolean => {
    const sessionToken = ServerCookieService.getCookie(req, 'session_token');
    return !!sessionToken;
  },

  // Helper to extract user ID from session cookie (when JWT is used)
  getUserIdFromSession: (req: Request): string | null => {
    const sessionToken = ServerCookieService.getCookie(req, 'session_token');
    if (!sessionToken) return null;

    try {
      // Assuming JWT token structure - adjust based on your implementation
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
      return decoded.userId || decoded.id || null;
    } catch {
      return null;
    }
  },

  // Helper to set user session with secure defaults
  setUserSession: (res: Response, userId: string, sessionData: any) => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId, ...sessionData },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    ServerCookieService.setAuthCookie(res, 'session_token', token);
  }
};