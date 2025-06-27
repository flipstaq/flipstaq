import {
  Injectable,
  NestMiddleware,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

interface MessageRateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class MessageRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MessageRateLimitMiddleware.name);
  private readonly store: MessageRateLimitStore = {};
  private readonly limit = 20; // 20 messages per minute
  private readonly windowMs = 60 * 1000; // 1 minute

  use(req: Request, res: Response, next: NextFunction) {
    // Only apply to POST requests to message endpoints (sending messages)
    if (req.method !== "POST" || !req.path.includes("/messages")) {
      return next();
    }

    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return next(); // Let the controller handle the missing user ID
    }

    const key = `message_rate_limit:${userId}`;
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
    res.setHeader("X-Message-RateLimit-Limit", this.limit);
    res.setHeader(
      "X-Message-RateLimit-Remaining",
      Math.max(0, this.limit - this.store[key].count)
    );
    res.setHeader(
      "X-Message-RateLimit-Reset",
      Math.ceil(this.store[key].resetTime / 1000)
    );

    // Check if limit exceeded
    if (this.store[key].count > this.limit) {
      this.logger.warn(
        `Message rate limit exceeded for user: ${userId}. ${this.store[key].count}/${this.limit} messages sent`
      );

      throw new HttpException(
        {
          statusCode: 429,
          message: "Too many messages sent. Please slow down.",
          error: "Too Many Requests",
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    this.logger.log(
      `Message sent by user: ${userId}. Count: ${this.store[key].count}/${this.limit}`
    );
    next();
  }
}
