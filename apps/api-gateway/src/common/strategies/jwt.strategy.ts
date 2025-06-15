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
    try {
      // Validate the user exists and is not deleted via auth service
      const response = await this.proxyService.forwardRequest(
        "AUTH",
        "auth/validate-user",
        "POST",
        { userId: payload.sub },
        {
          "Content-Type": "application/json",
        }
      );

      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException(
          "Your account has been deleted. You have been logged out."
        );
      }
      // For other validation endpoint communication errors, fall back to payload
      // This ensures the system doesn't break if auth service is temporarily unavailable
      console.warn(
        "Auth service validation failed, falling back to JWT payload:",
        error.message
      );
      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    }
  }
}
