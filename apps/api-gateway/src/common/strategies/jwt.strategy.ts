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
    // Create user object from JWT payload
    const user = {
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      username: payload.email, // fallback if not provided
    };

    // In development, trust valid JWT tokens to reduce API calls
    if (process.env.NODE_ENV === "development") {
      return user;
    }

    // In production, validate with auth service for security
    try {
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
      }

      // For communication errors, fall back to JWT payload to maintain availability
      console.warn(
        "Auth service validation failed, falling back to JWT payload:",
        error.message
      );

      return user;
    }
  }
}
