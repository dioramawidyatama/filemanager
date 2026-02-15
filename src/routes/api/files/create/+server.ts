import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { sanitizePath, getRelativePath, auditLog } from '$lib/server/pathUtils';

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const { parentPath, name, type } = await request.json();
    
    if (!name || typeof name !== 'string') {
      throw error(400, 'Name is required');
    }
    
    // Validate name
    if (name.includes('/') || name.includes('\\')) {
      throw error(400, 'Name cannot contain path separators');
    }
    
    if (name.startsWith('.')) {
      throw error(400, 'Name cannot start with a dot');
    }
    
    // Check for blocked names
    const blockedNames = ['.ssh', '.env', 'authorized_keys', 'id_rsa', 'id_ed25519'];
    if (blockedNames.includes(name.toLowerCase())) {
      throw error(400, 'Name is not allowed');
    }
    
    // Determine parent directory
    const parent = parentPath || '/';
    
    // Sanitize parent path
    const fullParentPath = sanitizePath(parent, locals.fileRoot, locals.user);
    if (!fullParentPath) {
      auditLog('CREATE', locals.user?.username || null, parent, false, 'path_sanitization_failed');
      throw error(403, 'Access denied or invalid parent path');
    }
    
    // Construct full path for new item
    const fullNewPath = path.join(fullParentPath, name);
    
    // Verify it's still within root
    const normalizedRoot = path.resolve(locals.fileRoot);
    if (!fullNewPath.startsWith(normalizedRoot)) {
      auditLog('CREATE', locals.user?.username || null, parent, false, 'outside_root');
      throw error(403, 'Path is outside allowed directory');
    }
    
    // Create based on type
    const createType = type || 'file';
    
    if (createType === 'directory') {
      await mkdir(fullNewPath, { recursive: true });
      auditLog('CREATE', locals.user?.username || null, fullNewPath, true, 'directory');
    } else {
      // Create empty file
      await writeFile(fullNewPath, '');
      auditLog('CREATE', locals.user?.username || null, fullNewPath, true, 'file');
    }
    
    // Get relative path for response
    const relativePath = getRelativePath(fullNewPath, normalizedRoot);
    
    return json({
      success: true,
      message: createType === 'directory' ? 'Directory created' : 'File created',
      path: relativePath,
      name,
      type: createType,
    });
    
  } catch (err) {
    const errorStatus = (err as { status?: number }).status;
    if (errorStatus) throw err;
    
    // Check for duplicate file
    if ((err as { code?: string }).code === 'EEXIST') {
      throw error(409, 'File or directory already exists');
    }
    
    const errorMessage = (err as Error).message;
    console.error('Failed to create:', err);
    auditLog('CREATE', locals.user?.username || null, 'unknown', false, `error_${errorMessage}`);
    throw error(500, 'Failed to create file or directory');
  }
};
