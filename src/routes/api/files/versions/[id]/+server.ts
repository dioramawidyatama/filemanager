import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getVersion, restoreVersion } from '$lib/server/database';
import { auditLog } from '$lib/server/pathUtils';

// GET /api/files/versions/[id] - Get specific version content
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  const versionId = parseInt(params.id || '');
  if (isNaN(versionId)) {
    throw error(400, 'Invalid version ID');
  }
  
  try {
    const version = getVersion(versionId);
    
    if (!version) {
      throw error(404, 'Version not found');
    }
    
    return json({
      id: version.id,
      file_path: version.file_path,
      content: version.content,
      size: version.size,
      checksum: version.checksum,
      created_by: version.created_by,
      created_at: version.created_at,
      commit_message: version.commit_message,
      parent_version_id: version.parent_version_id,
    });
  } catch (err) {
    const errorStatus = (err as { status?: number }).status;
    if (errorStatus) throw err;
    
    console.error('Failed to get version:', err);
    throw error(500, 'Failed to get version');
  }
};

// POST /api/files/versions/[id]/restore - Restore to this version
export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  const versionId = parseInt(params.id || '');
  if (isNaN(versionId)) {
    throw error(400, 'Invalid version ID');
  }
  
  try {
    const body = await request.json().catch(() => ({}));
    const { createVersion: shouldCreateVersion = true } = body;
    
    if (shouldCreateVersion) {
      // Create a new version with the restored content
      const newVersion = restoreVersion(versionId, locals.user.username);
      
      if (!newVersion) {
        throw error(404, 'Version not found');
      }
      
      auditLog('VERSION_RESTORE', locals.user.username, newVersion.file_path, true, `${versionId}_to_${newVersion.id}`);
      
      return json({
        success: true,
        message: `Restored to version ${versionId}`,
        newVersionId: newVersion.id,
        filePath: newVersion.file_path,
      });
    } else {
      // Just get the version content for manual restore
      const version = getVersion(versionId);
      
      if (!version) {
        throw error(404, 'Version not found');
      }
      
      return json({
        success: true,
        content: version.content,
        filePath: version.file_path,
      });
    }
  } catch (err) {
    const errorStatus = (err as { status?: number }).status;
    if (errorStatus) throw err;
    
    console.error('Failed to restore version:', err);
    throw error(500, 'Failed to restore version');
  }
};

// DELETE /api/files/versions/[id] - Delete a version
export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  const versionId = parseInt(params.id || '');
  if (isNaN(versionId)) {
    throw error(400, 'Invalid version ID');
  }
  
  try {
    const { getDatabase } = await import('$lib/server/database');
    const db = getDatabase();
    
    const version = getVersion(versionId);
    if (!version) {
      throw error(404, 'Version not found');
    }
    
    db.prepare('DELETE FROM versions WHERE id = ?').run(versionId);
    
    auditLog('VERSION_DELETE', locals.user.username, version.file_path, true, `version_${versionId}`);
    
    return json({
      success: true,
      message: 'Version deleted',
    });
  } catch (err) {
    const errorStatus = (err as { status?: number }).status;
    if (errorStatus) throw err;
    
    console.error('Failed to delete version:', err);
    throw error(500, 'Failed to delete version');
  }
};
