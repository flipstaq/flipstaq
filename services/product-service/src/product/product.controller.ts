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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
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
  async getAllProducts(): Promise<ProductResponseDto[]> {
    return this.productService.getAllProducts();
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
  ): Promise<ProductResponseDto> {
    return this.productService.getProductByUsernameAndSlug(username, slug);
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
}
