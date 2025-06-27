import { Injectable, Logger, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { AUTH_THROTTLE_KEY, AuthThrottleOptions } from '../decorators/auth-throttle.decorator';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(AuthThrottlerGuard.name);

  constructor(reflector: Reflector) {
    super({ throttlers: [] }, reflector);
  }

  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl, throttler } = requestProps;
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress;
    const endpoint = `${request.method} ${request.url}`;

    // Check for custom auth throttle configuration
    const authThrottleOptions = this.reflector.get<AuthThrottleOptions>(
      AUTH_THROTTLE_KEY,
      context.getHandler(),
    );

    if (authThrottleOptions) {
      requestProps.limit = authThrottleOptions.limit;
      requestProps.ttl = authThrottleOptions.ttl;
    }

    try {
      const result = await super.handleRequest(requestProps);

      if (!result) {
        this.logger.warn(
          `Rate limit exceeded for ${endpoint} from IP: ${ip}. ` +
            `Limit: ${requestProps.limit} requests per ${requestProps.ttl / 1000} seconds`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Throttling error for ${endpoint} from IP: ${ip}: ${error.message}`);
      throw error;
    }
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as the primary tracker
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
}
