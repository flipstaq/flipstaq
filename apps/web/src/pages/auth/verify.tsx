import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../../components/providers/LanguageProvider';
import { useAuth } from '../../components/providers/AuthProvider';
import Toast from '../../components/ui/Toast';

interface VerificationStatus {
  success: boolean;
  message: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { refreshUser, user } = useAuth();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  useEffect(() => {
    const { verify } = router.query;

    // Only show success if backend confirmed verification via proper token validation
    if (verify === 'success') {
      setStatus({ success: true, message: t('auth:email_verified') });
      // Refresh user data to update emailVerified status
      console.log('Verify page: Starting user refresh...');
      refreshUser().then(() => {
        console.log('Verify page: User refresh completed, updated user:', user);
        // Show success toast
        setToastMessage(t('auth:email_verified_success'));
        setShowToast(true);
      });
    } else if (verify === 'invalid') {
      setStatus({ success: false, message: t('auth:invalid_token') });
    } else if (!verify) {
      // If someone visits /auth/verify directly without query params, redirect to home
      router.push('/');
      return;
    }
    // Remove support for the insecure 'verified=true' parameter
  }, [router.query, t, refreshUser, router]);

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleResendVerification = async () => {
    // For now, redirect to login where user can request new verification
    router.push('/auth/login?resend=true');
  };

  if (!status) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              {t('auth:processing')}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('auth:please_wait')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex h-32 w-32 items-center justify-center">
              {status.success ? (
                <CheckCircle className="h-32 w-32 text-green-500" />
              ) : (
                <XCircle className="h-32 w-32 text-red-500" />
              )}
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              {status.success
                ? t('auth:email_verified')
                : t('auth:verification_failed')}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {status.message}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleBackToHome}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-gray-900"
            >
              {t('auth:back_to_home')}
            </button>

            {!status.success && (
              <button
                onClick={handleResendVerification}
                className="group relative flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:ring-offset-gray-900 dark:hover:bg-gray-700"
              >
                {t('auth:resend_verification')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Toast */}
      <Toast
        type="success"
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={5000}
      />
    </>
  );
}
