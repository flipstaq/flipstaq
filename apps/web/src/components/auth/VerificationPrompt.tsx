import { useState } from 'react';
import { X, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import axios from 'axios';

interface VerificationPromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

export default function VerificationPrompt({
  isOpen,
  onClose,
  feature,
}: VerificationPromptProps) {
  const { user } = useAuth();
  const { t, translations, language } = useLanguage();
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  if (!isOpen) return null;
  // Map feature keys to user-friendly text
  const getFeatureTranslation = (featureKey: string) => {
    const featureMap: Record<string, { en: string; ar: string }> = {
      'products:creating_products': {
        en: 'creating products',
        ar: 'إنشاء المنتجات',
      },
      'reviews:writing_reviews': {
        en: 'writing reviews',
        ar: 'كتابة المراجعات',
      },
      'chat:sending_messages': {
        en: 'sending messages',
        ar: 'إرسال الرسائل',
      },
      'chat:starting_conversations': {
        en: 'starting conversations',
        ar: 'بدء المحادثات',
      },
    };

    return featureMap[featureKey]?.[language] || featureKey;
  };
  const handleResendVerification = async () => {
    if (isResending || !user?.email) return;

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

      if (axios.isAxiosError(error) && error.response?.status === 429) {
        // Rate limit error
        setResendStatus('rate_limit');
      } else {
        setResendStatus('error');
      }
      setTimeout(() => setResendStatus(null), 8000); // Show rate limit message longer
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        {/* Modal */}
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900/20">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('auth.verification_required')}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>{' '}
          {/* Content */}
          <div className="mb-6">
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              {t('auth.verification_required_message', {
                feature: getFeatureTranslation(feature),
              })}
            </p>
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-start space-x-3">
                <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="mb-1 font-medium text-blue-900 dark:text-blue-100">
                    {t('auth.check_your_email')}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t('auth.verification_email_sent_to', {
                      email: user?.email,
                    })}
                  </p>
                </div>
              </div>
            </div>{' '}
            {resendStatus === 'success' && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t('auth.verification_email_resent')}
                </p>
              </div>
            )}
            {resendStatus === 'error' && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {t('auth.resend_failed')}
                </p>
              </div>
            )}
            {resendStatus === 'rate_limit' && (
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {t('auth.resend_rate_limit')}
                </p>
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
            >
              <Mail className="h-4 w-4" />
              <span>
                {isResending
                  ? t('auth.processing')
                  : t('auth.resend_verification')}
              </span>
            </button>

            <button
              onClick={onClose}
              className="w-full rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
