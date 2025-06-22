import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'PATCH') {
    try {
      const { id, action } = req.query;

      if (action !== 'delete') {
        return res.status(400).json({ error: 'Invalid action' });
      }

      // Get auth token from cookies or headers
      const authHeader = req.headers.authorization;
      const token =
        authHeader?.replace('Bearer ', '') || req.cookies['auth-token'];

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Forward to API Gateway
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'}/messages/messages/${id}/delete`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        return res.status(response.status).json(data);
      }

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting message:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['PATCH']);
  return res.status(405).json({ error: 'Method not allowed' });
}
