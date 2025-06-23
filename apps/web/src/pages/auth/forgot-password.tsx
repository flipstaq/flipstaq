import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import axios from 'axios';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('validation.emailInvalid'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { t, isRTL } = useLanguage();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.post('/api/auth/request-password-reset', data);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Password reset request failed:', error);
      setError(t('auth:reset_password_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4 py-12 dark:bg-secondary-900">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              {t('auth:reset_link_sent')}
            </h2>
            <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
              {t('auth:reset_link_sent')}
            </p>
            <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-500">
              {getValues('email')}
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 rtl:space-x-reverse"
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              <span>{t('auth:signIn')}</span>
            </Link>

            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full rounded-lg bg-secondary-100 px-4 py-2 font-medium text-secondary-700 transition-colors hover:bg-secondary-200 dark:bg-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-600"
            >
              {t('auth:request_new_link')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4 py-12 dark:bg-secondary-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            {t('auth:forgot_password_title')}
          </h2>
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
            {t('auth:forgot_password_description')}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="label-field">
              {t('auth:email')}
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              autoComplete="email"
              className="input-field"
              dir="ltr"
              placeholder={t('auth:email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {t(`auth:${errors.email.message || ''}`)}
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
                t('auth:send_reset_link')
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
