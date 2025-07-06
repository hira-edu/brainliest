import { Request, Response, NextFunction } from 'express';
import { authService } from '../auth-service';
import { storage } from '../storage';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        username?: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

/**
 * Authentication middleware to verify JWT tokens
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const result = await authService.verifyToken(token);
    
    if (!result.valid || !result.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    // Attach user to request object
    req.user = result.user;
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
}

/**
 * Authorization middleware to check admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): any {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }

  return next();
}

/**
 * Combined middleware for admin routes
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  authenticateToken(req, res, (error) => {
    if (error) return next(error);
    requireAdmin(req, res, next);
  });
}

/**
 * Audit logging middleware for admin actions
 */
export async function logAdminAction(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log successful admin actions (2xx status codes)
    if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
      const logEntry = {
        adminId: req.user.id,
        adminEmail: req.user.email,
        action: `${req.method} ${req.path}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown',
        details: req.method !== 'GET' ? JSON.stringify(req.body) : null
      };
      
      // Store in audit log database table
      storage.createAuditLog(logEntry).catch(error => {
        console.error('Failed to store audit log:', error);
      });
      
      console.log('ADMIN_AUDIT:', JSON.stringify(logEntry));
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}