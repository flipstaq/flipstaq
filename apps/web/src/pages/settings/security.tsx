import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Shield,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Key,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import axios from 'axios';
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
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, loading, router]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

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
      const token = localStorage.getItem('authToken');

      const response = await axios.post(
        '/api/me/change-password',
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setIsSuccess(true);
      reset();
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(t('settings:passwordChangeError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const securityFeatures = [
    {
      title: t('settings:passwordProtection'),
      description: t('settings:passwordProtectionDesc'),
      status: 'active',
      icon: Lock,
      color: 'bg-green-500',
    },
    {
      title: t('settings:twoFactorAuthentication'),
      description: t('settings:twoFactorAuthenticationDesc'),
      status: 'coming-soon',
      icon: Shield,
      color: 'bg-yellow-500',
    },
    {
      title: t('settings:loginActivity'),
      description: t('settings:loginActivityDesc'),
      status: 'coming-soon',
      icon: Eye,
      color: 'bg-blue-500',
    },
  ];

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('settings:loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={`mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 ${isRTL ? 'space-y-10' : 'space-y-8'}`}
      >
        {/* Header */}
        <div className={`mb-8 ${isRTL ? 'space-y-6' : 'space-y-4'}`}>
          <button
            type="button"
            onClick={() => router.push('/settings')}
            className={`group mb-6 inline-flex items-center text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}
          >
            <ArrowLeft
              className={`h-5 w-5 transition-transform group-hover:-translate-x-1 ${isRTL ? 'rotate-180' : ''}`}
            />
            <span>{isRTL ? 'العودة للإعدادات' : 'Back to Settings'}</span>
          </button>

          <div
            className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-6 space-x-reverse' : 'space-x-4'} sm:space-x-6`}
          >
            <div className={`rounded-2xl bg-green-500 p-3 sm:p-4`}>
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h1
                className={`text-3xl font-bold text-gray-900 dark:text-white ${isRTL ? 'mb-2' : 'mb-1'}`}
              >
                {t('settings:security')}
              </h1>
              <p
                className={`text-gray-600 dark:text-gray-400 ${isRTL ? 'leading-relaxed' : ''}`}
              >
                {t('settings:securityDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className={`${isRTL ? 'space-y-10' : 'space-y-8'}`}>
          {/* Security Overview */}
          <div
            className={`rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800 ${isRTL ? 'space-y-8' : 'space-y-6'}`}
          >
            <h2
              className={`mb-6 text-xl font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
            >
              {t('settings:securityOverview')}
            </h2>

            <div
              className={`grid gap-8 md:grid-cols-3 ${isRTL ? 'md:gap-10' : 'md:gap-6'}`}
            >
              {securityFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className={`rounded-xl border border-gray-200 p-5 dark:border-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`flex items-start ${isRTL ? 'space-x-4 space-x-reverse' : 'space-x-4'}`}
                    >
                      <div
                        className={`rounded-lg ${feature.color} flex-shrink-0 p-2`}
                      >
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-medium text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          {feature.title}
                        </h3>
                        <p
                          className={`mt-2 text-sm text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right leading-relaxed' : ''}`}
                        >
                          {feature.description}
                        </p>
                        <div
                          className={`mt-2 ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          {feature.status === 'active' && (
                            <span
                              className={`inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400 ${isRTL ? 'space-x-1 space-x-reverse' : 'space-x-1'}`}
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>{t('settings:active')}</span>
                            </span>
                          )}
                          {feature.status === 'coming-soon' && (
                            <span
                              className={`inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 ${isRTL ? 'space-x-1 space-x-reverse' : 'space-x-1'}`}
                            >
                              <AlertTriangle className="h-3 w-3" />
                              <span>{t('settings:comingSoon')}</span>
                            </span>
                          )}
                          {feature.status === 'inactive' && (
                            <span
                              className={`inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 ${isRTL ? 'space-x-1 space-x-reverse' : 'space-x-1'}`}
                            >
                              <AlertTriangle className="h-3 w-3" />
                              <span>{t('settings:notEnabled')}</span>
                            </span>
                          )}
                          {feature.status === 'available' && (
                            <span
                              className={`inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 ${isRTL ? 'space-x-1 space-x-reverse' : 'space-x-1'}`}
                            >
                              <span>{t('settings:available')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Change Password */}
          <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
            <div
              className={`mb-6 flex items-center ${isRTL ? 'space-x-3 space-x-reverse' : 'space-x-3'}`}
            >
              <div className="rounded-xl bg-blue-500 p-2">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('settings:changePassword')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('settings:changePasswordDesc')}
                </p>
              </div>
            </div>

            {/* Status Messages */}
            {isSuccess && (
              <div
                className={`mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`flex items-center ${isRTL ? 'space-x-3 space-x-reverse' : 'space-x-3'}`}
                >
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                  <p className="text-green-700 dark:text-green-400">
                    {t('settings:passwordChangedSuccess')}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div
                className={`mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`flex items-center ${isRTL ? 'space-x-3 space-x-reverse' : 'space-x-3'}`}
                >
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Current Password */}
              <div>
                <label
                  className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {t('settings:currentPassword')}
                </label>
                <div className="relative mt-1">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...register('currentPassword')}
                    className={`block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 ${isRTL ? 'pl-10 pr-3 text-right' : 'pl-3 pr-10 text-left'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className={`absolute inset-y-0 flex items-center ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'}`}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p
                    className={`mt-1 text-sm text-red-600 dark:text-red-400 ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label
                  className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {t('settings:newPassword')}
                </label>
                <div className="relative mt-1">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    {...register('newPassword')}
                    className={`block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 ${isRTL ? 'pl-10 pr-3 text-right' : 'pl-3 pr-10 text-left'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute inset-y-0 flex items-center ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'}`}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p
                    className={`mt-1 text-sm text-red-600 dark:text-red-400 ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {t('settings:confirmNewPassword')}
                </label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className={`block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 ${isRTL ? 'pl-10 pr-3 text-right' : 'pl-3 pr-10 text-left'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute inset-y-0 flex items-center ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'}`}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p
                    className={`mt-1 text-sm text-red-600 dark:text-red-400 ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div
                className={`flex ${isRTL ? 'justify-start space-x-3 space-x-reverse' : 'justify-end space-x-3'}`}
              >
                <button
                  type="button"
                  onClick={() => reset()}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {t('settings:cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{t('settings:changePassword')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Password Requirements */}
          <div
            className={`rounded-2xl bg-blue-50 p-6 dark:bg-blue-900/20 ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <h3 className="mb-4 font-medium text-blue-900 dark:text-blue-400">
              {t('settings:passwordRequirements')}
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li
                className={`flex items-center ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}
              >
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{t('settings:passwordReq1')}</span>
              </li>
              <li
                className={`flex items-center ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}
              >
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{t('settings:passwordReq2')}</span>
              </li>
              <li
                className={`flex items-center ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}
              >
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{t('settings:passwordReq3')}</span>
              </li>
              <li
                className={`flex items-center ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}
              >
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{t('settings:passwordReq4')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
