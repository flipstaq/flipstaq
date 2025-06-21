import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Check for internal service headers
    const isInternal = request.headers['x-internal-service'] === 'true';
    const isFromGateway = request.headers['x-api-gateway'] === 'flipstaq-gateway';

    if (!isInternal || !isFromGateway) {
      throw new UnauthorizedException('Internal service access required');
    } // Use actual user information passed from the API Gateway
    const userId = request.headers['x-user-id'];
    const userEmail = request.headers['x-user-email'];
    const userRole = request.headers['x-user-role'];
    if (userId && userId !== '' && userId !== 'anonymous') {
      // Use the actual user information from the API Gateway
      request.user = {
        id: userId,
        sub: userId, // Keep sub for compatibility
        userId: userId, // Add userId for consistency
        email: userEmail || 'unknown@flipstaq.com', // Use passed email or fallback
        role: userRole || 'USER', // Use passed role or default to USER
      };
    } else {
      // Fallback to mock admin user for internal requests without user context
      // This is normal for public endpoints that don't require authentication
      request.user = {
        id: 'internal-service',
        sub: 'internal-service',
        role: 'OWNER',
        email: 'internal@flipstaq.com',
      };
    }

    return true;
  }
}
