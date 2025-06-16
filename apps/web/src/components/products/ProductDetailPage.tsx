'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Package,
  Share2,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Link from 'next/link';
import Head from 'next/head';

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
  createdAt: string;
  updatedAt: string;
}

interface ProductDetailPageProps {
  username: string;
  slug: string;
  initialProduct?: ProductDetail | null;
}

export function ProductDetailPage({
  username,
  slug,
  initialProduct,
}: ProductDetailPageProps) {
  const { t, language } = useLanguage();
  const [product, setProduct] = useState<ProductDetail | null>(
    initialProduct || null
  );
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const isRTL = language === 'ar';

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (mounted && typeof window !== 'undefined') {
      return `${window.location.origin}/@${username}/${slug}`;
    }
    return `https://flipstaq.com/@${username}/${slug}`;
  };

  const getCanonicalUrl = () => {
    // Always use production URL for meta tags to avoid hydration issues
    return `https://flipstaq.com/@${username}/${slug}`;
  };

  const handleShare = async () => {
    const url = getFullUrl();

    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description || '',
          url: url,
        });
      } catch (err) {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(url);
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(url);
    }
  };

  const fetchProductDetails = async () => {
    if (!username || !slug) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${username}/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
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
    if (!initialProduct && username && slug) {
      fetchProductDetails();
    }
  }, [username, slug, initialProduct]);

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Product... - FlipStaq</title>
        </Head>
        <div className="min-h-screen bg-white dark:bg-secondary-900">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="mb-6 h-8 w-1/4 rounded bg-secondary-200 dark:bg-secondary-700"></div>
              <div className="mb-4 h-12 w-3/4 rounded bg-secondary-200 dark:bg-secondary-700"></div>
              <div className="mb-8 h-4 w-1/2 rounded bg-secondary-200 dark:bg-secondary-700"></div>
              <div className="space-y-4">
                <div className="h-4 w-full rounded bg-secondary-200 dark:bg-secondary-700"></div>
                <div className="h-4 w-3/4 rounded bg-secondary-200 dark:bg-secondary-700"></div>
                <div className="h-4 w-1/2 rounded bg-secondary-200 dark:bg-secondary-700"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Product Not Found - FlipStaq</title>
        </Head>
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-secondary-900">
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              {t('errors.error_title')}
            </h1>
            <p className="text-secondary-500 dark:text-secondary-400">
              {error}
            </p>
            <Link
              href="/"
              className="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('errors.go_home')}
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Head>
          <title>Product Not Found - FlipStaq</title>
        </Head>
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-secondary-900">
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              {t('errors.404_title')}
            </h1>
            <p className="text-secondary-500 dark:text-secondary-400">
              {t('products.noProducts')}
            </p>
            <Link
              href="/"
              className="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('errors.go_home')}
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {' '}
      <Head>
        <title>
          {product.title} by @{product.username} - FlipStaq
        </title>
        <meta
          name="description"
          content={
            product.description ||
            `${product.title} - ${formatPrice(product.price, product.currency)}`
          }
        />
        <meta
          property="og:title"
          content={`${product.title} by @${product.username}`}
        />
        <meta property="og:description" content={product.description || ''} />
        <meta property="og:url" content={getCanonicalUrl()} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content={`${product.title} by @${product.username}`}
        />
        <meta name="twitter:description" content={product.description || ''} />
        <link rel="canonical" href={getCanonicalUrl()} />
      </Head>
      <div className="min-h-screen bg-white dark:bg-secondary-900">
        {/* Header */}
        <div className="border-b border-secondary-200 dark:border-secondary-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200"
              >
                <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('products.backToProducts')}
              </Link>
              <button
                onClick={handleShare}
                className="inline-flex items-center px-3 py-2 text-sm text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200"
              >
                <Share2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('products.directLink.share')}
              </button>
            </div>
          </div>
        </div>

        {/* Product Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-4xl">
            {/* Product Header */}
            <div className="mb-8">
              <h1 className="mb-4 text-3xl font-bold text-secondary-900 dark:text-secondary-100">
                {product.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-secondary-600 dark:text-secondary-400">
                <div className="flex items-center">
                  <User className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  <span>
                    {t('products.modal.postedBy')}{' '}
                    <strong>@{product.username}</strong>
                  </span>
                </div>

                <div className="flex items-center">
                  <MapPin className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  <span>{product.location}</span>
                </div>

                {product.category && (
                  <div className="flex items-center">
                    <Package className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    <span>{product.category}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  <span>{formatDate(product.createdAt)}</span>
                </div>
              </div>
            </div>
            {/* Price */}
            <div className="mb-8">
              <div className="rounded-lg bg-primary-50 p-6 dark:bg-primary-900/20">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {formatPrice(product.price, product.currency)}
                </div>
              </div>
            </div>
            {/* Description */}
            {product.description && (
              <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                  {t('products.description')}
                </h2>
                <div className="prose prose-secondary dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed text-secondary-700 dark:text-secondary-300">
                    {product.description}
                  </p>
                </div>
              </div>
            )}{' '}
            {/* Product URL */}
            {mounted && (
              <div className="border-t border-secondary-200 pt-8 dark:border-secondary-700">
                <div className="flex items-center justify-between rounded-lg bg-secondary-50 p-4 dark:bg-secondary-800">
                  <div className="flex min-w-0 flex-1 items-center">
                    <LinkIcon
                      className={`h-4 w-4 text-secondary-400 ${isRTL ? 'ml-3' : 'mr-3'} flex-shrink-0`}
                    />
                    <span className="truncate text-sm text-secondary-600 dark:text-secondary-400">
                      {getFullUrl()}
                    </span>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(getFullUrl())}
                    className="ml-3 rounded border border-primary-300 px-3 py-1 text-xs font-medium text-primary-600 hover:text-primary-500 dark:border-primary-600 dark:text-primary-400"
                  >
                    {t('products.directLink.copy')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
