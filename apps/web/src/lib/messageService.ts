import { webSocketService } from './webSocketService';

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    isOnline?: boolean;
    lastSeen?: string;
  }>;
  lastMessage?: {
    id: string;
    content?: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  content?: string;
  senderId: string;
  conversationId: string;
  createdAt: string;
  isRead: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: Array<{
    id?: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }>;
}

interface SendMessageRequest {
  content?: string;
  conversationId: string;
  attachments?: Array<{
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    metadata?: {
      type: string;
      productId?: string;
      title?: string;
      price?: number;
      currency?: string;
      imageUrl?: string | null;
      username?: string;
      location?: string;
      slug?: string;
    };
  }>;
}

interface CreateConversationRequest {
  username: string; // Should include @
}

class MessageService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }
  private async makeRequest(endpoint: string, method: string, body?: any) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `${this.baseUrl}/api/v1/messages/${endpoint}`,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          ...(body && { body: JSON.stringify(body) }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        if (response.status === 403) {
          throw new Error('Insufficient permissions');
        }
        if (response.status === 404) {
          throw new Error('Not found');
        }
        throw new Error(`Request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error making request to ${endpoint}:`, error);
      throw error;
    }
  }
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await this.makeRequest('conversations', 'GET');
      const rawConversations = response.data || response;

      // Map backend response to frontend Conversation interface
      return rawConversations.map((conv: any) => ({
        id: conv.id,
        participants: conv.participants,
        lastMessage: conv.lastMessage
          ? {
              id: conv.lastMessage.id,
              content: conv.lastMessage.content,
              senderId: conv.lastMessage.senderId,
              createdAt: conv.lastMessage.createdAt,
              isRead: conv.lastMessage.read, // Map backend 'read' to frontend 'isRead'
            }
          : undefined,
        unreadCount: conv.unreadCount,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }
  async createConversation(username: string): Promise<Conversation> {
    try {
      // Ensure username starts with @
      const formattedUsername = username.startsWith('@')
        ? username
        : `@${username}`;

      const response = await this.makeRequest('conversations', 'POST', {
        username: formattedUsername,
      });

      const rawConversation = response.data || response;

      // Map backend response to frontend Conversation interface
      return {
        id: rawConversation.id,
        participants: rawConversation.participants,
        lastMessage: rawConversation.lastMessage
          ? {
              id: rawConversation.lastMessage.id,
              content: rawConversation.lastMessage.content,
              senderId: rawConversation.lastMessage.senderId,
              createdAt: rawConversation.lastMessage.createdAt,
              isRead: rawConversation.lastMessage.read, // Map backend 'read' to frontend 'isRead'
            }
          : undefined,
        unreadCount: rawConversation.unreadCount || 0,
        createdAt: rawConversation.createdAt,
        updatedAt: rawConversation.updatedAt,
      };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }
  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      const response = await this.makeRequest(
        `conversations/${conversationId}/messages?${queryParams.toString()}`,
        'GET'
      );

      const rawMessages = response.data || response.messages || response;

      // Map backend response to frontend Message interface
      return rawMessages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        conversationId: msg.conversationId,
        createdAt: msg.createdAt,
        isRead: msg.read, // Map backend 'read' to frontend 'isRead'
        status: 'delivered' as const, // Will be properly set by convertApiMessage
        attachments: msg.attachments || [],
        sender: msg.sender,
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }
  async sendMessage(
    content: string,
    conversationId: string,
    attachments?: Array<{
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      metadata?: {
        type: string;
        productId?: string;
        title?: string;
        price?: number;
        currency?: string;
        imageUrl?: string | null;
        username?: string;
        location?: string;
        slug?: string;
      };
    }>
  ): Promise<Message> {
    try {
      const payload: SendMessageRequest = {
        conversationId,
        ...(content.trim() && { content: content.trim() }), // Only include content if it's not empty
        ...(attachments && attachments.length > 0 && { attachments }),
      };

      // Use WebSocket for real-time message sending
      return new Promise((resolve, reject) => {
        // Set up one-time listeners for response
        const handleSuccess = (data: any) => {
          if (data.success && data.message) {
            webSocketService.off('sendMessageResponse', handleSuccess);
            webSocketService.off('sendMessageError', handleError);
            resolve(data.message);
          }
        };

        const handleError = (error: any) => {
          webSocketService.off('sendMessageResponse', handleSuccess);
          webSocketService.off('sendMessageError', handleError);
          reject(new Error(error.message || 'Failed to send message'));
        };

        // Listen for response
        webSocketService.on('sendMessageResponse', handleSuccess);
        webSocketService.on('sendMessageError', handleError); // Send message via WebSocket
        webSocketService.sendMessage(payload);

        // Timeout after 10 seconds
        setTimeout(() => {
          webSocketService.off('sendMessageResponse', handleSuccess);
          webSocketService.off('sendMessageError', handleError);
          reject(new Error('Message send timeout'));
        }, 10000);
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async uploadFile(file: File): Promise<{
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }> {
    try {
      const token = await this.getAuthToken();

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not supported');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/api/v1/messages/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        if (response.status === 400) {
          throw new Error('Invalid file type or size');
        }
        throw new Error(`File upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      // Use WebSocket for real-time read status updates
      webSocketService.markAsRead({ messageId, read: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }
  /**
   * Mark all messages in a conversation as read for the current user
   * This should be called when the user opens a conversation
   */
  async markConversationAsRead(conversationId: string): Promise<void> {
    try {
      // First try to use WebSocket for real-time updates
      if (webSocketService.isConnected) {
        webSocketService.markConversationAsRead(conversationId);
      } else {
        // Fallback to HTTP if WebSocket is not connected
        const token = this.getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(
          `${this.baseUrl}/api/v1/messages/conversations/${conversationId}/read`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required');
          }
          if (response.status === 404) {
            throw new Error('Conversation not found');
          }
          throw new Error(
            `Failed to mark conversation as read: ${response.statusText}`
          );
        }
      }

      console.log('✅ Conversation marked as read:', conversationId);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  }
}

export const messageService = new MessageService();
export type {
  Conversation,
  Message,
  SendMessageRequest,
  CreateConversationRequest,
};
