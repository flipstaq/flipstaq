'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { authService } from '@/lib/auth';
import { X } from 'lucide-react';

interface CreateProductFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ProductFormData {
  title: string;
  description: string;
  category: string;
  price: string;
  currency: string;
  location: string;
  slug: string;
}

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'AED', label: 'AED (د.إ)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'SAR', label: 'SAR (ر.س)' },
];

const locations = [
  'Global',
  'United States',
  'United Arab Emirates',
  'United Kingdom',
  'Germany',
  'France',
  'Saudi Arabia',
];

export function CreateProductForm({
  onSuccess,
  onCancel,
}: CreateProductFormProps) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    category: '',
    price: '',
    currency: 'USD',
    location: 'Global',
    slug: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from title
    if (name === 'title') {
      const slugValue = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData((prev) => ({
        ...prev,
        slug: slugValue,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = authService.getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create product');
      }

      const result = await response.json();
      console.log('Product created:', result);
      onSuccess();
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-secondary-200 bg-white shadow-lg dark:border-secondary-700 dark:bg-secondary-800">
      <div className="border-b border-secondary-200 px-6 py-4 dark:border-secondary-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            {t('products.createProduct')}
          </h2>
          <button
            onClick={onCancel}
            className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
              {t('products.title')} *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border border-secondary-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
              placeholder={t('products.placeholders.title')}
            />
          </div>

          {/* Price & Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {t('products.price')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-secondary-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
                placeholder={t('products.placeholders.price')}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {t('products.currency')}
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full rounded-md border border-secondary-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
              >
                {currencies.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
              {t('products.category')}
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full rounded-md border border-secondary-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
              placeholder={t('products.placeholders.category')}
            />
          </div>

          {/* Location */}
          <div>
            <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
              {t('products.location')} *
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border border-secondary-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
            {t('products.description')}
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full rounded-md border border-secondary-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
            placeholder={t('products.placeholders.description')}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
            {t('products.slug')} *
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            required
            pattern="^[a-zA-Z0-9_-]+$"
            className="w-full rounded-md border border-secondary-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
            placeholder={t('products.placeholders.slug')}
          />
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            This will be part of your product URL: @username/
            {formData.slug || 'your-slug'}
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 rtl:space-x-reverse">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-secondary-300 px-4 py-2 text-secondary-700 transition-colors duration-200 hover:bg-secondary-50 dark:border-secondary-600 dark:text-secondary-300 dark:hover:bg-secondary-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating...' : t('products.createProduct')}
          </button>
        </div>
      </form>
    </div>
  );
}
