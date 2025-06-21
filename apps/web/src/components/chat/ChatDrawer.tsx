'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  Send,
  User,
  Search,
  Plus,
  ArrowLeft,
  MoreVertical,
  Circle,
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useWebSocket } from '@/contexts/WebSocketContext';
import {
  messageService,
  Conversation as ApiConversation,
  Message as ApiMessage,
} from '@/lib/messageService';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { userService, User as UserType } from '@/lib/userService';
import { Conversation, Message } from '@/types/chat';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  startConversationWith?: {
    userId: string;
    username: string;
    firstName: string;
    lastName: string;
  } | null;
}

// Convert API conversation to local format
const convertApiConversation = (
  apiConv: ApiConversation,
  currentUserId: string
): Conversation => {
  const otherParticipant = apiConv.participants.find(
    (p) => p.id !== currentUserId
  );
  if (!otherParticipant) {
    throw new Error('No other participant found in conversation');
  }
  return {
    id: apiConv.id,
    participant: {
      id: otherParticipant.id,
      username: otherParticipant.username,
      firstName: otherParticipant.firstName,
      lastName: otherParticipant.lastName,
      isOnline: otherParticipant.isOnline || false,
      lastSeen: otherParticipant.lastSeen
        ? new Date(otherParticipant.lastSeen)
        : undefined,
    },
    lastMessage: apiConv.lastMessage
      ? {
          ...apiConv.lastMessage,
          createdAt: new Date(apiConv.lastMessage.createdAt),
        }
      : undefined,
    unreadCount: apiConv.unreadCount,
    updatedAt: new Date(apiConv.updatedAt),
  };
};

// Convert API message to local format
const convertApiMessage = (apiMsg: ApiMessage): Message => ({
  ...apiMsg,
  createdAt: new Date(apiMsg.createdAt),
  status: apiMsg.isRead ? 'read' : 'delivered',
});

export default function ChatDrawer({
  isOpen,
  onClose,
  startConversationWith,
}: ChatDrawerProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const {
    connect,
    isConnected,
    joinConversation,
    leaveConversation,
    onNewMessage,
    onMessageReadStatusChanged,
    onConversationReadStatusChanged,
    typingUsers,
  } = useWebSocket();

  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isNewChatMode, setIsNewChatMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<Date | null>(
    null
  );

  // Remove polling interval ref since we're using WebSocket only
  // const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const selectedConversationRef = useRef<Conversation | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Update refs when state changes
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // WebSocket connection and real-time message handling
  useEffect(() => {
    if (isOpen && user?.id) {
      // Ensure WebSocket connection
      if (!isConnected) {
        connect();
      }

      // Set up real-time message handler
      const unsubscribeNewMessage = onNewMessage((newMessage) => {
        console.log('📨 Received new message via WebSocket:', newMessage);

        // Skip if this is our own message (we already handle it in the send function)
        if (newMessage.senderId === user?.id) {
          console.log('🔄 Skipping own message from WebSocket');
          return;
        } // Add the message to the current conversation if it matches
        if (selectedConversationRef.current?.id === newMessage.conversationId) {
          setMessages((prevMessages) => {
            // Avoid duplicates by checking if message already exists
            const existingMessage = prevMessages.find(
              (m) => m.id === newMessage.id
            );
            if (existingMessage) {
              console.log(
                '🔄 Message already exists, skipping:',
                newMessage.id
              );
              return prevMessages;
            }

            console.log(
              '✅ Adding new message to conversation:',
              newMessage.id
            );
            const convertedMessage: Message = {
              id: newMessage.id,
              content: newMessage.content,
              senderId: newMessage.senderId,
              conversationId: newMessage.conversationId,
              createdAt: new Date(newMessage.createdAt),
              isRead: false,
              status: 'delivered',
              attachments: newMessage.attachments || [],
            };
            return [...prevMessages, convertedMessage];
          }); // Auto-mark the message as read since the conversation is currently active
          // This ensures the sender sees the blue checkmark immediately
          // Only auto-mark if the document is visible (user is actively viewing the page)
          setTimeout(async () => {
            try {
              if (!document.hidden) {
                await messageService.markConversationAsRead(
                  newMessage.conversationId
                );
                console.log(
                  '✅ Auto-marked new message as read in active conversation'
                );
              } else {
                console.log('📱 Document hidden, not auto-marking as read');
              }
            } catch (error) {
              console.error('Failed to auto-mark message as read:', error);
            }
          }, 100); // Small delay to ensure the message is processed
        }

        // Update conversation list to reflect new message
        setConversations((prevConversations) => {
          return prevConversations.map((conv) => {
            if (conv.id === newMessage.conversationId) {
              return {
                ...conv,
                lastMessage: {
                  id: newMessage.id,
                  content: newMessage.content || undefined,
                  senderId: newMessage.senderId,
                  createdAt: new Date(newMessage.createdAt),
                  isRead: false,
                },
                unreadCount:
                  conv.id === selectedConversationRef.current?.id &&
                  !document.hidden
                    ? 0 // Auto-marked as read since conversation is active and visible
                    : conv.id === selectedConversationRef.current?.id
                      ? conv.unreadCount // Keep current count if document is hidden
                      : conv.unreadCount + 1, // Increment for inactive conversations
              };
            }
            return conv;
          });
        });
      }); // Set up read status change handler
      const unsubscribeReadStatus = onMessageReadStatusChanged((data) => {
        console.log('👁️ Message read status changed:', data);

        // Update messages in the currently selected conversation
        setMessages((prevMessages) => {
          return prevMessages.map((message) => {
            if (message.id === data.messageId) {
              // Update the message status to reflect the read state
              return {
                ...message,
                isRead: data.read,
                status: data.read ? 'read' : message.status,
              };
            }
            return message;
          });
        });
      });

      // Set up conversation read status change handler
      const unsubscribeConversationReadStatus = onConversationReadStatusChanged(
        (data) => {
          console.log('👁️ Conversation read status changed:', data);

          // Update the conversation list to reflect the change in unread count
          setConversations((prevConversations) => {
            return prevConversations.map((conv) => {
              if (conv.id === data.conversationId) {
                // If someone else marked this conversation as read, update our view
                return {
                  ...conv,
                  unreadCount: data.userId === user?.id ? 0 : conv.unreadCount,
                };
              }
              return conv;
            });
          });
        }
      );
      return () => {
        unsubscribeNewMessage();
        unsubscribeReadStatus();
        unsubscribeConversationReadStatus();
      };
    }
  }, [isOpen, user?.id, isConnected, connect]);

  // Handle page visibility change to mark messages as read when user returns
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        !document.hidden &&
        selectedConversation?.id &&
        selectedConversation.unreadCount > 0
      ) {
        // User returned to the page and there's an active conversation with unread messages
        try {
          await messageService.markConversationAsRead(selectedConversation.id);
          console.log('✅ Marked conversation as read after visibility change');

          // Update conversation list to show no unread messages
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === selectedConversation.id
                ? { ...conv, unreadCount: 0 }
                : conv
            )
          );
        } catch (error) {
          console.error(
            'Failed to mark conversation as read on visibility change:',
            error
          );
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedConversation?.id, selectedConversation?.unreadCount]);

  // Join/leave conversation rooms
  useEffect(() => {
    if (selectedConversation?.id && isConnected) {
      console.log('🏠 Joining conversation room:', selectedConversation.id);
      joinConversation(selectedConversation.id);

      return () => {
        console.log('🚪 Leaving conversation room:', selectedConversation.id);
        leaveConversation(selectedConversation.id);
      };
    }
  }, [
    selectedConversation?.id,
    isConnected,
    joinConversation,
    leaveConversation,
  ]);

  // Load conversations when drawer opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadConversations();
    }
  }, [isOpen, user?.id]);

  // Auto-start conversation with specific user
  useEffect(() => {
    if (isOpen && startConversationWith && user?.id) {
      const autoStartConversation = async () => {
        try {
          // Check if conversation already exists
          const existingConversation = conversations.find(
            (conv) => conv.participant.id === startConversationWith.userId
          );

          if (existingConversation) {
            setSelectedConversation(existingConversation);
            handleConversationSelect(existingConversation);
          } else {
            // Create new conversation
            const participant = {
              id: startConversationWith.userId,
              username: startConversationWith.username,
              firstName: startConversationWith.firstName,
              lastName: startConversationWith.lastName,
              isOnline: false, // This will be updated from the API response
            };
            await handleStartConversation(participant);
          }
        } catch (error) {
          console.error('Error auto-starting conversation:', error);
        }
      };

      // Wait for conversations to load first
      if (conversations.length > 0 || !isLoading) {
        autoStartConversation();
      }
    }
  }, [isOpen, startConversationWith, conversations, isLoading, user?.id]);

  // Handle user search for new chat
  useEffect(() => {
    const trimmedQuery = searchQuery.trim().replace('@', '');

    if (trimmedQuery.length >= 2) {
      setIsSearchLoading(true);

      const timeoutId = setTimeout(async () => {
        try {
          const users = await userService.searchUsers(trimmedQuery, 10);
          setSearchResults(users);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearchLoading(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setIsSearchLoading(false);
    }
  }, [searchQuery]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const apiConversations = await messageService.getConversations();
      const conversations = apiConversations.map((conv) =>
        convertApiConversation(conv, user?.id || '')
      );
      setConversations(conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Show empty state or error message
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load conversations when drawer opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadConversations();
    }
  }, [isOpen, user?.id]);
  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    try {
      setIsLoading(true);
      const apiMessages = await messageService.getMessages(conversation.id);
      const messages = apiMessages.map(convertApiMessage);
      setMessages(messages);

      // Mark all messages in this conversation as read when opening it
      // Only if there are unread messages to avoid unnecessary API calls
      if (conversation.unreadCount > 0) {
        try {
          await messageService.markConversationAsRead(conversation.id);

          // Optimistically update the UI to show no unread messages
          setConversations((prevConversations) =>
            prevConversations.map((conv) =>
              conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
            )
          );

          console.log('✅ Conversation marked as read:', conversation.id);
        } catch (error) {
          console.error('Failed to mark conversation as read:', error);
          // Don't show error to user as this is a background operation
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSendMessage = async (
    content: string,
    attachments?: Array<{
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    }>
  ) => {
    if (!selectedConversation || (!content.trim() && !attachments?.length))
      return;

    // Create a temporary message with "sending" status
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      content: content.trim() || undefined,
      senderId: user?.id || '',
      conversationId: selectedConversation.id,
      createdAt: new Date(),
      isRead: false,
      status: 'sending',
      attachments: attachments?.map((att) => ({
        fileUrl: att.fileUrl,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
      })),
    };

    // Add the temporary message to the UI
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const sentMessage = await messageService.sendMessage(
        content.trim(),
        selectedConversation.id,
        attachments
      );
      const message = convertApiMessage(sentMessage);

      // Replace the temporary message with the actual sent message
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? message : msg))
      );

      // Update conversation's last message
      const lastMessageContent = attachments?.length
        ? content.trim()
          ? content.trim()
          : `📎 ${attachments.length} ${attachments.length === 1 ? 'file' : 'files'}`
        : content.trim() || undefined;

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: {
                  id: message.id,
                  content: lastMessageContent,
                  senderId: message.senderId,
                  createdAt: message.createdAt,
                  isRead: message.isRead,
                },
                updatedAt: message.createdAt,
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);

      // Update the temporary message to show failed status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: 'failed' as const } : msg
        )
      );

      // TODO: Show error toast/notification
    }
  };
  const handleRetryMessage = async (failedMessage: Message) => {
    if (!selectedConversation || failedMessage.status !== 'failed') return;

    // Update message status to "sending"
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === failedMessage.id
          ? { ...msg, status: 'sending' as const }
          : msg
      )
    );

    try {
      const sentMessage = await messageService.sendMessage(
        failedMessage.content || '',
        selectedConversation.id,
        failedMessage.attachments
      );
      const message = convertApiMessage(sentMessage);

      // Replace the failed message with the newly sent message
      setMessages((prev) =>
        prev.map((msg) => (msg.id === failedMessage.id ? message : msg))
      );

      // Update conversation's last message
      const lastMessageContent = failedMessage.attachments?.length
        ? failedMessage.content
          ? failedMessage.content
          : `📎 ${failedMessage.attachments.length} ${failedMessage.attachments.length === 1 ? 'file' : 'files'}`
        : failedMessage.content || undefined;

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: {
                  id: message.id,
                  content: lastMessageContent,
                  senderId: message.senderId,
                  createdAt: message.createdAt,
                  isRead: message.isRead,
                },
                updatedAt: message.createdAt,
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Error retrying message:', error);

      // Set message back to failed status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === failedMessage.id
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      );
    }
  };
  const handleClose = () => {
    setIsNewChatMode(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedConversation(null);
    onClose();
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setIsNewChatMode(false);
  };
  const handleNewChat = () => {
    setIsNewChatMode(true);
    setSelectedConversation(null);
  };
  const handleStartConversation = async (participant: any) => {
    try {
      setIsLoading(true);
      const apiConversation = await messageService.createConversation(
        participant.username
      );
      const conversation = convertApiConversation(
        apiConversation,
        user?.id || ''
      ); // Check if conversation already exists in list
      const existingConversation = conversations.find(
        (conv) => conv.id === conversation.id
      );
      if (existingConversation) {
        setSelectedConversation(existingConversation);
      } else {
        setConversations((prev) => [conversation, ...prev]);
        setSelectedConversation(conversation);
      }
      setIsNewChatMode(false);
      setSearchQuery('');
      setSearchResults([]);
      setMessages([]);

      // Load messages for this conversation
      await handleConversationSelect(conversation);
    } catch (error) {
      console.error('Error starting conversation:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {' '}
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
        onClick={handleClose}
      />{' '}
      {/* Chat Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 flex h-full flex-col border-l border-secondary-200 bg-white shadow-xl transition-all duration-300 ease-in-out dark:border-secondary-700 dark:bg-secondary-900 ${
          language === 'ar' ? 'left-0 right-auto border-l-0 border-r' : ''
        } ${isMinimized ? 'w-80 md:w-96' : 'w-full md:w-96 lg:w-[56rem]'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {' '}
            {selectedConversation && (
              <button
                onClick={handleBackToList}
                className="rounded-lg p-1 text-blue-600 transition-all duration-200 hover:scale-105 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 lg:hidden"
                title={t('chat:back_to_conversations')}
              >
                <ArrowLeft
                  className={`h-5 w-5 ${language === 'ar' ? 'rotate-180' : ''}`}
                />
              </button>
            )}
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {selectedConversation
                ? `${selectedConversation.participant.firstName} ${selectedConversation.participant.lastName}`
                : t('chat:messages')}
            </h2>
            {selectedConversation && (
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <Circle
                  className={`h-2 w-2 ${
                    selectedConversation.participant.isOnline
                      ? 'fill-current text-green-500'
                      : 'fill-current text-secondary-400'
                  }`}
                />{' '}
                <span className="text-xs text-secondary-500">
                  {selectedConversation.participant.isOnline
                    ? t('common:online')
                    : t('common:offline')}
                </span>
              </div>
            )}
          </div>{' '}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {!selectedConversation && (
              <button
                onClick={handleNewChat}
                className="rounded-lg bg-primary-600 p-2 text-white transition-colors hover:bg-primary-700"
                title={t('chat:new_chat')}
              >
                <Plus className="h-4 w-4" />
              </button>
            )}{' '}
            {selectedConversation && (
              <button
                onClick={handleBackToList}
                className="hidden rounded-lg p-2 text-blue-600 transition-all duration-200 hover:scale-105 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 lg:block"
                title={t('chat:back_to_conversations')}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}{' '}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hidden rounded-lg p-2 text-indigo-600 transition-all duration-200 hover:scale-105 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300 md:block"
              title={isMinimized ? t('chat:expand') : t('chat:minimize')}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </button>{' '}
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-red-600 transition-all duration-200 hover:scale-105 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
              title={t('chat:close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>{' '}
        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Conversations Sidebar - Always visible on large screens, hidden on mobile when conversation is selected */}
          <div
            className={`border-r border-secondary-200 bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-800 ${
              selectedConversation
                ? 'hidden lg:block lg:w-80'
                : 'w-full lg:w-80'
            }`}
          >
            {isNewChatMode ? (
              <div className="flex h-full flex-col">
                {/* New Chat Header */}
                <div className="flex items-center justify-between border-b border-secondary-200 p-4 dark:border-secondary-700">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    {' '}
                    <button
                      onClick={() => {
                        setIsNewChatMode(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="rounded-lg p-2 text-blue-600 transition-all duration-200 hover:scale-105 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                      title={t('chat:back_to_conversations')}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                      {t('chat:new_chat')}
                    </h2>
                  </div>
                </div>

                {/* Search Input */}
                <div className="border-b border-secondary-200 p-4 dark:border-secondary-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-secondary-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('chat:search_users')}
                      className="w-full rounded-lg border border-secondary-200 bg-secondary-50 py-3 pl-10 pr-4 text-secondary-900 placeholder-secondary-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-100"
                      autoFocus
                    />
                  </div>
                  {searchQuery.trim().length > 0 &&
                    searchQuery.trim().length < 2 && (
                      <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                        {t('chat:search_hint_min_chars')}
                      </p>
                    )}
                </div>

                {/* Search Results */}
                <div className="flex-1 overflow-y-auto">
                  {isSearchLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"></div>
                        <span className="text-sm text-secondary-600 dark:text-secondary-400">
                          Searching...
                        </span>
                      </div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() =>
                            handleStartConversation({
                              id: user.id,
                              username: user.username,
                              firstName: user.firstName,
                              lastName: user.lastName,
                              isOnline: user.isOnline || false,
                            })
                          }
                          className="w-full p-4 text-left transition-colors hover:bg-secondary-50 dark:hover:bg-secondary-800"
                        >
                          <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                              <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-secondary-900 dark:text-secondary-100">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="truncate text-sm text-secondary-500 dark:text-secondary-400">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.trim().length >= 2 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <User className="mb-4 h-12 w-12 text-secondary-400" />
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        No users found for "{searchQuery.trim()}"
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Search className="mb-4 h-12 w-12 text-secondary-400" />
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        {t('chat:search_users')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                onConversationSelect={handleConversationSelect}
                isLoading={isLoading}
                selectedConversationId={selectedConversation?.id}
              />
            )}
          </div>{' '}
          {/* Chat Area */}
          {selectedConversation ? (
            <div className="flex h-full flex-1 flex-col">
              <div className="flex-1 overflow-hidden">
                {' '}
                <MessageList
                  messages={messages}
                  currentUserId={user?.id || ''}
                  isLoading={isLoading}
                  onRetryMessage={handleRetryMessage}
                />
              </div>{' '}
              {/* Typing indicator positioned below message input */}
              {(() => {
                const currentTypingUsers = selectedConversation
                  ? Array.from(typingUsers.values()).filter(
                      (typing) =>
                        typing.conversationId === selectedConversation.id &&
                        typing.isTyping &&
                        typing.userId !== user?.id // Exclude current user
                    )
                  : [];

                return currentTypingUsers.length > 0 ? (
                  <div className="border-t border-secondary-200 bg-white px-4 py-3 dark:border-secondary-600 dark:bg-secondary-800">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                          style={{ animationDelay: '0ms' }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                          style={{ animationDelay: '150ms' }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-blue-500"
                          style={{ animationDelay: '300ms' }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium italic text-blue-600 dark:text-blue-400">
                        {currentTypingUsers.length === 1
                          ? `${currentTypingUsers[0].username} is typing...`
                          : currentTypingUsers.length === 2
                            ? `${currentTypingUsers[0].username} and ${currentTypingUsers[1].username} are typing...`
                            : `${currentTypingUsers.length} people are typing...`}
                      </span>
                    </div>
                  </div>
                ) : null;
              })()}
              <div className="flex-shrink-0">
                <MessageInput
                  conversationId={selectedConversation?.id}
                  onSend={handleSendMessage}
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : (
            /* Empty state for large screens when no conversation is selected */
            <div className="lg:bg-secondary-25 dark:lg:bg-secondary-850 hidden lg:flex lg:flex-1 lg:items-center lg:justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-700">
                  <Search className="h-8 w-8 text-secondary-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-secondary-900 dark:text-secondary-100">
                  {t('chat:select_conversation')}
                </h3>
                <p className="text-sm text-secondary-500">
                  {t('chat:select_conversation_description')}
                </p>
              </div>{' '}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
