'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, User, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useUserOnlineStatus } from '@/contexts/WebSocketContext';
import { userService, User as UserType } from '@/lib/userService';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (participant: UserParticipant) => void;
}

interface UserParticipant {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isOnline: boolean;
}

export default function NewChatModal({
  isOpen,
  onClose,
  onStartConversation,
}: NewChatModalProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null); // Convert API user to UserParticipant
  const convertToUserParticipant = (user: UserType): UserParticipant => ({
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    isOnline: false, // Online status will be managed by WebSocket context
  });
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      setSearchResults([]);
      setError(null);
      setShowDirectMessage(false);
    }
  }, [isOpen]);
  useEffect(() => {
    const trimmedQuery = searchQuery.trim().replace('@', ''); // Remove @ symbol if present

    if (trimmedQuery.length >= 2) {
      setIsLoading(true);
      setError(null);

      // Debounce search
      const timeoutId = setTimeout(async () => {
        try {
          const users = await userService.searchUsers(trimmedQuery, 10);
          const participants = users.map(convertToUserParticipant);
          setSearchResults(participants);
          setShowDirectMessage(false);
        } catch (err) {
          console.error('Search error:', err);
          if (
            err instanceof Error &&
            err.message.includes('Insufficient permissions')
          ) {
            // For regular users who can't search, show direct username input
            setShowDirectMessage(true);
            setError(null);
          } else {
            setError(
              err instanceof Error
                ? err.message.includes(
                    'Search query must be at least 2 characters'
                  )
                  ? t('chat:search_hint_min_chars')
                  : err.message.includes('Search failed')
                    ? t('chat:search_failed')
                    : err.message
                : t('chat:search_failed')
            );
            setShowDirectMessage(false);
          }
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setError(null);
      setIsLoading(false);
      setShowDirectMessage(false);
      // Show hint if user has typed 1 character but needs at least 2
      if (trimmedQuery.length === 1) {
        setError(t('chat:search_hint_min_chars'));
      }
    }
  }, [searchQuery]);
  const handleUserSelect = (user: UserParticipant) => {
    onStartConversation(user);
    setSearchQuery('');
  };

  const handleDirectMessage = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      const username = searchQuery.trim().replace('@', '');

      // Create a basic user participant for the direct message
      const participant: UserParticipant = {
        id: 'temp-' + Date.now(), // Temporary ID
        username,
        firstName: username, // We don't know the real name yet
        lastName: '',
        isOnline: false,
      };

      await onStartConversation(participant);
    } catch (error) {
      console.error('Error starting direct conversation:', error);
      setError(t('chat:user_not_found'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="z-60 fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl bg-white shadow-2xl dark:bg-secondary-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary-200 p-6 dark:border-secondary-700">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            {t('chat:new_chat')}
          </h2>{' '}
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-red-600 transition-all duration-200 hover:scale-105 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>{' '}
        {/* Search */}
        <div className="border-b border-secondary-200 p-6 dark:border-secondary-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-secondary-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('chat:search_users')}
              className={`w-full rounded-lg border py-3 pl-10 pr-4 text-secondary-900 placeholder-secondary-500 transition-colors focus:border-transparent focus:outline-none focus:ring-2 dark:text-secondary-100 ${
                error && error.includes('2 characters')
                  ? 'border-yellow-300 bg-yellow-50 focus:ring-yellow-500 dark:border-yellow-600 dark:bg-yellow-900/20'
                  : error
                    ? 'border-red-300 bg-red-50 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/20'
                    : 'border-secondary-200 bg-secondary-50 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-800'
              }`}
            />
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  {2 - searchQuery.trim().length} more
                </span>
              </div>
            )}
          </div>
          {error && error.includes('2 characters') && (
            <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
              {error}
            </p>
          )}
        </div>{' '}
        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <User className="mb-3 h-12 w-12 text-red-400" />
              <p className="mb-2 font-medium text-red-500">{error}</p>
              {error.includes('Authentication') && (
                <p className="text-xs text-secondary-400">
                  Please log in to search for users
                </p>
              )}
              {error.includes('permissions') && (
                <p className="text-xs text-secondary-400">
                  Contact support if you need access to search users
                </p>
              )}
            </div>
          ) : showDirectMessage ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <User className="mb-3 h-12 w-12 text-primary-600" />
              <p className="mb-4 text-secondary-700 dark:text-secondary-300">
                Enter a username to start messaging
              </p>
              <p className="mb-6 text-sm text-secondary-500">
                Type the exact @username (e.g., @yourscemal) and click "Start
                Chat"
              </p>
              <button
                onClick={handleDirectMessage}
                disabled={!searchQuery.trim() || isLoading}
                className={`rounded-lg px-6 py-3 font-medium transition-colors ${
                  searchQuery.trim() && !isLoading
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'cursor-not-allowed bg-secondary-200 text-secondary-400 dark:bg-secondary-700'
                }`}
              >
                {isLoading ? 'Starting Chat...' : 'Start Chat'}
              </button>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <User className="mb-3 h-12 w-12 text-secondary-400" />
              <p className="mb-2 text-secondary-500">
                {searchQuery
                  ? `No users found for "${searchQuery}"`
                  : 'Start typing to search for users'}
              </p>
              {searchQuery && (
                <p className="text-xs text-secondary-400">
                  Try searching with @username or full name
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {searchResults.map((user) => (
                <UserSearchResult
                  key={user.id}
                  user={user}
                  onSelect={handleUserSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component to handle individual user results with WebSocket online status
function UserSearchResult({
  user,
  onSelect,
}: {
  user: UserParticipant;
  onSelect: (user: UserParticipant) => void;
}) {
  const { t } = useLanguage();
  const isOnline = useUserOnlineStatus(user.id);

  return (
    <button
      onClick={() => onSelect(user)}
      className="w-full p-4 text-left transition-colors duration-200 hover:bg-secondary-50 focus:bg-secondary-50 focus:outline-none dark:hover:bg-secondary-800 dark:focus:bg-secondary-800"
    >
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          {/* Online indicator with real WebSocket status */}
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-secondary-900">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-75"></div>
            </div>
          )}
        </div>

        {/* User info */}
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-secondary-900 dark:text-secondary-100">
            {user.firstName} {user.lastName}
          </h4>
          <p className="truncate text-xs text-secondary-500">
            @{user.username}
          </p>
          <p className="text-xs text-secondary-400">
            {isOnline ? t('common:online') : t('common:offline')}
          </p>
        </div>
      </div>
    </button>
  );
}
