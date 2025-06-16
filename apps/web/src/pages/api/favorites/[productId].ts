import { NextApiRequest, NextApiResponse } from 'next';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const { productId } = req.query;

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: 'Valid product ID is required' });
    }

    const { method } = req;

    if (method === 'DELETE') {
      // Remove from favorites
      const response = await fetch(
        `${API_GATEWAY_URL}/api/v1/products/favorites/${productId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to remove from favorites' }));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      return res.status(200).json(data);
    } else if (method === 'GET') {
      // Check if product is favorited
      const response = await fetch(
        `${API_GATEWAY_URL}/api/v1/products/favorites/check/${productId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to check favorite status' }));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      return res.status(200).json(data);
    } else {
      res.setHeader('Allow', ['DELETE', 'GET']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Favorites API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
