import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Put,
  Delete,
  Patch,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { UpdateProductStatusDto } from '../dto/update-product-status.dto';
import { InternalServiceGuard } from '../common/guards/internal-service.guard';

@ApiTags('Internal Products')
@Controller('internal/products')
@UseGuards(InternalServiceGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 201,
    description: 'Product successfully created',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or invalid slug format',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - slug already exists for this user',
  })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @Headers('x-user-id') userId: string,
  ): Promise<ProductResponseDto> {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('User ID is required and cannot be empty');
    }

    return this.productService.createProduct(userId, createProductDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all active products' })
  @ApiResponse({
    status: 200,
    description: 'List of all active products',
    type: [ProductResponseDto],
  })
  async getAllProducts(
    @Headers('x-user-id') headerUserId?: string,
    @Req() req?: any,
  ): Promise<ProductResponseDto[]> {
    // Get user ID from the request object set by InternalServiceGuard, with fallback to header
    const userId = req?.user?.id || req?.user?.sub || headerUserId;

    // Pass userId to service for blocking filtering (can be null for anonymous users)
    return this.productService.getAllProducts(
      userId && userId !== 'anonymous' && userId !== 'internal-service' ? userId : null,
    );
  }
  @Get('@:username/:slug')
  @ApiOperation({ summary: 'Get a product by username and slug' })
  @ApiParam({
    name: 'username',
    description: 'Username of the product owner',
    example: 'johndoe',
  })
  @ApiParam({
    name: 'slug',
    description: 'Product slug',
    example: 'macbook-pro-16-mint-condition',
  })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async getProductByUsernameAndSlug(
    @Param('username') username: string,
    @Param('slug') slug: string,
    @Headers('x-user-id') headerUserId?: string,
    @Req() req?: any,
  ): Promise<ProductResponseDto> {
    // Get user ID from the request object set by InternalServiceGuard, with fallback to header
    const currentUserId = req?.user?.id || req?.user?.sub || headerUserId;

    return this.productService.getProductByUsernameAndSlug(
      username,
      slug,
      currentUserId && currentUserId !== 'anonymous' && currentUserId !== 'internal-service'
        ? currentUserId
        : null,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get products by user ID' })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h2',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user products',
    type: [ProductResponseDto],
  })
  async getProductsByUserId(@Param('userId') userId: string): Promise<ProductResponseDto[]> {
    return this.productService.getProductsByUserId(userId);
  }

  @Get('my-products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get products created by the current user' })
  @ApiResponse({
    status: 200,
    description: 'User products retrieved successfully',
    type: [ProductResponseDto],
  })
  async getMyProducts(@Headers('x-user-id') userId: string): Promise<ProductResponseDto[]> {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('User ID is required and cannot be empty');
    }

    return this.productService.getProductsByUserId(userId);
  }

  @Get('dashboard/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get dashboard statistics for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalProducts: { type: 'number', description: 'Total active products' },
        totalViews: { type: 'number', description: 'Total views across all products' },
        deletedProducts: { type: 'number', description: 'Number of deleted products' },
        lastProduct: {
          type: 'object',
          nullable: true,
          properties: {
            name: { type: 'string', description: 'Name of last created product' },
            createdAt: { type: 'string', format: 'date-time', description: 'Creation date' },
          },
        },
      },
    },
  })
  async getDashboardStats(@Headers('x-user-id') userId: string) {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('User ID is required and cannot be empty');
    }

    return this.productService.getDashboardStats(userId);
  }

  @Put(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'slug', description: 'Product slug' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product successfully updated',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user can only update their own products',
  })
  async updateProduct(
    @Param('slug') slug: string,
    @Body() updateProductDto: CreateProductDto,
    @Headers('x-user-id') userId: string,
  ): Promise<ProductResponseDto> {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('User ID is required and cannot be empty');
    }

    return this.productService.updateProduct(slug, userId, updateProductDto);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'slug', description: 'Product slug' })
  @ApiResponse({
    status: 204,
    description: 'Product successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user can only delete their own products',
  })
  async deleteProduct(
    @Param('slug') slug: string,
    @Headers('x-user-id') userId: string,
  ): Promise<void> {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('User ID is required and cannot be empty');
    }

    return this.productService.deleteProduct(slug, userId);
  }

  @Patch(':slug/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update product sold status' })
  @ApiParam({ name: 'slug', description: 'Product slug' })
  @ApiBody({ type: UpdateProductStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Product status successfully updated',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body',
  })
  async updateProductStatus(
    @Param('slug') slug: string,
    @Headers('x-user-id') userId: string,
    @Body() updateStatusDto: UpdateProductStatusDto,
  ): Promise<ProductResponseDto> {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('User ID is required and cannot be empty');
    }

    if (!slug || slug.trim() === '') {
      throw new BadRequestException('Product slug is required and cannot be empty');
    }

    return this.productService.updateProductStatus(slug, userId, updateStatusDto.isSold);
  }

  // ADMIN MODERATION ENDPOINTS

  @Get('admin/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Get all products for moderation' })
  @ApiResponse({
    status: 200,
    description: 'All products retrieved successfully',
    type: [ProductResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Admin access required',
  })
  async getAllProductsForAdmin(
    @Headers('x-user-id') userId: string,
  ): Promise<ProductResponseDto[]> {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('User ID is required and cannot be empty');
    }

    // Note: Role validation should be handled by the API Gateway
    return this.productService.getAllProductsForAdmin();
  }

  @Patch('admin/:id/visibility')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Toggle product visibility' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product visibility toggled successfully',
    schema: {
      type: 'object',
      properties: {
        visible: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Admin access required',
  })
  async toggleProductVisibility(
    @Param('id') productId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<{ visible: boolean }> {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('User ID is required and cannot be empty');
    }

    return this.productService.toggleProductVisibility(productId);
  }

  @Delete('admin/:id/permanent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Delete product permanently' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted permanently',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Admin access required',
  })
  async deleteProductPermanently(
    @Param('id') productId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<{ message: string }> {
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('User ID is required and cannot be empty');
    }
    await this.productService.deleteProductPermanently(productId);
    return { message: 'Product deleted permanently' };
  }
}
