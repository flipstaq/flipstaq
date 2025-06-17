import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { AdminRouteGuard } from '@/components/providers/AdminRouteGuard';
import { useAuth } from '@/components/providers/AuthProvider';
import { userApi } from '@/lib/api/users';
import { adminApi, ProductForAdmin, ReviewForAdmin } from '@/lib/api/admin';
import { UserInfo, User, PaginatedUsersResponse, UserRole } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
  const [activeTab, setActiveTab] = useState<'users' | 'products' | 'reviews'>(
    'users'
  ); // Products state
  const [products, setProducts] = useState<ProductForAdmin[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductForAdmin | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewForAdmin[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewForAdmin | null>(
    null
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);

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
  }; // Product management functions
  const fetchProducts = async () => {
    try {
      console.log('Fetching admin products...');
      setProductsLoading(true);
      const response = await adminApi.getAllProducts();
      console.log('Admin products response:', response);
      setProducts(response);
    } catch (error) {
      console.error('Error fetching products:', error);
      addToast('error', 'Failed to fetch products');
    } finally {
      setProductsLoading(false);
    }
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
      await adminApi.deleteProductPermanently(productId);
      addToast('success', 'Product deleted permanently');
      await fetchProducts();
      setShowDeleteProductModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      addToast('error', 'Failed to delete product');
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
  };

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab]);

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
                <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                  {t('admin-common:header.title')}
                </h1>
              </div>{' '}
              <div
                className={`flex items-center ${isRTL ? 'space-x-4 space-x-reverse' : 'space-x-4'}`}
              >
                {/* Language Switcher */}
                <div className="flex items-center">
                  <button
                    onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    {language === 'en' ? '🇸🇦 AR' : '🇺🇸 EN'}
                  </button>
                </div>{' '}
                <span className="hidden text-sm text-gray-600 dark:text-gray-400 sm:block">
                  {t('admin-common:header.welcome', {
                    firstName: user?.firstName,
                    lastName: user?.lastName,
                  })}
                </span>{' '}
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  {t(`admin-users:roles.${user?.role}`)}
                </span>
              </div>
            </div>{' '}
          </div>
        </div>        {/* Tab Navigation */}
        <div className="bg-white shadow dark:bg-gray-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className={`flex ${isRTL ? 'space-x-reverse space-x-8' : 'space-x-8'}`} dir={isRTL ? 'rtl' : 'ltr'}>
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
                {t('admin-common:tabs.users')}
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
                    {t('admin-common:tabs.products')}
                  </button>

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
                    {t('admin-common:tabs.reviews')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>{' '}
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <>
              {/* Stats Cards */}
              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:gap-6">
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
            </>
          )}
          {/* Products Tab Content */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                  {t('admin-common:tabs.products')}{' '}
                  {t('admin-common:tabs.moderation')}
                </h2>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                  {t('admin-products:description')}
                </p>

                {productsLoading ? (
                  <LoadingSpinner text={t('admin-products:loading')} />
                ) : products.length === 0 ? (
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
                      {t('admin-products:noProducts')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('admin-products:noProductsDescription')}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('admin-products:table.product')}
                          </th>
                          <th className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('admin-products:table.seller')}
                          </th>
                          <th className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('admin-products:table.visibility')}
                          </th>
                          <th className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('admin-products:table.actions')}
                          </th>
                        </tr>
                      </thead>{' '}
                      <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {products.map((product) => (
                          <tr key={product.id}>                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  {product.imageUrl ? (
                                    <img
                                      className="h-10 w-10 rounded-lg object-cover"
                                      src={product.imageUrl}
                                      alt={product.title}
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-300 dark:bg-gray-600">
                                      <svg
                                        className="h-6 w-6 text-gray-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </div>                                <div className={isRTL ? 'mr-4' : 'ml-4'}>
                                  <div className={`text-sm font-medium text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {product.title}
                                  </div>
                                  <div className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {product.slug}
                                  </div>
                                </div>
                              </div>
                            </td>                            <td className="whitespace-nowrap px-6 py-4">
                              <div className={`text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                                @{product.username}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  product.visible
                                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                    : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                }`}
                              >
                                {product.visible
                                  ? t('admin-products:status.visible')
                                  : t('admin-products:status.hidden')}
                              </span>
                            </td>                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                              <div className={`flex ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                                <button
                                  onClick={() =>
                                    handleToggleProductVisibility(product.id)
                                  }
                                  disabled={actionLoading}
                                  className={`inline-flex items-center rounded-md border border-transparent px-3 py-1 text-xs font-medium transition-colors ${
                                    product.visible
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700'
                                  } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                  {product.visible
                                    ? t('admin-products:actions.hide')
                                    : t('admin-products:actions.show')}
                                </button>
                                <button
                                  onClick={() =>
                                    openDeleteProductModal(product)
                                  }
                                  disabled={actionLoading}
                                  className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
                                >
                                  {t('admin-products:actions.delete')}
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
          )}
          {/* Reviews Tab Content */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
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
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('admin-reviews:noReviewsDescription')}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('admin-reviews:table.review')}
                          </th>
                          <th className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('admin-reviews:table.product')}
                          </th>
                          <th className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('admin-reviews:table.reviewer')}
                          </th>
                          <th className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('admin-reviews:table.visibility')}
                          </th>
                          <th className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('admin-reviews:table.actions')}
                          </th>
                        </tr>
                      </thead>{' '}
                      <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {reviews.map((review) => (
                          <tr key={review.id}>                            <td className="whitespace-nowrap px-6 py-4">
                              <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <div className="flex-shrink-0">
                                  <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
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
                                <div className={isRTL ? 'mr-4' : 'ml-4'}>
                                  <div className={`line-clamp-2 text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {review.comment}
                                  </div>
                                  <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {new Date(
                                      review.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </td>                            <td className="whitespace-nowrap px-6 py-4">
                              <div className={`text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                                {review.product.title}
                              </div>
                              <div className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {review.product.slug}
                              </div>
                            </td>                            <td className="whitespace-nowrap px-6 py-4">
                              <div className={`text-sm text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                                {review.user.firstName} {review.user.lastName}
                              </div>
                              <div className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                                @{review.user.username}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  review.visible
                                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                    : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                }`}
                              >
                                {review.visible
                                  ? t('admin-reviews:status.visible')
                                  : t('admin-reviews:status.hidden')}
                              </span>
                            </td>                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                              <div className={`flex ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
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
        </div>{' '}
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
        <ConfirmationModal
          isOpen={showDeleteProductModal}
          title={t('admin-products:modals.delete.title')}
          message={
            selectedProduct ? t('admin-products:modals.delete.message') : ''
          }
          warning={t('admin-products:modals.delete.warning')}
          confirmText={t('admin-products:actions.delete')}
          cancelText={t('admin-common:common.cancel')}
          onConfirm={() =>
            selectedProduct && handleDeleteProduct(selectedProduct.id)
          }
          onCancel={() => {
            setShowDeleteProductModal(false);
            setSelectedProduct(null);
          }}
          isLoading={actionLoading}
          t={t}
        />
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
