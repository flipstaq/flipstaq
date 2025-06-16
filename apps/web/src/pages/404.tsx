'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function Custom404() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-secondary-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* 404 Number */}
        <div>
          <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">
            404
          </h1>
        </div>
        {/* Error Message */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 sm:text-3xl">
            {t('errors.404_title')}
          </h2>
          <p className="text-base leading-relaxed text-secondary-500 dark:text-secondary-400">
            {t('errors.404_message')}
          </p>
        </div>
        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/"
            className="group inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-secondary-900"
          >
            {isRTL ? (
              <>
                <span>{t('errors.go_home')}</span>
                <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            ) : (
              <>
                <Home className="mr-2 h-5 w-5" />
                <span>{t('errors.go_home')}</span>
              </>
            )}
          </Link>{' '}
          <button
            onClick={() => window.history.back()}
            className="inline-flex w-full items-center justify-center rounded-lg border border-secondary-300 bg-white px-6 py-3 text-base font-medium text-secondary-700 transition-colors duration-200 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700 dark:focus:ring-offset-secondary-900"
          >
            {isRTL ? (
              <>
                <span>{t('errors.go_back')}</span>
                <ArrowLeft className="mr-2 h-5 w-5" />
              </>
            ) : (
              <>
                <ArrowLeft className="mr-2 h-5 w-5" />
                <span>{t('errors.go_back')}</span>
              </>
            )}
          </button>
        </div>{' '}
        {/* Additional Help */}
        <div className="border-t border-secondary-200 pt-8 dark:border-secondary-700">
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            {t('errors.if_mistake')}{' '}
            <Link
              href="/contact"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('errors.contact_us')}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
