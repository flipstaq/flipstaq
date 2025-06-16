import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({
    description: 'The ID of the product to favorite',
    example: 'cmbzeo9070001w7h8txxutdh0',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;
}

export class FavoriteResponseDto {
  @ApiProperty({
    description: 'The ID of the favorite',
    example: 'cmbzf1a2b0001x8i9uvxyze1k',
  })
  id: string;

  @ApiProperty({
    description: 'The user ID who favorited the product',
    example: 'cmbz4qbap0000w7o8sdcex7ih',
  })
  userId: string;

  @ApiProperty({
    description: 'The product ID that was favorited',
    example: 'cmbzeo9070001w7h8txxutdh0',
  })
  productId: string;

  @ApiProperty({
    description: 'When the product was favorited',
    example: '2025-06-17T00:15:30.000Z',
  })
  createdAt: Date;
}

export class FavoriteProductResponseDto {
  @ApiProperty({
    description: 'The ID of the favorite',
    example: 'cmbzf1a2b0001x8i9uvxyze1k',
  })
  id: string;

  @ApiProperty({
    description: 'When the product was favorited',
    example: '2025-06-17T00:15:30.000Z',
  })
  createdAt: Date;
  @ApiProperty({
    description: 'The favorited product details',
  })
  product: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    currency: string;
    location: string;
    slug: string;
    imageUrl: string | null;
    userId: string;
    username: string;
    isActive: boolean;
    isSold: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}
