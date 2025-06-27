import React from 'react';
import { X, LogIn } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useRouter } from 'next/router';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: string; // e.g., "save this product", "leave a review", "message the seller"
  title?: string;
}

export function LoginPromptModal({
  isOpen,
  onClose,
  action,
  title,
}: LoginPromptModalProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const isRTL = language === 'ar';

  const handleLogin = () => {
    // Store the current page URL to redirect back after login
    const currentPath = router.asPath;
    router.push(`/auth/signin?redirect=${encodeURIComponent(currentPath)}`);
    onClose();
  };

  const handleSignup = () => {
    // Store the current page URL to redirect back after signup
    const currentPath = router.asPath;
    router.push(`/auth/signup?redirect=${encodeURIComponent(currentPath)}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-secondary-800"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${
            isRTL ? 'left-4' : 'right-4'
          } rounded-full p-1 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600 dark:hover:bg-secondary-700 dark:hover:text-secondary-300`}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="mb-4 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
              <LogIn className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {title || t('auth.loginRequired')}
            </h3>
          </div>

          {/* Message */}
          <div className="mb-6 text-center">
            <p className="text-secondary-600 dark:text-secondary-400">
              {t('auth.loginToAction', { action })}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              {t('auth.login')}
            </button>

            <button
              onClick={handleSignup}
              className="w-full rounded-lg border border-secondary-300 px-4 py-3 font-medium text-secondary-700 transition-colors hover:bg-secondary-50 dark:border-secondary-600 dark:text-secondary-300 dark:hover:bg-secondary-700"
            >
              {t('auth.signup')}
            </button>
          </div>

          {/* Alternative action */}
          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-sm text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
