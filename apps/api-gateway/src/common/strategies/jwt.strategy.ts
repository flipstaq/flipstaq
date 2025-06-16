import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { ProxyService } from "../../proxy/proxy.service";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private proxyService: ProxyService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        "JWT_SECRET",
        "your-super-secret-jwt-key-change-this-in-production"
      ),
    });
  }
  async validate(payload: JwtPayload) {
    // For development resilience, we'll trust valid JWT tokens without always calling auth service
    // Only validate with auth service for sensitive operations or if explicitly needed
    const user = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    // In development, be more resilient to auth service restarts
    if (process.env.NODE_ENV === "development") {
      return user;
    }

    // In production, still validate critical operations
    try {
      // Only validate for sensitive operations, fallback to JWT payload for others
      const response = await this.proxyService.forwardRequest(
        "AUTH",
        "auth/validate-user",
        "POST",
        { userId: payload.sub },
        {
          "Content-Type": "application/json",
        }
      );

      return user;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException(
          "Your account has been deleted. You have been logged out."
        );
      } // For other validation endpoint communication errors, fall back to payload
      // This ensures the system doesn't break if auth service is temporarily unavailable
      console.warn(
        "Auth service validation failed, falling back to JWT payload:",
        error.message
      );

      return user;
    }
  }
}
