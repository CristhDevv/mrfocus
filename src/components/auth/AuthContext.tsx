'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: 'superadmin' | 'user' | string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  guestLogin: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check saved session in localStorage
    try {
      const savedToken = localStorage.getItem('mrfocus_token');
      const savedUser = localStorage.getItem('mrfocus_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Intercept client fetch to automatically inject user authentication headers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async (input, init = {}) => {
        const headers = new Headers(init.headers || {});
        const currentToken = localStorage.getItem('mrfocus_token');
        const currentUser = localStorage.getItem('mrfocus_user');

        if (currentToken && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${currentToken}`);
        }
        if (currentUser) {
          try {
            const parsed = JSON.parse(currentUser);
            if (parsed.id && !headers.has('x-user-id')) {
              headers.set('x-user-id', parsed.id);
              headers.set('x-user-name', parsed.name || '');
              headers.set('x-user-email', parsed.email || '');
              headers.set('x-user-role', parsed.role || 'user');
            }
          } catch {}
        }

        return originalFetch(input, { ...init, headers });
      };
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('mrfocus_token', data.token);
        localStorage.setItem('mrfocus_user', JSON.stringify(data.user));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mrfocus_refresh_tasks'));
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Error al iniciar sesión' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (res.ok && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('mrfocus_token', data.token);
        localStorage.setItem('mrfocus_user', JSON.stringify(data.user));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mrfocus_refresh_tasks'));
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Error al registrar la cuenta' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión' };
    }
  };

  const guestLogin = async () => {
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('mrfocus_token', data.token);
        localStorage.setItem('mrfocus_user', JSON.stringify(data.user));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mrfocus_refresh_tasks'));
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Error al crear invitado' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mrfocus_token');
    localStorage.removeItem('mrfocus_user');
    document.cookie = 'mrfocus_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mrfocus_refresh_tasks'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        guestLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
