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
}
