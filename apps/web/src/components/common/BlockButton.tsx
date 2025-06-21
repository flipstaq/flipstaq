import React, { useState } from 'react';
import { useLanguage } from '../providers/LanguageProvider';
import { apiClient } from '@/lib/api/api-client';

interface BlockButtonProps {
  targetUserId: string;
  targetUsername: string;
  isBlocked: boolean;
  onBlockChange: (isBlocked: boolean) => void;
  className?: string;
}

export const BlockButton: React.FC<BlockButtonProps> = ({
  targetUserId,
  targetUsername,
  isBlocked,
  onBlockChange,
  className = '',
}) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleBlockAction = async () => {
    setIsLoading(true);
    try {
      if (isBlocked) {
        // Unblock user
        await apiClient.request(`/users/blocks/${targetUserId}`, {
          method: 'DELETE',
        });
      } else {
        // Block user
        await apiClient.request('/users/blocks', {
          method: 'POST',
          body: JSON.stringify({
            blockedId: targetUserId,
          }),
        });
      }

      // Update the parent component
      onBlockChange(!isBlocked);
      setShowConfirmModal(false);

      // Show success message
      const message = isBlocked
        ? t('common.userUnblockedSuccessfully', { username: targetUsername })
        : t('common.userBlockedSuccessfully', { username: targetUsername });

      // You can replace this with your toast notification system
      alert(message);
    } catch (error) {
      console.error('Block action error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      alert(t('common.error') + ': ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (isBlocked) {
      // For unblocking, ask for confirmation
      setShowConfirmModal(true);
    } else {
      // For blocking, ask for confirmation
      setShowConfirmModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        className={`
          rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200
          ${
            isBlocked
              ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
              : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
          }
          disabled:cursor-not-allowed disabled:opacity-50
          ${className}
        `}
      >
        {isLoading ? (
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {t('common.loading')}
          </span>
        ) : isBlocked ? (
          t('common.unblock')
        ) : (
          t('common.block')
        )}
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              {isBlocked
                ? t('common.confirmUnblock', { username: targetUsername })
                : t('common.confirmBlock', { username: targetUsername })}
            </h3>

            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              {isBlocked
                ? t('common.unblockDescription', { username: targetUsername })
                : t('common.blockDescription', { username: targetUsername })}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleBlockAction}
                disabled={isLoading}
                className={`
                  rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50
                  ${
                    isBlocked
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }
                `}
              >
                {isBlocked ? t('common.unblock') : t('common.block')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
