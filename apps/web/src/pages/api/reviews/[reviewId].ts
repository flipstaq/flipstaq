import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;
  const { reviewId } = query;

  if (!reviewId || typeof reviewId !== 'string') {
    return res.status(400).json({ error: 'Review ID is required' });
  }

  try {
    switch (method) {
      case 'PUT': // Update a review
        const { data: updatedReview } = await axios.put(
          `${API_GATEWAY_URL}/api/v1/products/reviews/${reviewId}`,
          req.body,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(req.headers.authorization && {
                Authorization: req.headers.authorization,
              }),
            },
          }
        );
        res.status(200).json(updatedReview);
        break;

      case 'DELETE': // Delete a review
        const { data: deleteResult } = await axios.delete(
          `${API_GATEWAY_URL}/api/v1/products/reviews/${reviewId}`,
          {
            headers: {
              ...(req.headers.authorization && {
                Authorization: req.headers.authorization,
              }),
            },
          }
        );
        res.status(200).json(deleteResult);
        break;

      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Review API error:', error.response?.data || error.message);

    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Internal server error';

    res.status(status).json({
      error: message,
      ...(error.response?.data && { details: error.response.data }),
    });
  }
}
