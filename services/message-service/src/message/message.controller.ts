import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Headers,
  Query,
  BadRequestException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { MessageService } from "./message.service";
import {
  CreateConversationDto,
  ConversationResponseDto,
} from "../dto/conversation.dto";
import {
  CreateMessageDto,
  MessageResponseDto,
  MarkAsReadDto,
} from "../dto/message.dto";
import { InternalServiceGuard } from "../common/guards/internal-service.guard";

@ApiTags("Internal Messaging")
@Controller("internal/messages")
@UseGuards(InternalServiceGuard)
@ApiBearerAuth()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post("conversations")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Start a new conversation with another user" })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({
    status: 201,
    description: "Conversation created or existing conversation returned",
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid username or cannot message yourself",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async createConversation(
    @Headers("x-user-id") userId: string,
    @Body() createConversationDto: CreateConversationDto
  ): Promise<ConversationResponseDto> {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("User ID is required and cannot be empty");
    }

    return this.messageService.createConversation(
      userId,
      createConversationDto
    );
  }

  @Get("conversations")
  @ApiOperation({ summary: "Get all conversations for the current user" })
  @ApiResponse({
    status: 200,
    description: "List of user conversations",
    type: [ConversationResponseDto],
  })
  async getUserConversations(
    @Headers("x-user-id") userId: string
  ): Promise<ConversationResponseDto[]> {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("User ID is required and cannot be empty");
    }

    return this.messageService.getUserConversations(userId);
  }

  @Get("conversations/:id/messages")
  @ApiOperation({ summary: "Get messages for a specific conversation" })
  @ApiParam({
    name: "id",
    description: "Conversation ID",
    example: "clx1y2z3a4b5c6d7e8f9g0h1",
  })
  @ApiQuery({
    name: "page",
    description: "Page number for pagination",
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    description: "Number of messages per page",
    required: false,
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: "Messages retrieved successfully",
    schema: {
      type: "object",
      properties: {
        messages: {
          type: "array",
          items: { $ref: "#/components/schemas/MessageResponseDto" },
        },
        total: { type: "number", description: "Total number of messages" },
        hasMore: {
          type: "boolean",
          description: "Whether there are more messages",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Conversation not found or access denied",
  })
  async getConversationMessages(
    @Headers("x-user-id") userId: string,
    @Param("id") conversationId: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ): Promise<{
    messages: MessageResponseDto[];
    total: number;
    hasMore: boolean;
  }> {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("User ID is required and cannot be empty");
    }

    return this.messageService.getConversationMessages(
      userId,
      conversationId,
      page || 1,
      limit || 50
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Send a new message" })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({
    status: 201,
    description: "Message sent successfully",
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid message data",
  })
  @ApiResponse({
    status: 404,
    description: "Conversation not found or access denied",
  })
  async sendMessage(
    @Headers("x-user-id") userId: string,
    @Body() createMessageDto: CreateMessageDto
  ): Promise<MessageResponseDto> {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("User ID is required and cannot be empty");
    }

    return this.messageService.sendMessage(userId, createMessageDto);
  }

  @Patch(":id/read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark a message as read or unread" })
  @ApiParam({
    name: "id",
    description: "Message ID",
    example: "clx1y2z3a4b5c6d7e8f9g0h2",
  })
  @ApiBody({ type: MarkAsReadDto })
  @ApiResponse({
    status: 200,
    description: "Message read status updated successfully",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - cannot mark own message as unread",
  })
  @ApiResponse({
    status: 404,
    description: "Message not found",
  })
  @ApiResponse({
    status: 403,
    description: "Access denied to this message",
  })
  async markMessageAsRead(
    @Headers("x-user-id") userId: string,
    @Param("id") messageId: string,
    @Body() markAsReadDto: MarkAsReadDto
  ): Promise<{ success: boolean; message: string }> {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("User ID is required and cannot be empty");
    }

    return this.messageService.markMessageAsRead(
      userId,
      messageId,
      markAsReadDto
    );
  }

  @Patch("conversations/:id/read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark all messages in a conversation as read" })
  @ApiParam({
    name: "id",
    description: "Conversation ID",
    example: "clx1y2z3a4b5c6d7e8f9g0h1",
  })
  @ApiResponse({
    status: 200,
    description: "Conversation messages marked as read successfully",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        updatedCount: { type: "number" },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Conversation not found or access denied",
  })
  async markConversationAsRead(
    @Headers("x-user-id") userId: string,
    @Param("id") conversationId: string
  ): Promise<{ success: boolean; message: string; updatedCount: number }> {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("User ID is required and cannot be empty");
    }

    return this.messageService.markConversationAsRead(userId, conversationId);
  }

  @Get("users/search")
  @ApiOperation({ summary: "Search users for messaging" })
  @ApiQuery({
    name: "q",
    description: "Search query for username, email, first name, or last name",
    required: true,
  })
  @ApiQuery({
    name: "limit",
    description: "Maximum number of results to return",
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Users found successfully",
  })
  async searchUsers(
    @Headers("x-user-id") userId: string,
    @Query("q") query: string,
    @Query("limit") limit?: string
  ) {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("User ID is required and cannot be empty");
    }

    if (!query || query.trim().length < 2) {
      throw new BadRequestException(
        "Search query must be at least 2 characters long"
      );
    }

    const searchLimit = limit ? Math.min(parseInt(limit, 10), 50) : 10;

    return this.messageService.searchUsers(query.trim(), searchLimit, userId);
  }
}
