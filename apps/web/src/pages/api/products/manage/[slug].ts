import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

// Disable body parsing for file uploads in PUT requests
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb',
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;

  if (typeof slug !== 'string') {
    return res.status(400).json({ error: 'Invalid product slug' });
  }

  // Validate slug format (basic validation)
  if (slug.length > 100 || slug.length < 2) {
    return res.status(400).json({ error: 'Invalid slug format' });
  }

  console.log('📊 API Route: Managing product with slug:', slug);

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  if (req.method === 'PUT') {
    try {
      // Parse multipart form data
      const form = formidable({
        multiples: false,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        filter: ({ name, mimetype }) => {
          return Boolean(
            name === 'image' &&
              mimetype &&
              mimetype.includes('image') &&
              ['image/jpeg', 'image/png', 'image/jpg'].includes(mimetype)
          );
        },
      });

      const [fields, files] = await form.parse(req);

      // Extract product data from fields
      const productData: any = {};
      Object.entries(fields).forEach(([fieldName, value]) => {
        if (fieldName !== 'image' && value) {
          if (fieldName === 'price') {
            productData[fieldName] = parseFloat(value[0]);
          } else {
            productData[fieldName] = value[0];
          }
        }
      });

      console.log('📊 API Route: Update product data:', productData);

      const response = await fetch(
        `${API_GATEWAY_URL}/api/v1/products/${slug}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Gateway error (${response.status}):`, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = {
            message: errorText || `Server returned ${response.status}`,
          };
        }
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('💥 API Route Error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const response = await fetch(
        `${API_GATEWAY_URL}/api/v1/products/${slug}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Gateway error (${response.status}):`, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = {
            message: errorText || `Server returned ${response.status}`,
          };
        }
        return res.status(response.status).json(errorData);
      } // For successful deletion responses
      if (response.status === 204 || response.status === 200) {
        // Check if response has content
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');

        if (
          contentLength === '0' ||
          !contentType?.includes('application/json')
        ) {
          // No content or not JSON, return success without body
          return res
            .status(200)
            .json({ message: 'Product deleted successfully' });
        }

        try {
          // Try to parse JSON if content exists
          const data = await response.json();
          return res.status(200).json(data);
        } catch {
          // If JSON parsing fails, return success message
          return res
            .status(200)
            .json({ message: 'Product deleted successfully' });
        }
      }

      // For other successful responses, try to parse JSON
      try {
        const data = await response.json();
        res.status(response.status).json(data);
      } catch {
        // If parsing fails, return status without body
        res.status(response.status).json({ message: 'Operation completed' });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
