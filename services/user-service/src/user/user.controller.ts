import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { GetUsersQueryDto } from '../dto/get-users-query.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto, PaginatedUsersResponseDto } from '../dto/user-response.dto';
import { InternalServiceGuard } from '../common/guards/internal-service.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Internal User Management')
@Controller('internal/users')
@UseGuards(InternalServiceGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('OWNER', 'HIGHER_STAFF', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: PaginatedUsersResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findAll(@Query() query: GetUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @Roles('OWNER', 'HIGHER_STAFF', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'HIGHER_STAFF', 'STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role or status' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  @Roles('OWNER', 'HIGHER_STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User successfully deleted' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async remove(@Param('id') id: string, @Request() req: any): Promise<{ message: string }> {
    return this.userService.softDelete(id, req.user);
  }

  @Patch(':id/restore')
  @Roles('OWNER', 'HIGHER_STAFF')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore soft-deleted user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User restored successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not deleted or insufficient permissions',
  })
  async restore(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.restore(id);
  }
}
