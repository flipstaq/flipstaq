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
import MessageSearch from './MessageSearch';
import { userService, User as UserType } from '@/lib/userService';
import { Conversation, Message } from '@/types/chat';
import { BlockButton } from '@/components/common/BlockButton';
import ReportModal from '@/components/report/ReportModal';
import { useBlockStatus } from '@/hooks/useBlockStatus';
import { useVerificationCheck } from '@/hooks/useVerificationCheck';
import VerificationPrompt from '@/components/auth/VerificationPrompt';
import { useToast } from '@/components/providers/ToastProvider';

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
const convertApiMessage = (
  apiMsg: ApiMessage,
  currentUserId?: string
): Message => ({
  ...apiMsg,
  createdAt: new Date(apiMsg.createdAt),
  editedAt: apiMsg.editedAt ? new Date(apiMsg.editedAt) : undefined,
  // Status logic:
  // - For own messages: show 'read' if read by recipient, otherwise 'delivered'
  // - For received messages: status doesn't matter as recipients don't see status icons
  status:
    apiMsg.senderId === currentUserId
      ? apiMsg.isRead
        ? 'read'
        : 'delivered'
      : 'delivered',
});

export default function ChatDrawer({
  isOpen,
  onClose,
  startConversationWith,
}: ChatDrawerProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { error: showErrorToast, success: showSuccessToast } = useToast();
  const {
    connect,
    isConnected,
    joinConversation,
    leaveConversation,
    onNewMessage,
    onMessageReplied,
    onMessageDeleted,
    onMessageEdited,
    onMessageReadStatusChanged,
    onConversationReadStatusChanged,
    typingUsers,
  } = useWebSocket();

  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageCache, setMessageCache] = useState<Map<string, Message[]>>(
    new Map()
  );
  const [loadingConversations, setLoadingConversations] = useState<Set<string>>(
    new Set()
  );
  const [isNewChatMode, setIsNewChatMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<Date | null>(
    null
  );
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    content: string;
    senderId: string;
    senderUsername: string;
  } | null>(null);

  // Infinite scroll and search state
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);

  // Block status hook for the selected conversation participant
  const {
    blockStatus,
    updateBlockStatus,
    isLoading: isBlockLoading,
  } = useBlockStatus(selectedConversation?.participant?.id || null);
  // Verification check hook
  const {
    checkVerification,
    showVerificationPrompt,
    blockedFeature,
    closePrompt,
    isVerified,
  } = useVerificationCheck();
  // Remove polling interval ref since we're using WebSocket only
  // const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  const selectedConversationRef = useRef<Conversation | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const messageCacheRef = useRef<Map<string, Message[]>>(new Map());
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
  useEffect(() => {
    messageCacheRef.current = messageCache;
  }, [messageCache]);

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

            // Update cache as well
            setMessageCache((prev) => {
              const newMap = new Map(prev);
              const cachedMessages =
                newMap.get(newMessage.conversationId) || [];
              newMap.set(newMessage.conversationId, [
                ...cachedMessages,
                convertedMessage,
              ]);
              return newMap;
            });

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

      // Set up message deleted handler
      const unsubscribeMessageDeleted = onMessageDeleted((data) => {
        console.log('🗑️ Message deleted via WebSocket:', data);

        // Remove the message from the current conversation
        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.filter(
            (msg) => msg.id !== data.messageId
          );

          // If this was in the selected conversation, also update the conversation's last message
          if (selectedConversationRef.current?.id === data.conversationId) {
            const lastMessage = updatedMessages[updatedMessages.length - 1];

            setConversations((prevConversations) => {
              return prevConversations.map((conv) => {
                if (conv.id === data.conversationId) {
                  return {
                    ...conv,
                    lastMessage: lastMessage
                      ? {
                          id: lastMessage.id,
                          content: lastMessage.attachments?.length
                            ? lastMessage.content
                              ? lastMessage.content
                              : `📎 ${lastMessage.attachments.length} ${lastMessage.attachments.length === 1 ? 'file' : 'files'}`
                            : lastMessage.content || undefined,
                          senderId: lastMessage.senderId,
                          createdAt: lastMessage.createdAt,
                          isRead: lastMessage.isRead,
                        }
                      : undefined,
                    updatedAt: new Date(),
                  };
                }
                return conv;
              });
            });
          }

          return updatedMessages;
        });
      });

      // Set up message edited handler
      const unsubscribeMessageEdited = onMessageEdited((data) => {
        console.log('✏️ Message edited via WebSocket:', data);

        // Update the message in the current conversation
        setMessages((prevMessages) => {
          return prevMessages.map((msg) => {
            if (msg.id === data.messageId) {
              return {
                ...msg,
                content: data.content,
                editedAt: new Date(data.editedAt),
              };
            }
            return msg;
          });
        });

        // Update the conversation's last message if it was the edited message
        setConversations((prevConversations) => {
          return prevConversations.map((conv) => {
            if (
              conv.id === data.conversationId &&
              conv.lastMessage?.id === data.messageId
            ) {
              return {
                ...conv,
                lastMessage: {
                  ...conv.lastMessage,
                  content: data.content,
                },
                updatedAt: new Date(),
              };
            }
            return conv;
          });
        });
      });

      // Set up real-time message reply handler
      const unsubscribeMessageReplied = onMessageReplied((replyMessage) => {
        console.log('📨 Received message reply via WebSocket:', replyMessage);

        // Skip if this is our own message (we already handle it in the send function)
        if (replyMessage.senderId === user?.id) {
          console.log('🔄 Skipping own reply from WebSocket');
          return;
        }

        // Add the reply message to the current conversation if it matches
        if (
          selectedConversationRef.current?.id === replyMessage.conversationId
        ) {
          setMessages((prevMessages) => {
            // Avoid duplicates by checking if message already exists
            const existingMessage = prevMessages.find(
              (m) => m.id === replyMessage.id
            );
            if (existingMessage) {
              console.log(
                '🔄 Reply message already exists, skipping:',
                replyMessage.id
              );
              return prevMessages;
            }

            console.log(
              '✅ Adding reply message to conversation:',
              replyMessage.id
            );
            const convertedMessage: Message = {
              id: replyMessage.id,
              content: replyMessage.content,
              senderId: replyMessage.senderId,
              conversationId: replyMessage.conversationId,
              replyToMessageId: replyMessage.replyToMessageId,
              replyToMessage: replyMessage.replyToMessage,
              createdAt: new Date(replyMessage.createdAt),
              isRead: false,
              status: 'delivered',
              attachments: replyMessage.attachments || [],
            };
            return [...prevMessages, convertedMessage];
          });

          // Auto-mark the reply as read since the conversation is currently active
          setTimeout(async () => {
            try {
              if (!document.hidden) {
                await messageService.markConversationAsRead(
                  replyMessage.conversationId
                );
                console.log(
                  '✅ Auto-marked reply message as read in active conversation'
                );
              }
            } catch (error) {
              console.error('Failed to auto-mark reply as read:', error);
            }
          }, 100);
        }

        // Update conversation list to reflect new reply message
        setConversations((prevConversations) => {
          return prevConversations.map((conv) => {
            if (conv.id === replyMessage.conversationId) {
              return {
                ...conv,
                lastMessage: {
                  id: replyMessage.id,
                  content: replyMessage.content || undefined,
                  senderId: replyMessage.senderId,
                  createdAt: new Date(replyMessage.createdAt),
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
      });

      return () => {
        unsubscribeNewMessage();
        unsubscribeReadStatus();
        unsubscribeConversationReadStatus();
        unsubscribeMessageDeleted();
        unsubscribeMessageEdited();
        unsubscribeMessageReplied();
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

      // Prefetch messages for the first 3 conversations for better UX
      const topConversations = conversations.slice(0, 3);
      topConversations.forEach((conv) => {
        if (!messageCache.has(conv.id)) {
          prefetchMessages(conv.id);
        }
      });
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Show empty state or error message
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };
  // Prefetch messages for a conversation (for instant switching)
  const prefetchMessages = async (conversationId: string) => {
    // Don't prefetch if already cached or currently loading
    if (
      messageCache.has(conversationId) ||
      loadingConversations.has(conversationId)
    ) {
      return;
    }

    try {
      setLoadingConversations((prev) => {
        const newSet = new Set(prev);
        newSet.add(conversationId);
        return newSet;
      });

      const apiMessages = await messageService.getMessages(conversationId);
      const messages = apiMessages.map((msg) =>
        convertApiMessage(msg, user?.id)
      );

      // Cache the messages
      setMessageCache((prev) => {
        const newMap = new Map(prev);
        newMap.set(conversationId, messages);
        return newMap;
      });

      console.log(`✅ Prefetched messages for conversation: ${conversationId}`);
    } catch (error) {
      console.error('Error prefetching messages:', error);
    } finally {
      setLoadingConversations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(conversationId);
        return newSet;
      });
    }
  };

  // Load conversations when drawer opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadConversations();
    }
  }, [isOpen, user?.id]);
  const handleConversationSelect = async (conversation: Conversation) => {
    // Set the selected conversation immediately
    setSelectedConversation(conversation);

    // Reset infinite scroll state
    setHasMoreMessages(true); // Assume there might be older messages
    setIsLoadingOlder(false);
    setHighlightedMessageId(null);

    // Check if we have cached messages for instant display
    const cachedMessages = messageCache.get(conversation.id);
    if (cachedMessages) {
      // Instantly display cached messages with no loading
      setMessages(cachedMessages);
      console.log(
        `⚡ Instantly loaded ${cachedMessages.length} cached messages for: ${conversation.id}`
      );
    } else {
      // If no cache, set empty array to avoid showing previous conversation's messages
      setMessages([]);
    }

    // Mark conversation as read immediately (optimistic)
    if (conversation.unreadCount > 0) {
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
        )
      );
    }

    // Background sync: Always fetch fresh messages to ensure we have the latest
    try {
      const apiMessages = await messageService.getMessages(conversation.id);
      const freshMessages = apiMessages.map((msg) =>
        convertApiMessage(msg, user?.id)
      );

      // Update both cache and current messages
      setMessageCache((prev) => {
        const newMap = new Map(prev);
        newMap.set(conversation.id, freshMessages);
        return newMap;
      });

      // Only update UI if this is still the selected conversation
      if (selectedConversationRef.current?.id === conversation.id) {
        setMessages(freshMessages);
      }

      // Mark all messages as read in the background
      if (conversation.unreadCount > 0) {
        try {
          await messageService.markConversationAsRead(conversation.id);
          console.log('✅ Conversation marked as read:', conversation.id);
        } catch (error) {
          console.error('Failed to mark conversation as read:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing messages:', error);
      // If we had cached messages, keep them; otherwise show empty state
      if (!cachedMessages) {
        setMessages([]);
      }
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
    // Check verification before sending message
    if (!checkVerification('chat:sending_messages')) {
      return;
    }

    if (!selectedConversation || (!content.trim() && !attachments?.length))
      return; // Create a temporary message with "sending" status
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      content: content.trim() || undefined,
      senderId: user?.id || '',
      conversationId: selectedConversation.id,
      replyToMessageId: replyingTo?.id,
      replyToMessage: replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content,
            senderId: replyingTo.senderId,
            senderUsername: replyingTo.senderUsername,
          }
        : undefined,
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

    // Clear reply state
    setReplyingTo(null); // Add the temporary message to the UI and cache
    setMessages((prev) => [...prev, tempMessage]);

    // Also add to cache
    setMessageCache((prev) => {
      const newMap = new Map(prev);
      const cachedMessages = newMap.get(selectedConversation.id) || [];
      newMap.set(selectedConversation.id, [...cachedMessages, tempMessage]);
      return newMap;
    });

    try {
      const sentMessage = await messageService.sendMessage(
        content.trim(),
        selectedConversation.id,
        attachments,
        replyingTo?.id
      );
      const message = convertApiMessage(sentMessage, user?.id);

      // Replace the temporary message with the actual sent message in both UI and cache
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? message : msg))
      );

      setMessageCache((prev) => {
        const newMap = new Map(prev);
        const cachedMessages = newMap.get(selectedConversation.id) || [];
        newMap.set(
          selectedConversation.id,
          cachedMessages.map((msg) => (msg.id === tempId ? message : msg))
        );
        return newMap;
      });

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

      // Show error notification
      showErrorToast(t('chat:message_send_failed'));
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
      const message = convertApiMessage(sentMessage, user?.id);

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
  const handleDeleteMessage = async (messageId: string) => {
    try {
      if (!selectedConversation) {
        throw new Error('No conversation selected');
      }

      await messageService.deleteMessage(messageId, selectedConversation.id); // Note: The UI will be updated via WebSocket 'messageDeleted' event
      // No need to manually update state here as WebSocket will handle it
    } catch (error) {
      console.error('Error deleting message:', error);
      showErrorToast(t('chat:message_delete_failed'));
    }
  };

  const handleMessageUpdate = (
    messageId: string,
    updatedMessage: Partial<Message>
  ) => {
    setMessages((prevMessages) =>
      prevMessages.map((message) =>
        message.id === messageId ? { ...message, ...updatedMessage } : message
      )
    );
  };
  const handleClose = () => {
    setIsNewChatMode(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedConversation(null);

    // Clear message cache for memory management
    setMessageCache(new Map());
    setLoadingConversations(new Set());

    onClose();
  };
  // Handle outside click to close drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;

      const target = event.target as Node;

      // Don't close if clicking inside the drawer
      if (drawerRef.current && drawerRef.current.contains(target)) {
        return;
      }

      // Don't close if clicking on context menu or modal elements
      const clickedElement = target as Element;
      if (clickedElement) {
        // Check if clicking on context menu (portaled to document.body)
        const contextMenu = clickedElement.closest(
          '[data-message-context-menu]'
        );
        if (contextMenu) {
          return;
        } // Check if clicking on emoji picker (portaled to document.body)
        const emojiPicker = clickedElement.closest(
          '[data-emoji-picker-portal]'
        );
        if (emojiPicker) {
          return;
        }

        // Check if clicking on message search modal
        const searchModal = clickedElement.closest(
          '[data-message-search-modal]'
        );
        if (searchModal) {
          return;
        }

        // Check if clicking on report modal or other modals
        const modal = clickedElement.closest(
          '[role="dialog"], .modal, [data-modal]'
        );
        if (modal) {
          return;
        }
      }

      handleClose();
    };

    if (isOpen) {
      // Add a small delay to prevent immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, handleClose]);

  const handleBackToList = () => {
    setSelectedConversation(null);
    setIsNewChatMode(false);
  };
  const handleNewChat = () => {
    setIsNewChatMode(true);
    setSelectedConversation(null);
  };
  const handleStartConversation = async (participant: any) => {
    // Check verification before starting a conversation
    if (!checkVerification('chat:starting_conversations')) {
      return;
    }

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
      setMessages([]); // Load messages for this conversation
      await handleConversationSelect(conversation);
    } catch (error) {
      console.error('Error starting conversation:', error);
      showErrorToast(t('chat:conversation_start_failed'));
    } finally {
      setIsLoading(false);
    }
  };
  const handleReplyToMessage = (message: Message) => {
    // Find sender username from conversation participant
    const senderUsername =
      selectedConversation?.participant.username || 'Unknown';

    setReplyingTo({
      id: message.id,
      content: message.content || '',
      senderId: message.senderId,
      senderUsername:
        message.senderId === user?.id ? user.username || 'You' : senderUsername,
    });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Handle loading older messages for infinite scroll
  const handleLoadOlderMessages = async () => {
    if (!selectedConversation || isLoadingOlder || !hasMoreMessages) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;
    setIsLoadingOlder(true);
    try {
      const result = await messageService.getOlderMessages(
        selectedConversation.id,
        oldestMessage.id,
        50
      );

      if (result.messages.length > 0) {
        const convertedMessages = result.messages.map((msg) =>
          convertApiMessage(msg, user?.id)
        );

        // Prepend older messages to the current list
        setMessages((prev) => [...convertedMessages, ...prev]);

        // Update cache
        setMessageCache((prev) => {
          const newMap = new Map(prev);
          const currentCached = newMap.get(selectedConversation.id) || [];
          newMap.set(selectedConversation.id, [
            ...convertedMessages,
            ...currentCached,
          ]);
          return newMap;
        });
      } // Update hasMoreMessages based on the response
      setHasMoreMessages(result.hasMore);
    } catch (error) {
      console.error('Error loading older messages:', error);
      showErrorToast(t('chat:loading_older_messages_failed'));
      setHasMoreMessages(false);
    } finally {
      setIsLoadingOlder(false);
    }
  };
  // Handle message search result selection
  const handleMessageSearchSelect = (messageId: string) => {
    setHighlightedMessageId(messageId);
    setIsMessageSearchOpen(false); // Close the search modal
    
    // Scroll to the message after a short delay to ensure it's rendered
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);

    // Clear highlight after a few seconds
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 3000);
  };

  // Always render the component for smooth transitions, but hide with transforms
  return (
    <>
      {' '}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-all duration-300 ease-in-out ${
          isOpen
            ? 'pointer-events-auto bg-opacity-50'
            : 'pointer-events-none bg-opacity-0'
        }`}
        onClick={handleClose}
      />
      {/* Chat Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 flex h-full flex-col border-l border-secondary-200 bg-white shadow-xl transition-all duration-300 ease-in-out dark:border-secondary-700 dark:bg-secondary-900 ${
          language === 'ar' ? 'left-0 right-auto border-l-0 border-r' : ''
        } ${isMinimized ? 'w-80 md:w-96' : 'w-full md:w-96 lg:w-[56rem]'} ${
          isOpen
            ? 'translate-x-0'
            : language === 'ar'
              ? '-translate-x-full'
              : 'translate-x-full'
        }`}
      >
        {' '}
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
            <div
              className="transform transition-all duration-300 ease-in-out"
              key={selectedConversation?.id || 'no-conversation'}
            >
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                {selectedConversation
                  ? `${selectedConversation.participant.firstName} ${selectedConversation.participant.lastName}`
                  : t('chat:messages')}
              </h2>
            </div>{' '}
            {selectedConversation && (
              <div
                className="flex items-center space-x-1 rtl:space-x-reverse"
                key={`status-${selectedConversation.participant.id}`}
              >
                <Circle
                  className={`h-2 w-2 transition-colors duration-200 ${
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
            )}{' '}
            {selectedConversation && (
              <div
                className="flex items-center space-x-2 rtl:space-x-reverse"
                key={`actions-${selectedConversation.participant.id}`}
              >
                <BlockButton
                  targetUserId={selectedConversation.participant.id}
                  targetUsername={selectedConversation.participant.username}
                  isBlocked={blockStatus.isBlocked}
                  onBlockChange={updateBlockStatus}
                  className=""
                />

                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                  title={t('report:report_user')}
                >
                  {t('report:report')}
                </button>
              </div>
            )}
          </div>{' '}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {selectedConversation && (
              <button
                onClick={() => setIsMessageSearchOpen(true)}
                className="rounded-lg p-2 text-secondary-600 transition-all duration-200 hover:scale-105 hover:bg-secondary-50 hover:text-secondary-700 dark:text-secondary-400 dark:hover:bg-secondary-700 dark:hover:text-secondary-300"
                title={t('chat:search_messages')}
              >
                <Search className="h-4 w-4" />
              </button>
            )}
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
                onConversationHover={prefetchMessages}
                isLoading={isLoading}
                selectedConversationId={selectedConversation?.id}
              />
            )}
          </div>{' '}
          {/* Chat Area */}{' '}
          {selectedConversation ? (
            <div
              className="relative flex h-full flex-1 flex-col transition-opacity duration-200 ease-in-out"
              key={selectedConversation.id}
            >
              {/* Blocking Overlay */}
              {blockStatus.isBlocked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-200 ease-in-out">
                  <div className="mx-4 max-w-sm rounded-lg border border-secondary-200 bg-white p-6 text-center shadow-xl dark:border-secondary-700 dark:bg-secondary-800">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                      <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                      {t('chat:user_blocked')}
                    </h3>
                    <p className="mb-4 text-sm text-secondary-600 dark:text-secondary-400">
                      {t('chat:blocked_user_message')}
                    </p>{' '}
                    <button
                      onClick={async () => {
                        try {
                          await updateBlockStatus(false);
                        } catch (error) {
                          console.error('Failed to unblock user:', error);
                          // Most errors should be handled by the hook automatically
                          // Only show user-facing errors for unexpected cases
                          const errorMessage =
                            error instanceof Error
                              ? error.message
                              : 'Unknown error';
                          showErrorToast(
                            `Failed to unblock user: ${errorMessage}`
                          );
                        }
                      }}
                      disabled={isBlockLoading}
                      className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBlockLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          <span>{t('common:loading')}</span>
                        </div>
                      ) : (
                        t('chat:unblock_user')
                      )}
                    </button>
                  </div>
                </div>
              )}{' '}
              <div className="flex-1 overflow-hidden">
                {' '}
                <div
                  className="h-full transition-opacity duration-200 ease-in-out"
                  key={`messages-${selectedConversation.id}`}
                >
                  {' '}
                  <MessageList
                    messages={messages}
                    currentUserId={user?.id || ''}
                    isLoading={false}
                    onRetryMessage={handleRetryMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onReply={handleReplyToMessage}
                    onMessageUpdate={handleMessageUpdate}
                    onLoadOlderMessages={handleLoadOlderMessages}
                    hasMoreMessages={hasMoreMessages}
                    isLoadingOlder={isLoadingOlder}
                    highlightedMessageId={highlightedMessageId}
                  />
                </div>
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
              })()}{' '}
              <div
                className="flex-shrink-0"
                key={`input-${selectedConversation.id}`}
              >
                {' '}
                <MessageInput
                  conversationId={selectedConversation?.id}
                  onSend={handleSendMessage}
                  disabled={isLoading}
                  replyingTo={replyingTo}
                  onCancelReply={handleCancelReply}
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
                </p>{' '}
              </div>{' '}
            </div>
          )}
        </div>
      </div>
      {/* Report Modal */}
      {selectedConversation && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          type="USER"
          targetId={selectedConversation.participant.id}
          targetData={{
            username: selectedConversation.participant.username,
          }}
        />
      )}{' '}
      {/* Verification Prompt */}
      <VerificationPrompt
        isOpen={showVerificationPrompt}
        onClose={closePrompt}
        feature={blockedFeature}
      />
      {/* Message Search Modal */}
      {selectedConversation && (
        <MessageSearch
          isOpen={isMessageSearchOpen}
          onClose={() => setIsMessageSearchOpen(false)}
          conversationId={selectedConversation.id}
          onMessageSelect={handleMessageSearchSelect}
        />
      )}
    </>
  );
}
