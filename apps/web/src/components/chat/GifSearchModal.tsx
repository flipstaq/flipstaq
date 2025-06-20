'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface GifSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGif: (gifUrl: string) => void;
}

interface GifResult {
  id: string;
  title: string;
  url: string;
  gifUrl: string;
  tags: string[];
}

export default function GifSearchModal({
  isOpen,
  onClose,
  onSelectGif,
}: GifSearchModalProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPos, setNextPos] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load trending GIFs on mount
  useEffect(() => {
    if (isOpen) {
      loadTrendingGifs();
    }
  }, [isOpen]);

  // Auto-search as user types
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchGifs(searchQuery);
      }, 500);
    } else {
      loadTrendingGifs();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle modal click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const loadTrendingGifs = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';
      const response = await fetch(`${apiBaseUrl}/api/v1/gifs/trending`);
      if (!response.ok) {
        throw new Error('Failed to load trending GIFs');
      }

      const data = await response.json();
      setGifs(data.results);
      setNextPos(data.next);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load GIFs');
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (query: string, pos?: string) => {
    const isLoadMore = !!pos;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setError(null);
    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';
      const params = new URLSearchParams({
        q: query,
        limit: '25',
        ...(pos && { pos }),
      });

      const response = await fetch(
        `${apiBaseUrl}/api/v1/gifs/search?${params}`
      );
      if (!response.ok) {
        throw new Error('Failed to search GIFs');
      }

      const data = await response.json();

      if (isLoadMore) {
        setGifs((prev) => [...prev, ...data.results]);
      } else {
        setGifs(data.results);
      }

      setNextPos(data.next);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to search GIFs'
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (nextPos && !loadingMore) {
      if (searchQuery.trim()) {
        searchGifs(searchQuery, nextPos);
      } else {
        // For trending, we'd need to implement pagination
        // For now, just don't show load more for trending
      }
    }
  };

  const handleGifSelect = (gif: GifResult) => {
    onSelectGif(gif.gifUrl);
    onClose();
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="mx-4 max-h-[80vh] w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-secondary-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary-200 p-6 dark:border-secondary-700">
          {' '}
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            {t('chat:send_gif')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700 dark:hover:bg-secondary-700 dark:hover:text-secondary-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-secondary-200 p-6 dark:border-secondary-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-secondary-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('chat:search_gifs')}
              className="w-full rounded-xl border border-secondary-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
            />
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto p-6">
          {loading && !loadingMore && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          )}

          {error && (
            <div className="py-12 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() =>
                  searchQuery ? searchGifs(searchQuery) : loadTrendingGifs()
                }
                className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              >
                {t('common:retry')}
              </button>
            </div>
          )}

          {!loading && !error && gifs.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-secondary-500 dark:text-secondary-400">
                {searchQuery
                  ? t('chat:no_gifs_found')
                  : t('chat:no_trending_gifs')}
              </p>
            </div>
          )}

          {gifs.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => handleGifSelect(gif)}
                    className="group relative aspect-square overflow-hidden rounded-lg border-2 border-transparent transition-all duration-200 hover:border-primary-500 focus:border-primary-500 focus:outline-none"
                  >
                    <img
                      src={gif.gifUrl}
                      alt={gif.title}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-20" />
                  </button>
                ))}
              </div>

              {/* Load More */}
              {nextPos && searchQuery.trim() && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="mx-auto flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingMore && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {t('common:load_more')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <div className="border-t border-secondary-200 p-4 dark:border-secondary-700">
          <p className="text-center text-sm text-secondary-500 dark:text-secondary-400">
            {' '}
            {searchQuery
              ? t('chat:search_results_for', { query: searchQuery })
              : t('chat:trending_gifs')}
          </p>
        </div>
      </div>
    </div>
  );
}
