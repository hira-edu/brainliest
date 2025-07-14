/**
 * Input Sanitization and Validation Utilities
 * Enterprise-grade security utilities for all user inputs
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Safely parse integer with validation
 */
export function parseId(value: any): number {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`Invalid ID: must be positive integer, got ${value}`);
    }
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error(`Invalid ID: must be positive integer, got "${value}"`);
    }
    return parsed;
  }

  throw new Error(
    `Invalid ID type: expected number or string, got ${typeof value}`
  );
}

/**
 * Safely parse optional integer
 */
export function parseOptionalId(value: any): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return parseId(value);
}

/**
 * Safely parse UUID string
 */
export function parseUUID(value: any): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid UUID type: expected string, got ${typeof value}`);
  }

  // Basic UUID format validation (8-4-4-4-12 pattern)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    throw new Error(`Invalid UUID format: ${value}`);
  }

  return value;
}

/**
 * Safely parse optional UUID
 */
export function parseOptionalUUID(value: any): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return parseUUID(value);
}

/**
 * Safely parse integer from CSV with error context
 */
export function safeParseInt(
  value: any,
  fieldName: string,
  rowIndex?: number
): number {
  try {
    return parseId(value);
  } catch (error) {
    const context = rowIndex !== undefined ? ` at row ${rowIndex}` : "";
    throw new Error(`Invalid ${fieldName}${context}: ${error.message}`);
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: any): string {
  if (typeof input !== "string") {
    return String(input || "");
  }

  // Remove dangerous HTML tags and scripts
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // Trim whitespace
  return cleaned.trim();
}

/**
 * Validate and sanitize email
 */
export function validateAndSanitizeEmail(email: any): string {
  const sanitized = sanitizeString(email);

  if (!sanitized) {
    throw new Error("Email is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error("Invalid email format");
  }

  return sanitized.toLowerCase();
}

/**
 * Validate password requirements
 */
export function validatePassword(password: any): string {
  const sanitized = sanitizeString(password);

  if (!sanitized) {
    throw new Error("Password is required");
  }

  if (sanitized.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(sanitized)) {
    throw new Error("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(sanitized)) {
    throw new Error("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(sanitized)) {
    throw new Error("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(sanitized)) {
    throw new Error("Password must contain at least one special character");
  }

  return sanitized;
}

/**
 * Safely parse JSON with validation
 */
export function safeJsonParse(input: any, fieldName: string): any {
  if (typeof input === "object") {
    return input;
  }

  if (typeof input !== "string") {
    throw new Error(`Invalid ${fieldName}: expected JSON string or object`);
  }

  try {
    return JSON.parse(input);
  } catch (error) {
    throw new Error(`Invalid ${fieldName}: malformed JSON`);
  }
}

/**
 * Validate and sanitize input with custom rules
 */
export function validateAndSanitizeInput(
  input: any,
  fieldName: string,
  options: {
    required?: boolean;
    maxLength?: number;
    minLength?: number;
    allowedValues?: string[];
    regex?: RegExp;
  } = {}
): string {
  const {
    required = false,
    maxLength,
    minLength,
    allowedValues,
    regex,
  } = options;

  const sanitized = sanitizeString(input);

  if (required && !sanitized) {
    throw new Error(`${fieldName} is required`);
  }

  if (!sanitized && !required) {
    return "";
  }

  if (minLength && sanitized.length < minLength) {
    throw new Error(
      `${fieldName} must be at least ${minLength} characters long`
    );
  }

  if (maxLength && sanitized.length > maxLength) {
    throw new Error(`${fieldName} must not exceed ${maxLength} characters`);
  }

  if (allowedValues && !allowedValues.includes(sanitized)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(", ")}`);
  }

  if (regex && !regex.test(sanitized)) {
    throw new Error(`${fieldName} format is invalid`);
  }

  return sanitized;
}

/**
 * Validate array input
 */
export function validateArray(
  input: any,
  fieldName: string,
  itemValidator?: (item: any) => any
): any[] {
  if (!Array.isArray(input)) {
    throw new Error(`${fieldName} must be an array`);
  }

  if (itemValidator) {
    return input.map((item, index) => {
      try {
        return itemValidator(item);
      } catch (error) {
        throw new Error(`${fieldName}[${index}]: ${error.message}`);
      }
    });
  }

  return input;
}

/**
 * Validate IP address format
 */
export function validateIpAddress(ip: any): string {
  const sanitized = sanitizeString(ip);

  if (!sanitized) {
    throw new Error("IP address is required");
  }

  // Basic IPv4/IPv6 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (!ipv4Regex.test(sanitized) && !ipv6Regex.test(sanitized)) {
    throw new Error("Invalid IP address format");
  }

  return sanitized;
}
