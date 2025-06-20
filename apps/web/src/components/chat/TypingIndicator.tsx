'use client';

import React from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface TypingIndicatorProps {
  usernames: string[];
  className?: string;
}

export default function TypingIndicator({
  usernames,
  className = '',
}: TypingIndicatorProps) {
  const { t } = useLanguage();
  if (usernames.length === 0) {
    return null;
  }

  console.log('Rendering TypingIndicator with users:', usernames); // Debug log

  const getTypingText = () => {
    if (usernames.length === 1) {
      return t('chat.typing.single', { username: usernames[0] });
    } else if (usernames.length === 2) {
      return t('chat.typing.two', {
        username1: usernames[0],
        username2: usernames[1],
      });
    } else {
      return t('chat.typing.multiple', {
        count: usernames.length,
      });
    }
  };
  return (
    <div
      className={`mx-4 mb-2 flex items-center space-x-3 rounded-lg border border-secondary-200 bg-white px-4 py-3 shadow-sm dark:border-secondary-600 dark:bg-secondary-800 ${className}`}
    >
      <div className="flex space-x-1">
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-primary-500"
          style={{ animationDelay: '0ms' }}
        ></div>
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-primary-500"
          style={{ animationDelay: '150ms' }}
        ></div>
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-primary-500"
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
      <span className="text-sm font-medium italic text-secondary-700 dark:text-secondary-200">
        {getTypingText()}
      </span>
    </div>
  );
}
