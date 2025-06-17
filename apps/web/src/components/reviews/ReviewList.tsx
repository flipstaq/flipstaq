'use client';

import React, { useState } from 'react';
import { StarRating } from '../ui/StarRating';
import { ReviewForm } from './ReviewForm';
import { useLanguage } from '../providers/LanguageProvider';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../providers/ToastProvider';
import { useReviews, type Review } from '@/hooks/useReviews';
import { Edit2, Trash2, MessageCircle } from 'lucide-react';

interface ReviewListProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  onReviewUpdate?: () => void;
}

export function ReviewList({
  reviews,
  averageRating,
  totalReviews,
  onReviewUpdate,
}: ReviewListProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { success, error } = useToast();
  const { deleteReview, loading } = useReviews();
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm(t('reviews.confirm_delete'))) {
      return;
    }

    try {
      await deleteReview(reviewId);
      success(t('reviews.review_deleted'));
      if (onReviewUpdate) {
        onReviewUpdate();
      }
    } catch (err: any) {
      error(err.message || t('reviews.delete_error'));
    }
  };

  const handleEditSuccess = () => {
    setEditingReview(null);
    if (onReviewUpdate) {
      onReviewUpdate();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (totalReviews === 0) {
    return (
      <div className="py-8 text-center">
        <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
          {t('reviews.no_reviews_yet')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {t('reviews.be_first_to_review')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <StarRating rating={averageRating} showValue size="lg" />
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('reviews.based_on_reviews', { count: totalReviews })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
            {editingReview?.id === review.id ? (
              <ReviewForm
                productId={''} // Not needed for updates
                existingReview={editingReview}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingReview(null)}
              />
            ) : (
              <>
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-800">
                      <span className="font-medium text-primary-600 dark:text-primary-300">
                        {review.user.firstName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {review.user.firstName} {review.user.lastName}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{review.user.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <time className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(review.createdAt)}
                    </time>
                    {user?.id === review.user.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingReview(review)}
                          className="p-1 text-gray-400 transition-colors hover:text-primary-600"
                          title={t('reviews.edit_review')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={loading}
                          className="p-1 text-gray-400 transition-colors hover:text-red-600"
                          title={t('reviews.delete_review')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-2">
                  <StarRating rating={review.rating} size="sm" />
                </div>

                <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                  {review.comment}
                </p>

                {review.updatedAt !== review.createdAt && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {t('reviews.edited')} {formatDate(review.updatedAt)}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
