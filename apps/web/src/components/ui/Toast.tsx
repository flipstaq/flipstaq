import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export interface ToastProps {
  type: 'success' | 'error';
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  type,
  message,
  isVisible,
  onClose,
  duration = 5000,
}: ToastProps) {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !show) return null;

  const toastClasses = {
    success:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    error:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  };

  const iconClasses = {
    success: 'text-green-400',
    error: 'text-red-400',
  };

  return (
    <div
      className={`fixed right-4 top-4 z-50 w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${toastClasses[type]}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <CheckCircle className={`h-5 w-5 ${iconClasses[type]}`} />
          ) : (
            <XCircle className={`h-5 w-5 ${iconClasses[type]}`} />
          )}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => {
              setShow(false);
              setTimeout(onClose, 300);
            }}
            className="inline-flex rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="sr-only">{t('common.close')}</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
