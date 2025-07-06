// Authentication API utilities for secure communication with backend
import { apiRequest } from "./queryClient";

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
  }): Promise<AuthResponse> {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        ...userData
      })
    });
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password
      })
    });
  },

  async googleOAuth(googleData: {
    email: string;
    googleId: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  }): Promise<AuthResponse> {
    return apiRequest("/api/auth/oauth/google", {
      method: "POST",
      body: JSON.stringify(googleData)
    });
  },

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    return apiRequest("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token })
    });
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    return apiRequest("/api/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return apiRequest("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword })
    });
  },

  async verifyToken(token: string): Promise<TokenVerificationResponse> {
    return apiRequest("/api/auth/verify-token", {
      method: "POST",
      body: JSON.stringify({ token })
    });
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiRequest("/api/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refreshToken })
    });
  },

  async logout(token: string): Promise<{ success: boolean; message: string }> {
    return apiRequest("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ token })
    });
  },

  async logoutAll(userId: number): Promise<{ success: boolean; message: string }> {
    return apiRequest("/api/auth/logout-all", {
      method: "POST",
      body: JSON.stringify({ userId })
    });
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
      console.error("Auth initialization error:", error);
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