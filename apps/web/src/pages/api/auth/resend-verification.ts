import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 requests per 15 minutes

function getRateLimitKey(req: NextApiRequest): string {
  // Use IP address as the key, fallback to a default if not available
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? String(forwarded).split(',')[0]
    : req.socket.remoteAddress || 'unknown';
  return `resend_verification_${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // No record or window expired, create new record
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    return { allowed: false, resetTime: record.resetTime };
  }

  // Increment count
  record.count++;
  rateLimitMap.set(key, record);
  return { allowed: true };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check rate limit
  const rateLimitKey = getRateLimitKey(req);
  const rateLimitResult = checkRateLimit(rateLimitKey);

  if (!rateLimitResult.allowed) {
    const resetTime = rateLimitResult.resetTime!;
    const minutesUntilReset = Math.ceil((resetTime - Date.now()) / (60 * 1000));

    return res.status(429).json({
      success: false,
      message: `Too many requests. Please try again in ${minutesUntilReset} minutes.`,
      resetTime,
    });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  try {
    // Call the API Gateway to resend verification email
    const response = await axios.post(
      `${API_GATEWAY_URL}/api/v1/auth/resend-verification`,
      { email }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Resend verification error:', error);

    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
