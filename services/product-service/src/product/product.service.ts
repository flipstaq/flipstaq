import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new product
   */ async createProduct(
    userId: string,
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const { title, description, category, price, currency, location, slug, imageUrl } =
      createProductDto;

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
    } // Create the product
    const product = await this.prisma.product.create({
      data: {
        title,
        description,
        category,
        price,
        currency,
        location,
        slug,
        imageUrl,
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
      imageUrl: product.imageUrl,
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
      imageUrl: product.imageUrl,
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
      imageUrl: product.imageUrl,
      userId: product.userId,
      username: product.user.username,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Get products by user ID (for "My Products" section)
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
      imageUrl: product.imageUrl,
      userId: product.userId,
      username: product.user.username,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));
  }

  /**
   * Update a product (only by owner)
   */
  async updateProduct(
    slug: string,
    userId: string,
    updateProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    // Find the product and verify ownership
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        slug,
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
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found or you do not have permission to update it');
    }

    const {
      title,
      description,
      category,
      price,
      currency,
      location,
      slug: newSlug,
      imageUrl,
    } = updateProductDto;

    // If slug is being changed, check if new slug already exists for this user
    if (newSlug && newSlug !== slug) {
      const slugExists = await this.prisma.product.findUnique({
        where: {
          userId_slug: {
            userId,
            slug: newSlug,
          },
        },
      });

      if (slugExists) {
        throw new ConflictException('A product with this slug already exists for this user');
      }

      // Validate new slug format
      if (!/^[a-zA-Z0-9_-]+$/.test(newSlug)) {
        throw new BadRequestException(
          'Slug can only contain letters, numbers, hyphens, and underscores',
        );
      }
    }

    // Update the product
    const updatedProduct = await this.prisma.product.update({
      where: {
        id: existingProduct.id,
      },
      data: {
        title,
        description,
        category,
        price,
        currency,
        location,
        slug: newSlug || slug,
        imageUrl,
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
      id: updatedProduct.id,
      title: updatedProduct.title,
      description: updatedProduct.description,
      category: updatedProduct.category,
      price: updatedProduct.price,
      currency: updatedProduct.currency,
      location: updatedProduct.location,
      slug: updatedProduct.slug,
      imageUrl: updatedProduct.imageUrl,
      userId: updatedProduct.userId,
      username: updatedProduct.user.username,
      isActive: updatedProduct.isActive,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt,
    };
  }

  /**
   * Delete a product (only by owner)
   */
  async deleteProduct(slug: string, userId: string): Promise<void> {
    // Find the product and verify ownership
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        slug,
        userId,
        isActive: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found or you do not have permission to delete it');
    }

    // Soft delete by setting isActive to false
    await this.prisma.product.update({
      where: {
        id: existingProduct.id,
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Get dashboard statistics for a user
   */
  async getDashboardStats(userId: string) {
    // Get total active products count
    const totalProducts = await this.prisma.product.count({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    // Get deleted products count (soft deleted)
    const deletedProducts = await this.prisma.product.count({
      where: {
        userId: userId,
        isActive: false,
      },
    });

    // Get last created product
    const lastProduct = await this.prisma.product.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        title: true,
        createdAt: true,
      },
    });

    // For now, generate simulated views data
    // In a real implementation, you would track views in a separate table
    const totalViews = Math.floor(Math.random() * (totalProducts * 50)) + totalProducts * 5;

    return {
      totalProducts,
      totalViews,
      deletedProducts,
      lastProduct: lastProduct
        ? {
            name: lastProduct.title,
            createdAt: lastProduct.createdAt.toISOString(),
          }
        : null,
    };
  }
}
