import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import {
  CreateFavoriteDto,
  FavoriteResponseDto,
  FavoriteProductResponseDto,
} from '../dto/favorite.dto';

@ApiTags('favorites')
@Controller('internal/favorites')
@ApiBearerAuth()
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @ApiOperation({ summary: 'Add product to favorites' })
  @ApiResponse({
    status: 201,
    description: 'Product added to favorites successfully',
    type: FavoriteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot favorite own product or inactive product' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product already in favorites' })
  async addToFavorites(
    @Headers('x-user-id') userId: string,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ): Promise<FavoriteResponseDto> {
    if (!userId) {
      throw new UnauthorizedException('User ID not provided');
    }

    return this.favoriteService.addToFavorites(userId, createFavoriteDto);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove product from favorites' })
  @ApiParam({
    name: 'productId',
    description: 'The ID of the product to remove from favorites',
    example: 'cmbzeo9070001w7h8txxutdh0',
  })
  @ApiResponse({ status: 200, description: 'Product removed from favorites successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not in favorites' })
  async removeFromFavorites(
    @Headers('x-user-id') userId: string,
    @Param('productId') productId: string,
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new UnauthorizedException('User ID not provided');
    }

    await this.favoriteService.removeFromFavorites(userId, productId);
    return { message: 'Product removed from favorites successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({
    status: 200,
    description: 'User favorites retrieved successfully',
    type: [FavoriteProductResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserFavorites(
    @Headers('x-user-id') userId: string,
  ): Promise<FavoriteProductResponseDto[]> {
    if (!userId) {
      throw new UnauthorizedException('User ID not provided');
    }

    return this.favoriteService.getUserFavorites(userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get user favorites count' })
  @ApiResponse({ status: 200, description: 'Favorites count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFavoriteCount(@Headers('x-user-id') userId: string): Promise<{ count: number }> {
    if (!userId) {
      throw new UnauthorizedException('User ID not provided');
    }

    const count = await this.favoriteService.getFavoriteCount(userId);
    return { count };
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Check if product is favorited' })
  @ApiParam({
    name: 'productId',
    description: 'The ID of the product to check',
    example: 'cmbzeo9070001w7h8txxutdh0',
  })
  @ApiResponse({ status: 200, description: 'Favorite status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async isProductFavorited(
    @Headers('x-user-id') userId: string,
    @Param('productId') productId: string,
  ): Promise<{ isFavorited: boolean }> {
    if (!userId) {
      throw new UnauthorizedException('User ID not provided');
    }

    const isFavorited = await this.favoriteService.isProductFavorited(userId, productId);
    return { isFavorited };
  }
}
