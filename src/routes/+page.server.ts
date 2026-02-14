import type { PageServerLoad } from './$types';
import { listDirectory } from '$lib/server/fileService';

export const load: PageServerLoad = async ({ locals }) => {
  const result = await listDirectory('/', locals.fileRoot);
  
  return {
    files: result?.files || [],
    currentPath: '/',
  };
};
