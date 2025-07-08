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

export const COOKIE_REGISTRY = {
  // Essential cookies
  CONSENT: 'brainliest_cookie_consent',
  SESSION: 'brainliest_session',
  CSRF: 'brainliest_csrf_token',
  
  // Functional cookies  
  PREFERENCES: 'brainliest_user_prefs',
  THEME: 'brainliest_theme',
  LANGUAGE: 'brainliest_lang',
  
  // Analytics cookies
  ANALYTICS_ID: 'brainliest_analytics_id',
  SESSION_START: 'brainliest_session_start',
  PAGE_VIEWS: 'brainliest_page_views',
  
  // Marketing cookies
  MARKETING_ID: 'brainliest_marketing_id',
  UTM_SOURCE: 'brainliest_utm_source',
  REFERRER: 'brainliest_referrer'
} as const;

export class CookieManager {
  private static readonly CONSENT_COOKIE = COOKIE_REGISTRY.CONSENT;
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
      this.deleteCookie(COOKIE_REGISTRY.PREFERENCES);
      this.deleteCookie(COOKIE_REGISTRY.THEME);
      this.deleteCookie(COOKIE_REGISTRY.LANGUAGE);
    }

    if (!preferences.analytics) {
      this.deleteCookie(COOKIE_REGISTRY.ANALYTICS_ID);
      this.deleteCookie(COOKIE_REGISTRY.SESSION_START);
      this.deleteCookie(COOKIE_REGISTRY.PAGE_VIEWS);
    }

    if (!preferences.marketing) {
      this.deleteCookie(COOKIE_REGISTRY.MARKETING_ID);
      this.deleteCookie(COOKIE_REGISTRY.UTM_SOURCE);
      this.deleteCookie(COOKIE_REGISTRY.REFERRER);
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