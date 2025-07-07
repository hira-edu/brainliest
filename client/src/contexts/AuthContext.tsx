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
        // Initialize Google Auth service
        await googleAuthService.initialize();
        
        // Check for existing JWT authentication
        const authenticatedUser = await authUtils.initializeAuth();
        if (authenticatedUser) {
          setUser(authenticatedUser);
          setUserName(authenticatedUser.firstName || authenticatedUser.username || authenticatedUser.email);
          setIsSignedIn(true);
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
      console.log('🚀 Starting Google sign-in process...');
      
      // The new OAuth flow handles authentication entirely through the callback
      // and returns the authentication result via postMessage
      const authResult = await googleAuthService.signIn();
      
      console.log('✅ Google sign-in successful:', authResult);
      
      // The authentication is already processed by the server callback
      // We just need to handle the final user state update
      if (authResult && authResult.email) {
        // Create a simplified user object from Google user data
        const user = {
          id: 0, // Will be set by backend
          email: authResult.email,
          username: authResult.email,
          firstName: authResult.given_name || authResult.name?.split(' ')[0],
          lastName: authResult.family_name || authResult.name?.split(' ')[1],
          profileImage: authResult.picture,
          role: 'user',
          emailVerified: true,
          oauthProvider: 'google'
        };
        
        setUser(user);
        setUserName(user.firstName || user.username || user.email);
        setIsSignedIn(true);
      } else {
        throw new Error("Invalid authentication response");
      }
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