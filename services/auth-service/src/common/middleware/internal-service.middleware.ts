import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class InternalServiceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check for internal service header (should be set by API Gateway)
    const internalHeader = req.headers['x-internal-service'];
    const apiGatewayHeader = req.headers['x-api-gateway'];

    // Allow requests from API Gateway or internal services
    if (internalHeader === 'true' || apiGatewayHeader === 'flipstaq-gateway') {
      return next();
    }

    // Allow requests from localhost (development)
    const host = req.headers.host;
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const remoteAddr = req.socket.remoteAddress;

    // In development, allow localhost access
    if (process.env.NODE_ENV === 'development') {
      if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
        return next();
      }
    }

    // Block all other requests
    throw new UnauthorizedException('Direct access to internal service is not allowed');
  }
}
