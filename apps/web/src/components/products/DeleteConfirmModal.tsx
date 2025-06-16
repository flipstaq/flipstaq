'use client';

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { authService } from '@/lib/auth';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  location: string;
  slug: string;
  username: string;
  imageUrl?: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: DeleteConfirmModalProps) {
  const { t, language } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRTL = language === 'ar';
  const handleDelete = async () => {
    if (!product) return;

    // Validate product slug before attempting deletion
    if (!product.slug || product.slug.length < 2 || product.slug.length > 100) {
      setError('Invalid product data. Please refresh and try again.');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      console.log('🗑️ Deleting product:', product.slug);

      const token = authService.getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/products/manage/${product.slug}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to delete product' }));
        throw new Error(errorData.message || 'Failed to delete product');
      }

      // Call success callback
      onSuccess();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('profile:delete_confirmation')}
          </h2>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>

          {/* Product Info */}
          <div className="mb-6 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              {product.title}
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {t('profile:confirm_delete')}
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              <span className="font-medium">
                {t('products:price')}: {product.currency}{' '}
                {product.price.toLocaleString()}
              </span>
              <br />
              <span>
                {t('products:location')}: {product.location}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {t('profile:cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('profile:deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {t('profile:delete')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
