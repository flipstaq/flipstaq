import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function ProductsPage() {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mb-8 text-4xl font-bold text-secondary-900 dark:text-secondary-100">
            {t('products')}
          </h1>
          <p className="mb-8 text-lg text-secondary-600 dark:text-secondary-400">
            Product catalog coming soon...
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Placeholder product cards */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-secondary-200 bg-white p-6 shadow-md dark:border-secondary-700 dark:bg-secondary-800"
              >
                <div className="mb-4 h-48 rounded-lg bg-secondary-200 dark:bg-secondary-600"></div>
                <h3 className="mb-2 text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Product {i}
                </h3>
                <p className="mb-4 text-secondary-600 dark:text-secondary-400">
                  Product description goes here...
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary-600">
                    $99.99
                  </span>
                  <button className="btn-primary">Add to Cart</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
