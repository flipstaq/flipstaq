'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Image as ImageIcon, Star } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { FavoriteButton } from './FavoriteButton';
import Avatar from '@/components/ui/Avatar';
import { ProductType } from '@/types';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  location: string;
  slug: string;
  username: string;
  userAvatarUrl?: string | null;
  userFirstName?: string;
  userLastName?: string;
  imageUrl?: string | null;
  type: ProductType;
  createdAt: string;
  averageRating?: number;
  totalReviews?: number;
}

interface ProductCardProps {
  product: Product;
  onProductClick?: (username: string, slug: string) => void;
}

export function ProductCard({ product, onProductClick }: ProductCardProps) {
  const { t, language } = useLanguage();

  const getProductTypeLabel = (type: ProductType) => {
    switch (type) {
      case 'DIGITAL':
        return t('products.types.DIGITAL');
      case 'PHYSICAL':
        return t('products.types.PHYSICAL');
      case 'SERVICE':
        return t('products.types.SERVICE');
      default:
        return type;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-AE' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
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
      {' '}
      {/* Product Image Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-secondary-100 dark:bg-secondary-700">
        {product.imageUrl ? (
          <img
            src={`http://localhost:3100${product.imageUrl}`}
            alt={t('products.productImage', { title: product.title })}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-secondary-400 dark:text-secondary-500" />
              <p className="mt-2 text-xs text-secondary-400 dark:text-secondary-500">
                {t('products.noImage')}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 rtl:left-3 rtl:right-auto">
          {/* Favorite Button */}
          <FavoriteButton
            productId={product.id}
            size="md"
            className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />

          {/* Direct Link Button */}
          <Link
            href={`/@${product.username}/${product.slug}`}
            onClick={handleLinkClick}
            className="rounded-full bg-white/90 p-2 text-secondary-600 opacity-0 shadow-md transition-all duration-200 hover:bg-white hover:text-primary-600 group-hover:opacity-100 dark:bg-secondary-800/90 dark:text-secondary-400 dark:hover:bg-secondary-800 dark:hover:text-primary-400"
            title={t('products.directLink.title')}
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="p-6">
        {/* Product Title and Type */}
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-secondary-900 transition-colors duration-200 group-hover:text-primary-600 dark:text-secondary-100 dark:group-hover:text-primary-400">
            {product.title}
          </h3>
          <span className="ml-2 inline-flex items-center rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-800 dark:bg-secondary-700 dark:text-secondary-200 rtl:ml-0 rtl:mr-2">
            {getProductTypeLabel(product.type)}
          </span>
        </div>
        {/* Product Description */}
        {product.description && (
          <p className="mt-2 line-clamp-2 text-sm text-secondary-500 dark:text-secondary-400">
            {product.description}
          </p>
        )}{' '}
        {/* Price and Reviews */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {formatPrice(product.price, product.currency)}
          </span>

          {/* Reviews Display */}
          {product.totalReviews !== undefined && product.totalReviews > 0 && (
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {product.averageRating?.toFixed(1) || '0.0'}
              </span>
              <span className="text-sm text-secondary-500 dark:text-secondary-400">
                ({product.totalReviews})
              </span>
            </div>
          )}
        </div>
        {/* Product Meta */}
        <div className="mt-4 flex items-center text-sm text-secondary-500 dark:text-secondary-400">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {/* User Avatar */}
            <Avatar
              src={product.userAvatarUrl}
              alt={`${product.userFirstName} ${product.userLastName}`}
              size="xs"
              className="h-5 w-5"
            />
            <span>@{product.username}</span>
            <span>•</span>
            <span>{product.location}</span>
          </div>
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
