import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
      localStorage.removeItem('admin_token');
      setAdminUser(null);
      setError(null);
    }
  };

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
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}