import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3100';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Forward request to API Gateway
    const response = await axios.post(
      `${API_GATEWAY_URL}/api/v1/auth/reset-password`,
      req.body
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Password reset error:', error);

    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      message: 'Internal server error',
      success: false,
    });
  }
}
