'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { reportService, Report } from '@/services/reportService';
import {
  Flag,
  User,
  Package,
  MessageCircle,
  Clock,
  CheckCircle,
  X,
} from 'lucide-react';

interface ReportsPageProps {
  onClose?: () => void;
}

export default function ReportsPage({ onClose }: ReportsPageProps) {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportService.getReports();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolveReport = async (reportId: string) => {
    try {
      setIsActionLoading(reportId);
      await reportService.resolveReport(reportId);

      // Update local state
      setReports((prevReports) =>
        prevReports.map((report) =>
          report.id === reportId
            ? { ...report, status: 'RESOLVED' as const }
            : report
        )
      );

      setSelectedReport(null);
    } catch (err) {
      alert('Failed to resolve report');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      setIsActionLoading(reportId);
      await reportService.dismissReport(reportId);

      // Update local state
      setReports((prevReports) =>
        prevReports.map((report) =>
          report.id === reportId
            ? { ...report, status: 'DISMISSED' as const }
            : report
        )
      );

      setSelectedReport(null);
    } catch (err) {
      alert('Failed to dismiss report');
    } finally {
      setIsActionLoading(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'USER':
        return <User className="h-5 w-5" />;
      case 'PRODUCT':
        return <Package className="h-5 w-5" />;
      case 'MESSAGE':
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Flag className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Resolved
          </span>
        );
      case 'DISMISSED':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <X className="mr-1 h-3 w-3" />
            Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="text-secondary-600 dark:text-secondary-400">
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <h3 className="mb-2 text-lg font-medium text-red-800 dark:text-red-200">
            Error
          </h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={loadReports}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Flag className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            Reports Management
          </h1>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-200"
          >
            Back
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="py-12 text-center">
          <Flag className="mx-auto mb-4 h-12 w-12 text-secondary-400" />
          <h3 className="mb-2 text-lg font-medium text-secondary-900 dark:text-secondary-100">
            No Reports
          </h3>
          <p className="text-secondary-500 dark:text-secondary-400">
            There are no reports to review at this time.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-secondary-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
              <thead className="bg-secondary-50 dark:bg-secondary-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 bg-white dark:divide-secondary-700 dark:bg-secondary-800">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-secondary-50 dark:hover:bg-secondary-700"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                          {getTypeIcon(report.type)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                            {report.type}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-secondary-900 dark:text-secondary-100">
                        {report.type === 'USER' &&
                          report.targetUserId &&
                          `User ID: ${report.targetUserId}`}
                        {report.type === 'PRODUCT' &&
                          report.targetProductId &&
                          `Product ID: ${report.targetProductId}`}
                        {report.type === 'MESSAGE' &&
                          report.targetMessageId &&
                          `Message ID: ${report.targetMessageId}`}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-secondary-900 dark:text-secondary-100">
                        {report.reason}
                      </div>
                      {report.comment && (
                        <div className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                          {report.comment.length > 50
                            ? `${report.comment.substring(0, 50)}...`
                            : report.comment}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-secondary-900 dark:text-secondary-100">
                        {report.reporter.firstName} {report.reporter.lastName}
                      </div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-400">
                        @{report.reporter.username}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-500 dark:text-secondary-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      {report.status === 'PENDING' && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleResolveReport(report.id)}
                            disabled={isActionLoading === report.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 dark:text-green-400 dark:hover:text-green-300"
                          >
                            {isActionLoading === report.id
                              ? 'Loading...'
                              : 'Resolve'}
                          </button>
                          <button
                            onClick={() => handleDismissReport(report.id)}
                            disabled={isActionLoading === report.id}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            {isActionLoading === report.id
                              ? 'Loading...'
                              : 'Dismiss'}
                          </button>
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">
              &#8203;
            </span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all dark:bg-secondary-800 sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 dark:bg-secondary-800 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <Flag className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 flex-1 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-secondary-900 dark:text-secondary-100">
                      Report Details
                    </h3>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          Type:
                        </label>
                        <p className="text-secondary-900 dark:text-secondary-100">
                          {selectedReport.type}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          Reason:
                        </label>
                        <p className="text-secondary-900 dark:text-secondary-100">
                          {selectedReport.reason}
                        </p>
                      </div>
                      {selectedReport.comment && (
                        <div>
                          <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                            Comment:
                          </label>
                          <p className="text-secondary-900 dark:text-secondary-100">
                            {selectedReport.comment}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          Reporter:
                        </label>
                        <p className="text-secondary-900 dark:text-secondary-100">
                          {selectedReport.reporter.firstName}{' '}
                          {selectedReport.reporter.lastName} (@
                          {selectedReport.reporter.username})
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          Status:
                        </label>
                        <div className="mt-1">
                          {getStatusBadge(selectedReport.status)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                          Date:
                        </label>
                        <p className="text-secondary-900 dark:text-secondary-100">
                          {new Date(selectedReport.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-secondary-50 px-4 py-3 dark:bg-secondary-700 sm:flex sm:flex-row-reverse sm:px-6">
                {selectedReport.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleResolveReport(selectedReport.id)}
                      disabled={isActionLoading === selectedReport.id}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {isActionLoading === selectedReport.id
                        ? 'Loading...'
                        : 'Resolve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismissReport(selectedReport.id)}
                      disabled={isActionLoading === selectedReport.id}
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:border-secondary-500 dark:bg-secondary-600 dark:text-secondary-200 dark:hover:bg-secondary-500 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      {isActionLoading === selectedReport.id
                        ? 'Loading...'
                        : 'Dismiss'}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-secondary-500 dark:bg-secondary-600 dark:text-secondary-200 dark:hover:bg-secondary-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
