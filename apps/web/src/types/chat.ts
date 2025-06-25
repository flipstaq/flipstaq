export interface MessageAttachment {
  id?: string;
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
}

export interface Conversation {
  id: string;
  participant: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: Date;
  };
  lastMessage?: {
    id: string;
    content?: string;
    senderId: string;
    createdAt: Date;
    isRead: boolean;
  };
  unreadCount: number;
  updatedAt: Date;
}

export interface Message {
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
  createdAt: Date;
  editedAt?: Date;
  isRead: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: MessageAttachment[];
}
