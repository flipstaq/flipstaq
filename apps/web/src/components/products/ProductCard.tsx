'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  location: string;
  slug: string;
  username: string;
  createdAt: string;
}

interface ProductCardProps {
  product: Product;
  onProductClick?: (username: string, slug: string) => void;
}

export function ProductCard({ product, onProductClick }: ProductCardProps) {
  const { t, language } = useLanguage();
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-AE' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-AE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };
  const handleClick = () => {
    if (onProductClick) {
      onProductClick(product.username, product.slug);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the modal
  };

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-secondary-200 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg dark:border-secondary-700 dark:bg-secondary-800"
      onClick={handleClick}
    >
      {/* Direct Link Button */}
      <div className="absolute right-3 top-3 z-10 rtl:left-3 rtl:right-auto">
        {' '}
        <Link
          href={`/@${product.username}/${product.slug}`}
          onClick={handleLinkClick}
          className="rounded-full bg-white/90 p-2 text-secondary-600 opacity-0 transition-all duration-200 hover:bg-white hover:text-primary-600 group-hover:opacity-100 dark:bg-secondary-800/90 dark:text-secondary-400 dark:hover:bg-secondary-800 dark:hover:text-primary-400"
          title={t('products.directLink.title')}
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
      <div className="p-6">
        {/* Product Title */}
        <h3 className="text-lg font-semibold text-secondary-900 transition-colors duration-200 group-hover:text-primary-600 dark:text-secondary-100 dark:group-hover:text-primary-400">
          {product.title}
        </h3>

        {/* Product Description */}
        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm text-secondary-500 dark:text-secondary-400">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="mt-3">
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {formatPrice(product.price, product.currency)}
          </span>
        </div>

        {/* Product Meta */}
        <div className="mt-4 flex items-center justify-between text-sm text-secondary-500 dark:text-secondary-400">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span>@{product.username}</span>
            <span>•</span>
            <span>{product.location}</span>
          </div>
          <span>{formatDate(product.createdAt)}</span>
        </div>

        {/* View Product Link */}
        <div className="mt-4">
          <span className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            {t('products.viewProduct')}
            <svg
              className="ml-1 h-4 w-4 rtl:ml-0 rtl:mr-1 rtl:rotate-180"
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
          </span>
        </div>
      </div>
    </div>
  );
}
