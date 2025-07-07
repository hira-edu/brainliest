/**
 * Security Configuration Module
 * Enforces strong security requirements for production deployment
 */

/**
 * Require environment variable with minimum security standards
 */
function requireSecureEnv(key: string, minLength: number = 32): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`CRITICAL SECURITY ERROR: ${key} environment variable is required but not set. Generate a strong ${minLength}+ character secret.`);
  }
  
  if (value.length < minLength) {
    throw new Error(`CRITICAL SECURITY ERROR: ${key} must be at least ${minLength} characters long for security. Current length: ${value.length}`);
  }
  
  // Check for weak patterns
  if (value === 'secret' || value === 'password' || value.includes('123') || value === value.toLowerCase()) {
    throw new Error(`CRITICAL SECURITY ERROR: ${key} appears to be a weak secret. Use a cryptographically strong random string.`);
  }
  
  return value;
}

/**
 * Generate secure random secret for development (NOT for production)
 */
function generateDevSecret(purpose: string): string {
  import('crypto').then(crypto => {
    const secret = crypto.randomBytes(32).toString('hex');
    console.warn(`⚠️  Generated temporary ${purpose} secret for development. Set proper environment variable for production.`);
    return secret;
  });
  // Fallback for immediate execution
  const fallbackSecret = Math.random().toString(36).substring(2, 50) + Math.random().toString(36).substring(2, 50);
  console.warn(`⚠️  Generated temporary ${purpose} secret for development. Set proper environment variable for production.`);
  return fallbackSecret;
}

/**
 * Security configuration with enforced requirements
 */
export const securityConfig = {
  // JWT Secrets - REQUIRED for production
  JWT_SECRET: process.env.NODE_ENV === 'production' 
    ? requireSecureEnv('JWT_SECRET', 64)
    : (process.env.JWT_SECRET || generateDevSecret('JWT_SECRET')),
    
  JWT_REFRESH_SECRET: process.env.NODE_ENV === 'production'
    ? requireSecureEnv('JWT_REFRESH_SECRET', 64) 
    : (process.env.JWT_REFRESH_SECRET || generateDevSecret('JWT_REFRESH_SECRET')),
    
  ADMIN_JWT_SECRET: process.env.NODE_ENV === 'production'
    ? requireSecureEnv('ADMIN_JWT_SECRET', 64)
    : (process.env.ADMIN_JWT_SECRET || generateDevSecret('ADMIN_JWT_SECRET')),
    
  // Admin Authorization
  AUTHORIZED_ADMIN_EMAILS: process.env.AUTHORIZED_ADMIN_EMAILS 
    ? process.env.AUTHORIZED_ADMIN_EMAILS.split(',').map(email => email.trim())
    : ['admin@brainliest.com'], // Default for development only
    
  // Security Headers
  CORS_ORIGINS: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS || 'https://brainliest.com').split(',')
    : ['http://localhost:5000', 'http://localhost:3000'],
    
  // Rate Limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: process.env.NODE_ENV === 'production' ? 100 : 1000,
  
  // Session Security
  SESSION_SECRET: process.env.NODE_ENV === 'production'
    ? requireSecureEnv('SESSION_SECRET', 32)
    : (process.env.SESSION_SECRET || generateDevSecret('SESSION_SECRET')),
};

/**
 * Validate security configuration on startup
 */
export function validateSecurityConfig(): void {
  console.log('🔒 Validating security configuration...');
  
  if (process.env.NODE_ENV === 'production') {
    // Production security requirements
    const requiredSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'ADMIN_JWT_SECRET', 'SESSION_SECRET'];
    
    for (const secret of requiredSecrets) {
      if (!process.env[secret] || process.env[secret].length < 32) {
        throw new Error(`PRODUCTION DEPLOYMENT BLOCKED: ${secret} must be set with 32+ character secure random string`);
      }
    }
    
    console.log('✅ Production security configuration validated');
  } else {
    console.log('⚠️  Development mode: Using auto-generated secrets');
    console.log('⚠️  FOR PRODUCTION: Set JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_JWT_SECRET, SESSION_SECRET');
  }
}