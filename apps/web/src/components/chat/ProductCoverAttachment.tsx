'use client';

import React from 'react';
import { MapPin, ExternalLink, Package, User } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Image from 'next/image';
import Link from 'next/link';

interface ProductCoverAttachmentProps {
  metadata: {
    type: string;
    productId?: string;
    title?: string;
    price?: number;
    currency?: string;
    imageUrl?: string | null;
    username?: string;
    location?: string;
    slug?: string;
  };
}

export default function ProductCoverAttachment({
  metadata,
}: ProductCoverAttachmentProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  // Debug logging
  console.log('ProductCoverAttachment metadata:', metadata);

  if (metadata.type !== 'product-cover') {
    console.log('Not a product cover type:', metadata.type);
    return null;
  }

  const {
    title,
    price,
    currency = 'USD',
    imageUrl,
    username,
    location,
    slug,
  } = metadata;

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const productUrl = username && slug ? `/${username}/${slug}` : '#';

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-secondary-200 bg-white dark:border-secondary-600 dark:bg-secondary-700">
      {/* Header */}
      <div className="border-b border-secondary-200 bg-secondary-50 px-3 py-2 dark:border-secondary-600 dark:bg-secondary-800">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Package className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
            {t('chat:product_shared')}
          </span>
        </div>
      </div>

      {/* Product Content */}
      <div className="p-3">
        <div className="flex space-x-3 rtl:space-x-reverse">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="h-16 w-16 overflow-hidden rounded-lg bg-secondary-100 dark:bg-secondary-600">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title || 'Product'}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-6 w-6 text-secondary-400" />
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="min-w-0 flex-1">
            {/* Product Title */}
            <h4 className="truncate font-semibold text-secondary-900 dark:text-secondary-100">
              {title || t('chat:untitled_product')}
            </h4>

            {/* Price */}
            {price !== undefined && (
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {formatPrice(price, currency)}
              </p>
            )}

            {/* Seller and Location */}
            <div className="mt-1 space-y-1">
              {username && (
                <div className="flex items-center text-xs text-secondary-600 dark:text-secondary-400">
                  <User className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  <span>@{username}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center text-xs text-secondary-600 dark:text-secondary-400">
                  <MapPin className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Product Button */}
        {productUrl !== '#' && (
          <div className="mt-3">
            <Link
              href={productUrl}
              className="inline-flex items-center space-x-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 rtl:space-x-reverse"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3 w-3" />
              <span>{t('chat:view_product')}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
