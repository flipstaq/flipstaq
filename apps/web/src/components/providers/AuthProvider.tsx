'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserInfo, AuthResponse, SignupFormData, LoginFormData } from '@/types';
import { authService } from '@/lib/auth';

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasAdminAccess: boolean;
  login: (data: LoginFormData) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;
  const hasAdminAccess =
    user?.role === 'OWNER' ||
    user?.role === 'HIGHER_STAFF' ||
    user?.role === 'STAFF'; // Validate token on app start
  useEffect(() => {
    const validateCurrentUser = async () => {
      try {
        const userInfo = await authService.validateToken();
        setUser(userInfo);
      } catch (error) {
        console.warn('Token validation failed:', error);
        // Clear any stored data if validation fails
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      } finally {
        setLoading(false);
      }
    };

    validateCurrentUser();
  }, []);

  const signup = async (data: SignupFormData): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response: AuthResponse = await authService.signup(data);
      setUser(response.user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Signup failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginFormData): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response: AuthResponse = await authService.login(data);
      setUser(response.user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };
  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    hasAdminAccess,
    login,
    signup,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
