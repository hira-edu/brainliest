/**
 * Cookie Management Utilities
 * Provides unified interface for cookie handling and consent management
 */

export interface CookieConsentPreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentData {
  accepted: boolean;
  timestamp: number;
  preferences: CookieConsentPreferences;
  version: string;
  sessionId: string;
}

export const COOKIE_REGISTRY = [
  // Essential cookies
  {
    name: 'brainliest_cookie_consent',
    category: 'essential',
    description: 'Stores your cookie consent preferences',
    duration: '1 year'
  },
  {
    name: 'brainliest_session',
    category: 'essential',
    description: 'Maintains your login session and security',
    duration: 'Session'
  },
  {
    name: 'brainliest_csrf_token',
    category: 'essential',
    description: 'Prevents cross-site request forgery attacks',
    duration: 'Session'
  },
  
  // Functional cookies  
  {
    name: 'brainliest_user_prefs',
    category: 'functional',
    description: 'Remembers your preferences and settings',
    duration: '6 months'
  },
  {
    name: 'brainliest_theme',
    category: 'functional',
    description: 'Saves your theme preference (light/dark mode)',
    duration: '1 year'
  },
  {
    name: 'brainliest_lang',
    category: 'functional',
    description: 'Stores your language preference',
    duration: '1 year'
  },
  
  // Analytics cookies
  {
    name: 'brainliest_analytics_id',
    category: 'analytics',
    description: 'Anonymous identifier for analytics tracking',
    duration: '2 years'
  },
  {
    name: 'brainliest_session_start',
    category: 'analytics',
    description: 'Tracks when your session started for analytics',
    duration: 'Session'
  },
  {
    name: 'brainliest_page_views',
    category: 'analytics',
    description: 'Counts page views for website analytics',
    duration: '30 days'
  },
  
  // Marketing cookies
  {
    name: 'brainliest_marketing_id',
    category: 'marketing',
    description: 'Tracks user behavior for marketing purposes',
    duration: '2 years'
  },
  {
    name: 'brainliest_utm_source',
    category: 'marketing',
    description: 'Remembers how you found our website',
    duration: '30 days'
  },
  {
    name: 'brainliest_referrer',
    category: 'marketing',
    description: 'Tracks referring website for attribution',
    duration: '30 days'
  }
] as const;

// Helper to get cookie names
export const COOKIE_NAMES = {
  CONSENT: 'brainliest_cookie_consent',
  SESSION: 'brainliest_session',
  CSRF: 'brainliest_csrf_token',
  PREFERENCES: 'brainliest_user_prefs',
  THEME: 'brainliest_theme',
  LANGUAGE: 'brainliest_lang',
  ANALYTICS_ID: 'brainliest_analytics_id',
  SESSION_START: 'brainliest_session_start',
  PAGE_VIEWS: 'brainliest_page_views',
  MARKETING_ID: 'brainliest_marketing_id',
  UTM_SOURCE: 'brainliest_utm_source',
  REFERRER: 'brainliest_referrer'
} as const;

export class CookieManager {
  private static readonly CONSENT_COOKIE = COOKIE_NAMES.CONSENT;
  private static readonly DEFAULT_PREFERENCES: CookieConsentPreferences = {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false
  };

  /**
   * Get current consent status and preferences
   */
  static getConsentStatus(): { hasConsented: boolean; preferences: CookieConsentPreferences } {
    try {
      const cookieValue = this.getCookie(this.CONSENT_COOKIE);
      if (!cookieValue) {
        return { hasConsented: false, preferences: this.DEFAULT_PREFERENCES };
      }

      const consentData: CookieConsentData = JSON.parse(cookieValue);
      return {
        hasConsented: consentData.accepted,
        preferences: consentData.preferences || this.DEFAULT_PREFERENCES
      };
    } catch (error) {
      console.error('Error getting consent status:', error);
      return { hasConsented: false, preferences: this.DEFAULT_PREFERENCES };
    }
  }

  /**
   * Set consent preferences
   */
  static setConsentPreferences(preferences: CookieConsentPreferences): void {
    const consentData: CookieConsentData = {
      accepted: true,
      timestamp: Date.now(),
      preferences,
      version: '1.0.0',
      sessionId: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.setCookie(this.CONSENT_COOKIE, JSON.stringify(consentData), 365);
    
    // Store in localStorage as backup
    try {
      localStorage.setItem(this.CONSENT_COOKIE, JSON.stringify(consentData));
    } catch (error) {
      console.warn('Could not store consent in localStorage:', error);
    }
  }

  /**
   * Get cookie value
   */
  private static getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  /**
   * Set cookie with expiration
   */
  private static setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
  }

  /**
   * Delete cookie
   */
  static deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }

  /**
   * Clear all cookies based on consent preferences
   */
  static enforceConsentPreferences(preferences: CookieConsentPreferences): void {
    if (!preferences.functional) {
      this.deleteCookie(COOKIE_NAMES.PREFERENCES);
      this.deleteCookie(COOKIE_NAMES.THEME);
      this.deleteCookie(COOKIE_NAMES.LANGUAGE);
    }

    if (!preferences.analytics) {
      this.deleteCookie(COOKIE_NAMES.ANALYTICS_ID);
      this.deleteCookie(COOKIE_NAMES.SESSION_START);
      this.deleteCookie(COOKIE_NAMES.PAGE_VIEWS);
    }

    if (!preferences.marketing) {
      this.deleteCookie(COOKIE_NAMES.MARKETING_ID);
      this.deleteCookie(COOKIE_NAMES.UTM_SOURCE);
      this.deleteCookie(COOKIE_NAMES.REFERRER);
    }
  }

  /**
   * Get all current cookies
   */
  static getAllCookies(): Record<string, string> {
    const cookies: Record<string, string> = {};
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
    return cookies;
  }
}