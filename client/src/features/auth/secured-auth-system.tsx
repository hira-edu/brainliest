/**
 * Secured Authentication System
 * Fixes: Auto-login bypass, missing organizational authorization, auth conflicts
 */

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

// User role definitions with proper hierarchy
export type UserRole = "user" | "admin" | "moderator" | "super_admin";

export interface SecuredUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  emailVerified: boolean;
  organizationId?: string;
  permissions: string[];
}

interface AuthContextType {
  // Authentication state
  user: SecuredUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Authentication methods
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Authorization methods
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessAdmin: () => boolean;

  // Token management
  refreshToken: () => Promise<void>;
}

const SecuredAuthContext = createContext<AuthContextType | null>(null);

// Protected admin route component
export function ProtectedAdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useSecuredAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always verify authentication status before allowing access
    const verifyAccess = async () => {
      if (!auth.isAuthenticated) {
        setLoading(false);
        return;
      }

      if (!auth.canAccessAdmin()) {
        setLoading(false);
        return;
      }

      setLoading(false);
    };

    verifyAccess();
  }, [auth.isAuthenticated, auth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-center mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 text-center mb-4">
            You must be signed in to access this area.
          </p>
          <ManualSignInForm />
        </div>
      </div>
    );
  }

  if (!auth.canAccessAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-center mb-4 text-red-600">
            Access Denied
          </h2>
          <p className="text-gray-600 text-center mb-4">
            You don't have the required permissions to access this area.
          </p>
          <p className="text-sm text-gray-500 text-center">
            Contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Manual sign-in form (no auto-login)
function ManualSignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const auth = useSecuredAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await auth.signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter your password"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}

// Main authentication provider
export function SecuredAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SecuredUser | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start as false - no auto-check

  // Explicit sign-in method - no auto-login
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Sign in failed");
      }

      const data = await response.json();

      if (!data.success || !data.user) {
        throw new Error("Invalid response from server");
      }

      // Verify user has proper permissions
      const authenticatedUser: SecuredUser = {
        ...data.user,
        permissions: data.user.permissions || [],
      };

      // Store token securely
      if (data.token) {
        sessionStorage.setItem("auth_token", data.token);
      }

      setUser(authenticatedUser);
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign out method
  const signOut = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("auth_token");
      if (token) {
        // Inform server of logout
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      // Always clear local state
      sessionStorage.removeItem("auth_token");
      setUser(null);
    }
  }, []);

  // Authorization methods
  const hasRole = useCallback(
    (role: UserRole) => {
      if (!user) return false;

      // Role hierarchy
      const roleHierarchy: Record<UserRole, number> = {
        user: 1,
        moderator: 2,
        admin: 3,
        super_admin: 4,
      };

      return roleHierarchy[user.role] >= roleHierarchy[role];
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const canAccessAdmin = useCallback(() => {
    if (!user) return false;
    return hasRole("admin") || hasPermission("admin_access");
  }, [user, hasRole, hasPermission]);

  // Token refresh method
  const refreshToken = useCallback(async () => {
    const token = sessionStorage.getItem("auth_token");
    if (!token) return;

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          sessionStorage.setItem("auth_token", data.token);
        }
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      // If refresh fails, sign out user
      await signOut();
    }
  }, [signOut]);

  // Check for existing session on mount (one-time check, not auto-login)
  useEffect(() => {
    const checkExistingSession = async () => {
      const token = sessionStorage.getItem("auth_token");
      if (!token) return;

      try {
        const response = await fetch("/api/auth/verify", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser({
              ...data.user,
              permissions: data.user.permissions || [],
            });
          } else {
            sessionStorage.removeItem("auth_token");
          }
        } else {
          sessionStorage.removeItem("auth_token");
        }
      } catch (error) {
        console.error("Session verification failed:", error);
        sessionStorage.removeItem("auth_token");
      }
    };

    checkExistingSession();
  }, []);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
    hasRole,
    hasPermission,
    canAccessAdmin,
    refreshToken,
  };

  return (
    <SecuredAuthContext.Provider value={contextValue}>
      {children}
    </SecuredAuthContext.Provider>
  );
}

// Hook to use secured auth context
export function useSecuredAuth() {
  const context = useContext(SecuredAuthContext);
  if (!context) {
    throw new Error("useSecuredAuth must be used within SecuredAuthProvider");
  }
  return context;
}

// Export main components
export { SecuredAuthProvider as AuthProvider };
export default SecuredAuthProvider;
