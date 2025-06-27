import {
  Injectable,
  NestMiddleware,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

interface ReportRateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class ReportRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ReportRateLimitMiddleware.name);
  private readonly store: ReportRateLimitStore = {};
  private readonly limit = 5; // 5 reports per hour
  private readonly windowMs = 60 * 60 * 1000; // 1 hour

  use(req: Request, res: Response, next: NextFunction) {
    // Only apply to POST requests to report endpoints
    if (req.method !== "POST" || !req.path.includes("/report")) {
      return next();
    }

    const userId = req.headers["x-user-id"] as string;
    const ip = req.ip || req.connection?.remoteAddress || "unknown";

    // Use user ID if available, otherwise fall back to IP
    const identifier = userId || ip;
    const key = `report_rate_limit:${identifier}`;
    const now = Date.now();

    // Clean up expired entries
    if (this.store[key] && this.store[key].resetTime < now) {
      delete this.store[key];
    }

    // Initialize or get current count
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.windowMs,
      };
    }

    this.store[key].count++;

    // Set rate limit headers
    res.setHeader("X-Report-RateLimit-Limit", this.limit);
    res.setHeader(
      "X-Report-RateLimit-Remaining",
      Math.max(0, this.limit - this.store[key].count)
    );
    res.setHeader(
      "X-Report-RateLimit-Reset",
      Math.ceil(this.store[key].resetTime / 1000)
    );

    // Check if limit exceeded
    if (this.store[key].count > this.limit) {
      this.logger.warn(
        `Report rate limit exceeded for ${userId ? "user" : "IP"}: ${identifier}. ${this.store[key].count}/${this.limit} reports submitted`
      );

      throw new HttpException(
        {
          statusCode: 429,
          message:
            "Too many reports submitted. Please wait before submitting another report.",
          error: "Too Many Requests",
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    this.logger.log(
      `Report submitted by ${userId ? "user" : "IP"}: ${identifier}. Count: ${this.store[key].count}/${this.limit}`
    );
    next();
  }
}
