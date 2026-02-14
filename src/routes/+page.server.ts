import type { PageServerLoad } from './$types';
import { listDirectory } from '$lib/server/fileService';

export const load: PageServerLoad = async ({ locals }) => {
  // Pass the user to listDirectory for audit logging
  const result = await listDirectory('/', locals.fileRoot, locals.user);
  
  return {
    files: result?.files || [],
    currentPath: '/',
  };
};
