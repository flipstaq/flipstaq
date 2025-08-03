import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Headers,
  Query,
  BadRequestException,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { MessageService } from "./message.service";
import {
  CreateConversationDto,
  ConversationResponseDto,
} from "../dto/conversation.dto";
import {
  CreateMessageDto,
  MessageResponseDto,
  MarkAsReadDto,
  EditMessageDto,
  CreateReactionDto,
  MessageReactionDto,
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

  @Patch("messages/:id/delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a message (soft delete)" })
  @ApiParam({
    name: "id",
    description: "The ID of the message to delete",
    type: "string",
  })
  @ApiResponse({
    status: 204,
    description: "Message deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Message not found",
  })
  @ApiResponse({
    status: 403,
    description: "Cannot delete message - not the sender",
  })
  async deleteMessage(
    @Headers("x-user-id") userId: string,
    @Param("id") messageId: string
  ) {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("User ID is required and cannot be empty");
    }

    await this.messageService.deleteMessage(messageId, userId);
  }

  @Patch("messages/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Edit a message" })
  @ApiParam({
    name: "id",
    description: "The ID of the message to edit",
    type: "string",
  })
  @ApiBody({ type: EditMessageDto })
  @ApiResponse({
    status: 200,
    description: "Message edited successfully",
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Message not found",
  })
  @ApiResponse({
    status: 403,
    description: "Cannot edit message - not the sender or message too old",
  })
  @ApiResponse({
    status: 400,
    description: "Cannot edit deleted message",
  })
  async editMessage(
    @Headers("x-user-id") userId: string,
    @Param("id") messageId: string,
    @Body() editMessageDto: EditMessageDto
  ): Promise<MessageResponseDto> {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("User ID is required and cannot be empty");
    }
    return await this.messageService.editMessage(
      messageId,
      userId,
      editMessageDto
    );
  }

  @Post(":id/reactions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Toggle a reaction on a message" })
  @ApiParam({
    name: "id",
    description: "Message ID",
    type: "string",
  })
  @ApiBody({ type: CreateReactionDto })
  @ApiResponse({
    status: 200,
    description: "Reaction toggled successfully",
    schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["added", "removed"],
        },
        reaction: {
          $ref: "#/components/schemas/MessageReactionDto",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Message not found",
  })
  @ApiResponse({
    status: 403,
    description: "Access denied - not a conversation participant",
  })
  async toggleReaction(
    @Headers("x-user-id") userId: string,
    @Param("id") messageId: string,
    @Body() createReactionDto: CreateReactionDto
  ): Promise<{ action: "added" | "removed"; reaction?: MessageReactionDto }> {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("User ID is required and cannot be empty");
    }

    return await this.messageService.toggleReaction(
      messageId,
      userId,
      createReactionDto.emoji
    );
  }

  @Get(":id/reactions")
  @ApiOperation({ summary: "Get all reactions for a message" })
  @ApiParam({
    name: "id",
    description: "Message ID",
    type: "string",
  })
  @ApiResponse({
    status: 200,
    description: "Reactions retrieved successfully",
    type: [MessageReactionDto],
  })
  @ApiResponse({
    status: 404,
    description: "Message not found",
  })
  async getMessageReactions(
    @Param("id") messageId: string
  ): Promise<MessageReactionDto[]> {
    return await this.messageService.getMessageReactions(messageId);
  }

  @Get("conversations/:id/messages/older")
  @ApiOperation({ summary: "Get older messages for infinite scroll" })
  @ApiParam({
    name: "id",
    description: "Conversation ID",
    example: "clx1y2z3a4b5c6d7e8f9g0h1",
  })
  @ApiQuery({
    name: "before",
    description: "Message ID to fetch messages before (cursor)",
    required: true,
    example: "clx1y2z3a4b5c6d7e8f9g0h5",
  })
  @ApiQuery({
    name: "limit",
    description: "Number of messages to fetch",
    required: false,
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: "Older messages retrieved successfully",
    schema: {
      type: "object",
      properties: {
        messages: {
          type: "array",
          items: { $ref: "#/components/schemas/MessageResponseDto" },
        },
        hasMore: {
          type: "boolean",
          description: "Whether there are more older messages",
        },
      },
    },
  })
  async getOlderMessages(
    @Headers("x-user-id") userId: string,
    @Param("id") conversationId: string,
    @Query("before") beforeMessageId: string,
    @Query("limit") limit?: number
  ): Promise<{
    messages: MessageResponseDto[];
    hasMore: boolean;
  }> {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("User ID is required and cannot be empty");
    }

    return this.messageService.getOlderMessages(
      userId,
      conversationId,
      beforeMessageId,
      limit || 50
    );
  }

  @Get("search")
  @ApiOperation({ summary: "Search messages in a conversation" })
  @ApiQuery({
    name: "conversationId",
    description: "Conversation ID to search in",
    required: true,
    example: "clx1y2z3a4b5c6d7e8f9g0h1",
  })
  @ApiQuery({
    name: "query",
    description: "Search query string",
    required: true,
    example: "product available",
  })
  @ApiQuery({
    name: "limit",
    description: "Number of results to return",
    required: false,
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: "Search results retrieved successfully",
    schema: {
      type: "object",
      properties: {
        messages: {
          type: "array",
          items: { $ref: "#/components/schemas/MessageResponseDto" },
        },
        total: {
          type: "number",
          description: "Total number of matching messages",
        },
      },
    },
  })
  async searchMessages(
    @Headers("x-user-id") userId: string,
    @Query("conversationId") conversationId: string,
    @Query("query") query: string,
    @Query("limit") limit?: number
  ): Promise<{
    messages: MessageResponseDto[];
    total: number;
  }> {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("User ID is required and cannot be empty");
    }

    if (!query?.trim()) {
      throw new BadRequestException("Search query is required");
    }

    return this.messageService.searchMessages(
      userId,
      conversationId,
      query.trim(),
      limit || 100
    );
  }

  @Post("upload")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads/messages",
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
          "application/pdf",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException("File type not allowed"), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    })
  )
  @ApiOperation({ summary: "Upload a file for messaging" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "File to upload (max 10MB)",
        },
      },
      required: ["file"],
    },
  })
  @ApiResponse({
    status: 201,
    description: "File uploaded successfully",
    schema: {
      type: "object",
      properties: {
        fileUrl: { type: "string" },
        fileName: { type: "string" },
        fileType: { type: "string" },
        fileSize: { type: "number" },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid file type or size too large",
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // Create the file URL that will be accessible through the API Gateway
    // Return relative URL since files should be served through API Gateway
    const fileUrl = `/uploads/messages/${file.filename}`;

    return {
      fileUrl,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    };
  }
}
