import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.redirect('/auth/verify?verify=invalid');
  }
  try {
    // Call the API Gateway to verify the email
    const response = await axios.get(
      `${API_GATEWAY_URL}/api/v1/auth/verify-email?token=${token}`
    );

    if (response.data.success) {
      // Redirect to success page
      return res.redirect('/auth/verify?verified=true');
    } else {
      // Redirect to failure page
      return res.redirect('/auth/verify?verify=invalid');
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return res.redirect('/auth/verify?verify=invalid');
  }
}
