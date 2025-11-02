'use client';

import React, { useState, useEffect } from 'react';
import {
  Edit,
  Trash2,
  Plus,
  Package,
  Clock,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { authService } from '@/lib/auth';
import { EditProductModal } from './EditProductModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Avatar from '@/components/ui/Avatar';
import {
  formatNumber,
  formatCurrency,
  formatDate as formatDateUtil,
} from '@/utils/formatters';
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
  category: string | null;
  type: ProductType;
  isActive: boolean;
  isSold: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  rejectedBy?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  approvalReason?: string;
  createdAt: string;
  updatedAt: string;
}

export function MyProducts() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isRTL = language === 'ar';

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = authService.getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/products/my-products', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to fetch products' }));
        throw new Error(errorData.message || 'Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching my products:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
    fetchMyProducts(); // Refresh the list
  };

  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    setDeletingProduct(null);
    fetchMyProducts(); // Refresh the list
  };

  const handleStatusUpdate = async (product: Product, isSold: boolean) => {
    try {
      const token = authService.getAccessToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/products/manage/${product.slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isSold }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product status');
      }

      // Update the product in the local state
      setProducts((prevProducts) =>
        prevProducts.map((p) => (p.id === product.id ? { ...p, isSold } : p))
      );

      // You could add a toast notification here
      console.log(
        `Product ${isSold ? 'marked as sold' : 'marked as available'}`
      );
    } catch (error) {
      console.error('Error updating product status:', error);
      // You could add error handling/notification here
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-AE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <Package className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          {t('common:error')}
        </h3>
        <p className="mb-4 text-secondary-600 dark:text-secondary-400">
          {error}
        </p>{' '}
        <button
          onClick={fetchMyProducts}
          className="rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
        >
          {t('common:tryAgain')}
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            {t('profile:my_products')}
          </h2>
          <p className="mt-1 text-secondary-600 dark:text-secondary-400">
            {products.length > 0
              ? `${formatNumber(products.length, language)} ${
                  products.length === 1
                    ? t('products:product')
                    : t('products:products')
                }`
              : t('profile:no_products')}
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchMyProducts}
          disabled={loading}
          className={`inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 ${
            loading ? 'cursor-not-allowed' : ''
          }`}
          title={t('common:refresh')}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${
              loading ? 'animate-spin' : ''
            }`}
          />
          {t('common:refresh')}
        </button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800">
            <Package className="h-10 w-10 text-secondary-400 dark:text-secondary-500" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            {t('profile:no_products')}
          </h3>
          <p className="mb-6 text-secondary-600 dark:text-secondary-400">
            {t('profile:start_selling')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-lg border border-secondary-200 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg dark:border-secondary-700 dark:bg-secondary-800"
            >
              {/* Rejection Alert for Rejected Products */}
              {product.status === 'REJECTED' && (
                <div className="relative z-10 border-b border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/90">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-4 w-4 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div
                      className={`ml-2 flex-1 ${isRTL ? 'text-right' : 'text-left'} rtl:ml-0 rtl:mr-2`}
                    >
                      <h3 className="text-xs font-medium text-red-800 dark:text-red-300">
                        {t('dashboard:product_rejected')}
                      </h3>
                      {product.approvalReason && (
                        <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                          <strong>{t('dashboard:rejection_reason')}:</strong>{' '}
                          {product.approvalReason.length > 60
                            ? `${product.approvalReason.substring(0, 60)}...`
                            : product.approvalReason}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-medium text-red-800 dark:text-red-300">
                        {t('dashboard:edit_to_resubmit')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Image Banner */}
              <div className="relative h-48 w-full overflow-hidden bg-secondary-100 dark:bg-secondary-700">
                {product.imageUrl ? (
                  <img
                    src={
                      product.imageUrl.startsWith('http')
                        ? product.imageUrl
                        : `http://localhost:3100${product.imageUrl}`
                    }
                    alt={product.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Package className="mx-auto h-12 w-12 text-secondary-400 dark:text-secondary-500" />
                      <p className="mt-2 text-xs text-secondary-400 dark:text-secondary-500">
                        {t('products:noImage')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons - Top Right */}
                <div className="absolute right-3 top-3 z-10 flex gap-2 rtl:left-3 rtl:right-auto">
                  <button
                    onClick={() => handleEditProduct(product)}
                    disabled={product.isSold && product.status !== 'REJECTED'}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-secondary-600 shadow-md backdrop-blur-sm transition-colors ${
                      product.isSold && product.status !== 'REJECTED'
                        ? 'cursor-not-allowed opacity-50'
                        : product.status === 'REJECTED'
                          ? 'hover:bg-yellow-100 hover:text-yellow-600 dark:hover:bg-yellow-900/50 dark:hover:text-yellow-400'
                          : 'hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 dark:hover:text-blue-400'
                    } dark:bg-secondary-800/90 dark:text-secondary-400`}
                    title={
                      product.status === 'REJECTED'
                        ? t('dashboard:edit_to_resubmit')
                        : product.isSold
                          ? t('profile:cannot_edit_sold')
                          : t('profile:edit_product')
                    }
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-secondary-600 shadow-md backdrop-blur-sm transition-colors hover:bg-red-100 hover:text-red-600 dark:bg-secondary-800/90 dark:text-secondary-400 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                    title={t('profile:delete_product')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Product Content */}
              <div className="p-4">
                {/* Product Title and Type */}
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    {product.title}
                  </h3>
                  <span className="ml-2 inline-flex items-center rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-800 dark:bg-secondary-700 dark:text-secondary-200 rtl:ml-0 rtl:mr-2">
                    {product.type}
                  </span>
                </div>

                {/* Product Description */}
                {product.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-secondary-500 dark:text-secondary-400">
                    {product.description}
                  </p>
                )}

                {/* Price */}
                <div className="mt-3">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {new Intl.NumberFormat(
                      language === 'ar' ? 'ar-AE' : 'en-US',
                      {
                        style: 'currency',
                        currency: product.currency,
                      }
                    ).format(product.price)}
                  </span>
                </div>

                {/* Status Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {/* Approval Status Badge - Most Important */}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      product.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : product.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}
                  >
                    {product.status === 'APPROVED'
                      ? t('dashboard:status_approved')
                      : product.status === 'REJECTED'
                        ? t('dashboard:status_rejected')
                        : t('dashboard:status_pending')}
                  </span>

                  {/* Visibility Badge - Only show for approved products */}
                  {product.status === 'APPROVED' && (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        product.isActive
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}
                    >
                      <div
                        className={`mr-1 h-2 w-2 rounded-full ${product.isActive ? 'bg-blue-500' : 'bg-gray-500'} rtl:ml-1 rtl:mr-0`}
                      ></div>
                      {product.isActive
                        ? t('dashboard:visible')
                        : t('dashboard:hidden')}
                    </span>
                  )}

                  {/* Sold Badge */}
                  {product.isSold && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                      {t('dashboard:sold')}
                    </span>
                  )}
                </div>

                {/* Product Meta */}
                <div className="mt-4 flex items-center justify-between text-sm text-secondary-500 dark:text-secondary-400">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {/* User Avatar */}
                    <Avatar src={product.userAvatarUrl} size="xs" />
                    <span>@{product.username}</span>
                    <span>•</span>
                    <span>{product.location}</span>
                  </div>
                  <span>{formatDate(product.createdAt)}</span>
                </div>

                {/* Sold Status Toggle */}
                <div className="mt-4">
                  <button
                    onClick={() => handleStatusUpdate(product, !product.isSold)}
                    className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      product.isSold
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/40'
                        : 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-800/40'
                    }`}
                  >
                    {product.isSold
                      ? t('dashboard:mark_as_available')
                      : t('dashboard:mark_as_sold')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <DeleteConfirmModal
          product={deletingProduct}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingProduct(null);
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
