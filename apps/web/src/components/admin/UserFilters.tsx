import React, { useState } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { UserRole, UserStatus, UsersQueryParams } from '@/types';
import { Search, Filter, X } from 'lucide-react';

interface UserFiltersProps {
  onFiltersChange: (filters: Partial<UsersQueryParams>) => void;
  currentFilters: UsersQueryParams;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  onFiltersChange,
  currentFilters,
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value || undefined, page: 1 });
  };

  const handleRoleChange = (value: string) => {
    onFiltersChange({
      role: value === 'all' ? undefined : (value as UserRole),
      page: 1,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      status: value === 'all' ? undefined : (value as UserStatus),
      page: 1,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: undefined,
      role: undefined,
      status: undefined,
      page: 1,
    });
  };

  const hasActiveFilters = !!(
    currentFilters.search ||
    currentFilters.role ||
    currentFilters.status
  );

  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Search Input */}{' '}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder={t('filters.search.placeholder', 'admin-users')}
            value={currentFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        {/* Filter Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
        >
          <Filter className="h-4 w-4" />
          {t('filters.role.label', 'admin-users')}
        </button>
        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-3">
          {/* Role Filter */}{' '}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('filters.role.label', 'admin-users')}
            </label>
            <select
              value={currentFilters.role || 'all'}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">
                {t('filters.role.all', 'admin-users')}
              </option>
              <option value="OWNER">
                {t('filters.role.owner', 'admin-users')}
              </option>
              <option value="HIGHER_STAFF">
                {t('filters.role.higherStaff', 'admin-users')}
              </option>
              <option value="STAFF">
                {t('filters.role.staff', 'admin-users')}
              </option>
              <option value="USER">
                {t('filters.role.user', 'admin-users')}
              </option>
            </select>
          </div>
          {/* Status Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('filters.status.label', 'admin-users')}
            </label>
            <select
              value={currentFilters.status || 'all'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">
                {t('filters.status.all', 'admin-users')}
              </option>
              <option value="ACTIVE">
                {t('filters.status.active', 'admin-users')}
              </option>
              <option value="INACTIVE">
                {t('filters.status.inactive', 'admin-users')}
              </option>
              <option value="BANNED">
                {t('filters.status.banned', 'admin-users')}
              </option>
              <option value="PENDING_VERIFICATION">
                {t('filters.status.pendingVerification', 'admin-users')}
              </option>
            </select>
          </div>
          {/* Include Deleted */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeDeleted"
              checked={currentFilters.includeDeleted || false}
              onChange={(e) =>
                onFiltersChange({
                  includeDeleted: e.target.checked || undefined,
                  page: 1,
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <label
              htmlFor="includeDeleted"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              Include deleted users
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
