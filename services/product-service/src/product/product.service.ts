import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new product
   */
  async createProduct(
    userId: string,
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const { title, description, category, price, currency, location, slug } = createProductDto;

    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid user ID');
    }

    // Validate slug format (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      throw new BadRequestException(
        'Slug can only contain letters, numbers, hyphens, and underscores',
      );
    }

    // Check if slug already exists for this user
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        userId_slug: {
          userId,
          slug,
        },
      },
    });

    if (existingProduct) {
      throw new ConflictException('A product with this slug already exists for this user');
    }

    // Create the product
    const product = await this.prisma.product.create({
      data: {
        title,
        description,
        category,
        price,
        currency,
        location,
        slug,
        userId,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      currency: product.currency,
      location: product.location,
      slug: product.slug,
      userId: product.userId,
      username: product.user.username,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Get all products (for homepage listing)
   */
  async getAllProducts(): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      currency: product.currency,
      location: product.location,
      slug: product.slug,
      userId: product.userId,
      username: product.user.username,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));
  }

  /**
   * Get a single product by username and slug
   */
  async getProductByUsernameAndSlug(username: string, slug: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
        user: {
          username,
        },
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      currency: product.currency,
      location: product.location,
      slug: product.slug,
      userId: product.userId,
      username: product.user.username,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Get products by user ID
   */
  async getProductsByUserId(userId: string): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      currency: product.currency,
      location: product.location,
      slug: product.slug,
      userId: product.userId,
      username: product.user.username,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));
  }
}
