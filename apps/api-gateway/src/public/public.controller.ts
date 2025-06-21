import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
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
}
