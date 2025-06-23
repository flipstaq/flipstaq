import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3100';

// Rate limiting: In-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 requests per window

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(userId);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract user ID from JWT token in authorization header for rate limiting
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.substring(7); // Remove 'Bearer '
      // For rate limiting, we could decode the token to get user ID, but for simplicity
      // we'll rate limit by IP if no user ID is available
      const userIdentifier = token || req.socket.remoteAddress || 'unknown';

      if (!checkRateLimit(userIdentifier)) {
        return res.status(429).json({
          message: 'Too many password change attempts. Please try again later.',
          success: false,
        });
      }
    }

    // Forward request to API Gateway with authorization header
    const response = await axios.post(
      `${API_GATEWAY_URL}/api/v1/auth/change-password`,
      req.body,
      {
        headers: {
          Authorization: req.headers.authorization,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Password change error:', error);

    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      message: 'Internal server error',
      success: false,
    });
  }
}
