'use client';

import React, { useState, useRef } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { authService } from '@/lib/auth';
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

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
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRTL = language === 'ar';

  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    category: '',
    price: '',
    currency: 'USD',
    location: 'Global',
    slug: '',
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
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

  const validateImage = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return t('products.upload.invalid_file_type');
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('products.upload.file_too_large');
    }
    return null;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedImage(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (!formData.slug.trim()) {
      setError('URL slug is required');
      setLoading(false);
      return;
    }

    // Validate slug format
    const slugPattern = /^[a-zA-Z0-9_-]+$/;
    if (!slugPattern.test(formData.slug)) {
      setError(
        'Slug can only contain letters, numbers, hyphens, and underscores'
      );
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required');
      setLoading(false);
      return;
    }
    try {
      const token = authService.getAccessToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('currency', formData.currency);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('slug', formData.slug);

      // Add image if selected
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000); // 30 second timeout

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formDataToSend,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to create product');
      }

      const result = await response.json();
      onSuccess();
    } catch (err) {
      console.error('Error creating product:', err);

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else if (err.message.includes('Failed to fetch')) {
          setError(
            'Network error. Please check your connection and try again.'
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to create product');
      }
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
        )}{' '}
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
        {/* Image Upload Section */}
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
            {t('products.upload.upload_image')}
          </label>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleImageSelect}
            className="hidden"
          />

          {!imagePreview ? (
            /* Upload Button */
            <div
              onClick={handleImageUploadClick}
              className="cursor-pointer rounded-lg border-2 border-dashed border-secondary-300 bg-secondary-50 p-8 text-center transition-colors hover:border-primary-400 hover:bg-primary-50 dark:border-secondary-600 dark:bg-secondary-700 dark:hover:border-primary-500 dark:hover:bg-primary-900/20"
            >
              <Upload className="mx-auto h-12 w-12 text-secondary-400 dark:text-secondary-500" />
              <p className="mt-2 text-sm font-medium text-secondary-600 dark:text-secondary-400">
                {t('products.upload.select_image')}
              </p>
              <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-500">
                {t('products.upload.supported_formats')}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-500">
                {t('products.upload.max_file_size')}
              </p>
            </div>
          ) : (
            /* Image Preview */
            <div className="relative">
              <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-4 dark:border-secondary-600 dark:bg-secondary-700">
                <div className="flex items-start space-x-4 rtl:space-x-reverse">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt={t('products.upload.preview')}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {selectedImage?.name}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      {selectedImage &&
                        (selectedImage.size / 1024 / 1024).toFixed(2)}{' '}
                      MB
                    </p>
                    <div className="mt-2 flex space-x-2 rtl:space-x-reverse">
                      <button
                        type="button"
                        onClick={handleImageUploadClick}
                        className="text-xs text-primary-600 hover:text-primary-500 dark:text-primary-400"
                      >
                        {t('products.upload.change_image')}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-xs text-red-600 hover:text-red-500 dark:text-red-400"
                      >
                        {t('products.upload.remove_image')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
          </label>{' '}
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            required
            title={t('products:validation.slugFormat')}
            className="w-full rounded-md border border-secondary-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
            placeholder={t('products.placeholders.slug')}
          />
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            This will be part of your product URL: @username/
            {formData.slug || 'your-slug'}
          </p>
        </div>{' '}
        {/* Form Actions */}
        <div className="flex justify-end space-x-4 rtl:space-x-reverse">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-secondary-300 px-4 py-2 text-secondary-700 transition-colors duration-200 hover:bg-secondary-50 dark:border-secondary-600 dark:text-secondary-300 dark:hover:bg-secondary-700"
          >
            Cancel
          </button>{' '}
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
