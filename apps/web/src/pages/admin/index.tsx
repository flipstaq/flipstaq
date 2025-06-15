import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { AdminRouteGuard } from '@/components/providers/AdminRouteGuard';
import { useAuth } from '@/components/providers/AuthProvider';
import { userApi } from '@/lib/api/users';
import { UserInfo, User, PaginatedUsersResponse, UserRole } from '@/types';

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
            <button
              type="button"
              disabled={isLoading}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onConfirm}
            >
              {isLoading ? 'Processing...' : confirmText}
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
}) => {
  const { t } = useTranslation('admin');

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
                </div>
                <div className="ml-4">
                  <h3
                    className={`text-lg font-medium leading-6 ${
                      isDeleted
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {user.firstName} {user.lastName}
                    {isDeleted && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
                        Deleted
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
                  <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Full Name
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Email
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {user.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Username
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        @{user.username}
                      </p>
                    </div>
                    {user.dateOfBirth && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                          Date of Birth
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {formatDate(user.dateOfBirth)}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Country
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {user.country}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                    Account Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Role
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
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </label>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isDeleted
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          }`}
                        >
                          {isDeleted ? 'Deleted' : 'Active'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Date Joined
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Last Updated
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatDate(user.updatedAt)}
                      </p>
                    </div>{' '}
                    {user.deletedAt && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('users.modals.userDetail.deletedAt')}
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
                                {t('users.modals.userDetail.deletedBy')}
                              </label>
                              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {user.deletedBy.firstName}{' '}
                                {user.deletedBy.lastName} (
                                {user.deletedBy.role.replace('_', ' ')})
                              </p>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Role Management - Only for active users */}
              {!isDeleted && canManageUser(user) && user.role !== 'OWNER' && (
                <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                  <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                    Role Management
                  </h4>
                  <div className="flex items-center space-x-3">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Change Role:
                    </label>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(e.target.value as UserRole)
                      }
                      className="rounded border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="USER">User</option>
                      <option value="STAFF">Staff</option>
                      {canChangeRoleTo(user, 'HIGHER_STAFF') && (
                        <option value="HIGHER_STAFF">Higher Staff</option>
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-4 py-3 dark:bg-gray-700 sm:flex sm:flex-row-reverse sm:px-6">
            <div className="flex space-x-3">
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
                  Restore User
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
                    Delete User
                  </button>
                )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Close
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
  const { t } = useTranslation('admin');
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
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
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
      return 'Deleted';
    }
    return 'Active';
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
      addToast('error', 'Failed to load full user details');
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

      addToast(
        'success',
        `User role updated successfully to ${newRole.replace('_', ' ')}`
      );
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update user role';
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
        `User ${selectedUser.firstName} ${selectedUser.lastName} has been deleted successfully`
      );
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete user';
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
        `User ${selectedUser.firstName} ${selectedUser.lastName} has been restored successfully`
      );
      setShowRestoreModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error restoring user:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to restore user';
      setError(errorMessage);
      addToast('error', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };
  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        {/* Header */}
        <div className="bg-white shadow dark:bg-gray-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                  FlipStaq Admin Panel
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="hidden text-sm text-gray-600 dark:text-gray-400 sm:block">
                  Welcome, {user?.firstName} {user?.lastName}
                </span>
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-8 sm:px-6 lg:px-8">
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
                  </div>
                  <div className="ml-3 w-0 flex-1 sm:ml-5">
                    <dl>
                      <dt className="truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                        Total Users
                      </dt>
                      <dd className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                        {stats.total}
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
                  </div>
                  <div className="ml-3 w-0 flex-1 sm:ml-5">
                    <dl>
                      <dt className="truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                        Owners
                      </dt>
                      <dd className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                        {stats.owners}
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
                  </div>
                  <div className="ml-3 w-0 flex-1 sm:ml-5">
                    <dl>
                      <dt className="truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                        Staff
                      </dt>
                      <dd className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                        {stats.staff}
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
                  </div>
                  <div className="ml-3 w-0 flex-1 sm:ml-5">
                    <dl>
                      <dt className="truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                        Regular Users
                      </dt>
                      <dd className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                        {stats.users}
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
                  </div>
                  <div className="ml-3 w-0 flex-1 sm:ml-5">
                    <dl>
                      <dt className="truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
                        Active Users
                      </dt>
                      <dd className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                        {stats.active}
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
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
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
                      placeholder="Search by name, email, or username..."
                      className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 leading-5 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>{' '}
                </div>
                {/* View Mode Toggle - Only for OWNER and HIGHER_STAFF */}
                {(user?.role === 'OWNER' || user?.role === 'HIGHER_STAFF') && (
                  <div className="sm:w-48 lg:w-56">
                    <label htmlFor="viewMode" className="sr-only">
                      View mode
                    </label>
                    <select
                      id="viewMode"
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      value={viewMode}
                      onChange={(e) =>
                        setViewMode(e.target.value as 'active' | 'deleted')
                      }
                    >
                      <option value="active">Active Users</option>
                      <option value="deleted">Deleted Users</option>
                    </select>
                  </div>
                )}
                <div className="sm:w-48 lg:w-56">
                  <label htmlFor="role" className="sr-only">
                    Filter by role
                  </label>
                  <select
                    id="role"
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="ALL">All Roles</option>
                    <option value="OWNER">Owners</option>
                    <option value="HIGHER_STAFF">Higher Staff</option>
                    <option value="STAFF">Staff</option>
                    <option value="USER">Users</option>
                  </select>
                </div>
                <button
                  onClick={fetchUsers}
                  className="inline-flex items-center rounded-lg border border-transparent bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
            <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
              <h3 className="text-lg font-bold leading-6 text-gray-900 dark:text-white sm:text-xl">
                Registered Users ({filteredUsers.length})
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage and view all registered users in the system
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
                  <span className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                    Loading users...
                  </span>
                </div>
              </div>
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
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Try Again
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
                </svg>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  No users found
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {searchTerm || selectedRole !== 'ALL'
                    ? 'Try adjusting your filters'
                    : 'No users have been registered yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        User
                      </th>
                      <th className="hidden px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:table-cell">
                        Role
                      </th>
                      <th className="hidden px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 md:table-cell">
                        Status
                      </th>
                      <th className="hidden px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 lg:table-cell">
                        Country
                      </th>
                      <th className="hidden px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 lg:table-cell">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Actions
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
                          <td className="whitespace-nowrap px-6 py-4">
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
                              <div className="ml-4">
                                <div
                                  className={`text-sm font-semibold ${
                                    isDeleted
                                      ? 'text-gray-500 dark:text-gray-400'
                                      : 'text-gray-900 dark:text-white'
                                  }`}
                                >
                                  {tableUser.firstName} {tableUser.lastName}
                                  {isDeleted && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
                                      Deleted
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
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getRoleBadgeColor(tableUser.role)}`}
                                  >
                                    {tableUser.role.replace('_', ' ')}
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
                          <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(tableUser.role)}`}
                            >
                              {tableUser.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="hidden whitespace-nowrap px-6 py-4 md:table-cell">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(tableUser.isActive, isDeleted)}`}
                            >
                              {getStatusText(tableUser.isActive, isDeleted)}
                            </span>
                          </td>
                          <td
                            className={`hidden whitespace-nowrap px-6 py-4 text-sm font-medium lg:table-cell ${
                              isDeleted
                                ? 'text-gray-500 dark:text-gray-400'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {tableUser.country}
                          </td>
                          <td
                            className={`hidden whitespace-nowrap px-6 py-4 text-sm lg:table-cell ${
                              isDeleted
                                ? 'text-gray-400 dark:text-gray-500'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {new Date(tableUser.createdAt).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </td>{' '}
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
                              {/* View Details Button - Always available */}
                              <button
                                onClick={() => openDetailModal(tableUser)}
                                className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                title="View Details"
                              >
                                View
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
                                    <option value="USER">User</option>
                                    <option value="STAFF">Staff</option>
                                    {canChangeRoleTo(
                                      tableUser,
                                      'HIGHER_STAFF'
                                    ) && (
                                      <option value="HIGHER_STAFF">
                                        Higher Staff
                                      </option>
                                    )}
                                  </select>
                                )}

                              {/* Delete Button - Only for active users */}
                              {viewMode === 'active' &&
                                canManageUser(tableUser) &&
                                tableUser.id !== user?.id && (
                                  <button
                                    onClick={() => openDeleteModal(tableUser)}
                                    className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                    title="Delete User"
                                  >
                                    Delete
                                  </button>
                                )}
                              {/* Restore Button - Only for deleted users */}
                              {viewMode === 'deleted' &&
                                canManageUser(tableUser) && (
                                  <button
                                    onClick={() => openRestoreModal(tableUser)}
                                    className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                                    title="Restore User"
                                  >
                                    Restore
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
            )}
          </div>
        </div>{' '}
        {/* User Detail Modal */}
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
        />
      </div>

      {/* Role Change Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRoleModal}
        title="Update User Role"
        message={
          selectedUser
            ? `Are you sure you want to change ${selectedUser.firstName} ${selectedUser.lastName}'s role from ${selectedUser.role.replace('_', ' ')} to ${newRole.replace('_', ' ')}?`
            : ''
        }
        confirmText="Update Role"
        cancelText="Cancel"
        onConfirm={handleRoleChange}
        onCancel={() => {
          setShowRoleModal(false);
          setSelectedUser(null);
        }}
        isLoading={actionLoading}
      />

      {/* Delete User Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete User"
        message={
          selectedUser
            ? `Are you sure you want to delete ${selectedUser.firstName} ${selectedUser.lastName}?`
            : ''
        }
        warning="This will permanently disable the user account and they will no longer be able to access the platform."
        confirmText="Delete User"
        cancelText="Cancel"
        onConfirm={handleDeleteUser}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        isLoading={actionLoading}
      />

      {/* Restore User Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRestoreModal}
        title="Restore User"
        message={
          selectedUser
            ? `Are you sure you want to restore ${selectedUser.firstName} ${selectedUser.lastName}'s account?`
            : ''
        }
        confirmText="Restore User"
        cancelText="Cancel"
        onConfirm={handleRestoreUser}
        onCancel={() => {
          setShowRestoreModal(false);
          setSelectedUser(null);
        }}
        isLoading={actionLoading}
      />
    </AdminRouteGuard>
  );
}
