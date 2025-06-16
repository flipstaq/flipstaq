'use client';

import React from 'react';
import { NextPageContext } from 'next';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface ErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

function Error({ statusCode, hasGetInitialPropsRun, err }: ErrorProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  // Don't show error page for 404s, let the custom 404 page handle it
  if (statusCode === 404) {
    return null;
  }

  const getErrorMessage = () => {
    if (statusCode === 500) {
      return language === 'ar'
        ? 'خطأ في الخادم الداخلي'
        : 'Internal Server Error';
    }
    if (statusCode === 403) {
      return language === 'ar' ? 'الوصول مرفوض' : 'Access Forbidden';
    }
    if (statusCode) {
      return `${language === 'ar' ? 'خطأ' : 'Error'} ${statusCode}`;
    }
    return t('errors.error_title');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-secondary-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 sm:text-4xl">
            {getErrorMessage()}
          </h1>
          <p className="text-base leading-relaxed text-secondary-500 dark:text-secondary-400">
            {t('errors.error_message')}
          </p>

          {/* Show technical details in development */}
          {process.env.NODE_ENV === 'development' && err && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-left dark:bg-red-900/10">
              <p className="font-mono text-sm text-red-800 dark:text-red-300">
                {err.message}
              </p>
              {err.stack && (
                <pre className="mt-2 overflow-auto text-xs text-red-700 dark:text-red-400">
                  {err.stack}
                </pre>
              )}
            </div>
          )}
        </div>
        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleReload}
            className="group inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-secondary-900"
          >
            <RefreshCw className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            <span>{t('errors.reload_page')}</span>
          </button>

          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-lg border border-secondary-300 bg-white px-6 py-3 text-base font-medium text-secondary-700 transition-colors duration-200 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700 dark:focus:ring-offset-secondary-900"
          >
            <Home className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            <span>{t('errors.go_home')}</span>
          </Link>
        </div>{' '}
        {/* Additional Help */}
        <div className="border-t border-secondary-200 pt-8 dark:border-secondary-700">
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            {t('errors.if_persists')}{' '}
            <Link
              href="/contact"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('errors.contact_support')}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
