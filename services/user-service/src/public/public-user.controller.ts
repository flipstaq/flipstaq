import { Controller, Get, Query, BadRequestException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { UserResponseDto } from '../dto/user-response.dto';

@ApiTags('Public User Search')
@Controller('users')
export class PublicUserController {
  constructor(private readonly userService: UserService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search users for messaging (public endpoint)' })
  @ApiQuery({
    name: 'q',
    description: 'Search query for username, email, first name, or last name',
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results to return',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - search query is required',
  })
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<UserResponseDto[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters long');
    }

    const searchLimit = limit ? parseInt(limit, 10) : 10;
    const maxLimit = Math.min(searchLimit, 50); // Cap at 50 results

    // Public search - no current user to exclude
    return this.userService.searchForMessaging(query.trim(), maxLimit);
  }

  @Get('profile/:username')
  @ApiOperation({ summary: 'Get public user profile by username' })
  @ApiParam({
    name: 'username',
    description: 'Username of the user to get profile for',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'User profile found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or profile not available',
  })
  async getPublicProfile(@Param('username') username: string) {
    return this.userService.getPublicProfile(username);
  }
}
