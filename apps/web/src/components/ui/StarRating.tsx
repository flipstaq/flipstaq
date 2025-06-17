'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showValue = false,
  className = '',
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const starSize = sizeClasses[size];

  const handleStarClick = (selectedRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => {
          const starRating = index + 1;
          const isFilled = starRating <= rating;
          const isPartiallyFilled =
            starRating - 0.5 <= rating && starRating > rating;

          return (
            <button
              key={index}
              type="button"
              className={`${
                interactive
                  ? 'cursor-pointer transition-transform hover:scale-110'
                  : 'cursor-default'
              } relative`}
              onClick={() => handleStarClick(starRating)}
              disabled={!interactive}
            >
              <Star
                className={`${starSize} ${
                  isFilled || isPartiallyFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                } transition-colors`}
              />
              {isPartiallyFilled && (
                <Star
                  className={`${starSize} absolute left-0 top-0 fill-yellow-400 text-yellow-400`}
                  style={{
                    clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
}
