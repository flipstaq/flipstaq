'use client';

import React, { useState } from 'react';
import { ReviewList } from './ReviewList';
import { ReviewForm } from './ReviewForm';
import { useLanguage } from '../providers/LanguageProvider';
import { useAuth } from '../providers/AuthProvider';
import { useProductReviews, useUserProductReview } from '@/hooks/useReviews';
import { Star, Plus } from 'lucide-react';

interface ReviewsSectionProps {
  productId: string;
  productSlug: string;
  productOwnerId: string;
}

export function ReviewsSection({
  productId,
  productSlug,
  productOwnerId,
}: ReviewsSectionProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const {
    reviews: productReviews,
    loading: reviewsLoading,
    refetchReviews,
  } = useProductReviews(productId);
  const { userReview, refetchUserReview } = useUserProductReview(productId);

  const canReview = user && user.id !== productOwnerId;
  const hasUserReviewed = !!userReview;

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    refetchReviews();
    refetchUserReview();
  };

  const handleReviewUpdate = () => {
    refetchReviews();
    refetchUserReview();
  };

  if (reviewsLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="space-y-3">
            <div className="h-20 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-20 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('reviews.reviews')}
          </h3>
          {productReviews && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({productReviews.totalReviews})
            </span>
          )}
        </div>

        {/* Review Action Button */}
        {canReview && (
          <div>
            {hasUserReviewed ? (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Star className="h-4 w-4" />
                {showReviewForm ? t('cancel') : t('reviews.your_review')}
              </button>
            ) : (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm text-white transition-colors hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                {t('reviews.leave_review')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* User's Existing Review Form (Edit Mode) */}
      {showReviewForm && hasUserReviewed && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h4 className="mb-4 font-medium text-gray-900 dark:text-gray-100">
            {t('reviews.your_review')}
          </h4>
          <ReviewForm
            productId={productId}
            existingReview={userReview}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* New Review Form */}
      {showReviewForm && !hasUserReviewed && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h4 className="mb-4 font-medium text-gray-900 dark:text-gray-100">
            {t('reviews.leave_review')}
          </h4>
          <ReviewForm
            productId={productId}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Login Prompt for Anonymous Users */}
      {!user && (
        <div className="rounded-lg border border-gray-200 py-4 text-center dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            {t('auth.loginRequired')} {t('reviews.leave_review').toLowerCase()}
          </p>
        </div>
      )}

      {/* Reviews List */}
      {productReviews && (
        <ReviewList
          reviews={productReviews.reviews}
          averageRating={productReviews.averageRating}
          totalReviews={productReviews.totalReviews}
          onReviewUpdate={handleReviewUpdate}
        />
      )}
    </div>
  );
}
