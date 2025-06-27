import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly store: RateLimitStore = {};
  private readonly limit = 100; // 100 requests
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    const key = `rate_limit:${ip}`;
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
    res.setHeader("X-RateLimit-Limit", this.limit);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, this.limit - this.store[key].count)
    );
    res.setHeader(
      "X-RateLimit-Reset",
      Math.ceil(this.store[key].resetTime / 1000)
    );

    // Check if limit exceeded
    if (this.store[key].count > this.limit) {
      this.logger.warn(
        `Rate limit exceeded for IP: ${ip}. ${this.store[key].count}/${this.limit} requests`
      );

      res.status(429).json({
        statusCode: 429,
        message: "Too many requests, please try again later.",
        error: "Too Many Requests",
      });
      return;
    }

    next();
  }
}
