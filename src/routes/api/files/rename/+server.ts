import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rename } from 'fs/promises';
import path from 'path';
import { sanitizePath, auditLog } from '$lib/server/pathUtils';

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const { path: filePath, newName } = await request.json();
    
    if (!filePath || typeof filePath !== 'string') {
      throw error(400, 'Path is required');
    }
    
    if (!newName || typeof newName !== 'string') {
      throw error(400, 'New name is required');
    }
    
    // Validate new name (no path traversal, no slashes)
    if (newName.includes('/') || newName.includes('\\')) {
      throw error(400, 'New name cannot contain path separators');
    }
    
    if (newName.startsWith('.')) {
      throw error(400, 'New name cannot start with a dot');
    }
    
    // Sanitize source path
    const fullSourcePath = sanitizePath(filePath, locals.fileRoot, locals.user);
    if (!fullSourcePath) {
      auditLog('RENAME', locals.user?.username || null, filePath, false, 'path_sanitization_failed');
      throw error(403, 'Access denied or invalid source path');
    }
    
    // Construct destination path
    const parentDir = path.dirname(fullSourcePath);
    const fullDestPath = path.join(parentDir, newName);
    
    // Verify destination is still within root
    const normalizedRoot = path.resolve(locals.fileRoot);
    if (!fullDestPath.startsWith(normalizedRoot)) {
      auditLog('RENAME', locals.user?.username || null, filePath, false, 'destination_outside_root');
      throw error(403, 'Destination path is outside allowed directory');
    }
    
    // Perform rename
    await rename(fullSourcePath, fullDestPath);
    
    // Calculate new relative path
    const newRelativePath = fullDestPath.slice(normalizedRoot.length) || '/';
    
    auditLog('RENAME', locals.user?.username || null, filePath, true, `to_${newName}`);
    
    return json({
      success: true,
      message: 'Renamed successfully',
      oldPath: filePath,
      newPath: newRelativePath,
      newName,
    });
    
  } catch (err) {
    const errorStatus = (err as { status?: number }).status;
    if (errorStatus) throw err;
    
    const errorMessage = (err as Error).message;
    console.error('Failed to rename:', err);
    auditLog('RENAME', locals.user?.username || null, 'unknown', false, `error_${errorMessage}`);
    throw error(500, 'Failed to rename file or directory');
  }
};
