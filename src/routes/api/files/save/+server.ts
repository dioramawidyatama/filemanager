import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile } from 'fs/promises';
import path from 'path';
import { sanitizePath, getRelativePath, auditLog } from '$lib/server/pathUtils';
import { createVersion, isAutoVersionEnabled, generateChecksum } from '$lib/server/database';

// Max content size: 10MB
const MAX_CONTENT_SIZE = 10 * 1024 * 1024;

// Blocked extensions for editing
const BLOCKED_EXTENSIONS = [
  '.env',
  '.pem',
  '.key',
  '.p12',
  '.pfx',
  '.crt',
  '.cer',
  '.der',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.7z',
];

// Min size for auto-versioning (500 bytes)
const MIN_VERSION_SIZE = 500;

export const PUT: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const { path: filePath, content, commitMessage } = await request.json();
    
    if (!filePath || typeof filePath !== 'string') {
      throw error(400, 'Path is required');
    }
    
    if (content === undefined || typeof content !== 'string') {
      throw error(400, 'Content is required');
    }
    
    // Check content size
    const contentSize = Buffer.byteLength(content, 'utf-8');
    if (contentSize > MAX_CONTENT_SIZE) {
      throw error(413, `Content too large (${(contentSize / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`);
    }
    
    // Check extension
    const ext = path.extname(filePath).toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      auditLog('SAVE', locals.user?.username || null, filePath, false, 'blocked_extension');
      throw error(403, 'File type not allowed for editing');
    }
    
    // Sanitize path
    const fullPath = sanitizePath(filePath, locals.fileRoot, locals.user);
    if (!fullPath) {
      auditLog('SAVE', locals.user?.username || null, filePath, false, 'path_sanitization_failed');
      throw error(403, 'Access denied or invalid path');
    }
    
    // Write file
    await writeFile(fullPath, content, 'utf-8');
    
    const relativePath = getRelativePath(fullPath, path.resolve(locals.fileRoot));
    
    // Auto-create version if enabled and file is large enough
    let versionId: number | undefined;
    if (contentSize >= MIN_VERSION_SIZE && isAutoVersionEnabled(filePath)) {
      try {
        const version = createVersion(
          filePath,
          content,
          locals.user.username,
          commitMessage || `Auto-save: ${new Date().toISOString()}`
        );
        versionId = version.id;
      } catch (err) {
        console.error('Auto-versioning failed:', err);
        // Don't fail the save if versioning fails
      }
    }
    
    auditLog('SAVE', locals.user?.username || null, filePath, true, `size_${contentSize}`);
    
    return json({
      success: true,
      message: 'File saved successfully',
      path: relativePath,
      size: contentSize,
      versionId,
    });
    
  } catch (err) {
    const errorStatus = (err as { status?: number }).status;
    if (errorStatus) throw err;
    
    const errorMessage = (err as Error).message;
    console.error('Failed to save file:', err);
    auditLog('SAVE', locals.user?.username || null, 'unknown', false, `error_${errorMessage}`);
    throw error(500, 'Failed to save file');
  }
};
