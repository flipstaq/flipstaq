import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@flipstaq/db";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      "roles",
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ForbiddenException("Access token required");
    }

    try {
      const payload = this.jwtService.verify(token);
      const userRole = payload.role as UserRole;

      const hasRole = requiredRoles.some((role) => userRole === role);
      if (!hasRole) {
        throw new ForbiddenException("Insufficient permissions");
      }

      request.user = payload;
      return true;
    } catch (error) {
      throw new ForbiddenException("Invalid or expired token");
    }
  }
}
