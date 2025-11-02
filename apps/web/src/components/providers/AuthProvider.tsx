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
  refreshUser: () => Promise<void>;
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
    user?.role === 'STAFF'; // Validate token on app start - with automatic refresh if expired
  useEffect(() => {
    const validateCurrentUser = async () => {
      try {
        // Check if there's a stored token before attempting validation
        const storedToken = authService.getAccessToken();

        if (!storedToken) {
          // No token found - user is not logged in, this is normal for public pages
          setLoading(false);
          return;
        }

        // Token exists, try to validate it
        const userInfo = await authService.validateToken();
        setUser(userInfo);
      } catch (error) {
        console.warn(
          'Token validation failed, attempting to refresh...',
          error
        );

        // Token validation failed (likely expired), try to refresh using the refresh token cookie
        try {
          const response = await authService.refreshToken();
          setUser(response.user);
          console.log('Token refreshed successfully on app load');
        } catch (refreshError) {
          console.warn(
            'Token refresh also failed, user needs to log in again:',
            refreshError
          );
          // Both validation and refresh failed - clear stored data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
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

  const refreshUser = async (): Promise<void> => {
    try {
      const userInfo = await authService.validateToken();
      setUser(userInfo);
    } catch (error) {
      console.warn('Failed to refresh user:', error);
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
    refreshUser,
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
