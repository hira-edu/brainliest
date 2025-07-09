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
        errors[key] = 'Please enter a valid email address';
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
};