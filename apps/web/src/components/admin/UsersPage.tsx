import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserTable } from '@/components/admin/UserTable';
import { UserFilters } from '@/components/admin/UserFilters';
import { Pagination } from '@/components/admin/Pagination';
import { useUsers } from '@/hooks/useUsers';
import { User, UsersQueryParams } from '@/types';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

  const { users, loading, error, pagination, updateParams, deleteUser } =
    useUsers({
      initialParams: {
        page: 1,
        limit: 10,
      },
    });

  const handleFiltersChange = (newFilters: Partial<UsersQueryParams>) => {
    updateParams(newFilters);
  };

  const handlePageChange = (page: number) => {
    updateParams({ page });
  };

  const handleUserAction = async (
    action: 'view' | 'edit' | 'delete',
    user: User
  ) => {
    switch (action) {
      case 'view':
        // TODO: Implement user details modal/page
        console.log('View user:', user);
        break;
      case 'edit':
        // TODO: Implement user edit modal/page
        console.log('Edit user:', user);
        break;
      case 'delete':
        setDeleteConfirm(user);
        break;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteUser(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      // TODO: Show error notification
    }
  };

  // Build current filters object for the filters component
  const currentFilters: UsersQueryParams = {
    page: pagination?.page || 1,
    limit: pagination?.limit || 10,
    role: undefined, // These would come from URL params or state
    status: undefined,
    search: undefined,
    includeDeleted: false,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {' '}
        {/* Page Header */}{' '}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin-users:title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t('admin-users:description')}
          </p>
        </div>
        {/* Filters */}
        <UserFilters
          onFiltersChange={handleFiltersChange}
          currentFilters={currentFilters}
        />
        {/* Users Table */}
        <UserTable
          users={users}
          loading={loading}
          error={error}
          onUserAction={handleUserAction}
        />
        {/* Pagination */}
        {pagination && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />
        )}
        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
            <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg dark:bg-gray-800">
              {' '}
              <div className="mt-3 text-center">
                {' '}
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('admin-users:confirmDelete.title')}
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('admin-users:confirmDelete.message')}
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {deleteConfirm.firstName} {deleteConfirm.lastName} (
                    {deleteConfirm.email})
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 rounded-md bg-gray-300 px-4 py-2 text-base font-medium text-gray-800 shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                    >
                      {' '}
                      {t('admin-users:confirmDelete.cancel')}
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      className="flex-1 rounded-md bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {t('admin-users:confirmDelete.confirm')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
