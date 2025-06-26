'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { reportService } from '@/services/reportService';

export type ReportType = 'USER' | 'PRODUCT' | 'MESSAGE';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ReportType;
  targetId: string;
  targetData?: {
    username?: string;
    productTitle?: string;
    messageContent?: string;
  };
}

const REPORT_REASONS = {
  spam: 'spam',
  misleading: 'misleading',
  offensive: 'offensive',
  harassment: 'harassment',
  fake_listing: 'fake_listing',
  scam: 'scam',
  inappropriate: 'inappropriate',
  copyright: 'copyright',
  other: 'other',
};

export default function ReportModal({
  isOpen,
  onClose,
  type,
  targetId,
  targetData,
}: ReportModalProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [selectedReason, setSelectedReason] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) {
      setError(t('report:required_field'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await reportService.submitReport({
        type,
        targetId,
        reason: selectedReason,
        comment: comment.trim() || undefined,
      });

      // Show success message and close modal
      alert(t('report:report_success'));
      onClose();
      setSelectedReason('');
      setComment('');
    } catch (error: any) {
      console.error('Report submission error:', error);
      if (error.message.includes('already reported')) {
        if (type === 'USER') {
          setError(t('report:user_already_reported_today'));
        } else if (type === 'PRODUCT') {
          setError(t('report:product_already_reported'));
        } else {
          setError(t('report:already_reported'));
        }
      } else if (error.message.includes('same reason recently')) {
        setError(t('report:duplicate_reason_error'));
      } else if (
        error.message.includes('limit exceeded') ||
        error.message.includes('reached the limit')
      ) {
        setError(t('report:rate_limit_exceeded'));
      } else {
        setError(t('report:report_error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getReportTitle = () => {
    switch (type) {
      case 'USER':
        return t('report:report_user');
      case 'PRODUCT':
        return t('report:report_product');
      case 'MESSAGE':
        return t('report:report_message');
      default:
        return t('report:report');
    }
  };

  const getTargetDescription = () => {
    switch (type) {
      case 'USER':
        return targetData?.username ? `@${targetData.username}` : '';
      case 'PRODUCT':
        return targetData?.productTitle || '';
      case 'MESSAGE':
        return targetData?.messageContent
          ? `"${targetData.messageContent.substring(0, 50)}${targetData.messageContent.length > 50 ? '...' : ''}"`
          : '';
      default:
        return '';
    }
  };
  if (!isOpen || !mounted) return null;
  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-secondary-800 ${
          language === 'ar' ? 'text-right' : 'text-left'
        }`}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary-200 p-6 dark:border-secondary-700">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {getReportTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600 dark:hover:bg-secondary-700 dark:hover:text-secondary-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Target Description */}
          {getTargetDescription() && (
            <div className="mb-4 rounded-lg bg-secondary-50 p-3 dark:bg-secondary-700">
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {getTargetDescription()}
              </p>
            </div>
          )}

          {/* Reason Selection */}
          <div className="mb-4">
            <label
              htmlFor="reason"
              className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300"
            >
              {t('report:reason')} <span className="text-red-500">*</span>
            </label>
            <select
              id="reason"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
              required
            >
              <option value="">{t('report:select_reason')}</option>
              {Object.values(REPORT_REASONS).map((reason) => (
                <option key={reason} value={reason}>
                  {t(`report:${reason}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label
              htmlFor="comment"
              className="mb-2 block text-sm font-medium text-secondary-700 dark:text-secondary-300"
            >
              {t('report:additional_comments')}
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={t('report:additional_comments')}
              className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
            />
            <p className="mt-1 text-xs text-secondary-500">
              {comment.length}/500 {t('report:max_characters')}
            </p>
          </div>

          {/* Guidelines */}
          <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {t('report:report_guidelines')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 rtl:space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-secondary-200 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50 dark:border-secondary-600 dark:text-secondary-300 dark:hover:bg-secondary-700"
            >
              {t('report:cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedReason}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>{t('report:submit')}</span>
                </div>
              ) : (
                t('report:submit_report')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
