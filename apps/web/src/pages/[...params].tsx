import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { ProductDetailPage } from '@/components/products/ProductDetailPage';
import { ProductCard } from '@/components/products/ProductCard';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useChat } from '@/contexts/ChatContext';
import { LoginPromptModal } from '@/components/auth/LoginPromptModal';
import VerificationPrompt from '@/components/auth/VerificationPrompt';
import { useVerificationCheck } from '@/hooks/useVerificationCheck';
import Avatar from '@/components/ui/Avatar';
import { ArrowLeft, Star, Package, Calendar, ArrowRight, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';
import { ProductType } from '@/types';
import { useState } from 'react';

// Import React for placeholder component
import React from 'react';

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
  userAvatarUrl?: string | null;
  userFirstName?: string;
  userLastName?: string;
  type: ProductType;
  createdAt: string;
  updatedAt: string;
  averageRating?: number;
  totalReviews?: number;
}

interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  joinedAt: string;
  averageRating: number;
  totalReviews: number;
  products: ProductDetail[];
}

interface ProductPageProps {
  product: ProductDetail | null;
  userProfile: UserProfile | null;
  username: string;
  slug?: string;
  notFound?: boolean;
  pageType: 'product' | 'profile';
}

export default function DynamicPage({
  product,
  userProfile,
  username,
  slug,
  notFound,
  pageType,
}: ProductPageProps) {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { openChatWith } = useChat();
  const { 
    checkVerification, 
    showVerificationPrompt, 
    blockedFeature, 
    closePrompt 
  } = useVerificationCheck();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginAction, setLoginAction] = useState('');
  const isRTL = language === 'ar';

  const handleMessageUser = () => {
    if (!userProfile) return;

    if (!isAuthenticated) {
      setLoginAction(t('chat.message_user'));
      setShowLoginModal(true);
      return;
    }

    // Prevent users from messaging themselves
    if (userProfile.id === user?.id) {
      return; // Don't show message button for own profile
    }

    // Check email verification before allowing messaging
    if (!checkVerification('chat:sending_messages')) {
      return; // Verification prompt will be shown automatically
    }

    // Open chat with the user
    openChatWith({
      userId: userProfile.id,
      username: userProfile.username,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
    });
  };

  if (notFound) {
    // Return null to trigger Next.js 404 page
    return null;
  }

  if (pageType === 'profile') {
    return (
      <>
        <Head>
          <title>
            {userProfile
              ? `@${username} - ${userProfile.firstName} ${userProfile.lastName}`
              : `@${username}`}{' '}
            - Flipstaq
          </title>
          <meta
            name="description"
            content={
              userProfile
                ? `View ${userProfile.firstName} ${userProfile.lastName}'s products and profile on Flipstaq`
                : `User profile for @${username}`
            }
          />
        </Head>

        <div className="min-h-screen bg-gray-50 dark:bg-secondary-900">
          {/* Header with Back Button */}
          <div className="border-b border-gray-200 bg-white dark:border-secondary-700 dark:bg-secondary-800">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className={`inline-flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  {isRTL ? (
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <ArrowLeft className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  )}
                  <span className="text-sm md:text-base">
                    {t('common.back')}
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6 md:py-8">
            {userProfile ? (
              <div>
                {/* Profile Header */}
                <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-secondary-800 md:p-8">
                  <div
                    className={`flex flex-col items-center gap-6 md:flex-row md:items-start ${isRTL ? 'md:flex-row-reverse md:text-right' : ''}`}
                  >
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      <Avatar
                        src={userProfile.avatarUrl}
                        alt={`${userProfile.firstName} ${userProfile.lastName}`}
                        size="xl"
                        className="h-24 w-24 ring-4 ring-primary-100 dark:ring-primary-900 md:h-32 md:w-32"
                      />
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 text-center md:text-left">
                      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                        {userProfile.firstName} {userProfile.lastName}
                      </h1>
                      <p className="mb-4 text-lg text-primary-600 dark:text-primary-400 md:text-xl">
                        @{username}
                      </p>

                      {/* Stats */}
                      <div
                        className={`flex flex-col gap-4 text-sm text-gray-600 dark:text-gray-400 md:flex-row md:gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}
                      >
                        <div
                          className={`flex items-center justify-center md:justify-start ${isRTL ? 'md:flex-row-reverse' : ''}`}
                        >
                          <Package
                            className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`}
                          />
                          <span>
                            {userProfile.products.length} {t('common.products')}
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-center md:justify-start ${isRTL ? 'md:flex-row-reverse' : ''}`}
                        >
                          <Star
                            className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`}
                          />
                          <span>
                            {userProfile.averageRating
                              ? userProfile.averageRating.toFixed(1)
                              : '0.0'}{' '}
                            ({userProfile.totalReviews} {t('reviews.reviews')})
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-center md:justify-start ${isRTL ? 'md:flex-row-reverse' : ''}`}
                        >
                          <Calendar
                            className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`}
                          />
                          <span>
                            {t('common.joined')}{' '}
                            {userProfile.joinedAt
                              ? new Date(
                                  userProfile.joinedAt
                                ).toLocaleDateString(
                                  language === 'ar' ? 'ar-AE' : 'en-US',
                                  {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  }
                                )
                              : t('common.unknown')}
                          </span>
                        </div>
                      </div>

                      {/* Message Button - Only show if not viewing own profile */}
                      {isAuthenticated && user?.id !== userProfile.id && (
                        <div className="mt-6">
                          <button
                            onClick={handleMessageUser}
                            className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                          >
                            <MessageCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('chat.message_user')}
                          </button>
                        </div>
                      )}
                      
                      {/* Message Button for non-authenticated users */}
                      {!isAuthenticated && (
                        <div className="mt-6">
                          <button
                            onClick={handleMessageUser}
                            className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                          >
                            <MessageCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('chat.message_user')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Products Section */}
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
                      {t('common.products')} ({userProfile.products.length})
                    </h2>
                  </div>

                  {userProfile.products.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                      {userProfile.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={{
                            id: product.id,
                            title: product.title,
                            description: product.description,
                            price: product.price,
                            currency: product.currency,
                            location: product.location,
                            slug: product.slug,
                            username: username,
                            userAvatarUrl: userProfile.avatarUrl,
                            userFirstName: userProfile.firstName,
                            userLastName: userProfile.lastName,
                            imageUrl: product.imageUrl,
                            type: product.type as ProductType,
                            createdAt: product.createdAt,
                            averageRating: product.averageRating || undefined,
                            totalReviews: product.totalReviews || undefined,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-secondary-800 md:p-12">
                      <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 md:h-16 md:w-16" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                        {t('common.noProductsYet')}
                      </h3>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {userProfile.firstName}{' '}
                        {t('common.hasNotPostedProducts')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-secondary-800 md:p-12">
                <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 md:h-16 md:w-16"></div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  {t('common.userNotFound')}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {t('common.userProfileNotExists')}
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                >
                  {t('common.backToHome')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Login Modal */}
        <LoginPromptModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          action={loginAction}
        />

        {/* Email Verification Modal */}
        <VerificationPrompt
          isOpen={showVerificationPrompt}
          onClose={closePrompt}
          feature={blockedFeature}
        />
      </>
    );
  }

  // Default to product page
  return (
    <ProductDetailPage
      username={username}
      slug={slug!} // slug is guaranteed to exist for product pages
      initialProduct={product}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { params } = context;

  // Handle routes with 1 or 2 segments that match @username or @username/slug pattern
  if (
    !params ||
    !Array.isArray(params.params) ||
    params.params.length === 0 ||
    params.params.length > 2
  ) {
    return {
      notFound: true,
    };
  }

  const [usernameParam, slug] = params.params;

  // Extract username from @username format
  if (!usernameParam.startsWith('@')) {
    return {
      notFound: true,
    };
  }

  const username = usernameParam.slice(1); // Remove @ prefix

  if (!username) {
    return {
      notFound: true,
    };
  }

  const API_GATEWAY_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

  // Single parameter - user profile page
  if (params.params.length === 1) {
    try {
      const response = await fetch(
        `${API_GATEWAY_URL}/api/v1/public/users/profile/${username}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            notFound: true,
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userProfile = await response.json();

      return {
        props: {
          userProfile,
          username,
          product: null,
          slug: null,
          pageType: 'profile',
        },
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        notFound: true,
      };
    }
  }

  // Two parameters - product page (@username/slug)
  if (!slug) {
    return {
      notFound: true,
    };
  }

  try {
    const response = await fetch(
      `${API_GATEWAY_URL}/api/v1/products/@${username}/${slug}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Product might not be publicly visible but could be accessible to owner
        // Return props without product data, let client-side handle authenticated request
        return {
          props: {
            product: null,
            userProfile: null,
            username,
            slug,
            pageType: 'product',
          },
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const product = await response.json();

    return {
      props: {
        product,
        userProfile: null,
        username,
        slug,
        pageType: 'product',
      },
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    // Instead of returning notFound, let client-side handle it
    return {
      props: {
        product: null,
        userProfile: null,
        username,
        slug,
        pageType: 'product',
      },
    };
  }
};
