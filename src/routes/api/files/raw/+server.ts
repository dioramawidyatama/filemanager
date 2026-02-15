import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'fs/promises';
import path from 'path';
import { sanitizePath, auditLog } from '$lib/server/pathUtils';

// Allowed image mime types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/x-icon',
];

export const GET: RequestHandler = async ({ url, locals }) => {
  // Check authentication
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  const filePath = url.searchParams.get('path');
  
  if (!filePath) {
    throw error(400, 'Path parameter is required');
  }
  
  // Sanitize path
  const fullPath = sanitizePath(filePath, locals.fileRoot, locals.user);
  if (!fullPath) {
    auditLog('FILE_RAW', locals.user?.username || null, filePath, false, 'path_sanitization_failed');
    throw error(403, 'Access denied or invalid path');
  }
  
  try {
    // Get mime type from extension
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
    };
    
    const mimeType = mimeTypes[ext];
    
    if (!mimeType || !ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      auditLog('FILE_RAW', locals.user?.username || null, filePath, false, 'invalid_image_type');
      throw error(403, 'File type not allowed for raw viewing');
    }
    
    // Read file
    const content = await readFile(fullPath);
    
    auditLog('FILE_RAW', locals.user?.username || null, filePath, true, mimeType);
    
    return new Response(content, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
    
  } catch (err) {
    const errorStatus = (err as { status?: number }).status;
    if (errorStatus) throw err;
    
    console.error('Failed to read file:', err);
    auditLog('FILE_RAW', locals.user?.username || null, filePath, false, 'read_error');
    throw error(500, 'Failed to read file');
  }
};
