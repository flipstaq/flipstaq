import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { SignupFormData } from '@/types';

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

// Validation schema
const signupSchema = z.object({
  firstName: z.string().min(1, 'validation.required'),
  lastName: z.string().min(1, 'validation.required'),
  email: z.string().email('validation.emailInvalid'),
  username: z.string().min(2, 'validation.usernameMin'),
  password: z.string().min(8, 'validation.passwordMin'),
  dateOfBirth: z
    .string()
    .min(1, 'validation.dateOfBirthRequired')
    .refine((date) => {
      const age = calculateAge(date);
      return age >= 13;
    }, 'validation.ageMin'),
  country: z.string().min(1, 'validation.countryRequired'),
});

export function SignupForm() {
  const { t, isRTL } = useLanguage();
  const { signup, loading, error, clearError, isAuthenticated } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
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
  }, [clearError]);
  const countries = [
    { code: 'US', name: t('auth:countries.US') },
    { code: 'CA', name: t('auth:countries.CA') },
    { code: 'GB', name: t('auth:countries.GB') },
    { code: 'SA', name: t('auth:countries.SA') },
    { code: 'AE', name: t('auth:countries.AE') },
    { code: 'EG', name: t('auth:countries.EG') },
    { code: 'JO', name: t('auth:countries.JO') },
    { code: 'LB', name: t('auth:countries.LB') },
    { code: 'KW', name: t('auth:countries.KW') },
    { code: 'QA', name: t('auth:countries.QA') },
    { code: 'BH', name: t('auth:countries.BH') },
    { code: 'OM', name: t('auth:countries.OM') },
  ];
  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup(data);
      // User will be redirected by useEffect when isAuthenticated becomes true
    } catch (error) {
      // Error is handled by AuthProvider and displayed in the form
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-50 px-4 py-12 dark:bg-secondary-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {' '}
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            {t('auth:createAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
            {t('auth:alreadyHaveAccount')}{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('auth:signInHere')}
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {' '}
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="label-field">
                {t('auth:firstName')}
              </label>
              <input
                {...register('firstName')}
                type="text"
                id="firstName"
                autoComplete="given-name"
                className="input-field"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {t(`auth:${errors.firstName.message || ''}`)}
                </p>
              )}
            </div>
            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="label-field">
                {t('auth:lastName')}
              </label>
              <input
                {...register('lastName')}
                type="text"
                id="lastName"
                autoComplete="family-name"
                className="input-field"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {t(`auth:${errors.lastName.message || ''}`)}
                </p>
              )}
            </div>
            {/* Email */}
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
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {t(`auth:${errors.email.message || ''}`)}
                </p>
              )}
            </div>
            {/* Username */}
            <div>
              <label htmlFor="username" className="label-field">
                {t('auth:username')}
              </label>
              <input
                {...register('username')}
                type="text"
                id="username"
                autoComplete="username"
                className="input-field"
                dir="ltr"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {t(`auth:${errors.username.message || ''}`)}
                </p>
              )}
            </div>
            {/* Password */}
            <div>
              <label htmlFor="password" className="label-field">
                {t('auth:password')}
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
            </div>{' '}
            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="label-field">
                {t('auth:dateOfBirth')}
              </label>
              <input
                {...register('dateOfBirth')}
                type="date"
                id="dateOfBirth"
                className="input-field"
                dir="ltr"
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {t(`auth:${errors.dateOfBirth.message || ''}`)}
                </p>
              )}
            </div>
            {/* Country */}
            <div>
              <label htmlFor="country" className="label-field">
                {t('auth:country')}
              </label>
              <select
                {...register('country')}
                id="country"
                className="input-field"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="">{t('auth:countries.select')}</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {t(`auth:${errors.country.message || ''}`)}
                </p>
              )}
            </div>{' '}
          </div>

          {/* Global Error Display */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {' '}
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
                  </svg>
                  {t('auth:creating')}
                </span>
              ) : (
                t('auth:createAccount')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
