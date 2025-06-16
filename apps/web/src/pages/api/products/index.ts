import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import axios from 'axios';
import fs from 'fs';
import FormDataNode from 'form-data';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

// Convert stream to buffer - REMOVED DUE TO HANGING ISSUES
// async function streamToBuffer(stream: any): Promise<Buffer> {
//   return new Promise((resolve, reject) => {
//     const chunks: Buffer[] = [];
//     stream.on('data', (chunk: Buffer) => chunks.push(chunk));
//     stream.on('end', () => resolve(Buffer.concat(chunks)));
//     stream.on('error', reject);
//   });
// }

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb', // Set limit to 10MB
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/api/v1/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  } else if (req.method === 'POST') {
    try {
      console.log('📨 API Route: Received POST request');

      // Extract JWT token from Authorization header
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        console.log('❌ API Route: No token provided');
        return res.status(401).json({ error: 'Authorization token required' });
      }

      console.log('🔑 API Route: Token validated');

      // Parse the multipart form data
      const form = formidable({
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
        keepExtensions: true,
      });

      console.log('📋 API Route: Parsing form data...');
      const [fields, files] = await form.parse(req);
      console.log('✅ API Route: Form data parsed successfully');
      console.log('📊 Fields:', Object.keys(fields));
      console.log('🖼️ Files:', Object.keys(files));

      // Create FormData for the API Gateway request
      const formData = new FormData(); // Add text fields
      const fieldList1 = [
        'title',
        'description',
        'category',
        'price',
        'currency',
        'location',
        'slug',
      ];
      fieldList1.forEach((fieldName) => {
        const value = fields[fieldName];
        if (value && value[0]) {
          // Convert price to number for proper validation
          if (fieldName === 'price') {
            formData.append(fieldName, parseFloat(value[0]).toString());
          } else {
            formData.append(fieldName, value[0]);
          }
        }
      }); // Check if there's an image file
      const hasImage = files.image && files.image[0];

      if (hasImage) {
        console.log('📤 API Route: Using multipart form data (with image)');
        // Use the form-data package properly for multipart uploads
        const formDataNode = new FormDataNode();

        // Add text fields
        const fieldNames = [
          'title',
          'description',
          'category',
          'price',
          'currency',
          'location',
          'slug',
        ];
        fieldNames.forEach((fieldName) => {
          const value = fields[fieldName];
          if (value && value[0]) {
            if (fieldName === 'price') {
              formDataNode.append(fieldName, parseFloat(value[0]).toString());
            } else {
              formDataNode.append(fieldName, value[0]);
            }
          }
        }); // Add image file
        const imageFile = files.image?.[0];
        if (!imageFile) {
          return res.status(400).json({ error: 'Image file not found' });
        }
        const fileStream = fs.createReadStream(imageFile.filepath);
        formDataNode.append('image', fileStream, {
          filename: imageFile.originalFilename || 'image.jpg',
          contentType: imageFile.mimetype || 'image/jpeg',
        });

        console.log('🖼️ API Route: Image file added to form data');
        console.log('📊 API Route: Product data with image');

        // Add timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ API Route: Request to API Gateway timed out');
          controller.abort();
        }, 30000); // Use axios instead of fetch for better multipart support
        try {
          const response = await axios.post(
            `${API_GATEWAY_URL}/api/v1/products`,
            formDataNode,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                ...formDataNode.getHeaders(),
              },
              timeout: 30000,
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);
          console.log(
            '� API Route: Response from API Gateway:',
            response.status,
            response.statusText
          );

          res.status(201).json(response.data);
        } catch (error: any) {
          clearTimeout(timeoutId);
          console.error(
            `API Gateway error:`,
            error.response?.data || error.message
          );
          if (error.response) {
            return res.status(error.response.status).json(error.response.data);
          } else {
            return res.status(500).json({ error: 'Failed to create product' });
          }
        }
      } else {
        console.log('📤 API Route: Using JSON (no image)');

        // Create simple JSON object
        const productData: any = {};
        const fieldNames = [
          'title',
          'description',
          'category',
          'price',
          'currency',
          'location',
          'slug',
        ];
        fieldNames.forEach((fieldName) => {
          const value = fields[fieldName];
          if (value && value[0]) {
            // Convert price to number
            if (fieldName === 'price') {
              productData[fieldName] = parseFloat(value[0]);
            } else {
              productData[fieldName] = value[0];
            }
          }
        });

        console.log('📊 API Route: Product data:', productData);

        // Add timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ API Route: Request to API Gateway timed out');
          controller.abort();
        }, 30000);

        const response = await fetch(`${API_GATEWAY_URL}/api/v1/products`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log(
          '📨 API Route: Response from API Gateway:',
          response.status,
          response.statusText
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
        res.status(201).json(data);
      }
    } catch (error) {
      console.error('💥 API Route Error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        res.status(408).json({ error: 'Request timed out' });
      } else {
        res.status(500).json({ error: 'Failed to create product' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
