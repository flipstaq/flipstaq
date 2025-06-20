'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  webSocketService,
  UserStatus,
  MessageEvent,
  TypingEvent,
} from '@/lib/webSocketService';

interface WebSocketContextType {
  isConnected: boolean;
  connectionState: string;
  onlineUsers: Map<string, UserStatus>;
  typingUsers: Map<string, TypingEvent>;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (data: any) => void;
  markAsRead: (messageId: string, read?: boolean) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  onNewMessage: (handler: (message: MessageEvent) => void) => () => void;
  onMessageReadStatusChanged: (handler: (data: any) => void) => () => void;
  onUserStatusChanged: (handler: (status: UserStatus) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserStatus>>(
    new Map()
  );
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingEvent>>(
    new Map()
  );

  // Connection management
  const connect = useCallback(() => {
    webSocketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  // Message operations
  const sendMessage = useCallback((data: any) => {
    webSocketService.sendMessage(data);
  }, []);

  const markAsRead = useCallback((messageId: string, read = true) => {
    webSocketService.markAsRead({ messageId, read });
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    webSocketService.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    webSocketService.leaveConversation(conversationId);
  }, []);

  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      webSocketService.sendTyping(conversationId, isTyping);
    },
    []
  );

  // Event subscription helpers
  const onNewMessage = useCallback(
    (handler: (message: MessageEvent) => void) => {
      webSocketService.on('newMessage', handler);
      return () => webSocketService.off('newMessage', handler);
    },
    []
  );

  const onMessageReadStatusChanged = useCallback(
    (handler: (data: any) => void) => {
      webSocketService.on('messageReadStatusChanged', handler);
      return () => webSocketService.off('messageReadStatusChanged', handler);
    },
    []
  );

  const onUserStatusChanged = useCallback(
    (handler: (status: UserStatus) => void) => {
      const userOnlineHandler = (data: any) => {
        handler({
          userId: data.userId,
          username: data.username,
          isOnline: true,
        });
      };
      const userOfflineHandler = (data: any) => {
        handler({
          userId: data.userId,
          username: data.username,
          isOnline: false,
        });
      };

      webSocketService.on('userOnline', userOnlineHandler);
      webSocketService.on('userOffline', userOfflineHandler);

      return () => {
        webSocketService.off('userOnline', userOnlineHandler);
        webSocketService.off('userOffline', userOfflineHandler);
      };
    },
    []
  );

  // Set up WebSocket event listeners
  useEffect(() => {
    // Connection status
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionState('connected');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    const handleError = () => {
      setConnectionState('error');
    };

    // User status management
    const handleUserOnline = (data: { userId: string; username: string }) => {
      setOnlineUsers((prev) => {
        const updated = new Map(prev);
        updated.set(data.userId, { ...data, isOnline: true });
        return updated;
      });
    };

    const handleUserOffline = (data: { userId: string; username: string }) => {
      setOnlineUsers((prev) => {
        const updated = new Map(prev);
        updated.set(data.userId, { ...data, isOnline: false });
        return updated;
      });
    }; // Typing indicators
    const handleUserTyping = (data: TypingEvent) => {
      setTypingUsers((prev) => {
        const updated = new Map(prev);
        const key = `${data.conversationId}-${data.userId}`;
        if (data.isTyping) {
          updated.set(key, data);
          // Auto-remove typing indicator after 10 seconds (longer than frontend timeout)
          setTimeout(() => {
            setTypingUsers((current) => {
              const newMap = new Map(current);
              newMap.delete(key);
              return newMap;
            });
          }, 10000);
        } else {
          updated.delete(key);
        }

        return updated;
      });
    };

    // Register event handlers
    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('error', handleError);
    webSocketService.on('userOnline', handleUserOnline);
    webSocketService.on('userOffline', handleUserOffline);
    webSocketService.on('userTyping', handleUserTyping);

    // Initial connection state
    setIsConnected(webSocketService.isConnected);
    setConnectionState(webSocketService.connectionState);

    // Cleanup
    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('error', handleError);
      webSocketService.off('userOnline', handleUserOnline);
      webSocketService.off('userOffline', handleUserOffline);
      webSocketService.off('userTyping', handleUserTyping);
    };
  }, []);

  // Auto-connect when auth token is available
  useEffect(() => {
    const checkAuthAndConnect = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token && !isConnected && connectionState === 'disconnected') {
          connect();
        }
      }
    };

    checkAuthAndConnect();

    // Listen for auth changes
    const handleAuthChange = () => {
      checkAuthAndConnect();
    };

    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [connect, isConnected, connectionState]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: WebSocketContextType = {
    isConnected,
    connectionState,
    onlineUsers,
    typingUsers,
    connect,
    disconnect,
    sendMessage,
    markAsRead,
    joinConversation,
    leaveConversation,
    sendTyping,
    onNewMessage,
    onMessageReadStatusChanged,
    onUserStatusChanged,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Utility hook for user online status
export function useUserOnlineStatus(userId: string): boolean {
  const { onlineUsers } = useWebSocket();
  return onlineUsers.get(userId)?.isOnline ?? false;
}

// Utility hook for typing indicators in a conversation
export function useTypingIndicators(conversationId: string): TypingEvent[] {
  const { typingUsers } = useWebSocket();

  return Array.from(typingUsers.values()).filter(
    (typing) => typing.conversationId === conversationId && typing.isTyping
  );
}
