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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { ProxyService } from "../proxy/proxy.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@ApiTags("Products")
@Controller("products")
export class ProductGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new product" })
  @ApiResponse({ status: 201, description: "Product successfully created" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({
    status: 409,
    description: "Slug already exists for this user",
  })
  async createProduct(@Body() productData: any, @Request() req: any) {
    const userId = req.user?.userId || req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException(
        "User authentication failed - no user ID found"
      );
    }

    const response = await this.proxyService.forwardProductRequest(
      "",
      "POST",
      productData,
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
}
