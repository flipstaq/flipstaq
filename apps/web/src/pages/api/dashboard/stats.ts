import type { NextApiRequest, NextApiResponse } from 'next';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

interface DashboardStats {
  totalProducts: number;
  totalViews: number;
  deletedProducts: number;
  totalReviews: number;
  averageRating: number;
  lastProduct: {
    name: string;
    createdAt: string;
  } | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardStats | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    console.log('Dashboard stats requested, forwarding to API Gateway');
    const response = await fetch(
      `${API_GATEWAY_URL}/api/v1/products/dashboard/stats`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: 'Unknown error' }));
      console.error('API Gateway error:', response.status, errorData);
      return res.status(response.status).json({
        error: errorData.message || `API Gateway error: ${response.status}`,
      });
    }

    const stats = await response.json();
    console.log('Dashboard stats retrieved successfully');

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
