import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { AdminRouteGuard } from '@/components/providers/AdminRouteGuard';
import { useAuth } from '@/components/providers/AuthProvider';
import { userApi } from '@/lib/api/users';
import {
  adminApi,
  ProductForAdmin,
  ReviewForAdmin,
  ReportForAdmin,
} from '@/lib/api/admin';
import { legalApi, LegalDocument } from '@/lib/api/legal';
import { UserInfo, User, PaginatedUsersResponse, UserRole } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { RefreshCw } from 'lucide-react';

// Toast notification interface
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Toast Component
const ToastContainer: React.FC<{
  toasts: Toast[];
  removeToast: (id: string) => void;
}> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed right-4 top-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center rounded-lg p-4 shadow-lg transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

// Modal components
interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  warning?: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  t: (key: string) => string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  warning,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isLoading = false,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span
          className="hidden sm:inline-block sm:h-screen sm:align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pb-4 pt-5 dark:bg-gray-800 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {message}
                  </p>
                  {warning && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {warning}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 dark:bg-gray-700 sm:flex sm:flex-row-reverse sm:px-6">
            {' '}
            <button
              type="button"
              disabled={isLoading}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onConfirm}
            >
              {isLoading ? t('admin-common:common.processing') : confirmText}
            </button>
            <button
              type="button"
              disabled={isLoading}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Detail Modal Component
interface UserDetailModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onRoleChange: (user: User, newRole: UserRole) => void;
  onDelete: (user: User) => void;
  onRestore: (user: User) => void;
  currentUser: UserInfo | null;
  canManageUser: (targetUser: User) => boolean;
  canChangeRoleTo: (targetUser: User, targetRole: UserRole) => boolean;
  isRTL: boolean;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  user,
  onClose,
  onRoleChange,
  onDelete,
  onRestore,
  currentUser,
  canManageUser,
  canChangeRoleTo,
  isRTL,
}) => {
  const { t } = useLanguage();

  if (!isOpen || !user) return null;

  const isDeleted = !user.isActive || user.deletedAt;

  const handleRoleChange = (newRole: UserRole) => {
    if (canChangeRoleTo(user, newRole) && newRole !== user.role) {
      onRoleChange(user, newRole);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div
            className="absolute inset-0 bg-gray-500 opacity-75"
            onClick={onClose}
          ></div>
        </div>
        <span
          className="hidden sm:inline-block sm:h-screen sm:align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          {/* Header */}
          <div className="bg-white px-4 pt-5 dark:bg-gray-800 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg ${
                    isDeleted
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600'
                  }`}
                >
                  <span className="text-lg font-bold text-white">
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </span>
                </div>{' '}
                <div className={isRTL ? 'mr-4' : 'ml-4'}>
                  <h3
                    className={`text-lg font-medium leading-6 ${
                      isDeleted
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {user.firstName} {user.lastName}{' '}
                    {isDeleted && (
                      <span
                        className={`inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300 ${isRTL ? 'mr-2' : 'ml-2'}`}
                      >
                        {t('admin-users:status.deleted')}
                      </span>
                    )}
                  </h3>
                  <p
                    className={`text-sm ${
                      isDeleted
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    @{user.username}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-4 pb-4 dark:bg-gray-800 sm:px-6 sm:pb-4">
            <div className="mt-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <div>
                  {' '}
                  <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                    {t('admin-users:modal.personalInfo')}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      {' '}
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('admin-users:modal.fullName')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                    <div>
                      {' '}
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('admin-users:modal.email')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {user.email}
                      </p>
                    </div>
                    <div>
                      {' '}
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('admin-users:modal.username')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        @{user.username}
                      </p>
                    </div>
                    {user.dateOfBirth && (
                      <div>
                        {' '}
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t('admin-users:modal.dateOfBirth')}
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {formatDate(user.dateOfBirth)}
                        </p>
                      </div>
                    )}
                    <div>
                      {' '}
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('admin-users:modal.country')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {user.country}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div>
                  {' '}
                  <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                    {t('admin-users:modal.accountInfo')}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      {' '}
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('admin-users:modal.role')}
                      </label>
                      <div className="mt-1 flex items-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.role === 'OWNER'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                              : user.role === 'HIGHER_STAFF'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : user.role === 'STAFF'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {t(`admin-users:roles.${user.role}`)}
                        </span>
                      </div>
                    </div>
                    <div>
                      {' '}
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('admin-users:modal.status')}
                      </label>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isDeleted
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          }`}
                        >
                          {isDeleted
                            ? t('admin-users:status.deleted')
                            : t('admin-users:status.active')}
                        </span>
                      </div>
                    </div>
                    <div>
                      {' '}
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('admin-users:modal.dateJoined')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <div>
                      {' '}
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('admin-users:modal.lastUpdated')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatDate(user.updatedAt)}
                      </p>
                    </div>{' '}
                    {user.deletedAt && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('admin-users:modals.userDetail.deletedAt')}
                          </label>
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {formatDate(user.deletedAt)}
                          </p>
                        </div>{' '}
                        {user.deletedBy &&
                          (currentUser?.role === 'OWNER' ||
                            currentUser?.role === 'HIGHER_STAFF') && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                                {' '}
                                {t('admin-users:modals.userDetail.deletedBy')}
                              </label>{' '}
                              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {user.deletedBy.firstName}{' '}
                                {user.deletedBy.lastName} (
                                {t(`admin-users:roles.${user.deletedBy.role}`)})
                              </p>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </div>
              </div>{' '}
              {/* Role Management - Only for active users */}
              {!isDeleted && canManageUser(user) && user.role !== 'OWNER' && (
                <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                  <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                    {t('admin-users:modal.roleManagement')}
                  </h4>
                  <div
                    className={`flex items-center ${isRTL ? 'space-x-3 space-x-reverse' : 'space-x-3'}`}
                  >
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      {t('admin-users:modal.changeRole')}:
                    </label>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(e.target.value as UserRole)
                      }
                      className="rounded border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="USER">
                        {t('admin-users:roles.USER')}
                      </option>
                      <option value="STAFF">
                        {t('admin-users:roles.STAFF')}
                      </option>
                      {canChangeRoleTo(user, 'HIGHER_STAFF') && (
                        <option value="HIGHER_STAFF">
                          {t('admin-users:roles.HIGHER_STAFF')}
                        </option>
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-4 py-3 dark:bg-gray-700 sm:flex sm:flex-row-reverse sm:px-6">
            <div
              className={`flex ${isRTL ? 'space-x-3 space-x-reverse' : 'space-x-3'}`}
            >
              {/* Restore Button - Only for deleted users */}
              {isDeleted && canManageUser(user) && (
                <button
                  type="button"
                  onClick={() => {
                    onRestore(user);
                    onClose();
                  }}
                  className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {t('admin-users:actions.restoreUser')}
                </button>
              )}

              {/* Delete Button - Only for active users */}
              {!isDeleted &&
                canManageUser(user) &&
                user.id !== currentUser?.id && (
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(user);
                      onClose();
                    }}
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    {t('admin-users:actions.delete')}
                  </button>
                )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t('admin-users:actions.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminPanel() {
  const { user } = useAuth();
  const { t, language, isRTL, setLanguage } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active');
  const [stats, setStats] = useState({
    total: 0,
    owners: 0,
    staff: 0,
    users: 0,
    active: 0,
  });

  // Helper function to format numbers based on language
  const formatNumber = (num: number): string => {
    return num.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('USER');
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  // Tab management
  const [activeTab, setActiveTab] = useState<
    'users' | 'products' | 'reviews' | 'reports' | 'legal'
  >('users');
  const [activeProductTab, setActiveProductTab] = useState<
    'pending' | 'approved' | 'rejected' | 'all' | 'deleted'
  >('pending'); // Enhanced Product sub-tabs
  const [products, setProducts] = useState<ProductForAdmin[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('ALL');

  // Product counts for tabs
  const [productCounts, setProductCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    deleted: 0,
    all: 0,
  });

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedProductForApproval, setSelectedProductForApproval] =
    useState<ProductForAdmin | null>(null);
  const [approvalAction, setApprovalAction] = useState<
    'approve' | 'reject' | 'reapprove' | null
  >(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [selectedProduct, setSelectedProduct] =
    useState<ProductForAdmin | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  // Reviews state
  const [reviews, setReviews] = useState<ReviewForAdmin[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewForAdmin | null>(
    null
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);
  // Reports state
  const [reports, setReports] = useState<ReportForAdmin[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportForAdmin | null>(
    null
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportFilters, setShowReportFilters] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    status: '',
    type: '',
    reporterUsername: '',
    reporterId: '',
    targetUsername: '',
    targetId: '',
    reason: '',
    dateFrom: '',
    dateTo: '',
    ipAddress: '',
    resolvedBy: '',
  });
  const [exportLoading, setExportLoading] = useState(false);

  // Legal documents state
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);
  const [legalLoading, setLegalLoading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState('tos');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [editingDocument, setEditingDocument] = useState<LegalDocument | null>(
    null
  );
  const [documentContent, setDocumentContent] = useState('');
  const [showLegalEditor, setShowLegalEditor] = useState(false);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Toast helper functions
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    // Auto remove after 5 seconds
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Check permissions
  const canManageUser = (targetUser: User): boolean => {
    if (!user) return false;

    // Owner can manage anyone except other owners
    if (user.role === 'OWNER') {
      return targetUser.role !== 'OWNER' || targetUser.id === user.id;
    }

    // Higher Staff can manage Staff and Users
    if (user.role === 'HIGHER_STAFF') {
      return ['STAFF', 'USER'].includes(targetUser.role);
    }

    // Staff cannot manage users in this interface
    return false;
  };

  const canChangeRoleTo = (targetUser: User, targetRole: UserRole): boolean => {
    if (!user || !canManageUser(targetUser)) return false;

    // Cannot change to Owner role
    if (targetRole === 'OWNER') return false;

    // Owner can change anyone to any role except Owner
    if (user.role === 'OWNER') {
      return ['HIGHER_STAFF', 'STAFF', 'USER'].includes(targetRole);
    }

    // Higher Staff can only manage Staff and User roles
    if (user.role === 'HIGHER_STAFF') {
      return ['STAFF', 'USER'].includes(targetRole);
    }

    return false;
  };
  useEffect(() => {
    fetchUsers();
  }, [viewMode]);
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = viewMode === 'deleted' ? { onlyDeleted: true } : {};
      const response: PaginatedUsersResponse = await userApi.getUsers(params);
      setUsers(response.users);

      // Calculate stats (only for active users view)
      if (viewMode === 'active') {
        const total = response.total;
        const owners = response.users.filter(
          (u: User) => u.role === 'OWNER'
        ).length;
        const staff = response.users.filter(
          (u: User) => u.role === 'HIGHER_STAFF' || u.role === 'STAFF'
        ).length;
        const regularUsers = response.users.filter(
          (u: User) => u.role === 'USER'
        ).length;
        const active = response.users.filter((u: User) => u.isActive).length;

        setStats({
          total,
          owners,
          staff,
          users: regularUsers,
          active,
        });
      } else {
        // For deleted users, show simplified stats
        setStats({
          total: response.total,
          owners: 0,
          staff: 0,
          users: 0,
          active: 0,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin-common:common.fetchError')
      );
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'HIGHER_STAFF':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'STAFF':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  const getStatusBadgeColor = (
    isActive: boolean,
    isDeleted: boolean = false
  ) => {
    if (isDeleted || !isActive) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  };
  const getStatusText = (isActive: boolean, isDeleted: boolean = false) => {
    if (isDeleted || !isActive) {
      return t('admin-users:status.deleted');
    }
    return t('admin-users:status.active');
  };

  // Helper functions for modals
  const openRoleModal = (targetUser: User) => {
    setSelectedUser(targetUser);
    setShowRoleModal(true);
  };

  const openDeleteModal = (targetUser: User) => {
    setSelectedUser(targetUser);
    setShowDeleteModal(true);
  };
  const openRestoreModal = (user: User) => {
    setSelectedUser(user);
    setShowRestoreModal(true);
  };
  const openDetailModal = async (targetUser: User) => {
    try {
      // Fetch full user details to get deletion metadata
      const fullUserDetails = await userApi.getUser(targetUser.id);
      setSelectedUser(fullUserDetails);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      // Fallback to the basic user data from the list
      setSelectedUser(targetUser);
      setShowDetailModal(true);
      addToast('error', t('admin-users:notifications.loadUserDetailsError'));
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
  };

  // Action handlers
  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      setActionLoading(true);
      await userApi.updateUser(selectedUser.id, { role: newRole });

      // Update the user in the local state
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === selectedUser.id ? { ...u, role: newRole } : u
        )
      );

      // Refresh the user list to get the latest data
      await fetchUsers();
      const roleDisplayName = t(`admin-users:roles.${newRole}`);
      addToast(
        'success',
        t('admin-users:notifications.roleUpdateSuccess').replace(
          '{{newRole}}',
          roleDisplayName
        )
      );
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('admin-users:notifications.roleUpdateError');
      setError(errorMessage);
      addToast('error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await userApi.deleteUser(selectedUser.id);

      // Remove the user from the local state or mark as inactive
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === selectedUser.id ? { ...u, isActive: false } : u
        )
      );

      // Refresh the user list to get the latest data
      await fetchUsers();
      addToast(
        'success',
        t('admin-users:notifications.deleteSuccess')
          .replace('{{firstName}}', selectedUser.firstName)
          .replace('{{lastName}}', selectedUser.lastName)
      );
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('admin-users:notifications.deleteError');
      setError(errorMessage);
      addToast('error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };
  const handleRestoreUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await userApi.restoreUser(selectedUser.id);

      // Refresh the user list to get the latest data
      await fetchUsers();
      addToast(
        'success',
        t('admin-users:notifications.restoreSuccess')
          .replace('{{firstName}}', selectedUser.firstName)
          .replace('{{lastName}}', selectedUser.lastName)
      );
      setShowRestoreModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error restoring user:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t('admin-users:notifications.restoreError');
      setError(errorMessage);
      addToast('error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Product management functions
  const fetchProductCounts = async () => {
    try {
      // Fetch all product lists to get counts
      const [
        pendingProducts,
        approvedProducts,
        rejectedProducts,
        deletedProducts,
        allProducts,
      ] = await Promise.all([
        adminApi.getPendingProducts(),
        adminApi.getApprovedProducts(),
        adminApi.getRejectedProducts(),
        adminApi.getDeletedProducts(),
        adminApi.getAllProducts(),
      ]);

      setProductCounts({
        pending: pendingProducts.length,
        approved: approvedProducts.length,
        rejected: rejectedProducts.length,
        deleted: deletedProducts.length,
        all: allProducts.length,
      });
    } catch (error) {
      console.error('Error fetching product counts:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      console.log(`Fetching ${activeProductTab} products...`);
      setProductsLoading(true);

      let response;
      switch (activeProductTab) {
        case 'pending':
          response = await adminApi.getPendingProducts();
          break;
        case 'approved':
          response = await adminApi.getApprovedProducts();
          break;
        case 'rejected':
          response = await adminApi.getRejectedProducts();
          break;
        case 'deleted':
          response = await adminApi.getDeletedProducts();
          break;
        case 'all':
        default:
          response = await adminApi.getAllProducts();
          break;
      }

      console.log(`Admin ${activeProductTab} products response:`, response);
      console.log(`Found ${response.length} ${activeProductTab} products`);
      setProducts(response);
    } catch (error) {
      console.error('Error fetching products:', error);
      addToast('error', `Failed to fetch ${activeProductTab} products`);
    } finally {
      setProductsLoading(false);
    }
  };

  // Filter products based on search and type
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.username
        .toLowerCase()
        .includes(productSearchTerm.toLowerCase()) ||
      product.slug.toLowerCase().includes(productSearchTerm.toLowerCase());

    const matchesType =
      productTypeFilter === 'ALL' || product.type === productTypeFilter;

    return matchesSearch && matchesType;
  });

  const handleApproveProduct = async (productId: string, reason?: string) => {
    try {
      setActionLoading(true);
      console.log('Approving product:', productId, 'with reason:', reason);
      const response = await adminApi.approveProduct(productId, reason);
      console.log('Approval response:', response);
      addToast('success', 'Product approved successfully');
      console.log('Fetching products after approval...');
      await fetchProducts();
      await fetchProductCounts(); // Refresh counts
      console.log('Products refetched successfully');
      setShowApprovalModal(false);
      setSelectedProductForApproval(null);
      setApprovalAction(null);
      setApprovalReason('');
    } catch (error) {
      console.error('Error approving product:', error);
      addToast('error', 'Failed to approve product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProduct = async (productId: string, reason: string) => {
    try {
      setActionLoading(true);
      await adminApi.rejectProduct(productId, reason);
      addToast('success', 'Product rejected successfully');
      await fetchProducts();
      setShowApprovalModal(false);
      setSelectedProductForApproval(null);
      setApprovalAction(null);
      setApprovalReason('');
    } catch (error) {
      console.error('Error rejecting product:', error);
      addToast('error', 'Failed to reject product');
    } finally {
      setActionLoading(false);
    }
  };

  const openApprovalModal = (
    product: ProductForAdmin,
    action: 'approve' | 'reject' | 'reapprove'
  ) => {
    setSelectedProductForApproval(product);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };
  const handleToggleProductVisibility = async (productId: string) => {
    try {
      setActionLoading(true);
      await adminApi.toggleProductVisibility(productId);
      addToast('success', 'Product visibility updated');
      await fetchProducts();
    } catch (error) {
      console.error('Error toggling product visibility:', error);
      addToast('error', 'Failed to update product visibility');
    } finally {
      setActionLoading(false);
    }
  };
  const handleDeleteProduct = async (productId: string) => {
    try {
      setActionLoading(true);
      await adminApi.deleteProductPermanently(productId, deletionReason);
      addToast('success', 'Product deleted permanently');
      await fetchProducts();
      await fetchProductCounts(); // Refresh counts
      setShowDeleteProductModal(false);
      setSelectedProduct(null);
      setDeletionReason('');
    } catch (error) {
      console.error('Error deleting product:', error);
      addToast('error', 'Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreProduct = async (productId: string) => {
    try {
      setActionLoading(true);
      await adminApi.restoreProduct(productId);
      addToast('success', 'Product restored successfully');
      await fetchProducts();
      await fetchProductCounts(); // Refresh counts
    } catch (error) {
      console.error('Error restoring product:', error);
      addToast('error', 'Failed to restore product');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteProductModal = (product: ProductForAdmin) => {
    setSelectedProduct(product);
    setShowDeleteProductModal(true);
  }; // Review management functions
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await adminApi.getAllReviews();
      console.log('Reviews fetched:', response);
      setReviews(response);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      addToast('error', 'Failed to fetch reviews');
    } finally {
      setReviewsLoading(false);
    }
  };
  const handleToggleReviewVisibility = async (reviewId: string) => {
    try {
      setActionLoading(true);
      await adminApi.toggleReviewVisibility(reviewId);
      addToast('success', 'Review visibility updated');
      await fetchReviews();
    } catch (error) {
      console.error('Error toggling review visibility:', error);
      addToast('error', 'Failed to update review visibility');
    } finally {
      setActionLoading(false);
    }
  };
  const handleDeleteReview = async (reviewId: string) => {
    try {
      setActionLoading(true);
      await adminApi.deleteReviewPermanently(reviewId);
      addToast('success', 'Review deleted permanently');
      await fetchReviews();
      setShowDeleteReviewModal(false);
      setSelectedReview(null);
    } catch (error) {
      console.error('Error deleting review:', error);
      addToast('error', 'Failed to delete review');
    } finally {
      setActionLoading(false);
    }
  };
  const openDeleteReviewModal = (review: ReviewForAdmin) => {
    setSelectedReview(review);
    setShowDeleteReviewModal(true);
  }; // Reports management functions
  const fetchReports = async (filters?: any) => {
    try {
      setReportsLoading(true);
      const response = await adminApi.getAllReports(filters);
      console.log('Reports API response:', response);

      // The getAllReports method now handles extracting the reports array
      if (Array.isArray(response)) {
        setReports(response);
      } else {
        console.error('Reports API returned non-array:', response);
        setReports([]);
        addToast('error', 'Invalid reports data format received');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]); // Ensure reports is always an array
      addToast(
        'error',
        `Failed to fetch reports: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setReportsLoading(false);
    }
  };

  const applyReportFilters = () => {
    // Clean up empty filter values
    const cleanFilters = Object.fromEntries(
      Object.entries(reportFilters).filter(([_, value]) => value !== '')
    );
    fetchReports(cleanFilters);
  };

  const clearReportFilters = () => {
    setReportFilters({
      status: '',
      type: '',
      reporterUsername: '',
      reporterId: '',
      targetUsername: '',
      targetId: '',
      reason: '',
      dateFrom: '',
      dateTo: '',
      ipAddress: '',
      resolvedBy: '',
    });
    fetchReports();
  };

  const exportReportsAsJson = async () => {
    try {
      setExportLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(reportFilters).filter(([_, value]) => value !== '')
      );
      const response = await adminApi.exportReportsJson(cleanFilters);

      // Create and download the file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flipstaq-reports-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast('success', t('admin-reports:search.export_success'));
    } catch (error) {
      console.error('Error exporting reports as JSON:', error);
      addToast('error', t('admin-reports:search.export_error'));
    } finally {
      setExportLoading(false);
    }
  };

  const exportReportsAsHtml = async () => {
    try {
      setExportLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(reportFilters).filter(([_, value]) => value !== '')
      );
      const response = await adminApi.exportReportsHtml(cleanFilters);

      // Create and download the file
      const blob = new Blob([response.html], {
        type: 'text/html',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flipstaq-reports-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast('success', t('admin-reports:search.export_success'));
    } catch (error) {
      console.error('Error exporting reports as HTML:', error);
      addToast('error', t('admin-reports:search.export_error'));
    } finally {
      setExportLoading(false);
    }
  };

  const exportSingleReportAsJson = async (reportId: string) => {
    try {
      setExportLoading(true);
      const response = await adminApi.exportSingleReportJson(reportId);

      // Create and download the file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flipstaq-report-${reportId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast('success', t('admin-reports:search.export_success'));
    } catch (error) {
      console.error('Error exporting single report as JSON:', error);
      addToast('error', t('admin-reports:search.export_error'));
    } finally {
      setExportLoading(false);
    }
  };

  const exportSingleReportAsHtml = async (reportId: string) => {
    try {
      setExportLoading(true);
      const response = await adminApi.exportSingleReportHtml(reportId);

      // Create and download the file
      const blob = new Blob([response.html], {
        type: 'text/html',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flipstaq-report-${reportId}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast('success', t('admin-reports:search.export_success'));
    } catch (error) {
      console.error('Error exporting single report as HTML:', error);
      addToast('error', t('admin-reports:search.export_error'));
    } finally {
      setExportLoading(false);
    }
  };
  const handleResolveReport = async (reportId: string) => {
    try {
      setActionLoading(true);
      await adminApi.resolveReport(reportId);
      addToast('success', 'Report resolved successfully');
      await fetchReports();
    } catch (error) {
      console.error('Error resolving report:', error);
      addToast('error', 'Failed to resolve report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetUnderReview = async (reportId: string) => {
    try {
      setActionLoading(true);
      await adminApi.setReportUnderReview(reportId);
      addToast('success', 'Report set to under review');
      await fetchReports();
    } catch (error) {
      console.error('Error setting report under review:', error);
      addToast('error', 'Failed to set report under review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      setActionLoading(true);
      await adminApi.dismissReport(reportId);
      addToast('success', 'Report dismissed successfully');
      await fetchReports();
    } catch (error) {
      console.error('Error dismissing report:', error);
      addToast('error', 'Failed to dismiss report');
    } finally {
      setActionLoading(false);
    }
  };

  // Legal documents management functions
  const fetchLegalDocuments = async () => {
    try {
      setLegalLoading(true);
      const response = await legalApi.getAllDocuments();
      setLegalDocuments(response);
    } catch (error) {
      console.error('Error fetching legal documents:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      if (errorMessage.includes('Invalid or expired token')) {
        addToast(
          'error',
          'Authentication required. Please refresh the page and try again.'
        );
      } else {
        addToast('error', t('admin-legal:messages.loadError'));
      }
    } finally {
      setLegalLoading(false);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const types = await legalApi.getDocumentTypes();
      setAvailableTypes(types);
    } catch (error) {
      console.error('Error fetching document types:', error);
    }
  };

  const openLegalEditor = async (type: string, language: string) => {
    try {
      setLegalLoading(true);
      setSelectedDocumentType(type);
      setSelectedLanguage(language);

      // Try to find existing document
      const existingDoc = legalDocuments.find(
        (doc) => doc.type === type && doc.language === language
      );

      if (existingDoc) {
        setEditingDocument(existingDoc);
        setDocumentContent(existingDoc.content);
      } else {
        setEditingDocument(null);
        setDocumentContent('');
      }

      setShowLegalEditor(true);
    } catch (error) {
      console.error('Error opening legal editor:', error);
      addToast('error', 'Failed to open legal editor');
    } finally {
      setLegalLoading(false);
    }
  };

  const saveLegalDocument = async () => {
    if (!documentContent.trim()) {
      addToast('error', t('admin-legal:validation.contentRequired'));
      return;
    }

    if (documentContent.trim().length < 10) {
      addToast('error', t('admin-legal:validation.contentMinLength'));
      return;
    }

    try {
      setLegalLoading(true);

      if (editingDocument) {
        // Update existing document
        await legalApi.updateDocument(editingDocument.id, {
          content: documentContent,
        });
        addToast('success', t('admin-legal:messages.saveSuccess'));
      } else {
        // Create new document
        const documentTitle = t(
          `admin-legal:documentTypes.${selectedDocumentType}`
        );
        await legalApi.createDocument({
          type: selectedDocumentType,
          language: selectedLanguage,
          title: documentTitle,
          content: documentContent,
        });
        addToast('success', t('admin-legal:messages.saveSuccess'));
      }

      await fetchLegalDocuments();
      setShowLegalEditor(false);
      setDocumentContent('');
      setEditingDocument(null);
    } catch (error) {
      console.error('Error saving legal document:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      if (errorMessage.includes('Invalid or expired token')) {
        addToast(
          'error',
          'Authentication required. Please refresh the page and try again.'
        );
      } else if (errorMessage.includes('Insufficient permissions')) {
        addToast('error', 'You do not have permission to perform this action.');
      } else {
        addToast('error', t('admin-legal:messages.saveError'));
      }
    } finally {
      setLegalLoading(false);
    }
  };

  const deleteLegalDocument = async (documentId: string) => {
    if (!confirm(t('admin-legal:messages.confirmDelete'))) {
      return;
    }

    try {
      setLegalLoading(true);
      await legalApi.deleteDocument(documentId);
      addToast('success', t('admin-legal:messages.deleteSuccess'));
      await fetchLegalDocuments();
    } catch (error) {
      console.error('Error deleting legal document:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      if (errorMessage.includes('Invalid or expired token')) {
        addToast(
          'error',
          'Authentication required. Please refresh the page and try again.'
        );
      } else if (errorMessage.includes('Insufficient permissions')) {
        addToast('error', 'You do not have permission to perform this action.');
      } else {
        addToast('error', t('admin-legal:messages.deleteError'));
      }
    } finally {
      setLegalLoading(false);
    }
  };

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
      fetchProductCounts(); // Fetch counts when products tab is opened
    } else if (activeTab === 'reviews') {
      fetchReviews();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'legal') {
      fetchLegalDocuments();
      fetchDocumentTypes();
    }
  }, [activeTab]);

  // Refetch products when product sub-tab changes
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeProductTab]);

  return (
    <AdminRouteGuard>
      <div
        className="min-h-screen bg-gray-50 dark:bg-gray-900"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        {/* Header */}
        <div className="bg-white shadow dark:bg-gray-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                {' '}
                <h1 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl lg:text-2xl">
                  {t('admin-common:header.title')}
                </h1>
              </div>{' '}
              <div
                className={`flex items-center ${isRTL ? 'space-x-2 space-x-reverse sm:space-x-4' : 'space-x-2 sm:space-x-4'}`}
              >
                {/* Language Switcher */}
                <div className="flex items-center">
                  <button
                    onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:px-2.5"
                  >
                    <span className="hidden sm:inline">{language === 'en' ? '🇸🇦 AR' : '🇺🇸 EN'}</span>
                    <span className="sm:hidden">{language === 'en' ? 'AR' : 'EN'}</span>
                  </button>
                </div>{' '}
                <div className="hidden md:block">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('admin-common:header.welcome', {
                      firstName: user?.firstName,
                      lastName: user?.lastName,
                    })}
                  </span>
                </div>
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300 sm:px-2.5">
                  <span className="hidden sm:inline">{t(`admin-users:roles.${user?.role}`)}</span>
                  <span className="sm:hidden">{user?.role}</span>
                </span>
              </div>
            </div>{' '}
          </div>
        </div>{' '}
        {/* Tab Navigation */}
        <div className="bg-white shadow dark:bg-gray-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="overflow-x-auto">
              <div
                className={`flex min-w-max ${isRTL ? 'space-x-8 space-x-reverse' : 'space-x-8'}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <button
                  onClick={() => setActiveTab('users')}
                  className={`${
                    activeTab === 'users'
                      ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                  } flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
                >
                  <svg
                    className={`${isRTL ? 'ml-2' : 'mr-2'} -mt-0.5 h-5 w-5`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  <span className="hidden sm:inline">{t('admin-common:tabs.users')}</span>
                  <span className="sm:hidden">Users</span>
                </button>

                {(user?.role === 'OWNER' || user?.role === 'HIGHER_STAFF') && (
                  <>
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`${
                        activeTab === 'products'
                          ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                      } flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
                    >
                      <svg
                        className={`${isRTL ? 'ml-2' : 'mr-2'} -mt-0.5 h-5 w-5`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <span className="hidden sm:inline">{t('admin-common:tabs.products')}</span>
                      <span className="sm:hidden">Products</span>
                    </button>{' '}
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className={`${
                        activeTab === 'reviews'
                          ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                      } flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
                    >
                      <svg
                        className={`${isRTL ? 'ml-2' : 'mr-2'} -mt-0.5 h-5 w-5`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span className="hidden sm:inline">{t('admin-common:tabs.reviews')}</span>
                      <span className="sm:hidden">Reviews</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className={`${
                        activeTab === 'reports'
                          ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                      } flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
                    >
                      <svg
                        className={`${isRTL ? 'ml-2' : 'mr-2'} -mt-0.5 h-5 w-5`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <span className="hidden sm:inline">{t('admin-common:tabs.reports')}</span>
                      <span className="sm:hidden">Reports</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('legal')}
                      className={`${
                        activeTab === 'legal'
                          ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                      } flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
                    >
                      <svg
                        className={`${isRTL ? 'ml-2' : 'mr-2'} -mt-0.5 h-5 w-5`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="hidden sm:inline">{t('admin-common:tabs.legal')}</span>
                      <span className="sm:hidden">Legal</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>{' '}
        <div
          className={`px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${isRTL ? 'space-y-6 sm:space-y-8' : 'space-y-6 sm:space-y-8'}`}
        >
          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-6">
                <div className="overflow-hidden rounded-lg bg-white shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                          <svg
                            className="h-5 w-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                          </svg>
                        </div>
                      </div>{' '}
                      <div
                        className={`w-0 flex-1 ${isRTL ? 'mr-3 sm:mr-5' : 'ml-3 sm:ml-5'}`}
                      >
                        <dl>
                          <dt className="truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                            {t('admin-common:stats.totalUsers')}
                          </dt>
                          <dd className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                            {formatNumber(stats.total)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500">
                          <svg
                            className="h-5 w-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>{' '}
                      <div
                        className={`w-0 flex-1 ${isRTL ? 'mr-3 sm:mr-5' : 'ml-3 sm:ml-5'}`}
                      >
                        <dl>
                          <dt className="truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                            {t('admin-common:stats.owners')}
                          </dt>
                          <dd className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                            {formatNumber(stats.owners)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                          <svg
                            className="h-5 w-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>{' '}
                      <div
                        className={`w-0 flex-1 ${isRTL ? 'mr-3 sm:mr-5' : 'ml-3 sm:ml-5'}`}
                      >
                        <dl>
                          <dt className="truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                            {t('admin-common:stats.staff')}
                          </dt>
                          <dd className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                            {formatNumber(stats.staff)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500">
                          <svg
                            className="h-5 w-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>{' '}
                      <div
                        className={`w-0 flex-1 ${isRTL ? 'mr-3 sm:mr-5' : 'ml-3 sm:ml-5'}`}
                      >
                        <dl>
                          <dt className="truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                            {t('admin-common:stats.users')}
                          </dt>
                          <dd className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                            {formatNumber(stats.users)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                          <svg
                            className="h-5 w-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>{' '}
                      <div
                        className={`w-0 flex-1 ${isRTL ? 'mr-3 sm:mr-5' : 'ml-3 sm:ml-5'}`}
                      >
                        <dl>
                          <dt className="truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                            {t('admin-common:stats.active')}
                          </dt>
                          <dd className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                            {formatNumber(stats.active)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6 rounded-lg bg-white shadow-lg dark:bg-gray-800">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="flex-1">
                      <label htmlFor="search" className="sr-only">
                        Search users
                      </label>{' '}
                      <div className="relative">
                        <div
                          className={`pointer-events-none absolute inset-y-0 flex items-center ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'}`}
                        >
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <input
                          id="search"
                          type="text"
                          placeholder={t(
                            'admin-users:filters.search.placeholder'
                          )}
                          className={`block w-full rounded-lg border border-gray-300 bg-white py-3 leading-5 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${isRTL ? 'pl-3 pr-10' : 'pl-10 pr-3'}`}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>{' '}
                    </div>
                    {/* View Mode Toggle - Only for OWNER and HIGHER_STAFF */}
                    {(user?.role === 'OWNER' ||
                      user?.role === 'HIGHER_STAFF') && (
                      <div className="sm:w-48 lg:w-56">
                        {' '}
                        <label htmlFor="viewMode" className="sr-only">
                          {t('admin-users:filters.view.label')}
                        </label>
                        <select
                          id="viewMode"
                          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          value={viewMode}
                          onChange={(e) =>
                            setViewMode(e.target.value as 'active' | 'deleted')
                          }
                        >
                          <option value="active">
                            {' '}
                            {t('admin-users:filters.view.active')}
                          </option>
                          <option value="deleted">
                            {t('admin-users:filters.view.deleted')}
                          </option>
                        </select>
                      </div>
                    )}
                    <div className="sm:w-48 lg:w-56">
                      {' '}
                      <label htmlFor="role" className="sr-only">
                        {t('admin-users:filters.role.label')}
                      </label>
                      <select
                        id="role"
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      >
                        <option value="ALL">
                          {' '}
                          {t('admin-users:filters.role.all')}
                        </option>
                        <option value="OWNER">
                          {t('admin-users:filters.role.owner')}
                        </option>
                        <option value="HIGHER_STAFF">
                          {t('admin-users:filters.role.higherStaff')}
                        </option>
                        <option value="STAFF">
                          {t('admin-users:filters.role.staff')}
                        </option>
                        <option value="USER">
                          {t('admin-users:filters.role.user')}
                        </option>
                      </select>
                    </div>
                    <button
                      onClick={fetchUsers}
                      className="inline-flex items-center rounded-lg border border-transparent bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <svg
                        className={isRTL ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />{' '}
                      </svg>
                      {t('admin-common:common.retry')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
                <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
                  {' '}
                  <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white sm:text-xl">
                    {t('admin-users:table.title')} ({filteredUsers.length})
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t('admin-users:table.description')}
                  </p>
                </div>{' '}
                {loading ? (
                  <LoadingSpinner
                    text={t('admin-users:table.loading')}
                    className="py-16"
                  />
                ) : error ? (
                  <div className="py-16 text-center">
                    <svg
                      className="mx-auto h-16 w-16 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="mb-4 text-lg text-red-500">{error}</div>
                    <button
                      onClick={fetchUsers}
                      className="inline-flex items-center rounded-lg border border-transparent bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      {' '}
                      <svg
                        className={isRTL ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />{' '}
                      </svg>
                      {t('admin-common:common.retry')}
                    </button>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-16 text-center">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>{' '}
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                      {t('admin-users:table.noUsers')}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      {searchTerm || selectedRole !== 'ALL'
                        ? t('admin-users:table.noData')
                        : t('admin-users:table.noData')}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {' '}
                          <th
                            className={`px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {t('admin-users:table.headers.user')}
                          </th>
                          <th
                            className={`hidden px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:table-cell ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {t('admin-users:table.headers.role')}
                          </th>
                          <th
                            className={`hidden px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 md:table-cell ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {t('admin-users:table.headers.status')}
                          </th>
                          <th
                            className={`hidden px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 lg:table-cell ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {t('admin-users:table.headers.country')}
                          </th>
                          <th
                            className={`hidden px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 lg:table-cell ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {t('admin-users:table.headers.dateJoined')}
                          </th>
                          <th
                            className={`px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {t('admin-users:table.headers.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {' '}
                        {filteredUsers.map((tableUser) => {
                          const isDeleted =
                            viewMode === 'deleted' || !tableUser.isActive;
                          return (
                            <tr
                              key={tableUser.id}
                              className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                isDeleted
                                  ? 'bg-gray-50 opacity-75 dark:bg-gray-800'
                                  : ''
                              }`}
                            >
                              {' '}
                              <td
                                className={`whitespace-nowrap px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0 sm:h-12 sm:w-12">
                                    <div
                                      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg sm:h-12 sm:w-12 ${
                                        isDeleted
                                          ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                                          : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                      }`}
                                    >
                                      <span className="text-sm font-bold text-white sm:text-lg">
                                        {tableUser.firstName.charAt(0)}
                                        {tableUser.lastName.charAt(0)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className={isRTL ? 'mr-4' : 'ml-4'}>
                                    <div
                                      className={`text-sm font-semibold ${
                                        isDeleted
                                          ? 'text-gray-500 dark:text-gray-400'
                                          : 'text-gray-900 dark:text-white'
                                      }`}
                                    >
                                      {tableUser.firstName} {tableUser.lastName}{' '}
                                      {isDeleted && (
                                        <span
                                          className={`inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300 ${isRTL ? 'mr-2' : 'ml-2'}`}
                                        >
                                          {t('admin-users:status.deleted')}
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`text-sm ${
                                        isDeleted
                                          ? 'text-gray-400 dark:text-gray-500'
                                          : 'text-gray-500 dark:text-gray-400'
                                      }`}
                                    >
                                      {tableUser.email}
                                    </div>
                                    <div
                                      className={`text-xs ${
                                        isDeleted
                                          ? 'text-gray-400 dark:text-gray-600'
                                          : 'text-gray-400 dark:text-gray-500'
                                      }`}
                                    >
                                      @{tableUser.username}
                                    </div>
                                    {/* Mobile-only role and status */}
                                    <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
                                      {' '}
                                      <span
                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getRoleBadgeColor(tableUser.role)}`}
                                      >
                                        {t(
                                          `admin-users:roles.${tableUser.role}`
                                        )}
                                      </span>
                                      <span
                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeColor(tableUser.isActive, isDeleted)}`}
                                      >
                                        {getStatusText(
                                          tableUser.isActive,
                                          isDeleted
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td
                                className={`hidden whitespace-nowrap px-6 py-4 sm:table-cell ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                {' '}
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(tableUser.role)}`}
                                >
                                  {t(`admin-users:roles.${tableUser.role}`)}
                                </span>
                              </td>
                              <td
                                className={`hidden whitespace-nowrap px-6 py-4 md:table-cell ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(tableUser.isActive, isDeleted)}`}
                                >
                                  {getStatusText(tableUser.isActive, isDeleted)}
                                </span>
                              </td>
                              <td
                                className={`hidden whitespace-nowrap px-6 py-4 text-sm font-medium lg:table-cell ${isRTL ? 'text-right' : 'text-left'} ${
                                  isDeleted
                                    ? 'text-gray-500 dark:text-gray-400'
                                    : 'text-gray-900 dark:text-white'
                                }`}
                              >
                                {tableUser.country}
                              </td>
                              <td
                                className={`hidden whitespace-nowrap px-6 py-4 text-sm lg:table-cell ${isRTL ? 'text-right' : 'text-left'} ${
                                  isDeleted
                                    ? 'text-gray-400 dark:text-gray-500'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}
                              >
                                {new Date(
                                  tableUser.createdAt
                                ).toLocaleDateString(
                                  language === 'ar' ? 'ar-SA' : 'en-US',
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  }
                                )}
                              </td>{' '}
                              <td
                                className={`whitespace-nowrap px-6 py-4 text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                <div
                                  className={`flex flex-col gap-2 sm:flex-row sm:items-center ${isRTL ? 'sm:space-x-2 sm:space-x-reverse' : 'sm:space-x-2'}`}
                                >
                                  {/* View Details Button - Always available */}
                                  <button
                                    onClick={() => openDetailModal(tableUser)}
                                    className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                    title={t('admin-users:actions.view')}
                                  >
                                    {t('admin-users:actions.viewDetails')}
                                  </button>

                                  {/* Role Change Dropdown - Only for active users */}
                                  {viewMode === 'active' &&
                                    canManageUser(tableUser) &&
                                    tableUser.role !== 'OWNER' && (
                                      <select
                                        value={tableUser.role}
                                        onChange={(e) => {
                                          const newUserRole = e.target
                                            .value as UserRole;
                                          if (
                                            canChangeRoleTo(
                                              tableUser,
                                              newUserRole
                                            ) &&
                                            newUserRole !== tableUser.role
                                          ) {
                                            setNewRole(newUserRole);
                                            openRoleModal(tableUser);
                                          }
                                        }}
                                        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        disabled={isDeleted}
                                      >
                                        {' '}
                                        <option value="USER">
                                          {t('admin-users:roles.USER')}
                                        </option>
                                        <option value="STAFF">
                                          {t('admin-users:roles.STAFF')}
                                        </option>
                                        {canChangeRoleTo(
                                          tableUser,
                                          'HIGHER_STAFF'
                                        ) && (
                                          <option value="HIGHER_STAFF">
                                            {t(
                                              'admin-users:roles.HIGHER_STAFF'
                                            )}
                                          </option>
                                        )}
                                      </select>
                                    )}

                                  {/* Delete Button - Only for active users */}
                                  {viewMode === 'active' &&
                                    canManageUser(tableUser) &&
                                    tableUser.id !== user?.id && (
                                      <button
                                        onClick={() =>
                                          openDeleteModal(tableUser)
                                        }
                                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                        title={t('admin-users:actions.delete')}
                                      >
                                        {t('admin-users:actions.delete')}
                                      </button>
                                    )}
                                  {/* Restore Button - Only for deleted users */}
                                  {viewMode === 'deleted' &&
                                    canManageUser(tableUser) && (
                                      <button
                                        onClick={() =>
                                          openRestoreModal(tableUser)
                                        }
                                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                                        title={t(
                                          'admin-users:actions.restoreUser'
                                        )}
                                      >
                                        {t('admin-users:actions.restore')}
                                      </button>
                                    )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}{' '}
              </div>
            </div>
          )}{' '}
          {/* Products Tab Content */}
          {activeTab === 'products' && (
            <div className={`space-y-6 ${isRTL ? 'mt-8' : 'mt-6'}`}>
              <div
                className={`rounded-lg bg-white shadow dark:bg-gray-800 ${isRTL ? 'p-8' : 'p-6'}`}
              >
                <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                  {t('admin-common:tabs.products')}{' '}
                  {t('admin-common:tabs.moderation')}
                </h2>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                  {t('admin-products:description')}
                </p>

                {/* Search and Filter Controls */}
                <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                  <div
                    className={`flex flex-col gap-3 sm:flex-row sm:items-center ${isRTL ? 'sm:space-x-3 sm:space-x-reverse' : 'sm:space-x-3'}`}
                  >
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        {t('admin-products:search.label')}
                      </label>
                      <div className="relative">
                        <div
                          className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} pointer-events-none flex items-center`}
                        >
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder={t('admin-products:search.placeholder')}
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className={`block w-full rounded-md border-gray-300 bg-white py-2.5 text-sm placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 ${isRTL ? 'pr-10 text-right' : 'pl-10'}`}
                        />
                      </div>
                    </div>
                    <div className="sm:w-48">
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        {t('admin-products:filters.typeLabel')}
                      </label>
                      <select
                        value={productTypeFilter}
                        onChange={(e) => setProductTypeFilter(e.target.value)}
                        className="block w-full rounded-md border-gray-300 bg-white py-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                      >
                        <option value="ALL">
                          {t('admin-products:filters.allTypes')}
                        </option>
                        <option value="DIGITAL">
                          {t('products.types.DIGITAL')}
                        </option>
                        <option value="PHYSICAL">
                          {t('products.types.PHYSICAL')}
                        </option>
                        <option value="SERVICE">
                          {t('products.types.SERVICE')}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Product Sub-tabs */}
                <div
                  className={`mb-6 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <nav
                    className={`flex ${isRTL ? 'space-x-8 space-x-reverse' : 'space-x-8'}`}
                    aria-label="Tabs"
                  >
                    <button
                      onClick={() => setActiveProductTab('pending')}
                      className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                        activeProductTab === 'pending'
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {t('admin-products:tabs.pending')}
                      {productCounts.pending > 0 && (
                        <span
                          className={`${isRTL ? 'mr-2' : 'ml-2'} rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-800 dark:text-indigo-200`}
                        >
                          {productCounts.pending}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveProductTab('approved')}
                      className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                        activeProductTab === 'approved'
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {t('admin-products:tabs.approved')}
                      {productCounts.approved > 0 && (
                        <span
                          className={`${isRTL ? 'mr-2' : 'ml-2'} rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-800 dark:text-green-200`}
                        >
                          {productCounts.approved}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveProductTab('rejected')}
                      className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                        activeProductTab === 'rejected'
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {t('admin-products:tabs.rejected')}
                      {productCounts.rejected > 0 && (
                        <span
                          className={`${isRTL ? 'mr-2' : 'ml-2'} rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-800 dark:text-red-200`}
                        >
                          {productCounts.rejected}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveProductTab('deleted')}
                      className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                        activeProductTab === 'deleted'
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {t('admin-products:tabs.deleted')}
                      {productCounts.deleted > 0 && (
                        <span
                          className={`${isRTL ? 'mr-2' : 'ml-2'} rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300`}
                        >
                          {productCounts.deleted}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveProductTab('all')}
                      className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                        activeProductTab === 'all'
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {t('admin-products:tabs.all')}
                      {productCounts.all > 0 && (
                        <span
                          className={`${isRTL ? 'mr-2' : 'ml-2'} rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300`}
                        >
                          {productCounts.all}
                        </span>
                      )}
                    </button>
                  </nav>

                  {/* Refresh Button */}
                  <button
                    onClick={fetchProducts}
                    disabled={productsLoading}
                    className={`inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 ${
                      productsLoading ? 'cursor-not-allowed' : ''
                    }`}
                    title={t('common:refresh')}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} ${
                        productsLoading ? 'animate-spin' : ''
                      }`}
                    />
                    {t('common:refresh')}
                  </button>
                </div>

                {productsLoading ? (
                  <LoadingSpinner text={t('admin-products:loading')} />
                ) : filteredProducts.length === 0 ? (
                  <div className="py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 48 48"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      {productSearchTerm || productTypeFilter !== 'ALL'
                        ? t('admin-products:empty.title')
                        : t('admin-products:noProducts')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {productSearchTerm || productTypeFilter !== 'ALL'
                        ? t('admin-products:empty.description')
                        : t('admin-products:noProductsDescription')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 bg-gray-50 p-6 dark:bg-gray-800">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`rounded-lg border bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900 ${
                          !product.isActive
                            ? 'border-gray-300 opacity-60'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="p-6">
                          {/* Header with Image and Basic Info */}
                          <div
                            className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            <div
                              className={`relative flex-shrink-0 ${isRTL ? 'ml-0 mr-4' : 'ml-0 mr-4'}`}
                            >
                              {product.imageUrl ? (
                                <img
                                  className="h-32 w-32 rounded-lg border border-gray-200 object-cover dark:border-gray-600"
                                  src={`http://localhost:3100${product.imageUrl}`}
                                  alt={product.title}
                                />
                              ) : (
                                <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-700">
                                  <svg
                                    className="h-16 w-16 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                              )}
                              {/* Status overlays */}
                              {product.status === 'REJECTED' && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-500 bg-opacity-75">
                                  <span className="text-xs font-bold text-white">
                                    {t('admin-products:status.rejected')}
                                  </span>
                                </div>
                              )}
                              {!product.isActive && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-500 bg-opacity-75">
                                  <span className="text-xs font-bold text-white">
                                    {t('admin-products:status.deleted')}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div
                              className={`min-w-0 flex-1 ${isRTL ? 'ml-auto mr-0' : 'ml-0 mr-auto'}`}
                            >
                              <div
                                className={`flex items-start ${isRTL ? 'flex-row-reverse justify-between' : 'justify-between'}`}
                              >
                                <div className="flex-1">
                                  <h3
                                    className={`text-xl font-bold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
                                  >
                                    {product.title}
                                  </h3>
                                  <p
                                    className={`mt-1 text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}
                                  >
                                    <span className="font-medium">Slug:</span>{' '}
                                    {product.slug} |
                                    <span className="font-medium">
                                      {' '}
                                      Seller:
                                    </span>{' '}
                                    @{product.username} |
                                    <span className="font-medium"> ID:</span>{' '}
                                    {product.id}
                                  </p>
                                  <div
                                    className={`mt-3 flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                                  >
                                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                      {product.price} {product.currency}
                                    </span>
                                    <span
                                      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                                        product.type === 'DIGITAL'
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                                          : product.type === 'PHYSICAL'
                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
                                            : 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                                      }`}
                                    >
                                      {product.type === 'DIGITAL'
                                        ? t('products.types.DIGITAL')
                                        : product.type === 'PHYSICAL'
                                          ? t('products.types.PHYSICAL')
                                          : t('products.types.SERVICE')}
                                    </span>
                                  </div>
                                </div>

                                <div
                                  className={`flex flex-col gap-2 ${isRTL ? 'items-start' : 'items-end'}`}
                                >
                                  {/* Status badges */}
                                  <div
                                    className={`flex flex-col gap-1 ${isRTL ? 'items-start' : 'items-end'}`}
                                  >
                                    <span
                                      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                                        product.status === 'APPROVED'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                          : product.status === 'REJECTED'
                                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                      }`}
                                    >
                                      {product.status === 'APPROVED'
                                        ? t('admin-products:status.approved')
                                        : product.status === 'REJECTED'
                                          ? t('admin-products:status.rejected')
                                          : t('admin-products:status.pending')}
                                    </span>
                                    {!product.isActive && (
                                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                        {t('admin-products:status.deleted')}
                                      </span>
                                    )}
                                    {product.status === 'APPROVED' &&
                                      product.visible && (
                                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                          {t('admin-products:status.visible')}
                                        </span>
                                      )}
                                    {product.status === 'APPROVED' &&
                                      !product.visible && (
                                        <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800 dark:bg-orange-800 dark:text-orange-100">
                                          {t('admin-products:status.hidden')}
                                        </span>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Product Description */}
                          {product.description && (
                            <div className="mt-6">
                              <h4
                                className={`mb-3 text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                {t('admin-products:details.description')}
                              </h4>
                              <div
                                className={`rounded-lg border bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                {product.description}
                              </div>
                            </div>
                          )}

                          {/* Product Details Grid */}
                          <div className="mt-6">
                            <h4
                              className={`mb-3 text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
                            >
                              {t('admin-products:details.information')}
                            </h4>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  {t('admin-products:details.location')}
                                </span>
                                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                  {product.location}
                                </p>
                              </div>
                              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  {t('admin-products:details.category')}
                                </span>
                                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                  {product.category || 'N/A'}
                                </p>
                              </div>
                              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  {t('admin-products:details.rating')}
                                </span>
                                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                  {product.status === 'APPROVED'
                                    ? product.averageRating > 0
                                      ? `${product.averageRating.toFixed(1)}/5`
                                      : 'No ratings'
                                    : t('admin-products:details.notApproved')}
                                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                                    {product.status === 'APPROVED'
                                      ? `${product.totalReviews} review${product.totalReviews !== 1 ? 's' : ''}`
                                      : t(
                                          'admin-products:details.ratingsOnlyForApproved'
                                        )}
                                  </span>
                                </p>
                              </div>
                              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  {t('admin-products:details.created')}
                                </span>
                                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                  {new Date(
                                    product.createdAt
                                  ).toLocaleDateString()}
                                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(
                                      product.createdAt
                                    ).toLocaleTimeString()}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Approval Information for Approved Products */}
                          {product.status === 'APPROVED' &&
                            product.approvedBy && (
                              <div
                                className={`mt-6 rounded-lg border-l-4 border-green-400 bg-green-50 p-4 dark:bg-green-900/20 ${isRTL ? 'border-l-0 border-r-4' : ''}`}
                              >
                                <h4
                                  className={`mb-3 text-sm font-semibold uppercase tracking-wide text-green-800 dark:text-green-300 ${isRTL ? 'text-right' : 'text-left'}`}
                                >
                                  {t('admin-products:approval.details')}
                                </h4>
                                <div
                                  className={`grid grid-cols-1 gap-4 text-sm md:grid-cols-2 ${isRTL ? 'text-right' : 'text-left'}`}
                                >
                                  <div>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                      {t('admin-products:approval.approvedBy')}:
                                    </span>{' '}
                                    <span className="font-semibold text-green-800 dark:text-green-300">
                                      {product.approvedBy.firstName}{' '}
                                      {product.approvedBy.lastName} (@
                                      {product.approvedBy.username})
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                      {t('admin-products:approval.approvedOn')}:
                                    </span>{' '}
                                    <span className="font-semibold text-green-800 dark:text-green-300">
                                      {product.approvedAt
                                        ? new Date(
                                            product.approvedAt
                                          ).toLocaleString()
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  {product.approvalReason && (
                                    <div className="col-span-2 rounded-md bg-green-100 p-3 dark:bg-green-900/40">
                                      <span className="font-medium text-green-600 dark:text-green-400">
                                        {t('admin-products:approval.reason')}:
                                      </span>{' '}
                                      <span className="font-medium text-green-800 dark:text-green-300">
                                        {product.approvalReason}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Rejection Information for Rejected Products */}
                          {product.status === 'REJECTED' &&
                            product.rejectedBy && (
                              <div
                                className={`mt-6 rounded-lg border-l-4 border-red-400 bg-red-50 p-4 dark:bg-red-900/20 ${isRTL ? 'border-l-0 border-r-4' : ''}`}
                              >
                                <h4
                                  className={`mb-3 text-sm font-semibold uppercase tracking-wide text-red-800 dark:text-red-300 ${isRTL ? 'text-right' : 'text-left'}`}
                                >
                                  {t('admin-products:rejection.details')}
                                </h4>
                                <div
                                  className={`grid grid-cols-1 gap-4 text-sm md:grid-cols-2 ${isRTL ? 'text-right' : 'text-left'}`}
                                >
                                  <div>
                                    <span className="font-medium text-red-600 dark:text-red-400">
                                      {t('admin-products:rejection.rejectedBy')}
                                      :
                                    </span>{' '}
                                    <span className="font-semibold text-red-800 dark:text-red-300">
                                      {product.rejectedBy.firstName}{' '}
                                      {product.rejectedBy.lastName} (@
                                      {product.rejectedBy.username})
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-red-600 dark:text-red-400">
                                      {t('admin-products:rejection.rejectedOn')}
                                      :
                                    </span>{' '}
                                    <span className="font-semibold text-red-800 dark:text-red-300">
                                      {product.rejectedAt
                                        ? new Date(
                                            product.rejectedAt
                                          ).toLocaleString()
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  {product.approvalReason && (
                                    <div className="col-span-2 rounded-md bg-red-100 p-3 dark:bg-red-900/40">
                                      <span className="font-medium text-red-600 dark:text-red-400">
                                        {t('admin-products:rejection.reason')}:
                                      </span>{' '}
                                      <span className="font-medium text-red-800 dark:text-red-300">
                                        {product.approvalReason}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Action Buttons */}
                          <div
                            className={`mt-8 flex flex-wrap gap-3 border-t border-gray-200 pt-4 dark:border-gray-700 ${isRTL ? 'justify-start' : 'justify-end'}`}
                          >
                            {product.isActive && (
                              <>
                                {/* Approval/Rejection buttons for pending products */}
                                {product.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() =>
                                        openApprovalModal(product, 'approve')
                                      }
                                      disabled={actionLoading}
                                      className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {t('admin-products:actions.approve')}
                                    </button>
                                    <button
                                      onClick={() =>
                                        openApprovalModal(product, 'reject')
                                      }
                                      disabled={actionLoading}
                                      className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {t('admin-products:actions.reject')}
                                    </button>
                                  </>
                                )}
                                {/* Re-approve button for rejected products */}
                                {product.status === 'REJECTED' && (
                                  <button
                                    onClick={() =>
                                      openApprovalModal(product, 'reapprove')
                                    }
                                    disabled={actionLoading}
                                    className="inline-flex items-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {t('admin-products:actions.reapprove')}
                                  </button>
                                )}
                                {/* Visibility toggle - only for approved products */}
                                {product.status === 'APPROVED' && (
                                  <button
                                    onClick={() =>
                                      handleToggleProductVisibility(product.id)
                                    }
                                    disabled={actionLoading}
                                    className={`inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                      product.visible
                                        ? 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                                    }`}
                                  >
                                    {product.visible
                                      ? t('admin-products:actions.hide')
                                      : t('admin-products:actions.show')}
                                  </button>
                                )}
                              </>
                            )}
                            {/* Restore button for deleted products */}
                            {!product.isActive && (
                              <button
                                onClick={() => handleRestoreProduct(product.id)}
                                disabled={actionLoading}
                                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {t('admin-products:actions.restore')}
                              </button>
                            )}
                            {/* Delete button always available for all products */}
                            <button
                              onClick={() => openDeleteProductModal(product)}
                              disabled={actionLoading}
                              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700"
                            >
                              {!product.isActive
                                ? t('admin-products:actions.deletePermanently')
                                : t('admin-products:actions.delete')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}{' '}
          {/* Reviews Tab Content */}{' '}
          {activeTab === 'reviews' && (
            <div className={`space-y-6 ${isRTL ? 'mt-8' : 'mt-6'}`}>
              <div
                className={`rounded-lg bg-white shadow dark:bg-gray-800 ${isRTL ? 'p-8' : 'p-6'}`}
              >
                <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                  {t('admin-common:tabs.reviews')}{' '}
                  {t('admin-common:tabs.moderation')}
                </h2>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                  {t('admin-reviews:description')}
                </p>

                {reviewsLoading ? (
                  <LoadingSpinner text={t('admin-reviews:loading')} />
                ) : reviews.length === 0 ? (
                  <div className="py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 48 48"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      {t('admin-reviews:noReviews')}
                    </h3>{' '}
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('admin-reviews:noReviewsDescription')}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg ${isRTL ? 'mt-8' : 'mt-6'}`}
                  >
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                      {' '}
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th
                            className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {t('admin-reviews:table.review')}
                          </th>
                          <th
                            className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {t('admin-reviews:table.product')}
                          </th>
                          <th
                            className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {t('admin-reviews:table.reviewer')}
                          </th>
                          <th
                            className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {t('admin-reviews:table.visibility')}
                          </th>
                          <th
                            className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {t('admin-reviews:table.actions')}
                          </th>
                        </tr>
                      </thead>{' '}
                      <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {' '}
                        {reviews.map((review) => (
                          <tr key={review.id}>
                            {' '}
                            <td
                              className={`whitespace-nowrap px-6 py-4 ${isRTL ? 'px-8' : 'px-6'}`}
                            >
                              <div
                                className={`flex items-start ${isRTL ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`${isRTL ? 'order-2' : 'order-1'} flex-shrink-0`}
                                >
                                  <div
                                    className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}
                                  >
                                    {[...Array(5)].map((_, i) => (
                                      <svg
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                </div>
                                <div
                                  className={`${isRTL ? 'order-1 mr-4' : 'order-2 ml-4'} min-w-0 flex-1`}
                                >
                                  <div
                                    className={`line-clamp-2 text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
                                  >
                                    {review.comment}
                                  </div>
                                  <div
                                    className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}
                                  >
                                    {new Date(
                                      review.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                </div>{' '}
                              </div>
                            </td>{' '}
                            <td
                              className={`whitespace-nowrap px-6 py-4 ${isRTL ? 'px-8' : 'px-6'}`}
                            >
                              <div
                                className={`text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                {review.product.title}
                              </div>
                              <div
                                className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                {review.product.slug}
                              </div>{' '}
                            </td>{' '}
                            <td
                              className={`whitespace-nowrap px-6 py-4 ${isRTL ? 'px-8' : 'px-6'}`}
                            >
                              <div
                                className={`text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                {review.user.firstName} {review.user.lastName}
                              </div>
                              <div
                                className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                @{review.user.username}
                              </div>{' '}
                            </td>
                            <td
                              className={`whitespace-nowrap px-6 py-4 ${isRTL ? 'px-8' : 'px-6'}`}
                            >
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  review.visible
                                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                    : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                }`}
                              >
                                {review.visible
                                  ? t('admin-reviews:status.visible')
                                  : t('admin-reviews:status.hidden')}{' '}
                              </span>
                            </td>{' '}
                            <td
                              className={`whitespace-nowrap px-6 py-4 text-sm font-medium ${isRTL ? 'px-8' : 'px-6'}`}
                            >
                              <div
                                className={`flex ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'}`}
                              >
                                <button
                                  onClick={() =>
                                    handleToggleReviewVisibility(review.id)
                                  }
                                  disabled={actionLoading}
                                  className={`inline-flex items-center rounded-md border border-transparent px-3 py-1 text-xs font-medium transition-colors ${
                                    review.visible
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700'
                                  } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                  {review.visible
                                    ? t('admin-reviews:actions.hide')
                                    : t('admin-reviews:actions.show')}
                                </button>
                                <button
                                  onClick={() => openDeleteReviewModal(review)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
                                >
                                  {t('admin-reviews:actions.delete')}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}{' '}
          {/* Reports Tab Content */}
          {activeTab === 'reports' && (
            <div className={`space-y-6 ${isRTL ? 'mt-8' : 'mt-6'}`}>
              <div
                className={`rounded-lg bg-white shadow dark:bg-gray-800 ${isRTL ? 'p-8' : 'p-6'}`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t('admin-reports:title')}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin-reports:description')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Search Toggle Button */}
                    <button
                      onClick={() => setShowReportFilters(!showReportFilters)}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <svg
                        className="-ml-1 mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"
                        />
                      </svg>
                      {showReportFilters
                        ? t('admin-reports:search.hide_filters')
                        : t('admin-reports:search.show_filters')}
                    </button>

                    {/* Export Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          // Toggle export dropdown
                          const dropdown =
                            document.getElementById('export-dropdown');
                          if (dropdown) {
                            dropdown.classList.toggle('hidden');
                          }
                        }}
                        disabled={exportLoading}
                        className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg
                          className="-ml-1 mr-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {exportLoading
                          ? t('admin-reports:search.exporting')
                          : t('admin-reports:search.export')}
                      </button>

                      {/* Export Dropdown Menu */}
                      <div
                        id="export-dropdown"
                        className="absolute right-0 mt-2 hidden w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800"
                      >
                        <div className="py-1">
                          <button
                            onClick={() => {
                              exportReportsAsJson();
                              document
                                .getElementById('export-dropdown')
                                ?.classList.add('hidden');
                            }}
                            disabled={exportLoading}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            {t('admin-reports:search.export_json')}
                          </button>
                          <button
                            onClick={() => {
                              exportReportsAsHtml();
                              document
                                .getElementById('export-dropdown')
                                ?.classList.add('hidden');
                            }}
                            disabled={exportLoading}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            {t('admin-reports:search.export_html')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Search Filters */}
                {showReportFilters && (
                  <div className="mb-6 rounded-lg border bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900">
                    <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
                      {t('admin-reports:search.title')}
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-reports:search.status')}
                        </label>
                        <select
                          value={reportFilters.status}
                          onChange={(e) =>
                            setReportFilters({
                              ...reportFilters,
                              status: e.target.value,
                            })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        >
                          {' '}
                          <option value="">
                            {t('admin-reports:search.all_statuses')}
                          </option>
                          <option value="PENDING">
                            {t('admin-reports:status.pending')}
                          </option>
                          <option value="UNDER_REVIEW">
                            {t('admin-reports:status.under_review')}
                          </option>
                          <option value="RESOLVED">
                            {t('admin-reports:status.resolved')}
                          </option>
                          <option value="DISMISSED">
                            {t('admin-reports:status.dismissed')}
                          </option>
                        </select>
                      </div>

                      {/* Type Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-reports:search.type')}
                        </label>
                        <select
                          value={reportFilters.type}
                          onChange={(e) =>
                            setReportFilters({
                              ...reportFilters,
                              type: e.target.value,
                            })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        >
                          <option value="">
                            {t('admin-reports:search.all_types')}
                          </option>
                          <option value="USER">
                            {t('admin-reports:types.user')}
                          </option>
                          <option value="PRODUCT">
                            {t('admin-reports:types.product')}
                          </option>
                          <option value="MESSAGE">
                            {t('admin-reports:types.message')}
                          </option>
                        </select>
                      </div>

                      {/* Reporter Username */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-reports:search.reporter_username')}
                        </label>
                        <input
                          type="text"
                          value={reportFilters.reporterUsername}
                          onChange={(e) =>
                            setReportFilters({
                              ...reportFilters,
                              reporterUsername: e.target.value,
                            })
                          }
                          placeholder={t(
                            'admin-reports:search.placeholder.reporter_username'
                          )}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        />
                      </div>

                      {/* Reporter ID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-reports:search.reporter_id')}
                        </label>
                        <input
                          type="text"
                          value={reportFilters.reporterId}
                          onChange={(e) =>
                            setReportFilters({
                              ...reportFilters,
                              reporterId: e.target.value,
                            })
                          }
                          placeholder={t(
                            'admin-reports:search.placeholder.reporter_id'
                          )}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        />
                      </div>

                      {/* Target Username */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-reports:search.target_username')}
                        </label>
                        <input
                          type="text"
                          value={reportFilters.targetUsername}
                          onChange={(e) =>
                            setReportFilters({
                              ...reportFilters,
                              targetUsername: e.target.value,
                            })
                          }
                          placeholder={t(
                            'admin-reports:search.placeholder.target_username'
                          )}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        />
                      </div>

                      {/* Target ID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-reports:search.target_id')}
                        </label>
                        <input
                          type="text"
                          value={reportFilters.targetId}
                          onChange={(e) =>
                            setReportFilters({
                              ...reportFilters,
                              targetId: e.target.value,
                            })
                          }
                          placeholder={t(
                            'admin-reports:search.placeholder.target_id'
                          )}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        />
                      </div>

                      {/* Reason */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-reports:search.reason')}
                        </label>
                        <input
                          type="text"
                          value={reportFilters.reason}
                          onChange={(e) =>
                            setReportFilters({
                              ...reportFilters,
                              reason: e.target.value,
                            })
                          }
                          placeholder={t(
                            'admin-reports:search.placeholder.reason'
                          )}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        />
                      </div>

                      {/* IP Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-reports:search.ip_address')}
                        </label>
                        <input
                          type="text"
                          value={reportFilters.ipAddress}
                          onChange={(e) =>
                            setReportFilters({
                              ...reportFilters,
                              ipAddress: e.target.value,
                            })
                          }
                          placeholder={t(
                            'admin-reports:search.placeholder.ip_address'
                          )}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        />
                      </div>

                      {/* Date From */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-reports:search.date_from')}
                        </label>
                        <input
                          type="date"
                          value={reportFilters.dateFrom}
                          onChange={(e) =>
                            setReportFilters({
                              ...reportFilters,
                              dateFrom: e.target.value,
                            })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        />
                      </div>

                      {/* Date To */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-reports:search.date_to')}
                        </label>
                        <input
                          type="date"
                          value={reportFilters.dateTo}
                          onChange={(e) =>
                            setReportFilters({
                              ...reportFilters,
                              dateTo: e.target.value,
                            })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        />
                      </div>

                      {/* Resolved By */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-reports:search.resolved_by')}
                        </label>
                        <input
                          type="text"
                          value={reportFilters.resolvedBy}
                          onChange={(e) =>
                            setReportFilters({
                              ...reportFilters,
                              resolvedBy: e.target.value,
                            })
                          }
                          placeholder={t(
                            'admin-reports:search.placeholder.resolved_by'
                          )}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Filter Action Buttons */}
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        onClick={clearReportFilters}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        {t('admin-reports:search.clear_filters')}
                      </button>
                      <button
                        onClick={applyReportFilters}
                        disabled={reportsLoading}
                        className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {reportsLoading ? (
                          <>
                            <svg
                              className="-ml-1 mr-2 h-4 w-4 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            {t('admin-reports:loading')}
                          </>
                        ) : (
                          t('admin-reports:search.apply_filters')
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {reportsLoading ? (
                  <LoadingSpinner text={t('admin-reports:loading')} />
                ) : reports.length === 0 ? (
                  <div className="py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      {t('admin-reports:empty.title')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('admin-reports:empty.description')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Array.isArray(reports) &&
                      reports
                        .sort((a, b) => {
                          // Sort by status: PENDING first, then UNDER_REVIEW, then RESOLVED, then DISMISSED
                          const statusOrder = {
                            PENDING: 0,
                            UNDER_REVIEW: 1,
                            RESOLVED: 2,
                            DISMISSED: 3,
                          };
                          const statusComparison =
                            statusOrder[a.status] - statusOrder[b.status];
                          if (statusComparison !== 0) return statusComparison;

                          // Within same status, sort by creation date (newest first)
                          return (
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                          );
                        })
                        .map((report) => (
                          <div
                            key={report.id}
                            className="rounded-lg border bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900"
                          >
                            {/* Header with basic info */}
                            <div className="mb-4 flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                  <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                      report.type === 'USER'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                                        : report.type === 'PRODUCT'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                          : 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                                    }`}
                                  >
                                    {report.type}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {t('admin-reports:reason')}: {report.reason}
                                  </h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('admin-reports:report_id')}: {report.id}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                {' '}
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    report.status === 'PENDING'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                      : report.status === 'UNDER_REVIEW'
                                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
                                        : report.status === 'RESOLVED'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                          : report.status === 'DISMISSED'
                                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {t(
                                    `admin-reports:status.${report.status.toLowerCase()}`
                                  )}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(report.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {/* Reporter Information */}
                            <div className="mb-4 rounded-lg border bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
                              <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                {t('admin-reports:reporter_info')}
                              </h4>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('admin-reports:reporter_name')}:
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {report.reporterData.firstName}{' '}
                                    {report.reporterData.lastName}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('admin-reports:username')}:
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    @{report.reporterData.username}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('admin-reports:email')}:
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {report.reporterData.email}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('admin-reports:role')}:
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {report.reporterData.role}
                                  </p>
                                </div>
                                {report.ipAddress && (
                                  <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      {t('admin-reports:ip_address')}:
                                    </span>
                                    <p className="font-mono text-sm text-gray-900 dark:text-white">
                                      {report.ipAddress}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Target Information */}
                            <div className="mb-4 rounded-lg border bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
                              <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                {t('admin-reports:target_info')}
                              </h4>

                              {/* User Target */}
                              {report.targetData?.user && (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:target_name')}:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {report.targetData.user.firstName}{' '}
                                        {report.targetData.user.lastName}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:username')}:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        @{report.targetData.user.username}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:email')}:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {report.targetData.user.email}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:account_status')}:
                                      </span>
                                      <p
                                        className={`text-sm font-medium ${
                                          report.targetData.user.isActive
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                        }`}
                                      >
                                        {report.targetData.user.isActive
                                          ? t('admin-reports:active')
                                          : t('admin-reports:inactive')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Product Target */}
                              {report.targetData?.product && (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:product_title')}:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {report.targetData.product.title}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:price')}:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {report.targetData.product.price}{' '}
                                        {report.targetData.product.currency}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:product_owner')}:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {
                                          report.targetData.product.owner
                                            .firstName
                                        }{' '}
                                        {
                                          report.targetData.product.owner
                                            .lastName
                                        }{' '}
                                        (@
                                        {
                                          report.targetData.product.owner
                                            .username
                                        }
                                        )
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:product_status')}:
                                      </span>
                                      <p
                                        className={`text-sm font-medium ${
                                          report.targetData.product.isActive &&
                                          report.targetData.product.visible
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                        }`}
                                      >
                                        {report.targetData.product.isActive &&
                                        report.targetData.product.visible
                                          ? t('admin-reports:visible')
                                          : t('admin-reports:hidden')}
                                      </p>
                                    </div>
                                  </div>
                                  {report.targetData.product.description && (
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:product_description')}
                                        :
                                      </span>
                                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {report.targetData.product.description}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Message Target */}
                              {report.targetData?.message && (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:message_sender')}:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {
                                          report.targetData.message.sender
                                            .firstName
                                        }{' '}
                                        {
                                          report.targetData.message.sender
                                            .lastName
                                        }{' '}
                                        (@
                                        {
                                          report.targetData.message.sender
                                            .username
                                        }
                                        )
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:message_date')}:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {new Date(
                                          report.targetData.message.createdAt
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      {t('admin-reports:message_content')}:
                                    </span>
                                    <div className="mt-1 rounded border bg-gray-100 p-3 dark:bg-gray-700">
                                      <p className="text-sm text-gray-900 dark:text-white">
                                        "{report.targetData.message.content}"
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      {t(
                                        'admin-reports:conversation_participants'
                                      )}
                                      :
                                    </span>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      {report.targetData.message.conversationParticipants
                                        .map(
                                          (p) =>
                                            `${p.firstName} ${p.lastName} (@${p.username})`
                                        )
                                        .join(', ')}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Comment */}
                            {report.comment && (
                              <div className="mb-4 rounded-lg border bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
                                <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                  {t('admin-reports:additional_comment')}
                                </h4>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  "{report.comment}"
                                </p>
                              </div>
                            )}
                            {/* Resolution Info */}
                            {(report.resolvedAt || report.resolvedByData) && (
                              <div className="mb-4 rounded-lg border bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
                                <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                  {t('admin-reports:resolution_info')}
                                </h4>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  {report.resolvedAt && (
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:resolved_at')}:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {new Date(
                                          report.resolvedAt
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                  {report.resolvedByData && (
                                    <div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('admin-reports:resolved_by')}:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {report.resolvedByData.firstName}{' '}
                                        {report.resolvedByData.lastName} (@
                                        {report.resolvedByData.username})
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}{' '}
                            {/* Actions */}
                            <div className="mt-4 flex justify-between">
                              <div className="flex space-x-2">
                                {/* Individual Export Options */}
                                <div className="relative">
                                  <button
                                    onClick={() => {
                                      // Toggle individual export dropdown
                                      const dropdown = document.getElementById(
                                        `export-single-dropdown-${report.id}`
                                      );
                                      if (dropdown) {
                                        dropdown.classList.toggle('hidden');
                                      }
                                    }}
                                    disabled={exportLoading}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                  >
                                    {' '}
                                    <svg
                                      className="-ml-1 mr-1 h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    {t('admin-reports:search.export_single')}
                                  </button>

                                  {/* Individual Export Dropdown Menu */}
                                  <div
                                    id={`export-single-dropdown-${report.id}`}
                                    className="absolute left-0 z-10 mt-2 hidden w-40 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800"
                                  >
                                    <div className="py-1">
                                      <button
                                        onClick={() => {
                                          exportSingleReportAsJson(report.id);
                                          document
                                            .getElementById(
                                              `export-single-dropdown-${report.id}`
                                            )
                                            ?.classList.add('hidden');
                                        }}
                                        disabled={exportLoading}
                                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
                                      >
                                        {t(
                                          'admin-reports:search.export_single_json'
                                        )}
                                      </button>
                                      <button
                                        onClick={() => {
                                          exportSingleReportAsHtml(report.id);
                                          document
                                            .getElementById(
                                              `export-single-dropdown-${report.id}`
                                            )
                                            ?.classList.add('hidden');
                                        }}
                                        disabled={exportLoading}
                                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
                                      >
                                        {t(
                                          'admin-reports:search.export_single_html'
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>{' '}
                              {/* Report Status Actions */}
                              {(report.status === 'PENDING' ||
                                report.status === 'UNDER_REVIEW') && (
                                <div className="flex space-x-3">
                                  {report.status === 'PENDING' && (
                                    <button
                                      onClick={() =>
                                        handleSetUnderReview(report.id)
                                      }
                                      disabled={actionLoading}
                                      className="inline-flex items-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {t('admin-reports:actions.under_review')}
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleResolveReport(report.id)
                                    }
                                    disabled={actionLoading}
                                    className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {t('admin-reports:actions.resolve')}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDismissReport(report.id)
                                    }
                                    disabled={actionLoading}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                  >
                                    {t('admin-reports:actions.dismiss')}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* User Detail Modal */}{' '}
          <UserDetailModal
            isOpen={showDetailModal}
            user={selectedUser}
            onClose={closeDetailModal}
            onRoleChange={(user, newRole) => {
              setSelectedUser(user);
              setNewRole(newRole);
              setShowDetailModal(false);
              setShowRoleModal(true);
            }}
            onDelete={(user) => {
              setSelectedUser(user);
              setShowDetailModal(false);
              setShowDeleteModal(true);
            }}
            onRestore={(user) => {
              setSelectedUser(user);
              setShowDetailModal(false);
              setShowRestoreModal(true);
            }}
            currentUser={user}
            canManageUser={canManageUser}
            canChangeRoleTo={canChangeRoleTo}
            isRTL={isRTL}
          />
        </div>
        {/* Legal Tab Content */}
        {activeTab === 'legal' && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
              <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                      {t('admin-legal:title')}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('admin-legal:description')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-100">
                      {legalDocuments.length}{' '}
                      <span className="hidden sm:inline">
                        {legalDocuments.length === 1 ? 'Document' : 'Documents'}
                      </span>
                      <span className="sm:hidden">
                        {legalDocuments.length === 1 ? 'Doc' : 'Docs'}
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        fetchLegalDocuments();
                        fetchDocumentTypes();
                      }}
                      disabled={legalLoading}
                      className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:px-3"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${legalLoading ? 'animate-spin' : ''}`}
                      />
                      <span className="ml-1 hidden sm:inline">Refresh</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 sm:px-6 sm:py-6">
                {/* Document Editor Controls */}
                <div className="mb-8">
                  <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white sm:mb-6">
                    {t('admin-legal:editor.createNew')}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2">
                      <label
                        htmlFor="document-type"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {t('admin-legal:editor.selectType')}
                      </label>
                      <select
                        id="document-type"
                        value={selectedDocumentType}
                        onChange={(e) =>
                          setSelectedDocumentType(e.target.value)
                        }
                        className="block w-full rounded-lg border-gray-300 bg-white px-4 py-3 text-base shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 sm:text-sm"
                      >
                        <option value="tos">
                          {t('admin-legal:documentTypes.tos')}
                        </option>
                        <option value="privacy">
                          {t('admin-legal:documentTypes.privacy')}
                        </option>
                        <option value="cookies">
                          {t('admin-legal:documentTypes.cookies')}
                        </option>
                        <option value="guidelines">
                          {t('admin-legal:documentTypes.guidelines')}
                        </option>
                        <option value="data">
                          {t('admin-legal:documentTypes.data')}
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="document-language"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {t('admin-legal:editor.selectLanguage')}
                      </label>
                      <select
                        id="document-language"
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 bg-white px-4 py-3 text-base shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 sm:text-sm"
                      >
                        <option value="en">
                          {t('admin-legal:languages.en')}
                        </option>
                        <option value="ar">
                          {t('admin-legal:languages.ar')}
                        </option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() =>
                          openLegalEditor(
                            selectedDocumentType,
                            selectedLanguage
                          )
                        }
                        disabled={legalLoading}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800"
                      >
                        {legalLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <svg
                              className="-ml-1 mr-2 h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            {t('admin-legal:actions.edit')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* URL Info Section */}
                <div className="mb-8">
                  <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                    {t('admin-legal:urlInfo.title')}
                  </h3>
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                    <p className="mb-4 text-sm text-blue-700 dark:text-blue-300">
                      {t('admin-legal:urlInfo.description')}
                    </p>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="font-medium text-blue-800 dark:text-blue-200">
                          {t('admin-legal:urlInfo.baseUrl')}
                        </span>{' '}
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                          {typeof window !== 'undefined' ? window.location.origin : 'https://flipstaq.com'}/legal/
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {['tos', 'privacy', 'cookies', 'guidelines', 'data'].map((type) => (
                          <div
                            key={type}
                            className="flex flex-col space-y-2 rounded-md bg-white p-3 shadow-sm dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
                          >
                            <div className="flex items-center">
                              <div className="mr-3 h-2 w-2 rounded-full bg-green-400"></div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {t(`admin-legal:documentTypes.${type}`)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  /legal/{type}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://flipstaq.com'}/legal/${type}`;
                                  navigator.clipboard.writeText(url);
                                  addToast('success', t('admin-legal:urlInfo.urlCopied'));
                                }}
                                className="flex-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 sm:flex-initial"
                                title={t('admin-legal:urlInfo.copyUrl')}
                              >
                                <div className="flex items-center justify-center">
                                  <svg className="h-3 w-3 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <span className="hidden sm:inline">Copy</span>
                                </div>
                              </button>
                              <button
                                onClick={() => {
                                  window.open(`/legal/${type}`, '_blank');
                                }}
                                className="flex-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:flex-initial"
                                title={t('admin-legal:urlInfo.viewPublic')}
                              >
                                <div className="flex items-center justify-center">
                                  <svg className="h-3 w-3 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  <span className="hidden sm:inline">View</span>
                                </div>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Existing Documents List */}
                {legalDocuments.length > 0 ? (
                  <div>
                    <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                      {t('admin-legal:existing.title')}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th
                              className={`px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                            >
                              {t('admin-legal:table.type')}
                            </th>
                            <th
                              className={`px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                            >
                              {t('admin-legal:table.language')}
                            </th>
                            <th
                              className={`hidden px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 md:table-cell ${isRTL ? 'text-right' : 'text-left'}`}
                            >
                              {t('admin-legal:table.lastUpdated')}
                            </th>
                            <th
                              className={`hidden px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 lg:table-cell ${isRTL ? 'text-right' : 'text-left'}`}
                            >
                              {t('admin-legal:table.updatedBy')}
                            </th>
                            <th
                              className={`px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}
                            >
                              {t('admin-legal:table.actions')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                          {legalDocuments.map((doc) => (
                            <tr
                              key={doc.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <td
                                className={`whitespace-nowrap px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                <div className="flex items-center">
                                  <div className="mr-3 h-2 w-2 rounded-full bg-green-400"></div>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {t(`admin-legal:documentTypes.${doc.type}`)}
                                  </span>
                                </div>
                              </td>
                              <td
                                className={`whitespace-nowrap px-6 py-4 ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                  {t(`admin-legal:languages.${doc.language}`)}
                                </span>
                              </td>
                              <td
                                className={`hidden whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300 md:table-cell ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                <div>
                                  <div className="font-medium">
                                    {new Date(doc.updatedAt).toLocaleDateString(
                                      language === 'ar' ? 'ar-SA' : 'en-US',
                                      {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      }
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {new Date(doc.updatedAt).toLocaleTimeString(
                                      language === 'ar' ? 'ar-SA' : 'en-US',
                                      {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      }
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td
                                className={`hidden whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300 lg:table-cell ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                <div className="flex items-center">
                                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                      {doc.updatedBy
                                        ? `${doc.updatedBy.firstName[0]}${doc.updatedBy.lastName[0]}`
                                        : 'SY'}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {doc.updatedBy
                                        ? `${doc.updatedBy.firstName} ${doc.updatedBy.lastName}`
                                        : 'System'}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {doc.updatedBy?.username || 'system'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td
                                className={`whitespace-nowrap px-6 py-4 text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}
                              >
                                <div
                                  className={`flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 ${isRTL ? 'sm:space-x-3 sm:space-x-reverse' : 'sm:space-x-3'}`}
                                >
                                  <button
                                    onClick={() =>
                                      openLegalEditor(doc.type, doc.language)
                                    }
                                    className="inline-flex items-center justify-center rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800"
                                  >
                                    <svg
                                      className="mr-1 h-3 w-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                    <span className="hidden sm:inline">{t('admin-legal:actions.edit')}</span>
                                    <span className="sm:hidden">Edit</span>
                                  </button>
                                  <button
                                    onClick={() => deleteLegalDocument(doc.id)}
                                    className="inline-flex items-center justify-center rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                                  >
                                    <svg
                                      className="mr-1 h-3 w-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    <span className="hidden sm:inline">{t('admin-legal:actions.delete')}</span>
                                    <span className="sm:hidden">Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  !legalLoading && (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        {t('admin-legal:empty.title')}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t('admin-legal:empty.description')}
                      </p>
                    </div>
                  )
                )}

                {legalLoading && legalDocuments.length === 0 && (
                  <div className="py-12 text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {t('admin-legal:loading')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Legal Editor Modal */}
        {showLegalEditor && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
                onClick={() => {
                  setShowLegalEditor(false);
                  setDocumentContent('');
                  setEditingDocument(null);
                }}
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <div className="inline-block transform overflow-hidden rounded-xl bg-white text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-5xl sm:align-middle">
                {/* Modal Header */}
                <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {t('admin-legal:editor.title')}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {editingDocument
                          ? 'Edit existing legal document'
                          : 'Create a new legal document'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowLegalEditor(false);
                        setDocumentContent('');
                        setEditingDocument(null);
                      }}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="bg-white px-6 py-6 dark:bg-gray-800">
                  <div className="space-y-6">
                    {/* Document Info */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-legal:editor.selectType')}
                        </label>
                        <div className="flex items-center">
                          <div className="mr-3 h-2 w-2 rounded-full bg-blue-500"></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {t(
                              `admin-legal:documentTypes.${selectedDocumentType}`
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('admin-legal:editor.selectLanguage')}
                        </label>
                        <div className="flex items-center">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                            {t(`admin-legal:languages.${selectedLanguage}`)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content Editor */}
                    <div>
                      <label
                        htmlFor="document-content"
                        className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {t('admin-legal:editor.content')}
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          ({documentContent.length} characters)
                        </span>
                      </label>
                      <div className="relative">
                        <textarea
                          id="document-content"
                          value={documentContent}
                          onChange={(e) => setDocumentContent(e.target.value)}
                          placeholder={t(
                            'admin-legal:editor.contentPlaceholder'
                          )}
                          rows={22}
                          className="block w-full rounded-lg border-gray-300 shadow-sm transition-colors focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-400 sm:text-sm"
                          dir={selectedLanguage === 'ar' ? 'rtl' : 'ltr'}
                          style={{ resize: 'vertical', minHeight: '400px' }}
                        />
                        {documentContent.length === 0 && (
                          <div className="absolute bottom-4 left-4 text-xs text-gray-400 dark:text-gray-500">
                            {t('admin-legal:editor.contentPlaceholder')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Metadata */}
                    {editingDocument && (
                      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                        <div className="flex items-start">
                          <svg
                            className="mr-3 mt-0.5 h-5 w-5 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div className="text-sm">
                            <p className="text-blue-800 dark:text-blue-200">
                              <strong>Last updated:</strong>{' '}
                              {new Date(
                                editingDocument.updatedAt
                              ).toLocaleString(
                                language === 'ar' ? 'ar-SA' : 'en-US',
                                {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </p>
                            <p className="mt-1 text-blue-600 dark:text-blue-300">
                              <strong>Updated by:</strong>{' '}
                              {editingDocument.updatedBy
                                ? `${editingDocument.updatedBy.firstName} ${editingDocument.updatedBy.lastName}`
                                : 'System'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={saveLegalDocument}
                    disabled={legalLoading || !documentContent.trim()}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {legalLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">
                          {t('admin-legal:editor.saving')}
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {t('admin-legal:editor.save')}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLegalEditor(false);
                      setDocumentContent('');
                      setEditingDocument(null);
                    }}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-800 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    {t('admin-legal:editor.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Role Change Confirmation Modal */}
        <ConfirmationModal
          isOpen={showRoleModal}
          title={t('admin-users:modals.roleUpdate.title')}
          message={
            selectedUser
              ? t('admin-users:modals.roleUpdate.message')
                  .replace(
                    '{{userName}}',
                    `${selectedUser.firstName} ${selectedUser.lastName}`
                  )
                  .replace(
                    '{{currentRole}}',
                    t(`admin-users:roles.${selectedUser.role}`)
                  )
                  .replace('{{newRole}}', t(`admin-users:roles.${newRole}`))
              : ''
          }
          confirmText={t('admin-users:actions.confirm')}
          cancelText={t('admin-users:actions.cancel')}
          onConfirm={handleRoleChange}
          onCancel={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
          isLoading={actionLoading}
          t={t}
        />{' '}
        {/* Delete User Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          title={t('admin-users:modals.delete.title')}
          message={
            selectedUser
              ? t('admin-users:modals.delete.message').replace(
                  '{{userName}}',
                  `${selectedUser.firstName} ${selectedUser.lastName}`
                )
              : ''
          }
          warning={t('admin-users:modals.delete.warning')}
          confirmText={t('admin-users:actions.delete')}
          cancelText={t('admin-users:actions.cancel')}
          onConfirm={handleDeleteUser}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          isLoading={actionLoading}
          t={t}
        />{' '}
        {/* Restore User Confirmation Modal */}
        <ConfirmationModal
          isOpen={showRestoreModal}
          title={t('admin-users:modals.restore.title')}
          message={
            selectedUser
              ? t('admin-users:modals.restore.message').replace(
                  '{{userName}}',
                  `${selectedUser.firstName} ${selectedUser.lastName}`
                )
              : ''
          }
          confirmText={t('admin-users:actions.restoreUser')}
          cancelText={t('admin-users:actions.cancel')}
          onConfirm={handleRestoreUser}
          onCancel={() => {
            setShowRestoreModal(false);
            setSelectedUser(null);
          }}
          isLoading={actionLoading}
          t={t}
        />
        {/* Delete Product Confirmation Modal */}
        {showDeleteProductModal && selectedProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span
                className="hidden sm:inline-block sm:h-screen sm:align-middle"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pb-4 pt-5 dark:bg-gray-800 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                      <svg
                        className="h-6 w-6 text-red-600 dark:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                        {t('admin-products:modals.delete.title')}
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('admin-products:modals.delete.message')}
                        </p>
                        <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                          {t('admin-products:modals.delete.warning')}
                        </p>
                        <div className="mt-4">
                          <label
                            htmlFor="deletionReason"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {t('admin-products:modals.delete.reasonLabel')}
                          </label>
                          <textarea
                            id="deletionReason"
                            value={deletionReason}
                            onChange={(e) => setDeletionReason(e.target.value)}
                            placeholder={t(
                              'admin-products:modals.delete.reasonPlaceholder'
                            )}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 sm:text-sm"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 dark:bg-gray-700 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(selectedProduct.id)}
                    disabled={actionLoading || !deletionReason.trim()}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {actionLoading
                      ? t('admin-products:actions.submitting')
                      : t('admin-products:actions.delete')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteProductModal(false);
                      setSelectedProduct(null);
                      setDeletionReason('');
                    }}
                    disabled={actionLoading}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-800 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    {t('admin-common:common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Product Approval Modal */}
        {showApprovalModal && selectedProductForApproval && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span
                className="hidden sm:inline-block sm:h-screen sm:align-middle"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pb-4 pt-5 dark:bg-gray-800 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div
                      className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                        approvalAction === 'approve' ||
                        approvalAction === 'reapprove'
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'bg-red-100 dark:bg-red-900'
                      }`}
                    >
                      {approvalAction === 'approve' ||
                      approvalAction === 'reapprove' ? (
                        <svg
                          className="h-6 w-6 text-green-600 dark:text-green-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-6 w-6 text-red-600 dark:text-red-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                        {approvalAction === 'approve'
                          ? t('admin-products:modals.approve.title')
                          : approvalAction === 'reapprove'
                            ? t('admin-products:modals.reapprove.title')
                            : t('admin-products:modals.reject.title')}
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {approvalAction === 'approve'
                            ? t('admin-products:modals.approve.message', {
                                title: selectedProductForApproval.title,
                              })
                            : approvalAction === 'reapprove'
                              ? t('admin-products:modals.reapprove.message', {
                                  title: selectedProductForApproval.title,
                                })
                              : t('admin-products:modals.reject.message', {
                                  title: selectedProductForApproval.title,
                                })}
                        </p>
                        <div className="mt-6">
                          <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {approvalAction === 'approve'
                              ? t('admin-products:modals.approve.reasonLabel')
                              : approvalAction === 'reapprove'
                                ? t(
                                    'admin-products:modals.reapprove.reasonLabel'
                                  )
                                : t('admin-products:modals.reject.reasonLabel')}
                          </label>
                          <textarea
                            value={approvalReason}
                            onChange={(e) => setApprovalReason(e.target.value)}
                            rows={6}
                            className="block w-full rounded-lg border-gray-300 bg-gray-50 p-4 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                            placeholder={
                              approvalAction === 'approve'
                                ? t(
                                    'admin-products:modals.approve.reasonPlaceholder'
                                  )
                                : approvalAction === 'reapprove'
                                  ? t(
                                      'admin-products:modals.reapprove.reasonPlaceholder'
                                    )
                                  : t(
                                      'admin-products:modals.reject.reasonPlaceholder'
                                    )
                            }
                            required={
                              approvalAction === 'reject' ||
                              approvalAction === 'reapprove'
                            }
                          />
                          {(approvalAction === 'reject' ||
                            approvalAction === 'reapprove') && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              * This field is required
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 dark:bg-gray-700 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      (approvalAction === 'reject' && !approvalReason.trim()) ||
                      (approvalAction === 'reapprove' && !approvalReason.trim())
                    }
                    className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm ${
                      approvalAction === 'approve' ||
                      approvalAction === 'reapprove'
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    } disabled:cursor-not-allowed`}
                    onClick={() => {
                      if (
                        approvalAction === 'approve' ||
                        approvalAction === 'reapprove'
                      ) {
                        handleApproveProduct(
                          selectedProductForApproval.id,
                          approvalReason
                        );
                      } else {
                        handleRejectProduct(
                          selectedProductForApproval.id,
                          approvalReason
                        );
                      }
                    }}
                  >
                    {actionLoading
                      ? t('admin-common:common.processing')
                      : approvalAction === 'approve'
                        ? t('admin-products:actions.approve')
                        : approvalAction === 'reapprove'
                          ? t('admin-products:actions.reapprove')
                          : t('admin-products:actions.reject')}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedProductForApproval(null);
                      setApprovalAction(null);
                      setApprovalReason('');
                    }}
                  >
                    {t('admin-common:common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Delete Review Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteReviewModal}
          title={t('admin-reviews:modals.delete.title')}
          message={
            selectedReview ? t('admin-reviews:modals.delete.message') : ''
          }
          warning={t('admin-reviews:modals.delete.warning')}
          confirmText={t('admin-reviews:actions.delete')}
          cancelText={t('admin-common:common.cancel')}
          onConfirm={() =>
            selectedReview && handleDeleteReview(selectedReview.id)
          }
          onCancel={() => {
            setShowDeleteReviewModal(false);
            setSelectedReview(null);
          }}
          isLoading={actionLoading}
          t={t}
        />
      </div>
    </AdminRouteGuard>
  );
}
