'use client';

import React from 'react';
import { User, Circle } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useUserOnlineStatus, useWebSocket } from '@/contexts/WebSocketContext';
import { Conversation } from '@/types/chat';

interface ConversationListProps {
  conversations: Conversation[];
  onConversationSelect: (conversation: Conversation) => void;
  isLoading: boolean;
  selectedConversationId?: string;
}

export default function ConversationList({
  conversations,
  onConversationSelect,
  isLoading,
  selectedConversationId,
}: ConversationListProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { typingUsers, onlineUsers } = useWebSocket();

  // Get typing users for a specific conversation (excluding current user)
  const getTypingUsersForConversation = (conversationId: string) => {
    return Array.from(typingUsers.values())
      .filter(
        (typing) =>
          typing.conversationId === conversationId &&
          typing.isTyping &&
          typing.userId !== user?.id // Exclude current user
      )
      .map((typing) => typing.username);
  };

  // Get online status for a user
  const getUserOnlineStatus = (userId: string) => {
    return onlineUsers.get(userId)?.isOnline ?? false;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };
  const truncateMessage = (
    message: string | null | undefined,
    maxLength: number = 50
  ) => {
    if (!message) return t('chat:file_attachment');
    return message.length > maxLength
      ? `${message.substring(0, maxLength)}...`
      : message;
  };
  if (isLoading) {
    return (
      <div className="from-secondary-25 dark:to-secondary-850 flex h-64 items-center justify-center bg-gradient-to-b to-secondary-50 dark:from-secondary-800">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-10 w-10">
            <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-4 border-primary-200 dark:border-primary-800"></div>
            <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-t-4 border-primary-600 dark:border-primary-400"></div>
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Loading conversations...
          </p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="from-secondary-25 dark:to-secondary-850 flex h-64 flex-col items-center justify-center bg-gradient-to-b to-secondary-50 px-4 text-center dark:from-secondary-800">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800">
          <User className="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          {t('chat:no_conversations')}
        </h3>
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          {t('chat:start_conversation')}
        </p>
      </div>
    );
  }
  return (
    <div className="to-secondary-25 dark:to-secondary-850 h-full overflow-y-auto bg-gradient-to-b from-white dark:from-secondary-800">
      <div className="divide-y divide-secondary-100 dark:divide-secondary-700">
        {' '}
        {conversations.map((conversation) => {
          // Get real online status from WebSocket
          const isOnline = getUserOnlineStatus(conversation.participant.id);

          return (
            <button
              key={conversation.id}
              onClick={() => onConversationSelect(conversation)}
              className={`group w-full p-4 text-left transition-all duration-200 focus:outline-none ${
                selectedConversationId === conversation.id
                  ? 'from-primary-25 border-r-4 border-primary-500 bg-gradient-to-r to-primary-50 shadow-lg dark:border-primary-400 dark:from-primary-900/30 dark:to-primary-900/20'
                  : getTypingUsersForConversation(conversation.id).length > 0
                    ? 'from-blue-25 border-l-2 border-blue-400 bg-gradient-to-r to-blue-50 dark:border-blue-500 dark:from-blue-900/20 dark:to-blue-900/10'
                    : 'hover:from-secondary-25 focus:from-secondary-25 dark:hover:from-secondary-750 dark:focus:from-secondary-750 hover:bg-gradient-to-r hover:to-secondary-50 hover:shadow-md focus:bg-gradient-to-r focus:to-secondary-50 dark:hover:to-secondary-800 dark:focus:to-secondary-800'
              }`}
            >
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 group-hover:scale-105 ${
                      conversation.participant.avatar
                        ? 'bg-transparent'
                        : 'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800'
                    }`}
                  >
                    {conversation.participant.avatar ? (
                      <img
                        src={conversation.participant.avatar}
                        alt={`${conversation.participant.firstName} ${conversation.participant.lastName}`}
                        className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-secondary-700"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  {/* Enhanced online indicator with real WebSocket status */}
                  <div
                    className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white transition-all duration-200 dark:border-secondary-800 ${
                      isOnline
                        ? 'bg-green-500 shadow-lg shadow-green-500/50'
                        : 'bg-secondary-400'
                    }`}
                  >
                    {isOnline && (
                      <div className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-75"></div>
                    )}
                  </div>{' '}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <h4 className="truncate text-sm font-semibold text-secondary-900 transition-colors group-hover:text-primary-600 dark:text-secondary-100 dark:group-hover:text-primary-400">
                      {conversation.participant.firstName}{' '}
                      {conversation.participant.lastName}
                    </h4>
                    <div className="flex flex-shrink-0 items-center space-x-2 rtl:space-x-reverse">
                      {conversation.lastMessage && (
                        <span className="text-xs font-medium text-secondary-500 dark:text-secondary-400">
                          {formatTime(conversation.lastMessage.createdAt)}
                        </span>
                      )}
                      {conversation.unreadCount > 0 && (
                        <div className="flex h-5 min-w-[20px] animate-pulse items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-1.5 text-xs font-bold text-white shadow-lg">
                          {conversation.unreadCount > 99
                            ? '99+'
                            : conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>{' '}
                  {/* Show typing indicator or last message */}
                  {(() => {
                    const typingUsersInConv = getTypingUsersForConversation(
                      conversation.id
                    );
                    if (typingUsersInConv.length > 0) {
                      return (
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500"
                              style={{ animationDelay: '0ms' }}
                            ></div>
                            <div
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500"
                              style={{ animationDelay: '150ms' }}
                            ></div>
                            <div
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500"
                              style={{ animationDelay: '300ms' }}
                            ></div>
                          </div>{' '}
                          <span className="text-sm font-medium italic text-primary-600 dark:text-primary-400">
                            {typingUsersInConv.length === 1
                              ? `${typingUsersInConv[0]} is typing...`
                              : `${typingUsersInConv.length} people are typing...`}
                          </span>
                        </div>
                      );
                    } else if (conversation.lastMessage) {
                      return (
                        <p
                          className={`truncate text-sm leading-relaxed ${
                            conversation.unreadCount > 0
                              ? 'font-medium text-secondary-900 dark:text-secondary-100'
                              : 'text-secondary-600 dark:text-secondary-400'
                          }`}
                        >
                          {truncateMessage(conversation.lastMessage.content)}
                        </p>
                      );
                    }
                    return null;
                  })()}
                  <p className="mt-1 text-xs font-medium text-secondary-400 dark:text-secondary-500">
                    @{conversation.participant.username}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
