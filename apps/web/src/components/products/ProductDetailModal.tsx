'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Package,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProductDetail {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  location: string;
  category: string | null;
  slug: string;
  username: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  slug: string;
}

export function ProductDetailModal({
  isOpen,
  onClose,
  username,
  slug,
}: ProductDetailModalProps) {
  const { t, language } = useLanguage();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRTL = language === 'ar';

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-AE' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-AE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getFullUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/@${username}/${slug}`;
    }
    return `https://flipstaq.com/@${username}/${slug}`;
  };
  const fetchProductDetails = async () => {
    if (!username || !slug) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${username}/products/${slug}`);

      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }

      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && username && slug) {
      fetchProductDetails();
    }
  }, [isOpen, username, slug]);
  const handleClose = () => {
    setProduct(null);
    setError(null);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all dark:bg-secondary-800 ${
            isRTL ? 'text-right' : 'text-left'
          }`}
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={(e) => e.stopPropagation()}
        >
          {' '}
          {/* Header */}
          <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4 dark:border-secondary-700">
            <h3 className="text-lg font-medium leading-6 text-secondary-900 dark:text-secondary-100">
              {t('products.productDetails')}
            </h3>
            <button
              type="button"
              className="rounded-md p-2 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:hover:bg-secondary-700"
              onClick={handleClose}
            >
              <span className="sr-only">{t('products.modal.close')}</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {/* Content */}
          <div className="px-6 py-6">
            {' '}
            {loading && (
              <div className="py-12">
                <LoadingSpinner size="sm" text={t('products.modal.loading')} />
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <div className="flex">
                  <div className="ml-3 rtl:ml-0 rtl:mr-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      {t('products.modal.error')}
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {product && (
              <div className="space-y-6">
                {/* Main Product Info */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Left Column - Product Image Placeholder */}
                  <div className="aspect-square w-full rounded-lg bg-secondary-100 dark:bg-secondary-700">
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-16 w-16 text-secondary-400 dark:text-secondary-500" />
                    </div>
                  </div>

                  {/* Right Column - Product Details */}
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                        {product.title}
                      </h1>
                    </div>

                    {/* Price */}
                    <div>
                      <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    </div>

                    {/* Meta Information */}
                    <div className="space-y-3">
                      {/* Posted By */}
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <User className="h-5 w-5 text-secondary-400" />
                        <span className="text-sm text-secondary-600 dark:text-secondary-400">
                          {t('products.modal.postedBy')}
                        </span>
                        <span className="font-medium text-secondary-900 dark:text-secondary-100">
                          @{product.username}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <MapPin className="h-5 w-5 text-secondary-400" />
                        <span className="text-sm text-secondary-600 dark:text-secondary-400">
                          {t('products.location')}:
                        </span>
                        <span className="font-medium text-secondary-900 dark:text-secondary-100">
                          {product.location}
                        </span>
                      </div>

                      {/* Category */}
                      {product.category && (
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Package className="h-5 w-5 text-secondary-400" />
                          <span className="text-sm text-secondary-600 dark:text-secondary-400">
                            {t('products.category')}:
                          </span>
                          <span className="font-medium text-secondary-900 dark:text-secondary-100">
                            {product.category}
                          </span>
                        </div>
                      )}

                      {/* Date Posted */}
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Calendar className="h-5 w-5 text-secondary-400" />
                        <span className="text-sm text-secondary-600 dark:text-secondary-400">
                          {t('products.modal.datePosted')}:
                        </span>
                        <span className="font-medium text-secondary-900 dark:text-secondary-100">
                          {formatDate(product.createdAt)}
                        </span>
                      </div>

                      {/* Full URL */}
                      <div className="flex items-start space-x-2 rtl:space-x-reverse">
                        <LinkIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary-400" />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm text-secondary-600 dark:text-secondary-400">
                            {t('products.modal.fullUrl')}:
                          </span>
                          <div className="mt-1 break-all rounded-md bg-secondary-50 p-2 font-mono text-sm text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300">
                            {getFullUrl()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="border-t border-secondary-200 pt-6 dark:border-secondary-700">
                    <h2 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
                      {t('products.description')}
                    </h2>
                    <div className="prose prose-sm mt-3 max-w-none text-secondary-600 dark:text-secondary-400">
                      <p className="whitespace-pre-wrap">
                        {product.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Footer */}
          <div className="border-t border-secondary-200 px-6 py-4 dark:border-secondary-700">
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-primary-100 px-4 py-2 text-sm font-medium text-primary-900 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-800 dark:text-primary-100 dark:hover:bg-primary-700"
                onClick={handleClose}
              >
                {t('products.modal.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
