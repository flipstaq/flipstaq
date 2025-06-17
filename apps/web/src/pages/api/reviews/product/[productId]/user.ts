import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;
  const { productId } = query;

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    switch (method) {
      case 'GET':
        // Get current user's review for a product
        const { data: userReview } = await axios.get(
          `${API_GATEWAY_URL}/api/v1/products/reviews/product/${productId}/user`,
          {
            headers: {
              ...(req.headers.authorization && {
                Authorization: req.headers.authorization,
              }),
            },
          }
        );
        res.status(200).json(userReview);
        break;

      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error: any) {
    console.error(
      'User review API error:',
      error.response?.data || error.message
    );

    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Internal server error';

    res.status(status).json({
      error: message,
      ...(error.response?.data && { details: error.response.data }),
    });
  }
}
