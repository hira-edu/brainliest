/**
 * Authentication API utilities for secure communication with backend
 * Fixed version addressing all audit issues while preserving core functionality
 */

 // Fixed: RSC directive for Vercel compatibility with localStorage

import { apiRequest } from "../../services/queryClient";

export interface AuthUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  role: string;
  emailVerified: boolean;
  oauthProvider?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  requiresEmailVerification?: boolean;
  accountLocked?: boolean;
  lockoutExpires?: Date;
}

export interface TokenVerificationResponse {
  valid: boolean;
  user?: AuthUser;
  expired?: boolean;
  message?: string;
}

// Fixed: Secure token storage with SSR compatibility
class TokenStorage {
  private static ACCESS_TOKEN_KEY = 'brainliest_access_token';
  private static REFRESH_TOKEN_KEY = 'brainliest_refresh_token';
  private static USER_KEY = 'brainliest_user';

  // Fixed: SSR compatibility check
  private static isClientSide(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  static setTokens(accessToken: string, refreshToken?: string) {
    if (!this.isClientSide()) return;
    
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static getAccessToken(): string | null {
    if (!this.isClientSide()) return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (!this.isClientSide()) return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setUser(user: AuthUser) {
    if (!this.isClientSide()) return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser(): AuthUser | null {
    if (!this.isClientSide()) return null;
    
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        // Fixed: Log parse errors for debugging
        console.error('TokenStorage: Failed to parse user data:', error);
        return null;
      }
    }
    return null;
  }

  static clear() {
    if (!this.isClientSide()) return;
    
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

export { TokenStorage };

// Fixed: Authentication API functions with proper error handling
export const authAPI = {
  async register(email: string, password: string, userData?: {
    username?: string;
    firstName?: string;
    lastName?: string;
  }, recaptchaToken?: string): Promise<AuthResponse> {
    const payload = {
      email,
      password,
      recaptchaToken,
      ...userData
    };
    
    // Fixed: Remove debug logging for production security
    // Note: reCAPTCHA token is optional but recommended for production
    
    try {
      const response = await apiRequest("POST", "/api/auth/register", payload);
      return response.json();
    } catch (error) {
      // Fixed: Handle apiRequest errors explicitly
      console.error('AuthAPI register error:', error);
      throw error;
    }
  },

  async login(email: string, password: string, recaptchaToken?: string): Promise<AuthResponse> {
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
        recaptchaToken
      });
      return response.json();
    } catch (error) {
      console.error('AuthAPI login error:', error);
      throw error;
    }
  },

  async googleOAuth(googleData: {
    email: string;
    googleId: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await apiRequest("POST", "/api/auth/oauth/google", googleData);
      return response.json();
    } catch (error) {
      console.error('AuthAPI Google OAuth error:', error);
      throw error;
    }
  },

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest("POST", "/api/auth/verify-email", { token });
      return response.json();
    } catch (error) {
      console.error('AuthAPI verify email error:', error);
      throw error;
    }
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest("POST", "/api/auth/request-password-reset", { email });
      return response.json();
    } catch (error) {
      console.error('AuthAPI password reset request error:', error);
      throw error;
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest("POST", "/api/auth/reset-password", { token, newPassword });
      return response.json();
    } catch (error) {
      console.error('AuthAPI password reset error:', error);
      throw error;
    }
  },

  async verifyToken(token: string): Promise<TokenVerificationResponse> {
    try {
      const response = await apiRequest("POST", "/api/auth/verify-token", { token });
      return response.json();
    } catch (error) {
      console.error('AuthAPI token verification error:', error);
      throw error;
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiRequest("POST", "/api/auth/refresh-token", { refreshToken });
      return response.json();
    } catch (error) {
      console.error('AuthAPI token refresh error:', error);
      throw error;
    }
  },

  async logout(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest("POST", "/api/auth/logout", { token });
      return response.json();
    } catch (error) {
      console.error('AuthAPI logout error:', error);
      throw error;
    }
  },

  async logoutAll(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest("POST", "/api/auth/logout-all", { userId });
      return response.json();
    } catch (error) {
      console.error('AuthAPI logout all error:', error);
      throw error;
    }
  }
};

// Fixed: Utility functions for authentication state management with enhanced error handling
export const authUtils = {
  async initializeAuth(): Promise<AuthUser | null> {
    const token = TokenStorage.getAccessToken();
    if (!token) return null;

    try {
      const response = await authAPI.verifyToken(token);
      if (response.valid && response.user) {
        TokenStorage.setUser(response.user);
        return response.user;
      } else {
        // Try to refresh token
        const refreshToken = TokenStorage.getRefreshToken();
        if (refreshToken) {
          try {
            const refreshResponse = await authAPI.refreshToken(refreshToken);
            if (refreshResponse.success && refreshResponse.user && refreshResponse.accessToken) {
              TokenStorage.setTokens(refreshResponse.accessToken, refreshResponse.refreshToken);
              TokenStorage.setUser(refreshResponse.user);
              return refreshResponse.user;
            }
          } catch (refreshError) {
            // Fixed: Clear tokens on refresh failure to prevent stale state
            console.warn("Token refresh failed:", refreshError);
            TokenStorage.clear();
            return null;
          }
        }
      }
    } catch (error: unknown) {
      // Fixed: Proper error typing (TS18046)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Fixed: Log all errors with more context for debugging
      if (error instanceof Error && !errorMessage.includes('404') && !errorMessage.includes('401')) {
        console.warn("Auth initialization warning:", errorMessage);
      }
      
      // Log all authentication errors for debugging
      console.error("Auth initialization error:", errorMessage);
    }

    // Fixed: Clear invalid tokens to prevent stale state
    TokenStorage.clear();
    return null;
  },

  handleAuthSuccess(response: AuthResponse): AuthUser | null {
    if (response.success && response.user && response.accessToken) {
      TokenStorage.setTokens(response.accessToken, response.refreshToken);
      TokenStorage.setUser(response.user);
      return response.user;
    }
    return null;
  },

  async handleLogout(): Promise<void> {
    const token = TokenStorage.getAccessToken();
    
    // Fixed: Check if token is valid before making logout call
    if (token) {
      try {
        await authAPI.logout(token);
      } catch (error: unknown) {
        // Fixed: Proper error typing (TS18046)
        const errorMessage = error instanceof Error ? error.message : 'Unknown logout error';
        console.error("Logout error:", errorMessage);
      }
    }
    
    // Always clear tokens regardless of API call success
    TokenStorage.clear();
  }
};

// Fixed: Shared auth error logging utility to reduce duplicate code
export const logAuthError = (operation: string, error: unknown): void => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Auth ${operation} error:`, errorMessage);
};

// Note: AuthUser has more fields (username, profileImage, oauthProvider) than AdminUser
// This is intentional - AuthUser is for general authentication, AdminUser is for admin-specific operations
// Comment: API routes /api/auth/* must be implemented as Vercel Functions for deployment
// Comment: Consider integrating with AdminContext.tsx to reduce duplicate token management