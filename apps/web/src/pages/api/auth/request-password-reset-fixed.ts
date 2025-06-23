import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3100';

// Rate limiting: In-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 requests per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
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
    // Rate limiting
    const clientIP =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        message: 'Too many password reset requests. Please try again later.',
        success: false,
      });
    }

    // Forward request to API Gateway
    const response = await axios.post(
      `${API_GATEWAY_URL}/api/v1/auth/forgot-password`,
      req.body
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Password reset request error:', error);

    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      message: 'Internal server error',
      success: false,
    });
  }
}
