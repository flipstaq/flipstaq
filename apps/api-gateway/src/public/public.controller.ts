import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ConfigService } from "@nestjs/config";

@ApiTags("Public")
@Controller("public")
export class PublicController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  @Get("users/search")
  @ApiOperation({ summary: "Search users for messaging (public endpoint)" })
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
  async searchUsers(@Query("q") query: string, @Query("limit") limit?: string) {
    if (!query || query.trim().length < 2) {
      throw new HttpException(
        "Search query must be at least 2 characters long",
        HttpStatus.BAD_REQUEST
      );
    }
    try {
      const userServiceUrl = this.configService.get<string>(
        "USER_SERVICE_URL",
        "http://localhost:3003"
      );
      const url = `${userServiceUrl}/users/search`;

      console.log(`🔄 Making direct request to user service: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            q: query,
            ...(limit && { limit }),
          },
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ Error calling user service:", error.message);
      throw new HttpException(
        error.response?.data || "Failed to search users",
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("users/profile/:username")
  @ApiOperation({ summary: "Get public user profile by username" })
  @ApiParam({
    name: "username",
    description: "Username of the user to fetch profile for",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async getPublicProfile(@Param("username") username: string) {
    try {
      const userServiceUrl = this.configService.get<string>(
        "USER_SERVICE_URL",
        "http://localhost:3003"
      );
      const url = `${userServiceUrl}/users/profile/${username}`;

      console.log(`🔄 Making direct request to user service: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ Error calling user service:", error.message);
      if (error.response?.status === 404) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        error.response?.data || "Failed to fetch user profile",
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
