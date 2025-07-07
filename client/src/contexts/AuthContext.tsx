import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { googleAuthService } from "@/lib/google-auth";
import { authAPI, authUtils, TokenStorage, type AuthUser } from "@/lib/auth-api";

interface AuthContextType {
  isSignedIn: boolean;
  userName: string;
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string; requiresEmailVerification?: boolean }>;
  signUp: (email: string, password: string, userData?: { username?: string; firstName?: string; lastName?: string }) => Promise<{ success: boolean; message?: string; requiresEmailVerification?: boolean }>;
  signInWithGoogle: () => Promise<void>;
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
    // Initialize authentication state
    const initAuth = async () => {
      try {
        // Check for OAuth callback parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const authStatus = urlParams.get('auth');
        const userEmail = urlParams.get('user');
        const error = urlParams.get('error');
        const errorMessage = urlParams.get('message');

        if (authStatus === 'success' && userEmail) {
          console.log('✅ OAuth callback success, user:', userEmail);
          
          // Check session cookie for JWT token (set by server)
          const authenticatedUser = await authUtils.initializeAuth();
          if (authenticatedUser) {
            setUser(authenticatedUser);
            setUserName(authenticatedUser.firstName || authenticatedUser.username || authenticatedUser.email);
            setIsSignedIn(true);
          }
          
          // Clean up URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (error) {
          console.error('❌ OAuth error:', error, errorMessage);
          // Clean up URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          // Initialize Google Auth service for popup fallback (if needed)
          await googleAuthService.initialize();
          
          // Check for existing JWT authentication
          const authenticatedUser = await authUtils.initializeAuth();
          if (authenticatedUser) {
            setUser(authenticatedUser);
            setUserName(authenticatedUser.firstName || authenticatedUser.username || authenticatedUser.email);
            setIsSignedIn(true);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
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
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        message: "Login failed. Please try again."
      };
    }
  };

  const signUp = async (email: string, password: string, userData?: { username?: string; firstName?: string; lastName?: string }) => {
    try {
      const response = await authAPI.register(email, password, userData);
      
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
          setUserName(authenticatedUser.firstName || authenticatedUser.username || authenticatedUser.email);
          setIsSignedIn(true);
        }
        
        return { success: true };
      }

      return {
        success: false,
        message: response.message || "Registration failed"
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        message: "Registration failed. Please try again."
      };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🚀 Starting Google sign-in popup...');
      
      // Create Google OAuth URL for popup
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `scope=openid email profile&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=popup&` +
        `access_type=offline&` +
        `prompt=select_account`;

      // Open Google OAuth in a popup window
      const popup = window.open(
        authUrl,
        'GoogleSignIn',
        'width=500,height=600,scrollbars=yes,resizable=yes,status=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Listen for popup completion
      return new Promise<void>((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            window.removeEventListener('message', messageHandler);
            popup.close();
            
            // Reload to pick up the session cookie
            window.location.reload();
            resolve();
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            window.removeEventListener('message', messageHandler);
            popup.close();
            reject(new Error(event.data.error || 'Google authentication failed'));
          }
        };

        window.addEventListener('message', messageHandler);

        // Check if popup was closed manually
        const popupChecker = setInterval(() => {
          if (popup.closed) {
            clearInterval(popupChecker);
            window.removeEventListener('message', messageHandler);
            reject(new Error('Authentication cancelled by user'));
          }
        }, 1000);

        // Set timeout
        setTimeout(() => {
          clearInterval(popupChecker);
          window.removeEventListener('message', messageHandler);
          if (!popup.closed) {
            popup.close();
          }
          reject(new Error('Authentication timeout. Please try again.'));
        }, 300000); // 5 minutes
      });
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authUtils.handleLogout();
      
      // Sign out from Google if user was signed in with Google
      if (user?.oauthProvider === 'google') {
        try {
          await googleAuthService.signOut();
        } catch (error) {
          console.error('Google sign out error:', error);
        }
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSignedIn(false);
      setUserName("");
      setUser(null);
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      return await authAPI.verifyEmail(token);
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: "Email verification failed. Please try again."
      };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      return await authAPI.requestPasswordReset(email);
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        message: "Failed to send password reset email. Please try again."
      };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      return await authAPI.resetPassword(token, newPassword);
    } catch (error) {
      console.error('Password reset error:', error);
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