import { SetMetadata } from '@nestjs/common';

export const AUTH_THROTTLE_KEY = 'auth_throttle';

export interface AuthThrottleOptions {
  limit: number;
  ttl: number; // in milliseconds
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Custom throttle decorator for auth endpoints with enhanced security features
 * @param options - Throttle configuration options
 */
export const AuthThrottle = (options: AuthThrottleOptions) =>
  SetMetadata(AUTH_THROTTLE_KEY, options);

/**
 * Predefined throttle configurations for different auth endpoints
 */
export const AuthThrottleConfigs = {
  REFRESH_TOKEN: {
    limit: 5,
    ttl: 60000, // 1 minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  LOGIN: {
    limit: 5,
    ttl: 300000, // 5 minutes
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
  },
  SIGNUP: {
    limit: 3,
    ttl: 300000, // 5 minutes
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
  },
} as const;
