'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface GifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGif: (gifUrl: string) => void;
  pickerRef?: React.RefObject<HTMLDivElement>;
}

interface GifResult {
  id: string;
  title: string;
  url: string;
  gifUrl: string;
  tags: string[];
}

export default function GifPicker({
  isOpen,
  onClose,
  onSelectGif,
  pickerRef,
}: GifPickerProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPos, setNextPos] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    } else if (isOpen) {
      loadTrendingGifs();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isOpen]);

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
        limit: '20', // Reduced for inline display
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
    if (nextPos && !loadingMore && searchQuery.trim()) {
      searchGifs(searchQuery, nextPos);
    }
  };

  const handleGifSelect = (gif: GifResult) => {
    onSelectGif(gif.gifUrl);
    onClose();
    setSearchQuery('');
  };

  if (!isOpen) return null;
  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-4 right-4 z-50 mb-2 max-h-96 overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-2xl dark:border-secondary-700 dark:bg-secondary-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-secondary-200 p-4 dark:border-secondary-700">
        <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
          {t('chat:send_gif')}
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-red-600 transition-all duration-200 hover:scale-105 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="border-b border-secondary-200 p-3 dark:border-secondary-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-secondary-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('chat:search_gifs')}
            className="w-full rounded-lg border border-secondary-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto p-3">
        {loading && !loadingMore && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        )}

        {error && (
          <div className="py-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() =>
                searchQuery ? searchGifs(searchQuery) : loadTrendingGifs()
              }
              className="mt-2 rounded-lg bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700"
            >
              {t('common:retry')}
            </button>
          </div>
        )}

        {!loading && !error && gifs.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              {searchQuery
                ? t('chat:no_gifs_found')
                : t('chat:no_trending_gifs')}
            </p>
          </div>
        )}

        {gifs.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
              <div className="mt-3 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingMore && <Loader2 className="h-3 w-3 animate-spin" />}
                  {t('common:load_more')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Info */}
      <div className="border-t border-secondary-200 p-2 dark:border-secondary-700">
        <p className="text-center text-xs text-secondary-500 dark:text-secondary-400">
          {searchQuery
            ? t('chat:search_results_for', { query: searchQuery })
            : t('chat:trending_gifs')}
        </p>
      </div>
    </div>
  );
}
