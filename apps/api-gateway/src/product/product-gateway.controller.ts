import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Put,
  Delete,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { ProxyService } from "../proxy/proxy.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@ApiTags("Products")
@Controller("products")
export class ProductGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: (req, file, callback) => {
          // Use src/uploads in development, dist/uploads in production
          const uploadPath =
            process.env.NODE_ENV === "production"
              ? join(process.cwd(), "dist", "uploads", "products")
              : join(process.cwd(), "src", "uploads", "products");
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const name = file.originalname.split(".")[0];
          const fileExtName = extname(file.originalname);
          const randomName = Array(4)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          callback(null, `${name}-${randomName}${fileExtName}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return callback(
            new BadRequestException("Only image files are allowed!"),
            false
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    })
  )
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new product with optional image" })
  @ApiResponse({ status: 201, description: "Product successfully created" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({
    status: 409,
    description: "Slug already exists for this user",
  })
  async createProduct(
    @Body() productData: any,
    @UploadedFile() image: Express.Multer.File,
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    } // Add image URL to product data if image was uploaded
    let productWithImage = { ...productData };

    // Transform string values to proper types for validation
    if (productWithImage.price && typeof productWithImage.price === "string") {
      productWithImage.price = parseFloat(productWithImage.price);
    }

    if (image) {
      productWithImage.imageUrl = `/uploads/products/${image.filename}`;
    }

    const response = await this.proxyService.forwardProductRequest(
      "",
      "POST",
      productWithImage,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }
  @Get()
  @ApiOperation({ summary: "Get all products" })
  @ApiResponse({ status: 200, description: "List of all active products" })
  async getAllProducts(@Request() req?: any) {
    // Get user ID if authenticated (optional for public access)
    const userId = req?.user?.userId || req?.user?.sub || null;

    const response = await this.proxyService.forwardProductRequest(
      "",
      "GET",
      null,
      {
        "x-internal-service": "true",
        "x-user-id": userId || "anonymous",
        ...(req?.user?.email && { "x-user-email": req.user.email }),
        ...(req?.user?.role && { "x-user-role": req.user.role }),
      }
    );
    return response.data;
  }
  @Get("@:username/:slug")
  @ApiOperation({ summary: "Get a product by username and slug" })
  @ApiParam({
    name: "username",
    description: "Username of the product owner",
    example: "johndoe",
  })
  @ApiParam({
    name: "slug",
    description: "Product slug",
    example: "macbook-pro-16-mint-condition",
  })
  @ApiResponse({ status: 200, description: "Product found" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async getProductByUsernameAndSlug(
    @Param("username") username: string,
    @Param("slug") slug: string,
    @Request() req?: any
  ) {
    // Get user ID if authenticated (optional for public access)
    const userId = req?.user?.userId || req?.user?.sub || null;

    console.log("🔍 API Gateway - Product detail request:", {
      username,
      slug,
      userId: userId || "Anonymous",
      hasUser: !!req?.user,
      userObj: req?.user,
    });

    const response = await this.proxyService.forwardProductRequest(
      `@${username}/${slug}`,
      "GET",
      null,
      {
        "x-internal-service": "true",
        "x-user-id": userId || "anonymous",
      }
    );
    return response.data;
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "Get products by user ID" })
  @ApiParam({
    name: "userId",
    description: "User ID",
    example: "clx1y2z3a4b5c6d7e8f9g0h2",
  })
  @ApiResponse({ status: 200, description: "List of user products" })
  async getProductsByUserId(@Param("userId") userId: string) {
    const response = await this.proxyService.forwardProductRequest(
      `user/${userId}`,
      "GET",
      null,
      {
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Get("my-products")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get products created by the current user" })
  @ApiResponse({ status: 200, description: "List of user's products" })
  async getMyProducts(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardProductRequest(
      "my-products",
      "GET",
      null,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Get("dashboard/stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get dashboard statistics for the current user" })
  @ApiResponse({
    status: 200,
    description:
      "Dashboard statistics including total products, views, deleted products, reviews, and last product",
    schema: {
      type: "object",
      properties: {
        totalProducts: { type: "number", description: "Total active products" },
        totalViews: {
          type: "number",
          description: "Total views across all products",
        },
        deletedProducts: {
          type: "number",
          description: "Number of deleted products",
        },
        totalReviews: {
          type: "number",
          description: "Total reviews across all products",
        },
        averageRating: {
          type: "number",
          description: "Average rating across all products",
        },
        lastProduct: {
          type: "object",
          nullable: true,
          properties: {
            name: {
              type: "string",
              description: "Name of last created product",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation date",
            },
          },
        },
      },
    },
  })
  async getDashboardStats(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardProductRequest(
      "dashboard/stats",
      "GET",
      null,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Put(":slug")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: (req, file, callback) => {
          // Use src/uploads in development, dist/uploads in production
          const uploadPath =
            process.env.NODE_ENV === "production"
              ? join(process.cwd(), "dist", "uploads", "products")
              : join(process.cwd(), "src", "uploads", "products");
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const name = file.originalname.split(".")[0];
          const fileExtName = extname(file.originalname);
          const randomName = Array(4)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          callback(null, `${name}-${randomName}${fileExtName}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return callback(
            new BadRequestException("Only image files are allowed!"),
            false
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    })
  )
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Update a product" })
  @ApiParam({ name: "slug", description: "Product slug" })
  @ApiResponse({ status: 200, description: "Product successfully updated" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - user can only update their own products",
  })
  async updateProduct(
    @Param("slug") slug: string,
    @Body() productData: any,
    @UploadedFile() image: Express.Multer.File,
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    // Add image URL to product data if image was uploaded
    let productWithImage = { ...productData };

    // Transform string values to proper types for validation
    if (productWithImage.price && typeof productWithImage.price === "string") {
      productWithImage.price = parseFloat(productWithImage.price);
    }

    if (image) {
      productWithImage.imageUrl = `/uploads/products/${image.filename}`;
    }

    const response = await this.proxyService.forwardProductRequest(
      slug,
      "PUT",
      productWithImage,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Delete(":slug")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a product" })
  @ApiParam({ name: "slug", description: "Product slug" })
  @ApiResponse({ status: 204, description: "Product successfully deleted" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - user can only delete their own products",
  })
  async deleteProduct(@Param("slug") slug: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardProductRequest(
      slug,
      "DELETE",
      null,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Patch(":slug/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update product sold status" })
  @ApiResponse({
    status: 200,
    description: "Product status updated successfully",
  })
  async updateProductStatus(
    @Param("slug") slug: string,
    @Body() updateStatusDto: { isSold: boolean },
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardProductRequest(
      `${slug}/status`,
      "PATCH",
      updateStatusDto,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }
  // Favorite endpoints
  @Post("favorites")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add product to favorites" })
  @ApiResponse({
    status: 201,
    description: "Product added to favorites successfully",
  })
  async addToFavorites(
    @Body() createFavoriteDto: { productId: string },
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      "favorites",
      "POST",
      createFavoriteDto,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Delete("favorites/:productId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove product from favorites" })
  @ApiParam({
    name: "productId",
    description: "The ID of the product to remove from favorites",
  })
  @ApiResponse({
    status: 200,
    description: "Product removed from favorites successfully",
  })
  async removeFromFavorites(
    @Param("productId") productId: string,
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `favorites/${productId}`,
      "DELETE",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Get("favorites")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user favorites" })
  @ApiResponse({
    status: 200,
    description: "User favorites retrieved successfully",
  })
  async getUserFavorites(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      "favorites",
      "GET",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Get("favorites/count")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user favorites count" })
  @ApiResponse({
    status: 200,
    description: "Favorites count retrieved successfully",
  })
  async getFavoriteCount(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      "favorites/count",
      "GET",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Get("favorites/check/:productId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Check if product is favorited" })
  @ApiParam({
    name: "productId",
    description: "The ID of the product to check",
  })
  @ApiResponse({
    status: 200,
    description: "Favorite status retrieved successfully",
  })
  async isProductFavorited(
    @Param("productId") productId: string,
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `favorites/check/${productId}`,
      "GET",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  // === Review Endpoints ===

  @Post("reviews")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a review for a product" })
  @ApiResponse({
    status: 201,
    description: "Review created successfully",
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Cannot review own product" })
  @ApiResponse({ status: 409, description: "Already reviewed this product" })
  async createReview(@Body() body: any, @Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      "reviews",
      "POST",
      body,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Get("reviews/me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's reviews" })
  @ApiResponse({
    status: 200,
    description: "User reviews retrieved successfully",
  })
  async getUserReviews(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      "reviews/me",
      "GET",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Get(":slug/reviews")
  @ApiOperation({ summary: "Get all reviews for a product" })
  @ApiParam({ name: "slug", description: "Product slug" })
  @ApiResponse({
    status: 200,
    description: "Product reviews retrieved successfully",
  })
  async getProductReviews(@Param("slug") slug: string) {
    // First get the product to get the productId
    const productResponse = await this.proxyService.forwardRequest(
      "PRODUCT",
      `products/slug/${slug}`,
      "GET",
      {},
      {
        "x-internal-service": "true",
      }
    );

    const productId = productResponse.data.id;

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `reviews/product/${productId}`,
      "GET",
      {},
      {
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Get("reviews/product/:productId")
  @ApiOperation({ summary: "Get all reviews for a product by productId" })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "Product reviews retrieved successfully",
  })
  async getProductReviewsById(@Param("productId") productId: string) {
    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `reviews/product/${productId}`,
      "GET",
      {},
      {
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Get(":slug/reviews/user")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's review for a specific product" })
  @ApiParam({ name: "slug", description: "Product slug" })
  @ApiResponse({
    status: 200,
    description: "User review for product retrieved successfully",
  })
  async getUserReviewForProduct(
    @Param("slug") slug: string,
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    // First get the product to get the productId
    const productResponse = await this.proxyService.forwardRequest(
      "PRODUCT",
      `products/slug/${slug}`,
      "GET",
      {},
      {
        "x-internal-service": "true",
      }
    );

    const productId = productResponse.data.id;

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `reviews/product/${productId}/user`,
      "GET",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Get("reviews/product/:productId/user")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user's review for a specific product by productId",
  })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "User review for product retrieved successfully",
  })
  async getUserProductReviewById(
    @Param("productId") productId: string,
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `reviews/product/${productId}/user`,
      "GET",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Put("reviews/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a review" })
  @ApiParam({ name: "id", description: "Review ID" })
  @ApiResponse({
    status: 200,
    description: "Review updated successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Cannot update another user's review",
  })
  @ApiResponse({ status: 404, description: "Review not found" })
  async updateReview(
    @Param("id") reviewId: string,
    @Body() body: any,
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `reviews/${reviewId}`,
      "PUT",
      body,
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Delete("reviews/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a review" })
  @ApiParam({ name: "id", description: "Review ID" })
  @ApiResponse({
    status: 200,
    description: "Review deleted successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Cannot delete another user's review",
  })
  @ApiResponse({ status: 404, description: "Review not found" })
  async deleteReview(@Param("id") reviewId: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `reviews/${reviewId}`,
      "DELETE",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  // ADMIN ENDPOINTS

  @Get("admin/all")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin: Get all products for moderation" })
  @ApiResponse({
    status: 200,
    description: "All products retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async getAllProductsForAdmin(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    const userRole = req.user?.role;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    // Check admin role
    if (!["OWNER", "HIGHER_STAFF"].includes(userRole)) {
      throw new UnauthorizedException("Admin access required");
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      "products/admin/all",
      "GET",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Patch("admin/:id/visibility")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin: Toggle product visibility" })
  @ApiParam({ name: "id", description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "Product visibility toggled successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async toggleProductVisibility(
    @Param("id") productId: string,
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;
    const userRole = req.user?.role;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    // Check admin role
    if (!["OWNER", "HIGHER_STAFF"].includes(userRole)) {
      throw new UnauthorizedException("Admin access required");
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `products/admin/${productId}/visibility`,
      "PATCH",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Delete("admin/:id/permanent")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin: Delete product permanently" })
  @ApiParam({ name: "id", description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "Product deleted permanently",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async deleteProductPermanently(
    @Param("id") productId: string,
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;
    const userRole = req.user?.role;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    // Check admin role
    if (!["OWNER", "HIGHER_STAFF"].includes(userRole)) {
      throw new UnauthorizedException("Admin access required");
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `products/admin/${productId}/permanent`,
      "DELETE",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  // ADMIN REVIEW ENDPOINTS

  @Get("reviews/admin/all")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin: Get all reviews for moderation" })
  @ApiResponse({
    status: 200,
    description: "All reviews retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async getAllReviewsForAdmin(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    const userRole = req.user?.role;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    // Check admin role
    if (!["OWNER", "HIGHER_STAFF"].includes(userRole)) {
      throw new UnauthorizedException("Admin access required");
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      "reviews/admin/all",
      "GET",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Get("reviews/admin/product/:productId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin: Get all reviews for a product" })
  @ApiParam({ name: "productId", description: "Product ID" })
  @ApiResponse({
    status: 200,
    description: "Product reviews retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  async getProductReviewsForAdmin(
    @Param("productId") productId: string,
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;
    const userRole = req.user?.role;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    // Check admin role
    if (!["OWNER", "HIGHER_STAFF"].includes(userRole)) {
      throw new UnauthorizedException("Admin access required");
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `reviews/admin/product/${productId}`,
      "GET",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Patch("reviews/admin/:id/visibility")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin: Toggle review visibility" })
  @ApiParam({ name: "id", description: "Review ID" })
  @ApiResponse({
    status: 200,
    description: "Review visibility toggled successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  @ApiResponse({ status: 404, description: "Review not found" })
  async toggleReviewVisibility(
    @Param("id") reviewId: string,
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;
    const userRole = req.user?.role;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    // Check admin role
    if (!["OWNER", "HIGHER_STAFF"].includes(userRole)) {
      throw new UnauthorizedException("Admin access required");
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `reviews/admin/${reviewId}/visibility`,
      "PATCH",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }

  @Delete("reviews/admin/:id/permanent")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin: Delete review permanently" })
  @ApiParam({ name: "id", description: "Review ID" })
  @ApiResponse({
    status: 200,
    description: "Review deleted permanently",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Admin access required" })
  @ApiResponse({ status: 404, description: "Review not found" })
  async deleteReviewPermanently(
    @Param("id") reviewId: string,
    @Request() req: any
  ) {
    const userId = req.user?.userId || req.user?.sub;
    const userRole = req.user?.role;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    // Check admin role
    if (!["OWNER", "HIGHER_STAFF"].includes(userRole)) {
      throw new UnauthorizedException("Admin access required");
    }

    const response = await this.proxyService.forwardRequest(
      "PRODUCT",
      `reviews/admin/${reviewId}/permanent`,
      "DELETE",
      {},
      {
        "x-user-id": userId,
        "x-user-email": req.user.email,
        "x-user-role": req.user.role,
        "x-internal-service": "true",
      }
    );
    return response.data;
  }
}
