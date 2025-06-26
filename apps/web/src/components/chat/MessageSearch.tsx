'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MessageCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { messageService } from '@/lib/messageService';
import { Message } from '@/types/chat';

interface MessageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  onMessageSelect: (messageId: string) => void;
}

interface SearchResult extends Omit<Message, 'createdAt'> {
  createdAt: string;
  highlighted?: boolean;
  sender?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export default function MessageSearch({
  isOpen,
  onClose,
  conversationId,
  onMessageSelect,
}: MessageSearchProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [total, setTotal] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timeoutId = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          console.log(
            '🔍 Starting search for:',
            query.trim(),
            'in conversation:',
            conversationId
          );
          const response = await messageService.searchMessages(
            conversationId,
            query.trim()
          );
          console.log('📥 Search response:', response);
          console.log('📊 Messages found:', response.messages?.length || 0);
          console.log('📈 Total count:', response.total);
          setResults(response.messages as SearchResult[]);
          setTotal(response.total);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
          setTotal(0);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setResults([]);
      setTotal(0);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, conversationId]);
  const handleMessageClick = (messageId: string) => {
    onMessageSelect(messageId);
    // Note: Don't call onClose() here - let the parent handle closing the search modal
  };

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.trim()})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === searchQuery.trim().toLowerCase()) {
        return (
          <mark
            key={index}
            className="rounded bg-yellow-200 px-1 dark:bg-yellow-800 dark:text-yellow-100"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  if (!isOpen) return null;  return (
    <div
      data-message-search-modal
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        // Only close search modal if clicking the backdrop, not the chat
        if (e.target === e.currentTarget) {
          e.stopPropagation(); // Prevent event from bubbling to chat drawer
          onClose();
        }
      }}
    >
      <div
        data-message-search-modal
        className="mx-4 w-full max-w-2xl rounded-lg border border-secondary-200 bg-white shadow-xl dark:border-secondary-700 dark:bg-secondary-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary-200 p-4 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            {t('chat:search_messages')}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-700 dark:hover:bg-secondary-700 dark:hover:text-secondary-300"
            title={t('common:close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="border-b border-secondary-200 p-4 dark:border-secondary-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-secondary-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('chat:search_placeholder')}
              className="w-full rounded-lg border border-secondary-200 bg-secondary-50 py-3 pl-10 pr-4 text-secondary-900 placeholder-secondary-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100 dark:placeholder-secondary-400"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              </div>
            )}
          </div>
          {query.trim().length > 0 && query.trim().length < 2 && (
            <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
              {t('chat:search_min_chars')}
            </p>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {query.trim().length >= 2 && !isSearching && results.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageCircle className="mb-4 h-12 w-12 text-secondary-400" />
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {t('chat:no_search_results')}
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              <div className="mb-2 px-2 text-sm text-secondary-500 dark:text-secondary-400">
                {total === 1
                  ? t('chat:search_result_singular', { count: total })
                  : t('chat:search_results_plural', { count: total })}
              </div>
              <div className="space-y-1">
                {results.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleMessageClick(message.id)}
                    className="w-full rounded-lg p-3 text-left transition-colors hover:bg-secondary-50 dark:hover:bg-secondary-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center space-x-2">
                          <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                            {message.sender?.firstName}{' '}
                            {message.sender?.lastName}
                          </span>
                          <span className="text-xs text-secondary-500">
                            @{message.sender?.username}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-sm text-secondary-700 dark:text-secondary-300">
                          {message.content
                            ? highlightText(message.content, query)
                            : t('chat:file_attachment')}
                        </p>
                      </div>
                      <span className="ml-2 flex-shrink-0 text-xs text-secondary-400">
                        {formatDate(new Date(message.createdAt))}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Search className="mb-4 h-12 w-12 text-secondary-400" />
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {t('chat:start_searching')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
