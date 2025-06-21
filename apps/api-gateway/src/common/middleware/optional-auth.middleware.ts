import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OptionalAuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const secret = this.configService.get<string>(
          "JWT_SECRET",
          "your-super-secret-jwt-key-change-this-in-production"
        );
        const decoded = this.jwtService.verify(token, { secret });
        (req as any).user = decoded;
      } catch (error) {
        // Token is invalid, proceed as anonymous
      }
    }

    next();
  }
}
