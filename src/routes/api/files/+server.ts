import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listDirectory } from '$lib/server/fileService';

export const GET: RequestHandler = async ({ url, locals }) => {
  // Check authentication
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  const path = url.searchParams.get('path') || '/';
  
  const result = await listDirectory(path, locals.fileRoot, locals.user);
  
  if (!result) {
    throw error(403, 'Access denied or invalid path');
  }
  
  return json(result);
};
