import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import axios from 'axios';

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Debug logging to help troubleshoot
  console.log('EmailVerificationBanner - User:', user);
  console.log('EmailVerificationBanner - emailVerified:', user?.emailVerified);
  console.log('EmailVerificationBanner - isVisible:', isVisible);

  // Don't show banner if user is verified or banner is dismissed
  if (!user || user.emailVerified || !isVisible) {
    return null;
  }

  const handleResendVerification = async () => {
    if (isResending) return;

    setIsResending(true);
    setResendStatus(null);

    try {
      const response = await axios.post('/api/auth/resend-verification', {
        email: user.email,
      });

      if (response.data.success) {
        setResendStatus('success');
        setTimeout(() => setResendStatus(null), 5000);
      } else {
        setResendStatus('error');
        setTimeout(() => setResendStatus(null), 5000);
      }
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      setResendStatus('error');
      setTimeout(() => setResendStatus(null), 5000);
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 dark:bg-yellow-900/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Mail className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-200">
              <span className="font-medium">
                {t('auth.email_not_verified')}
              </span>{' '}
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="font-medium underline hover:text-yellow-800 disabled:opacity-50 dark:hover:text-yellow-100"
              >
                {isResending
                  ? t('auth.processing')
                  : t('auth.resend_verification')}
              </button>
            </p>
            {resendStatus === 'success' && (
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                {t('auth.verification_email_resent')}
              </p>
            )}
            {resendStatus === 'error' && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Failed to resend verification email. Please try again.
              </p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-400 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40 dark:focus:ring-offset-yellow-900/20"
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
