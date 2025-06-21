import type { NextApiRequest, NextApiResponse } from 'next';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { username, slug } = req.query;

  console.log('🔍 Product API Route - Request headers:', {
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    userAgent: req.headers['user-agent'],
  });

  if (!username || !slug) {
    return res.status(400).json({ error: 'Username and slug are required' });
  }
  try {
    // Forward the authorization header if it exists
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers.Authorization = authHeader;
    }

    console.log('📤 Product API Route - Forwarding to API Gateway:', {
      url: `${API_GATEWAY_URL}/api/v1/products/@${username}/${slug}`,
      hasAuth: !!headers.Authorization,
    });

    const response = await fetch(
      `${API_GATEWAY_URL}/api/v1/products/@${username}/${slug}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Product not found' });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}
