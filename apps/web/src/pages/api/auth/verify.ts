import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

// Rate limiting for verification attempts
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 verification attempts per 10 minutes per IP

function getRateLimitKey(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? String(forwarded).split(',')[0]
    : req.socket.remoteAddress || 'unknown';
  return `verify_email_${ip}`;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  rateLimitMap.set(key, record);
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Rate limiting
  const rateLimitKey = getRateLimitKey(req);
  if (!checkRateLimit(rateLimitKey)) {
    console.warn(
      `Rate limit exceeded for verification attempts from ${rateLimitKey}`
    );
    return res.redirect('/auth/verify?verify=invalid');
  }

  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    console.warn('Email verification attempted without token');
    return res.redirect('/auth/verify?verify=invalid');
  }
  try {
    // Log verification attempt for security monitoring
    console.log(
      `Email verification attempt with token: ${token.substring(0, 8)}...`
    );

    // Call the API Gateway to verify the email
    const response = await axios.get(
      `${API_GATEWAY_URL}/api/v1/auth/verify-email?token=${token}`
    );

    if (response.data.success) {
      // Log successful verification
      console.log(
        `Email verification successful for token: ${token.substring(0, 8)}...`
      );
      // Redirect to success page - only after backend validation
      return res.redirect('/auth/verify?verify=success');
    } else {
      // Log failed verification
      console.warn(`Email verification failed: ${response.data.message}`);
      // Redirect to failure page
      return res.redirect('/auth/verify?verify=invalid');
    }
  } catch (error) {
    console.error('Email verification error:', error);
    // Log the attempt for security monitoring
    if (axios.isAxiosError(error)) {
      console.warn(
        `Verification API error: ${error.response?.status} ${error.response?.statusText}`
      );
    }
    return res.redirect('/auth/verify?verify=invalid');
  }
}
