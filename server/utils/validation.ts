/**
 * Input validation utilities for safer parameter parsing
 */

export function parseId(value: string | undefined, fieldName = 'id'): number {
  if (!value) {
    throw new Error(`${fieldName} is required`);
  }
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${fieldName}: must be a positive integer`);
  }
  
  return parsed;
}

export function parseOptionalId(value: string | undefined): number | undefined {
  if (!value) return undefined;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return undefined;
  }
  
  return parsed;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeString(input: string, maxLength = 1000): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().substring(0, maxLength);
}

export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    if (!jsonString || typeof jsonString !== 'string') return fallback;
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse failed, using fallback:', error);
    return fallback;
  }
}

export function validateAndSanitizeInput(input: any): string {
  if (input === null || input === undefined) return '';
  return sanitizeString(String(input));
}

// Password strength validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}