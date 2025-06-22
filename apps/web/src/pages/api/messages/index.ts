import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
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
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'}/messages`,
        {
          method: 'POST',
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
      console.error('Error handling message request:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'GET') {
    try {
      // Get auth token from cookies or headers
      const authHeader = req.headers.authorization;
      const token =
        authHeader?.replace('Bearer ', '') || req.cookies['auth-token'];

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const queryParams = new URLSearchParams();
      Object.entries(req.query).forEach(([key, value]) => {
        if (value) queryParams.append(key, value as string);
      });

      const queryString = queryParams.toString();
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'}/messages${queryString ? `?${queryString}` : ''}`;

      // Forward to API Gateway
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
