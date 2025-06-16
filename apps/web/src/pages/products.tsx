import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ProductsList } from '@/components/products/ProductsList';
import { CreateProductForm } from '@/components/products/CreateProductForm';
import { useAuth } from '@/components/providers/AuthProvider';
import { Plus } from 'lucide-react';

export default function ProductsPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 dark:text-secondary-100">
              {t('products.title')}
            </h1>
            <p className="mt-2 text-lg text-secondary-600 dark:text-secondary-400">
              Discover amazing products from our community
            </p>
          </div>

          {isAuthenticated && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Plus className="mr-2 h-5 w-5" />
              {t('products.createProduct')}
            </button>
          )}
        </div>

        {showCreateForm && (
          <div className="mb-8">
            <CreateProductForm
              onSuccess={() => setShowCreateForm(false)}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        <ProductsList />
      </div>
    </Layout>
  );
}
