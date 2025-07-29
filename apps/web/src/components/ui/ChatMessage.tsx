import React from 'react';
import Avatar from '@/components/ui/Avatar';
import { User } from '@/types';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    timestamp: Date;
    user: User;
    edited?: boolean;
  };
  isOwnMessage?: boolean;
  showAvatar?: boolean;
}

export default function ChatMessage({
  message,
  isOwnMessage = false,
  showAvatar = true,
}: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar */}
        {showAvatar && !isOwnMessage && (
          <div className="mr-3 flex-shrink-0">
            <Avatar
              src={message.user.avatarUrl}
              alt={`${message.user.firstName} ${message.user.lastName}`}
              size="sm"
            />
          </div>
        )}

        {/* Message Content */}
        <div
          className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
        >
          {/* User Name & Timestamp */}
          {!isOwnMessage && (
            <div className="mb-1 flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {message.user.firstName} {message.user.lastName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(message.timestamp)}
              </span>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`
              relative max-w-full break-words rounded-lg px-4 py-2
              ${
                isOwnMessage
                  ? 'rounded-br-sm bg-blue-500 text-white'
                  : 'rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
              }
            `}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>

            {/* Own message timestamp */}
            {isOwnMessage && (
              <div className="mt-1 flex items-center justify-end space-x-1">
                {message.edited && (
                  <span className="text-xs text-blue-200">edited</span>
                )}
                <span className="text-xs text-blue-200">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            )}
          </div>

          {/* Edit indicator for other users */}
          {!isOwnMessage && message.edited && (
            <span className="mt-1 text-xs text-gray-400">edited</span>
          )}
        </div>

        {/* Own message avatar */}
        {showAvatar && isOwnMessage && (
          <div className="ml-3 flex-shrink-0">
            <Avatar
              src={message.user.avatarUrl}
              alt={`${message.user.firstName} ${message.user.lastName}`}
              size="sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
