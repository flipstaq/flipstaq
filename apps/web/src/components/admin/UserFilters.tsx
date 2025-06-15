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
  const { t, isRTL } = useLanguage();
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
    <div
      className={`mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800 ${isRTL ? 'rtl' : 'ltr'}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        {' '}
        {/* Search Input */}{' '}
        <div className="relative flex-1">
          <Search
            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`}
          />
          <input
            type="text"
            placeholder={t('admin-users:filters.search.placeholder')}
            value={currentFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={`w-full rounded-md border border-gray-300 py-2 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${isRTL ? 'pl-4 pr-10 text-right' : 'pl-10 pr-4 text-left'}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
        {/* Filter Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
        >
          <Filter className="h-4 w-4" />
          {t('admin-users:filters.role.label')}
        </button>
        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="h-4 w-4" />
            {t('admin-users:filters.clear')}
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-3">
          {' '}
          {/* Role Filter */}{' '}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('admin-users:filters.role.label')}
            </label>{' '}
            <select
              value={currentFilters.role || 'all'}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('admin-users:filters.role.all')}</option>
              <option value="OWNER">
                {t('admin-users:filters.role.owner')}
              </option>
              <option value="HIGHER_STAFF">
                {t('admin-users:filters.role.higherStaff')}
              </option>
              <option value="STAFF">
                {t('admin-users:filters.role.staff')}
              </option>
              <option value="USER">{t('admin-users:filters.role.user')}</option>
            </select>
          </div>
          {/* Status Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('admin-users:filters.status.label')}
            </label>{' '}
            <select
              value={currentFilters.status || 'all'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <option value="all">{t('admin-users:filters.status.all')}</option>
              <option value="ACTIVE">
                {t('admin-users:filters.status.active')}
              </option>
              <option value="INACTIVE">
                {t('admin-users:filters.status.inactive')}
              </option>
              <option value="BANNED">
                {t('admin-users:filters.status.banned')}
              </option>
              <option value="PENDING_VERIFICATION">
                {t('admin-users:filters.status.pendingVerification')}
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
            />{' '}
            <label
              htmlFor="includeDeleted"
              className={`block text-sm text-gray-700 dark:text-gray-300 ${isRTL ? 'mr-2' : 'ml-2'}`}
            >
              {t('admin-users:filters.includeDeleted')}
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
