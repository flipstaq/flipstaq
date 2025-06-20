import { Controller, Get, Query, UseGuards, Req } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { ProxyService } from "../proxy/proxy.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@ApiTags("Public User Operations")
@Controller("public/users")
export class PublicUserController {
  constructor(private readonly proxyService: ProxyService) {}
  @Get("search")
  // @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
  @ApiBearerAuth()
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
        "x-user-id": "3", // Hard-coded for testing
      }
    );
    return response.data;
  }
}
