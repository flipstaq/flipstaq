import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';

interface FavoriteButtonProps {
  productId: string;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  productId,
  className = '',
  showTooltip = true,
  size = 'md',
}) => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const { addToFavorites, removeFromFavorites, isProductFavorited } =
    useFavorites();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  useEffect(() => {
    if (isAuthenticated && productId) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, productId]);

  const checkFavoriteStatus = async () => {
    try {
      const favorited = await isProductFavorited(productId);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Could redirect to login or show a modal
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorited) {
        const result = await removeFromFavorites(productId);
        if (result) {
          setIsFavorited(false);
          success(t('unfavoriteSuccess'));
        } else {
          error(t('unfavoriteError'));
        }
      } else {
        const result = await addToFavorites(productId);
        if (result) {
          setIsFavorited(true);
          success(t('favoriteSuccess'));
        } else {
          error(t('favoriteError'));
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      if (isFavorited) {
        error(t('unfavoriteError'));
      } else {
        error(t('favoriteError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show favorite button to unauthenticated users
  }
  const tooltip = isFavorited ? t('removeFromSaved') : t('saveForLater');

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center rounded-full
        transition-all duration-200 ease-in-out
        ${buttonSizeClasses[size]}
        ${
          isFavorited
            ? 'bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30'
            : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:bg-gray-800 dark:hover:bg-red-900/20'
        }
        ${isLoading ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}
        ${className}
      `}
      title={showTooltip ? tooltip : undefined}
      aria-label={tooltip}
    >
      <Heart
        className={`${sizeClasses[size]} ${isLoading ? 'animate-pulse' : ''}`}
        fill={isFavorited ? 'currentColor' : 'none'}
      />
    </button>
  );
};
