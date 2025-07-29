import React from 'react';
import Avatar from '@/components/ui/Avatar';
import { User } from '@/types';

interface UserCardProps {
  user: User;
  onClick?: () => void;
  showStatus?: boolean;
}

export default function UserCard({
  user,
  onClick,
  showStatus = false,
}: UserCardProps) {
  return (
    <div
      className={`
        flex items-center space-x-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800
        ${onClick ? 'cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
      `}
      onClick={onClick}
    >
      {/* User Avatar */}
      <Avatar
        src={user.avatarUrl}
        alt={`${user.firstName} ${user.lastName}`}
        size="lg"
        showHoverEffect={!!onClick}
      />

      {/* User Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center space-x-2">
          <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
            {user.firstName} {user.lastName}
          </h3>
          {showStatus && (
            <div
              className={`
                h-3 w-3 rounded-full
                ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}
              `}
            />
          )}
        </div>
        <p className="truncate text-sm text-gray-600 dark:text-gray-400">
          @{user.username}
        </p>
        <p className="truncate text-sm text-gray-500 dark:text-gray-500">
          {user.email}
        </p>
      </div>

      {/* User Role Badge */}
      <div className="flex-shrink-0">
        <span
          className={`
            inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
            ${
              user.role === 'OWNER'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                : user.role === 'HIGHER_STAFF'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : user.role === 'STAFF'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }
          `}
        >
          {user.role}
        </span>
      </div>
    </div>
  );
}
