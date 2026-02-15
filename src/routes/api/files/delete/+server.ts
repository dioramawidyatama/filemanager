import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rm, rmdir } from 'fs/promises';
import { stat } from 'fs/promises';
import path from 'path';
import { sanitizePath, auditLog } from '$lib/server/pathUtils';

export const DELETE: RequestHandler = async ({ url, locals }) => {
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
    auditLog('DELETE', locals.user?.username || null, filePath, false, 'path_sanitization_failed');
    throw error(403, 'Access denied or invalid path');
  }
  
  try {
    // Check if file exists and get info
    const fileStat = await stat(fullPath);
    const isDirectory = fileStat.isDirectory();
    
    // Delete file or directory
    if (isDirectory) {
      await rmdir(fullPath, { recursive: true });
    } else {
      await rm(fullPath);
    }
    
    auditLog('DELETE', locals.user?.username || null, filePath, true, isDirectory ? 'directory' : 'file');
    
    return json({
      success: true,
      message: isDirectory ? 'Directory deleted' : 'File deleted',
      path: filePath,
    });
    
  } catch (err) {
    const errorMessage = (err as Error).message;
    
    // Check if file not found
    if ((err as { code?: string }).code === 'ENOENT') {
      auditLog('DELETE', locals.user?.username || null, filePath, false, 'not_found');
      throw error(404, 'File or directory not found');
    }
    
    console.error('Failed to delete:', err);
    auditLog('DELETE', locals.user?.username || null, filePath, false, `error_${errorMessage}`);
    throw error(500, 'Failed to delete file or directory');
  }
};
