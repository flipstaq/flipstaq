import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty, MinLength, IsIn } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product title',
    example: 'MacBook Pro 16 inch',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'Product description',
    example: 'High-performance laptop for professionals',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Product category',
    example: 'Electronics',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Product price',
    example: 2499.99,
    minimum: 0,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    enum: ['USD', 'AED', 'EUR', 'GBP', 'SAR'],
    default: 'USD',
  })
  @IsString()
  @IsIn(['USD', 'AED', 'EUR', 'GBP', 'SAR'])
  currency: string = 'USD';
  @ApiProperty({
    description: 'Product location (country or Global)',
    example: 'United States',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'Custom URL slug for the product',
    example: 'macbook-pro-16-mint-condition',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  slug: string;

  @ApiProperty({
    description: 'Product image URL',
    example: '/uploads/products/macbook-pro-a1b2.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
