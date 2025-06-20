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
  MessageCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useChat } from '@/contexts/ChatContext';
import { useToast } from '@/components/providers/ToastProvider';
import { productsApi, Product } from '../../lib/api/products';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import InlineMessageComposer from '@/components/chat/InlineMessageComposer';
import { BlockButton } from '@/components/common/BlockButton';
import { useBlockStatus } from '@/hooks/useBlockStatus';
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
  userId: string;
  imageUrl?: string | null;
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
  const { user } = useAuth();
  const { openChatWith } = useChat();
  const { info, success } = useToast();
  const [product, setProduct] = useState<ProductDetail | null>(
    initialProduct || null
  );
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showMessageComposer, setShowMessageComposer] = useState(false);

  // Block status hook for the product owner
  const { blockStatus, updateBlockStatus } = useBlockStatus(
    product?.userId && user?.id !== product.userId ? product.userId : null
  );

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
  const handleMessageSeller = () => {
    if (!product) {
      return;
    }

    if (!user) {
      info(t('auth.loginRequired'));
      return;
    }

    // Prevent users from messaging themselves
    if (product.userId === user.id) {
      info(t('products.detail.cannot_message_yourself'));
      return;
    }

    // Show inline message composer instead of opening full chat
    setShowMessageComposer(true);
  };
  const fetchProductDetails = async () => {
    if (!username || !slug) return;

    setLoading(true);
    setError(null);

    try {
      const data = await productsApi.getByUsernameAndSlug(username, slug);
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
        {' '}
        <Head>
          <title>Loading Product... - Flipstaq</title>
        </Head>
        <div className="min-h-screen bg-white dark:bg-secondary-900">
          <div className="container mx-auto px-4 py-8">
            <div className="mx-auto max-w-4xl">
              {/* Breadcrumb skeleton */}
              <div className="mb-6 h-4 w-64 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700"></div>

              {/* Main card skeleton */}
              <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-secondary-800">
                {/* Image skeleton */}
                <div className="h-64 animate-pulse bg-secondary-200 dark:bg-secondary-700 md:h-80"></div>

                <div className="p-6 md:p-8">
                  {/* Title skeleton */}
                  <div className="mb-4 h-8 w-3/4 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700"></div>

                  {/* Seller info skeleton */}
                  <div className="mb-4 flex items-center">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-secondary-200 dark:bg-secondary-700"></div>
                    <div className={`${isRTL ? 'mr-3' : 'ml-3'} space-y-2`}>
                      <div className="h-3 w-20 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700"></div>
                      <div className="h-4 w-24 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700"></div>
                    </div>
                  </div>

                  {/* Meta info skeleton */}
                  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="h-12 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700"></div>
                    <div className="h-12 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700"></div>
                    <div className="h-12 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700"></div>
                  </div>

                  {/* Price skeleton */}
                  <div className="mb-6 h-20 animate-pulse rounded-lg bg-secondary-200 dark:bg-secondary-700"></div>

                  {/* Description skeleton */}
                  <div className="mb-6 space-y-3">
                    <div className="h-6 w-32 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-full animate-pulse rounded bg-secondary-200 dark:bg-secondary-700"></div>
                      <div className="h-4 w-3/4 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700"></div>
                      <div className="h-4 w-1/2 animate-pulse rounded bg-secondary-200 dark:bg-secondary-700"></div>
                    </div>
                  </div>

                  {/* Buttons skeleton */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="h-12 flex-1 animate-pulse rounded-lg bg-secondary-200 dark:bg-secondary-700"></div>
                    <div className="h-12 w-32 animate-pulse rounded-lg bg-secondary-200 dark:bg-secondary-700"></div>
                  </div>
                </div>
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
          <title>Product Not Found - Flipstaq</title>
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
          <title>Product Not Found - Flipstaq</title>
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
        {' '}
        <title>{`${product.title} by @${product.username} - Flipstaq`}</title>
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
        {product.imageUrl && (
          <meta
            property="og:image"
            content={`http://localhost:3100${product.imageUrl}`}
          />
        )}
        <meta
          name="twitter:card"
          content={product.imageUrl ? 'summary_large_image' : 'summary'}
        />
        <meta
          name="twitter:title"
          content={`${product.title} by @${product.username}`}
        />
        <meta name="twitter:description" content={product.description || ''} />
        {product.imageUrl && (
          <meta
            name="twitter:image"
            content={`http://localhost:3100${product.imageUrl}`}
          />
        )}
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
        </div>{' '}
        {/* Product Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-4xl">
            {/* Breadcrumb */}
            <nav className="mb-6">
              <ol className="flex items-center space-x-2 text-sm text-secondary-500 dark:text-secondary-400 rtl:space-x-reverse">
                <li>
                  <Link
                    href="/"
                    className="hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    {t('common.home')}
                  </Link>
                </li>
                <li className="px-2">/</li>
                <li>
                  <span className="font-medium text-secondary-900 dark:text-secondary-100">
                    @{product.username}
                  </span>
                </li>
                <li className="px-2">/</li>
                <li>
                  <span className="font-medium text-secondary-900 dark:text-secondary-100">
                    {product.slug}
                  </span>
                </li>
              </ol>
            </nav>{' '}
            {/* Main Product Card */}
            <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-secondary-800">
              {/* Product Image Banner */}
              <div className="relative overflow-hidden bg-secondary-100 dark:bg-secondary-700">
                {product.imageUrl ? (
                  <img
                    src={`http://localhost:3100${product.imageUrl}`}
                    alt={t('products.productImage', { title: product.title })}
                    className="max-h-[400px] w-full rounded-t-lg object-cover"
                  />
                ) : (
                  <div className="flex max-h-[400px] min-h-[300px] items-center justify-center rounded-t-lg">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-20 w-20 text-secondary-400 dark:text-secondary-500" />
                      <p className="mt-4 text-lg text-secondary-500 dark:text-secondary-400">
                        {t('products.noImage')}
                      </p>
                      <p className="mt-1 text-sm text-secondary-400 dark:text-secondary-500">
                        {t('products.noImageDescription')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8">
                {/* Product Header */}
                <div className="mb-6">
                  <h1 className="mb-4 text-2xl font-bold text-secondary-900 dark:text-secondary-100 md:text-3xl">
                    {product.title}
                  </h1>{' '}
                  {/* Seller Info */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                        <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                        <p className="text-sm text-secondary-500 dark:text-secondary-400">
                          {t('products.detail.posted_by')}
                        </p>
                        <p className="font-semibold text-secondary-900 dark:text-secondary-100">
                          @{product.username}
                        </p>
                      </div>
                    </div>

                    {/* Block Button - Only show for other users */}
                    {user && product.userId !== user.id && (
                      <BlockButton
                        targetUserId={product.userId}
                        targetUsername={product.username}
                        isBlocked={blockStatus.isBlocked}
                        onBlockChange={updateBlockStatus}
                        className="text-xs"
                      />
                    )}
                  </div>
                  {/* Product Meta */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Location */}
                    <div className="flex items-center">
                      <MapPin
                        className={`h-4 w-4 text-secondary-400 ${isRTL ? 'ml-2' : 'mr-2'}`}
                      />
                      <div>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">
                          {t('products.detail.location')}
                        </p>
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {product.location}
                        </p>
                      </div>
                    </div>

                    {/* Category */}
                    {product.category && (
                      <div className="flex items-center">
                        <Package
                          className={`h-4 w-4 text-secondary-400 ${isRTL ? 'ml-2' : 'mr-2'}`}
                        />
                        <div>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">
                            {t('products.detail.category')}
                          </p>
                          <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                            {product.category}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Date Posted */}
                    <div className="flex items-center">
                      <Calendar
                        className={`h-4 w-4 text-secondary-400 ${isRTL ? 'ml-2' : 'mr-2'}`}
                      />
                      <div>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">
                          {t('products.detail.posted_on')}
                        </p>
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {formatDate(product.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Price Section */}
                <div className="mb-6">
                  <div className="rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
                    <p className="mb-1 text-sm font-medium text-primary-800 dark:text-primary-200">
                      {t('products.detail.price')}
                    </p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 md:text-3xl">
                      {formatPrice(product.price, product.currency)}
                    </p>
                  </div>
                </div>
                {/* Description */}
                {product.description && (
                  <div className="mb-6">
                    <h2 className="mb-3 text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                      {t('products.description')}
                    </h2>
                    <div className="rounded-lg bg-secondary-50 p-4 dark:bg-secondary-700/50">
                      <p className="whitespace-pre-wrap leading-relaxed text-secondary-700 dark:text-secondary-300">
                        {product.description}
                      </p>
                    </div>
                  </div>
                )}{' '}
                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  {/* Message Seller - Show input or button based on state */}
                  {user && product.userId !== user.id && (
                    <>
                      {!showMessageComposer ? (
                        <button
                          onClick={handleMessageSeller}
                          className="flex-1 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                        >
                          <div className="flex items-center justify-center">
                            <MessageCircle
                              className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`}
                            />
                            {t('products.detail.message_seller')}
                          </div>
                        </button>
                      ) : (
                        <div className="flex-1">
                          {' '}
                          <InlineMessageComposer
                            productSeller={{
                              userId: product.userId,
                              username: product.username,
                              firstName: product.username,
                              lastName: '',
                            }}
                            productTitle={product.title}
                            productCover={{
                              id: product.id,
                              title: product.title,
                              price: product.price,
                              currency: product.currency,
                              imageUrl: product.imageUrl,
                              username: product.username,
                              location: product.location,
                              slug: product.slug,
                            }}
                            allowFileAttachments={false}
                            onMessageSent={() => {
                              // Don't show duplicate success message - InlineMessageComposer already shows it
                            }}
                            onClose={() => setShowMessageComposer(false)}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <button
                    onClick={handleShare}
                    className={`rounded-lg border border-secondary-300 px-6 py-3 font-medium text-secondary-700 transition-colors hover:bg-secondary-50 dark:border-secondary-600 dark:text-secondary-300 dark:hover:bg-secondary-700 ${
                      user && product.userId !== user.id ? '' : 'flex-1'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <Share2
                        className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`}
                      />
                      {t('products.directLink.share')}
                    </div>
                  </button>
                </div>
              </div>
            </div>
            {/* Product URL Section */}
            {mounted && (
              <div className="mt-6">
                <div className="rounded-lg bg-secondary-50 p-4 dark:bg-secondary-800">
                  <h3 className="mb-2 text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {t('products.modal.fullUrl')}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 flex-1 items-center">
                      <LinkIcon
                        className={`h-4 w-4 text-secondary-400 ${isRTL ? 'ml-3' : 'mr-3'} flex-shrink-0`}
                      />
                      <span className="truncate text-sm text-secondary-600 dark:text-secondary-400">
                        {getFullUrl()}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(getFullUrl())
                      }
                      className="ml-3 rounded border border-primary-300 px-3 py-1 text-xs font-medium text-primary-600 hover:text-primary-500 dark:border-primary-600 dark:text-primary-400 rtl:ml-0 rtl:mr-3"
                    >
                      {t('products.directLink.copy')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="mt-8 border-t border-secondary-200 pt-8 dark:border-secondary-700">
            <ReviewsSection
              productId={product.id}
              productSlug={product.slug}
              productOwnerId={product.userId}
            />
          </div>
        </div>
      </div>
    </>
  );
}
