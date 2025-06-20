import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Check for internal service headers
    const internalHeader = request.headers["x-internal-service"];
    const apiGatewayHeader = request.headers["x-api-gateway"];

    // Allow requests from API Gateway or internal services
    if (internalHeader === "true" || apiGatewayHeader === "flipstaq-gateway") {
      return true;
    }

    // Allow requests from localhost (development)
    const host = request.headers.host;
    if (process.env.NODE_ENV === "development") {
      if (host?.includes("localhost") || host?.includes("127.0.0.1")) {
        return true;
      }
    }

    throw new UnauthorizedException(
      "Direct access to internal service is not allowed"
    );
  }
}
