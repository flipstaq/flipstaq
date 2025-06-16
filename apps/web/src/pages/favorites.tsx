import React, { useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFavorites } from '@/hooks/useFavorites';
import { useRouter } from 'next/router';
import { Heart, ArrowLeft } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import Link from 'next/link';

export default function FavoritesPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { favorites, isLoading, refetchFavorites } = useFavorites();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    refetchFavorites();
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary-50 dark:bg-secondary-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            {' '}
            <p className="text-secondary-600 dark:text-secondary-400">
              {t('auth.redirectingToLogin')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-50 dark:bg-secondary-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="mx-auto mb-4 h-8 w-48 rounded bg-secondary-200 dark:bg-secondary-700"></div>
              <div className="mx-auto h-4 w-32 rounded bg-secondary-200 dark:bg-secondary-700"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-secondary-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-secondary-600 transition-colors duration-200 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t('back')}</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
              <Heart className="h-6 w-6 text-red-500" />
            </div>
            <div>
              {' '}
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
                {t('favorites')}
              </h1>{' '}
              <p className="text-secondary-600 dark:text-secondary-400">
                {favorites.length === 0
                  ? t('noSavedProducts')
                  : `${favorites.length} ${favorites.length === 1 ? t('productSingular') : t('productPlural')}`}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800">
              <Heart className="h-12 w-12 text-secondary-400 dark:text-secondary-500" />
            </div>{' '}
            <h2 className="mb-2 text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              {t('noSavedProducts')}
            </h2>{' '}
            <p className="mx-auto mb-8 max-w-md text-secondary-600 dark:text-secondary-400">
              {t('noSavedProductsDescription')}
            </p>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors duration-200 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              {t('exploreProducts')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((favorite) => (
              <ProductCard
                key={favorite.id}
                product={{
                  id: favorite.product.id,
                  title: favorite.product.title,
                  description: favorite.product.description,
                  price: favorite.product.price,
                  currency: favorite.product.currency,
                  location: favorite.product.location,
                  slug: favorite.product.slug,
                  username: favorite.product.username,
                  imageUrl: favorite.product.imageUrl,
                  createdAt: favorite.product.createdAt,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
