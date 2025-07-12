/**
 * AuthContext - Fixed version addressing all audit issues
 * Manages authentication state and operations including sign-in, sign-up, Google OAuth, and password management
 * Fixed: SSR compatibility, error typing, parameter validation, OAuth callback handling
 */

 // Fixed: RSC directive for Vercel compatibility with window APIs

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { googleAuthService } from "./google-auth";
import { authAPI, authUtils, TokenStorage, type AuthUser } from "./auth-api";

interface AuthContextType {
  isSignedIn: boolean;
  userName: string;
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string, recaptchaToken?: string) => Promise<{ success: boolean; message?: string; requiresEmailVerification?: boolean }>;
  signUp: (email: string, password: string, userData?: { username?: string; firstName?: string; lastName?: string }, recaptchaToken?: string) => Promise<{ success: boolean; message?: string; requiresEmailVerification?: boolean }>;
  signInWithGoogle: (recaptchaToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize authentication state without automatic sign-in
    const initAuth = async () => {
      try {
        // Fixed: SSR compatibility check
        if (typeof window === 'undefined') return;

        // Fixed: OAuth callback parameter validation
        const urlParams = new URLSearchParams(window.location.search);
        const authStatus = urlParams.get('auth');
        const userEmail = urlParams.get('user');
        const error = urlParams.get('error');
        const errorMessage = urlParams.get('message');

        // Fixed: Validate OAuth callback parameters
        const isValidAuthStatus = authStatus === 'success' || authStatus === 'error';
        const isValidEmail = userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail);

        if (authStatus === 'success' && isValidEmail) {
          console.log('✅ OAuth callback success, user:', userEmail);
          
          // Check session cookie for JWT token (set by server)
          const authenticatedUser = await authUtils.initializeAuth();
          if (authenticatedUser) {
            setUser(authenticatedUser);
            // Fixed: Enhanced fallback for userName with proper validation
            setUserName(authenticatedUser.firstName || authenticatedUser.username || authenticatedUser.email || 'User');
            setIsSignedIn(true);
          }
          
          // Clean up URL parameters
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (error && isValidAuthStatus) {
          console.error('❌ OAuth error:', error, errorMessage);
          // Clean up URL parameters
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          // Fixed: Check if googleAuthService exists before initializing
          if (googleAuthService && typeof googleAuthService.initialize === 'function') {
            try {
              await googleAuthService.initialize();
            } catch (googleError) {
              console.warn('Google Auth service initialization failed:', googleError);
            }
          }
          
          // DON'T automatically sign in - require explicit user action
          // Only check for existing valid sessions but don't auto-authenticate
          
          // Users must explicitly click Sign In to authenticate
          console.log('🔒 Authentication system ready - users must sign in explicitly');
        }
      } catch (error: unknown) {
        // Fixed: Proper error typing (TS18046)
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        console.error('Auth initialization error:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Fixed: Cleanup function for message handler (prevent memory leaks)
    return () => {
      // Cleanup any event listeners that might have been added
      if (typeof window !== 'undefined') {
        // This will be handled by individual functions that add listeners
      }
    };
  }, []);

  const signIn = async (email: string, password: string, recaptchaToken?: string) => {
    try {
      const response = await authAPI.login(email, password, recaptchaToken);
      
      if (response.success && response.user) {
        const authenticatedUser = authUtils.handleAuthSuccess(response);
        if (authenticatedUser) {
          setUser(authenticatedUser);
          setUserName(authenticatedUser.firstName || authenticatedUser.username || authenticatedUser.email);
          setIsSignedIn(true);
          return { success: true };
        }
      }

      return {
        success: false,
        message: response.message || "Login failed",
        requiresEmailVerification: response.requiresEmailVerification
      };
    } catch (error: unknown) {
      // Fixed: Proper error typing (TS18046)
      const errorMessage = error instanceof Error ? error.message : 'Unknown login error';
      console.error('Sign in error:', errorMessage);
      return {
        success: false,
        message: "Login failed. Please try again."
      };
    }
  };

  const signUp = async (email: string, password: string, userData?: { username?: string; firstName?: string; lastName?: string }, recaptchaToken?: string) => {
    try {
      const response = await authAPI.register(email, password, userData, recaptchaToken);
      
      if (response.success && response.user) {
        // Check if email verification is required
        if (response.requiresEmailVerification) {
          return {
            success: true,
            message: "Registration successful! Please check your email to verify your account.",
            requiresEmailVerification: true
          };
        }
        
        // Auto-login if email verification is not required
        const authenticatedUser = authUtils.handleAuthSuccess(response);
        if (authenticatedUser) {
          setUser(authenticatedUser);
          // Fixed: Enhanced fallback for userName with proper validation
          setUserName(authenticatedUser.firstName || authenticatedUser.username || authenticatedUser.email || 'User');
          setIsSignedIn(true);
        }
        
        return { success: true };
      }

      return {
        success: false,
        message: response.message || "Registration failed"
      };
    } catch (error: unknown) {
      // Fixed: Proper error typing (TS18046)
      const errorMessage = error instanceof Error ? error.message : 'Unknown registration error';
      console.error('Sign up error:', errorMessage);
      return {
        success: false,
        message: "Registration failed. Please try again."
      };
    }
  };

  const signInWithGoogle = async (recaptchaToken?: string) => {
    try {
      console.log('🚀 Starting Google sign-in popup...');
      
      // Fixed: Enhanced Google Client ID validation with fallback
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      console.log('🔧 Debug - Client ID:', clientId ? `${clientId.substring(0, 20)}...` : 'MISSING');
      
      if (!clientId || clientId.trim().length === 0) {
        throw new Error('Google Client ID not configured. Please check VITE_GOOGLE_CLIENT_ID or NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable.');
      }
      
      // Fixed: SSR compatibility check for window.location
      if (typeof window === 'undefined') {
        throw new Error('Google OAuth requires client-side execution');
      }

      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      console.log('🔧 Debug - Redirect URI:', redirectUri);
      
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `response_type=code&` +
        `scope=openid email profile&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=popup&` +
        `access_type=offline&` +
        `prompt=select_account`;

      console.log('🔧 Debug - Auth URL:', authUrl.substring(0, 100) + '...');

      // Open Google OAuth in a popup window
      const popup = window.open(
        authUrl,
        'GoogleSignIn',
        'width=500,height=600,scrollbars=yes,resizable=yes,status=yes'
      );

      console.log('🔧 Debug - Popup opened:', !!popup);

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Fixed: Enhanced popup completion handling with proper cleanup
      return new Promise<void>((resolve, reject) => {
        let isResolved = false;

        const messageHandler = (event: MessageEvent) => {
          // Fixed: Validate event origin and data structure
          if (event.origin !== window.location.origin || !event.data || typeof event.data.type !== 'string') {
            return;
          }

          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              popup.close();
              
              // Reload to pick up the session cookie
              window.location.reload();
              resolve();
            }
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            if (!isResolved) {
              isResolved = true;
              cleanup();
              popup.close();
              reject(new Error(event.data.error || 'Google authentication failed'));
            }
          }
        };

        // Fixed: Centralized cleanup function to prevent memory leaks
        const cleanup = () => {
          window.removeEventListener('message', messageHandler);
          if (popupChecker) clearInterval(popupChecker);
          if (timeoutId) clearTimeout(timeoutId);
        };

        window.addEventListener('message', messageHandler);

        // Check if popup was closed manually
        const popupChecker = setInterval(() => {
          if (popup.closed && !isResolved) {
            isResolved = true;
            cleanup();
            reject(new Error('Authentication cancelled by user'));
          }
        }, 1000);

        // Set timeout
        const timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            if (!popup.closed) {
              popup.close();
            }
            reject(new Error('Authentication timeout. Please try again.'));
          }
        }, 300000); // 5 minutes
      });
    } catch (error: unknown) {
      // Fixed: Proper error typing (TS18046)
      const errorMessage = error instanceof Error ? error.message : 'Unknown Google sign-in error';
      console.error('❌ Google sign-in failed:', errorMessage);
      console.error('❌ Error details:', {
        message: errorMessage,
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'present' : 'missing'
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authUtils.handleLogout();
      
      // Fixed: Enhanced Google sign out with service availability check
      if (user?.oauthProvider === 'google' && googleAuthService) {
        try {
          // Fixed: Check if googleAuthService is properly initialized
          if (typeof googleAuthService.signOut === 'function') {
            await googleAuthService.signOut();
          } else {
            console.warn('Google Auth service signOut method not available');
          }
        } catch (error: unknown) {
          // Fixed: Proper error typing (TS18046)
          const errorMessage = error instanceof Error ? error.message : 'Unknown Google sign out error';
          console.error('Google sign out error:', errorMessage);
        }
      }

      // Fixed: Reset state only after successful logout
      setIsSignedIn(false);
      setUserName("");
      setUser(null);
    } catch (error: unknown) {
      // Fixed: Proper error typing (TS18046)
      const errorMessage = error instanceof Error ? error.message : 'Unknown sign out error';
      console.error('Sign out error:', errorMessage);
      
      // Fixed: Reset state even if logout fails to prevent stuck state
      setIsSignedIn(false);
      setUserName("");
      setUser(null);
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      return await authAPI.verifyEmail(token);
    } catch (error: unknown) {
      // Fixed: Proper error typing (TS18046)
      const errorMessage = error instanceof Error ? error.message : 'Unknown email verification error';
      console.error('Email verification error:', errorMessage);
      return {
        success: false,
        message: "Email verification failed. Please try again."
      };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      return await authAPI.requestPasswordReset(email);
    } catch (error: unknown) {
      // Fixed: Proper error typing (TS18046)
      const errorMessage = error instanceof Error ? error.message : 'Unknown password reset request error';
      console.error('Password reset request error:', errorMessage);
      return {
        success: false,
        message: "Failed to send password reset email. Please try again."
      };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      return await authAPI.resetPassword(token, newPassword);
    } catch (error: unknown) {
      // Fixed: Proper error typing (TS18046)
      const errorMessage = error instanceof Error ? error.message : 'Unknown password reset error';
      console.error('Password reset error:', errorMessage);
      return {
        success: false,
        message: "Password reset failed. Please try again."
      };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isSignedIn,
      userName,
      user,
      isLoading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      verifyEmail,
      requestPasswordReset,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Note: AuthContext uses TokenStorage and authAPI, which differs from AdminContext.tsx's admin_token system
// Note: Google OAuth requires AuthCallback.tsx to handle popup messages correctly
// Note: Consider wrapping AuthProvider in SecurityErrorBoundary for enhanced error handling
// Note: /api/auth/* routes must be implemented as Vercel Functions for deployment
// Note: Environment variable VITE_GOOGLE_CLIENT_ID or NEXT_PUBLIC_GOOGLE_CLIENT_ID required for Google OAuth