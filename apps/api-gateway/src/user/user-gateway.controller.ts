import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { ProxyService } from "../proxy/proxy.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { GetUsersQueryDto } from "./dto/get-users-query.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import {
  UserResponseDto,
  PaginatedUsersResponseDto,
} from "./dto/user-response.dto";

interface AuthenticatedRequest extends Request {
  user?: {
    userId?: string;
    sub?: string;
    role: string;
    email: string;
  };
}

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UserGatewayController {
  constructor(private readonly proxyService: ProxyService) {}
  @Get()
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Get all users (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Users retrieved successfully",
    type: PaginatedUsersResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async getUsers(
    @Query() query: GetUsersQueryDto,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Add user information to headers for the microservice
      const userHeaders = {
        "x-user-id": req.user?.userId || req.user?.sub || "",
        "x-user-email": req.user?.email || "",
        "x-user-role": req.user?.role || "",
      };

      const response = await this.proxyService.forwardUserRequest(
        "",
        "GET",
        null,
        {
          ...(req.headers as unknown as Record<string, string>),
          ...userHeaders,
        },
        query
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || "Failed to retrieve users",
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(":id")
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Get user by ID (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User retrieved successfully",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserById(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    try {
      // Add user information to headers for the microservice
      const userHeaders = {
        "x-user-id": req.user?.userId || req.user?.sub || "",
        "x-user-email": req.user?.email || "",
        "x-user-role": req.user?.role || "",
      };

      const response = await this.proxyService.forwardUserRequest(
        id,
        "GET",
        null,
        {
          ...(req.headers as unknown as Record<string, string>),
          ...userHeaders,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || "Failed to retrieve user",
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(":id")
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Update user (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User updated successfully",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async updateUser(
    @Param("id") id: string,
    @Body() updateData: UpdateUserDto,
    @Req() req: AuthenticatedRequest
  ) {
    try {
      // Add user information to headers for the microservice
      const userHeaders = {
        "x-user-id": req.user?.userId || req.user?.sub || "",
        "x-user-email": req.user?.email || "",
        "x-user-role": req.user?.role || "",
      };

      const response = await this.proxyService.forwardUserRequest(
        id,
        "PATCH",
        updateData,
        {
          ...(req.headers as unknown as Record<string, string>),
          ...userHeaders,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || "Failed to update user",
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(":id")
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Soft delete user (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async deleteUser(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    try {
      console.log("🚨 API Gateway - Deleting user:", { id, user: req.user });
      // Add user information to headers for the microservice
      const userHeaders = {
        "x-user-id": req.user?.userId || req.user?.sub || "",
        "x-user-email": req.user?.email || "",
        "x-user-role": req.user?.role || "",
      };

      console.log(
        "📤 API Gateway - Sending headers to user service:",
        userHeaders
      );

      const response = await this.proxyService.forwardUserRequest(
        id,
        "DELETE",
        null,
        {
          ...(req.headers as unknown as Record<string, string>),
          ...userHeaders,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || "Failed to delete user",
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(":id/restore")
  @Roles("OWNER", "HIGHER_STAFF")
  @ApiOperation({ summary: "Restore soft-deleted user (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User restored successfully",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Only OWNER and HIGHER_STAFF can restore users",
  })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 400, description: "User is not deleted" })
  async restoreUser(@Param("id") id: string, @Req() req: AuthenticatedRequest) {
    try {
      // Add user information to headers for the microservice
      const userHeaders = {
        "x-user-id": req.user?.userId || req.user?.sub || "",
        "x-user-email": req.user?.email || "",
        "x-user-role": req.user?.role || "",
      };

      const response = await this.proxyService.forwardUserRequest(
        `${id}/restore`,
        "PATCH",
        null,
        {
          ...(req.headers as unknown as Record<string, string>),
          ...userHeaders,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || "Failed to restore user",
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  } // Note: Public user search has been moved to PublicController
  // This endpoint remains for authenticated admin-level user management
  @Get("search")
  @Roles("OWNER", "HIGHER_STAFF", "STAFF")
  @ApiOperation({ summary: "Search users for admin management" })
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
  @ApiResponse({
    status: 400,
    description: "Bad request - search query is required",
  })
  async searchUsers(
    @Query("q") query: string,
    @Req() req: any,
    @Query("limit") limit?: string
  ) {
    const response = await this.proxyService.forwardRequest(
      "USER",
      `users/search?q=${encodeURIComponent(query)}${limit ? `&limit=${limit}` : ""}`,
      "GET",
      null,
      {
        "x-user-id": req.user?.sub || req.user?.userId,
      }
    );
    return response.data;
  }

  @Post("heartbeat")
  @ApiOperation({ summary: "Update user activity timestamp" })
  @ApiResponse({
    status: 200,
    description: "Heartbeat updated successfully",
  })
  async heartbeat(@Req() req: any) {
    const response = await this.proxyService.forwardRequest(
      "USER",
      "users/heartbeat",
      "POST",
      null,
      {
        "x-user-id": req.user?.sub || req.user?.userId,
      }
    );
    return response.data;
  }

  @Post("offline/:id")
  @ApiOperation({ summary: "Mark user as offline" })
  @ApiResponse({
    status: 200,
    description: "User marked as offline successfully",
  })
  async markOffline(@Param("id") userId: string, @Req() req: any) {
    const response = await this.proxyService.forwardRequest(
      "USER",
      `users/offline/${userId}`,
      "POST",
      null,
      {
        "x-user-id": req.user?.sub || req.user?.userId,
      }
    );
    return response.data;
  }

  @Post("cleanup-stale")
  @ApiOperation({ summary: "Cleanup stale online users" })
  @ApiResponse({
    status: 200,
    description: "Stale users cleaned up successfully",
  })
  async cleanupStaleUsers(@Req() req: any) {
    const response = await this.proxyService.forwardRequest(
      "USER",
      "users/cleanup-stale",
      "POST",
      null,
      {
        "x-user-id": req.user?.sub || req.user?.userId,
      }
    );
    return response.data;
  }
  // Blocking functionality
  @Post("blocks")
  @ApiOperation({ summary: "Block a user" })
  @ApiResponse({
    status: 201,
    description: "User blocked successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid data or cannot block yourself",
  })
  @ApiResponse({
    status: 404,
    description: "User to block not found",
  })
  @ApiResponse({
    status: 409,
    description: "User is already blocked",
  })
  async blockUser(@Body() createBlockDto: any, @Req() req: any) {
    const response = await this.proxyService.forwardUserRequest(
      "blocks",
      "POST",
      createBlockDto,
      {
        "x-user-id": req.user?.sub || req.user?.userId,
      }
    );
    return response.data;
  }

  @Delete("blocks/:blockedId")
  @ApiOperation({ summary: "Unblock a user" })
  @ApiParam({
    name: "blockedId",
    description: "ID of the user to unblock",
  })
  @ApiResponse({
    status: 200,
    description: "User unblocked successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Block not found",
  })
  async unblockUser(@Param("blockedId") blockedId: string, @Req() req: any) {
    const response = await this.proxyService.forwardUserRequest(
      `blocks/${blockedId}`,
      "DELETE",
      null,
      {
        "x-user-id": req.user?.sub || req.user?.userId,
      }
    );
    return response.data;
  }
  @Get("blocks")
  @ApiOperation({ summary: "Get list of blocked users" })
  @ApiResponse({
    status: 200,
    description: "Blocked users retrieved successfully",
  })
  async getBlockedUsers(@Req() req: any) {
    const response = await this.proxyService.forwardRequest(
      "USER",
      "users/blocks",
      "GET",
      null,
      {
        "x-user-id": req.user?.sub || req.user?.userId,
      }
    );
    return response.data;
  }

  @Get("blocks/status/:targetUserId")
  @ApiOperation({
    summary: "Get block status between current user and target user",
  })
  @ApiParam({
    name: "targetUserId",
    description: "ID of the target user to check block status with",
  })
  @ApiResponse({
    status: 200,
    description: "Block status retrieved successfully",
  })
  async getBlockStatus(
    @Param("targetUserId") targetUserId: string,
    @Req() req: any
  ) {
    const response = await this.proxyService.forwardRequest(
      "USER",
      `users/blocks/status/${targetUserId}`,
      "GET",
      null,
      {
        "x-user-id": req.user?.sub || req.user?.userId,
      }
    );
    return response.data;
  }
}
