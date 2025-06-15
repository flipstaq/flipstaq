import {
  Controller,
  Get,
  Patch,
  Delete,
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
  }
}
