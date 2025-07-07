export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  
  // AI Services
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  
  // Authentication
  GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  
  // Email Services
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  
  // Security
  RECAPTCHA_SITE_KEY: process.env.VITE_RECAPTCHA_SITE_KEY,
  RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY,
  
  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret-here',
} as const;

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';