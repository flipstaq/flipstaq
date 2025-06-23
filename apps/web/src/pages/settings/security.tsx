import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Validation schema
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'validation.required'),
    newPassword: z.string().min(8, 'validation.passwordMin'),
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'passwords_dont_match',
    path: ['confirmPassword'],
  });

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export default function SecuritySettingsPage() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordData) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      // Get JWT from localStorage
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('authToken')
          : null;
      await axios.post(
        '/api/auth/change-password',
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined
      );

      setIsSuccess(true);
      reset(); // Clear the form

      // Hide success message after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Password change failed:', error);
      const errorMessage =
        error.response?.data?.message || t('auth:change_password_failed');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-secondary-600 dark:text-secondary-400">
          {t('auth:please_wait')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quit Settings Button (top left) */}
        <div className="mb-4 flex">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center text-secondary-600 hover:underline dark:text-secondary-300"
            style={{
              marginRight: isRTL ? 0 : 'auto',
              marginLeft: isRTL ? 'auto' : 0,
            }}
            aria-label={t('settings:quitSettings')}
          >
            <ArrowLeft className="mr-2 h-4 w-4 rtl:rotate-180" />
            {t('settings:quitSettings')}
          </button>
        </div>

        <h1 className="mb-8 text-3xl font-bold text-secondary-900 dark:text-secondary-100">
          {t('settings:title')}
        </h1>
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Sidebar */}
          <aside className="mb-6 w-full flex-shrink-0 md:mb-0 md:w-48">
            <nav className="flex flex-row gap-2 md:flex-col md:gap-0 md:space-y-2">
              <Link
                href="/settings/security"
                className={`flex w-full items-center gap-2 rounded-lg bg-primary-100 px-3 py-2 text-sm font-medium text-primary-700 transition-colors dark:bg-primary-900/20 dark:text-primary-400 md:w-auto`}
              >
                <Shield className="h-4 w-4" />
                {t('settings:security.title')}
              </Link>
            </nav>
          </aside>
          {/* Main Content */}
          <main className="flex-1 rounded-lg bg-white p-4 shadow dark:bg-secondary-800 md:p-8">
            {/* Go Back Button */}
            <div className="mb-4">
              <Link
                href="/settings"
                className="inline-flex items-center text-primary-600 hover:underline dark:text-primary-400"
              >
                <ArrowLeft className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0 rtl:rotate-180" />
                {t('settings:security.goBack')}
              </Link>
            </div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {t('settings:security.title')}
              </h2>
              <p className="mt-2 text-secondary-600 dark:text-secondary-400">
                {t('settings:security.changePassword')}
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow dark:bg-secondary-800">
              <div className="mb-6 flex items-center space-x-3 rtl:space-x-reverse">
                <div className="rounded-full bg-primary-100 p-2 dark:bg-primary-900/20">
                  <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    {t('settings:security.changePassword')}
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    {t('auth:change_password_description')}
                  </p>
                </div>
              </div>

              {isSuccess && (
                <div className="mb-6 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="ml-2 text-sm text-green-600 dark:text-green-400 rtl:ml-0 rtl:mr-2">
                      {t('auth:password_changed')}
                    </p>
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label htmlFor="currentPassword" className="label-field">
                    {t('auth:current_password')}
                  </label>
                  <input
                    {...register('currentPassword')}
                    type="password"
                    id="currentPassword"
                    autoComplete="current-password"
                    className="input-field"
                    dir="ltr"
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {t(`auth:${errors.currentPassword.message || ''}`)}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="label-field">
                    {t('auth:new_password')}
                  </label>
                  <input
                    {...register('newPassword')}
                    type="password"
                    id="newPassword"
                    autoComplete="new-password"
                    className="input-field"
                    dir="ltr"
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {t(`auth:${errors.newPassword.message || ''}`)}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="label-field">
                    {t('auth:confirm_password')}
                  </label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    id="confirmPassword"
                    autoComplete="new-password"
                    className="input-field"
                    dir="ltr"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {t(`auth:${errors.confirmPassword.message || ''}`)}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin text-white rtl:-mr-1 rtl:ml-2" />
                        {t('auth:processing')}
                      </span>
                    ) : (
                      t('auth:change_password')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
