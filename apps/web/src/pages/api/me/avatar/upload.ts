import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    // Parse the form data
    const form = new IncomingForm({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const avatarFile = Array.isArray(files.avatar)
      ? files.avatar[0]
      : files.avatar;

    if (!avatarFile) {
      return res.status(400).json({ message: 'No avatar file provided' });
    }

    // Create form data for the API Gateway using form-data
    const formData = new FormData();
    formData.append('avatar', fs.createReadStream(avatarFile.filepath), {
      filename: avatarFile.originalFilename || 'avatar',
      contentType: avatarFile.mimetype || 'image/jpeg',
    });

    // Forward the request to the API Gateway
    const apiGatewayUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';
    const response = await fetch(`${apiGatewayUrl}/api/v1/users/avatar`, {
      method: 'POST',
      body: formData as any,
      headers: {
        Authorization: authHeader,
        ...formData.getHeaders(),
      },
    });

    // Clean up temporary file
    try {
      fs.unlinkSync(avatarFile.filepath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Gateway error:', response.status, errorText);
      return res.status(response.status).json({
        message: 'Avatar upload failed',
        error: errorText,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Avatar upload API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
