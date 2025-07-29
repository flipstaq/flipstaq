import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { legalApi, LegalDocument } from '@/lib/api/legal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function PrivacyPolicy() {
  const { language, isRTL, setLanguage } = useLanguage();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        setFallbackUsed(false);

        // Try to fetch in current language
        let response;
        try {
          response = await legalApi.getDocumentByType('privacy', language);
        } catch (primaryErr) {
          // If document not found and current language is Arabic, try English fallback
          if (language === 'ar') {
            try {
              response = await legalApi.getDocumentByType('privacy', 'en');
              if (response) {
                setFallbackUsed(true);
              }
            } catch (fallbackErr) {
              console.error('Error fetching fallback document:', fallbackErr);
              // If both Arabic and English fail, set error
              setError('Failed to load privacy policy document');
            }
          } else {
            // If English fails, set error
            setError('Failed to load privacy policy document');
          }
        }

        setDocument(response || null);
      } catch (err) {
        console.error('Error fetching privacy policy:', err);
        setError('Failed to load privacy policy document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [language]);
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            {language === 'ar' ? 'الوثيقة غير متاحة' : 'Document Not Available'}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {language === 'ar'
              ? 'سياسة الخصوصية غير متاحة.'
              : 'Privacy Policy is not available.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            {/* Language Toggle */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                <button
                  onClick={() => setLanguage('en')}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('ar')}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    language === 'ar'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            {/* Fallback Notice */}
            {fallbackUsed && (
              <div className="mb-6 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <div className="flex">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      النسخة العربية غير متاحة حالياً. يتم عرض النسخة
                      الإنجليزية.
                      <br />
                      Arabic version is currently unavailable. Showing English
                      version
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {language === 'ar'
                  ? `آخر تحديث: ${new Date(document.updatedAt).toLocaleDateString('ar-SA')}`
                  : `Last updated: ${new Date(document.updatedAt).toLocaleDateString()}`}
              </p>
            </div>

            <div
              className={`prose prose-lg dark:prose-invert max-w-none ${isRTL ? 'prose-rtl' : ''}`}
              style={{
                direction: isRTL ? 'rtl' : 'ltr',
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: document.content.replace(/\n/g, '<br>'),
                }}
                className="whitespace-pre-wrap text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{language === 'ar' ? 'فليب ستاك' : 'Flipstaq'}</span>
                <span>
                  {language === 'ar' ? `اللغة: العربية` : `Language: English`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
