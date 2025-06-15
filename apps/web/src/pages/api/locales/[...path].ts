import type { NextApiRequest, NextApiResponse } from 'next';
import * as path from 'path';
import * as fs from 'fs';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: pathArray } = req.query;

  if (!Array.isArray(pathArray)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const filePath = path.join(
    process.cwd(),
    '..',
    '..',
    'packages',
    'locales',
    ...pathArray
  );

  try {
    if (fs.existsSync(filePath) && filePath.endsWith('.json')) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const jsonContent = JSON.parse(fileContent);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      return res.status(200).json(jsonContent);
    } else {
      return res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving locale file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
