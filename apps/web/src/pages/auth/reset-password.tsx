import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import axios from 'axios';

// Validation schema
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'validation.passwordMin'),
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwords_dont_match',
    path: ['confirmPassword'],
  });

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const { token } = router.query;
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || typeof token !== 'string') {
        setIsTokenValid(false);
        setIsValidating(false);
        return;
      }

      try {
        await axios.post('/api/auth/validate-reset-token', { token });
        setIsTokenValid(true);
      } catch (error) {
        console.error('Token validation failed:', error);
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      await axios.post('/api/auth/reset-password', {
        token,
        password: data.password,
      });
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Password reset failed:', error);
      const errorMessage =
        error.response?.data?.message || t('auth:reset_password_failed');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4 py-12 dark:bg-secondary-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
            {t('auth:processing')}
          </p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isTokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4 py-12 dark:bg-secondary-900">
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <XCircle className="mx-auto h-16 w-16 text-red-600 dark:text-red-400" />
            <h2 className="mt-4 text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              {t('auth:invalid_token')}
            </h2>
            <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
              {t('auth:token_expired')}
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/auth/forgot-password" className="btn-primary w-full">
              {t('auth:request_new_link')}
            </Link>

            <Link
              href="/auth/signin"
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-secondary-100 px-4 py-2 font-medium text-secondary-700 transition-colors hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-600 rtl:space-x-reverse"
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              <span>{t('auth:signIn')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4 py-12 dark:bg-secondary-900">
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <CheckCircle className="mx-auto h-16 w-16 text-green-600 dark:text-green-400" />
            <h2 className="mt-4 text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              {t('auth:password_updated')}
            </h2>
            <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
              {t('auth:password_changed')}
            </p>
          </div>

          <Link href="/auth/signin" className="btn-primary w-full">
            {t('auth:signIn')}
          </Link>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4 py-12 dark:bg-secondary-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            {t('auth:reset_password_title')}
          </h2>
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
            {t('auth:reset_password_description')}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="password" className="label-field">
              {t('auth:new_password')}
            </label>
            <input
              {...register('password')}
              type="password"
              id="password"
              autoComplete="new-password"
              className="input-field"
              dir="ltr"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {t(`auth:${errors.password.message || ''}`)}
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
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" />
                  {t('auth:processing')}
                </span>
              ) : (
                t('auth:reset_password')
              )}
            </button>

            <Link
              href="/auth/signin"
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-secondary-100 px-4 py-2 font-medium text-secondary-700 transition-colors hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-600 rtl:space-x-reverse"
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              <span>{t('auth:signIn')}</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
