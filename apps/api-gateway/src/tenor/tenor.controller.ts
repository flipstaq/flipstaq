import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { TenorService, TenorSearchResponse } from "./tenor.service";

@ApiTags("GIFs")
@Controller("gifs")
// Note: GIF browsing is public - no authentication required
// Authentication will be enforced when sending GIFs via message service
export class TenorController {
  constructor(private readonly tenorService: TenorService) {}

  @Get("search")
  @ApiOperation({ summary: "Search GIFs using Tenor API" })
  @ApiQuery({
    name: "q",
    description: "Search query for GIFs",
    example: "funny cat",
  })
  @ApiQuery({
    name: "limit",
    description: "Number of GIFs to return (max 50)",
    required: false,
    example: 25,
  })
  @ApiQuery({
    name: "pos",
    description: "Position for pagination",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "GIFs search results",
    schema: {
      type: "object",
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              url: { type: "string" },
              gifUrl: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
            },
          },
        },
        next: { type: "string" },
      },
    },
  })
  async searchGifs(
    @Query("q") query: string,
    @Query("limit") limit: string = "25",
    @Query("pos") pos?: string
  ): Promise<{
    results: Array<{
      id: string;
      title: string;
      url: string;
      gifUrl: string;
      tags: string[];
    }>;
    next: string;
  }> {
    const limitNum = Math.min(parseInt(limit) || 25, 50);
    const response = await this.tenorService.searchGifs(query, limitNum, pos);

    return {
      results: response.results.map((gif) => ({
        id: gif.id,
        title: gif.title,
        url: gif.url,
        gifUrl: this.tenorService.getOptimalGifUrl(gif),
        tags: gif.tags,
      })),
      next: response.next,
    };
  }

  @Get("trending")
  @ApiOperation({ summary: "Get trending GIFs" })
  @ApiQuery({
    name: "limit",
    description: "Number of GIFs to return (max 50)",
    required: false,
    example: 25,
  })
  @ApiQuery({
    name: "pos",
    description: "Position for pagination",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Trending GIFs",
    schema: {
      type: "object",
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              url: { type: "string" },
              gifUrl: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
            },
          },
        },
        next: { type: "string" },
      },
    },
  })
  async getTrendingGifs(
    @Query("limit") limit: string = "25",
    @Query("pos") pos?: string
  ): Promise<{
    results: Array<{
      id: string;
      title: string;
      url: string;
      gifUrl: string;
      tags: string[];
    }>;
    next: string;
  }> {
    const limitNum = Math.min(parseInt(limit) || 25, 50);
    const response = await this.tenorService.getTrendingGifs(limitNum, pos);

    return {
      results: response.results.map((gif) => ({
        id: gif.id,
        title: gif.title,
        url: gif.url,
        gifUrl: this.tenorService.getOptimalGifUrl(gif),
        tags: gif.tags,
      })),
      next: response.next,
    };
  }

  @Get("categories")
  @ApiOperation({ summary: "Get GIF categories" })
  @ApiQuery({
    name: "limit",
    description: "Number of categories to return",
    required: false,
    example: 25,
  })
  @ApiResponse({
    status: 200,
    description: "GIF categories",
  })
  async getCategories(@Query("limit") limit: string = "25") {
    const limitNum = Math.min(parseInt(limit) || 25, 50);
    const response = await this.tenorService.getCategoriesGifs(limitNum);

    return {
      results: response.results.map((gif) => ({
        id: gif.id,
        title: gif.title,
        url: gif.url,
        gifUrl: this.tenorService.getOptimalGifUrl(gif),
        tags: gif.tags,
      })),
      next: response.next,
    };
  }
}
