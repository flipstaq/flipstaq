'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Users } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { ProductsList } from '@/components/products/ProductsList';

export function HomePage() {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [userCount, setUserCount] = useState(0);

  const isRTL = language === 'ar';

  // Mock user count - replace with real API call later
  useEffect(() => {
    // Simulating API call for user count
    const fetchUserCount = async () => {
      try {
        // TODO: Replace with real API call to /api/users/count
        // const response = await fetch('/api/users/count');
        // const data = await response.json();
        // setUserCount(data.count);

        // Mock data for now
        setUserCount(3450);
      } catch (error) {
        console.error('Error fetching user count:', error);
        setUserCount(3450); // Fallback number
      }
    };

    fetchUserCount();
  }, []);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 py-16 dark:from-secondary-800 dark:to-secondary-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {' '}
            <h1 className="text-4xl font-bold tracking-tight text-secondary-900 dark:text-secondary-100 sm:text-5xl md:text-6xl">
              <span className="block">{t('common:welcome')}</span>
              <span className="block text-primary-600 dark:text-primary-400">
                Flipstaq
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-secondary-500 dark:text-secondary-400 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
              {t('home:discover_products')}
            </p>
          </div>
        </div>
      </div>
      {/* User Count Section */}
      <div className="border-b border-secondary-200 bg-white py-8 dark:border-secondary-700 dark:bg-secondary-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 rounded-full bg-primary-50 px-4 py-2 text-primary-600 dark:bg-primary-900 dark:text-primary-300 rtl:space-x-reverse">
              <Users className="h-5 w-5" />{' '}
              <span className="text-sm font-medium">
                {t('home:user_count_text', {
                  count: userCount.toLocaleString(),
                })}
              </span>
            </div>
          </div>
        </div>
      </div>{' '}
      {/* Search Section */}
      <div className="bg-white py-8 dark:bg-secondary-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 rtl:left-auto rtl:right-0 rtl:pr-3">
                <Search
                  className="h-5 w-5 text-secondary-400"
                  aria-hidden="true"
                />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className={`block w-full rounded-lg border border-secondary-300 bg-white py-4 text-secondary-900 placeholder-secondary-500 focus:border-primary-500 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-100 dark:placeholder-secondary-400 sm:text-sm ${
                  isRTL ? 'pr-10 text-right' : 'pl-10'
                }`}
                placeholder={t('home:search_placeholder')}
              />
              {searchQuery && (
                <div className="absolute inset-y-0 right-0 flex items-center rtl:left-0 rtl:right-auto">
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mr-3 rounded-md bg-secondary-100 px-3 py-2 text-sm font-medium text-secondary-600 transition-colors duration-200 hover:bg-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-600 rtl:ml-3 rtl:mr-0"
                  >
                    {t('common:clear')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>{' '}
      </div>{' '}
      {/* Products Section */}
      <div className="bg-white py-16 dark:bg-secondary-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ProductsList searchQuery={searchQuery} />
        </div>
      </div>{' '}
      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            <span className="block">{t('home:ready_to_get_started')}</span>
            <span className="block">{t('home:create_account_today')}</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-primary-100">
            {t('home:join_thousands')}
          </p>
          <Link
            href="/auth/signup"
            className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-white px-5 py-3 text-base font-medium text-primary-600 transition-colors duration-200 hover:bg-primary-50 sm:w-auto"
          >
            {t('common:signUp')}
          </Link>
        </div>
      </div>
    </div>
  );
}
