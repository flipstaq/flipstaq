import { Server } from "ws";
import WebSocket from "ws";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { HttpService } from "@nestjs/axios";
import { MessageService } from "../message/message.service";
import { RedisService } from "../redis/redis.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMessageDto } from "../dto/message.dto";
import * as url from "url";
import * as http from "http";

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  username?: string;
  rooms?: Set<string>;
  isAlive?: boolean;
}

@Injectable()
export class MessagingGateway {
  private server: Server;
  private readonly logger = new Logger(MessagingGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket[]>();
  private userRooms = new Map<string, Set<string>>(); // userId -> Set of room names
  private conversationRooms = new Map<string, Set<AuthenticatedSocket>>(); // conversationId -> Set of sockets
  private httpServer: http.Server;
  constructor(
    private readonly messageService: MessageService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService
  ) {}

  // Initialize the WebSocket server
  initialize(httpServer?: http.Server) {
    // Create a separate HTTP server for WebSocket if none provided
    if (!httpServer) {
      this.httpServer = http.createServer();
      const wsPort = 8001; // Dedicated WebSocket port
      this.httpServer.listen(wsPort, () => {
        this.logger.log(`🔌 WebSocket server listening on port ${wsPort}`);
      });
    } else {
      this.httpServer = httpServer;
    }

    // Create WebSocket server
    this.server = new Server({
      server: this.httpServer,
      path: "/ws",
      perMessageDeflate: false,
    });

    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.logger.log("🚀 WebSocket Gateway initialized for messaging");

    // Handle connections
    this.server.on("connection", (socket: AuthenticatedSocket, request) => {
      this.handleConnection(socket, request);
    });

    // Set up heartbeat to detect broken connections
    const interval = setInterval(() => {
      this.server.clients.forEach((ws: AuthenticatedSocket) => {
        if (ws.isAlive === false) {
          this.handleDisconnect(ws);
          return ws.terminate();
        }
        ws.isAlive = false; // Send ping message instead of using ws.ping()
        if (ws.readyState === 1) {
          // WebSocket.OPEN = 1
          ws.send(JSON.stringify({ event: "ping", data: {} }));
        }
      });
    }, 30000);

    this.server.on("close", () => {
      clearInterval(interval);
    });

    // Subscribe to Redis channels for cross-service messaging
    this.redisService.subscribe("new-message", (data) => {
      this.handleRedisNewMessage(data);
    });
  }
  async handleConnection(client: AuthenticatedSocket, request: any) {
    try {
      const token = this.extractTokenFromRequest(request);
      if (!token) {
        this.logger.warn("Connection rejected: No token provided");
        client.close(1008, "Authentication required");
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      }); // Log the payload to see what fields are available
      this.logger.debug("JWT Payload:", JSON.stringify(payload, null, 2));

      client.userId = payload.sub;

      // Get user display name from database
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        });

        this.logger.debug(`User found: ${JSON.stringify(user)}`);

        if (user) {
          // Use firstName + lastName as display name, fallback to username
          if (user.firstName && user.lastName) {
            client.username = `${user.firstName} ${user.lastName}`;
          } else if (user.username) {
            client.username = user.username;
          } else {
            client.username = user.email || payload.email || "unknown";
          }
        } else {
          this.logger.warn(`User not found for ID: ${payload.sub}`);
          client.username = payload.email || "unknown";
        }
      } catch (error) {
        this.logger.error("Error fetching user display name:", error);
        client.username = payload.email || "unknown";
      }
      client.rooms = new Set([`user_${payload.sub}`]);
      client.isAlive = true;

      // Handle pong responses
      client.on("pong", () => {
        client.isAlive = true;
      });

      // Add to connected users map
      if (!this.connectedUsers.has(payload.sub)) {
        this.connectedUsers.set(payload.sub, []);
      }
      this.connectedUsers.get(payload.sub)!.push(client);

      // Add user to their personal room
      this.userRooms.set(payload.sub, new Set([`user_${payload.sub}`]));

      this.logger.log(
        `✅ User ${client.username} (${payload.sub}) connected to messaging`
      );

      // Notify other users that this user is online
      this.broadcastToAllExcept(client, "userOnline", {
        userId: payload.sub,
        username: client.username,
      });

      // Set up message handling
      client.on("message", (data) => {
        this.handleMessage(client, Buffer.from(data as any));
      });
    } catch (error) {
      this.logger.error("❌ WebSocket authentication failed:", error.message);
      client.close(1008, "Authentication failed");
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedUsers.get(client.userId);
      if (userSockets) {
        const index = userSockets.indexOf(client);
        if (index > -1) {
          userSockets.splice(index, 1);
        }

        // If no more sockets for this user, remove from map and mark offline
        if (userSockets.length === 0) {
          this.connectedUsers.delete(client.userId);
          this.userRooms.delete(client.userId);

          // Remove from conversation rooms
          this.conversationRooms.forEach((sockets) => {
            sockets.delete(client);
          });

          // Mark user offline in database
          this.markUserOfflineInDatabase(client.userId);

          // Notify other users that this user is offline
          this.broadcastToAllExcept(client, "userOffline", {
            userId: client.userId,
            username: client.username,
          });
        }
      }

      this.logger.log(
        `❌ User ${client.username} (${client.userId}) disconnected from messaging`
      );
    }
  }
  // Handle incoming WebSocket messages
  private handleMessage(client: AuthenticatedSocket, data: Buffer) {
    try {
      const message = JSON.parse(data.toString());
      const { event, payload } = message;
      switch (event) {
        case "sendMessage":
          this.handleSendMessage(payload, client);
          break;
        case "editMessage":
          this.handleEditMessage(payload, client);
          break;
        case "deleteMessage":
          this.handleDeleteMessage(payload, client);
          break;
        case "markAsRead":
          this.handleMarkAsRead(payload, client);
          break;
        case "markConversationAsRead":
          this.handleMarkConversationAsRead(payload, client);
          break;
        case "joinConversation":
          this.handleJoinConversation(payload, client);
          break;
        case "leaveConversation":
          this.handleLeaveConversation(payload, client);
          break;
        case "typing":
          this.handleTyping(payload, client);
          break;
        case "toggleReaction":
          this.handleToggleReaction(payload, client);
          break;
        case "searchMessages":
          this.handleSearchMessages(payload, client);
          break;
        case "getOlderMessages":
          this.handleGetOlderMessages(payload, client);
          break;
        case "ping":
          // Handle ping from client to keep connection alive
          this.sendToClient(client, { event: "pong", data: {} });
          client.isAlive = true;
          break;
        case "pong":
          // Handle pong response from client
          client.isAlive = true;
          break;
        default:
          this.logger.warn(`Unknown event: ${event}`);
      }
    } catch (error) {
      this.logger.error("Error handling message:", error);
      this.sendToClient(client, { error: "Invalid message format" });
    }
  }
  async handleSendMessage(data: CreateMessageDto, client: AuthenticatedSocket) {
    try {
      if (!client.userId) {
        return this.sendToClient(client, { error: "Authentication required" });
      }

      // Send message through service
      const message = await this.messageService.sendMessage(
        client.userId,
        data
      );

      // Get conversation participants to determine who to notify
      const participants =
        await this.messageService.getConversationParticipants(
          data.conversationId
        );

      // Determine if this is a reply message
      const isReply = !!message.replyToMessageId;
      const eventType = isReply ? "messageReplied" : "newMessage";

      // Emit to conversation participants (excluding sender)
      for (const participant of participants) {
        if (participant.id !== client.userId) {
          this.sendToUser(participant.id, eventType, message);
        }
      }

      // Publish to Redis for potential cross-service notifications
      await this.redisService.publish(
        "new-message",
        JSON.stringify({
          message,
          participants: participants.map((p) => p.id),
          isReply,
        })
      );

      return this.sendToClient(client, { success: true, message });
    } catch (error) {
      this.logger.error("Send message error:", error);
      return this.sendToClient(client, { error: error.message });
    }
  }

  async handleEditMessage(
    data: { messageId: string; content: string; conversationId: string },
    client: AuthenticatedSocket
  ) {
    try {
      if (!client.userId) {
        return this.sendToClient(client, { error: "Authentication required" });
      }

      // Edit message through service
      const editedMessage = await this.messageService.editMessage(
        data.messageId,
        client.userId,
        { content: data.content }
      );

      // Get conversation participants to determine who to notify
      const participants =
        await this.messageService.getConversationParticipants(
          data.conversationId
        );

      // Emit edit event to all conversation participants (including sender for confirmation)
      for (const participant of participants) {
        this.sendToUser(participant.id, "messageEdited", {
          messageId: data.messageId,
          content: data.content,
          editedAt: editedMessage.editedAt,
          conversationId: data.conversationId,
        });
      }

      // Publish to Redis for potential cross-service notifications
      await this.redisService.publish(
        "message-edited",
        JSON.stringify({
          messageId: data.messageId,
          content: data.content,
          editedAt: editedMessage.editedAt,
          conversationId: data.conversationId,
          participants: participants.map((p) => p.id),
        })
      );

      return this.sendToClient(client, {
        success: true,
        message: editedMessage,
      });
    } catch (error) {
      this.logger.error("Edit message error:", error);
      return this.sendToClient(client, { error: error.message });
    }
  }

  async handleDeleteMessage(
    data: { messageId: string; conversationId: string },
    client: AuthenticatedSocket
  ) {
    try {
      if (!client.userId) {
        return this.sendToClient(client, { error: "Authentication required" });
      }

      // Delete message through service
      await this.messageService.deleteMessage(data.messageId, client.userId);

      // Get conversation participants to notify about deletion
      const participants =
        await this.messageService.getConversationParticipants(
          data.conversationId
        );

      // Emit deletion event to all conversation participants
      for (const participant of participants) {
        this.sendToUser(participant.id, "messageDeleted", {
          messageId: data.messageId,
          conversationId: data.conversationId,
          deletedBy: client.userId,
        });
      }

      // Publish to Redis for potential cross-service notifications
      await this.redisService.publish(
        "message-deleted",
        JSON.stringify({
          messageId: data.messageId,
          conversationId: data.conversationId,
          deletedBy: client.userId,
          participants: participants.map((p) => p.id),
        })
      );

      return this.sendToClient(client, { success: true });
    } catch (error) {
      this.logger.error("Delete message error:", error);
      return this.sendToClient(client, { error: error.message });
    }
  }

  async handleMarkAsRead(
    data: { messageId: string; read?: boolean },
    client: AuthenticatedSocket
  ) {
    try {
      if (!client.userId) {
        return this.sendToClient(client, { error: "Authentication required" });
      }

      const result = await this.messageService.markMessageAsRead(
        client.userId,
        data.messageId,
        { read: data.read }
      );

      // Notify the user about read status change
      this.sendToUser(client.userId, "messageReadStatusChanged", {
        messageId: data.messageId,
        read: data.read ?? true,
      });

      return this.sendToClient(client, { success: true, result });
    } catch (error) {
      this.logger.error("Mark as read error:", error);
      return this.sendToClient(client, { error: error.message });
    }
  }
  async handleMarkConversationAsRead(
    data: { conversationId: string },
    client: AuthenticatedSocket
  ) {
    try {
      if (!client.userId) {
        return this.sendToClient(client, { error: "Authentication required" });
      }

      const result = await this.messageService.markConversationAsRead(
        client.userId,
        data.conversationId
      );

      // Send individual message read status changes for each message that was marked as read
      if (result.messageIds && result.messageIds.length > 0) {
        result.messageIds.forEach((messageId) => {
          this.sendToConversation(
            data.conversationId,
            "messageReadStatusChanged",
            {
              messageId,
              read: true,
              readBy: client.userId,
            }
          );
        });
      }

      // Notify all participants in the conversation about the read status change
      // This helps update read receipts and unread counts in real-time
      this.sendToConversation(
        data.conversationId,
        "conversationReadStatusChanged",
        {
          conversationId: data.conversationId,
          userId: client.userId,
          updatedCount: result.updatedCount,
        }
      );

      return this.sendToClient(client, { success: true, result });
    } catch (error) {
      this.logger.error("Mark conversation as read error:", error);
      return this.sendToClient(client, { error: error.message });
    }
  }
  async handleJoinConversation(
    data: { conversationId: string },
    client: AuthenticatedSocket
  ) {
    try {
      if (!client.userId) {
        return this.sendToClient(client, { error: "Authentication required" });
      }

      // Add client to conversation room
      const roomKey = `conversation_${data.conversationId}`;
      if (!this.conversationRooms.has(roomKey)) {
        this.conversationRooms.set(roomKey, new Set());
      }
      this.conversationRooms.get(roomKey)!.add(client);
      client.rooms?.add(roomKey);

      this.logger.log(
        `User ${client.username} joined conversation ${data.conversationId}`
      );

      return this.sendToClient(client, {
        success: true,
        message: "Joined conversation",
      });
    } catch (error) {
      this.logger.error("Join conversation error:", error);
      return this.sendToClient(client, { error: error.message });
    }
  }
  async handleLeaveConversation(
    data: { conversationId: string },
    client: AuthenticatedSocket
  ) {
    try {
      if (!client.userId) {
        return this.sendToClient(client, { error: "Authentication required" });
      }

      // Remove client from conversation room
      const roomKey = `conversation_${data.conversationId}`;
      const room = this.conversationRooms.get(roomKey);
      if (room) {
        room.delete(client);
        if (room.size === 0) {
          this.conversationRooms.delete(roomKey);
        }
      }
      client.rooms?.delete(roomKey);

      this.logger.log(
        `User ${client.username} left conversation ${data.conversationId}`
      );

      return this.sendToClient(client, {
        success: true,
        message: "Left conversation",
      });
    } catch (error) {
      this.logger.error("Leave conversation error:", error);
      return this.sendToClient(client, { error: error.message });
    }
  }
  async handleTyping(
    data: { conversationId: string; isTyping: boolean },
    client: AuthenticatedSocket
  ) {
    try {
      if (!client.userId) {
        return;
      }

      // Emit typing status to conversation participants (except sender)
      this.sendToConversation(
        data.conversationId,
        "userTyping",
        {
          userId: client.userId,
          username: client.username,
          conversationId: data.conversationId,
          isTyping: data.isTyping,
        },
        client
      );
    } catch (error) {
      this.logger.error("Typing event error:", error);
    }
  }

  async handleToggleReaction(
    data: { messageId: string; emoji: string },
    client: AuthenticatedSocket
  ) {
    try {
      if (!client.userId) {
        return this.sendToClient(client, { error: "Authentication required" });
      }

      // Toggle reaction through service
      const result = await this.messageService.toggleReaction(
        data.messageId,
        client.userId,
        data.emoji
      );

      // Get the message to find conversation ID and participants
      const message = await this.prisma.message.findFirst({
        where: { id: data.messageId },
        select: { conversationId: true },
      });

      if (!message) {
        return this.sendToClient(client, { error: "Message not found" });
      }

      // Get conversation participants to notify about reaction
      const participants =
        await this.messageService.getConversationParticipants(
          message.conversationId
        );

      // Prepare reaction event data
      const reactionEventData = {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: client.userId,
        username: client.username,
        action: result.action,
        reaction: result.reaction,
      };

      // Emit reaction event to all conversation participants
      for (const participant of participants) {
        this.sendToUser(participant.id, "messageReaction", reactionEventData);
      }

      // Publish to Redis for cross-service notifications
      await this.redisService.publish(
        "message-reaction",
        JSON.stringify({
          ...reactionEventData,
          conversationId: message.conversationId,
          participants: participants.map((p) => p.id),
        })
      );

      return this.sendToClient(client, { success: true, ...result });
    } catch (error) {
      this.logger.error("Toggle reaction error:", error);
      return this.sendToClient(client, { error: error.message });
    }
  }

  async handleSearchMessages(
    data: { conversationId: string; query: string; limit?: number },
    client: AuthenticatedSocket
  ) {
    try {
      if (!client.userId) {
        return this.sendToClient(client, {
          event: "searchMessagesError",
          error: "Authentication required",
        });
      } // Search messages through service
      const result = await this.messageService.searchMessages(
        client.userId,
        data.conversationId,
        data.query,
        data.limit || 100
      );

      console.log(
        `✅ Backend: Found ${result.total} results, returning ${result.messages.length} messages`
      );

      // Send results back to client as searchMessagesResponse event
      return this.sendToClient(client, {
        event: "searchMessagesResponse",
        data: result,
      });
    } catch (error) {
      this.logger.error("Search messages error:", error);
      return this.sendToClient(client, {
        event: "searchMessagesError",
        error: error.message,
      });
    }
  }

  async handleGetOlderMessages(
    data: { conversationId: string; beforeMessageId: string; limit?: number },
    client: AuthenticatedSocket
  ) {
    try {
      if (!client.userId) {
        return this.sendToClient(client, {
          event: "getOlderMessagesError",
          error: "Authentication required",
        });
      }

      // Get older messages through service
      const result = await this.messageService.getOlderMessages(
        client.userId,
        data.conversationId,
        data.beforeMessageId,
        data.limit || 50
      );

      // Send results back to client
      return this.sendToClient(client, {
        event: "getOlderMessagesResponse",
        data: result,
      });
    } catch (error) {
      this.logger.error("Get older messages error:", error);
      return this.sendToClient(client, {
        event: "getOlderMessagesError",
        error: error.message,
      });
    }
  }

  // Helper methods for WebSocket communication
  private sendToClient(client: AuthenticatedSocket, data: any) {
    if (client.readyState === 1) {
      // WebSocket.OPEN = 1
      client.send(JSON.stringify(data));
    }
  }
  private sendToUser(userId: string, event: string, data: any) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.forEach((socket) => {
        if (socket.readyState === 1) {
          // WebSocket.OPEN = 1
          socket.send(JSON.stringify({ event, data }));
        }
      });
    }
  }
  private sendToConversation(
    conversationId: string,
    event: string,
    data: any,
    exclude?: AuthenticatedSocket
  ) {
    const roomKey = `conversation_${conversationId}`;
    const room = this.conversationRooms.get(roomKey);
    if (room) {
      room.forEach((socket) => {
        if (socket !== exclude && socket.readyState === 1) {
          // WebSocket.OPEN = 1
          socket.send(JSON.stringify({ event, data }));
        }
      });
    }
  }
  private broadcastToAllExcept(
    exclude: AuthenticatedSocket,
    event: string,
    data: any
  ) {
    this.connectedUsers.forEach((sockets) => {
      sockets.forEach((socket) => {
        if (socket !== exclude && socket.readyState === 1) {
          // WebSocket.OPEN = 1
          socket.send(JSON.stringify({ event, data }));
        }
      });
    });
  }

  // Helper method to extract JWT token from request
  private extractTokenFromRequest(request: any): string | null {
    const url_parts = url.parse(request.url, true);
    const token = url_parts.query.token as string;

    if (token) {
      return token;
    }

    // Also check headers
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    return null;
  }
  // Handle messages from Redis (for cross-service communication)
  private handleRedisNewMessage(data: any) {
    const { message, participants, isReply } = data;
    const eventType = isReply ? "messageReplied" : "newMessage";

    // Emit to connected participants
    for (const participantId of participants) {
      this.sendToUser(participantId, eventType, message);
    }
  }

  // Public method to check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Public method to get online users count
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Mark user offline in database
  private async markUserOfflineInDatabase(userId: string): Promise<void> {
    try {
      const userServiceUrl =
        this.configService.get<string>("USER_SERVICE_URL") ||
        "http://localhost:3003";
      await this.httpService.axiosRef.post(
        `${userServiceUrl}/internal/users/offline/${userId}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Failed to mark user offline in database:", error.message);
    }
  }
  // Shutdown method for clean cleanup
  shutdown() {
    if (this.server) {
      this.server.close(() => {
        this.logger.log("🔌 WebSocket server closed");
      });
    }
    if (this.httpServer) {
      this.httpServer.close(() => {
        this.logger.log("🔌 HTTP server closed");
      });
    }
  }
}
