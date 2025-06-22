import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Get auth token from cookies or headers
      const authHeader = req.headers.authorization;
      const token =
        authHeader?.replace('Bearer ', '') || req.cookies['auth-token'];

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Forward to API Gateway
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'}/reports`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error submitting report:', error);
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

      // Extract query parameters for filtering and pagination
      const { page, limit, status, type, search } = req.query;

      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page as string);
      if (limit) queryParams.append('limit', limit as string);
      if (status) queryParams.append('status', status as string);
      if (type) queryParams.append('type', type as string);
      if (search) queryParams.append('search', search as string);

      const queryString = queryParams.toString();
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'}/reports${queryString ? `?${queryString}` : ''}`;

      // Forward to API Gateway (admin only)
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
      console.error('Error fetching reports:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
