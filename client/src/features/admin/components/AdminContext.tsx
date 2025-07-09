/**
 * AdminContext Component - Fixed version addressing all audit issues
 * Enterprise-grade admin authentication context with comprehensive error handling and SSR compatibility
 */

"use client"; // Fixed: RSC directive for Vercel compatibility

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  useMemo 
} from 'react';

// Enhanced imports with proper error boundary integration
import { SecurityErrorBoundary } from '../../../components/SecurityErrorBoundary';
import { apiRequest } from '../../../services/queryClient';
import { useToast } from '../../shared/hooks/use-toast';

// Fixed: Comprehensive type definitions with proper nullable handling
interface AdminUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'moderator' | 'user';
  emailVerified: boolean;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Fixed: Enhanced API response interfaces for type safety
interface LoginResponse {
  success: boolean;
  token: string;
  user: AdminUser;
  message?: string;
}

interface AuthStatusResponse {
  valid: boolean;
  user?: AdminUser;
  message?: string;
}

// Fixed: Error type consistency - using Error instead of string
interface AdminContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  trackActivity: () => void;
  clearError: () => void;
  getToken: () => string | null;
  isAuthenticated: boolean;
}

// Fixed: Safe browser environment check utility
const isBrowser = (): boolean => typeof window !== 'undefined';

// Fixed: Safe localStorage access with SSR compatibility
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser()) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail in SSR or when storage is unavailable
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser()) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail in SSR or when storage is unavailable
    }
  }
};

// Fixed: Safe sessionStorage access
const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser()) return null;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser()) return;
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Silently fail in SSR or when storage is unavailable
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser()) return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Silently fail in SSR or when storage is unavailable
    }
  }
};

// Fixed: Safe cookie operations
const safeCookies = {
  remove: (name: string): void => {
    if (!isBrowser()) return;
    try {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`;
    } catch {
      // Silently fail in SSR or when cookies are unavailable
    }
  }
};

// Fixed: Standardized token key (consistent with AdminUsers.tsx)
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_ACTIVITY_KEY = 'admin_last_activity';

// Fixed: Session configuration constants
const SESSION_CONFIG = {
  HEALTH_CHECK_INTERVAL: 2 * 60 * 1000, // 2 minutes
  HEARTBEAT_INTERVAL: 60 * 1000, // 1 minute
  SESSION_WARNING_THRESHOLD: 2 * 60 * 60 * 1000, // 2 hours
  DEBOUNCE_DELAY: 500, // 500ms for auth status checks
} as const;

// Fixed: Debounce utility for auth status checks
function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      func(...args);
    }, delay);
  }, [func, delay]) as T;
}

// Fixed: Reusable token management utility
const useTokenManager = () => {
  const [token, setToken] = useState<string | null>(null);

  const getStoredToken = useCallback((): string | null => {
    return safeLocalStorage.getItem(ADMIN_TOKEN_KEY);
  }, []);

  const storeToken = useCallback((newToken: string): void => {
    safeLocalStorage.setItem(ADMIN_TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const clearToken = useCallback((): void => {
    safeLocalStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
  }, []);

  // Initialize token on mount
  useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken) {
      setToken(storedToken);
    }
  }, [getStoredToken]);

  return { token, getStoredToken, storeToken, clearToken };
};

// Create context with proper error handling
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Fixed: Enhanced useAdmin hook with proper error handling
export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}

// Fixed: Comprehensive session cleanup utility
const useSessionCleanup = () => {
  return useCallback((): void => {
    if (!isBrowser()) return;

    // Clear localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.filter(key => key.startsWith('admin_')).forEach(key => {
        safeLocalStorage.removeItem(key);
      });
    } catch {
      // Silently fail
    }

    // Clear sessionStorage
    try {
      const keys = Object.keys(sessionStorage);
      keys.filter(key => key.startsWith('admin_')).forEach(key => {
        safeSessionStorage.removeItem(key);
      });
    } catch {
      // Silently fail
    }

    // Clear cookies
    try {
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name.startsWith('admin_')) {
          safeCookies.remove(name);
        }
      });
    } catch {
      // Silently fail
    }
  }, []);
};

// Fixed: Enhanced AdminProvider with all audit fixes
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Fixed: Use token manager for consistent token handling
  const { token, getStoredToken, storeToken, clearToken } = useTokenManager();
  
  // Fixed: Use session cleanup utility
  const clearAllSessionData = useSessionCleanup();
  
  // Fixed: Ref management for cleanup
  const sessionValidationInProgress = useRef(false);
  const sessionHealthMonitor = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fixed: Enhanced activity tracking with SSR safety
  const trackActivity = useCallback((): void => {
    if (!isBrowser()) return;
    safeLocalStorage.setItem(ADMIN_ACTIVITY_KEY, Date.now().toString());
  }, []);

  // Fixed: Clear error utility
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Fixed: Enhanced session health monitoring with toast notifications
  const startSessionHealthMonitor = useCallback((): void => {
    if (!isBrowser()) return;
    
    if (sessionHealthMonitor.current) {
      clearInterval(sessionHealthMonitor.current);
    }
    
    sessionHealthMonitor.current = setInterval(() => {
      const lastActivity = safeLocalStorage.getItem(ADMIN_ACTIVITY_KEY);
      if (lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity);
        if (timeSinceActivity > SESSION_CONFIG.SESSION_WARNING_THRESHOLD) {
          const sessionError = new Error('Session expiring soon');
          setError(sessionError);
          toast({
            title: "Session Warning",
            description: "Your session will expire soon. Please save your work.",
            variant: "destructive",
          });
        }
      }
    }, SESSION_CONFIG.HEALTH_CHECK_INTERVAL);
  }, [toast]);

  // Fixed: Enhanced heartbeat with proper cleanup
  const startHeartbeat = useCallback((): void => {
    if (!isBrowser()) return;
    
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    
    heartbeatInterval.current = setInterval(() => {
      trackActivity();
    }, SESSION_CONFIG.HEARTBEAT_INTERVAL);
  }, [trackActivity]);

  // Fixed: Stop all intervals utility
  const stopAllIntervals = useCallback((): void => {
    if (sessionHealthMonitor.current) {
      clearInterval(sessionHealthMonitor.current);
      sessionHealthMonitor.current = null;
    }
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  // Fixed: Enhanced login with proper error handling and type safety
  const login = useCallback(async (
    email: string, 
    password: string, 
    recaptchaToken?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    // Clean up any existing abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Fixed: Use apiRequest for consistent error handling
      const response = await apiRequest('POST', '/api/admin/auth/login', {
        email: email.trim(),
        password,
        recaptchaToken
      }, controller.signal);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data: LoginResponse = await response.json();
      
      // Fixed: Validate response structure
      if (!data.success || !data.token || !data.user) {
        throw new Error('Invalid response from server');
      }
      
      // Fixed: Store token and user data
      storeToken(data.token);
      setAdminUser(data.user);
      trackActivity();
      
      // Start monitoring after successful login
      startSessionHealthMonitor();
      startHeartbeat();
      
      // Fixed: Reset error on successful login
      setError(null);
      
    } catch (err) {
      // Fixed: Proper error type handling
      const error = err instanceof Error ? err : new Error('Login failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [storeToken, trackActivity, startSessionHealthMonitor, startHeartbeat]);

  // Fixed: Enhanced logout with proper cleanup
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Stop all intervals
      stopAllIntervals();
      
      // Clear all session data
      clearAllSessionData();
      clearToken();
      
      // Reset state
      setAdminUser(null);
      setError(null);
      
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
    } catch (err) {
      // Fixed: Proper error handling even in logout
      const error = err instanceof Error ? err : new Error('Logout failed');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [stopAllIntervals, clearAllSessionData, clearToken]);

  // Fixed: Enhanced auth status check with debouncing and proper error handling
  const checkAuthStatus = useCallback(async (): Promise<void> => {
    const storedToken = getStoredToken();
    
    if (!storedToken) {
      setAdminUser(null);
      setIsLoading(false);
      return;
    }
    
    // Fixed: Prevent concurrent validation
    if (sessionValidationInProgress.current) {
      return;
    }
    
    sessionValidationInProgress.current = true;
    
    try {
      // Fixed: Use apiRequest for consistent error handling
      const response = await apiRequest('GET', '/api/admin/auth/verify', undefined, undefined, {
        'Authorization': `Bearer ${storedToken}`
      });
      
      if (!response.ok) {
        throw new Error('Token validation failed');
      }
      
      const data: AuthStatusResponse = await response.json();
      
      if (data.valid && data.user) {
        setAdminUser(data.user);
        trackActivity();
        // Fixed: Reset error on successful validation
        setError(null);
      } else {
        // Token is invalid
        await logout();
      }
      
    } catch (err) {
      // Fixed: Proper error handling
      const error = err instanceof Error ? err : new Error('Auth check failed');
      setError(error);
      await logout();
    } finally {
      sessionValidationInProgress.current = false;
      setIsLoading(false);
    }
  }, [getStoredToken, trackActivity, logout]);

  // Fixed: Debounced version of checkAuthStatus
  const debouncedCheckAuthStatus = useDebounce(checkAuthStatus, SESSION_CONFIG.DEBOUNCE_DELAY);

  // Fixed: Enhanced initialization with proper SSR handling
  useEffect(() => {
    if (!isBrowser()) {
      setIsLoading(false);
      return;
    }
    
    const storedToken = getStoredToken();
    if (storedToken) {
      // Use debounced version to prevent excessive calls
      debouncedCheckAuthStatus();
    } else {
      setIsLoading(false);
    }
  }, [getStoredToken, debouncedCheckAuthStatus]);

  // Fixed: Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllIntervals();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [stopAllIntervals]);

  // Fixed: Enhanced context value with computed properties
  const contextValue = useMemo((): AdminContextType => ({
    adminUser,
    isLoading,
    error,
    login,
    logout,
    checkAuthStatus: debouncedCheckAuthStatus,
    trackActivity,
    clearError,
    getToken: getStoredToken,
    isAuthenticated: !!adminUser && !!token,
  }), [
    adminUser,
    isLoading,
    error,
    login,
    logout,
    debouncedCheckAuthStatus,
    trackActivity,
    clearError,
    getStoredToken,
    token
  ]);

  return (
    <SecurityErrorBoundary>
      <AdminContext.Provider value={contextValue}>
        {children}
      </AdminContext.Provider>
    </SecurityErrorBoundary>
  );
}

// Fixed: Enhanced hook for getting admin token (for compatibility with existing code)
export const useAdminToken = (): string | null => {
  const { getToken } = useAdmin();
  return getToken();
};

// Fixed: Enhanced hook for admin authentication status
export const useAdminAuth = () => {
  const { isAuthenticated, adminUser, isLoading } = useAdmin();
  return { isAuthenticated, adminUser, isLoading };
};

// Fixed: Export the context for advanced usage
export { AdminContext };