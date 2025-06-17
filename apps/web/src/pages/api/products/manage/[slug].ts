import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

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
            (name === 'image' &&
              mimetype &&
              mimetype.includes('image') &&
              ['image/jpeg', 'image/png', 'image/jpg'].includes(mimetype)) ||
              name !== 'image'
          );
        },
      });
      const [fields, files] = await form.parse(req);

      console.log(
        '📊 API Route: Updating product with fields:',
        Object.keys(fields),
        'and files:',
        Object.keys(files)
      );

      // Check if there's an image file
      const hasImage = files.image && files.image[0];
      if (hasImage) {
        // Send as multipart form data when image is present
        console.log('📊 API Route: Processing image upload');

        const imageFile = files.image![0];

        // Create a proper multipart form using form-data
        const multipartForm = new FormData();

        // Add all fields
        Object.entries(fields).forEach(([fieldName, value]) => {
          if (value && value[0]) {
            multipartForm.append(fieldName, value[0]);
          }
        });

        // Add the image file with proper stream handling
        multipartForm.append('image', fs.createReadStream(imageFile.filepath), {
          filename: imageFile.originalFilename || 'image.jpg',
          contentType: imageFile.mimetype || 'image/jpeg',
        });
        console.log(
          '📊 API Route: Sending multipart with image using form-data package'
        );

        try {
          const response = await axios.put(
            `${API_GATEWAY_URL}/api/v1/products/${slug}`,
            multipartForm,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                ...multipartForm.getHeaders(),
              },
            }
          );

          res.status(200).json(response.data);
        } catch (error: any) {
          console.error(
            `API Gateway error:`,
            error.response?.data || error.message
          );
          const errorData = error.response?.data || {
            message: error.message || 'Failed to update product',
          };
          return res.status(error.response?.status || 500).json(errorData);
        }
      } else {
        // Send as JSON when no image is present (fallback to original working approach)
        const productData: any = {};
        Object.entries(fields).forEach(([fieldName, value]) => {
          if (value && value[0]) {
            if (fieldName === 'price') {
              productData[fieldName] = parseFloat(value[0]);
            } else {
              productData[fieldName] = value[0];
            }
          }
        });
        console.log(
          '📊 API Route: Sending JSON update (no image):',
          productData
        );

        // Decode JWT to get user info
        let userId;
        try {
          const tokenPayload = JSON.parse(
            Buffer.from(token.split('.')[1], 'base64').toString()
          );
          userId = tokenPayload.sub || tokenPayload.userId;
        } catch (error) {
          console.error('Failed to decode JWT:', error);
          return res.status(401).json({ error: 'Invalid token' });
        } // Call the product service directly for JSON-only updates
        const response = await fetch(
          `http://localhost:3004/internal/products/${slug}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId,
              'x-internal-service': 'true',
              'x-api-gateway': 'flipstaq-gateway',
            },
            body: JSON.stringify(productData),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Product Service error (${response.status}):`,
            errorText
          );
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
      }
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
  } else if (req.method === 'PATCH') {
    try {
      // Parse JSON body for PATCH requests
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const updateData = JSON.parse(body);

          const response = await fetch(
            `${API_GATEWAY_URL}/api/v1/products/${slug}/status`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(updateData),
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
        } catch (parseError) {
          console.error('Error parsing request body:', parseError);
          res.status(400).json({ error: 'Invalid request body' });
        }
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      res.status(500).json({ error: 'Failed to update product status' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
