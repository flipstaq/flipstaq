import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateConversationDto,
  ConversationResponseDto,
} from "../dto/conversation.dto";
import {
  CreateMessageDto,
  MessageResponseDto,
  MarkAsReadDto,
} from "../dto/message.dto";

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new conversation between two users
   */
  async createConversation(
    userId: string,
    createConversationDto: CreateConversationDto
  ): Promise<ConversationResponseDto> {
    const { username } = createConversationDto;

    // Remove @ prefix if present
    const cleanUsername = username.startsWith("@")
      ? username.slice(1)
      : username;

    // Find the target user
    const targetUser = await this.prisma.user.findUnique({
      where: { username: cleanUsername },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException(
        `User with username @${cleanUsername} not found`
      );
    }

    if (!targetUser.isActive) {
      throw new BadRequestException(
        `User @${cleanUsername} is not available for messaging`
      );
    }

    if (targetUser.id === userId) {
      throw new BadRequestException("Cannot create conversation with yourself");
    }

    // Check if conversation already exists between these users
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            id: {
              in: [userId, targetUser.id],
            },
          },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            read: true,
          },
        },
      },
    });

    if (existingConversation) {
      // Return existing conversation
      const unreadCount = await this.prisma.message.count({
        where: {
          conversationId: existingConversation.id,
          senderId: { not: userId },
          read: false,
        },
      });

      return {
        id: existingConversation.id,
        participants: existingConversation.participants,
        lastMessage: existingConversation.messages[0] || null,
        unreadCount,
        createdAt: existingConversation.createdAt,
        updatedAt: existingConversation.updatedAt,
      };
    }

    // Create new conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        participants: {
          connect: [{ id: userId }, { id: targetUser.id }],
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
    });

    return {
      id: conversation.id,
      participants: conversation.participants,
      lastMessage: null,
      unreadCount: 0,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(
    userId: string
  ): Promise<ConversationResponseDto[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: userId },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            read: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Get unread counts for each conversation
    const conversationIds = conversations.map((c) => c.id);
    const unreadCounts = await Promise.all(
      conversationIds.map(async (conversationId) => {
        const count = await this.prisma.message.count({
          where: {
            conversationId,
            senderId: { not: userId },
            read: false,
          },
        });
        return { conversationId, count };
      })
    );

    const unreadMap = unreadCounts.reduce(
      (acc, { conversationId, count }) => {
        acc[conversationId] = count;
        return acc;
      },
      {} as Record<string, number>
    );

    return conversations.map((conversation) => ({
      id: conversation.id,
      participants: conversation.participants,
      lastMessage: conversation.messages[0] || null,
      unreadCount: unreadMap[conversation.id] || 0,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    }));
  }

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(
    userId: string,
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: MessageResponseDto[];
    total: number;
    hasMore: boolean;
  }> {
    // Verify user is participant in conversation
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { id: userId },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found or access denied");
    }

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          attachments: {
            select: {
              id: true,
              fileName: true,
              fileType: true,
              fileSize: true,
              fileUrl: true,
              metadata: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      this.prisma.message.count({
        where: { conversationId },
      }),
    ]);
    return {
      messages: messages.reverse().map((message) => ({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        conversationId: message.conversationId,
        attachments: message.attachments?.map((att) => ({
          id: att.id,
          fileUrl: att.fileUrl,
          fileName: att.fileName,
          fileType: att.fileType,
          fileSize: att.fileSize,
          metadata: att.metadata as any,
        })),
        read: message.read,
        createdAt: message.createdAt,
        sender: message.sender,
      })), // Reverse to show oldest first
      total,
      hasMore: skip + messages.length < total,
    };
  }

  /**
   * Send a new message
   */ async sendMessage(
    userId: string,
    createMessageDto: CreateMessageDto
  ): Promise<MessageResponseDto> {
    const { content, conversationId, attachments } = createMessageDto;

    // Validate that either content or attachments are provided
    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      throw new BadRequestException(
        "Message must contain either text content or file attachments"
      );
    }

    // Validate max attachments limit
    if (attachments && attachments.length > 10) {
      throw new BadRequestException(
        "Maximum 10 attachments allowed per message"
      );
    }

    // Verify user is participant in conversation
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { id: userId },
        },
      },
      include: {
        participants: {
          select: { id: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found or access denied");
    } // Create the message with attachments
    const message = await this.prisma.message.create({
      data: {
        content: content || null,
        senderId: userId,
        conversationId,
        attachments: attachments?.length
          ? {
              create: attachments.map((att) => ({
                fileUrl: att.fileUrl,
                fileName: att.fileName,
                fileType: att.fileType,
                fileSize: att.fileSize,
                metadata: att.metadata || null,
              })),
            }
          : undefined,
      },
      include: {
        sender: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
        attachments: true,
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      conversationId: message.conversationId,
      attachments: message.attachments?.map((att) => ({
        id: att.id,
        fileUrl: att.fileUrl,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        metadata: att.metadata as any,
      })),
      read: message.read,
      createdAt: message.createdAt,
      sender: message.sender,
    };
  }

  /**
   * Mark a message as read/unread
   */
  async markMessageAsRead(
    userId: string,
    messageId: string,
    markAsReadDto: MarkAsReadDto
  ): Promise<{ success: boolean; message: string }> {
    const { read = true } = markAsReadDto;

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    // Verify user is participant in conversation
    const isParticipant = message.conversation.participants.some(
      (p) => p.id === userId
    );
    if (!isParticipant) {
      throw new ForbiddenException("Access denied to this message");
    }

    // Don't allow sender to mark their own message as unread
    if (message.senderId === userId && !read) {
      throw new BadRequestException("Cannot mark your own message as unread");
    }

    // Update message read status
    await this.prisma.message.update({
      where: { id: messageId },
      data: { read },
    });

    return {
      success: true,
      message: `Message marked as ${read ? "read" : "unread"}`,
    };
  }

  /**
   * Mark all messages in a conversation as read for the current user
   */
  async markConversationAsRead(
    userId: string,
    conversationId: string
  ): Promise<{ success: boolean; message: string; updatedCount: number }> {
    // Verify user is participant in conversation
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { id: userId },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation not found or access denied");
    }

    // Mark all messages from other users as read
    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    });

    return {
      success: true,
      message: `Marked ${result.count} messages as read`,
      updatedCount: result.count,
    };
  }

  /**
   * Get user by username (helper method for WebSocket gateway)
   */
  async getUserByUsername(username: string) {
    const cleanUsername = username.startsWith("@")
      ? username.slice(1)
      : username;
    return this.prisma.user.findUnique({
      where: { username: cleanUsername },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
  }

  /**
   * Get conversation participants (helper method for WebSocket gateway)
   */
  async getConversationParticipants(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: { id: true, username: true },
        },
      },
    });

    return conversation?.participants || [];
  }

  /**
   * Get conversation by ID (helper method for WebSocket gateway)
   */
  async getConversationById(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: { id: true, username: true },
        },
      },
    });
  }

  /**
   * Search for users by query
   */
  async searchUsers(query: string, limit: number = 10, currentUserId: string) {
    // Use Prisma to search for users
    const users = await this.prisma.user.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        id: { not: currentUserId }, // Exclude current user
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        country: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      take: limit,
      orderBy: [{ username: "asc" }, { firstName: "asc" }],
    });

    return users;
  }
}
