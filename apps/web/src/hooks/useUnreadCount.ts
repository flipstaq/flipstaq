'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useAuth } from '@/components/providers/AuthProvider';
import { messageService } from '@/lib/messageService';

/**
 * Hook to track total unread messages count across all conversations
 */
export function useUnreadCount() {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { onNewMessage, onConversationReadStatusChanged } = useWebSocket();
  const { user, isAuthenticated } = useAuth();

  // Fetch initial unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        setIsLoading(true);
        const conversations = await messageService.getConversations();
        const total = conversations.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        setTotalUnreadCount(total);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
        setTotalUnreadCount(0);
      } finally {
        setIsLoading(false);
      }
    }; // Only fetch if user is authenticated
    if (isAuthenticated && user) {
      fetchUnreadCount();
    } else {
      setIsLoading(false);
      setTotalUnreadCount(0);
    }
  }, [isAuthenticated, user]);
  // Listen for new messages to update count
  useEffect(() => {
    const unsubscribeNewMessage = onNewMessage((newMessage) => {
      // Increment count for new messages that are not from the current user
      if (user && newMessage.senderId !== user.id) {
        setTotalUnreadCount((prev) => prev + 1);
      }
    });

    return unsubscribeNewMessage;
  }, [onNewMessage, user]);

  // Listen for conversation read status changes to update count
  useEffect(() => {
    const unsubscribeReadStatus = onConversationReadStatusChanged((data) => {
      // Decrease count when messages are marked as read
      if (data.updatedCount > 0) {
        setTotalUnreadCount((prev) => Math.max(0, prev - data.updatedCount));
      }
    });

    return unsubscribeReadStatus;
  }, [onConversationReadStatusChanged]);
  // Listen for auth changes to reset count
  useEffect(() => {
    if (!isAuthenticated) {
      setTotalUnreadCount(0);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  return {
    totalUnreadCount,
    isLoading,
    refreshUnreadCount: async () => {
      try {
        const conversations = await messageService.getConversations();
        const total = conversations.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        setTotalUnreadCount(total);
      } catch (error) {
        console.error('Failed to refresh unread count:', error);
      }
    },
  };
}
