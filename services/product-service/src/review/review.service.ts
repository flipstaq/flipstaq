import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from '../dto/review.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, createReviewDto: CreateReviewDto) {
    const { productId, rating, comment } = createReviewDto;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { user: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Prevent product owner from reviewing their own product
    if (product.userId === userId) {
      throw new ForbiddenException('Cannot review your own product');
    }

    // Check if user already reviewed this product
    const existingReview = await this.prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    // Create the review
    const review = await this.prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return review;
  }

  async getProductReviews(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average rating
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    return {
      reviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
    };
  }

  async getUserReviews(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            imageUrl: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  }

  async updateReview(userId: string, reviewId: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException("Cannot update another user's review");
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: updateReviewDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedReview;
  }

  async deleteReview(userId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException("Cannot delete another user's review");
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { message: 'Review deleted successfully' };
  }

  async getUserReviewForProduct(userId: string, productId: string) {
    const review = await this.prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return review;
  }
}
