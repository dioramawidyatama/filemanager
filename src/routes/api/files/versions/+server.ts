import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createVersion, getVersionsForFile, getCurrentVersion, isAutoVersionEnabled, setAutoVersionEnabled } from '$lib/server/database';
import { auditLog } from '$lib/server/pathUtils';

// GET /api/files/versions?path=/docs/readme.md - List versions
export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  const filePath = url.searchParams.get('path');
  if (!filePath) {
    throw error(400, 'Path parameter is required');
  }
  
  try {
    const versions = getVersionsForFile(filePath, 50);
    const autoVersionEnabled = isAutoVersionEnabled(filePath);
    
    return json({
      filePath,
      versions: versions.map(v => ({
        id: v.id,
        size: v.size,
        checksum: v.checksum.substring(0, 16) + '...',
        created_by: v.created_by,
        created_at: v.created_at,
        commit_message: v.commit_message,
        parent_version_id: v.parent_version_id,
      })),
      autoVersionEnabled,
    });
  } catch (err) {
    console.error('Failed to get versions:', err);
    throw error(500, 'Failed to get versions');
  }
};

// POST /api/files/versions - Create a manual version
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const { path: filePath, content, commitMessage } = await request.json();
    
    if (!filePath || !content) {
      throw error(400, 'Path and content are required');
    }
    
    const version = createVersion(
      filePath,
      content,
      locals.user.username,
      commitMessage || 'Manual version'
    );
    
    auditLog('VERSION_CREATE', locals.user.username, filePath, true, `version_${version.id}`);
    
    return json({
      success: true,
      version: {
        id: version.id,
        created_at: version.created_at,
        commit_message: version.commit_message,
      },
    });
  } catch (err) {
    const errorStatus = (err as { status?: number }).status;
    if (errorStatus) throw err;
    
    console.error('Failed to create version:', err);
    throw error(500, 'Failed to create version');
  }
};

// PUT /api/files/versions/settings - Toggle auto-versioning
export const PUT: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const { path: filePath, autoVersionEnabled } = await request.json();
    
    if (!filePath) {
      throw error(400, 'Path is required');
    }
    
    setAutoVersionEnabled(filePath, autoVersionEnabled);
    
    auditLog('VERSION_SETTINGS', locals.user.username, filePath, true, `auto_${autoVersionEnabled}`);
    
    return json({
      success: true,
      autoVersionEnabled,
    });
  } catch (err) {
    console.error('Failed to update settings:', err);
    throw error(500, 'Failed to update settings');
  }
};
