import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, action } = req.query;

  if (!id || !action) {
    return res.status(400).json({ error: 'Report ID and action are required' });
  }

  if (req.method === 'PATCH') {
    try {
      // Get auth token from cookies or headers
      const authHeader = req.headers.authorization;
      const token =
        authHeader?.replace('Bearer ', '') || req.cookies['auth-token'];

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Forward to API Gateway
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'}/reports/${id}/${action}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(req.body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error updating report:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['PATCH']);
  return res.status(405).json({ error: 'Method not allowed' });
}
