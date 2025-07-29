interface WebSocketMessage {
  event?: string;
  data?: any;
  payload?: any;
  success?: boolean;
  error?: string;
  message?: any; // For successful responses containing message data
}

interface UserStatus {
  userId: string;
  username: string;
  isOnline: boolean;
}

interface MessageEvent {
  id: string;
  content?: string;
  senderId: string;
  conversationId: string;
  replyToMessageId?: string;
  replyToMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderUsername: string;
  };
  createdAt: string;
  attachments?: Array<{
    id?: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    metadata?: any;
  }>;
  reactions?: Array<{
    id: string;
    emoji: string;
    userId: string;
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
    };
    createdAt: string;
  }>;
}

interface ReactionEvent {
  messageId: string;
  emoji: string;
  userId: string;
  username: string;
  action: 'added' | 'removed';
  reaction?: {
    id: string;
    emoji: string;
    userId: string;
    user: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
    };
    createdAt: string;
  };
}

interface TypingEvent {
  userId: string;
  username: string;
  conversationId: string;
  isTyping: boolean;
}

type WebSocketEventHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers = new Map<string, Set<WebSocketEventHandler>>();
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private get wsUrl(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    const protocol = isProduction ? 'wss:' : 'ws:';
    const host = isProduction
      ? process.env.NEXT_PUBLIC_WS_URL || 'wss://yourdomain.com'
      : 'ws://localhost:8001/ws'; // Connect to dedicated WebSocket port with /ws path
    return host;
  }

  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    try {
      this.isConnecting = true;
      const token = await this.getAuthToken();

      if (!token) {
        console.warn('No auth token available for WebSocket connection');
        this.isConnecting = false;
        return;
      }
      const wsUrl = `${this.wsUrl}?token=${encodeURIComponent(token)}`;

      // Only log connection attempts in development
      if (process.env.NODE_ENV === 'development') {
      }
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('WebSocket connected');
        }
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.startHeartbeat();
        this.emit('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      this.ws.onclose = (event) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('WebSocket disconnected:', event.code, event.reason);
        }
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emit('disconnected', { code: event.code, reason: event.reason });

        // Only attempt reconnection if it wasn't a manual close
        if (
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    // Only log reconnection attempts in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
    }

    setTimeout(() => {
      this.connect();
    }, delay);
  }
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send a ping message to keep connection alive
        this.send('ping', {});
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  private handleMessage(message: WebSocketMessage): void {
    const { event, data, payload, success, error } = message;
    const eventData = data || payload;

    // Only log in development mode and avoid ping/pong spam
    if (
      process.env.NODE_ENV === 'development' &&
      event !== 'ping' &&
      event !== 'pong'
    ) {
      if (event && eventData) {
        console.log(`📨 WebSocket message received: ${event}`, eventData);
      } else if (success !== undefined) {
        console.log(
          `📨 WebSocket response: ${success ? 'success' : 'error'}`,
          eventData || error || message
        );
      } else {
        console.log('📨 WebSocket message (raw):', message);
      }
    }

    // Handle success/error responses for sendMessage
    if (success !== undefined) {
      if (success) {
        this.emit('sendMessageResponse', message);
      } else {
        this.emit('sendMessageError', { message: error || 'Unknown error' });
      }
      return;
    }

    // Handle error responses
    if (error) {
      this.emit('sendMessageError', { message: error });
      return;
    }
    switch (event) {
      case 'newMessage':
        this.emit('newMessage', eventData);
        break;
      case 'messageReplied':
        this.emit('messageReplied', eventData);
        break;
      case 'messageEdited':
        this.emit('messageEdited', eventData);
        break;
      case 'messageDeleted':
        this.emit('messageDeleted', eventData);
        break;
      case 'messageReaction':
        this.emit('messageReaction', eventData);
        break;
      case 'messageReadStatusChanged':
        this.emit('messageReadStatusChanged', eventData);
        break;
      case 'conversationReadStatusChanged':
        this.emit('conversationReadStatusChanged', eventData);
        break;
      case 'userOnline':
        this.emit('userOnline', eventData);
        break;
      case 'userOffline':
        this.emit('userOffline', eventData);
        break;
      case 'userTyping':
        this.emit('userTyping', eventData);
        break;
      case 'searchMessagesResponse':
        this.emit('searchMessagesResponse', eventData);
        break;
      case 'searchMessagesError':
        this.emit('searchMessagesError', eventData);
        break;
      case 'getOlderMessagesResponse':
        this.emit('getOlderMessagesResponse', eventData);
        break;
      case 'getOlderMessagesError':
        this.emit('getOlderMessagesError', eventData);
        break;
      case 'ping':
        // Respond to server ping with pong
        this.send('pong', {});
        break;
      case 'pong':
        // Server acknowledged our ping - only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🏓 Received pong from server');
        }
        break;
      default:
        console.warn('Unknown WebSocket event:', event);
    }
  }

  // Event subscription methods
  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in WebSocket event handler:', error);
        }
      });
    }
  }

  // WebSocket message sending methods
  sendMessage(data: {
    conversationId: string;
    content?: string;
    attachments?: Array<{
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      metadata?: any;
    }>;
  }): void {
    this.send('sendMessage', data);
  }

  editMessage(data: {
    messageId: string;
    content: string;
    conversationId: string;
  }): void {
    this.send('editMessage', data);
  }

  markAsRead(data: { messageId: string; read?: boolean }): void {
    this.send('markAsRead', data);
  }

  markConversationAsRead(conversationId: string): void {
    this.send('markConversationAsRead', { conversationId });
  }

  joinConversation(conversationId: string): void {
    this.send('joinConversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.send('leaveConversation', { conversationId });
  }
  sendTyping(conversationId: string, isTyping: boolean): void {
    this.send('typing', { conversationId, isTyping });
  }
  deleteMessage(messageId: string, conversationId: string): void {
    this.send('deleteMessage', { messageId, conversationId });
  }
  toggleReaction(messageId: string, emoji: string): void {
    this.send('toggleReaction', { messageId, emoji });
  }

  // Search messages in a conversation using WebSocket
  searchMessages(
    conversationId: string,
    query: string,
    limit?: number
  ): Promise<{ messages: any[]; total: number }> {
    console.log('🔌 WebSocketService: searchMessages called with:', {
      conversationId,
      query,
      limit,
    });
    return new Promise((resolve, reject) => {
      // Set up one-time listeners for response
      const handleSuccess = (data: any) => {
        console.log(
          '🔌 WebSocketService: searchMessagesResponse received:',
          data
        );
        this.off('searchMessagesResponse', handleSuccess);
        this.off('searchMessagesError', handleError);
        resolve(data);
      };

      const handleError = (error: any) => {
        console.log(
          '🔌 WebSocketService: searchMessagesError received:',
          error
        );
        this.off('searchMessagesResponse', handleSuccess);
        this.off('searchMessagesError', handleError);
        reject(new Error(error.error || 'Failed to search messages'));
      };

      // Listen for response
      this.on('searchMessagesResponse', handleSuccess);
      this.on('searchMessagesError', handleError);

      // Send search request
      console.log('🔌 WebSocketService: Sending searchMessages event');
      this.send('searchMessages', { conversationId, query, limit });

      // Set timeout to prevent hanging
      setTimeout(() => {
        this.off('searchMessagesResponse', handleSuccess);
        this.off('searchMessagesError', handleError);
        reject(new Error('Search messages request timed out'));
      }, 10000);
    });
  }

  // Get older messages using WebSocket
  getOlderMessages(
    conversationId: string,
    beforeMessageId: string,
    limit?: number
  ): Promise<{ messages: any[]; hasMore: boolean }> {
    return new Promise((resolve, reject) => {
      // Set up one-time listeners for response
      const handleSuccess = (data: any) => {
        this.off('getOlderMessagesResponse', handleSuccess);
        this.off('getOlderMessagesError', handleError);
        resolve(data);
      };

      const handleError = (error: any) => {
        this.off('getOlderMessagesResponse', handleSuccess);
        this.off('getOlderMessagesError', handleError);
        reject(new Error(error.error || 'Failed to get older messages'));
      };

      // Listen for response
      this.on('getOlderMessagesResponse', handleSuccess);
      this.on('getOlderMessagesError', handleError);

      // Send request
      this.send('getOlderMessages', { conversationId, beforeMessageId, limit });

      // Set timeout to prevent hanging
      setTimeout(() => {
        this.off('getOlderMessagesResponse', handleSuccess);
        this.off('getOlderMessagesError', handleError);
        reject(new Error('Get older messages request timed out'));
      }, 10000);
    });
  }

  private send(event: string, payload: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ event, payload });
      this.ws.send(message);
    } else {
      console.warn('WebSocket not connected, cannot send message:', event);
    }
  }

  // Connection management
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

export const webSocketService = new WebSocketService();
export type {
  UserStatus,
  MessageEvent,
  TypingEvent,
  ReactionEvent,
  WebSocketEventHandler,
};
