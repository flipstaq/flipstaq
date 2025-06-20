import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { ProxyService } from "../proxy/proxy.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    username: string;
    role: string;
  };
}

@ApiTags("Messaging")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("messages")
export class MessageGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post("conversations")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Start a new conversation with another user" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description:
            "Username of the user to start conversation with (with @)",
          example: "@johndoe",
        },
      },
      required: ["username"],
    },
  })
  @ApiResponse({
    status: 201,
    description: "Conversation created or existing conversation returned",
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
    @Body() body: { username: string },
    @Request() req: AuthenticatedRequest
  ) {
    const response = await this.proxyService.forwardRequest(
      "MESSAGE",
      "messages/conversations",
      "POST",
      body,
      {
        "x-user-id": req.user.sub,
      }
    );
    return response.data;
  }

  @Get("conversations")
  @ApiOperation({ summary: "Get all conversations for the current user" })
  @ApiResponse({
    status: 200,
    description: "List of user conversations",
  })
  async getUserConversations(@Request() req: AuthenticatedRequest) {
    const response = await this.proxyService.forwardRequest(
      "MESSAGE",
      "messages/conversations",
      "GET",
      null,
      {
        "x-user-id": req.user.sub,
      }
    );
    return response.data;
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
  })
  @ApiResponse({
    status: 404,
    description: "Conversation not found or access denied",
  })
  async getConversationMessages(
    @Param("id") conversationId: string,
    @Request() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append("page", page.toString());
    if (limit) queryParams.append("limit", limit.toString());
    const endpoint = `messages/conversations/${conversationId}/messages${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;

    const response = await this.proxyService.forwardRequest(
      "MESSAGE",
      endpoint,
      "GET",
      null,
      {
        "x-user-id": req.user.sub,
      }
    );
    return response.data;
  }

  @Post("upload")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, join(process.cwd(), "src", "uploads", "messages"));
        },
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
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // Create the file URL relative to the API gateway
    const fileUrl = `/uploads/messages/${file.filename}`;

    return {
      fileUrl,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    };
  }
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Send a new message" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Message content (optional if attachments are provided)",
          example: "Hello! Is this product still available?",
        },
        conversationId: {
          type: "string",
          description: "Conversation ID where to send the message",
          example: "clx1y2z3a4b5c6d7e8f9g0h1",
        },
        attachments: {
          type: "array",
          description: "Array of file attachments (max 10 files)",
          maxItems: 10,
          items: {
            type: "object",
            properties: {
              fileUrl: {
                type: "string",
                description:
                  "URL of the uploaded file (optional for product covers)",
                example: "/uploads/messages/1703123456789-987654321.jpg",
              },
              fileName: {
                type: "string",
                description: "Original file name",
                example: "product-photo.jpg",
              },
              fileType: {
                type: "string",
                description: "MIME type of the file",
                example: "image/jpeg",
              },
              fileSize: {
                type: "number",
                description: "File size in bytes",
                example: 245760,
              },
              metadata: {
                type: "object",
                description: "Additional metadata for special attachment types",
                properties: {
                  type: { type: "string" },
                  productId: { type: "string" },
                  title: { type: "string" },
                  price: { type: "number" },
                  currency: { type: "string" },
                  imageUrl: { type: "string" },
                  username: { type: "string" },
                  location: { type: "string" },
                  slug: { type: "string" },
                },
                example: {
                  type: "product-cover",
                  productId: "clx1y2z3a4b5c6d7e8f9g0h1",
                  title: "iPhone 15 Pro Max",
                  price: 1200,
                  currency: "USD",
                  imageUrl: "/uploads/products/iphone-15.jpg",
                  username: "seller123",
                  location: "New York",
                  slug: "iphone-15-pro-max",
                },
              },
            },
            required: ["fileName", "fileType", "fileSize"],
          },
        },
        // Legacy support (deprecated)
        fileUrl: {
          type: "string",
          description:
            "URL of uploaded file (deprecated: use attachments array)",
          example: "/uploads/messages/1703123456789-987654321.jpg",
        },
        fileName: {
          type: "string",
          description: "Original file name (deprecated: use attachments array)",
          example: "product-photo.jpg",
        },
        fileType: {
          type: "string",
          description:
            "MIME type of the file (deprecated: use attachments array)",
          example: "image/jpeg",
        },
        fileSize: {
          type: "number",
          description: "File size in bytes (deprecated: use attachments array)",
          example: 245760,
        },
      },
      required: ["conversationId"],
    },
  })
  @ApiResponse({
    status: 201,
    description: "Message sent successfully",
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
    @Body()
    body: {
      content?: string;
      conversationId: string;
      attachments?: Array<{
        fileName: string;
        fileType: string;
        fileSize: number;
        fileUrl: string;
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
      // Legacy support (deprecated)
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    },
    @Request() req: AuthenticatedRequest
  ) {
    // Convert legacy file format to attachments array for backward compatibility
    if (body.fileUrl && !body.attachments) {
      body.attachments = [
        {
          fileName: body.fileName || "unknown",
          fileType: body.fileType || "application/octet-stream",
          fileSize: body.fileSize || 0,
          fileUrl: body.fileUrl,
        },
      ];
      // Remove legacy fields
      delete body.fileUrl;
      delete body.fileName;
      delete body.fileType;
      delete body.fileSize;
    }

    const response = await this.proxyService.forwardRequest(
      "MESSAGE",
      "messages",
      "POST",
      body,
      {
        "x-user-id": req.user.sub,
      }
    );
    return response.data;
  }

  @Patch(":id/read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark a message as read or unread" })
  @ApiParam({
    name: "id",
    description: "Message ID",
    example: "clx1y2z3a4b5c6d7e8f9g0h2",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        read: {
          type: "boolean",
          description: "Whether to mark as read or unread",
          example: true,
          default: true,
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Message read status updated successfully",
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
    @Param("id") messageId: string,
    @Body() body: { read?: boolean },
    @Request() req: AuthenticatedRequest
  ) {
    const response = await this.proxyService.forwardRequest(
      "MESSAGE",
      `messages/${messageId}/read`,
      "PATCH",
      body,
      {
        "x-user-id": req.user.sub,
      }
    );
    return response.data;
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
  })
  @ApiResponse({
    status: 404,
    description: "Conversation not found or access denied",
  })
  async markConversationAsRead(
    @Param("id") conversationId: string,
    @Request() req: AuthenticatedRequest
  ) {
    const response = await this.proxyService.forwardRequest(
      "MESSAGE",
      `messages/conversations/${conversationId}/read`,
      "PATCH",
      {},
      {
        "x-user-id": req.user.sub,
      }
    );
    return response.data;
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
    description: "Maximum number of results to return (max 50)",
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Users found successfully",
  })
  async searchUsers(
    @Query("q") query: string,
    @Request() req: AuthenticatedRequest,
    @Query("limit") limit?: string
  ) {
    const response = await this.proxyService.forwardRequest(
      "MESSAGE",
      `messages/users/search?q=${encodeURIComponent(query)}${
        limit ? `&limit=${limit}` : ""
      }`,
      "GET",
      null,
      {
        "x-user-id": req.user.sub,
      }
    );
    return response.data;
  }
}
