import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { UpdateProductStatusDto } from '../dto/update-product-status.dto';
import { ApproveProductDto, ProductApprovalResponseDto } from '../dto/approve-product.dto';
import { MailerService } from '../mailer/mailer.service';
import { ProductStatus, UserRole } from '@flipstaq/db';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Create a new product
   */ async createProduct(
    userId: string,
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const { title, description, category, type, price, currency, location, slug, imageUrl } =
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
        type,
        price,
        currency,
        location,
        slug,
        imageUrl,
        userId,
        visible: false, // New products are not visible until approved
        status: ProductStatus.PENDING,
      },
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      type: product.type,
      price: product.price,
      currency: product.currency,
      location: product.location,
      slug: product.slug,
      imageUrl: product.imageUrl,
      userId: product.userId,
      username: product.user.username,
      userAvatarUrl: product.user.avatarUrl,
      userFirstName: product.user.firstName,
      userLastName: product.user.lastName,
      isActive: product.isActive,
      isSold: product.isSold || false,
      status: product.status,
      approvedAt: product.approvedAt,
      approvedById: product.approvedById,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  } /**
   * Get all products (for homepage listing)
   */
  async getAllProducts(currentUserId?: string): Promise<ProductResponseDto[]> {
    // Build where clause to exclude blocked users' products
    const where: any = {
      isActive: true,
      visible: true, // Only show visible products to public
      status: ProductStatus.APPROVED, // Only show approved products to public
    };

    // If user is authenticated, exclude products from users who blocked them or they blocked
    if (currentUserId) {
      // Get list of users who have blocking relationship with current user
      const blocks = await this.prisma.block.findMany({
        where: {
          OR: [
            { blockerId: currentUserId }, // Users blocked by current user
            { blockedId: currentUserId }, // Users who blocked current user
          ],
        },
        select: {
          blockerId: true,
          blockedId: true,
        },
      });

      if (blocks.length > 0) {
        // Get list of user IDs to exclude
        const blockedUserIds = blocks.map((block) =>
          block.blockerId === currentUserId ? block.blockedId : block.blockerId,
        );

        where.userId = {
          notIn: blockedUserIds,
        };
      }
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
            firstName: true,
            lastName: true,
          },
        },
        reviews: {
          where: {
            visible: true, // Only include visible reviews
          },
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products.map((product) => {
      // Calculate review statistics
      const totalReviews = product.reviews.length;
      const averageRating =
        totalReviews > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
          : 0;

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        type: product.type,
        price: product.price,
        currency: product.currency,
        location: product.location,
        slug: product.slug,
        imageUrl: product.imageUrl,
        userId: product.userId,
        username: product.user.username,
        userAvatarUrl: product.user.avatarUrl,
        userFirstName: product.user.firstName,
        userLastName: product.user.lastName,
        isActive: product.isActive,
        isSold: product.isSold || false,
        status: product.status,
        approvedAt: product.approvedAt,
        approvedById: product.approvedById,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        averageRating,
        totalReviews,
      };
    });
  }
  /**
   * Get a single product by username and slug
   */ async getProductByUsernameAndSlug(
    username: string,
    slug: string,
    currentUserId?: string,
  ): Promise<ProductResponseDto> {
    // Build the OR conditions dynamically based on currentUserId
    const orConditions: Array<{ status?: ProductStatus; userId?: string }> = [
      { status: ProductStatus.APPROVED },
    ];

    // Only add the userId condition if currentUserId is provided
    if (currentUserId) {
      orConditions.push({ userId: currentUserId });
    }

    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
        user: {
          username,
        },
        // Only show approved products to public, or allow owner to see their own
        OR: orConditions,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if current user is blocked by the product owner or has blocked the product owner
    if (currentUserId && currentUserId !== product.userId) {
      const blockExists = await this.prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: currentUserId, blockedId: product.userId },
            { blockerId: product.userId, blockedId: currentUserId },
          ],
        },
      });

      if (blockExists) {
        throw new NotFoundException('Product not found');
      }
    }
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      type: product.type,
      price: product.price,
      currency: product.currency,
      location: product.location,
      slug: product.slug,
      imageUrl: product.imageUrl,
      userId: product.userId,
      username: product.user.username,
      userAvatarUrl: product.user.avatarUrl,
      userFirstName: product.user.firstName,
      userLastName: product.user.lastName,
      isActive: product.isActive,
      isSold: product.isSold || false,
      status: product.status,
      approvedAt: product.approvedAt,
      approvedById: product.approvedById,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Get products by user ID (for "My Products" section)
   */ async getProductsByUserId(userId: string): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        rejectedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products.map((product) => {
      // Calculate review statistics
      const totalReviews = product.reviews.length;
      const averageRating =
        totalReviews > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
          : 0;

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        type: product.type,
        price: product.price,
        currency: product.currency,
        location: product.location,
        slug: product.slug,
        imageUrl: product.imageUrl,
        userId: product.userId,
        username: product.user.username,
        userAvatarUrl: product.user.avatarUrl,
        userFirstName: product.user.firstName,
        userLastName: product.user.lastName,
        isActive: product.isActive,
        isSold: product.isSold || false,
        status: product.status,
        approvedAt: product.approvedAt,
        approvedById: product.approvedById,
        rejectedAt: product.rejectedAt,
        rejectedById: product.rejectedById,
        approvalReason: product.approvalReason,
        approvedBy: product.approvedBy,
        rejectedBy: product.rejectedBy,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        averageRating,
        totalReviews,
      };
    });
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
      type,
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
        type,
        price,
        currency,
        location,
        slug: newSlug || slug,
        imageUrl,
        // Reset to PENDING if product was previously rejected
        ...(existingProduct.status === 'REJECTED'
          ? {
              status: 'PENDING',
              approvedAt: null,
              approvedById: null,
              rejectedAt: null,
              rejectedById: null,
              approvalReason: null,
            }
          : {}),
      },
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      id: updatedProduct.id,
      title: updatedProduct.title,
      description: updatedProduct.description,
      category: updatedProduct.category,
      type: updatedProduct.type,
      price: updatedProduct.price,
      currency: updatedProduct.currency,
      location: updatedProduct.location,
      slug: updatedProduct.slug,
      imageUrl: updatedProduct.imageUrl,
      userId: updatedProduct.userId,
      username: updatedProduct.user.username,
      userAvatarUrl: updatedProduct.user.avatarUrl,
      userFirstName: updatedProduct.user.firstName,
      userLastName: updatedProduct.user.lastName,
      isActive: updatedProduct.isActive,
      isSold: updatedProduct.isSold || false,
      status: updatedProduct.status,
      approvedAt: updatedProduct.approvedAt,
      approvedById: updatedProduct.approvedById,
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

    // Get review statistics for user's products
    const reviewStats = await this.prisma.review.aggregate({
      where: {
        product: {
          userId: userId,
          isActive: true,
        },
      },
      _count: {
        id: true,
      },
      _avg: {
        rating: true,
      },
    });

    const totalReviews = reviewStats._count.id || 0;
    const averageRating = reviewStats._avg.rating || 0;

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
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      lastProduct: lastProduct
        ? {
            name: lastProduct.title,
            createdAt: lastProduct.createdAt.toISOString(),
          }
        : null,
    };
  }

  /**
   * Update product sold status
   */
  async updateProductStatus(
    slug: string,
    userId: string,
    isSold: boolean,
  ): Promise<ProductResponseDto> {
    // Find the product and verify ownership
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        slug,
        userId,
        isActive: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found or you do not have permission to update it');
    }

    // Update the product sold status
    const updatedProduct = await this.prisma.product.update({
      where: {
        id: existingProduct.id,
      },
      data: {
        isSold,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      id: updatedProduct.id,
      title: updatedProduct.title,
      description: updatedProduct.description,
      category: updatedProduct.category,
      type: updatedProduct.type,
      price: updatedProduct.price,
      currency: updatedProduct.currency,
      location: updatedProduct.location,
      slug: updatedProduct.slug,
      imageUrl: updatedProduct.imageUrl,
      userId: updatedProduct.userId,
      username: updatedProduct.user.username,
      userAvatarUrl: updatedProduct.user.avatarUrl,
      userFirstName: updatedProduct.user.firstName,
      userLastName: updatedProduct.user.lastName,
      isActive: updatedProduct.isActive,
      isSold: updatedProduct.isSold,
      status: updatedProduct.status,
      approvedAt: updatedProduct.approvedAt,
      approvedById: updatedProduct.approvedById,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt,
    };
  }

  /**
   * Admin: Get all products with visibility status (for moderation)
   */
  async getAllProductsForAdmin(): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
            firstName: true,
            lastName: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products.map((product) => {
      // Calculate review statistics
      const totalReviews = product.reviews.length;
      const averageRating =
        totalReviews > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
          : 0;

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        type: product.type,
        price: product.price,
        currency: product.currency,
        location: product.location,
        slug: product.slug,
        imageUrl: product.imageUrl,
        userId: product.userId,
        username: product.user.username,
        userAvatarUrl: product.user.avatarUrl,
        userFirstName: product.user.firstName,
        userLastName: product.user.lastName,
        isActive: product.isActive,
        isSold: product.isSold || false,
        visible: product.visible,
        status: product.status,
        approvedAt: product.approvedAt,
        approvedById: product.approvedById,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        averageRating,
        totalReviews,
      };
    });
  }

  /**
   * Admin: Toggle product visibility (only for approved products)
   */
  async toggleProductVisibility(productId: string): Promise<{ visible: boolean }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { visible: true, status: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Only allow visibility toggle for approved products
    if (product.status !== ProductStatus.APPROVED) {
      throw new BadRequestException('Only approved products can have their visibility toggled');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: { visible: !product.visible },
      select: { visible: true },
    });

    return { visible: updatedProduct.visible };
  }

  /**
   * Admin: Delete product permanently
   */
  async deleteProductPermanently(productId: string, reason?: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Send deletion email if reason is provided
    if (reason && reason.trim()) {
      try {
        const sellerName = `${product.user.firstName} ${product.user.lastName}`.trim();
        await this.mailerService.sendProductDeletionEmail(
          product.title,
          product.user.email,
          sellerName,
          reason,
        );
        this.logger.log(`Deletion email sent for product: ${product.title}`);
      } catch (error) {
        this.logger.error('Failed to send deletion email:', error);
        // Continue with deletion even if email fails
      }
    }

    await this.prisma.product.delete({
      where: { id: productId },
    });
  }

  /**
   * Admin: Restore a deleted product (soft-deleted products only)
   */
  async restoreProduct(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true, title: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.isActive) {
      throw new BadRequestException('Product is already active');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { isActive: true },
    });

    this.logger.log(`Product restored: ${product.title}`);
  }

  /**
   * Approve or reject a product (Staff, Higher Staff, or Owner only)
   */
  async approveProduct(
    productId: string,
    approverId: string,
    approverRole: UserRole,
    approveProductDto: ApproveProductDto,
  ): Promise<ProductApprovalResponseDto> {
    // Check if approver has permission (Staff, Higher Staff, or Owner)
    if (!['STAFF', 'HIGHER_STAFF', 'OWNER'].includes(approverRole)) {
      throw new ForbiddenException('You do not have permission to approve products');
    }

    // Find the product with seller information
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update product status and visibility
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        status: approveProductDto.status,
        approvedAt: new Date(),
        approvedById: approverId,
        // Set visibility based on approval status
        visible: approveProductDto.status === ProductStatus.APPROVED ? true : false,
      },
    });

    // Send email notification
    let emailSent = false;
    const sellerName = `${product.user.firstName} ${product.user.lastName}`;
    const wasRejected = product.status === ProductStatus.REJECTED;

    if (approveProductDto.status === ProductStatus.APPROVED) {
      if (wasRejected) {
        // Send special approval email for previously rejected products
        emailSent = await this.mailerService.sendProductReApprovalEmail(
          product.title,
          product.user.email,
          sellerName,
          approveProductDto.reason || 'Your product has been reviewed and approved.',
        );
      } else {
        // Send regular approval email for first-time approvals
        emailSent = await this.mailerService.sendProductApprovalEmail(
          product.title,
          product.user.email,
          sellerName,
        );
      }
    } else if (approveProductDto.status === ProductStatus.REJECTED) {
      emailSent = await this.mailerService.sendProductRejectionEmail(
        product.title,
        product.user.email,
        sellerName,
        approveProductDto.reason,
      );
    }

    const message =
      approveProductDto.status === ProductStatus.APPROVED
        ? 'Product approved successfully'
        : 'Product rejected successfully';

    return {
      status: updatedProduct.status,
      approvedAt: updatedProduct.approvedAt,
      approvedById: updatedProduct.approvedById,
      emailSent,
      message,
    };
  }

  /**
   * Admin: Get pending products for moderation (Staff, Higher Staff, or Owner only)
   */
  async getPendingProducts(
    userId: string,
    approverRole: UserRole,
    page: number = 1,
    limit: number = 10,
  ): Promise<ProductResponseDto[]> {
    // Check if approver has permission
    if (!['STAFF', 'HIGHER_STAFF', 'OWNER'].includes(approverRole)) {
      throw new ForbiddenException('You do not have permission to view pending products');
    }

    const skip = (page - 1) * limit;

    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PENDING,
        isActive: true,
      },
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Oldest pending products first
      },
      skip,
      take: limit,
    });

    return products.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      type: product.type,
      price: product.price,
      currency: product.currency,
      location: product.location,
      slug: product.slug,
      imageUrl: product.imageUrl,
      userId: product.userId,
      username: product.user.username,
      userAvatarUrl: product.user.avatarUrl,
      userFirstName: product.user.firstName,
      userLastName: product.user.lastName,
      isActive: product.isActive,
      isSold: product.isSold,
      status: product.status,
      approvedAt: product.approvedAt,
      approvedById: product.approvedById,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      totalReviews: product._count.reviews,
    }));
  }

  /**
   * Admin: Get approved products for moderation (Staff, Higher Staff, or Owner only)
   */
  async getApprovedProducts(userId: string, approverRole: UserRole): Promise<ProductResponseDto[]> {
    // Check if approver has permission (Staff, Higher Staff, or Owner)
    if (!['STAFF', 'HIGHER_STAFF', 'OWNER'].includes(approverRole)) {
      throw new ForbiddenException('You do not have permission to view products');
    }

    // Get approved products with user information
    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.APPROVED,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        reviews: {
          where: {
            visible: true,
          },
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products.map((product) => {
      const averageRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 0;

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
        type: product.type,
        userId: product.userId,
        username: product.user.username,
        isActive: product.isActive,
        isSold: product.isSold,
        visible: product.visible,
        status: product.status,
        approvedAt: product.approvedAt,
        approvedBy: product.approvedBy,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        averageRating,
        totalReviews: product.reviews.length,
      };
    });
  }

  /**
   * Admin: Get rejected products for moderation (Staff, Higher Staff, or Owner only)
   */
  async getRejectedProducts(userId: string, approverRole: UserRole): Promise<ProductResponseDto[]> {
    // Check if approver has permission (Staff, Higher Staff, or Owner)
    if (!['STAFF', 'HIGHER_STAFF', 'OWNER'].includes(approverRole)) {
      throw new ForbiddenException('You do not have permission to view products');
    }

    // Get rejected products with user information
    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.REJECTED,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        reviews: {
          where: {
            visible: true,
          },
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products.map((product) => {
      const averageRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 0;

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
        type: product.type,
        userId: product.userId,
        username: product.user.username,
        isActive: product.isActive,
        isSold: product.isSold,
        visible: product.visible,
        status: product.status,
        approvedAt: product.approvedAt,
        approvedBy: product.approvedBy,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        averageRating,
        totalReviews: product.reviews.length,
      };
    });
  }
}
