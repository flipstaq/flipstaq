import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './AuthProvider';
import { useLanguage } from './LanguageProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({
  children,
  fallback,
}) => {
  const { user, loading, hasAdminAccess, isAuthenticated } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.push('/auth/login?redirect=/admin');
        return;
      }

      if (!hasAdminAccess) {
        // Redirect to home if user doesn't have admin access
        router.push('/');
        return;
      }
    }
  }, [loading, isAuthenticated, hasAdminAccess, router]);
  if (loading) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('auth.loginRequired')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('auth.redirectingToLogin')}
            </p>
          </div>
        </div>
      )
    );
  }

  if (!hasAdminAccess) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-red-600">
              {t('admin.accessDenied')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('admin.insufficientPermissions')}
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
};
