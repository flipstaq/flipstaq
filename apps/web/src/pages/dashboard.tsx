'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { MyProducts } from '@/components/products/MyProducts';
import { CreateProductForm } from '@/components/products/CreateProductForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Package, Plus, ArrowLeft, Home } from 'lucide-react';

export default function DashboardPage() {
  const { isAuthenticated, loading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');

  const isRTL = language === 'ar';

  // Check for create parameter from URL
  useEffect(() => {
    if (router.query.create === 'true') {
      setActiveTab('create');
    }
  }, [router.query.create]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900">
      {/* Header */}
      <div className="bg-white shadow dark:bg-secondary-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div
              className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {/* Left side - Go back button and title */}
              <div
                className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}
              >
                <button
                  onClick={() => router.push('/')}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-secondary-700 dark:text-gray-400 dark:hover:bg-secondary-600"
                  title={t('common:home')}
                >
                  {isRTL ? (
                    <ArrowLeft className="h-5 w-5 rotate-180" />
                  ) : (
                    <ArrowLeft className="h-5 w-5" />
                  )}
                </button>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
                  <Package className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('dashboard:title')}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('dashboard:subtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white shadow dark:bg-secondary-800">
          <div className="p-6">
            {/* Tab Navigation */}
            <div className="mb-8 flex justify-center">
              <div className="rounded-lg bg-gray-100 p-1 shadow-sm dark:bg-secondary-700">
                <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => setActiveTab('manage')}
                    className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'manage'
                        ? 'bg-primary-600 text-white'
                        : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100'
                    }`}
                  >
                    <Package
                      className={`inline h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`}
                    />
                    {t('profile:my_products')}
                  </button>
                  <button
                    onClick={() => setActiveTab('create')}
                    className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'create'
                        ? 'bg-primary-600 text-white'
                        : 'text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100'
                    }`}
                  >
                    <Plus
                      className={`inline h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`}
                    />
                    {t('common:postProduct')}
                  </button>
                </div>
              </div>
            </div>
            {activeTab === 'manage' && <MyProducts />}
            {activeTab === 'create' && (
              <CreateProductForm
                onSuccess={() => {
                  setActiveTab('manage');
                }}
                onCancel={() => {
                  setActiveTab('manage');
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
