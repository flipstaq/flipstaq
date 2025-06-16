'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Package, Clock, Calendar } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { authService } from '@/lib/auth';
import { ProductCard } from './ProductCard';
import { EditProductModal } from './EditProductModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  formatNumber,
  formatCurrency,
  formatDate as formatDateUtil,
} from '@/utils/formatters';

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
  isSold: boolean;
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
            <div key={product.id} className="relative">
              <ProductCard product={product} onProductClick={() => {}} />
              {/* Action Buttons */}
              <div className="absolute right-2 top-2 flex space-x-2 rtl:left-2 rtl:right-auto rtl:space-x-reverse">
                {' '}
                <button
                  onClick={() => handleEditProduct(product)}
                  disabled={product.isSold}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-secondary-600 shadow-md backdrop-blur-sm transition-colors ${
                    product.isSold
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 dark:hover:text-blue-400'
                  } dark:bg-secondary-800/90 dark:text-secondary-400`}
                  title={
                    product.isSold
                      ? 'Cannot edit sold product'
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
              </div>{' '}
              {/* Status Badges */}
              <div className="absolute bottom-2 left-2 flex flex-col space-y-1 rtl:left-auto rtl:right-2">
                {/* Active/Inactive Badge */}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    product.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                  }`}
                >
                  <div
                    className={`mr-1 h-2 w-2 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-500'} rtl:ml-1 rtl:mr-0`}
                  ></div>
                  {product.isActive
                    ? t('profile:active')
                    : t('profile:inactive')}
                </span>
                {/* Sold/Available Badge */}
                {product.isSold && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                    {t('dashboard:sold')}
                  </span>
                )}
              </div>
              {/* Sold Status Toggle */}
              <div className="absolute bottom-2 right-2 rtl:left-2 rtl:right-auto">
                {' '}
                <button
                  onClick={() => handleStatusUpdate(product, !product.isSold)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    product.isSold
                      ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/40'
                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-800/40'
                  }`}
                  title={
                    product.isSold
                      ? t('dashboard:mark_as_available')
                      : t('dashboard:mark_as_sold')
                  }
                >
                  {product.isSold
                    ? t('dashboard:mark_as_available')
                    : t('dashboard:mark_as_sold')}
                </button>
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
