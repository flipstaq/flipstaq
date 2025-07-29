'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  Download,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Message, Conversation } from '@/types/chat';
import ProductCoverAttachment from './ProductCoverAttachment';
import MessageContextMenu from './MessageContextMenu';
import EditableMessage from './EditableMessage';
import MessageReactions from './MessageReactions';
import EmojiReactionButton from './EmojiReactionButton';
import Avatar from '@/components/ui/Avatar';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  onRetryMessage?: (message: Message) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReply?: (message: Message) => void;
  onMessageUpdate?: (
    messageId: string,
    updatedMessage: Partial<Message>
  ) => void;
  onLoadOlderMessages?: () => void;
  hasMoreMessages?: boolean;
  isLoadingOlder?: boolean;
  highlightedMessageId?: string | null;
  conversation?: Conversation;
}

export default function MessageList({
  messages,
  currentUserId,
  isLoading,
  onRetryMessage,
  onDeleteMessage,
  onReply,
  onMessageUpdate,
  onLoadOlderMessages,
  hasMoreMessages = false,
  isLoadingOlder = false,
  highlightedMessageId,
  conversation,
}: MessageListProps) {
  const { t } = useLanguage();
  const { editMessage, onMessageReaction } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [emojiPickerMessageId, setEmojiPickerMessageId] = useState<
    string | null
  >(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to reaction events for real-time updates
  useEffect(() => {
    const unsubscribe = onMessageReaction((reactionEvent) => {
      if (onMessageUpdate) {
        // Get current message to update reactions
        const currentMessage = messages.find(
          (m) => m.id === reactionEvent.messageId
        );
        if (currentMessage) {
          const currentReactions = currentMessage.reactions || [];
          let updatedReactions;

          if (reactionEvent.action === 'added' && reactionEvent.reaction) {
            // Add the new reaction
            updatedReactions = [...currentReactions, reactionEvent.reaction];
          } else if (reactionEvent.action === 'removed') {
            // Remove the reaction
            updatedReactions = currentReactions.filter(
              (r) =>
                !(
                  r.userId === reactionEvent.userId &&
                  r.emoji === reactionEvent.emoji
                )
            );
          } else {
            updatedReactions = currentReactions;
          }

          onMessageUpdate(reactionEvent.messageId, {
            reactions: updatedReactions,
          });
        }
      }
    });

    return unsubscribe;
  }, [onMessageReaction, onMessageUpdate, messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const shouldShowDateSeparator = (
    currentMessage: Message,
    previousMessage?: Message
  ) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();

    return currentDate !== previousDate;
  };
  const getStatusIcon = (status: Message['status'], message?: Message) => {
    const handleRetryClick = () => {
      if (message && onRetryMessage) {
        onRetryMessage(message);
      }
    };

    switch (status) {
      case 'sending':
        return (
          <div title={t('chat:message_sending')} className="flex items-center">
            <Clock className="h-3 w-3 text-secondary-400" />
          </div>
        );
      case 'sent':
        return (
          <div title={t('chat:message_sent')} className="flex items-center">
            <Check className="h-3 w-3 text-secondary-500" />
          </div>
        );
      case 'delivered':
        return (
          <div
            title={t('chat:message_delivered')}
            className="flex items-center"
          >
            <CheckCheck className="h-3 w-3 text-secondary-500" />
          </div>
        );
      case 'read':
        return (
          <div title={t('chat:message_read')} className="flex items-center">
            <CheckCheck className="h-3 w-3 text-primary-600 dark:text-primary-400" />
          </div>
        );
      case 'failed':
        return (
          <div
            title={t('chat:message_failed')}
            onClick={handleRetryClick}
            className="group flex cursor-pointer items-center"
          >
            <AlertCircle className="h-3 w-3 text-red-500 transition-colors group-hover:text-red-600" />
          </div>
        );
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };
  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');

    // Handle external URLs (like Tenor GIFs) vs internal uploads
    if (fileUrl.startsWith('http')) {
      link.href = fileUrl;
    } else {
      link.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'}${fileUrl}`;
    }

    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditMessage = (messageId: string) => {
    setEditingMessageId(messageId);
  };
  const handleSaveEdit = async (messageId: string, newContent: string) => {
    try {
      const message = messages.find((m) => m.id === messageId);
      if (!message) {
        throw new Error('Message not found');
      }
      // Send edit via WebSocket (non-blocking)
      editMessage(messageId, newContent, message.conversationId);
      setEditingMessageId(null);
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  };
  const handleCancelEdit = () => {
    setEditingMessageId(null);
  };
  const handleReactToMessage = (messageId: string) => {
    setEmojiPickerMessageId(messageId);
  };
  if (isLoading) {
    return (
      <div className="from-secondary-25 dark:from-secondary-850 flex flex-1 items-center justify-center bg-gradient-to-b to-secondary-50 dark:to-secondary-900">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-12 w-12">
            <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 dark:border-primary-800"></div>
            <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-t-4 border-primary-600 dark:border-primary-400"></div>
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="from-secondary-25 dark:from-secondary-850 flex flex-1 items-center justify-center bg-gradient-to-b to-secondary-50 px-4 text-center dark:to-secondary-900">
        <div className="max-w-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800">
            <svg
              className="h-10 w-10 text-primary-600 dark:text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            {t('chat:start_conversation')}
          </h3>
          <p className="text-sm leading-relaxed text-secondary-500 dark:text-secondary-400">
            {t('chat:type_message')}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div
      ref={messagesContainerRef}
      className="from-secondary-25 dark:from-secondary-850 h-full overflow-y-auto bg-gradient-to-b to-secondary-50 dark:to-secondary-900"
    >
      {/* Loading older messages indicator */}
      {isLoadingOlder && (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
            <span className="text-sm text-secondary-600 dark:text-secondary-400">
              {t('chat:loading_older_messages')}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2 p-4">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId;
          const previousMessage = index > 0 ? messages[index - 1] : undefined;
          const nextMessage =
            index < messages.length - 1 ? messages[index + 1] : undefined;
          const showDateSeparator = shouldShowDateSeparator(
            message,
            previousMessage
          );

          // Check if messages are grouped (same sender, within 5 minutes)
          const isPreviousMessageFromSameSender =
            previousMessage &&
            previousMessage.senderId === message.senderId &&
            message.createdAt.getTime() - previousMessage.createdAt.getTime() <
              300000; // 5 minutes

          const isNextMessageFromSameSender =
            nextMessage &&
            nextMessage.senderId === message.senderId &&
            nextMessage.createdAt.getTime() - message.createdAt.getTime() <
              300000; // 5 minutes

          return (
            <div key={message.id}>
              {/* Date Separator */}
              {showDateSeparator && (
                <div className="my-6 flex items-center justify-center">
                  <div className="rounded-full border border-secondary-200 bg-white px-4 py-2 shadow-sm dark:border-secondary-700 dark:bg-secondary-800">
                    <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                </div>
              )}
              {/* Message */}{' '}
              <div
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                  isPreviousMessageFromSameSender ? 'mb-1' : 'mb-3'
                }`}
                id={`message-${message.id}`}
              >
                {/* User Avatar for incoming messages */}
                {!isOwnMessage && conversation && (
                  <div
                    className={`mr-3 flex-shrink-0 ${isPreviousMessageFromSameSender ? 'invisible' : ''}`}
                  >
                    <Avatar
                      src={conversation.participant.avatar}
                      size="sm"
                      alt={`${conversation.participant.firstName} ${conversation.participant.lastName}`}
                    />
                  </div>
                )}

                <div
                  className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}
                >
                  {' '}
                  <div
                    className={`group relative px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                      // Add highlighting effect when message is highlighted
                      highlightedMessageId === message.id
                        ? 'shadow-lg ring-2 ring-yellow-400 ring-opacity-75'
                        : ''
                    } ${
                      isOwnMessage
                        ? `bg-gradient-to-r from-primary-600 to-primary-700 text-white ${
                            isPreviousMessageFromSameSender &&
                            isNextMessageFromSameSender
                              ? 'rounded-2xl rounded-br-md'
                              : isPreviousMessageFromSameSender
                                ? 'rounded-2xl rounded-br-sm'
                                : isNextMessageFromSameSender
                                  ? 'rounded-2xl rounded-br-md'
                                  : 'rounded-2xl rounded-br-sm'
                          }`
                        : `border border-secondary-200 bg-white text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-100 ${
                            isPreviousMessageFromSameSender &&
                            isNextMessageFromSameSender
                              ? 'rounded-2xl rounded-bl-md'
                              : isPreviousMessageFromSameSender
                                ? 'rounded-2xl rounded-bl-sm'
                                : isNextMessageFromSameSender
                                  ? 'rounded-2xl rounded-bl-md'
                                  : 'rounded-2xl rounded-bl-sm'
                          }`
                    }`}
                  >
                    {' '}
                    {/* File attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mb-2 space-y-2">
                        {' '}
                        {/* Product Cover attachments */}
                        {message.attachments
                          .filter(
                            (att) => att.metadata?.type === 'product-cover'
                          )
                          .map((attachment, index) => (
                            <ProductCoverAttachment
                              key={`product-cover-${index}`}
                              metadata={attachment.metadata!}
                            />
                          ))}
                        {/* Image attachments grid */}
                        {message.attachments.filter(
                          (att) =>
                            isImageFile(att.fileType) &&
                            att.metadata?.type !== 'product-cover'
                        ).length > 0 && (
                          <div
                            className={`grid gap-2 ${
                              message.attachments.filter(
                                (att) =>
                                  isImageFile(att.fileType) &&
                                  att.metadata?.type !== 'product-cover'
                              ).length === 1
                                ? 'grid-cols-1'
                                : message.attachments.filter(
                                      (att) =>
                                        isImageFile(att.fileType) &&
                                        att.metadata?.type !== 'product-cover'
                                    ).length === 2
                                  ? 'grid-cols-2'
                                  : 'grid-cols-2 sm:grid-cols-3'
                            }`}
                          >
                            {message.attachments
                              .filter(
                                (att) =>
                                  isImageFile(att.fileType) &&
                                  att.metadata?.type !== 'product-cover'
                              )
                              .map((attachment, index) => (
                                <div
                                  key={`${attachment.fileUrl}-${index}`}
                                  className="relative overflow-hidden rounded-lg"
                                >
                                  {' '}
                                  <img
                                    src={
                                      attachment.fileUrl.startsWith('http')
                                        ? attachment.fileUrl
                                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'}${attachment.fileUrl}`
                                    }
                                    alt={attachment.fileName || 'Image'}
                                    className="h-32 w-full cursor-pointer object-cover transition-transform hover:scale-105"
                                    onClick={() =>
                                      handleFileDownload(
                                        attachment.fileUrl,
                                        attachment.fileName || 'image'
                                      )
                                    }
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                                    <ExternalLink className="h-4 w-4 text-white" />
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}{' '}
                        {/* Document attachments */}
                        {message.attachments
                          .filter(
                            (att) =>
                              !isImageFile(att.fileType) &&
                              att.metadata?.type !== 'product-cover'
                          )
                          .map((attachment, index) => (
                            <div
                              key={`${attachment.fileUrl}-${index}`}
                              className="flex cursor-pointer items-center space-x-3 rounded-lg border border-white/20 bg-white/10 p-3 transition-colors hover:bg-white/20 rtl:space-x-reverse"
                              onClick={() =>
                                handleFileDownload(
                                  attachment.fileUrl,
                                  attachment.fileName || 'file'
                                )
                              }
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                                {getFileIcon(attachment.fileType)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {attachment.fileName || t('chat:file_name')}
                                </p>
                                <p className="text-xs opacity-75">
                                  {formatFileSize(attachment.fileSize)}
                                </p>
                              </div>
                              <Download className="h-4 w-4 opacity-75" />
                            </div>
                          ))}
                      </div>
                    )}{' '}
                    {/* Reply preview */}
                    {message.replyToMessage && (
                      <div
                        className={`mb-2 cursor-pointer rounded-lg border-l-4 p-2 transition-colors hover:bg-black/5 ${
                          isOwnMessage
                            ? 'border-white/40 bg-white/10 text-white/80'
                            : 'border-primary-400 bg-primary-50 text-primary-800 dark:border-primary-500 dark:bg-primary-900/20 dark:text-primary-200'
                        }`}
                        onClick={() => {
                          // Scroll to original message
                          const originalElement = document.getElementById(
                            `message-${message.replyToMessage!.id}`
                          );
                          if (originalElement) {
                            originalElement.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center',
                            });
                            // Add highlight effect
                            originalElement.classList.add('animate-pulse');
                            setTimeout(
                              () =>
                                originalElement.classList.remove(
                                  'animate-pulse'
                                ),
                              2000
                            );
                          }
                        }}
                      >
                        <div className="mb-1 text-xs font-medium opacity-80">
                          {t('chat:replied_to')} @
                          {message.replyToMessage.senderUsername}
                        </div>
                        <div className="line-clamp-2 text-xs opacity-70">
                          {message.replyToMessage.content ||
                            t('chat:file_attachment')}
                        </div>
                      </div>
                    )}{' '}
                    {/* Text content */}
                    {message.content && (
                      <div className="relative">
                        <EditableMessage
                          messageId={message.id}
                          initialContent={message.content}
                          isEditing={editingMessageId === message.id}
                          onSave={handleSaveEdit}
                          onCancel={handleCancelEdit}
                        />
                        {/* Show edited label */}
                        {message.editedAt && (
                          <span className="mt-1 text-xs opacity-60">
                            {t('chat:edited')}
                          </span>
                        )}
                      </div>
                    )}{' '}
                    {/* Message Reactions - Display existing reactions only */}
                    <MessageReactions
                      messageId={message.id}
                      reactions={message.reactions}
                      currentUserId={currentUserId}
                      showReactionButton={false}
                      showEmojiPicker={false}
                    />
                    {/* Hover Actions - Context Menu and Emoji Reaction */}
                    <div className="absolute right-1 top-1 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <EmojiReactionButton
                        messageId={message.id}
                        className="opacity-0 group-hover:opacity-100"
                        isVisible={emojiPickerMessageId === message.id}
                        onVisibilityChange={(visible) => {
                          setEmojiPickerMessageId(visible ? message.id : null);
                        }}
                      />
                      <MessageContextMenu
                        messageId={message.id}
                        senderId={message.senderId}
                        content={message.content}
                        createdAt={message.createdAt}
                        editedAt={message.editedAt}
                        isOwnMessage={isOwnMessage}
                        onDelete={() => onDeleteMessage?.(message.id)}
                        onEdit={() => handleEditMessage(message.id)}
                        onReply={() => onReply?.(message)}
                        onReact={() => handleReactToMessage(message.id)}
                      />
                    </div>
                    {/* Hover timestamp for grouped messages */}
                    {isPreviousMessageFromSameSender && (
                      <div className="absolute -top-6 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <span className="rounded bg-white px-2 py-1 text-xs text-secondary-400 shadow-sm dark:bg-secondary-800">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Message info - only show for last message in group or standalone messages */}
                  {!isNextMessageFromSameSender && (
                    <div
                      className={`mt-1 flex items-center space-x-1 rtl:space-x-reverse ${
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span className="text-xs font-medium text-secondary-400">
                        {formatTime(message.createdAt)}
                      </span>{' '}
                      {isOwnMessage && (
                        <div className="ml-1">
                          {getStatusIcon(message.status, message)}
                        </div>
                      )}
                    </div>
                  )}{' '}
                </div>
              </div>{' '}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
