import { Server } from "ws";
import WebSocket from "ws";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { HttpService } from "@nestjs/axios";
import { MessageService } from "../message/message.service";
import { RedisService } from "../redis/redis.service";
import { CreateMessageDto } from "../dto/message.dto";
import * as url from "url";
import * as http from "http";

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  username?: string;
  rooms?: Set<string>;
  isAlive?: boolean;
}

export class StandaloneWebSocketServer {
  private server: Server;
  private readonly logger = new Logger(StandaloneWebSocketServer.name);
  private connectedUsers = new Map<string, AuthenticatedSocket[]>();
  private userRooms = new Map<string, Set<string>>(); // userId -> Set of room names
  private conversationRooms = new Map<string, Set<AuthenticatedSocket>>(); // conversationId -> Set of sockets
  private httpServer: http.Server;

  constructor(
    private readonly messageService: MessageService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
    private readonly jwtSecret: string
  ) {}

  // Initialize the WebSocket server
  initialize(port: number = 8001) {
    // Create a separate HTTP server for WebSocket
    this.httpServer = http.createServer();
    this.httpServer.listen(port, () => {
      this.logger.log(`🔌 WebSocket server listening on port ${port}`);
    });

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
        ws.isAlive = false;
        // Send ping message instead of using ws.ping()
        if (ws.readyState === WebSocket.OPEN) {
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
        secret: this.jwtSecret,
      });

      client.userId = payload.sub;
      client.username = payload.username;
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
        `✅ User ${payload.username} (${payload.sub}) connected to messaging`
      );

      // Notify other users that this user is online
      this.broadcastToAllExcept(client, "userOnline", {
        userId: payload.sub,
        username: payload.username,
      });

      // Set up message handling
      client.on("message", (data) => {
        this.handleMessage(client, Buffer.from(data as any));
      });

      client.on("close", () => {
        this.handleDisconnect(client);
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
        case "markAsRead":
          this.handleMarkAsRead(payload, client);
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

      // Emit to conversation participants
      for (const participant of participants) {
        this.sendToUser(participant.id, "newMessage", message);
      }

      // Publish to Redis for potential cross-service notifications
      await this.redisService.publish(
        "new-message",
        JSON.stringify({
          message,
          participants: participants.map((p) => p.id),
        })
      );

      return this.sendToClient(client, { success: true, message });
    } catch (error) {
      this.logger.error("Send message error:", error);
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

  // Helper methods for WebSocket communication
  private sendToClient(client: AuthenticatedSocket, data: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }

  private sendToUser(userId: string, event: string, data: any) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.forEach((socket) => {
        if (socket.readyState === WebSocket.OPEN) {
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
        if (socket !== exclude && socket.readyState === WebSocket.OPEN) {
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
        if (socket !== exclude && socket.readyState === WebSocket.OPEN) {
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
    const { message, participants } = data;

    // Emit to connected participants
    for (const participantId of participants) {
      this.sendToUser(participantId, "newMessage", message);
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

  // Mark user offline in database
  private async markUserOfflineInDatabase(userId: string): Promise<void> {
    try {
      const userServiceUrl = "http://localhost:3001"; // User service URL
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
}
