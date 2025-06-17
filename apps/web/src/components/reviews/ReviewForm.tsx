'use client';

import React, { useState } from 'react';
import { StarRating } from '../ui/StarRating';
import { useLanguage } from '../providers/LanguageProvider';
import { useToast } from '../providers/ToastProvider';
import {
  useReviews,
  type CreateReviewData,
  type UpdateReviewData,
  type Review,
} from '@/hooks/useReviews';

interface ReviewFormProps {
  productId: string;
  existingReview?: Review | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  productId,
  existingReview,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const { t } = useLanguage();
  const { success, error } = useToast();
  const { createReview, updateReview, loading } = useReviews();

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      error(t('reviews.rating_required'));
      return;
    }

    if (!comment.trim()) {
      error(t('reviews.comment_required'));
      return;
    }

    try {
      if (existingReview) {
        // Update existing review
        const updateData: UpdateReviewData = {
          rating,
          comment: comment.trim(),
        };
        await updateReview(existingReview.id, updateData);
        success(t('reviews.review_updated'));
      } else {
        // Create new review
        const reviewData: CreateReviewData = {
          productId,
          rating,
          comment: comment.trim(),
        };
        await createReview(reviewData);
        success(t('reviews.review_created'));
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      error(err.message || t('reviews.review_error'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('reviews.rating')} *
        </label>
        <StarRating
          rating={rating}
          interactive
          onRatingChange={setRating}
          size="lg"
        />
      </div>

      <div>
        <label
          htmlFor="comment"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t('reviews.comment')} *
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder={t('reviews.comment_placeholder')}
          required
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {comment.length}/500
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || rating === 0 || !comment.trim()}
          className="flex-1 rounded-md bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-gray-400"
        >
          {loading
            ? t('loading')
            : existingReview
              ? t('reviews.update_review')
              : t('reviews.submit_review')}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t('cancel')}
          </button>
        )}
      </div>
    </form>
  );
}
