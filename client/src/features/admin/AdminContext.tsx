import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

interface AdminUser {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  emailVerified: boolean;
}

interface AdminContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  trackActivity: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Activity tracking for 60-minute timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const TIMEOUT_DURATION = 60 * 60 * 1000; // 60 minutes in milliseconds

  // Function to handle automatic logout (avoiding circular dependency)
  const handleTimeoutLogout = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (token) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      localStorage.removeItem('admin_token');
      setAdminUser(null);
      setError(null);
    }
  }, []);

  // Reset timeout on activity
  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (adminUser) {
      lastActivityRef.current = Date.now();
      timeoutRef.current = setTimeout(() => {
        console.log('Admin session timed out after 60 minutes of inactivity');
        handleTimeoutLogout();
      }, TIMEOUT_DURATION);
    }
  }, [adminUser, handleTimeoutLogout, TIMEOUT_DURATION]);

  // Track activity events
  const trackActivity = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setAdminUser(null);
        return;
      }

      const response = await fetch('/api/admin/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid && data.user) {
          setAdminUser(data.user);
        } else {
          // Token invalid, remove it
          localStorage.removeItem('admin_token');
          setAdminUser(null);
        }
      } else {
        // Token verification failed, remove it
        localStorage.removeItem('admin_token');
        setAdminUser(null);
      }
    } catch (error) {
      console.error('Admin auth check failed:', error);
      localStorage.removeItem('admin_token');
      setAdminUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, recaptchaToken?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, recaptchaToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        setAdminUser(data.user);
        // Start activity tracking after successful login
        resetTimeout();
      } else {
        throw new Error(data.message || 'Admin login failed');
      }
    } catch (error: any) {
      setError(error.message || 'Admin login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (token) {
        // Call backend logout endpoint
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      // Clear timeout on logout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      localStorage.removeItem('admin_token');
      setAdminUser(null);
      setError(null);
    }
  };

  // Set up global activity listeners when admin user is present
  useEffect(() => {
    if (adminUser) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const handleActivity = () => {
        trackActivity();
      };

      // Add event listeners
      events.forEach(event => {
        document.addEventListener(event, handleActivity, { passive: true });
      });

      // Start the timeout on mount
      resetTimeout();

      // Cleanup on unmount or when admin user changes
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity);
        });
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [adminUser, trackActivity, resetTimeout]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AdminContextType = {
    adminUser,
    isLoading,
    error,
    login,
    logout,
    checkAuthStatus,
    trackActivity,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}