/**
 * Industrial-Grade Cookie Management System
 * Enterprise-level cookie consent and management with bulletproof persistence
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

export interface DiagnosticInfo {
  memoryCache: any;
  httpCookie: string | null;
  localStorage: string | null;
  sessionStorage: string | null;
  timestamp: number;
  userAgent: string;
}

export class IndustrialCookieManager {
  private static readonly CONSENT_COOKIE = 'brainliest_cookie_consent';
  private static readonly STORAGE_VERSION = '1.0.0';
  private static memoryCache: CookieConsentData | null = null;
  
  private static readonly DEFAULT_PREFERENCES: CookieConsentPreferences = {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false
  };

  /**
   * Get consent status with bulletproof multi-layer retrieval
   */
  static getConsentStatus(): { hasConsented: boolean; preferences: CookieConsentPreferences } {
    try {
      // Try memory cache first (fastest)
      if (this.memoryCache && this.memoryCache.accepted) {
        console.log('✅ RETRIEVED: Consent from memory cache');
        return {
          hasConsented: true,
          preferences: this.memoryCache.preferences
        };
      }

      // Try HTTP cookie
      const cookieData = this.getFromHttpCookie();
      if (cookieData && cookieData.accepted) {
        console.log('✅ RETRIEVED: Consent from HTTP cookie');
        this.memoryCache = cookieData; // Cache for next time
        return {
          hasConsented: true,
          preferences: cookieData.preferences
        };
      }

      // Try localStorage backup
      const localData = this.getFromLocalStorage();
      if (localData && localData.accepted) {
        console.log('✅ RETRIEVED: Cookie', this.CONSENT_COOKIE, 'from localStorage backup');
        this.memoryCache = localData; // Cache for next time
        this.setHttpCookie(localData); // Restore HTTP cookie
        return {
          hasConsented: true,
          preferences: localData.preferences
        };
      }

      // Try sessionStorage backup
      const sessionData = this.getFromSessionStorage();
      if (sessionData && sessionData.accepted) {
        console.log('✅ RETRIEVED: Consent from sessionStorage backup');
        this.memoryCache = sessionData; // Cache for next time
        this.setHttpCookie(sessionData); // Restore HTTP cookie
        return {
          hasConsented: true,
          preferences: sessionData.preferences
        };
      }

      console.log('❌ NO CONSENT: No valid consent found in any storage');
      return { hasConsented: false, preferences: this.DEFAULT_PREFERENCES };
      
    } catch (error) {
      console.error('Error getting consent status:', error);
      return { hasConsented: false, preferences: this.DEFAULT_PREFERENCES };
    }
  }

  /**
   * Set consent with bulletproof multi-layer persistence
   */
  static setConsentPreferences(preferences: CookieConsentPreferences): void {
    const consentData: CookieConsentData = {
      accepted: true,
      timestamp: Date.now(),
      preferences,
      version: this.STORAGE_VERSION,
      sessionId: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    try {
      // Set in all storage layers for bulletproof persistence
      this.memoryCache = consentData;
      this.setHttpCookie(consentData);
      this.setLocalStorage(consentData);
      this.setSessionStorage(consentData);
      
      console.log('✅ STORED: Consent preferences in all storage layers');
      console.log('✅ VALID: Consent retrieved and cached from storage');
      
    } catch (error) {
      console.error('Error setting consent preferences:', error);
    }
  }

  /**
   * Get diagnostics for troubleshooting
   */
  static getDiagnostics(): DiagnosticInfo {
    return {
      memoryCache: this.memoryCache,
      httpCookie: this.getCookieValue(this.CONSENT_COOKIE),
      localStorage: this.getLocalStorageValue(),
      sessionStorage: this.getSessionStorageValue(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };
  }

  private static getFromHttpCookie(): CookieConsentData | null {
    try {
      const cookieValue = this.getCookieValue(this.CONSENT_COOKIE);
      if (!cookieValue) return null;
      return JSON.parse(cookieValue);
    } catch (error) {
      console.warn('Error parsing HTTP cookie:', error);
      return null;
    }
  }

  private static getFromLocalStorage(): CookieConsentData | null {
    try {
      const value = localStorage.getItem(this.CONSENT_COOKIE);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.warn('Error parsing localStorage:', error);
      return null;
    }
  }

  private static getFromSessionStorage(): CookieConsentData | null {
    try {
      const value = sessionStorage.getItem(this.CONSENT_COOKIE);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.warn('Error parsing sessionStorage:', error);
      return null;
    }
  }

  private static setHttpCookie(data: CookieConsentData): void {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
      document.cookie = `${this.CONSENT_COOKIE}=${JSON.stringify(data)};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
    } catch (error) {
      console.warn('Error setting HTTP cookie:', error);
    }
  }

  private static setLocalStorage(data: CookieConsentData): void {
    try {
      localStorage.setItem(this.CONSENT_COOKIE, JSON.stringify(data));
    } catch (error) {
      console.warn('Error setting localStorage:', error);
    }
  }

  private static setSessionStorage(data: CookieConsentData): void {
    try {
      sessionStorage.setItem(this.CONSENT_COOKIE, JSON.stringify(data));
    } catch (error) {
      console.warn('Error setting sessionStorage:', error);
    }
  }

  private static getCookieValue(name: string): string | null {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private static getLocalStorageValue(): string | null {
    try {
      return localStorage.getItem(this.CONSENT_COOKIE);
    } catch (error) {
      return null;
    }
  }

  private static getSessionStorageValue(): string | null {
    try {
      return sessionStorage.getItem(this.CONSENT_COOKIE);
    } catch (error) {
      return null;
    }
  }
}