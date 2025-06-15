import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { LoginFormData } from '@/types';

// Validation schema
const loginSchema = z.object({
  identifier: z.string().min(1, 'validation.required'),
  password: z.string().min(1, 'validation.required'),
});

export function LoginForm() {
  const { t, isRTL } = useLanguage();
  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);
  // Clear error when component mounts
  useEffect(() => {
    clearError();

    // Check for account deleted message
    if (router.query.message === 'account_deleted') {
      // We'll handle this in the error display section
    }
  }, [clearError, router.query.message]);
  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      // User will be redirected by useEffect when isAuthenticated becomes true
    } catch (error) {
      // Error is handled by AuthProvider and displayed in the form
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4 py-12 dark:bg-secondary-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          {' '}
          <h2 className="mt-6 text-center text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            {t('auth:signInToAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
            {t('auth:dontHaveAccount')}{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('auth:signUpHere')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Username/Email */}
            <div>
              {' '}
              <label htmlFor="identifier" className="label-field">
                {t('auth:usernameOrEmail')}
              </label>
              <input
                {...register('identifier')}
                type="text"
                id="identifier"
                autoComplete="username"
                className="input-field"
                dir="ltr"
                placeholder={t('auth:usernameOrEmailPlaceholder')}
              />
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {t(
                    `auth:${errors.identifier.message}` ||
                      'auth:validation.required'
                  )}
                </p>
              )}
            </div>
            {/* Password */}{' '}
            <div>
              <label htmlFor="password" className="label-field">
                {t('auth:password')}
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                autoComplete="current-password"
                className="input-field"
                dir="ltr"
                placeholder={t('auth:passwordPlaceholder')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {t(
                    `auth:${errors.password.message}` ||
                      'auth:validation.required'
                  )}
                </p>
              )}
            </div>{' '}
          </div>{' '}
          {/* Global Error Display */}
          {(error || router.query.message === 'account_deleted') && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  {' '}
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    {router.query.message === 'account_deleted' ||
                    (error && error.includes('deleted'))
                      ? t('auth:accountAccessDenied')
                      : 'Login Error'}
                  </h3>{' '}
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>
                      {router.query.message === 'account_deleted' ||
                      (error && error.includes('deleted'))
                        ? t('auth:accountDeleted')
                        : error}
                    </p>
                    {(router.query.message === 'account_deleted' ||
                      (error && error.includes('deleted'))) && (
                      <p className="mt-1 text-xs">
                        {t('auth:accountDeletedSupport')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting || loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>{' '}
                  {t('auth:signingIn')}
                </span>
              ) : (
                t('auth:signIn')
              )}
            </button>
          </div>
          {/* Additional options */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                {t('auth:forgotPassword')}
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
