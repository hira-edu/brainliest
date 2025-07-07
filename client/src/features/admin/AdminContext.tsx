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
  
  // Industrial-grade session management refs
  const sessionHealthMonitor = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const retryAttempts = useRef<number>(0);
  const maxRetryAttempts = 3;
  const sessionValidationInProgress = useRef<boolean>(false);

  // Enterprise-grade activity tracking with multiple persistence layers
  const trackActivity = useCallback(() => {
    const now = Date.now().toString();
    try {
      // Primary: localStorage with error handling
      try {
        localStorage.setItem('admin_last_activity', now);
        localStorage.setItem('admin_session_heartbeat', now);
        localStorage.setItem('admin_session_health_check', now);
      } catch (localStorageError) {
        console.warn('localStorage unavailable:', localStorageError);
      }
      
      // Secondary: sessionStorage fallback
      try {
        sessionStorage.setItem('admin_activity_backup', now);
        sessionStorage.setItem('admin_health_backup', now);
      } catch (sessionStorageError) {
        console.warn('sessionStorage unavailable:', sessionStorageError);
      }
      
      // Tertiary: Send heartbeat to server with timeout protection
      const token = getTokenFromMultipleSources();
      if (token && !sessionValidationInProgress.current) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
        
        fetch('/api/admin/session/heartbeat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            timestamp: now,
            clientHealth: 'active',
            sessionMetrics: {
              lastActivity: now,
              tabVisible: !document.hidden,
              networkOnline: navigator.onLine
            }
          }),
          credentials: 'include',
          signal: controller.signal
        }).then(() => {
          clearTimeout(timeoutId);
          retryAttempts.current = 0; // Reset retry counter on success
        }).catch((error) => {
          clearTimeout(timeoutId);
          if (error.name !== 'AbortError') {
            console.warn('Heartbeat failed:', error);
            retryAttempts.current++;
            if (retryAttempts.current >= maxRetryAttempts) {
              console.error('🚨 Multiple heartbeat failures detected - session may be compromised');
            }
          }
        });
      }
    } catch (error) {
      console.warn('Activity tracking failed:', error);
    }
  }, []);

  // Multi-source token retrieval with enterprise-grade fallback and validation
  const getTokenFromMultipleSources = useCallback((): string | null => {
    const sources = [
      // Primary: localStorage
      () => {
        try {
          return localStorage.getItem('admin_token');
        } catch {
          return null;
        }
      },
      // Secondary: cookies with enhanced parsing
      () => {
        try {
          const cookies = document.cookie.split(';');
          const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('admin_token='));
          if (tokenCookie) {
            const token = decodeURIComponent(tokenCookie.split('=')[1]);
            if (token && token !== 'undefined' && token !== 'null') {
              // Restore to localStorage for future access
              try {
                localStorage.setItem('admin_token', token);
              } catch {
                // Continue without localStorage backup
              }
              return token;
            }
          }
        } catch {
          // Continue to next source
        }
        return null;
      },
      // Tertiary: sessionStorage
      () => {
        try {
          const token = sessionStorage.getItem('admin_token_backup');
          if (token && token !== 'undefined' && token !== 'null') {
            // Restore to localStorage
            try {
              localStorage.setItem('admin_token', token);
            } catch {
              // Continue without localStorage backup
            }
            return token;
          }
        } catch {
          // Continue
        }
        return null;
      },
      // Quaternary: Check for session ID and attempt recovery
      () => {
        try {
          const sessionId = sessionStorage.getItem('admin_session_id_backup');
          if (sessionId) {
            console.log('Attempting session recovery with session ID:', sessionId.substring(0, 8) + '...');
            // Note: This would require a backend endpoint for session recovery
          }
        } catch {
          // Continue
        }
        return null;
      }
    ];

    for (const source of sources) {
      try {
        const token = source();
        if (token) {
          // Validate token format (basic JWT structure check)
          const parts = token.split('.');
          if (parts.length === 3) {
            return token;
          }
        }
      } catch (error) {
        console.warn('Token source failed:', error);
        continue;
      }
    }

    return null;
  }, []);

  // War-tested session persistence with comprehensive error handling and atomic operations
  const persistSessionData = useCallback((token: string, user: AdminUser) => {
    const sessionData = {
      token,
      user,
      timestamp: Date.now(),
      sessionId: extractSessionIdFromToken(token),
      fingerprint: generateClientFingerprint()
    };

    const persistenceOperations = [
      // Primary storage operations
      () => {
        try {
          localStorage.setItem('admin_token', token);
          localStorage.setItem('admin_user', JSON.stringify(user));
          localStorage.setItem('admin_session_created', Date.now().toString());
          localStorage.setItem('admin_session_fingerprint', sessionData.fingerprint);
          return true;
        } catch {
          return false;
        }
      },
      // Backup storage operations
      () => {
        try {
          sessionStorage.setItem('admin_token_backup', token);
          sessionStorage.setItem('admin_user_backup', JSON.stringify(user));
          sessionStorage.setItem('admin_session_id_backup', sessionData.sessionId);
          return true;
        } catch {
          return false;
        }
      },
      // Minimal fallback storage
      () => {
        try {
          sessionStorage.setItem('admin_minimal_session', JSON.stringify({
            token: token.substring(0, 32) + '...', // Store partial token for recovery hints
            userId: user.id,
            email: user.email,
            timestamp: Date.now()
          }));
          return true;
        } catch {
          return false;
        }
      }
    ];

    let successCount = 0;
    persistenceOperations.forEach((operation, index) => {
      if (operation()) {
        successCount++;
      } else {
        console.warn(`Storage operation ${index + 1} failed`);
      }
    });

    if (successCount === 0) {
      console.error('🚨 CRITICAL: All storage mechanisms failed - session may not persist across refreshes');
      throw new Error('Session persistence failed completely');
    } else {
      console.log(`✅ Session persisted successfully (${successCount}/${persistenceOperations.length} storage methods)`);
    }

    // Track activity after successful persistence
    trackActivity();
  }, [trackActivity]);

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

  // Enterprise authentication verification with comprehensive error handling and retry logic
  const checkAuthStatus = useCallback(async () => {
    if (sessionValidationInProgress.current) {
      return; // Prevent concurrent validation calls
    }

    try {
      sessionValidationInProgress.current = true;
      setIsLoading(true);
      setError(null);

      // Enterprise session validation through secure cookies (no tokens needed)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

      const response = await fetch('/api/admin/session/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Fingerprint': generateClientFingerprint(),
          'X-Session-Health': 'active'
        },
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.session && data.session.user) {
          setAdminUser(data.session.user);
          retryAttempts.current = 0; // Reset retry counter
          console.log('✅ Enterprise session status check successful');
        } else {
          console.warn('Session status check failed: Invalid session data', data);
          setAdminUser(null);
        }
      } else if (response.status === 401) {
        console.log('🔓 No active admin session found');
        setAdminUser(null);
      } else if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      } else {
        throw new Error(`Session status check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('🚨 Auth verification error:', error);
      retryAttempts.current++;
      
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Authentication verification timed out. Please check your connection.');
      } else if (retryAttempts.current >= maxRetryAttempts) {
        setError('Multiple authentication failures. Please log in again.');
        clearAllSessionData();
        setAdminUser(null);
      } else {
        setError(`Authentication error (attempt ${retryAttempts.current}/${maxRetryAttempts}). Retrying...`);
        // Retry after exponential backoff
        setTimeout(() => {
          if (retryAttempts.current < maxRetryAttempts) {
            checkAuthStatus();
          }
        }, Math.pow(2, retryAttempts.current) * 1000);
      }
    } finally {
      setIsLoading(false);
      sessionValidationInProgress.current = false;
    }
  }, [getTokenFromMultipleSources, persistSessionData, clearAllSessionData]);

  // Industrial-grade login with comprehensive error handling and session establishment
  const login = useCallback(async (email: string, password: string, recaptchaToken?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      retryAttempts.current = 0; // Reset retry counter for new login attempt

      // Pre-login validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout for login

      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Fingerprint': generateClientFingerprint(),
          'X-Login-Attempt': Date.now().toString()
        },
        body: JSON.stringify({
          email,
          password,
          recaptchaToken,
          clientInfo: {
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }),
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.user) {
          setAdminUser(data.user);
          setError(null);
          console.log('✅ Admin login successful - enterprise session created with sessionId:', data.sessionId);
          
          // Start session monitoring with enterprise session manager
          startSessionMonitoring();
        } else {
          throw new Error('Login response missing user data');
        }
      } else {
        // Enhanced error handling for different failure scenarios
        if (data.accountLocked) {
          const lockoutMessage = data.lockoutExpires 
            ? `Account locked until ${new Date(data.lockoutExpires).toLocaleString()}`
            : 'Account is temporarily locked due to multiple failed attempts';
          setError(lockoutMessage);
        } else if (response.status === 429) {
          setError('Too many login attempts. Please wait before trying again.');
        } else if (response.status >= 500) {
          setError('Server error occurred. Please try again later.');
        } else if (response.status === 403) {
          setError('Access denied. Please check your admin privileges.');
        } else {
          setError(data.message || 'Login failed. Please check your credentials.');
        }
      }
    } catch (error) {
      console.error('🚨 Login error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Login request timed out. Please check your connection and try again.');
      } else {
        setError('Login failed due to a network or system error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [persistSessionData]);

  // Enterprise logout with cookie-based session invalidation
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Enterprise session logout through secure cookies (no tokens needed)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('/api/admin/session/invalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Fingerprint': generateClientFingerprint(),
            'X-Logout-Reason': 'user_initiated'
          },
          body: JSON.stringify({
            clientInfo: {
              timestamp: Date.now(),
              reason: 'user_initiated'
            }
          }),
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('✅ Enterprise session logout successful');
        } else {
          console.warn('Server logout failed, proceeding with client cleanup');
        }
      } catch (error) {
        console.warn('Logout request failed:', error);
        // Continue with client-side cleanup regardless
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always perform client-side cleanup regardless of server response
      clearAllSessionData();
      setAdminUser(null);
      setError(null);
      setIsLoading(false);
      retryAttempts.current = 0;
      console.log('✅ Admin logout completed');
    }
  }, [getTokenFromMultipleSources, clearAllSessionData]);

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
          clearAllSessionData();
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