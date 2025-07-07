// Authentication API utilities for secure communication with backend
import { apiRequest } from "@/services/queryClient";

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

// Secure token storage
class TokenStorage {
  private static ACCESS_TOKEN_KEY = 'brainliest_access_token';
  private static REFRESH_TOKEN_KEY = 'brainliest_refresh_token';
  private static USER_KEY = 'brainliest_user';

  static setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setUser(user: AuthUser) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser(): AuthUser | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  static clear() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

export { TokenStorage };

// Authentication API functions
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
    
    // Debug: Log the exact payload being sent to backend
    console.log('AuthAPI register payload:', {
      ...payload,
      password: '***hidden***'
    });
    
    const response = await apiRequest("/api/auth/register", "POST", payload);
    return response.json();
  },

  async login(email: string, password: string, recaptchaToken?: string): Promise<AuthResponse> {
    const response = await apiRequest("/api/auth/login", "POST", {
      email,
      password,
      recaptchaToken
    });
    return response.json();
  },

  async googleOAuth(googleData: {
    email: string;
    googleId: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  }): Promise<AuthResponse> {
    const response = await apiRequest("/api/auth/oauth/google", "POST", googleData);
    return response.json();
  },

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest("/api/auth/verify-email", "POST", { token });
    return response.json();
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest("/api/auth/request-password-reset", "POST", { email });
    return response.json();
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest("/api/auth/reset-password", "POST", { token, newPassword });
    return response.json();
  },

  async verifyToken(token: string): Promise<TokenVerificationResponse> {
    const response = await apiRequest("/api/auth/verify-token", "POST", { token });
    return response.json();
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiRequest("/api/auth/refresh-token", "POST", { refreshToken });
    return response.json();
  },

  async logout(token: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest("/api/auth/logout", "POST", { token });
    return response.json();
  },

  async logoutAll(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest("/api/auth/logout-all", "POST", { userId });
    return response.json();
  }
};

// Utility functions for authentication state management
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
          const refreshResponse = await authAPI.refreshToken(refreshToken);
          if (refreshResponse.success && refreshResponse.user && refreshResponse.accessToken) {
            TokenStorage.setTokens(refreshResponse.accessToken, refreshResponse.refreshToken);
            TokenStorage.setUser(refreshResponse.user);
            return refreshResponse.user;
          }
        }
      }
    } catch (error) {
      // Silently handle auth initialization errors (normal when no valid token exists)
      if (error instanceof Error && !error.message.includes('404') && !error.message.includes('401')) {
        console.warn("Auth initialization warning:", error.message);
      }
    }

    // Clear invalid tokens
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
    if (token) {
      try {
        await authAPI.logout(token);
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    TokenStorage.clear();
  }
};