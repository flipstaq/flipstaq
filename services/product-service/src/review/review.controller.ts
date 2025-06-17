import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto } from '../dto/review.dto';
import { InternalServiceGuard } from '../common/guards/internal-service.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('reviews')
@Controller('internal/reviews')
@UseGuards(InternalServiceGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a product' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot review own product' })
  @ApiResponse({ status: 409, description: 'Already reviewed this product' })
  async createReview(@Req() req: AuthenticatedRequest, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.createReview(req.user.id, createReviewDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's reviews" })
  @ApiResponse({ status: 200, description: 'User reviews retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserReviews(@Req() req: AuthenticatedRequest) {
    return this.reviewService.getUserReviews(req.user.id);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all reviews for a product' })
  @ApiResponse({ status: 200, description: 'Product reviews retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductReviews(@Param('productId') productId: string) {
    return this.reviewService.getProductReviews(productId);
  }

  @Get('product/:productId/user')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's review for a specific product" })
  @ApiResponse({ status: 200, description: 'User review for product retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserReviewForProduct(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    return this.reviewService.getUserReviewForProduct(req.user.id, productId);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: "Cannot update another user's review" })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async updateReview(
    @Req() req: AuthenticatedRequest,
    @Param('id') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewService.updateReview(req.user.id, reviewId, updateReviewDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: "Cannot delete another user's review" })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(@Req() req: AuthenticatedRequest, @Param('id') reviewId: string) {
    return this.reviewService.deleteReview(req.user.id, reviewId);
  }
}
