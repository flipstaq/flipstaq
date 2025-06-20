import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

export interface TenorGif {
  id: string;
  title: string;
  media_formats: {
    gif: {
      url: string;
      dims: number[];
      size: number;
    };
    mediumgif: {
      url: string;
      dims: number[];
      size: number;
    };
    tinygif: {
      url: string;
      dims: number[];
      size: number;
    };
    nanogif: {
      url: string;
      dims: number[];
      size: number;
    };
  };
  created: number;
  content_description: string;
  itemurl: string;
  url: string;
  tags: string[];
  flags: string[];
  hasaudio: boolean;
}

export interface TenorSearchResponse {
  results: TenorGif[];
  next: string;
}

@Injectable()
export class TenorService {
  private readonly apiKey: string;
  private readonly baseUrl = "https://tenor.googleapis.com/v2";

  constructor(private configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>("TENOR_API_KEY") ||
      "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCRQ"; // Free demo key
  }

  async searchGifs(
    query: string,
    limit: number = 25,
    pos?: string
  ): Promise<TenorSearchResponse> {
    try {
      const params: any = {
        q: query,
        key: this.apiKey,
        limit,
        media_filter: "gif,mediumgif",
        contentfilter: "medium",
      };

      if (pos) {
        params.pos = pos;
      }

      const response = await axios.get(`${this.baseUrl}/search`, { params });

      return {
        results: response.data.results || [],
        next: response.data.next || "",
      };
    } catch (error) {
      console.error("Tenor search error:", error);
      throw new HttpException(
        "Failed to search GIFs",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getTrendingGifs(
    limit: number = 25,
    pos?: string
  ): Promise<TenorSearchResponse> {
    try {
      const params: any = {
        key: this.apiKey,
        limit,
        media_filter: "gif,mediumgif",
        contentfilter: "medium",
      };

      if (pos) {
        params.pos = pos;
      }

      const response = await axios.get(`${this.baseUrl}/featured`, { params });

      return {
        results: response.data.results || [],
        next: response.data.next || "",
      };
    } catch (error) {
      console.error("Tenor trending error:", error);
      throw new HttpException(
        "Failed to get trending GIFs",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCategoriesGifs(limit: number = 25): Promise<TenorSearchResponse> {
    try {
      const params = {
        key: this.apiKey,
        limit,
        media_filter: "gif,mediumgif",
        contentfilter: "medium",
      };

      const response = await axios.get(`${this.baseUrl}/categories`, {
        params,
      });

      return {
        results: response.data.results || [],
        next: response.data.next || "",
      };
    } catch (error) {
      console.error("Tenor categories error:", error);
      throw new HttpException(
        "Failed to get GIF categories",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Helper method to get the best GIF format URL
  getOptimalGifUrl(
    gif: TenorGif,
    preferredFormat: "gif" | "mediumgif" | "tinygif" = "mediumgif"
  ): string {
    if (gif.media_formats[preferredFormat]) {
      return gif.media_formats[preferredFormat].url;
    }

    // Fallback to available formats
    if (gif.media_formats.mediumgif) {
      return gif.media_formats.mediumgif.url;
    }

    if (gif.media_formats.gif) {
      return gif.media_formats.gif.url;
    }

    if (gif.media_formats.tinygif) {
      return gif.media_formats.tinygif.url;
    }

    return gif.url; // Ultimate fallback
  }
}
