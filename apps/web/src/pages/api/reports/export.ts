import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // Get auth token from cookies or headers
      const authHeader = req.headers.authorization;
      const token =
        authHeader?.replace('Bearer ', '') || req.cookies['auth-token'];

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Extract query parameters for export options
      const { format, ids, ...filters } = req.query;

      const queryParams = new URLSearchParams();
      if (format) queryParams.append('format', format as string);
      if (ids) queryParams.append('ids', ids as string);

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value as string);
      });

      const queryString = queryParams.toString();
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'}/reports/export${queryString ? `?${queryString}` : ''}`;

      // Forward to API Gateway
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle different content types
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          return res.status(response.status).json(data);
        }
        return res.status(200).json(data);
      } else {
        // Handle file downloads (HTML exports)
        const data = await response.text();
        if (!response.ok) {
          return res.status(response.status).json({ error: 'Export failed' });
        }

        // Set appropriate headers for file download
        const filename =
          response.headers.get('content-disposition')?.split('filename=')[1] ||
          'reports.html';
        res.setHeader('Content-Type', contentType || 'text/html');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${filename}`
        );

        return res.status(200).send(data);
      }
    } catch (error) {
      console.error('Error exporting reports:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}
