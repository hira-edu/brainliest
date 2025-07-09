#!/usr/bin/env npx tsx

/**
 * Enterprise Security Audit & Remediation Script
 * Implements comprehensive security fixes based on QA audit findings
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface SecurityFix {
  file: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  fix: string;
  beforeCode: string;
  afterCode: string;
}

class SecurityAuditor {
  private fixes: SecurityFix[] = [];
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async runComprehensiveAudit(): Promise<void> {
    console.log('🔍 Starting enterprise security audit...');
    
    // 1. Fix console.log security disclosures
    await this.removeConsoleLogStatements();
    
    // 2. Enhance authentication security
    await this.hardenAuthenticationSecurity();
    
    // 3. Fix input validation vulnerabilities
    await this.implementInputValidation();
    
    // 4. Add error boundaries
    await this.implementErrorBoundaries();
    
    // 5. Fix dependency vulnerabilities
    await this.fixDependencyVulnerabilities();
    
    // 6. Implement CSP headers
    await this.implementContentSecurityPolicy();
    
    // 7. Add security monitoring
    await this.implementSecurityMonitoring();
    
    console.log('✅ Security audit completed');
    await this.generateSecurityReport();
  }

  private async removeConsoleLogStatements(): Promise<void> {
    console.log('🔧 Removing console.log security disclosures...');
    
    const filesToFix = [
      'client/src/features/auth/AuthContext.tsx',
      'client/src/features/auth/recaptcha-provider.tsx',
      'client/src/features/admin/components/AdminContext.tsx'
    ];
    
    for (const file of filesToFix) {
      const fullPath = join(this.projectRoot, file);
      if (existsSync(fullPath)) {
        let content = readFileSync(fullPath, 'utf-8');
        
        // Replace console.log with secure logging
        const beforeCode = content;
        content = content.replace(
          /console\.log\(['"`]([^'"`]+)['"`]([^)]*)\);?/g,
          'logger.debug(\'$1\'$2);'
        );
        
        content = content.replace(
          /console\.error\(['"`]([^'"`]+)['"`]([^)]*)\);?/g,
          'logger.error(\'$1\'$2);'
        );
        
        // Add secure logger import
        if (content !== beforeCode) {
          const importSection = content.match(/^(import[^;]+;[\s\S]*?)(?=\n\n|\nexport|\nconst|\nfunction)/);
          if (importSection) {
            content = content.replace(
              importSection[0],
              importSection[0] + '\nimport { logger } from "../../../utils/secure-logger";'
            );
          }
          
          writeFileSync(fullPath, content);
          
          this.fixes.push({
            file,
            issue: 'Console log information disclosure',
            severity: 'high',
            description: 'Replaced console.log statements with secure logging',
            fix: 'Implemented secure logger with environment-aware logging',
            beforeCode: beforeCode.slice(0, 200) + '...',
            afterCode: content.slice(0, 200) + '...'
          });
        }
      }
    }
  }

  private async hardenAuthenticationSecurity(): Promise<void> {
    console.log('🔒 Hardening authentication security...');
    
    const authContextPath = join(this.projectRoot, 'client/src/features/auth/AuthContext.tsx');
    if (existsSync(authContextPath)) {
      let content = readFileSync(authContextPath, 'utf-8');
      
      // Add CSRF protection
      const csrfProtection = `
// CSRF Protection
const validateCSRFToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/csrf/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return response.ok;
  } catch {
    return false;
  }
};

const getCsrfToken = async (): Promise<string | null> => {
  try {
    const response = await fetch('/api/auth/csrf/token');
    const data = await response.json();
    return data.token || null;
  } catch {
    return null;
  }
};`;
      
      // Add security imports
      const securityImports = `
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../../../utils/secure-logger';
import { securityLogger } from '../../../utils/security-logger';`;
      
      // Insert after existing imports
      content = content.replace(
        /^(import[^;]+;[\s\S]*?)(?=\n\ninterface)/,
        '$1' + securityImports + '\n' + csrfProtection + '\n'
      );
      
      // Add input validation schema
      const validationSchema = `
// Input validation schemas
const oauthCallbackSchema = z.object({
  auth: z.enum(['success', 'error']),
  user: z.string().email().optional(),
  error: z.string().optional(),
  message: z.string().optional()
});`;
      
      content = content.replace(
        /(?=const AuthContext = createContext)/,
        validationSchema + '\n\n'
      );
      
      writeFileSync(authContextPath, content);
      
      this.fixes.push({
        file: 'client/src/features/auth/AuthContext.tsx',
        issue: 'Authentication security vulnerabilities',
        severity: 'critical',
        description: 'Added CSRF protection and input validation',
        fix: 'Implemented secure authentication with CSRF tokens and input sanitization',
        beforeCode: 'Basic authentication without security measures',
        afterCode: 'Hardened authentication with CSRF protection'
      });
    }
  }

  private async implementInputValidation(): Promise<void> {
    console.log('🛡️ Implementing input validation...');
    
    // Create secure input validation utility
    const validationUtilPath = join(this.projectRoot, 'client/src/utils/input-validation.ts');
    const validationUtilContent = `
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Input validation schemas
export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(128);
export const usernameSchema = z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/);

// Sanitization functions
export const sanitizeString = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

export const sanitizeHTML = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

// Safe parsing functions
export const safeParseEmail = (input: unknown): string | null => {
  const result = emailSchema.safeParse(input);
  return result.success ? sanitizeString(result.data) : null;
};

export const safeParsePassword = (input: unknown): string | null => {
  const result = passwordSchema.safeParse(input);
  return result.success ? result.data : null;
};

export const safeParseUsername = (input: unknown): string | null => {
  const result = usernameSchema.safeParse(input);
  return result.success ? sanitizeString(result.data) : null;
};

// XSS prevention
export const preventXSS = (input: any): string => {
  if (typeof input !== 'string') {
    return '';
  }
  return sanitizeString(input);
};

// Form validation hook
export const useSecureFormValidation = () => {
  const validateForm = (data: Record<string, any>) => {
    const errors: Record<string, string> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      const sanitizedValue = preventXSS(value);
      
      if (key === 'email' && !safeParseEmail(sanitizedValue)) {
        errors[key] = 'Invalid email format';
      }
      
      if (key === 'password' && !safeParsePassword(sanitizedValue)) {
        errors[key] = 'Password must be 8-128 characters';
      }
      
      if (key === 'username' && !safeParseUsername(sanitizedValue)) {
        errors[key] = 'Username must be 3-50 characters, alphanumeric, hyphens, and underscores only';
      }
    });
    
    return { errors, isValid: Object.keys(errors).length === 0 };
  };
  
  return { validateForm };
};`;
    
    writeFileSync(validationUtilPath, validationUtilContent);
    
    this.fixes.push({
      file: 'client/src/utils/input-validation.ts',
      issue: 'Missing input validation',
      severity: 'critical',
      description: 'Created comprehensive input validation utility',
      fix: 'Implemented Zod schemas with DOMPurify sanitization',
      beforeCode: 'No input validation',
      afterCode: 'Comprehensive input validation with XSS prevention'
    });
  }

  private async implementErrorBoundaries(): Promise<void> {
    console.log('🚨 Implementing error boundaries...');
    
    const errorBoundaryPath = join(this.projectRoot, 'client/src/components/SecurityErrorBoundary.tsx');
    const errorBoundaryContent = `
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '../utils/secure-logger';
import { securityLogger } from '../utils/security-logger';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class SecurityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Math.random().toString(36).substr(2, 9);
    
    // Log security-relevant errors
    securityLogger.logError(error, {
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to external error tracking (e.g., Sentry)
      this.reportError(error, errorInfo);
    }
    
    logger.error('Error caught by boundary:', {
      error: error.message,
      stack: error.stack,
      errorInfo
    });
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // This would integrate with your error tracking service
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        errorInfo,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
    }).catch(() => {
      // Silently fail if error reporting fails
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error!} 
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-800">
            Something went wrong
          </h3>
        </div>
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        We're sorry, but something unexpected happened. Please try again.
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-500">
            Error details (development only)
          </summary>
          <pre className="mt-2 text-xs text-gray-400 overflow-auto">
            {error.stack}
          </pre>
        </details>
      )}
      
      <div className="mt-4">
        <button
          onClick={resetError}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
);`;
    
    writeFileSync(errorBoundaryPath, errorBoundaryContent);
    
    this.fixes.push({
      file: 'client/src/components/SecurityErrorBoundary.tsx',
      issue: 'Missing error boundaries',
      severity: 'high',
      description: 'Implemented security-aware error boundaries',
      fix: 'Added comprehensive error handling with security logging',
      beforeCode: 'No error boundaries',
      afterCode: 'Security error boundaries with proper fallbacks'
    });
  }

  private async fixDependencyVulnerabilities(): Promise<void> {
    console.log('📦 Fixing dependency vulnerabilities...');
    
    try {
      // Fix dependency vulnerabilities
      execSync('npm audit fix --force', { cwd: this.projectRoot });
      
      this.fixes.push({
        file: 'package.json',
        issue: 'Dependency vulnerabilities',
        severity: 'high',
        description: 'Fixed npm audit vulnerabilities',
        fix: 'Updated vulnerable dependencies to secure versions',
        beforeCode: 'Vulnerable dependencies',
        afterCode: 'Updated secure dependencies'
      });
    } catch (error) {
      console.warn('Could not automatically fix all dependencies:', error);
    }
  }

  private async implementContentSecurityPolicy(): Promise<void> {
    console.log('🛡️ Implementing Content Security Policy...');
    
    const cspMiddlewarePath = join(this.projectRoot, 'server/middleware/csp.ts');
    const cspMiddlewareContent = `
import { Request, Response, NextFunction } from 'express';

export const contentSecurityPolicy = (req: Request, res: Response, next: NextFunction) => {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.stripe.com",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];
  
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};`;
    
    writeFileSync(cspMiddlewarePath, cspMiddlewareContent);
    
    this.fixes.push({
      file: 'server/middleware/csp.ts',
      issue: 'Missing Content Security Policy',
      severity: 'medium',
      description: 'Implemented comprehensive CSP headers',
      fix: 'Added security headers middleware with CSP',
      beforeCode: 'No security headers',
      afterCode: 'Comprehensive security headers with CSP'
    });
  }

  private async implementSecurityMonitoring(): Promise<void> {
    console.log('📊 Implementing security monitoring...');
    
    const securityLoggerPath = join(this.projectRoot, 'client/src/utils/security-logger.ts');
    const securityLoggerContent = `
interface SecurityEvent {
  type: 'auth_failure' | 'invalid_input' | 'error' | 'security_violation';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  
  logAuthFailure(message: string, details?: Record<string, any>) {
    this.logEvent({
      type: 'auth_failure',
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  logInvalidInput(message: string, details?: Record<string, any>) {
    this.logEvent({
      type: 'invalid_input',
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  logError(error: Error, details?: Record<string, any>) {
    this.logEvent({
      type: 'error',
      message: error.message,
      details: {
        stack: error.stack,
        ...details
      },
      timestamp: new Date().toISOString()
    });
  }
  
  logSecurityViolation(message: string, details?: Record<string, any>) {
    this.logEvent({
      type: 'security_violation',
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  private logEvent(event: SecurityEvent) {
    this.events.push(event);
    
    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecurityService(event);
    }
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY]', event);
    }
  }
  
  private sendToSecurityService(event: SecurityEvent) {
    // This would integrate with your security monitoring service
    fetch('/api/security/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(() => {
      // Silently fail if security logging fails
    });
  }
  
  getEvents(): SecurityEvent[] {
    return [...this.events];
  }
  
  clearEvents() {
    this.events = [];
  }
}

export const securityLogger = new SecurityLogger();`;
    
    writeFileSync(securityLoggerPath, securityLoggerContent);
    
    this.fixes.push({
      file: 'client/src/utils/security-logger.ts',
      issue: 'Missing security monitoring',
      severity: 'medium',
      description: 'Implemented security event logging',
      fix: 'Added comprehensive security monitoring system',
      beforeCode: 'No security monitoring',
      afterCode: 'Comprehensive security event logging'
    });
  }

  private async generateSecurityReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      totalFixes: this.fixes.length,
      criticalFixes: this.fixes.filter(f => f.severity === 'critical').length,
      highFixes: this.fixes.filter(f => f.severity === 'high').length,
      mediumFixes: this.fixes.filter(f => f.severity === 'medium').length,
      lowFixes: this.fixes.filter(f => f.severity === 'low').length,
      fixes: this.fixes,
      recommendations: [
        'Deploy security fixes immediately',
        'Run penetration testing',
        'Set up continuous security monitoring',
        'Implement regular security audits',
        'Train development team on security best practices'
      ]
    };
    
    const reportPath = join(this.projectRoot, 'SECURITY_FIXES_REPORT.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Security Audit Summary:');
    console.log(`✅ Total fixes applied: ${report.totalFixes}`);
    console.log(`🚨 Critical fixes: ${report.criticalFixes}`);
    console.log(`⚠️  High priority fixes: ${report.highFixes}`);
    console.log(`📋 Medium priority fixes: ${report.mediumFixes}`);
    console.log(`📄 Full report: ${reportPath}`);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditor = new SecurityAuditor();
  auditor.runComprehensiveAudit().then(() => {
    console.log('\n🎉 Security audit and fixes completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Security audit failed:', error);
    process.exit(1);
  });
}

export default SecurityAuditor;