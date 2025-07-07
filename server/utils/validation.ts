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
  return input.trim().substring(0, maxLength);
}