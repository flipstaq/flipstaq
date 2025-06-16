import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFavoriteDto,
  FavoriteResponseDto,
  FavoriteProductResponseDto,
} from '../dto/favorite.dto';

@Injectable()
export class FavoriteService {
  constructor(private prisma: PrismaService) {}

  async addToFavorites(
    userId: string,
    createFavoriteDto: CreateFavoriteDto,
  ): Promise<FavoriteResponseDto> {
    const { productId } = createFavoriteDto;

    // Check if product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (!product.isActive) {
      throw new ForbiddenException('Cannot favorite an inactive product');
    }

    // Check if already favorited
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Product already in favorites');
    }

    // Create favorite
    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        productId,
      },
    });

    return {
      id: favorite.id,
      userId: favorite.userId,
      productId: favorite.productId,
      createdAt: favorite.createdAt,
    };
  }

  async removeFromFavorites(userId: string, productId: string): Promise<void> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Product not in favorites');
    }

    await this.prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });
  }

  async getUserFavorites(userId: string): Promise<FavoriteProductResponseDto[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return favorites.map((favorite) => ({
      id: favorite.id,
      createdAt: favorite.createdAt,
      product: {
        id: favorite.product.id,
        title: favorite.product.title,
        description: favorite.product.description || '',
        category: favorite.product.category || '',
        price: favorite.product.price,
        currency: favorite.product.currency,
        location: favorite.product.location,
        slug: favorite.product.slug,
        imageUrl: favorite.product.imageUrl,
        userId: favorite.product.userId,
        username: favorite.product.user.username,
        isActive: favorite.product.isActive,
        isSold: favorite.product.isSold,
        createdAt: favorite.product.createdAt,
        updatedAt: favorite.product.updatedAt,
      },
    }));
  }

  async isProductFavorited(userId: string, productId: string): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return !!favorite;
  }

  async getFavoriteCount(userId: string): Promise<number> {
    return this.prisma.favorite.count({
      where: { userId },
    });
  }
}
