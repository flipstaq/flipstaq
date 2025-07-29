import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { filename } = req.query;

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ message: 'Filename is required' });
    }

    // Validate filename to prevent path traversal attacks
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    // Fetch the file from the User Service
    const userServiceUrl =
      process.env.USER_SERVICE_URL || 'http://localhost:3003';
    const response = await fetch(
      `${userServiceUrl}/uploads/avatars/${filename}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ message: 'Avatar not found' });
      }
      return res.status(500).json({ message: 'Failed to fetch avatar' });
    }

    // Get the content type from the User Service response
    const contentType = response.headers.get('content-type') || 'image/png';

    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Stream the file from User Service to client
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Avatar proxy error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
