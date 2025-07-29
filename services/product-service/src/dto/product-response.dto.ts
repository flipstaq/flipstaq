import { ApiProperty } from '@nestjs/swagger';
import { ProductType, ProductStatus } from '@flipstaq/db';

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
    description: 'Product type',
    example: 'PHYSICAL',
    enum: ProductType,
  })
  type: ProductType;

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
    description: 'Avatar URL of the product owner',
    example: '/uploads/avatars/user-avatar.jpg',
    nullable: true,
  })
  userAvatarUrl?: string | null;

  @ApiProperty({
    description: 'First name of the product owner',
    example: 'John',
    required: false,
  })
  userFirstName?: string;

  @ApiProperty({
    description: 'Last name of the product owner',
    example: 'Doe',
    required: false,
  })
  userLastName?: string;

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
    description: 'Product approval status',
    example: 'APPROVED',
    enum: ProductStatus,
  })
  status: ProductStatus;

  @ApiProperty({
    description: 'When the product was approved',
    example: '2025-06-26T18:51:35.000Z',
    nullable: true,
  })
  approvedAt?: Date;

  @ApiProperty({
    description: 'ID of the user who approved the product',
    example: 'cmbzf1a2b0001x8i9uvxyze1k',
    nullable: true,
  })
  approvedById?: string;

  @ApiProperty({
    description: 'When the product was rejected',
    example: '2025-06-26T18:51:35.000Z',
    nullable: true,
  })
  rejectedAt?: Date;

  @ApiProperty({
    description: 'ID of the user who rejected the product',
    example: 'cmbzf1a2b0001x8i9uvxyze1k',
    nullable: true,
  })
  rejectedById?: string;

  @ApiProperty({
    description: 'Reason for approval or rejection',
    example: 'Product does not meet quality standards',
    nullable: true,
  })
  approvalReason?: string;

  @ApiProperty({
    description: 'User who approved the product',
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  approvedBy?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };

  @ApiProperty({
    description: 'User who rejected the product',
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  rejectedBy?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };

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

  @ApiProperty({
    description: 'Average rating from reviews',
    example: 4.5,
    nullable: true,
  })
  averageRating?: number;

  @ApiProperty({
    description: 'Total number of reviews',
    example: 12,
    nullable: true,
  })
  totalReviews?: number;
}
