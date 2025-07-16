// AdminContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

interface AdminUser {
  id: number;
  email: string;
  role: string;
  emailVerified: boolean;
}

interface AdminContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  login: (
    email: string,
    password: string,
    recaptchaToken?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  trackActivity: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);
export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const sessionValidationInProgress = useRef(false);
  const sessionHealthMonitor = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  const trackActivity = useCallback(() => {
    localStorage.setItem("admin_last_activity", Date.now().toString());
  }, []);

  const getStoredToken = useCallback(
    () => localStorage.getItem("admin_token"),
    []
  );
  const storeToken = useCallback((token: string) => {
    localStorage.setItem("admin_token", token);
    setAdminToken(token);
  }, []);
  const clearToken = useCallback(() => {
    localStorage.removeItem("admin_token");
    setAdminToken(null);
  }, []);

  // Cleanup all session data on logout or token invalid
  const clearAllSessionData = useCallback(() => {
    ["localStorage", "sessionStorage"].forEach((storageType) => {
      const storage =
        storageType === "localStorage" ? localStorage : sessionStorage;
      Object.keys(storage)
        .filter((key) => key.startsWith("admin_"))
        .forEach((key) => storage.removeItem(key));
    });
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (name.startsWith("admin_")) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
      }
    });
    if (sessionHealthMonitor.current)
      clearInterval(sessionHealthMonitor.current);
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
  }, []);

  // Initialize token on mount
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      setAdminToken(token);
      checkAuthStatus();
    } else {
      setIsLoading(false);
    }
  }, [getStoredToken]);

  const login = useCallback(
    async (email: string, password: string, recaptchaToken?: string) => {
      setIsLoading(true);
      setError(null);
      const controller = new AbortController();
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, recaptchaToken }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");
        storeToken(data.token);
        setAdminUser(data.user);
        trackActivity();
      } catch (err: any) {
        setError(err.message || "Login error");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [storeToken, trackActivity]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    clearToken();
    setAdminUser(null);
    setError(null);
    clearAllSessionData();
    setIsLoading(false);
  }, [clearToken, clearAllSessionData]);

  const checkAuthStatus = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setAdminUser(null);
      setIsLoading(false);
      return;
    }
    if (sessionValidationInProgress.current) return;
    sessionValidationInProgress.current = true;
    setIsLoading(true);
    const controller = new AbortController();
    try {
      const res = await fetch("/api/admin/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Token invalid");
      const data = await res.json();
      setAdminUser(data.user);
      trackActivity();
    } catch (err) {
      clearToken();
      setAdminUser(null);
    } finally {
      sessionValidationInProgress.current = false;
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [getStoredToken, clearToken, trackActivity]);

  // Start periodic session monitoring on login
  useEffect(() => {
    if (!adminUser) return;
    // Health check every 2m
    sessionHealthMonitor.current = setInterval(() => {
      const last = parseInt(localStorage.getItem("admin_last_activity") || "0");
      if (Date.now() - last > 2 * 60 * 60 * 1000)
        setError("Session expiring soon");
      checkAuthStatus();
    }, 120000);
    // Heartbeat every 1m
    heartbeatInterval.current = setInterval(trackActivity, 60000);
    return () => {
      if (sessionHealthMonitor.current)
        clearInterval(sessionHealthMonitor.current);
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    };
  }, [adminUser, checkAuthStatus, trackActivity]);

  const value = useMemo(
    () => ({
      adminUser,
      isLoading,
      error,
      login: login as () => Promise<void>,
      logout,
      checkAuthStatus,
      trackActivity,
    }),
    [adminUser, isLoading, error, login, logout, checkAuthStatus, trackActivity]
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}
