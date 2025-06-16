'use client';

import React from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  text,
  className = '',
}: LoadingSpinnerProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div
      className={`flex min-h-[200px] flex-col items-center justify-center ${className}`}
    >
      {/* Custom Spinner */}
      <div className="relative mb-4">
        {/* Outer ring */}
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-secondary-200 dark:border-secondary-700`}
        >
          {/* Inner spinning arc */}
          <div
            className={`${sizeClasses[size]} absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary-600 dark:border-t-primary-400`}
          ></div>
        </div>

        {/* Center dot with pulse animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary-600 dark:bg-primary-400"></div>
        </div>
      </div>

      {/* Loading Text */}
      <div
        className={`${textSizeClasses[size]} animate-pulse text-secondary-600 dark:text-secondary-400`}
      >
        {text || t('loading')}
      </div>

      {/* Subtle brand accent */}
      <div className="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-primary-600 to-primary-400 opacity-50"></div>
    </div>
  );
}

// Export variants for common use cases
export function LoadingSpinnerSmall(props: Omit<LoadingSpinnerProps, 'size'>) {
  return <LoadingSpinner {...props} size="sm" />;
}

export function LoadingSpinnerLarge(props: Omit<LoadingSpinnerProps, 'size'>) {
  return <LoadingSpinner {...props} size="lg" />;
}

// Full page loading component
export function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-secondary-900">
      <LoadingSpinner size="lg" />
    </div>
  );
}
