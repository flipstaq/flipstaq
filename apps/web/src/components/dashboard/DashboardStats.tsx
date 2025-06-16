'use client';

import React, { useState, useEffect } from 'react';
import { Package, Eye, Trash2, Clock } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { authService } from '@/lib/auth';
import { formatNumber, formatDate } from '@/utils/formatters';

interface DashboardStatsData {
  totalProducts: number;
  totalViews: number;
  deletedProducts: number;
  lastProduct: {
    name: string;
    createdAt: string;
  } | null;
}

export function DashboardStats() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isRTL = language === 'ar';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = authService.getAccessToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {t('dashboard:product_stats')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg bg-gray-100 p-6 dark:bg-gray-700"
            >
              <div className="mb-2 h-4 w-16 rounded bg-gray-200 dark:bg-gray-600"></div>
              <div className="h-8 w-12 rounded bg-gray-200 dark:bg-gray-600"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 text-sm text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
        >
          {t('common:tryAgain')}
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      icon: Package,
      label: t('dashboard:total_products'),
      value: formatNumber(stats.totalProducts, language),
      color: 'blue',
    },
    {
      icon: Eye,
      label: t('dashboard:total_views'),
      value: formatNumber(stats.totalViews, language),
      color: 'green',
    },
    {
      icon: Trash2,
      label: t('dashboard:deleted_products'),
      value: formatNumber(stats.deletedProducts, language),
      color: 'red',
    },
    {
      icon: Clock,
      label: t('dashboard:last_product'),
      value: stats.lastProduct?.name || t('dashboard:no_products_yet'),
      subtitle: stats.lastProduct
        ? formatDate(stats.lastProduct.createdAt, language)
        : undefined,
      color: 'purple',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      green:
        'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      purple:
        'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {t('dashboard:product_stats')}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
          >
            <div
              className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className={`rounded-lg p-2 ${getColorClasses(card.color)}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className={`${isRTL ? 'mr-4' : 'ml-4'} flex-1`}>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {card.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
