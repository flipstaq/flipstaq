import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST': // Create a review
        const { data: reviewData } = await axios.post(
          `${API_GATEWAY_URL}/api/v1/products/reviews`,
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
        res.status(201).json(reviewData);
        break;
      case 'GET':
        // Get user's reviews
        const { data: userReviews } = await axios.get(
          `${API_GATEWAY_URL}/api/v1/products/reviews/me`,
          {
            headers: {
              ...(req.headers.authorization && {
                Authorization: req.headers.authorization,
              }),
            },
          }
        );
        res.status(200).json(userReviews);
        break;

      default:
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Reviews API error:', error.response?.data || error.message);

    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Internal server error';

    res.status(status).json({
      error: message,
      ...(error.response?.data && { details: error.response.data }),
    });
  }
}
