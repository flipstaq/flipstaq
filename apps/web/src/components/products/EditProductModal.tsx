'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
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

interface EditProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: product.title,
    description: product.description || '',
    category: product.category || '',
    price: product.price.toString(),
    currency: product.currency,
    location: product.location,
    slug: product.slug,
  });

  useEffect(() => {
    if (product.imageUrl) {
      setImagePreview(`http://localhost:3100${product.imageUrl}`);
    }
  }, [product.imageUrl]);

  const isRTL = language === 'ar';

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setError(t('products:validation.invalidImageType'));
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('products:validation.imageTooLarge'));
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: generateSlug(value),
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError(t('products:validation.titleRequired'));
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError(t('products:validation.priceRequired'));
      setLoading(false);
      return;
    }

    if (!formData.slug.trim()) {
      setError(t('products:validation.slugRequired'));
      setLoading(false);
      return;
    }

    // Validate slug format
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.slug)) {
      setError(t('products:validation.slugFormat'));
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

      const response = await fetch(`/api/products/manage/${product.slug}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to update product');
      }

      onSuccess();
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-secondary-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary-200 p-6 dark:border-secondary-700">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            {t('profile.update_product')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(90vh-140px)] space-y-6 overflow-y-auto p-6"
        >
          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
              {t('products:image')}
            </label>
            <div className="space-y-4">
              {/* Current/Preview Image */}
              {imagePreview && (
                <div className="relative h-48 w-full overflow-hidden rounded-lg bg-secondary-100 dark:bg-secondary-700">
                  <img
                    src={imagePreview}
                    alt={t('products:imagePreview')}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageChange}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-secondary-300 transition-colors hover:border-primary-400 dark:border-secondary-600 dark:hover:border-primary-500">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-secondary-400 dark:text-secondary-500" />
                    <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                      {selectedImage
                        ? t('products:imageSelected')
                        : t('products:selectImage')}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      {t('products:imageRequirements')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title and Slug */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {t('products:title')} *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleTitleChange}
                required
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
                placeholder={t('products:titlePlaceholder')}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {t('products:slug')} *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                required
                pattern="[a-zA-Z0-9_-]+"
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
                placeholder={t('products:slugPlaceholder')}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
              {t('products:description')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
              placeholder={t('products:descriptionPlaceholder')}
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
              {t('products:category')}
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
              placeholder={t('products:categoryPlaceholder')}
            />
          </div>

          {/* Price and Currency */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {t('products:price')} *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {t('products:currency')}
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
              >
                <option value="USD">{t('products.currencies.USD')}</option>
                <option value="AED">{t('products.currencies.AED')}</option>
                <option value="EUR">{t('products.currencies.EUR')}</option>
                <option value="GBP">{t('products.currencies.GBP')}</option>
                <option value="SAR">{t('products.currencies.SAR')}</option>
              </select>
            </div>
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
              className="w-full rounded-lg border border-secondary-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
            >
              <option value="Global">{t('products.locations.global')}</option>
              <option value="United States">
                {t('products.locations.unitedStates')}
              </option>
              <option value="United Arab Emirates">
                {t('products.locations.unitedArabEmirates')}
              </option>
              <option value="United Kingdom">
                {t('products.locations.unitedKingdom')}
              </option>
              <option value="Germany">{t('products.locations.germany')}</option>
              <option value="France">{t('products.locations.france')}</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 border-t border-secondary-200 p-6 dark:border-secondary-700 rtl:space-x-reverse">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-secondary-300 px-4 py-2 text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 dark:border-secondary-600 dark:text-secondary-300 dark:hover:bg-secondary-700"
          >
            {t('profile.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white rtl:ml-2 rtl:mr-0"></div>
                {t('profile.updating')}
              </>
            ) : (
              t('profile.save_changes')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
