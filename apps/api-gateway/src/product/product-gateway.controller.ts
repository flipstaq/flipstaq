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
  async getAllProducts() {
    const response = await this.proxyService.forwardProductRequest(
      "",
      "GET",
      null,
      {
        "x-internal-service": "true",
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
    @Param("slug") slug: string
  ) {
    const response = await this.proxyService.forwardProductRequest(
      `@${username}/${slug}`,
      "GET",
      null,
      {
        "x-internal-service": "true",
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
      "Dashboard statistics including total products, views, deleted products, and last product",
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
}
