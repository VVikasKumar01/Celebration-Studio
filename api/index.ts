import type { Request, Response } from 'express';
import app from '../server';

/**
 * Vercel Serverless Function entry point.
 * Routes all incoming requests through the EventOS Express application.
 */
export default function handler(req: Request, res: Response) {
  // If Vercel rewrote the URL, recover original path from Vercel routing headers
  const originalPath =
    (req.headers['x-matched-path'] as string | undefined) ||
    (req.headers['x-vercel-original-url'] as string | undefined);

  if (originalPath && originalPath.startsWith('/api')) {
    req.url = originalPath;
  } else if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  return app(req, res);
}
