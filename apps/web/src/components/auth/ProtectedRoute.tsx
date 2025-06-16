'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/providers/AuthProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'OWNER' | 'HIGHER_STAFF' | 'STAFF' | 'USER';
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole = 'USER',
  redirectTo = '/auth/signin',
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Role hierarchy definition
  const roleHierarchy = {
    USER: 1,
    STAFF: 2,
    HIGHER_STAFF: 3,
    OWNER: 4,
  };

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // Check role authorization
      const userRoleLevel = roleHierarchy[user?.role || 'USER'];
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [loading, isAuthenticated, user, requiredRole, redirectTo, router]);
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render children if not authenticated or authorized
  if (
    !isAuthenticated ||
    (user && roleHierarchy[user.role] < roleHierarchy[requiredRole])
  ) {
    return null;
  }

  return <>{children}</>;
}
