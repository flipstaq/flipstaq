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

    const { method } = req;

    if (method === 'POST') {
      // Add to favorites
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }

      const response = await fetch(
        `${API_GATEWAY_URL}/api/v1/products/favorites`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to add to favorites' }));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      return res.status(201).json(data);
    } else if (method === 'GET') {
      // Get favorites or favorites count
      const { count } = req.query;

      const endpoint =
        count === 'true'
          ? `${API_GATEWAY_URL}/api/v1/products/favorites/count`
          : `${API_GATEWAY_URL}/api/v1/products/favorites`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to fetch favorites' }));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      return res.status(200).json(data);
    } else {
      res.setHeader('Allow', ['POST', 'GET']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Favorites API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
