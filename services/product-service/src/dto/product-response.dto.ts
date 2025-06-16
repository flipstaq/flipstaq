import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  id: string;

  @ApiProperty({
    description: 'Product title',
    example: 'MacBook Pro 16 inch',
  })
  title: string;

  @ApiProperty({
    description: 'Product description',
    example: 'High-performance laptop for professionals',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Product category',
    example: 'Electronics',
    nullable: true,
  })
  category: string | null;

  @ApiProperty({
    description: 'Product price',
    example: 2499.99,
  })
  price: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Product location',
    example: 'United States',
  })
  location: string;

  @ApiProperty({
    description: 'Product URL slug',
    example: 'macbook-pro-16-mint-condition',
  })
  slug: string;

  @ApiProperty({
    description: 'Product image URL',
    example: '/uploads/products/image-123.jpg',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Product owner user ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h2',
  })
  userId: string;

  @ApiProperty({
    description: 'Username of the product owner',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'Whether the product is active',
    example: true,
  })
  isActive: boolean;
  @ApiProperty({
    description: 'Whether the product is sold',
    example: false,
  })
  isSold: boolean;

  @ApiProperty({
    description: 'Product creation date',
    example: '2025-06-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Product last update date',
    example: '2025-06-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
