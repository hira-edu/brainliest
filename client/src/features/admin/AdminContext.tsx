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
  
  // Token-only authentication state
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const sessionValidationInProgress = useRef<boolean>(false);
  
  // Session monitoring references
  const sessionHealthMonitor = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  // Token-only activity tracking
  const trackActivity = useCallback(() => {
    const now = Date.now().toString();
    try {
      // Store activity timestamp
      localStorage.setItem('admin_last_activity', now);
    } catch (error) {
      console.warn('Activity tracking failed:', error);
    }
  }, []);

  // Token management functions
  const getStoredToken = useCallback((): string | null => {
    try {
      return localStorage.getItem('admin_token');
    } catch {
      return null;
    }
  }, []);

  const storeToken = useCallback((token: string) => {
    try {
      localStorage.setItem('admin_token', token);
      setAdminToken(token);
    } catch (error) {
      console.warn('Failed to store admin token:', error);
    }
  }, []);

  const clearToken = useCallback(() => {
    try {
      localStorage.removeItem('admin_token');
      setAdminToken(null);
    } catch (error) {
      console.warn('Failed to clear admin token:', error);
    }
  }, []);

  // Initialize token from storage on mount
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      setAdminToken(token);
      // Check authentication status if token exists
      checkAuthStatus();
    } else {
      // No token found, stop loading
      setIsLoading(false);
    }
  }, [getStoredToken]);

  // Token-only login function  
  const login = useCallback(async (email: string, password: string, recaptchaToken?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, recaptchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success && data.token && data.user) {
        storeToken(data.token);
        setAdminUser(data.user);
        trackActivity();
      } else {
        throw new Error(data.message || 'Invalid response from server');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [storeToken, trackActivity]);

  // Token-only logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      clearToken();
      setAdminUser(null);
      setError(null);
    } catch (err) {
      console.warn('Logout cleanup failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [clearToken]);

  // Check authentication status using token
  const checkAuthStatus = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setAdminUser(null);
      return;
    }

    if (sessionValidationInProgress.current) {
      return;
    }

    try {
      sessionValidationInProgress.current = true;
      setIsLoading(true);

      const response = await fetch('/api/admin/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setAdminUser(data.user);
          trackActivity();
        } else {
          throw new Error('Invalid token');
        }
      } else {
        throw new Error('Token verification failed');
      }
    } catch (err) {
      console.warn('Token verification failed:', err);
      clearToken();
      setAdminUser(null);
    } finally {
      sessionValidationInProgress.current = false;
      setIsLoading(false);
    }
  }, [getStoredToken, clearToken, trackActivity]);

  // Industrial-grade session clearing with comprehensive cleanup and verification
  const clearAllSessionData = useCallback(() => {
    const cleanupOperations = [
      // localStorage cleanup with error handling
      () => {
        try {
          const adminKeys = Object.keys(localStorage).filter(key => key.startsWith('admin_'));
          adminKeys.forEach(key => {
            try {
              localStorage.removeItem(key);
            } catch (error) {
              console.warn(`Failed to remove localStorage key: ${key}`, error);
            }
          });
          return adminKeys.length;
        } catch {
          return 0;
        }
      },
      // sessionStorage cleanup
      () => {
        try {
          const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith('admin_'));
          sessionKeys.forEach(key => {
            try {
              sessionStorage.removeItem(key);
            } catch (error) {
              console.warn(`Failed to remove sessionStorage key: ${key}`, error);
            }
          });
          return sessionKeys.length;
        } catch {
          return 0;
        }
      },
      // Comprehensive cookie cleanup
      () => {
        try {
          const cookiesToClear = ['admin_token', 'admin_session_id', 'admin_fingerprint', 'admin_refresh_token'];
          const domains = ['', '.localhost', `.${window.location.hostname}`];
          const paths = ['/', '/admin', '/api/admin'];
          
          let cleared = 0;
          cookiesToClear.forEach(cookieName => {
            domains.forEach(domain => {
              paths.forEach(path => {
                try {
                  // Standard clear
                  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
                  // Secure clear
                  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure;`;
                  // SameSite strict clear
                  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure; samesite=strict;`;
                  cleared++;
                } catch (error) {
                  console.warn(`Failed to clear cookie ${cookieName}:`, error);
                }
              });
            });
          });
          return cleared;
        } catch {
          return 0;
        }
      }
    ];

    let totalCleared = 0;
    cleanupOperations.forEach((operation, index) => {
      try {
        const cleared = operation();
        totalCleared += cleared;
      } catch (error) {
        console.warn(`Cleanup operation ${index + 1} failed:`, error);
      }
    });

    console.log(`✅ Session cleanup completed (${totalCleared} items cleared)`);
    
    // Clear monitoring intervals
    if (sessionHealthMonitor.current) {
      clearInterval(sessionHealthMonitor.current);
      sessionHealthMonitor.current = null;
    }
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  // Enterprise session utility functions

  const generateClientFingerprint = (): string => {
    try {
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset().toString(),
        navigator.platform,
        window.location.hostname
      ];
      
      // Simple hash function
      let hash = 0;
      const str = components.join('|');
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    } catch {
      return 'fingerprint_' + Date.now();
    }
  };

  // Advanced session monitoring with health checks and automatic recovery
  const startSessionMonitoring = useCallback(() => {
    // Clear existing monitors
    if (sessionHealthMonitor.current) clearInterval(sessionHealthMonitor.current);
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);

    // Session health monitoring every 2 minutes
    sessionHealthMonitor.current = setInterval(() => {
      if (adminUser && !sessionValidationInProgress.current) {
        const lastActivity = localStorage.getItem('admin_last_activity');
        if (lastActivity) {
          const timeSinceActivity = Date.now() - parseInt(lastActivity);
          
          // Check for various session health indicators
          if (timeSinceActivity > 30 * 60 * 1000) { // 30 minutes
            console.warn('Extended inactivity detected');
          }
          
          if (timeSinceActivity > 2 * 60 * 60 * 1000) { // 2 hours
            console.warn('Session approaching expiration due to inactivity');
            setError('Your session will expire soon due to inactivity.');
          }
        }
        
        // Periodic auth verification
        checkAuthStatus();
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    // Heartbeat monitoring every minute
    heartbeatInterval.current = setInterval(() => {
      if (adminUser) {
        trackActivity();
      }
    }, 60 * 1000); // Every minute

    console.log('✅ Session monitoring started');
  }, [adminUser, checkAuthStatus, trackActivity]);

  // Enhanced initialization with recovery mechanisms and connection monitoring
  useEffect(() => {
    // Immediate auth check with network state consideration
    if (navigator.onLine) {
      checkAuthStatus();
    } else {
      console.warn('Offline detected - deferring auth check');
      setIsLoading(false);
    }

    // Network state monitoring
    const handleOnline = () => {
      console.log('Network restored - verifying session');
      if (adminUser) {
        checkAuthStatus();
      }
    };

    const handleOffline = () => {
      console.log('Network lost - session verification paused');
      setError('Network connection lost. Session verification paused.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Cleanup monitoring intervals
      if (sessionHealthMonitor.current) clearInterval(sessionHealthMonitor.current);
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    };
  }, [adminUser, checkAuthStatus]);

  // Start session monitoring when user logs in
  useEffect(() => {
    if (adminUser) {
      startSessionMonitoring();
    }
    
    return () => {
      if (sessionHealthMonitor.current) clearInterval(sessionHealthMonitor.current);
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    };
  }, [adminUser, startSessionMonitoring]);

  // Multi-tab synchronization with enhanced event handling and conflict resolution
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_token') {
        if (!e.newValue && adminUser) {
          // Token was removed in another tab, logout this tab
          console.log('Token removed in another tab, logging out');
          setAdminUser(null);
          setError('Session ended in another tab');
  
        } else if (e.newValue && !adminUser && !sessionValidationInProgress.current) {
          // Token was added in another tab, verify auth
          console.log('Token added in another tab, verifying auth');
          checkAuthStatus();
        }
      } else if (e.key === 'admin_session_conflict') {
        // Handle session conflicts between tabs
        console.log('Session conflict detected between tabs');
        if (e.newValue) {
          const conflictData = JSON.parse(e.newValue);
          if (conflictData.action === 'force_logout') {
            logout();
          }
        }
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && adminUser && navigator.onLine) {
        // Page became visible and online, verify session is still valid
        console.log('Tab became active - verifying session');
        checkAuthStatus();
        trackActivity();
      }
    };

    const handleBeforeUnload = () => {
      // Mark session as potentially ending
      try {
        sessionStorage.setItem('admin_session_ending', Date.now().toString());
      } catch {
        // Continue
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [adminUser, checkAuthStatus, trackActivity, logout, clearAllSessionData]);

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