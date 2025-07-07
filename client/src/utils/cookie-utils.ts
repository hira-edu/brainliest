/**
 * Enterprise-grade cookie management utilities
 * Handles secure cookie operations for both client and server environments
 */

export interface CookieOptions {
  expires?: Date | number; // Date object or days from now
  maxAge?: number; // seconds
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface CookieDefinition {
  name: string;
  purpose: string;
  category: 'essential' | 'functional' | 'analytics' | 'marketing';
  duration: string;
  description: string;
}

// Cookie registry for compliance and user management
export const COOKIE_REGISTRY: CookieDefinition[] = [
  {
    name: 'session_token',
    purpose: 'User authentication and session management',
    category: 'essential',
    duration: '24 hours',
    description: 'Required for user login and security. Cannot be disabled.'
  },
  {
    name: 'auth_refresh',
    purpose: 'Secure session refresh token',
    category: 'essential',
    duration: '7 days',
    description: 'Maintains secure login sessions. Cannot be disabled.'
  },
  {
    name: 'user_preferences',
    purpose: 'Store user interface preferences',
    category: 'functional',
    duration: '1 year',
    description: 'Remembers your theme, language, and display preferences.'
  },
  {
    name: 'cookies_accepted',
    purpose: 'Track cookie consent status',
    category: 'essential',
    duration: '1 year',
    description: 'Records your cookie preferences. Cannot be disabled.'
  },
  {
    name: 'cookie_preferences',
    purpose: 'Store detailed cookie preferences',
    category: 'essential',
    duration: '1 year',
    description: 'Stores which cookie categories you have accepted.'
  },
  {
    name: 'analytics_enabled',
    purpose: 'Enable usage analytics',
    category: 'analytics',
    duration: '1 year',
    description: 'Helps us improve the platform by analyzing usage patterns.'
  },
  {
    name: 'performance_tracking',
    purpose: 'Performance monitoring',
    category: 'analytics',
    duration: '30 days',
    description: 'Monitors app performance to identify and fix issues.'
  }
];

/**
 * Client-side cookie utilities
 */
export class CookieManager {
  /**
   * Set a cookie with secure defaults
   */
  static setCookie(name: string, value: string, options: CookieOptions = {}): void {
    if (typeof document === 'undefined') {
      console.warn('setCookie called in server environment');
      return;
    }

    const defaultOptions: CookieOptions = {
      path: '/',
      secure: window.location.protocol === 'https:',
      sameSite: 'lax'
    };

    const finalOptions = { ...defaultOptions, ...options };
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    // Handle expiration
    if (finalOptions.expires) {
      if (typeof finalOptions.expires === 'number') {
        const date = new Date();
        date.setTime(date.getTime() + (finalOptions.expires * 24 * 60 * 60 * 1000));
        cookieString += `; expires=${date.toUTCString()}`;
      } else {
        cookieString += `; expires=${finalOptions.expires.toUTCString()}`;
      }
    }

    if (finalOptions.maxAge) {
      cookieString += `; max-age=${finalOptions.maxAge}`;
    }

    if (finalOptions.path) {
      cookieString += `; path=${finalOptions.path}`;
    }

    if (finalOptions.domain) {
      cookieString += `; domain=${finalOptions.domain}`;
    }

    if (finalOptions.secure) {
      cookieString += '; secure';
    }

    if (finalOptions.sameSite) {
      cookieString += `; samesite=${finalOptions.sameSite}`;
    }

    document.cookie = cookieString;
  }

  /**
   * Get a cookie value by name
   */
  static getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  }

  /**
   * Remove a cookie
   */
  static removeCookie(name: string, options: Partial<CookieOptions> = {}): void {
    const removeOptions: CookieOptions = {
      ...options,
      expires: new Date(0),
      maxAge: 0
    };

    this.setCookie(name, '', removeOptions);
  }

  /**
   * Get all cookies as an object
   */
  static getAllCookies(): Record<string, string> {
    if (typeof document === 'undefined') {
      return {};
    }

    const cookies: Record<string, string> = {};
    const cookieStrings = document.cookie.split(';');

    for (const cookie of cookieStrings) {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    }

    return cookies;
  }

  /**
   * Check if cookies are enabled
   */
  static areCookiesEnabled(): boolean {
    try {
      this.setCookie('test_cookie', 'test', { maxAge: 1 });
      const enabled = this.getCookie('test_cookie') === 'test';
      this.removeCookie('test_cookie');
      return enabled;
    } catch {
      return false;
    }
  }

  /**
   * Get cookie consent status
   */
  static getConsentStatus(): {
    hasConsented: boolean;
    preferences: Record<string, boolean>;
  } {
    const accepted = this.getCookie('cookies_accepted') === 'true';
    const preferencesString = this.getCookie('cookie_preferences');
    
    let preferences: Record<string, boolean> = {
      essential: true, // Always true
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
   * Set cookie consent preferences
   */
  static setConsentPreferences(preferences: Record<string, boolean>): void {
    this.setCookie('cookies_accepted', 'true', { expires: 365 });
    this.setCookie('cookie_preferences', JSON.stringify(preferences), { expires: 365 });

    // Remove cookies for disabled categories
    Object.entries(preferences).forEach(([category, enabled]) => {
      if (!enabled && category !== 'essential') {
        this.removeCookiesForCategory(category as any);
      }
    });
  }

  /**
   * Remove cookies for a specific category
   */
  static removeCookiesForCategory(category: 'functional' | 'analytics' | 'marketing'): void {
    const cookiesToRemove = COOKIE_REGISTRY.filter(cookie => cookie.category === category);
    
    cookiesToRemove.forEach(cookie => {
      this.removeCookie(cookie.name);
    });
  }

  /**
   * Clear all non-essential cookies
   */
  static clearAllNonEssentialCookies(): void {
    const nonEssentialCategories: Array<'functional' | 'analytics' | 'marketing'> = 
      ['functional', 'analytics', 'marketing'];
    
    nonEssentialCategories.forEach(category => {
      this.removeCookiesForCategory(category);
    });

    // Update preferences to reflect cleared state
    this.setConsentPreferences({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    });
  }
}

/**
 * React hook for cookie management
 */
export function useCookies() {
  const getCookie = (name: string) => CookieManager.getCookie(name);
  const setCookie = (name: string, value: string, options?: CookieOptions) => 
    CookieManager.setCookie(name, value, options);
  const removeCookie = (name: string, options?: Partial<CookieOptions>) => 
    CookieManager.removeCookie(name, options);
  
  return { getCookie, setCookie, removeCookie };
}

/**
 * Utility to check if a specific cookie category is enabled
 */
export function isCookieCategoryEnabled(category: string): boolean {
  const { preferences } = CookieManager.getConsentStatus();
  return preferences[category] || false;
}

/**
 * Safe JSON parsing for cookie values
 */
export function safeParseCookieJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}