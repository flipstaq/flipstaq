import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { legalApi, LegalDocument } from '@/lib/api/legal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function TermsOfService() {
  const { language, isRTL } = useLanguage();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await legalApi.getDocumentByType('tos', language);
        setDocument(response);
      } catch (err) {
        console.error('Error fetching terms of service:', err);
        setError('Failed to load terms of service document');
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
              ? 'شروط الخدمة غير متاحة باللغة المحددة.'
              : 'Terms of Service is not available in the selected language.'}
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
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
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
                className="whitespace-pre-wrap"
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
