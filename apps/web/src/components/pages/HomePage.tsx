'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Users, Globe, Shield } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ProductsList } from '@/components/products/ProductsList';

export function HomePage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: ShoppingBag,
      title: 'Multi-Vendor Marketplace',
      description:
        'Connect buyers and sellers in a comprehensive eCommerce platform',
    },
    {
      icon: Users,
      title: 'User Management',
      description:
        'Advanced role-based access control for different user types',
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Support for multiple languages and international commerce',
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Enterprise-grade security and data protection',
    },
  ];

  return (
    <div className="bg-white dark:bg-secondary-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="relative z-10 bg-white pb-8 dark:bg-secondary-900 sm:pb-16 md:pb-20 lg:w-full lg:max-w-2xl lg:pb-28 xl:pb-32">
            <main className="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl font-bold tracking-tight text-secondary-900 dark:text-secondary-100 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">{t('welcome')}</span>
                  <span className="block text-primary-600 xl:inline">
                    {' '}
                    FlipStaq
                  </span>
                </h1>
                <p className="mt-3 text-base text-secondary-500 dark:text-secondary-400 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
                  A modern multi-vendor eCommerce platform built for the global
                  marketplace. Connect, trade, and grow your business with
                  confidence.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      href="/auth/signup"
                      className="flex w-full items-center justify-center rounded-md border border-transparent bg-primary-600 px-8 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-primary-700 md:px-10 md:py-4 md:text-lg"
                    >
                      {t('signUp')}
                    </Link>
                  </div>
                  <div className="mt-3 sm:ml-3 sm:mt-0">
                    <Link
                      href="/products"
                      className="flex w-full items-center justify-center rounded-md border border-transparent bg-primary-100 px-8 py-3 text-base font-medium text-primary-700 transition-colors duration-200 hover:bg-primary-200 dark:bg-primary-800 dark:text-primary-100 dark:hover:bg-primary-700 md:px-10 md:py-4 md:text-lg"
                    >
                      Browse Products
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="flex h-56 w-full items-center justify-center bg-gradient-to-r from-primary-400 to-primary-600 sm:h-72 md:h-96 lg:h-full lg:w-full">
            <div className="text-center text-white">
              <ShoppingBag className="mx-auto mb-4 h-24 w-24" />
              <p className="text-lg font-medium">Your Global Marketplace</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-secondary-50 py-12 dark:bg-secondary-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base font-semibold uppercase tracking-wide text-primary-600">
              Features
            </h2>
            <p className="mt-2 text-3xl font-bold leading-8 tracking-tight text-secondary-900 dark:text-secondary-100 sm:text-4xl">
              Everything you need to succeed
            </p>
            <p className="mt-4 max-w-2xl text-xl text-secondary-500 dark:text-secondary-400 lg:mx-auto">
              Built with modern technologies and best practices for scalability
              and performance.
            </p>
          </div>
          <div className="mt-10">
            <dl className="space-y-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 md:space-y-0">
              {features.map((feature) => (
                <div key={feature.title} className="relative">
                  <dt>
                    <div className="absolute flex h-12 w-12 items-center justify-center rounded-md bg-primary-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-lg font-medium leading-6 text-secondary-900 dark:text-secondary-100">
                      {feature.title}
                    </p>
                  </dt>
                  <dd className="ml-16 mt-2 text-base text-secondary-500 dark:text-secondary-400">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>{' '}
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white py-16 dark:bg-secondary-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ProductsList limit={8} />
          <div className="mt-12 text-center">
            <Link
              href="/products"
              className="inline-flex items-center rounded-md border border-transparent bg-primary-100 px-6 py-3 text-base font-medium text-primary-600 transition-colors duration-200 hover:bg-primary-200 dark:bg-primary-800 dark:text-primary-100 dark:hover:bg-primary-700"
            >
              View All Products
              <svg
                className="ml-2 h-5 w-5 rtl:ml-0 rtl:mr-2 rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block">Create your account today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-primary-100">
            Join thousands of vendors and customers in our global marketplace.
          </p>
          <Link
            href="/auth/signup"
            className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-white px-5 py-3 text-base font-medium text-primary-600 transition-colors duration-200 hover:bg-primary-50 sm:w-auto"
          >
            {t('signUp')}
          </Link>
        </div>
      </div>
    </div>
  );
}
