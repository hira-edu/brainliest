import { Request, Response, NextFunction } from 'express';
import { adminAuthService, AdminUser } from '../services/admin-auth-service';

// Extend Request type to include admin user
declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminUser;
    }
  }
}

/**
 * Middleware to verify admin authentication
 * Completely separate from regular user authentication
 */
export function requireNewAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header or cookies
    let token: string | undefined;
    
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Fallback to admin-specific cookie
    if (!token && req.cookies) {
      token = req.cookies.admin_token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required. Please sign in to access admin features.",
        code: "ADMIN_AUTH_REQUIRED"
      });
    }
    
    // Verify admin token using dedicated admin auth service
    const verification = adminAuthService.verifyToken(token);
    
    if (!verification.valid) {
      if (verification.expired) {
        return res.status(401).json({
          success: false,
          message: "Admin session expired. Please sign in again.",
          code: "ADMIN_SESSION_EXPIRED"
        });
      }
      
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials. Access denied.",
        code: "ADMIN_AUTH_INVALID"
      });
    }
    
    if (!verification.user) {
      return res.status(401).json({
        success: false,
        message: "Admin user not found. Please contact system administrator.",
        code: "ADMIN_USER_NOT_FOUND"
      });
    }
    
    // Additional role verification
    if (verification.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Insufficient privileges. Admin role required.",
        code: "ADMIN_ROLE_REQUIRED"
      });
    }
    
    // Attach admin user to request for use in route handlers
    req.adminUser = verification.user;
    
    next();
    
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: "Authentication system error. Please try again.",
      code: "ADMIN_AUTH_ERROR"
    });
  }
}

/**
 * Middleware to log admin actions for audit purposes
 */
export function logNewAdminAction(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store action for later logging (after successful operation)
    req.adminAction = action;
    
    // Override res.json to capture the response and log the action
    const originalJson = res.json;
    res.json = function(body: any) {
      // Log the admin action with the response status
      if (req.adminUser) {
        const success = res.statusCode >= 200 && res.statusCode < 300;
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        
        // Fire and forget logging (don't wait for it)
        setImmediate(() => {
          try {
            // This would typically log to audit_logs table
            console.log(`[ADMIN_AUDIT] ${req.adminUser?.email} performed ${action} - ${success ? 'SUCCESS' : 'FAILED'} (${res.statusCode}) from ${ipAddress}`);
          } catch (error) {
            console.error('Failed to log admin action:', error);
          }
        });
      }
      
      // Call original json method
      return originalJson.call(this, body);
    };
    
    next();
  };
}

/**
 * Middleware to extract client information for logging
 */
export function extractClientInfo(req: Request, res: Response, next: NextFunction) {
  // Store client info for use in other middleware
  req.clientInfo = {
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    timestamp: new Date()
  };
  
  next();
}

// Extend Request type for admin action tracking
declare global {
  namespace Express {
    interface Request {
      adminAction?: string;
      clientInfo?: {
        ipAddress: string;
        userAgent: string;
        timestamp: Date;
      };
    }
  }
}