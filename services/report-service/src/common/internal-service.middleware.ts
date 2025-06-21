import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class InternalServiceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check for internal service headers
    const isInternalService = req.headers["x-internal-service"] === "true";
    const isFromGateway = req.headers["x-api-gateway"] === "flipstaq-gateway";
    const forwardedFrom = req.headers["x-forwarded-from"] === "api-gateway";

    if (!isInternalService || !isFromGateway || !forwardedFrom) {
      throw new ForbiddenException(
        "Direct access to this service is not allowed"
      );
    }

    // Extract user ID from headers (set by API Gateway after JWT verification)
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      throw new BadRequestException("User ID is required");
    }

    // Add user ID to request object for controllers to use
    (req as any).userId = userId;

    next();
  }
}
