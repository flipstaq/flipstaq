import { NextApiRequest, NextApiResponse } from 'next';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const response = await fetch(`${API_GATEWAY_URL}/products/${id}/approve`, {
      method: 'PATCH',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error approving/rejecting product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
